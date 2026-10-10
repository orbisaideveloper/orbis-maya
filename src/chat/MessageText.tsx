import {keyedItems} from '../listKeys'
export default function MessageText({value}:Readonly<{value:string}>){
 return <div className="message-prose">{keyedItems(value.split(/\n\s*\n/),block=>block).map(({item:block,key})=>{
  const lines=block.trim().split('\n')
  if(lines.every(line=>/^\s*(?:[-•]|\d+[.)])\s+/.test(line)))return <ul key={key}>{keyedItems(lines,line=>line).map(({item:line,key:lineKey})=><li key={lineKey}>{line.replace(/^\s*(?:[-•]|\d+[.)])\s+/,'')}</li>)}</ul>
  return <p key={key}>{block}</p>
 })}</div>
}
