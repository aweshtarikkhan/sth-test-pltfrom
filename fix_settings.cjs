const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');
code = code.replace(
  /path: '\/chat', description: 'Contact HR or IT'/,
  "path: '/chat?support=true', description: 'Contact HR or IT'"
);
fs.writeFileSync('src/pages/SettingsPage.tsx', code, 'utf8');
console.log('Fixed SettingsPage path');
