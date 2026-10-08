import { expect,it } from 'vitest'
import { speechText,finalSpeechText } from '../src/design/speech-text'
it('replaces indexed interim/final results rather than duplicating repeated recognition events',()=>{
 const first=[{isFinal:false,0:{transcript:'আমি নদী দেখেছি'}}]
 expect(speechText('',first)).toBe('আমি নদী দেখেছি')
 const final=[{isFinal:true,0:{transcript:'আমি নদী দেখেছি'}},{isFinal:false,0:{transcript:'তারপর বাড়ি'}}]
 expect(speechText('',final)).toBe('আমি নদী দেখেছি তারপর বাড়ি')
 expect(speechText('',final)).toBe('আমি নদী দেখেছি তারপর বাড়ি')
 expect(speechText('আগের লেখা',final)).toBe('আগের লেখা আমি নদী দেখেছি তারপর বাড়ি')
})
it('preserves intentional repeated words and script, and bounds text',()=>{
 expect(speechText('',[{isFinal:true,0:{transcript:'না না আমি যাব না'}}])).toBe('না না আমি যাব না')
 expect(speechText('',[{isFinal:true,0:{transcript:'मैं घर गया'}}])).toBe('मैं घर गया')
 expect(speechText('',[{isFinal:true,0:{transcript:'abcdef'}}],3)).toBe('abc')
})

it('does not commit changing interim guesses across automatic sessions',()=>{
 expect(finalSpeechText('আগের লেখা',[{isFinal:true,0:{transcript:'আমি বললাম'}},{isFinal:false,0:{transcript:'অসম্পূর্ণ'}}])).toBe('আগের লেখা আমি বললাম')
})

it('reconciles repeated cumulative Android phrases without editing the typed prefix',()=>{
 const results=[{isFinal:true,0:{transcript:'আমি কী প্রশ্ন'}},{isFinal:true,0:{transcript:'আমি কী প্রশ্ন করতে পারি'}}]
 expect(speechText('',results)).toBe('আমি কী প্রশ্ন করতে পারি')
 expect(speechText('আমি কী প্রশ্ন',results)).toBe('আমি কী প্রশ্ন আমি কী প্রশ্ন করতে পারি')
 expect(speechText('',[{isFinal:true,0:{transcript:'না না আমি বলেছি'}}])).toBe('না না আমি বলেছি')
})
