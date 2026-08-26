const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

// 1. Revert the bad useEffect close
const badUseEffectClose = `    };
    checkUser();
    
    const handleDashboardUpdate = () => {
      if (employee) fetchTodayRecord(employee);
    };
    window.addEventListener('dashboard_attendance_updated', handleDashboardUpdate);
    return () => window.removeEventListener('dashboard_attendance_updated', handleDashboardUpdate);
  }, [location.pathname, employee]);`;
  
const goodUseEffectClose = `    };
    checkUser();
  }, [location.pathname]);

  // Listen for dashboard_attendance_updated event properly
  useEffect(() => {
    if (!employee) return;
    const handleDashboardUpdate = () => {
      fetchTodayRecord(employee);
    };
    window.addEventListener('dashboard_attendance_updated', handleDashboardUpdate);
    return () => window.removeEventListener('dashboard_attendance_updated', handleDashboardUpdate);
  }, [employee]);`;
  
if (code.includes(badUseEffectClose)) {
  code = code.replace(badUseEffectClose, goodUseEffectClose);
  console.log("Fixed infinite loop in DashboardLayout!");
} else {
  console.log("Could not find the bad useEffect to replace!");
}

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
