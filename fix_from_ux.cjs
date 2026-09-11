const fs = require('fs');
const file = 'src/pages/LeaveManagementPage.tsx';
let c = fs.readFileSync(file, 'utf8');

// Undo the disabled fix
const regexDisabled = /disabled=\{d => d < new Date\(new Date\(\)\.setHours\(0,0,0,0\)\) \|\| \(leaveData\.endDate \? d > parseISO\(leaveData\.endDate\) : false\)\}/;
c = c.replace(regexDisabled, 'disabled={d => d < new Date(new Date().setHours(0,0,0,0))}');

// Update onSelect for calOpen2
const regexOnSelect = /onSelect=\{d => \{ if \(d\) \{ setLeaveData\(\{ \.\.\.leaveData, startDate: format\(d, "yyyy-MM-dd"\) \}\); setCalOpen2\(false\); \} \}\}/;
const replacementOnSelect = 'onSelect={d => { if (d) { const newStart = format(d, "yyyy-MM-dd"); const updates: any = { startDate: newStart }; if (leaveData.endDate && d > parseISO(leaveData.endDate)) { updates.endDate = newStart; } setLeaveData({ ...leaveData, ...updates }); setCalOpen2(false); } }}';

if (c.match(regexOnSelect)) {
  c = c.replace(regexOnSelect, replacementOnSelect);
  fs.writeFileSync(file, c);
  console.log('Fixed From calendar onSelect UX');
} else {
  console.log('Regex did not match');
}
