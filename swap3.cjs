const fs = require('fs');
let code = fs.readFileSync('src/pages/HistoryPage.tsx', 'utf8');

const desktopMarker = '{/* Desktop View */}';
const calendarMarker = '{/* Attendance Calendar */}';
const dialogMarker = '<RegularizeDialog';

const dStart = code.indexOf(desktopMarker);
const cStart = code.indexOf(calendarMarker);
const digStart = code.indexOf(dialogMarker);

if (dStart > -1 && cStart > -1 && digStart > -1) {
  // Extract Calendar block
  let calBlock = code.substring(cStart, digStart);
  
  // Extract History Lists block
  let listsBlock = code.substring(dStart, cStart);
  
  // Clean up margins: calBlock has mt-5, which is good for spacing between header and calendar.
  // Wait, let's keep mt-5 on calendar, and add mt-5 to the Desktop View so there's spacing between Calendar and lists.
  
  const newCode = code.substring(0, dStart) + calBlock + "\n<div className=\"mt-8\">\n<h2 className=\"text-lg font-bold text-gray-900 dark:text-white mb-4 px-1\">Attendance List</h2>\n" + listsBlock + "</div>\n" + code.substring(digStart);
  
  fs.writeFileSync('src/pages/HistoryPage.tsx', newCode, 'utf8');
  console.log('Swapped Desktop/Mobile view with Calendar!');
} else {
  console.log('Markers missing');
}
