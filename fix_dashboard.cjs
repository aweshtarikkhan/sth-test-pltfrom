const fs = require('fs');
const file = 'src/pages/Dashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `        let p = 0, l = 0, a = 0, h = 0;
        (monthData || []).forEach(record => {
          const status = record.status || 'absent';
          if (status === 'present') p++;
          else if (status === 'late') l++;
          else if (status === 'half_day' || status === 'half-day') h++;
          else if (status === 'absent') a++;
        });`;

const replacement = `        let p = 0, l = 0, a = 0, h = 0;
        (monthData || []).forEach(record => {
          const status = getEffectiveAttendanceStatus(record, shiftData);
          if (status === 'present') p++;
          else if (status === 'late') l++;
          else if (status === 'half_day' || status === 'half-day') h++;
          else if (status === 'absent') a++;
        });`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code, 'utf8');
console.log('Fixed properly');
