import {expect,it} from 'vitest'
import {validateFiles,prepareAttachments} from '../src/chat/attachments'
it('rejects unsupported and excessive files before parsing',()=>{
 expect(()=>validateFiles([new File(['secret'],'secret.exe',{type:'application/octet-stream'})])).toThrow('TYPE')
 expect(()=>validateFiles(Array(4).fill(new File(['x'],'note.txt',{type:'text/plain'})))).toThrow('COUNT')
 expect(()=>validateFiles([new File([],'empty.pdf',{type:'application/pdf'})])).toThrow('SIZE')
})
it('reads bounded plain text and rejects oversized content without truncating',async()=>{
 const small=Object.assign(new File(['বাংলা নোট'],'note.txt',{type:'text/plain'}),{text:async()=> 'বাংলা নোট'})
 await expect(prepareAttachments([small])).resolves.toEqual([{kind:'text',name:'note.txt',content:'বাংলা নোট'}])
 const large=Object.assign(new File(['x'.repeat(12001)],'large.txt',{type:'text/plain'}),{text:async()=> 'x'.repeat(12001)})
 await expect(prepareAttachments([large])).rejects.toThrow('SIZE')
})
