export default function MessageText({value}:Readonly<{value:string}>){
 return <div className="message-prose">{value.split(/\n\s*\n/).map((block,index)=>{
  const lines=block.trim().split('\n')
  if(lines.every(line=>/^\s*(?:[-•]|\d+[.)])\s+/.test(line)))return <ul key={index}>{lines.map((line,item)=><li key={item}>{line.replace(/^\s*(?:[-•]|\d+[.)])\s+/,'')}</li>)}</ul>
  return <p key={index}>{block}</p>
 })}</div>
}
