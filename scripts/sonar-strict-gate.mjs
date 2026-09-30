import fs from 'node:fs'

const token=process.env.SONAR_TOKEN
const host=(process.env.SONAR_HOST_URL||'https://sonarcloud.io').replace(/\/$/,'')
if(!token){console.error('STRICT SONAR: SONAR_TOKEN is missing');process.exit(1)}
const props=fs.readFileSync('sonar-project.properties','utf8')
const key=props.match(/^sonar\.projectKey=(.+)$/m)?.[1]?.trim()
const org=props.match(/^sonar\.organization=(.+)$/m)?.[1]?.trim()
if(key!=='orbisaideveloper_orbis-maya'||org!=='orbis'){console.error('STRICT SONAR: project isolation contract failed');process.exit(1)}
async function getJson(path){const r=await fetch(`${host}${path}`,{headers:{Authorization:`Bearer ${token}`}});if(!r.ok)throw new Error(`${path} -> HTTP ${r.status}: ${(await r.text()).slice(0,300)}`);return r.json()}
const k=encodeURIComponent(key)
try{
 const [gate,issues,measures]=await Promise.all([getJson(`/api/qualitygates/project_status?projectKey=${k}`),getJson(`/api/issues/search?componentKeys=${k}&resolved=false&ps=1`),getJson(`/api/measures/component?component=${k}&metricKeys=coverage,duplicated_lines_density,security_rating,reliability_rating,sqale_rating,security_hotspots_reviewed`)])
 const failures=[]; const status=gate?.projectStatus?.status; if(status!=='OK')failures.push(`Quality Gate must be OK, actual=${status??'missing'}`)
 const total=Number(issues?.total??issues?.paging?.total??0); if(total!==0)failures.push(`unresolved Sonar issues must be 0, actual=${total}`)
 const map=new Map((measures?.component?.measures||[]).map((x)=>[x.metric,x.value])); const n=(m)=>{const raw=map.get(m);if(raw===undefined)return null;const v=Number(raw);return Number.isFinite(v)?v:null}
 const coverage=n('coverage'),dup=n('duplicated_lines_density'),hot=n('security_hotspots_reviewed'),sec=n('security_rating'),rel=n('reliability_rating'),maint=n('sqale_rating')
 if(coverage!==null&&coverage!==100)failures.push(`coverage must be 100%, actual=${coverage}%`)
 if(dup!==null&&dup!==0)failures.push(`duplicated lines density must be 0.0%, actual=${dup}%`)
 if(hot!==null&&hot!==100)failures.push(`security hotspots reviewed must be 100%, actual=${hot}%`)
 for(const [label,v] of [['security rating',sec],['reliability rating',rel],['maintainability rating',maint]]) if(v!==null&&v!==1)failures.push(`${label} must be A/1, actual=${v}`)
 console.log('=== ORBIS MAYA STRICT SONAR ===');console.log(`Quality Gate: ${status}`);console.log(`Unresolved issues: ${total}`);console.log(`Coverage: ${coverage??'N/A'}`);console.log(`Duplication: ${dup??'N/A'}`);console.log(`Hotspots reviewed: ${hot??'N/A'}`)
 if(failures.length){console.error('STRICT SONAR: FAILED');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
 console.log('STRICT SONAR: PASS')
}catch(e){console.error(`STRICT SONAR: ERROR — ${e.message}`);process.exit(1)}
