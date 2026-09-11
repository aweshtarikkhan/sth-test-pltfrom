const fs = require('fs');
const file = 'src/pages/LeaveManagementPage.tsx';
let c = fs.readFileSync(file, 'utf8');

const regex = /<Calendar mode="single" selected=\{leaveData\.startDate \? parseISO\(leaveData\.startDate\) : undefined\} onSelect=\{d => \{ if \(d\) \{ setLeaveData\(\{ \.\.\.leaveData, startDate: format\(d, "yyyy-MM-dd"\) \}\); setCalOpen2\(false\); \} \}\} disabled=\{d => d < new Date\(new Date\(\)\.setHours\(0,0,0,0\)\)\} initialFocus \/>/;

const replacement = '<Calendar mode="single" selected={leaveData.startDate ? parseISO(leaveData.startDate) : undefined} onSelect={d => { if (d) { setLeaveData({ ...leaveData, startDate: format(d, "yyyy-MM-dd") }); setCalOpen2(false); } }} disabled={d => d < new Date(new Date().setHours(0,0,0,0)) || (leaveData.endDate ? d > parseISO(leaveData.endDate) : false)} initialFocus />';

if (c.match(regex)) {
  c = c.replace(regex, replacement);
  fs.writeFileSync(file, c);
  console.log('Fixed From calendar disabled dates');
} else {
  console.log('Regex did not match');
}
