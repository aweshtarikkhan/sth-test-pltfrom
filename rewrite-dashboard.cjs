const fs = require('fs');

const code = `import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CalendarDays, MapPin, CheckCircle2, AlertCircle, XCircle, FileText, Lock, User, ChevronRight, Fingerprint } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
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
          { data: leaveBalData }
        ] = await Promise.all([
          supabase.from('attendances').select('*').eq('employee_id', empData.id).gte('date', start).lte('date', end),
          supabase.from('attendances').select('*').eq('employee_id', empData.id).eq('date', today).maybeSingle(),
          supabase.from('holidays').select('*').eq('org_id', empData.org_id).gte('date', today).order('date', { ascending: true }).limit(2),
          supabase.from('shifts').select('*').eq('id', empData.shift_id).single(),
          supabase.from('leave_balances').select('*').eq('employee_id', empData.id)
        ]);

        if (shiftData) setEmployeeShift(shiftData);
        if (todayData) setTodayRecord(todayData);
        if (holsData) setUpcomingHolidays(holsData);

        let p = 0, l = 0, a = 0, h = 0;
        (monthData || []).forEach(record => {
          const status = record.status || 'absent';
          if (status === 'present') p++;
          else if (status === 'late') l++;
          else if (status === 'half_day' || status === 'half-day') h++;
          else if (status === 'absent') a++;
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

  const handleClockInOut = async (type: 'in' | 'out') => {
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

  return (
    <div className="relative w-full max-w-lg mx-auto md:max-w-4xl pb-6">
      {/* Background Top Banner (AssayBiz Blue) */}
      <div className="absolute -top-8 -left-4 -right-4 h-64 bg-[#0a192f] rounded-b-[40px] z-0 hidden sm:block md:hidden"></div>

      <div className="relative z-10 space-y-5 mt-2">
        
        {/* Welcome Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex justify-between items-center border border-gray-100 dark:border-slate-700">
          <div className="flex-1">
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Good Morning,</p>
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
              <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></div> Late up to 10:30</span>
              <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></div> Half day up to 14:00</span>
            </div>
          </div>
          
          {/* Avatar Illustration Placeholder */}
          <div className="w-24 h-24 shrink-0 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden ml-2">
            <User className="w-12 h-12 text-blue-300 dark:text-slate-500" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => navigate('/leaves')}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Apply for Leave</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">Request time off</p>
            </div>
          </div>

          <div 
            onClick={() => setChangePasswordOpen(true)}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Password</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">Update password</p>
            </div>
          </div>
        </div>

        {/* Clock In / Out Main Action Widget */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Daily Attendance</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {todayRecord?.clock_in_time ? \`Clocked in at \${format(new Date(todayRecord.clock_in_time), "hh:mm a")}\` : 'You have not clocked in yet.'}
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

        {/* Leaves Left */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl p-5 shadow-sm border border-blue-100 dark:border-blue-900/30 flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">{stats.leaves_left}</span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Leaves Left</span>
            </div>
          </div>
          <FileText className="w-24 h-24 text-blue-500/10 dark:text-blue-400/5 absolute -right-4 -bottom-4 transform rotate-12 pointer-events-none" />
        </div>

        {/* Upcoming Holiday */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-sm">
              <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Upcoming Holiday
            </div>
            <Button variant="ghost" className="h-6 text-xs text-blue-600 dark:text-blue-400 p-0 hover:bg-transparent" onClick={() => navigate('/holidays')}>View All</Button>
          </div>
          
          {upcomingHolidays.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-slate-400">No upcoming holidays.</p>
          ) : (
            <div className="space-y-3">
              {upcomingHolidays.map((h, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-700/50 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{h.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{format(new Date(h.date), 'dd MMMM yyyy')}</p>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold whitespace-nowrap">
                    In {Math.ceil((new Date(h.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days
                  </div>
                </div>
              ))}
            </div>
          )}
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
`;
fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Rewrote Dashboard.tsx");
