const fs = require('fs');
let code = fs.readFileSync('src/pages/HistoryPage.tsx', 'utf8');

// The problematic string injected at the end of the calendar is:
const badEnding = `          </div>
        </div>


        

      </div>

        <RegularizeDialog`;

const goodEnding = `          </div>
        </div>

        <RegularizeDialog`;

// Wait, the calendar block has its own main div, which ends with a closing </div>.
// Then there are two more </div>s that were captured.
// Let's just fix it properly by replacing the specific bad section.
// A more robust way:
// I can just find the part that looks like:
/*
          </div>
        </div>


        

      </div>

        <RegularizeDialog
*/
// And replace it with just:
/*
        <RegularizeDialog
*/

// Let's just use regex to remove multiple closing divs right before RegularizeDialog
// We want exactly 0 extra closing divs. Wait, the calendar widget has:
// <div class="bg-white ...">
//   <div class="flex justify-between ...">...</div>
//   <div class="grid grid-cols-7 ...">...</div>
//   <div class="grid grid-cols-7 ...">...</div>
//   <div class="flex flex-wrap ... legend">...</div>
// </div>
// So the calendar widget ends with ONE </div>.

const regex = /\{\/\* Legend \*\/\}([\s\S]*?)<RegularizeDialog/g;
let match = code.match(regex);
if (match) {
  // Replace the match with the legend end, exactly ONE closing div for the calendar, and RegularizeDialog
  const legendEnd = `{/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-4 text-[10px] font-medium text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Present</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Absent</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Late</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Half Day</span>
            </div>
          </div>

        <RegularizeDialog`;
        
  // Let's just reconstruct that exact portion
  code = code.replace(regex, legendEnd);
  fs.writeFileSync('src/pages/HistoryPage.tsx', code);
  console.log("Fixed the extra closing divs in HistoryPage.tsx");
} else {
  console.log("Could not match the legend to RegularizeDialog block.");
}
