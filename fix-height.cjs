const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// Replace the height calculation to perfectly fit the mobile screen between the top header and bottom nav
code = code.replace(
  'className="relative w-full max-w-6xl mx-auto h-[calc(100vh-7rem)] md:h-[calc(100vh-3rem)] flex flex-col"',
  'className="relative w-full max-w-6xl mx-auto h-[calc(100dvh-9rem)] md:h-[calc(100vh-6rem)] flex flex-col"'
);

fs.writeFileSync('src/pages/ChatPage.tsx', code);
console.log("Fixed height for mobile!");
