import { expect,it } from 'vitest'
import { calculateChart } from '../src/astro/calculate'
import { chartRows,chartText,escapeXml,reportCopy } from '../src/astro/chartReport'
import { workbookBytes,reportHtml } from '../src/astro/exportChart'
it('includes the complete birth inputs, all nine bodies, all twelve houses and method limitations',()=>{
 const profile={name:'Ajay Saha',birthDate:'1986-05-10',birthTime:'00:05',birthPlace:'Krishnanagar',birthLocation:{label:'Krishnanagar',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'}}
 const chart=calculateChart(profile.birthDate,profile.birthTime,profile.birthLocation)
 const rows=chartRows(chart,profile,'bn'),text=chartText(rows)
 for(const value of ['Ajay Saha','1986-05-10','00:05','Krishnanagar','Asia/Kolkata','সূর্য','চন্দ্র','বুধ','শুক্র','মঙ্গল','বৃহস্পতি','শনি','রাহু','কেতু','AI'])expect(text).toContain(value)
 for(const locale of ['bn','en','hi'] as const){
  const report=chartRows(chart,profile,locale)
  expect(report).toContainEqual(['Time policy',chart.timePolicy])
  expect(report).toContainEqual(['Engine',chart.engine])
  expect(report).toContainEqual(['Method',chart.method])
  expect(report).toContainEqual([reportCopy[locale].note])
 }
 expect(reportCopy.bn.note).toContain('সর্বজনীন নির্ভুলতার নিশ্চয়তা নয়')
 expect(reportCopy.bn.note).toContain('AI ফলব্যাখ্যা এখনো সংযুক্ত নয়')
 expect(rows.filter(row=>/^([1-9]|1[0-2])$/.test(row[0]||'')).map(row=>row[0])).toEqual(Array.from({length:12},(_,i)=>String(i+1)))
})
it('produces an actual OpenXML workbook ZIP and treats all user text as literal cells',()=>{
 const bytes=workbookBytes([['নাম','=HYPERLINK("https://example.com")'],['<unsafe>&','বাংলা']]),view=new DataView(bytes),data=new Uint8Array(bytes),files:Record<string,string>={};let offset=0
 while(view.getUint32(offset,true)===0x04034b50){
  expect(view.getUint16(offset+8,true)).toBe(0)
  const length=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true),start=offset+30+nameLength+extraLength
  const name=new TextDecoder().decode(data.slice(offset+30,offset+30+nameLength));files[name]=new TextDecoder().decode(data.slice(start,start+length));offset=start+length
 }
 expect(Object.keys(files).sort()).toEqual(['[Content_Types].xml','_rels/.rels','xl/_rels/workbook.xml.rels','xl/workbook.xml','xl/worksheets/sheet1.xml'].sort())
 expect(view.getUint32(offset,true)).toBe(0x02014b50)
 const end=bytes.byteLength-22;expect(view.getUint32(end,true)).toBe(0x06054b50);expect(view.getUint16(end+10,true)).toBe(5)
 const sheet=files['xl/worksheets/sheet1.xml'];expect(sheet).toContain('বাংলা');expect(sheet).toContain('&lt;unsafe&gt;&amp;');expect(sheet).toContain('t="inlineStr"');expect(sheet).not.toContain('<f>')
})
it('escapes malicious profile content in the isolated PDF print document',()=>{
 const html=reportHtml([['<script>alert(1)</script>','<img src=x onerror=alert(1)>']], 'bn')
 expect(html).not.toContain('<script>');expect(html).not.toContain('<img');expect(html).toContain('&lt;script&gt;');expect(html).toContain('lang="bn"');expect(html).toContain('size:A4')
})

it('removes invalid XML control characters while retaining Bengali, tabs and newlines',()=>{
 const input='বাংলা'+String.fromCharCode(0,8,11,12,14,31)+'\t\n\r'+'<&'
 expect(escapeXml(input)).toBe('বাংলা\t\n\r&lt;&amp;')
})
