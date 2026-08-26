const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

code = code.replace(
  '<div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors">',
  '<div className="flex h-[100dvh] w-full bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors">'
);

// Let's also make sure the bottom nav itself is z-50 and properly styled
// The current bottom nav:
// <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around items-end px-2 pb-5 pt-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
// Wait, is "pb-5" pushing it too high or is it good? Let's reduce pb to safe-area-inset if possible, but pb-3 is usually enough. 
// I'll leave pb-5 for iOS home bar, but maybe that's what made it disappear? No, pb-5 just adds padding.

// Ensure it's not hidden by some weird CSS
fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Replaced h-screen with h-[100dvh]");
