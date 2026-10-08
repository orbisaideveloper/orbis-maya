import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import type {Locale} from '../src/i18n'
const mock=vi.hoisted(()=>({auth:{phase:'signed-in',user:{id:'owner',email:'owner@example.com'}} as {phase:string;user:{id:string;email:string}|null}}))
vi.mock('../src/auth/store',()=>({useAuth:()=>mock.auth}))
vi.mock('../src/auth/AccountScreen',()=>({default:({reset}: {reset?:boolean})=><p data-testid="account">{reset?'reset':'account'}</p>}))
vi.mock('../src/auth/WelcomeScreen',()=>({default:()=> <p data-testid="welcome">welcome</p>}))
vi.mock('../src/profile/ProfilePanel',()=>({default:()=> <p data-testid="profile">profile</p>}))
vi.mock('../src/FeatureScreen',()=>({default:()=> <p data-testid="feature">feature</p>}))
vi.mock('../src/design/HomeScreen',()=>({default:()=> <p data-testid="home">home</p>}))
vi.mock('../src/design/DesignScreen',()=>({default:()=> <p data-testid="design">design</p>}))
vi.mock('../src/chat/ChatTools',()=>({default:()=> <p data-testid="tools">tools</p>}))
vi.mock('../src/DreamScreen',()=>({default:()=> <p data-testid="dream">dream</p>}))
vi.mock('../src/ChatScreen',()=>({default:()=> <p data-testid="chat">chat</p>}))
vi.mock('../src/HistoryScreen',()=>({default:()=> <p data-testid="history">history</p>}))
vi.mock('../src/design/Workspace',()=>({default:()=> <p data-testid="workspace">workspace</p>}))
import App from '../src/App'
import {setLocale} from '../src/i18n'
function route(path:string,preview=false){window.history.replaceState(null,'',`/${preview?'?maya-design=1':''}#${path}`)}
beforeEach(()=>{mock.auth={phase:'signed-in',user:{id:'owner',email:'owner@example.com'}};setLocale('en')})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllEnvs()})
it.each([['/','home'],['/dream','dream'],['/chat','chat'],['/history','history'],['/astro','feature'],['/profile','profile'],['/settings','feature'],['/today','design'],['/notifications','design'],['/reset-password','account'],['/workspace','workspace']])('routes signed-in users to %s',async(path,target)=>{
 route(path);render(<App/>);expect(await screen.findByTestId(target)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'Skip to main content'}));expect(document.activeElement).toBe(document.querySelector('#maya-content'))
 if(path==='/chat')expect(screen.getByTestId('tools')).toBeInTheDocument()
 if(path==='/reset-password')expect(screen.getByTestId('account')).toHaveTextContent('reset')
})
it.each(['/dream','/chat','/history','/astro','/profile'])('protects signed-out route %s',path=>{
 mock.auth={phase:'signed-out',user:null};route(path);const view=render(<App/>);expect(screen.getByTestId('account')).toBeInTheDocument();expect(view.container.firstChild).toHaveClass('entry-shell');expect(screen.queryByRole('navigation')).toBeNull()
})
it.each(['/','/welcome'])('opens public welcome at %s',path=>{mock.auth={phase:'signed-out',user:null};route(path);render(<App/>);expect(screen.getByTestId('welcome')).toBeInTheDocument()})
it.each(['bn','hi','en'] as Locale[])('localizes profile document title in %s',locale=>{setLocale(locale);route('/profile');render(<App/>);expect(document.title).toContain(locale==='bn'?'প্রোফাইল':locale==='hi'?'प्रोफ़ाइल':'Profile')})
it('does not label an unknown route as a real page',()=>{route('/missing');render(<App/>);expect(screen.queryByTestId('home')).toBeNull();expect(document.title).toContain('Orbis Astro')})
it('redirects a restored account away from the login page',async()=>{route('/account');render(<App/>);await waitFor(()=>expect(location.hash).toBe('#/'));expect(screen.getByTestId('home')).toBeInTheDocument()})
it('redirects a restored account away from welcome',async()=>{route('/welcome');render(<App/>);await waitFor(()=>expect(location.hash).toBe('#/'))})
it('removes the design preview flag when an account signs out',async()=>{
 route('/profile',true);const view=render(<App/>);mock.auth={phase:'signed-out',user:null};view.rerender(<App/>);await waitFor(()=>expect(location.hash).toBe('#/account'));expect(new URLSearchParams(location.search).has('maya-design')).toBe(false)
})
it('does not redirect a temporary checking phase',()=>{route('/profile');const view=render(<App/>);mock.auth={phase:'checking',user:null};view.rerender(<App/>);expect(location.hash).toBe('#/profile')})
