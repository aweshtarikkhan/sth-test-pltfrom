const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Ensure stats cards have good wrapping and padding on mobile
// "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" is actually okay.
// But let's check the Header of Calendar
code = code.replace(
  '<CardHeader className="bg-gray-50/50 dark:bg-slate-800 pb-4 border-b border-gray-100 \ndark:border-slate-700 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">',
  '<CardHeader className="bg-gray-50/50 dark:bg-slate-800 pb-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">'
); // Fixing the newline issue just in case

// Check buttons in "Top Level Actions"
code = code.replace(
  '<div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">',
  '<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">'
);
code = code.replace(
  '<div className="flex gap-3">',
  '<div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">'
);

// We need to ensure that the calendar grid fits on mobile. 
// text-xs font-semibold for days is already there.

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Patched Dashboard.tsx");
