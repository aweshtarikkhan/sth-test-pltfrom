const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex = /\{\/\* Attendance Calendar \*\/\}\s*<div className="bg-white[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const match = code.match(regex);
if (match) {
  console.log("Found calendar widget! Length: " + match[0].length);
  fs.writeFileSync('dashboard-calendar.txt', match[0]);
} else {
  console.log("Could not find calendar widget.");
}
