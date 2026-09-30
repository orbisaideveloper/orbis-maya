import fs from 'node:fs'
import path from 'node:path'

const dir = path.join('.github','workflows')
const failures = []
if (!fs.existsSync(dir)) failures.push('workflow directory is missing')
else {
  const files = fs.readdirSync(dir).filter((n)=>/\.ya?ml$/.test(n)).sort()
  if (!files.length) failures.push('no workflow files found')
  for (const name of files) {
    const file=path.join(dir,name); const text=fs.readFileSync(file,'utf8'); const lines=text.split(/\r?\n/)
    if (text.includes('\t')) failures.push(`${file}: tabs are not allowed`)
    for (const key of ['name:','on:','permissions:','jobs:']) if (!lines.some((l)=>l.startsWith(key))) failures.push(`${file}: missing top-level ${key}`)
    const jobsIndex=lines.findIndex((l)=>l==='jobs:'); if (jobsIndex<0) continue
    const jobs=[]
    for (let i=jobsIndex+1;i<lines.length;i+=1) { const line=lines[i]; if (/^[^ ]/.test(line)&&line.trim()!=='') break; const m=line.match(/^ {2}([A-Za-z_][A-Za-z0-9_-]*):\s*(?:#.*)?$/); if(m) jobs.push({id:m[1],index:i}) }
    if(!jobs.length){failures.push(`${file}: jobs section contains no valid jobs`);continue}
    const seen=new Set()
    jobs.forEach((job,pos)=>{ if(seen.has(job.id)) failures.push(`${file}:${job.index+1}: duplicate job ${job.id}`); seen.add(job.id); const next=jobs[pos+1]?.index??lines.length; const block=lines.slice(job.index+1,next); if(!block.some((l)=>/^ {4}(runs-on|uses):/.test(l))) failures.push(`${file}:${job.index+1}: job ${job.id} has no runs-on/uses`) })
  }
}
if(failures.length){console.error('WORKFLOW VALIDATION: FAILED');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('WORKFLOW VALIDATION: PASS')
