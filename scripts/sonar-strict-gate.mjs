import fs from 'node:fs'

const EXPECTED_PROJECT_KEY = 'orbisaideveloper_orbis-maya'
const EXPECTED_ORGANIZATION = 'orbis'
const SONAR_HOST = 'https://sonarcloud.io'

const token = process.env.SONAR_TOKEN

if (!token) {
  console.error('STRICT SONAR: SONAR_TOKEN is missing')
  process.exit(1)
}

const properties = fs.readFileSync('sonar-project.properties', 'utf8')
const projectKey = properties.match(/^sonar\.projectKey=(.+)$/m)?.[1]?.trim()
const organization = properties.match(/^sonar\.organization=(.+)$/m)?.[1]?.trim()

if (
  projectKey !== EXPECTED_PROJECT_KEY ||
  organization !== EXPECTED_ORGANIZATION
) {
  console.error('STRICT SONAR: project isolation contract failed')
  process.exit(1)
}

async function getJson(apiPath) {
  const response = await fetch(`${SONAR_HOST}${apiPath}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('SONAR_API_FAILURE')
  }

  return response.json()
}

function metricNumber(measureMap, metric) {
  const raw = measureMap.get(metric)

  if (raw === undefined) {
    return null
  }

  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

const applicationPresent =
  fs.existsSync('package.json') &&
  fs.existsSync('package-lock.json')

const encodedProjectKey = encodeURIComponent(projectKey)
const metrics = [
  'coverage',
  'duplicated_lines_density',
  'security_rating',
  'reliability_rating',
  'sqale_rating',
  'security_hotspots_reviewed',
].join(',')

try {
  const [issues, measures] = await Promise.all([
    getJson(
      `/api/issues/search?componentKeys=${encodedProjectKey}&resolved=false&ps=1`,
    ),
    getJson(
      `/api/measures/component?component=${encodedProjectKey}&metricKeys=${encodeURIComponent(metrics)}`,
    ),
  ])

  const measureMap = new Map(
    (measures?.component?.measures ?? []).map((measure) => [
      measure.metric,
      measure.value,
    ]),
  )

  const unresolvedIssues = Number(
    issues?.total ?? issues?.paging?.total ?? Number.NaN,
  )

  const coverage = metricNumber(measureMap, 'coverage')
  const duplication = metricNumber(
    measureMap,
    'duplicated_lines_density',
  )
  const hotspotsReviewed = metricNumber(
    measureMap,
    'security_hotspots_reviewed',
  )
  const securityRating = metricNumber(
    measureMap,
    'security_rating',
  )
  const reliabilityRating = metricNumber(
    measureMap,
    'reliability_rating',
  )
  const maintainabilityRating = metricNumber(
    measureMap,
    'sqale_rating',
  )

  let failed = false

  if (!Number.isFinite(unresolvedIssues) || unresolvedIssues !== 0) {
    console.error('STRICT SONAR: unresolved issues must be zero')
    failed = true
  }

  if (applicationPresent && coverage === null) {
    console.error(
      'STRICT SONAR: application coverage metric is required',
    )
    failed = true
  }

  if (coverage !== null && coverage !== 100) {
    console.error('STRICT SONAR: coverage must be 100%')
    failed = true
  }

  if (applicationPresent && duplication === null) {
    console.error(
      'STRICT SONAR: application duplication metric is required',
    )
    failed = true
  }

  if (duplication !== null && duplication !== 0) {
    console.error('STRICT SONAR: duplication must be 0.0%')
    failed = true
  }

  if (hotspotsReviewed !== null && hotspotsReviewed !== 100) {
    console.error('STRICT SONAR: all Security Hotspots must be reviewed')
    failed = true
  }

  if (securityRating !== null && securityRating !== 1) {
    console.error('STRICT SONAR: security rating must be A')
    failed = true
  }

  if (reliabilityRating !== null && reliabilityRating !== 1) {
    console.error('STRICT SONAR: reliability rating must be A')
    failed = true
  }

  if (
    maintainabilityRating !== null &&
    maintainabilityRating !== 1
  ) {
    console.error('STRICT SONAR: maintainability rating must be A')
    failed = true
  }

  if (failed) {
    console.error('STRICT SONAR: FAILED')
    process.exit(1)
  }

  console.log('STRICT SONAR: PASS')
} catch {
  console.error('STRICT SONAR: API/verification error')
  process.exit(1)
}
