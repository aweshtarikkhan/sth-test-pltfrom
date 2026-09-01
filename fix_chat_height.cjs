const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// Fix outer container - use h-full instead of calc height since parent now handles overflow
code = code.replace(
  'className="relative w-full max-w-6xl mx-auto h-[calc(100dvh-5rem)] md:h-[calc(100vh-2rem)] flex flex-col pb-4 md:pb-4 px-2 pt-2"',
  'className="relative w-full max-w-6xl mx-auto h-full flex flex-col pb-4 px-2 pt-2"'
);

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed ChatPage height to h-full');
