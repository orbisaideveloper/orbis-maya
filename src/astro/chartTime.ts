import {eopStart,eopValues,eopSource,eopSha256} from './earthOrientation'
import { AstroTime,SiderealTime,SetDeltaTFunction,DeltaT_EspenakMeeus } from 'astronomy-engine'
// IERS Bulletin C 72, July 2026. TAI-UTC step values, effective at UTC midnight.
// https://hpiers.obspm.fr/iers/bul/bulc/Leap_Second.dat (expires 2027-06-28).
const leapDates=['1972-01-01','1972-07-01','1973-01-01','1974-01-01','1975-01-01','1976-01-01','1977-01-01','1978-01-01','1979-01-01','1980-01-01','1981-07-01','1982-07-01','1983-07-01','1985-07-01','1988-01-01','1990-01-01','1991-01-01','1992-07-01','1993-07-01','1994-07-01','1996-01-01','1997-07-01','1999-01-01','2006-01-01','2009-01-01','2012-07-01','2015-07-01','2017-01-01']
const leapEpochs=leapDates.map(date=>Date.parse(date+'T00:00:00Z'))
const epoch=Date.parse('2000-01-01T12:00:00Z')
const dayMs=86400000
export function taiMinusUtc(stamp:number):number {
 if(stamp>=Date.parse('2027-06-28T00:00:00Z'))throw new Error('LEAP_SECOND_TABLE_EXPIRED')
 if(stamp<leapEpochs[0])throw new Error('PRE_LEAP_UTC')
 let index=0
 while(index+1<leapEpochs.length&&stamp>=leapEpochs[index+1])index++
 return 10+index
}
export function earthOrientationAt(utc:string):Readonly<{seconds:number;quality:string}> {
 const stamp=Date.parse(utc)
 if(!Number.isFinite(stamp))throw new Error('INVALID_TIME')
 const mjd=stamp/dayMs+40587,index=Math.floor(mjd)-eopStart
 if(index<0||index+1>=eopValues.length)throw new Error('DUT1_DATA_UNAVAILABLE')
 const left=eopValues[index],right=eopValues[index+1],fraction=mjd-Math.floor(mjd)
 const leftStamp=(Math.floor(mjd)-40587)*dayMs
 // Interpolate UT1-TAI, which stays continuous across a leap-second step.
 const a=left[0]/1e7-taiMinusUtc(leftStamp),b=right[0]/1e7-taiMinusUtc(leftStamp+dayMs)
 return {seconds:a+(b-a)*fraction+taiMinusUtc(stamp),quality:Math.max(left[1],right[1])===2?'IERS Bulletin A predicted':Math.max(left[1],right[1])===1?'IERS Bulletin A measured':'IERS Bulletin B final'}
}
const firstStamp=(eopStart-40587)*dayMs
function engineDeltaT(ut:number):number {
 const approximate=epoch+ut*dayMs
 if(approximate<leapEpochs[0])return DeltaT_EspenakMeeus(ut)
 taiMinusUtc(approximate)
 if(approximate<firstStamp)return taiMinusUtc(approximate)+32.184
 let civil=approximate
 for(let i=0;i<3;i++)civil=approximate-earthOrientationAt(new Date(civil).toISOString()).seconds*1000
 return taiMinusUtc(civil)+32.184-earthOrientationAt(new Date(civil).toISOString()).seconds
}
// Internal light-time iterations use UT1 and TT consistently.
SetDeltaTFunction(engineDeltaT)
export function calculationTime(utc:string):AstroTime {
 const stamp=Date.parse(utc)
 if(!Number.isFinite(stamp))throw new Error('INVALID_TIME')
 if(stamp>=leapEpochs[0])taiMinusUtc(stamp)
 const dut1=stamp>=firstStamp?earthOrientationAt(utc).seconds:0
 return new AstroTime((stamp-epoch)/dayMs+dut1/86400)
}
export function nutationLongitude(time:AstroTime):number {
 const t=time.tt/36525
 const era=360*(.7790572732640+.00273781191135448*time.ut+(time.ut%1))
 const gmst=era+(.014506+((((-.0000000368*t-.000029956)*t-.00000044)*t+1.3915817)*t+4612.156534)*t)/3600
 const meanObliquity=(84381.406+(-46.836769+(-.0001831+(.00200340+(-.000000576-.0000000434*t)*t)*t)*t)*t)/3600
 const eqeq=(((SiderealTime(time)*15-gmst+180)%360)+360)%360-180
 return eqeq/Math.cos(meanObliquity*Math.PI/180)
}
export function timePolicy(utc:string):string {
 const stamp=Date.parse(utc)
 if(stamp<leapEpochs[0])return 'Pre-1972 historical UT/Delta-T model; exact civil-time certification pending'
 if(stamp<firstStamp)return 'IERS UTC-to-TT leap seconds; pre-1973 DUT1 coverage unavailable; UTC approximates UT1'
 const orientation=earthOrientationAt(utc)
 return orientation.quality+'; interpolated UT1-UTC='+orientation.seconds.toFixed(7)+' seconds; IERS UTC/TT leap seconds; snapshot '+eopSha256.slice(0,12)+'; '+eopSource
}
