const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

code = code.replace(
  /<X className="w-4 h-4" \/>\s*<\/button>\s*<\/div>/,
  '<X className="w-4 h-4" />\n                    </button>\n                  </div>\n                  </div>'
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code, 'utf8');
console.log('Fixed div');
