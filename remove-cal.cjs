const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex = /\{\/\* Attendance Calendar \*\/\}\s*<div className="bg-white[\s\S]*?<\/div>\s*<\/div>/;
const match = code.match(regex);
if (match) {
  code = code.replace(match[0], '');
  fs.writeFileSync('src/pages/Dashboard.tsx', code);
  console.log("Removed calendar from Dashboard.tsx");
} else {
  console.log("Not found in Dashboard.tsx");
}
