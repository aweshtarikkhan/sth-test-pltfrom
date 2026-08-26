const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex = /<div\s+onClick=\{\(\) => setChangePasswordOpen\(true\)\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
code = code.replace(regex, "");

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Replaced leftover password button.");
