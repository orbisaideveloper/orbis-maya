import {expect,it,vi} from 'vitest'
import {createMayaGateway} from '../src/ai/gateway'
it('rejects oversized attachment requests before network transmission',async()=>{
 const transport=vi.fn<typeof fetch>();const gateway=createMayaGateway({url:'https://foundation.example/api/maya/request',getToken:async()=> 'token',fetch:transport})
 await expect(gateway.request({version:'maya.v1',capability:'general.chat',language:'en',input:{messages:[{role:'user',content:'Read this'}],attachments:[{kind:'text',name:'oversized.txt',content:'x'.repeat(2097153)}]}})).rejects.toMatchObject({code:'invalid-input'});expect(transport).not.toHaveBeenCalled()
})
