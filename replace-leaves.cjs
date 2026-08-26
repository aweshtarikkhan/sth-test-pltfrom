const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex = /\{\/\*\s*Leaves Left\s*\*\/\}\s*<div className="bg-blue-50[\s\S]*?pointer-events-none" \/>\s*<\/div>/;

const newApplyLeave = `{/* Apply for Leave Action */}
          <div 
            onClick={() => navigate('/leaves')}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-5 shadow-sm border border-blue-100 dark:border-blue-800 flex justify-between items-center relative overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-95 mt-3"
          >
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">Apply for Leave</span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Request Time Off</span>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-blue-300 dark:text-blue-500 relative z-10" />
            <FileText className="w-24 h-24 text-blue-500/10 dark:text-blue-400/5 absolute -right-4 -bottom-4 transform rotate-12 pointer-events-none" />
          </div>`;

code = code.replace(regex, newApplyLeave);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Replaced using regex.");
