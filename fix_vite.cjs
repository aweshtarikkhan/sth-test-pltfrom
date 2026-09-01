const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
code = code.replace(/name: 'AssayPortal'/g, 'name: "AassayBiz"');
code = code.replace(/short_name: 'AssayPortal'/g, 'short_name: "AassayBiz"');
code = code.replace(/description: 'AssayBiz Attendance Portal'/g, 'description: "AassayBiz Attendance Portal"');
fs.writeFileSync('vite.config.ts', code, 'utf8');
console.log('Fixed vite.config.ts');
