const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// The original widget text regex
const oldWidgetRegex = /\{\/\* Upcoming Holiday \*\/\}\s*<div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">[\s\S]*?days\s*<\/div>\s*<\/div>\s*\)\)\}\s*<\/div>\s*\)\}\s*<\/div>/;

// Remove it from the bottom
code = code.replace(oldWidgetRegex, '');

// The new widget code (modified to slice 1)
const newWidget = `{/* Upcoming Holiday */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl p-4 shadow-sm border border-blue-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-blue-900 dark:text-white font-bold text-sm">
                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Next Holiday
              </div>
              <Button variant="ghost" className="h-6 text-xs text-blue-600 dark:text-blue-400 p-0 hover:bg-transparent hover:text-blue-800" onClick={() => navigate('/holidays')}>View All</Button>
            </div>
            
            {upcomingHolidays.length === 0 ? (
              <p className="text-xs text-blue-500/80 dark:text-slate-400">No upcoming holidays.</p>
            ) : (
              <div>
                {upcomingHolidays.slice(0, 1).map((h, i) => (
                  <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900/50 p-3 rounded-xl shadow-sm border border-white dark:border-slate-700/50">
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{h.name}</p>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400 mt-1">{format(new Date(h.date), 'dd MMMM yyyy')}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold whitespace-nowrap shadow-inner">
                      In {Math.ceil((new Date(h.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>`;

// Insert it right before Clock In / Out widget
const insertTarget = `{/* Clock In / Out Main Action Widget */}`;
code = code.replace(insertTarget, newWidget + '\n\n          ' + insertTarget);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Moved Upcoming Holiday widget and updated to show 1 item.");
