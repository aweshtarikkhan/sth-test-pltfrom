const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// Fix mentions dropdown: remove left-4 absolute positioning, use relative positioning on input container
// Change the outer wrapper div for input area to have relative positioning
// And move mention dropdown inside the form/input area, positioned just above input

code = code.replace(
  `{showMentions && groupMembers.length > 0 && (
                    <div className="absolute bottom-[70px] left-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 w-64 max-h-48 overflow-y-auto">`,
  `{showMentions && groupMembers.length > 0 && (
                    <div className="absolute bottom-full mb-2 right-0 left-0 mx-0 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">`
);

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed mention dropdown position');
