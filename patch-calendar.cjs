const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Add missing imports
code = code.replace(
  "import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';",
  "import { format, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';"
);

// Add state for monthRecords
code = code.replace(
  "const [employeeShift, setEmployeeShift] = useState<any>(null);",
  "const [employeeShift, setEmployeeShift] = useState<any>(null);\n  const [monthRecords, setMonthRecords] = useState<any[]>([]);"
);

// Update setMonthRecords inside loadData
code = code.replace(
  "if (shiftData) setEmployeeShift(shiftData);",
  "if (shiftData) setEmployeeShift(shiftData);\n        if (monthData) setMonthRecords(monthData);"
);

// The Calendar Component UI to insert
const calendarComponent = `
        {/* Attendance Calendar */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 mt-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Monthly Attendance</h3>
            <span className="text-xs font-semibold px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              {format(new Date(), 'MMMM yyyy')}
            </span>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-[10px] font-bold text-gray-400 dark:text-slate-500">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const monthStart = startOfMonth(new Date());
              const monthEnd = endOfMonth(monthStart);
              const startDate = startOfWeek(monthStart);
              const endDate = endOfWeek(monthEnd);
              const dateFormat = "yyyy-MM-dd";
              const days = eachDayOfInterval({ start: startDate, end: endDate });

              return days.map((day, i) => {
                const dateStr = format(day, dateFormat);
                const record = monthRecords.find(r => r.date === dateStr);
                
                let bgColor = "bg-gray-50 dark:bg-slate-800/50 text-gray-700 dark:text-slate-300"; // default/future
                let dotColor = null;

                if (!isSameMonth(day, monthStart)) {
                  bgColor = "text-gray-300 dark:text-slate-600 opacity-50"; // out of month
                } else if (new Date(dateStr) > new Date()) {
                  // Future days in current month
                  bgColor = "bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500";
                } else if (record) {
                  const status = record.status;
                  if (status === 'present') {
                    bgColor = "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold";
                    dotColor = "bg-green-500";
                  } else if (status === 'absent') {
                    bgColor = "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-bold";
                    dotColor = "bg-red-500";
                  } else if (status === 'half_day' || status === 'half-day') {
                    bgColor = "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-bold";
                    dotColor = "bg-orange-500";
                  } else if (status === 'late') {
                    bgColor = "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold";
                    dotColor = "bg-amber-500";
                  } else if (status === 'holiday') {
                    bgColor = "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold";
                  } else if (status === 'approved_leave' || status === 'paid_leave') {
                    bgColor = "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-bold";
                  }
                } else if (day.getDay() === 0 || day.getDay() === 6) {
                   // Weekend fallback if no record
                   bgColor = "bg-gray-100 dark:bg-slate-800 text-gray-500";
                } else {
                   // Past weekday with no record = Absent normally, but let's just make it red
                   bgColor = "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-bold";
                   dotColor = "bg-red-500";
                }

                const isToday = isSameDay(day, new Date());
                if (isToday) {
                  bgColor += " ring-2 ring-orange-500 ring-offset-1 dark:ring-offset-slate-900";
                }

                return (
                  <div key={i} className={\`aspect-square rounded-xl flex flex-col items-center justify-center text-xs relative \${bgColor}\`}>
                    <span>{format(day, 'd')}</span>
                    {dotColor && <div className={\`w-1 h-1 rounded-full absolute bottom-1 \${dotColor}\`}></div>}
                  </div>
                );
              });
            })()}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-4 text-[10px] font-medium text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Present</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Absent</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Late</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Half Day</span>
          </div>
        </div>
`;

code = code.replace(
  "{/* Upcoming Holiday */}",
  calendarComponent + "\n\n        {/* Upcoming Holiday */}"
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Patched Calendar into Dashboard");
