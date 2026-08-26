const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Add Umbrella import
if (!content.includes('Umbrella')) {
    content = content.replace('Clock, CalendarDays, MapPin, CheckCircle2, AlertCircle, XCircle, FileText, Lock, User, ChevronRight, Fingerprint', 'Clock, CalendarDays, MapPin, CheckCircle2, AlertCircle, XCircle, FileText, Lock, User, ChevronRight, Fingerprint, Umbrella');
}

// Add state for approvedLeaveToday
content = content.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const [approvedLeaveToday, setApprovedLeaveToday] = useState<any>(null);'
);

// Update Promise.all in loadData
const promiseAllOld = `        const [
          { data: monthData },
          { data: todayData },
          { data: holsData },
          { data: shiftData },
          { data: leaveBalData }
        ] = await Promise.all([
          supabase.from('attendances').select('*').eq('employee_id', empData.id).gte('date', start).lte('date', end),
          supabase.from('attendances').select('*').eq('employee_id', empData.id).eq('date', today).maybeSingle(),
          supabase.from('holidays').select('*').eq('org_id', empData.org_id).gte('date', today).order('date', { ascending: true }).limit(2),
          supabase.from('shifts').select('*').eq('id', empData.shift_id).single(),
          supabase.from('leave_balances').select('*').eq('employee_id', empData.id)
        ]);`;

const promiseAllNew = `        const [
          { data: monthData },
          { data: todayData },
          { data: holsData },
          { data: shiftData },
          { data: leaveBalData },
          { data: leaveTodayData }
        ] = await Promise.all([
          supabase.from('attendances').select('*').eq('employee_id', empData.id).gte('date', start).lte('date', end),
          supabase.from('attendances').select('*').eq('employee_id', empData.id).eq('date', today).maybeSingle(),
          supabase.from('holidays').select('*').eq('org_id', empData.org_id).gte('date', today).order('date', { ascending: true }).limit(2),
          supabase.from('shifts').select('*').eq('id', empData.shift_id).single(),
          supabase.from('employee_leave_balances').select('*, leave_policies(annual_limit)').eq('employee_id', empData.id),
          supabase.from('leaves').select('*').eq('employee_id', empData.id).eq('status', 'approved').lte('start_date', today).gte('end_date', today).maybeSingle()
        ]);`;

content = content.replace(promiseAllOld, promiseAllNew);

// Set approvedLeaveToday
const setTodayRecordOld = `        if (shiftData) setEmployeeShift(shiftData);
        if (monthData) setMonthRecords(monthData);
        if (todayData) setTodayRecord(todayData);
        if (holsData) setUpcomingHolidays(holsData);`;

const setTodayRecordNew = `        if (shiftData) setEmployeeShift(shiftData);
        if (monthData) setMonthRecords(monthData);
        if (todayData) setTodayRecord(todayData);
        if (holsData) setUpcomingHolidays(holsData);
        if (leaveTodayData) setApprovedLeaveToday(leaveTodayData);
        else setApprovedLeaveToday(null);`;

content = content.replace(setTodayRecordOld, setTodayRecordNew);

// Leaves left calculation fix
const leavesLeftOld = `        let leavesLeft = 0;
        (leaveBalData || []).forEach(b => {
          leavesLeft += Math.max(0, (b.annual_allowance || 0) - (b.used_amount || 0));
        });`;

const leavesLeftNew = `        let leavesLeft = 0;
        (leaveBalData || []).forEach(b => {
          const annual = b.leave_policies?.annual_limit || 0;
          leavesLeft += Math.max(0, annual - (b.used || 0));
        });`;

content = content.replace(leavesLeftOld, leavesLeftNew);

// Add handleCancelLeave function
const handleCancelLeaveStr = `
  const handleCancelLeave = async (leaveId: string) => {
    if (!window.confirm("Are you sure you want to cancel your leave for today? You will need to Check In after cancelling.")) return;
    try {
      setActionLoading(true);
      const { error } = await supabase.from('leaves').update({ status: 'cancelled' }).eq('id', leaveId);
      if (error) throw error;
      toast({ title: 'Leave Cancelled', description: 'Your leave has been cancelled. You can now clock in.' });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };
`;

content = content.replace('const handleClockInOut', handleCancelLeaveStr + '\n  const handleClockInOut');

// Widget HTML changes
const widgetOld = `          {!todayRecord ? (
             <Button 
               size="lg" 
               className="h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 font-bold active:scale-95 transition-all"
               onClick={() => handleClockInOut('in')}
               disabled={actionLoading}
             >
               <Fingerprint className="w-5 h-5 mr-2" /> Clock In
             </Button>
          ) : !todayRecord.clock_out_time ? (`;

const widgetNew = `          {approvedLeaveToday ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Umbrella className="w-4 h-4" /> On Leave
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-lg text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/50 dark:hover:bg-red-900/30"
                onClick={() => handleCancelLeave(approvedLeaveToday.id)}
                disabled={actionLoading}
              >
                Cancel Leave
              </Button>
            </div>
          ) : !todayRecord ? (
             <Button 
               size="lg" 
               className="h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 font-bold active:scale-95 transition-all"
               onClick={() => handleClockInOut('in')}
               disabled={actionLoading}
             >
               <Fingerprint className="w-5 h-5 mr-2" /> Clock In
             </Button>
          ) : !todayRecord.clock_out_time ? (`;

content = content.replace(widgetOld, widgetNew);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('patched');
