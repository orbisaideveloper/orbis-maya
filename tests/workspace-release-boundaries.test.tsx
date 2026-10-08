import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
vi.mock('../src/i18n',()=>({useLocale:()=> 'en'}))
afterEach(()=>{cleanup();vi.unstubAllEnvs();vi.resetModules()})
it('does not expose the development workspace in a production build',async()=>{
 vi.stubEnv('DEV',false);vi.stubEnv('VITE_MAYA_DESIGN_WORKSPACE','');vi.resetModules();const {default:Workspace}=await import('../src/design/Workspace');render(<Workspace/>);expect(screen.queryByRole('button',{name:'Development view'})).toBeNull();expect(screen.queryByRole('button',{name:'Publish'})).toBeNull()
})
it('does not treat a missing release URL as a published revision',async()=>{
 vi.stubEnv('DEV',true);vi.stubEnv('VITE_MAYA_PUBLISHED_URL',undefined);vi.stubEnv('VITE_MAYA_PUBLISHED_REVISION','revision');vi.resetModules();const {default:Workspace}=await import('../src/design/Workspace');render(<Workspace/>);fireEvent.click(screen.getByRole('button',{name:'Published view'}));expect(screen.queryByTitle('Published view')).toBeNull();expect(screen.getByRole('button',{name:'Publish',exact:true})).toBeDisabled()
})
it('requires a revision before embedding an external release',async()=>{
 vi.stubEnv('DEV',false);vi.stubEnv('VITE_MAYA_DESIGN_WORKSPACE','1');vi.stubEnv('VITE_MAYA_PUBLISHED_URL','https://release.example/');vi.stubEnv('VITE_MAYA_PUBLISHED_REVISION','');vi.resetModules();const {default:Workspace}=await import('../src/design/Workspace');render(<Workspace/>);fireEvent.click(screen.getByRole('button',{name:'Published view'}));expect(screen.queryByTitle('Published view')).toBeNull()
})
