const fs = require('fs');
const file = 'src/pages/HistoryPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const listMarker = '<div className="space-y-3">';
const calendarMarker = '{/* Attendance Calendar */}';
const calendarEndMarker = '<RegularizeDialog';

if (code.includes(listMarker) && code.includes(calendarMarker) && code.includes(calendarEndMarker)) {
  const listStart = code.indexOf(listMarker);
  const calStart = code.indexOf(calendarMarker);
  const calEnd = code.indexOf(calendarEndMarker);

  if (listStart < calStart && calStart < calEnd) {
    let listBlock = code.substring(listStart, calStart);
    let calBlock = code.substring(calStart, calEnd);

    // Swap margin top from calendar block to list block
    calBlock = calBlock.replace('mt-5', 'mb-5');
    listBlock = '<div className="mt-5">\n' + listBlock + '\n</div>\n';

    const newCode = code.substring(0, listStart) + calBlock + listBlock + code.substring(calEnd);
    fs.writeFileSync(file, newCode, 'utf8');
    console.log('Swapped correctly!');
  } else {
    console.log('Order is not as expected', {listStart, calStart, calEnd});
  }
} else {
  console.log('Markers missing');
}
