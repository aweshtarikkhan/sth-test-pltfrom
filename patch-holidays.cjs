const fs = require('fs');

let code = fs.readFileSync('src/pages/HolidaysPage.tsx', 'utf8');

const returnStatementRegex = /return \(\s*<div className="max-w-4xl mx-auto space-y-6">([\s\S]*?)<\/div>\s*\);\s*}\s*$/;

const newRender = `return (
    <div className="relative w-full max-w-lg mx-auto md:max-w-5xl pb-6">
      {/* Background Top Banner (AssayBiz Blue) */}
      <div className="absolute -top-8 -left-4 -right-4 h-64 bg-[#0a192f] rounded-b-[40px] z-0 hidden sm:block md:hidden"></div>

      <div className="relative z-10 space-y-6 mt-2">
        <div className="px-1 md:px-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-white md:dark:text-white mb-1">Company Holidays</h1>
          <p className="text-gray-500 dark:text-slate-400 sm:text-blue-100/80 md:dark:text-slate-400 text-sm font-medium">Public and company holidays for the year</p>
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-slate-400 py-8 text-center font-bold">Loading holidays...</p>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-white md:dark:text-white mb-4 px-1 md:px-0">Upcoming Holidays</h2>
              {upcomingHolidays.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarDays className="w-8 h-8 text-blue-200 dark:text-slate-600" />
                  </div>
                  <p className="text-gray-900 dark:text-white font-bold">No upcoming holidays.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingHolidays.map((holiday) => (
                    <div key={holiday.id} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border-l-4 border-orange-500 border-y border-r border-y-gray-100 border-r-gray-100 dark:border-y-slate-700 dark:border-r-slate-700 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">{holiday.name}</h3>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-slate-500 mt-0.5">{holiday.type} Holiday</p>
                      </div>
                      <div className="text-right bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-2xl">
                        <p className="font-black text-orange-600 dark:text-orange-400">{format(parseISO(holiday.date), 'MMM dd')}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-orange-400/80 dark:text-orange-500/80">{format(parseISO(holiday.date), 'EEEE')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pastHolidays.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-1 md:px-0">Past Holidays</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                  {pastHolidays.map((holiday) => (
                    <div key={holiday.id} className="bg-gray-50/80 dark:bg-slate-900/40 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-600 dark:text-slate-300 text-base">{holiday.name}</h3>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-slate-500 mt-0.5">{holiday.type} Holiday</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-500 dark:text-slate-400">{format(parseISO(holiday.date), 'MMM dd')}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-slate-500">{format(parseISO(holiday.date), 'EEEE')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}`;

if (returnStatementRegex.test(code)) {
  code = code.replace(returnStatementRegex, newRender);
  fs.writeFileSync('src/pages/HolidaysPage.tsx', code);
  console.log("HolidaysPage patched successfully!");
} else {
  console.log("Could not match the return statement in HolidaysPage.tsx");
}
