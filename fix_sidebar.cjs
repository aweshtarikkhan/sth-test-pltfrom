const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

code = code.replace(
  /<div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-orange-100 dark:bg-slate-800 text-orange-600">\s*<Users className="w-5 h-5" \/>\s*<\/div>/g,
  `<div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-orange-100 dark:bg-slate-800 text-orange-600 font-bold text-lg">
    {group.name.substring(0, 2).toUpperCase()}
  </div>`
);

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed sidebar group icon');
