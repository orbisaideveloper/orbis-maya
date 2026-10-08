import {cleanup,render,screen} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({phase:'signed-out'}))
vi.mock('../src/auth/store',()=>({useAuth:()=>({phase:mock.phase,user:null}),authStore:{verify:vi.fn(),submit:vi.fn(),logout:vi.fn()}}))
import App from '../src/App'
import WelcomeScreen from '../src/auth/WelcomeScreen'
import AccountScreen from '../src/auth/AccountScreen'
import DesignScreen from '../src/design/DesignScreen'
import {useProfile} from '../src/profile/store'
import {renderHook} from '@testing-library/react'
import {setLocale} from '../src/i18n'
beforeEach(()=>{mock.phase='signed-out';localStorage.clear();setLocale('en');window.history.replaceState(null,'','/#/welcome')})
afterEach(()=>{cleanup();vi.unstubAllEnvs()})
it('hides design entry hints in production without explicit workspace opt-in',()=>{vi.stubEnv('DEV',false);vi.stubEnv('VITE_MAYA_DESIGN_WORKSPACE','');const view=render(<WelcomeScreen/>);expect(view.container.querySelector('.entry-preview')).toBeNull()})
it('supports explicit workspace opt-in when development mode is off',()=>{vi.stubEnv('DEV',false);vi.stubEnv('VITE_MAYA_DESIGN_WORKSPACE','1');const view=render(<WelcomeScreen/>);expect(view.container.querySelector('.entry-preview')).not.toBeNull()})
it('does not unlock preview routes in production from a query parameter alone',()=>{vi.stubEnv('DEV',false);vi.stubEnv('VITE_MAYA_DESIGN_WORKSPACE','');window.history.replaceState(null,'','/?maya-design=1#/');const view=render(<App/>);expect(view.container.querySelector('.entry-shell')).not.toBeNull();expect(view.container.querySelector('.dashboard-home')).toBeNull()})
it('labels an explicit preview profile as a local draft in an opted-in production build',()=>{vi.stubEnv('DEV',false);vi.stubEnv('VITE_MAYA_DESIGN_WORKSPACE','1');window.history.replaceState(null,'','/?maya-design=1#/profile');const view=renderHook(()=>useProfile());expect(view.result.current.scope).toBe('preview-device-draft');expect(view.result.current.preview).toBe(true)})
it('opens signup directly from the requested account mode',()=>{window.history.replaceState(null,'','/?account-mode=signup#/account');const view=render(<AccountScreen/>);expect(view.container.querySelector('[name=name]')).toBeInTheDocument();expect(view.container.querySelector('[name=confirmation]')).toBeInTheDocument()})
it('renders the English profile link in the settings design',()=>{render(<DesignScreen path="/settings"/>);expect(screen.getByRole('link',{name:'Profile'})).toHaveAttribute('href','#/profile')})
it('uses the Hindi profile link when Hindi is selected',()=>{setLocale('hi');render(<DesignScreen path="/settings"/>);expect(screen.getByRole('link',{name:'प्रोफ़ाइल'})).toHaveAttribute('href','#/profile')})
