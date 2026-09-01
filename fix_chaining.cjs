const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  /{employeeShift\.late_end\?/g,
  '{employeeShift?.late_end?'
);

code = code.replace(
  /{employeeShift\.half_day_end\?/g,
  '{employeeShift?.half_day_end?'
);

fs.writeFileSync('src/pages/Dashboard.tsx', code, 'utf8');
console.log('Fixed optional chaining');
