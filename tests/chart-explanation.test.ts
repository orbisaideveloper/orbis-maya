import {expect,it} from 'vitest'
import {calculateChart} from '../src/astro/calculate'
import {explanationRows,houseExplanation} from '../src/astro/interpretation'
const chart=calculateChart('1986-05-10','00:05',{label:'Krishnanagar',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'})
it('explains actual house occupancy and traditional ruler links, including an empty house',()=>{
 const rows=houseExplanation(chart,4,'bn').flat().join(' ')
 expect(rows).toContain('মেষ');expect(rows).toContain('মঙ্গল');expect(rows).toContain('12');expect(rows).toContain('সূর্য');expect(rows).toContain('বুধ');expect(rows).toContain('রাহু')
 expect(houseExplanation(chart,9,'bn').flat().join(' ')).toContain('এর অর্থ এই জীবনের বিষয়টি নেই')
 expect(()=>houseExplanation(chart,13,'bn')).toThrow('INVALID_HOUSE')
})
it('keeps unsupported event timing explicit and localizes the complete explanation',()=>{
 for(const locale of ['bn','en','hi'] as const){const rows=explanationRows(chart,locale);expect(rows.some(row=>row.includes(chart.timePolicy))).toBe(true);expect(rows.filter(row=>row.some(cell=>cell.includes('https://www.wisdomlib.org')))).toHaveLength(2)}
 expect(explanationRows(chart,'bn').flat().join(' ')).toContain('দশা, গোচর')
})
