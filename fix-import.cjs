const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

if (!code.includes('Fingerprint } from')) {
  code = code.replace("Menu , ChevronRight } from 'lucide-react';", "Menu, ChevronRight, Fingerprint } from 'lucide-react';");
  fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
  console.log("Fixed missing Fingerprint import!");
}
