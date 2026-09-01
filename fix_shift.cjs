const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  /<span className="flex items-center"><div className="w-1\.5 h-1\.5 rounded-full bg-orange-500 mr-1\.5"><\/div> Late up to 10:30<\/span>/,
  '<span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></div> Late up to {employeeShift.late_end?.slice(0,5) || \\'10:30\\'}</span>'
);

code = code.replace(
  /<span className="flex items-center"><div className="w-1\.5 h-1\.5 rounded-full bg-orange-500 mr-1\.5"><\/div> Half day up to 14:00<\/span>/,
  '<span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></div> Half day up to {employeeShift.half_day_end?.slice(0,5) || \\'14:00\\'}</span>'
);

fs.writeFileSync('src/pages/Dashboard.tsx', code, 'utf8');
console.log('Fixed shift timings');
