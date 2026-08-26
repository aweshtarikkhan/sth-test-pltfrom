const fs = require('fs');

let calCode = fs.readFileSync('dashboard-calendar.txt', 'utf8');

// Replace monthRecords with records
calCode = calCode.replace(/monthRecords/g, 'records');

// Replace new Date() with currentMonth for the month generation context
calCode = calCode.replace(/format\(new Date\(\), 'MMMM yyyy'\)/g, "format(currentMonth, 'MMMM yyyy')");
calCode = calCode.replace(/startOfMonth\(new Date\(\)\)/g, "startOfMonth(currentMonth)");

// Remove trailing </div>\n\n      </div> (since we extracted exactly the match and we don't want extra stray closing tags)
// Wait, when I extracted it using regex, it matched exactly the Attendance Calendar block.
// Let's trim and remove any hanging end divs if any.
// In the earlier output, it was just the calendar div and the legend inside it.
// Let's just wrap it properly.

let historyCode = fs.readFileSync('src/pages/HistoryPage.tsx', 'utf8');

const targetStr = '<RegularizeDialog';
const replacement = calCode + '\n\n        <RegularizeDialog';

historyCode = historyCode.replace(targetStr, replacement);

fs.writeFileSync('src/pages/HistoryPage.tsx', historyCode);
console.log("Injected calendar into HistoryPage.");
