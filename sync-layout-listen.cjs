const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

const oldCheckUser = `  useEffect(() => {
    const checkUser = async () => {`;
    
const newCheckUser = `  const fetchTodayRecord = async (empData: any) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: todayData } = await supabase
      .from('attendances')
      .select('*')
      .eq('employee_id', empData.id)
      .eq('date', today)
      .maybeSingle();
    setTodayRecord(todayData);
  };

  useEffect(() => {
    const checkUser = async () => {`;

code = code.replace(oldCheckUser, newCheckUser);

const oldSetToday = `          if (empData) {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: todayData } = await supabase
              .from('attendances')
              .select('*')
              .eq('employee_id', empData.id)
              .eq('date', today)
              .maybeSingle();
            setTodayRecord(todayData);
          }`;
          
const newSetToday = `          if (empData) {
            await fetchTodayRecord(empData);
          }`;
          
code = code.replace(oldSetToday, newSetToday);

const oldUseEffectClose = `    };
    checkUser();
  }, [location.pathname]);`;

const newUseEffectClose = `    };
    checkUser();
    
    const handleDashboardUpdate = () => {
      if (employee) fetchTodayRecord(employee);
    };
    window.addEventListener('dashboard_attendance_updated', handleDashboardUpdate);
    return () => window.removeEventListener('dashboard_attendance_updated', handleDashboardUpdate);
  }, [location.pathname, employee]);`;

code = code.replace(oldUseEffectClose, newUseEffectClose);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Updated DashboardLayout to listen to dashboard updates");
