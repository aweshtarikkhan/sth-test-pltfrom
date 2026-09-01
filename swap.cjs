const fs = require('fs');
let code = fs.readFileSync('src/pages/HistoryPage.tsx', 'utf8');

const listStartIdx = code.indexOf('<div className="space-y-3">');
const calStartIdx = code.indexOf('{/* Attendance Calendar */}');
const dialogStartIdx = code.indexOf('<RegularizeDialog');

if (listStartIdx > -1 && calStartIdx > -1 && dialogStartIdx > -1) {
  let listBlock = code.substring(listStartIdx, calStartIdx);
  let calBlock = code.substring(calStartIdx, dialogStartIdx);
  
  // Fix the margins! List block should have mt-5, calendar shouldn't if it's first, but let's see:
  calBlock = calBlock.replace(' mt-5', ' mb-5'); // Calendar had mt-5, change to mb-5
  
  const newCode = code.substring(0, listStartIdx) + calBlock + '\n' + listBlock + code.substring(dialogStartIdx);
  
  fs.writeFileSync('src/pages/HistoryPage.tsx', newCode, 'utf8');
  console.log('Swapped successfully!');
} else {
  console.log('Markers not found');
}
