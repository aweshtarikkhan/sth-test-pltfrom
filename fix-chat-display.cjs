const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

code = code.replace(
  /\'@\'\+selectedTarget\.username/g,
  "'@' + (selectedTarget?.username || selectedTarget?.name?.replace(/\\s+/g, '').toLowerCase() || 'user')"
);

code = code.replace(
  /Waiting for @\{selectedTarget\.username\} to accept/g,
  "Waiting for @{selectedTarget?.username || selectedTarget?.name || 'user'} to accept"
);

fs.writeFileSync('src/pages/ChatPage.tsx', code);
console.log("Fixed @null display!");
