const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

// 1. Import useToast if not there
if (!code.includes("useToast")) {
  code = code.replace("import { format } from 'date-fns';", "import { format } from 'date-fns';\nimport { useToast } from '@/hooks/use-toast';");
}

// 2. Add todayRecord state
if (!code.includes("const [todayRecord, setTodayRecord]")) {
  code = code.replace(
    "const [employee, setEmployee] = useState<any>(null);",
    "const [employee, setEmployee] = useState<any>(null);\n  const [todayRecord, setTodayRecord] = useState<any>(null);\n  const [actionLoading, setActionLoading] = useState(false);\n  const { toast } = useToast();"
  );
}

// 3. Fetch today's record in checkUser
const checkUserCode = `if (empData) setEmployee(empData);`;
const checkUserNew = `if (empData) setEmployee(empData);
          
          if (empData) {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: todayData } = await supabase
              .from('attendances')
              .select('*')
              .eq('employee_id', empData.id)
              .eq('date', today)
              .maybeSingle();
            setTodayRecord(todayData);
          }`;
if (!code.includes("const today = format(new Date()")) {
  code = code.replace(checkUserCode, checkUserNew);
}

// 4. Add handleClockInOut function
const handleClockInOutFunction = `  const handleClockInOut = async (type: 'in' | 'out') => {
    if (!employee) return;
    
    const confirmMessage = type === 'in' ? "Are you sure you want to Clock In?" : "Are you sure you want to Clock Out?";
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      if (type === 'in') {
        const { error, data } = await supabase.from('attendances').upsert({
          employee_id: employee.id,
          org_id: employee.org_id,
          date: today,
          clock_in_time: now,
          status: 'present'
        }, { onConflict: 'employee_id,date' }).select().single();
        if (error) throw error;
        setTodayRecord(data);
        toast({ title: 'Clocked In', description: 'Your attendance has been marked.' });
        // Dispatch custom event to notify Dashboard to refresh if it's open
        window.dispatchEvent(new Event('attendance_updated'));
      } else {
        const { error, data } = await supabase.from('attendances').update({
          clock_out_time: now
        }).eq('id', todayRecord.id).select().single();
        if (error) throw error;
        setTodayRecord(data);
        toast({ title: 'Clocked Out', description: 'Your shift has ended.' });
        window.dispatchEvent(new Event('attendance_updated'));
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };`;
  
if (!code.includes("handleClockInOut = async")) {
  code = code.replace(
    "const handleLogout = async () => {",
    handleClockInOutFunction + "\n\n  const handleLogout = async () => {"
  );
}

// 5. Replace center button logic
const centerBtnRegex = /\{\/\* Center Raised Action \/ Calendar \(mapped to holidays\) \*\/\}\s*<div className="flex-1 flex justify-center">[\s\S]*?<\/div>/;

const newCenterBtn = `{/* Center Raised Action: Clock In / Out */}
          <div className="flex-1 flex justify-center z-[10000]">
            {!todayRecord ? (
              <button
                disabled={actionLoading}
                onClick={() => handleClockInOut('in')}
                className="-mt-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 transition-transform active:scale-95 bg-orange-500 hover:bg-orange-600 animate-pulse"
              >
                <div className="flex flex-col items-center">
                  <Fingerprint className="w-6 h-6 text-white" />
                  <span className="text-[8px] font-bold text-white uppercase mt-0.5">IN</span>
                </div>
              </button>
            ) : !todayRecord.clock_out_time ? (
              <button
                disabled={actionLoading}
                onClick={() => handleClockInOut('out')}
                className="-mt-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 transition-transform active:scale-95 bg-red-500 hover:bg-red-600"
              >
                <div className="flex flex-col items-center">
                  <Fingerprint className="w-6 h-6 text-white" />
                  <span className="text-[8px] font-bold text-white uppercase mt-0.5">OUT</span>
                </div>
              </button>
            ) : (
              <button
                disabled
                className="-mt-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 bg-green-500 opacity-80"
              >
                <CheckCircle2 className="w-7 h-7 text-white" />
              </button>
            )}
          </div>`;

code = code.replace(centerBtnRegex, newCenterBtn);

// Ensure Fingerprint is imported
if (!code.includes('Fingerprint')) {
  code = code.replace("CheckCircle2, Menu , ChevronRight } from 'lucide-react';", "CheckCircle2, Menu, ChevronRight, Fingerprint } from 'lucide-react';");
}

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Updated DashboardLayout with Clock In/Out button and logic!");
