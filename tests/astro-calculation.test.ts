import { calculationTime } from '../src/astro/chartTime'
import { expect,it } from 'vitest'
import { RotateVector,Rotation_ECT_EQD,Vector,SiderealTime } from 'astronomy-engine'
import { ascendantAt,ayanamsaAt,calculateChart,normalize } from '../src/astro/calculate'
const location={label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}
it('agrees within one arcminute with the published 2020 true Lahiri numerical checkpoint',()=>{
 // Swiss Ephemeris manual Appendix E: 2020-01-01 00:00 UT, 24°07′54.8411″.
 const expected=24+7/60+54.8411/3600
 expect(Math.abs(ayanamsaAt('2020-01-01T00:00:00Z')-expected)).toBeLessThan(1/60)
})
it('places the ascendant on the geometric horizon, in the eastern half of the sky',()=>{
 for(const longitude of [-120,0,88.36,170])for(const latitude of [-45,0,22.57,60]){
  const utc='1986-05-09T18:35:00Z',time=calculationTime(utc),lambda=ascendantAt(utc,latitude,longitude)*Math.PI/180
  const eqd=RotateVector(Rotation_ECT_EQD(time),new Vector(Math.cos(lambda),Math.sin(lambda),0,time))
  const theta=(SiderealTime(time)*15+longitude)*Math.PI/180,phi=latitude*Math.PI/180
  const up=eqd.x*Math.cos(phi)*Math.cos(theta)+eqd.y*Math.cos(phi)*Math.sin(theta)+eqd.z*Math.sin(phi)
  const east=-eqd.x*Math.sin(theta)+eqd.y*Math.cos(theta)
  expect(Math.abs(up)).toBeLessThan(1e-10);expect(east).toBeGreaterThan(0)
 }
})
it('calculates nine bodies, opposing mean nodes and whole-sign house assignments from the historical UTC',()=>{
 const chart=calculateChart('1986-05-10','00:05',location)
 expect(chart.utc).toBe('1986-05-09T18:35:00.000Z');expect(chart.planets).toHaveLength(9)
 const rahu=chart.planets.find(p=>p.id==='Rahu')!,ketu=chart.planets.find(p=>p.id==='Ketu')!
 expect(normalize(ketu.longitude-rahu.longitude)).toBeCloseTo(180,9)
 for(const planet of chart.planets){expect(planet.longitude).toBeGreaterThanOrEqual(0);expect(planet.longitude).toBeLessThan(360);expect(planet.house).toBe((planet.sign-Math.floor(chart.ascendant/30)+12)%12+1)}
 expect(()=>calculateChart('1890-01-01','12:00',location)).toThrow('UNSUPPORTED_DATE')
 expect(()=>calculateChart('1990-01-01','12:00',{...location,latitude:89})).toThrow('UNSUPPORTED_LATITUDE')
 expect(()=>calculateChart('1990-01-01','12:00',{...location,longitude:181})).toThrow('INVALID_LOCATION')
})
