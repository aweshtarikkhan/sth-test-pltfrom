const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const oldHandle = `  const handleClockInOut = async (type: 'in' | 'out') => {
    if (!employee) return;
    setActionLoading(true);`;

const newHandle = `  const handleClockInOut = async (type: 'in' | 'out') => {
    if (!employee) return;
    
    const confirmMessage = type === 'in' ? "Are you sure you want to Clock In?" : "Are you sure you want to Clock Out?";
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(true);`;

code = code.replace(oldHandle, newHandle);

// Wait, what about updating DashboardLayout todayRecord when Dashboard does the clock in?
// In Dashboard.tsx after successful clock in/out, we should also dispatch the event!
const oldDispatch = `          toast({ title: 'Clocked Out', description: 'Your shift has ended.' });
        }
        await loadData();`;
        
const newDispatch = `          toast({ title: 'Clocked Out', description: 'Your shift has ended.' });
        }
        await loadData();
        window.dispatchEvent(new Event('dashboard_attendance_updated'));`;

code = code.replace(oldDispatch, newDispatch);

// And we need to listen for that event in DashboardLayout!
fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Updated Dashboard clock logic");
