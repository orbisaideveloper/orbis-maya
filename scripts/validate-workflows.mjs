import fs from 'node:fs'
import path from 'node:path'

const workflowDirectory = path.join('.github', 'workflows')
const failures = []

if (!fs.existsSync(workflowDirectory)) {
  failures.push('workflow directory is missing')
} else {
  const files = fs
    .readdirSync(workflowDirectory)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort()

  if (files.length === 0) {
    failures.push('no workflow files found')
  }

  for (const name of files) {
    const file = path.join(workflowDirectory, name)
    const text = fs.readFileSync(file, 'utf8')
    const lines = text.split(/\r?\n/)

    if (text.includes('\t')) {
      failures.push(`${file}: tabs are not allowed`)
    }

    for (const key of ['name:', 'on:', 'permissions:', 'jobs:']) {
      const exists = lines.some((line) => line.startsWith(key))

      if (!exists) {
        failures.push(`${file}: missing top-level ${key}`)
      }
    }

    const jobsIndex = lines.indexOf('jobs:')

    if (jobsIndex < 0) {
      continue
    }

    const jobs = []

    for (let index = jobsIndex + 1; index < lines.length; index += 1) {
      const line = lines[index]

      if (/^[^ ]/.test(line) && line.trim() !== '') {
        break
      }

      const match = line.match(
        /^ {2}([A-Za-z_][A-Za-z0-9_-]*):\s*(?:#.*)?$/,
      )

      if (match) {
        jobs.push({
          id: match[1],
          index,
        })
      }
    }

    if (jobs.length === 0) {
      failures.push(`${file}: jobs section contains no valid jobs`)
      continue
    }

    const seen = new Set()

    for (const [position, job] of jobs.entries()) {
      if (seen.has(job.id)) {
        failures.push(
          `${file}:${job.index + 1}: duplicate job ${job.id}`,
        )
      }

      seen.add(job.id)

      const nextJobIndex =
        jobs[position + 1]?.index ?? lines.length

      const block = lines.slice(
        job.index + 1,
        nextJobIndex,
      )

      const hasExecutionTarget = block.some((line) =>
        /^ {4}(runs-on|uses):/.test(line),
      )

      if (!hasExecutionTarget) {
        failures.push(
          `${file}:${job.index + 1}: job ${job.id} has no runs-on/uses`,
        )
      }
    }
  }
}

if (failures.length > 0) {
  console.error('WORKFLOW VALIDATION: FAILED')

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log('WORKFLOW VALIDATION: PASS')
