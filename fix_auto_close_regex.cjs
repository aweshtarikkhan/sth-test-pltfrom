const fs = require('fs');
const file = 'src/pages/LeaveManagementPage.tsx';
let c = fs.readFileSync(file, 'utf8');

const regex1 = /onSelect=\{d => \{\s*if \(d\) \{\s*const str = format\(d, "yyyy-MM-dd"\);\s*setLeaveData\(\{ \.\.\.leaveData, startDate: str, endDate: str \}\);\s*\}\s*\}\}/g;
c = c.replace(regex1, 'onSelect={d => { if (d) { const str = format(d, "yyyy-MM-dd"); setLeaveData({ ...leaveData, startDate: str, endDate: str }); setCalOpen1(false); } }}');

const regex2 = /onSelect=\{d => \{\s*if \(d\) setLeaveData\(\{ \.\.\.leaveData, startDate: format\(d, "yyyy-MM-dd"\) \}\);\s*\}\}/g;
c = c.replace(regex2, 'onSelect={d => { if (d) { setLeaveData({ ...leaveData, startDate: format(d, "yyyy-MM-dd") }); setCalOpen2(false); } }}');

const regex3 = /onSelect=\{d => \{\s*if \(d\) setLeaveData\(\{ \.\.\.leaveData, endDate: format\(d, "yyyy-MM-dd"\) \}\);\s*\}\}/g;
c = c.replace(regex3, 'onSelect={d => { if (d) { setLeaveData({ ...leaveData, endDate: format(d, "yyyy-MM-dd") }); setCalOpen3(false); } }}');

fs.writeFileSync(file, c);
console.log('Fixed popover onSelects');
