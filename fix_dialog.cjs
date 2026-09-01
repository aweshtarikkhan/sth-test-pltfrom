const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

code = code.replace(
  /<DialogFooter>/g,
  '<DialogFooter className="gap-3 sm:gap-4 sm:space-x-0 pt-4 mt-2 border-t border-gray-100 dark:border-slate-700/50">'
);

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed dialog footer in ChatPage');
