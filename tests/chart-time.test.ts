import { expect,it } from 'vitest'
import { calculationTime,nutationLongitude,earthOrientationAt } from '../src/astro/chartTime'
import { calculateChart } from '../src/astro/calculate'
it('uses the effective IERS leap-second offset at each tested civil UTC boundary',()=>{
 for(const [utc,expected] of [['1972-01-01T00:00:00Z',42.184],['1985-06-30T23:59:00Z',54.184],['1985-07-01T00:00:00Z',55.184],['1986-05-09T18:35:00Z',55.184],['2000-01-01T12:00:00Z',64.184],['2016-12-31T23:59:00Z',68.184],['2017-01-01T00:00:00Z',69.184],['2026-10-07T00:00:00Z',69.184]] as const){
  const time=calculationTime(utc),civilDays=(Date.parse(utc)-Date.parse('2000-01-01T12:00:00Z'))/86400000;expect((time.tt-civilDays)*86400).toBeCloseTo(expected,3)
 }
 const internal=calculationTime('2020-01-01T00:00:00Z').AddDays(-.01)
 expect((calculationTime('2020-01-01T00:00:00Z').tt-internal.tt)*86400).toBeCloseTo(864,3)
 expect(()=>calculationTime('2027-06-28T00:00:00Z')).toThrow('LEAP_SECOND_TABLE_EXPIRED')
})
it('matches independently measured mean-node sidereal fixtures after correcting the frame',()=>{
 const location={label:'Greenwich',latitude:0,longitude:0,timezone:'UTC'}
 // Owner-run Swiss 2.10.03 Moshier diagnostics, direct FLG_SIDEREAL comparison.
 // Mean-node reference from original run, future precision is not asserted.
 const chart=calculateChart('2000-01-01','12:00',location)
 const node=chart.planets.find(p=>p.id==='Rahu')!
 expect(Math.abs(node.longitude-101.18742335279372)*3600).toBeLessThan(1)
 expect(nutationLongitude(calculationTime('2000-01-01T12:00:00Z'))*3600).toBeCloseTo(-14.0388164476,2)
 expect(()=>calculateChart('2099-12-30','23:59',location)).toThrow('FUTURE_BIRTH_DATE')
})

it('interpolates continuous UT1-TAI across leap seconds and exposes missing coverage',()=>{
 const a=earthOrientationAt('2016-12-31T23:59:59Z'),b=earthOrientationAt('2017-01-01T00:00:00Z')
 expect(b.seconds-a.seconds).toBeCloseTo(1,4)
 expect(earthOrientationAt('1986-05-10T00:00:00Z').quality).toBe('IERS Bulletin B final')
 expect(()=>earthOrientationAt('1950-01-01T00:00:00Z')).toThrow('DUT1_DATA_UNAVAILABLE')
 expect(()=>earthOrientationAt('2099-01-01T00:00:00Z')).toThrow('DUT1_DATA_UNAVAILABLE')
})
