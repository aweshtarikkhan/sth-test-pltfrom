import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CalendarDays, MapPin, CheckCircle2, AlertCircle, XCircle, FileText, Lock, User, ChevronRight, Fingerprint, Umbrella } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getEffectiveAttendanceStatus } from '@/lib/shift-utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegularizeDialog } from '@/components/shared/RegularizeDialog';

export default function Dashboard({ session }: { session: any }) {
  const [employee, setEmployee] = useState<any>(null);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, half_day: 0, leaves_left: 15 });
  const [upcomingHolidays, setUpcomingHolidays] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [employeeShift, setEmployeeShift] = useState<any>(null);
  const [monthRecords, setMonthRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedLeaveToday, setApprovedLeaveToday] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Modals
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Regularize Modal
  const [regularizeOpen, setRegularizeOpen] = useState(false);
  const [selectedRegDate, setSelectedRegDate] = useState<string>('');
  const [selectedRegIn, setSelectedRegIn] = useState<string | null>(null);
  const [selectedRegOut, setSelectedRegOut] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (empData) {
        setEmployee(empData);
        
        const today = format(new Date(), 'yyyy-MM-dd');
        const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');

        const [
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
          (supabase as any).from('employee_shifts').select('*, shifts(*)').eq('employee_id', empData.id).maybeSingle(),
          supabase.from('leave_balances').select('*').eq('employee_id', empData.id),
          supabase.from('organizations').select('weekly_offs').eq('id', empData.org_id).single(),
          supabase.from('holidays').select('*').eq('org_id', empData.org_id).gte('date', start).lte('date', end),
          supabase.from('leaves').select('*').eq('employee_id', empData.id).eq('status', 'approved').lte('start_date', end).gte('end_date', start)
        ]);

        let resolvedShift = shiftData?.shifts || null;
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
        setEmployeeShift(resolvedShift);
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
            const status = getEffectiveAttendanceStatus(existing, resolvedShift);
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

        let leavesLeft = 0;
        (leaveBalData || []).forEach(b => {
          leavesLeft += Math.max(0, (b.annual_allowance || 0) - (b.used_amount || 0));
        });

        setStats({ present: p, late: l, half_day: h, absent: a, leaves_left: leavesLeft });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  
  const handleCancelLeave = async (leaveId: string) => {
    if (!window.confirm("Are you sure you want to cancel your leave for today? You will need to Check In after cancelling.")) return;
    try {
      setActionLoading(true);
      const { data: leaveReq } = await supabase.from('leaves').select('*').eq('id', leaveId).single();
      if (!leaveReq) throw new Error("Leave not found");

      const { error } = await supabase.from('leaves').update({ status: 'cancelled' }).eq('id', leaveId);
      if (error) throw error;
      
      // Refund balance
      try {
        const { data: bData } = await supabase.from('employee_leave_balances')
          .select('used')
          .eq('employee_id', leaveReq.employee_id)
          .eq('leave_type', leaveReq.leave_type)
          .maybeSingle();
          
        let currentUsed = bData?.used || 0;
        currentUsed = Math.max(0, currentUsed - leaveReq.days);
        
        await supabase.from('employee_leave_balances').upsert({
          org_id: leaveReq.org_id,
          employee_id: leaveReq.employee_id,
          leave_type: leaveReq.leave_type,
          used: currentUsed
        }, { onConflict: 'employee_id,leave_type' });
      } catch(e) {
        console.error("Failed to refund balance", e);
      }
      
      toast({ title: 'Leave Cancelled', description: 'Your leave has been cancelled. You can now clock in.' });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockInOut = async (type: 'in' | 'out') => {
    const confirmMessage = type === 'in' ? "Are you sure you want to Clock In?" : "Are you sure you want to Clock Out?";
    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      const now = new Date().toISOString();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      if (type === 'in') {
        const { error } = await supabase.from('attendances').upsert({
          employee_id: employee.id,
          org_id: employee.org_id,
          date: today,
          clock_in_time: now,
          status: 'present'
        }, { onConflict: 'employee_id,date' });
        if (error) throw error;
        toast({ title: 'Clocked In', description: 'Your attendance has been marked.' });
      } else {
        const { error } = await supabase.from('attendances').update({
          clock_out_time: now
        }).eq('id', todayRecord.id);
        if (error) throw error;
        toast({ title: 'Clocked Out', description: 'Your shift has ended.' });
      }
      await loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setActionLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Success', description: 'Password updated successfully' });
      setChangePasswordOpen(false);
      setNewPassword('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const WaveSVG = ({ color }: { color: string }) => (
    <svg className="absolute bottom-0 left-0 w-full h-12 opacity-50 pointer-events-none rounded-b-2xl" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path fill={color} fillOpacity="1" d="M0,224L48,224C96,224,192,224,288,208C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,213.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
  );

  const todayEffectiveStatus = todayRecord ? getEffectiveAttendanceStatus(todayRecord, employeeShift) : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };
  
  return (
    <div className="relative w-full max-w-lg mx-auto md:max-w-4xl pb-6">
      {/* Background Top Banner (AassayBiz Blue) */}
      <div className="absolute -top-8 -left-4 -right-4 h-64 bg-[#0a192f] rounded-b-[40px] z-0 hidden sm:block md:hidden"></div>

      <div className="relative z-10 space-y-5 mt-2">
        
        {/* Welcome Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex justify-between items-center border border-gray-100 dark:border-slate-700">
          <div className="flex-1">
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{getGreeting()}</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {employee?.name ? employee.name.split(' ')[0] : 'Employee'}! 👋
            </h2>
            
            {employeeShift ? (
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg whitespace-nowrap">
                  Shift: {employeeShift.name}
                </span>
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg whitespace-nowrap">
                  {employeeShift.start_time?.slice(0,5)} - {employeeShift.end_time?.slice(0,5)}
                </span>
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10px] font-bold rounded-lg whitespace-nowrap">
                  Grace: {employeeShift.grace_minutes}m
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-400 mb-3">No shift assigned</div>
            )}
            
            <div className="flex gap-4 text-[10px] font-semibold text-orange-600 dark:text-orange-500">
              <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></div> Late up to {employeeShift?.late_end?.slice(0,5) || "10:30"}</span>
              <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></div> Half day up to {employeeShift?.half_day_end?.slice(0,5) || "14:00"}</span>
            </div>
          </div>
          
          {/* Avatar / Profile Picture */}
          <div className="w-24 h-24 shrink-0 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden ml-2 border-2 border-white dark:border-slate-800">
            {(employee?.avatar_url || employee?.profile_image) ? (
              <img 
                src={employee.avatar_url || employee.profile_image} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User className="w-12 h-12 text-blue-300 dark:text-slate-500" />
            )}
          </div>
        </div>

        {/* Upcoming Holiday */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl p-4 shadow-sm border border-blue-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-blue-900 dark:text-white font-bold text-sm">
                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Next Holiday
              </div>
              <Button variant="ghost" className="h-6 text-xs text-blue-600 dark:text-blue-400 p-0 hover:bg-transparent hover:text-blue-800" onClick={() => navigate('/holidays')}>View All</Button>
            </div>
            
            {upcomingHolidays.length === 0 ? (
              <p className="text-xs text-blue-500/80 dark:text-slate-400">No upcoming holidays.</p>
            ) : (
              <div>
                {upcomingHolidays.slice(0, 1).map((h, i) => (
                  <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900/50 p-3 rounded-xl shadow-sm border border-white dark:border-slate-700/50">
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{h.name}</p>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400 mt-1">{format(new Date(h.date), 'dd MMMM yyyy')}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold whitespace-nowrap shadow-inner">
                      In {Math.ceil((new Date(h.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clock In / Out Main Action Widget */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Daily Attendance</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {todayRecord?.clock_in_time ? `Clocked in at ${format(new Date(todayRecord.clock_in_time), "hh:mm a")}` : 'You have not clocked in yet.'}
            </p>
          </div>
          
          {!todayRecord ? (
             <Button 
               size="lg" 
               className="h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 font-bold active:scale-95 transition-all"
               onClick={() => handleClockInOut('in')}
               disabled={actionLoading}
             >
               <Fingerprint className="w-5 h-5 mr-2" /> Clock In
             </Button>
          ) : !todayRecord.clock_out_time ? (
             <Button 
               size="lg" 
               className="h-12 rounded-xl bg-[#0a192f] hover:bg-slate-800 text-white shadow-lg shadow-slate-900/30 font-bold active:scale-95 transition-all"
               onClick={() => handleClockInOut('out')}
               disabled={actionLoading}
             >
               <MapPin className="w-5 h-5 mr-2" /> Clock Out
             </Button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" /> Completed
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Present */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[110px]">
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stats.present}</span>
                <span className="text-[10px] font-bold text-green-500 tracking-wider mt-1 uppercase">Present</span>
              </div>
            </div>
            <WaveSVG color="#22c55e33" />
          </div>

          {/* Late */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[110px]">
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stats.late}</span>
                <span className="text-[10px] font-bold text-amber-500 tracking-wider mt-1 uppercase">Late Coming</span>
              </div>
            </div>
            <WaveSVG color="#f59e0b33" />
          </div>

          {/* Half Days */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[110px]">
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-sm">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stats.half_day}</span>
                <span className="text-[10px] font-bold text-orange-500 tracking-wider mt-1 uppercase">Half Days</span>
              </div>
            </div>
            <WaveSVG color="#f9731633" />
          </div>

          {/* Absent */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[110px]">
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stats.absent}</span>
                <span className="text-[10px] font-bold text-red-500 tracking-wider mt-1 uppercase">Absent</span>
              </div>
            </div>
            <WaveSVG color="#ef444433" />
          </div>
        </div>

        {/* Apply for Leave Action */}
          <div 
            onClick={() => navigate('/leaves')}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-5 shadow-sm border border-blue-100 dark:border-blue-800 flex justify-between items-center relative overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-95 mt-3"
          >
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">Apply for Leave</span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Request Time Off</span>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-blue-300 dark:text-blue-500 relative z-10" />
            <FileText className="w-24 h-24 text-blue-500/10 dark:text-blue-400/5 absolute -right-4 -bottom-4 transform rotate-12 pointer-events-none" />
          </div>

      </div>

      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="dark:bg-slate-800 dark:text-white dark:border-slate-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription className="dark:text-slate-400">Update your portal login password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="dark:text-slate-300">New Password</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Must be at least 6 characters"
                className="dark:bg-slate-900 dark:border-slate-700 dark:text-white rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)} className="rounded-xl dark:border-slate-700">Cancel</Button>
            <Button onClick={handlePasswordChange} disabled={actionLoading || newPassword.length < 6} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
