import {expect,it} from 'vitest'
import {calculationTime,earthOrientationAt,taiMinusUtc,timePolicy} from '../src/astro/chartTime'
it('rejects invalid time before performing astronomical calculations',()=>{
 expect(()=>calculationTime('not-a-date')).toThrow('INVALID_TIME');expect(()=>earthOrientationAt('not-a-date')).toThrow('INVALID_TIME');expect(()=>taiMinusUtc(Date.parse('1971-12-31T23:59:59Z'))).toThrow('PRE_LEAP_UTC')
})
it('labels historical and early UTC calculations with their precision limits',()=>{
 expect(timePolicy('1950-01-01T00:00:00Z')).toContain('Pre-1972');expect(timePolicy('1972-06-01T00:00:00Z')).toContain('DUT1 coverage unavailable');expect(Number.isFinite(calculationTime('1950-01-01T00:00:00Z').tt)).toBe(true);expect(Number.isFinite(calculationTime('1972-06-01T00:00:00Z').tt)).toBe(true)
})
it('exposes the independent Earth-orientation provenance in the time policy',()=>{
 const policy=timePolicy('1986-05-10T00:00:00Z');expect(policy).toContain('IERS Bulletin B final');expect(policy).toContain('interpolated UT1-UTC=');expect(policy).toContain('snapshot')
})
