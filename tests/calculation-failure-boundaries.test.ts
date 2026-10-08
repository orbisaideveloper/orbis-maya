import {afterEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({bad:false}))
vi.mock('astronomy-engine',async original=>{const actual=await original<typeof import('astronomy-engine')>();return {...actual,Ecliptic:(...args:Parameters<typeof actual.Ecliptic>)=>mock.bad?{elon:Number.NaN,elat:0,vec:args[0]}:actual.Ecliptic(...args)}})
import {calculateChart} from '../src/astro/calculate'
import {houseExplanation} from '../src/astro/interpretation'
afterEach(()=>{mock.bad=false})
const location={label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}
it('rejects nonfinite results returned by the astronomy engine',()=>{mock.bad=true;expect(()=>calculateChart('2000-01-01','12:00',location)).toThrow('CALCULATION_FAILED')})
it('explains a valid house even when its ruler is absent from a partial chart',()=>{const chart=calculateChart('2000-01-01','12:00',location);const partial={...chart,planets:[]};const rows=houseExplanation(partial,1,'en');expect(rows.flat().join(' ')).toContain('House');expect(rows.flat().join(' ')).not.toContain('NaN')})
