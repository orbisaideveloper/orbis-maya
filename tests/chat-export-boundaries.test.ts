import {afterEach,expect,it,vi} from 'vitest'
import {chatArchive,chatTranscript,downloadChat} from '../src/chat/transcript'
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers()})
it('uses a safe title when a conversation has no user turn or a blank user turn',()=>{
 expect(chatArchive([{id:'a',role:'assistant',text:'Answer'}],'en').title).toBe('Ask Maya')
 expect(chatArchive([{id:'q',role:'user',text:'  '}],'bn').title).toBe('Ask Maya')
 expect(chatTranscript([{id:'q',role:'user',text:'प्रश्न'}],'hi')).toBe('आप\nप्रश्न')
})
it('bounds archive bytes separately from its character count',()=>{
 expect(()=>chatArchive([{id:'q',role:'user',text:'ক'.repeat(31000)}],'bn')).toThrow('CHAT_TOO_LARGE')
 const title='x'.repeat(101);expect(chatArchive([{id:'q',role:'user',text:title}],'en').title).toHaveLength(100)
})
it.each([false,true])('cleans up a download link even when clicking throws: %s',(fails)=>{
 vi.useFakeTimers();const create=vi.fn().mockReturnValue('blob:chat'),revoke=vi.fn()
 vi.stubGlobal('URL',Object.assign(class extends URL {},{createObjectURL:create,revokeObjectURL:revoke}))
 const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{if(fails)throw new Error('DOWNLOAD')})
 if(fails)expect(()=>downloadChat('পূর্ণ চ্যাট')).toThrow('DOWNLOAD');else downloadChat('পূর্ণ চ্যাট')
 expect(create).toHaveBeenCalledWith(expect.any(Blob));expect(click).toHaveBeenCalledOnce()
 expect(document.querySelector('a[download]')).toBeNull();expect(revoke).not.toHaveBeenCalled()
 vi.advanceTimersByTime(1000);expect(revoke).toHaveBeenCalledWith('blob:chat')
})
