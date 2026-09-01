const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

if (!code.includes('logoImg')) {
  code = code.replace(
    /import \{ useToast \} from '@\/hooks\/use-toast';/,
    `import { useToast } from '@/hooks/use-toast';\nimport logoImg from '@/assets/logo.png';`
  );
}

code = code.replace(
  /<div className="w-full text-center text-\[10px\] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-8 shrink-0">\s*Powered by AassayBiz\s*<\/div>/,
  `<div className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-8 shrink-0 pb-4">\n              <span>Powered by</span>\n              <img src={logoImg} alt="AassayBiz" className="h-4 object-contain opacity-70" />\n            </div>`
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code, 'utf8');
console.log('Fixed DashboardLayout logo');
