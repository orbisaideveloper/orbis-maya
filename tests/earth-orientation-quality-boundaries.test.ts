import {expect,it,vi} from 'vitest'
vi.mock('../src/astro/earthOrientation',()=>({eopStart:51544,eopValues:[[0,1],[0,1],[0,0],[0,0],[0,2],[0,2]],eopSource:'quality-test-fixture',eopSha256:'fixture'}))
import {earthOrientationAt} from '../src/astro/chartTime'
it('labels measured Earth-orientation samples separately from final and predicted samples',()=>{
 expect(earthOrientationAt('2000-01-01T12:00:00Z').quality).toBe('IERS Bulletin A measured')
 expect(earthOrientationAt('2000-01-03T12:00:00Z').quality).toBe('IERS Bulletin B final')
 expect(earthOrientationAt('2000-01-05T12:00:00Z').quality).toBe('IERS Bulletin A predicted')
})
