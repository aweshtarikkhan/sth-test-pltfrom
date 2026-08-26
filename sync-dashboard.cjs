const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);`;

const newEffect = `  useEffect(() => {
    if (session) {
      loadData();
    }
    
    // Listen for custom event from Layout bottom navigation
    const handleAttendanceUpdate = () => {
      if (session) loadData();
    };
    
    window.addEventListener('attendance_updated', handleAttendanceUpdate);
    return () => window.removeEventListener('attendance_updated', handleAttendanceUpdate);
  }, [session]);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Updated Dashboard to listen for attendance_updated event");
