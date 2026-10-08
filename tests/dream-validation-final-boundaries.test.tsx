import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({read:vi.fn(),save:vi.fn(),clear:vi.fn(),analyze:vi.fn(),valid:true}))
vi.mock('../src/dream/input',async original=>({...await original<typeof import('../src/dream/input')>(),createDreamDraft:()=>({read:mock.read,save:mock.save,clear:mock.clear}),validDream:()=>mock.valid}))
vi.mock('../src/dream/service',()=>({createDreamService:()=>({configured:false,analyze:mock.analyze,save:vi.fn()})}))
import DreamScreen from '../src/DreamScreen'
import {setLocale} from '../src/i18n'
beforeEach(()=>{setLocale('en');mock.read.mockReset().mockResolvedValue({dream:'restored dream',title:'',context:'',emotion:''});mock.valid=true;mock.analyze.mockReset()})
afterEach(()=>cleanup())
it('explains that analysis is unavailable when a valid dream is submitted without a provider',async()=>{render(<DreamScreen userId="unconfigured-dream"/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Send'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Send'}));expect(mock.analyze).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toBeInTheDocument()})
it('rejects a malformed restored dream without submitting it to analysis',async()=>{mock.valid=false;render(<DreamScreen userId="invalid-dream"/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Send'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Send'}));expect(mock.analyze).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toBeInTheDocument()})
