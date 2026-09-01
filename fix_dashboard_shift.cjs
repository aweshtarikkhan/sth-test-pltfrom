const fs = require('fs');
const file = 'src/pages/Dashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `          supabase.from('shifts').select('*').eq('id', empData.shift_id).single(),`;
const replacementStr = `          (supabase as any).from('employee_shifts').select('*, shifts(*)').eq('employee_id', empData.id).maybeSingle(),`;

code = code.replace(targetStr, replacementStr);

const targetBlock2 = `        if (shiftData) setEmployeeShift(shiftData);`;
const replacementBlock2 = `        let resolvedShift = shiftData?.shifts || null;
        if (!resolvedShift && empData.shift_id) {
          const { data: directShift } = await supabase.from('shifts').select('*').eq('id', empData.shift_id).maybeSingle();
          if (directShift) resolvedShift = directShift;
        }
        if (!resolvedShift) {
          const { data: orgShifts } = await (supabase as any)
            .from('shifts')
            .select('*')
            .eq('org_id', empData.org_id)
            .order('is_default', { ascending: false });
          if (orgShifts && orgShifts.length > 0) {
            resolvedShift = orgShifts.find((s: any) => s.is_default) || orgShifts[0];
          }
        }
        setEmployeeShift(resolvedShift);`;

code = code.replace(targetBlock2, replacementBlock2);

// We must also fix the getEffectiveAttendanceStatus calls to use resolvedShift instead of shiftData.
const targetBlock3 = `        eligibleDays.forEach(d => {
          const ds = format(d, 'yyyy-MM-dd');
          const isWeekOff = weeklyOffs.includes(d.getDay());
          const isHol = holidays.some(hol => hol.date === ds);
          const hasLeave = leaves.some(leave => ds >= leave.start_date && ds <= leave.end_date);
          const existing = attMap[ds];

          if (existing) {
            const status = getEffectiveAttendanceStatus(existing, shiftData);`;

const replacementBlock3 = `        eligibleDays.forEach(d => {
          const ds = format(d, 'yyyy-MM-dd');
          const isWeekOff = weeklyOffs.includes(d.getDay());
          const isHol = holidays.some(hol => hol.date === ds);
          const hasLeave = leaves.some(leave => ds >= leave.start_date && ds <= leave.end_date);
          const existing = attMap[ds];

          if (existing) {
            const status = getEffectiveAttendanceStatus(existing, resolvedShift);`;

code = code.replace(targetBlock3, replacementBlock3);

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed Dashboard shift logic!');
