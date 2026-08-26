const fs = require('fs');
let code = fs.readFileSync('src/pages/HistoryPage.tsx', 'utf8');

const oldImport = "import { format, startOfMonth, endOfMonth, parseISO, subMonths, eachDayOfInterval } from 'date-fns';";
const newImport = "import { format, startOfMonth, endOfMonth, parseISO, subMonths, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';";

code = code.replace(oldImport, newImport);
fs.writeFileSync('src/pages/HistoryPage.tsx', code);
console.log("Updated date-fns imports.");
