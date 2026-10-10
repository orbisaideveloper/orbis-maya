// Equal text may occur more than once. Number only those equal identities.
export function keyedItems<T>(items:readonly T[],identity:(item:T)=>string){
 const seen=new Map<string,number>()
 return items.map(item=>{
  const id=identity(item),occurrence=seen.get(id)??0
  seen.set(id,occurrence+1)
  return {item,key:JSON.stringify([id,occurrence])}
 })
}
