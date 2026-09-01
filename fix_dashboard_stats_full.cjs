const fs = require('fs');
const file = 'src/pages/Dashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetRegex = /const \[\s*\{\s*data:\s*monthData\s*\},[\s\S]*?let leavesLeft = 0;/;

const replacement = `const [
          { data: monthData },
          { data: todayData },
          { data: holsData },
          { data: shiftData },
          { data: leaveBalData },
          { data: orgData },
          { data: monthHolsData },
          { data: monthLeavesData }
        ] = await Promise.all([
          supabase.from('attendances').select('*').eq('employee_id', empData.id).gte('date', start).lte('date', end),
          supabase.from('attendances').select('*').eq('employee_id', empData.id).eq('date', today).maybeSingle(),
          supabase.from('holidays').select('*').eq('org_id', empData.org_id).gte('date', today).order('date', { ascending: true }).limit(2),
          supabase.from('shifts').select('*').eq('id', empData.shift_id).single(),
          supabase.from('leave_balances').select('*').eq('employee_id', empData.id),
          supabase.from('organizations').select('weekly_offs').eq('id', empData.org_id).single(),
          supabase.from('holidays').select('*').eq('org_id', empData.org_id).gte('date', start).lte('date', end),
          supabase.from('leaves').select('*').eq('employee_id', empData.id).eq('status', 'approved').lte('start_date', end).gte('end_date', start)
        ]);

        if (shiftData) setEmployeeShift(shiftData);
        if (monthData) setMonthRecords(monthData);
        if (todayData) setTodayRecord(todayData);
        if (holsData) setUpcomingHolidays(holsData);

        const weeklyOffs = orgData?.weekly_offs || [0, 6];
        const holidays = monthHolsData || [];
        const leaves = monthLeavesData || [];
        
        const attMap: Record<string, any> = {};
        (monthData || []).forEach(r => { attMap[r.date] = r; });

        const monthDays = eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
        const eligibleDays = monthDays.filter(d => format(d, 'yyyy-MM-dd') <= today);

        let p = 0, l = 0, a = 0, h = 0;
        
        eligibleDays.forEach(d => {
          const ds = format(d, 'yyyy-MM-dd');
          const isWeekOff = weeklyOffs.includes(d.getDay());
          const isHol = holidays.some(hol => hol.date === ds);
          const hasLeave = leaves.some(leave => ds >= leave.start_date && ds <= leave.end_date);
          const existing = attMap[ds];

          if (existing) {
            const status = getEffectiveAttendanceStatus(existing, shiftData);
            if (status === 'present') p++;
            else if (status === 'late') l++;
            else if (status === 'half_day' || status === 'half-day') h++;
            else if (status === 'absent') a++;
          } else {
            if (!isWeekOff && !isHol && !hasLeave) {
              a++;
            }
          }
        });

        let leavesLeft = 0;`;

code = code.replace(targetRegex, replacement);
fs.writeFileSync(file, code, 'utf8');
console.log('Fixed full dashboard stats logic!');
