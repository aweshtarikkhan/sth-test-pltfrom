const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// 1. Stack columns on mobile
code = code.replace(
  '<div className="flex-1 flex gap-4 min-h-0">',
  '<div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">'
);

// 2. Make sidebar take full width on mobile, max-height 30vh on mobile, fixed width on desktop
code = code.replace(
  '<Card className="w-72 flex flex-col shadow-sm border-gray-200 dark:border-slate-700 dark:bg-slate-800 \nshrink-0">',
  '<Card className="w-full md:w-72 h-[35vh] md:h-full flex flex-col shadow-sm border-gray-200 dark:border-slate-700 dark:bg-slate-800 shrink-0">'
); // using \n to match if broken, but maybe it wasn't broken. Let's use regex to be safe.

code = code.replace(/<Card className="w-72 flex flex-col shadow-sm border-gray-200 dark:border-slate-700 dark:bg-slate-800[\s\n]*shrink-0">/, '<Card className="w-full md:w-72 h-[35vh] md:h-full flex flex-col shadow-sm border-gray-200 dark:border-slate-700 dark:bg-slate-800 shrink-0">');


fs.writeFileSync('src/pages/ChatPage.tsx', code);
console.log("Patched ChatPage.tsx");
