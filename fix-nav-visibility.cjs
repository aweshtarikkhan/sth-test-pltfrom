const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

const oldClasses = 'className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around items-end px-2 pb-5 pt-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"';
const newClasses = 'className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around items-end px-2 pb-safe pt-2 z-[9999] shadow-[0_-10px_30px_rgba(0,0,0,0.15)] min-h-[70px]" style={{ paddingBottom: "env(safe-area-inset-bottom, 20px)" }}';

code = code.replace(oldClasses, newClasses);
fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Made bottom nav absolutely bulletproof!");
