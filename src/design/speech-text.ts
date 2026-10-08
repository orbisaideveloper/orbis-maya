export type SpeechResult = {isFinal:boolean;0:{transcript:string}}
// Reconcile the complete indexed result list, rather than append repeated events.
export function speechText(prefix:string,results:ArrayLike<SpeechResult>,limit=8000){
 let recognized=''
 for(let index=0;index<results.length;index++){
  const next=results[index][0].transcript.trim().replace(/\s+/g,' ')
  if(!next)continue
  if(!recognized){recognized=next;continue}
  // Android providers can repeat a whole cumulative phrase in a later slot.
  // Reconcile complete multiword overlaps; keep repetitions within an utterance.
  const previousWords=recognized.split(' '),nextWords=next.split(' ')
  let overlap=Math.min(previousWords.length,nextWords.length)
  while(overlap>=2&&previousWords.slice(-overlap).join(' ')!==nextWords.slice(0,overlap).join(' '))overlap--
  recognized=[recognized,...nextWords.slice(overlap>=2?overlap:0)].join(' ')
 }
 return [prefix.trim(),recognized].filter(Boolean).join(' ').slice(0,limit)
}

// Only confirmed words cross automatic recognition-session boundaries.
export function finalSpeechText(prefix:string,results:ArrayLike<SpeechResult>,limit=8000){
 const finals:SpeechResult[]=[]
 for(let index=0;index<results.length;index++)if(results[index].isFinal)finals.push(results[index])
 return speechText(prefix,finals,limit)
}
