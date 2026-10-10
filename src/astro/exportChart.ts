import { escapeXml } from './chartReport'
const encoder=new TextEncoder()
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
// Small standards-based, uncompressed ZIP writer: no third-party runtime dependency.
function zip(files:Readonly<Record<string,string>>):ArrayBuffer{
 const parts:Uint8Array[]=[],directory:Uint8Array[]=[];let offset=0
 for(const [name,content] of Object.entries(files)){
  const filename=encoder.encode(name),data=encoder.encode(content),crc=crc32(data)
  const local=new Uint8Array(30+filename.length),v=new DataView(local.buffer)
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,filename.length,true);local.set(filename,30)
  const central=new Uint8Array(46+filename.length),c=new DataView(central.buffer)
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,filename.length,true);c.setUint32(42,offset,true);central.set(filename,46)
  parts.push(local,data);directory.push(central);offset+=local.length+data.length
 }
 const size=directory.reduce((n,p)=>n+p.length,0),end=new Uint8Array(22),e=new DataView(end.buffer)
 e.setUint32(0,0x06054b50,true);e.setUint16(8,directory.length,true);e.setUint16(10,directory.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true)
 const buffer=new ArrayBuffer(offset+size+22),result=new Uint8Array(buffer);let cursor=0
 for(const part of [...parts,...directory,end]){result.set(part,cursor);cursor+=part.length}return buffer
}
function workbookCell(value:string,column:number,row:number){
 return `<c r="${String.fromCodePoint(65+column)}${row}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
}
function htmlRow(row:readonly string[]){
 const cells=row.length?row.map(value=>'<td>'+escapeXml(value)+'</td>').join(''):'<td colspan="6"> </td>'
 return '<tr>'+cells+'</tr>'
}
export function workbookBytes(rows:readonly (readonly string[])[]):ArrayBuffer{
 const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
 const sheet=rows.map((row,index)=>{
  const number=index+1
  const cells=row.map((value,column)=>workbookCell(value,column,number)).join('')
  return `<row r="${number}">${cells}</row>`
 }).join('')
 return zip({'[Content_Types].xml':xml+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
 '_rels/.rels':xml+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':xml+`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Birth Chart" sheetId="1" r:id="rId1"/></sheets></workbook>`,
 'xl/_rels/workbook.xml.rels':xml+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
 'xl/worksheets/sheet1.xml':xml+`<worksheet xmlns="${ns}"><cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="6" width="30" customWidth="1"/></cols><sheetData>${sheet}</sheetData></worksheet>`})
}
export function downloadWorkbook(rows:readonly (readonly string[])[]){
 const url=URL.createObjectURL(new Blob([workbookBytes(rows)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})),link=document.createElement('a')
 link.href=url;link.download='Orbis-Astro-Birth-Chart.xlsx';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export function reportHtml(rows:readonly (readonly string[])[],locale:string){return `<!doctype html><html lang="${escapeXml(locale)}"><head><meta charset="utf-8"><title>Orbis Astro — Birth Chart</title><style>@page{size:A4;margin:14mm}body{font:12px sans-serif;color:#231840;background:white}h1{font-size:22px}table{width:100%;border-collapse:collapse;table-layout:fixed}td{border:1px solid #c6bdd5;padding:6px;overflow-wrap:anywhere;vertical-align:top}tr{break-inside:avoid}tr:first-child{font-weight:bold}footer{margin-top:12px}</style></head><body><h1>Orbis Astro</h1><table>${rows.map(htmlRow).join('')}</table></body></html>`}
export function printReport(rows:readonly (readonly string[])[],locale:string){
 const frame=document.createElement('iframe');frame.title='Orbis Astro printable report';frame.style.cssText='position:fixed;width:1px;height:1px;left:-10000px;top:0;border:0'
 frame.onload=()=>{const view=frame.contentWindow;if(!view){frame.remove();return}view.addEventListener('afterprint',()=>frame.remove(),{once:true});void (frame.contentDocument?.fonts?.ready??Promise.resolve()).then(()=>{view.focus();view.print()})}
 frame.srcdoc=reportHtml(rows,locale);document.body.append(frame);setTimeout(()=>frame.remove(),300000)
}
