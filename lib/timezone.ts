/** Date arithmetic is based on instants; display and calendar dates use Singapore. */
const singaporeDateFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'});
const singaporeLocalFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const singaporeDueFormatter=new Intl.DateTimeFormat('en-SG',{timeZone:'Asia/Singapore',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const calendarMonthFormatter=new Intl.DateTimeFormat('en-SG',{month:'long',year:'numeric',timeZone:'UTC'});
export function getSingaporeNow(): Date { return new Date(); }
export function formatSingaporeDate(date: Date = getSingaporeNow()): string { return singaporeDateFormatter.format(date); }
export function singaporeLocal(date: Date = getSingaporeNow()): string { const parts = singaporeLocalFormatter.formatToParts(date); const p = Object.fromEntries(parts.map(x=>[x.type,x.value])); return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`; }
export function parseSingapore(value:string):Date {
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if(!match)return new Date(NaN);
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),hour=Number(match[4]),minute=Number(match[5]),second=Number(match[6]||0);
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59)return new Date(NaN);
  return new Date(match[8]?value:`${value}+08:00`);
}
export function calculateNextDueDate(value:string, pattern:string): string { const d = parseSingapore(value); const local = singaporeLocal(d); const [date,time] = local.split('T'); let [y,m,day] = date.split('-').map(Number); if(pattern==='daily'||pattern==='weekly') { const next = new Date(d.getTime()+(pattern==='daily'?1:7)*86400000); return singaporeLocal(next); } if(pattern==='monthly') { m++; if(m===13){m=1;y++;} } else if(pattern==='yearly') y++; else throw new Error('Invalid recurrence'); const last = new Date(Date.UTC(y,m,0)).getUTCDate(); day=Math.min(day,last); return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}T${time}`; }
export function generateCalendarGrid(year:number,month:number){const first=new Date(Date.UTC(year,month-1,1));const start=first.getUTCDay();const days=new Date(Date.UTC(year,month,0)).getUTCDate();const count=Math.max(35,Math.ceil((start+days)/7)*7);const today=formatSingaporeDate();return Array.from({length:count},(_,i)=>{const d=new Date(Date.UTC(year,month-1,1-start+i));const date=d.toISOString().slice(0,10);return {date,day:d.getUTCDate(),inMonth:d.getUTCMonth()===month-1,isToday:date===today,isPast:date<today,isWeekend:d.getUTCDay()===0||d.getUTCDay()===6}})}
export function formatCalendarMonth(year:number,month:number){return calendarMonthFormatter.format(new Date(Date.UTC(year,month-1,1)))}
export function addSingaporeMinutes(minutes:number){return singaporeLocal(new Date(getSingaporeNow().getTime()+minutes*60000))}
export function describeDue(value:string, now:Date=getSingaporeNow()):{text:string;level:'overdue'|'urgent'|'soon'|'upcoming'|'later'} {
  const diff=parseSingapore(value).getTime()-now.getTime();
  const mins=Math.max(1,Math.ceil(Math.abs(diff)/60000));
  const amount=mins<60?`${mins} minute${mins===1?'':'s'}`:mins<1440?`${Math.ceil(mins/60)} hour${Math.ceil(mins/60)===1?'':'s'}`:`${Math.ceil(mins/1440)} day${Math.ceil(mins/1440)===1?'':'s'}`;
  if(diff<0)return {text:`${amount} overdue`,level:'overdue'};
  if(diff<3600000)return {text:`Due in ${amount}`,level:'urgent'};
  if(diff>=604800000)return {text:`Due ${value.replace('T',' ').slice(0,16)} (SGT)`,level:'later'};
  const timestamp=singaporeDueFormatter.format(parseSingapore(value));
  if(diff<86400000)return {text:`Due in ${amount} (${timestamp} SGT)`,level:'soon'};
  return {text:`Due in ${amount} (${timestamp} SGT)`,level:'upcoming'};
}

/** Convert an exported creation timestamp into SQLite's UTC timestamp format. */
export function parseExportTimestamp(value:string):string|null {
  const sqlite=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value);
  const instant=parseSingapore(sqlite?`${value.replace(' ','T')}Z`:value);
  return Number.isNaN(instant.getTime())?null:instant.toISOString().slice(0,19).replace('T',' ');
}
/** A calendar date is always interpreted in Singapore, including offset-based imports. */
export function singaporeDateKey(value:string):string|null {
  if(!/(?:Z|[+-]\d\d:\d\d)$/i.test(value))return Number.isNaN(parseSingapore(value).getTime())?null:value.slice(0,10);
  const instant=parseSingapore(value);
  return Number.isNaN(instant.getTime())?null:formatSingaporeDate(instant);
}
