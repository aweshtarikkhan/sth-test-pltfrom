const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const oldHandle = `  const handleClockInOut = async (type: 'in' | 'out') => {
    try {
      setActionLoading(true);`;

const newHandle = `  const handleClockInOut = async (type: 'in' | 'out') => {
    const confirmMessage = type === 'in' ? "Are you sure you want to Clock In?" : "Are you sure you want to Clock Out?";
    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(true);`;

code = code.replace(oldHandle, newHandle);

const oldDispatch = `          if (error) throw error;
        toast({ title: 'Clocked Out', description: 'Your shift has ended.' });
      }
      await loadData();`;
      
const newDispatch = `          if (error) throw error;
        toast({ title: 'Clocked Out', description: 'Your shift has ended.' });
      }
      await loadData();
      window.dispatchEvent(new Event('dashboard_attendance_updated'));`;

code = code.replace(oldDispatch, newDispatch);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Successfully patched Dashboard.tsx");
