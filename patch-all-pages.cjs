const fs = require('fs');

// Fix LeaveManagementPage
let leaveCode = fs.readFileSync('src/pages/LeaveManagementPage.tsx', 'utf8');
leaveCode = leaveCode.replace(
  '<div className="flex items-center justify-between">',
  '<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">'
);
leaveCode = leaveCode.replace(
  '<div className="grid grid-cols-2 gap-4">',
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">'
);
fs.writeFileSync('src/pages/LeaveManagementPage.tsx', leaveCode);
console.log("Patched LeaveManagementPage.tsx");

// Fix HolidaysPage
let holCode = fs.readFileSync('src/pages/HolidaysPage.tsx', 'utf8');
holCode = holCode.replace(
  '<div className="flex items-center justify-between">',
  '<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">'
);
fs.writeFileSync('src/pages/HolidaysPage.tsx', holCode);
console.log("Patched HolidaysPage.tsx");

// Fix HistoryPage
let histCode = fs.readFileSync('src/pages/HistoryPage.tsx', 'utf8');
// Give table a min-width to force horizontal scrolling on tiny screens instead of text wrap
histCode = histCode.replace(
  '<table className="w-full text-sm text-left">',
  '<table className="w-full text-sm text-left min-w-[600px]">'
);
fs.writeFileSync('src/pages/HistoryPage.tsx', histCode);
console.log("Patched HistoryPage.tsx");

