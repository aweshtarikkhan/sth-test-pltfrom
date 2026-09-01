import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Umbrella, CheckCircle2, XCircle, Clock, ChevronRight, Briefcase, Baby, Heart, GraduationCap, Gavel, MapPin, Home, Timer, Ban, Coffee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const APPLY_LEAVE_TYPES = [
  { key: 'casual',      label: 'Casual Leave (CL)',         icon: Umbrella,        iconColor: 'text-blue-600',    iconBg: 'bg-blue-50' },
  { key: 'el_pl',       label: 'Earned/Privilege Leave (EL/PL)', icon: Briefcase,  iconColor: 'text-indigo-600',  iconBg: 'bg-indigo-50' },
  { key: 'sick',        label: 'Sick/Medical Leave (SL/ML)', icon: Heart,           iconColor: 'text-orange-600',  iconBg: 'bg-orange-50' },
  { key: 'comp_off',    label: 'Compensatory Off (CO)',      icon: Coffee,          iconColor: 'text-teal-600',    iconBg: 'bg-teal-50' },
  { key: 'maternity',   label: 'Maternity Leave',            icon: Baby,            iconColor: 'text-pink-600',    iconBg: 'bg-pink-50' },
  { key: 'paternity',   label: 'Paternity Leave',            icon: Baby,            iconColor: 'text-cyan-600',    iconBg: 'bg-cyan-50' },
  { key: 'bereavement', label: 'Bereavement Leave',          icon: Heart,           iconColor: 'text-slate-600',   iconBg: 'bg-slate-100' },
  { key: 'marriage',    label: 'Marriage Leave',             icon: Heart,           iconColor: 'text-rose-600',    iconBg: 'bg-rose-50' },
  { key: 'study',       label: 'Study/Sabbatical',           icon: GraduationCap,   iconColor: 'text-violet-600',  iconBg: 'bg-violet-50' },
  { key: 'jury_duty',   label: 'Jury Duty',                  icon: Gavel,           iconColor: 'text-stone-600',   iconBg: 'bg-stone-50' },
  { key: 'od',          label: 'On Duty (OD)',               icon: MapPin,          iconColor: 'text-sky-600',     iconBg: 'bg-sky-50' },
  { key: 'wfh',         label: 'Work From Home (WFH)',       icon: Home,            iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  { key: 'half_day',    label: 'Half-Day Leave',             icon: Timer,           iconColor: 'text-amber-600',   iconBg: 'bg-amber-50' },
  { key: 'lwp',         label: 'Leave Without Pay (LWP)',    icon: Ban,             iconColor: 'text-red-600',     iconBg: 'bg-red-50' },
];

export default function LeaveManagementPage({ session }: { session: any }) {
  const [employee, setEmployee] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const [leaveBalances, setLeaveBalances] = useState<Record<string, { used: number; accrued: number; annual: number }>>({});

  const [leaveData, setLeaveData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'casual',
    reason: ''
  });

  const [leaveSearch, setLeaveSearch] = useState('');
  const [durationType, setDurationType] = useState<'single' | 'multiple'>('single');
  const [sessionType, setSessionType] = useState('full');

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

        const [leavesRes, balancesRes, policiesRes] = await Promise.all([
          supabase.from('leaves').select('*').eq('employee_id', empData.id).order('created_at', { ascending: false }),
          (supabase as any).from('employee_leave_balances').select('*').eq('employee_id', empData.id),
          (supabase as any).from('leave_policies').select('*').eq('org_id', empData.org_id),
        ]);

        setLeaves(leavesRes.data || []);

        // Build balance map
        const DEFAULT_ANNUAL: Record<string, number> = { casual: 12, sick: 5, el_pl: 0, comp_off: 0 };
        const ACCRUED_TYPES = ['el_pl', 'comp_off'];
        const bmap: Record<string, { used: number; accrued: number; annual: number }> = {};
        ['casual', 'sick', 'el_pl', 'comp_off'].forEach((t) => {
          const bal = (balancesRes.data || []).find((b: any) => b.leave_type === t);
          const pol = (policiesRes.data || []).find((p: any) => p.leave_type === t);
          const isAccrued = ACCRUED_TYPES.includes(t);
          bmap[t] = {
            used: bal?.used ?? 0,
            accrued: bal?.accrued ?? 0,
            annual: isAccrued ? (bal?.accrued ?? 0) : (pol?.annual_limit ?? DEFAULT_ANNUAL[t] ?? 0),
          };
        });
        setLeaveBalances(bmap);
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

  const handleApplyLeave = async () => {
    if (!leaveData.startDate || !leaveData.reason) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    const effectiveEnd = durationType === 'single' ? leaveData.startDate : leaveData.endDate;
    if (!effectiveEnd) {
      toast({ title: 'Error', description: 'Please select end date', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    try {
      let days = (new Date(effectiveEnd).getTime() - new Date(leaveData.startDate).getTime()) / (1000 * 3600 * 24) + 1;
      if (durationType === 'single' && sessionType !== 'full') {
        days = 0.5;
      }
      
      const { error } = await supabase.from('leaves').insert({
        org_id: employee.org_id,
        employee_id: employee.id,
        start_date: leaveData.startDate,
        end_date: effectiveEnd,
        leave_type: leaveData.leaveType,
        reason: leaveData.reason,
        days: days,
        status: 'pending'
      });

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Leave request submitted successfully' });
      setApplyOpen(false);
      setLeaveData({ startDate: '', endDate: '', leaveType: 'casual', reason: '' });
      loadData();
      
      // Notify HR
      await supabase.from('notifications').insert({
        org_id: employee.org_id,
        title: 'New Leave Request',
        message: `${employee.name} applied for ${days} day(s) leave.`,
        type: 'leave_request'
      });

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</span>;
      case 'rejected': return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
    }
  };

  const getBorderColor = (status: string) => {
    switch(status) {
      case 'approved': return 'border-l-green-500';
      case 'rejected': return 'border-l-red-500';
      default: return 'border-l-yellow-500';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto md:max-w-5xl px-5 pt-8 relative overflow-hidden">
      
      {/* 3D Calendar illustration mockup using simple CSS shapes in the background, but we'll stick to a clean UI */}
      <div className="relative z-10 mb-8">
        <h1 className="text-3xl font-black text-[#0a192f] dark:text-white tracking-tight mb-1.5">Leave Management</h1>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Track and apply for leaves</p>
      </div>

      <div className="mb-8 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
        <div className="flex gap-4 min-w-max">
          {[
            { key: 'casual', label: 'Casual', color: 'bg-blue-600', iconColor: 'text-blue-600', iconBg: 'bg-blue-50 dark:bg-blue-900/30' },
            { key: 'el_pl',  label: 'Earned/PL', color: 'bg-indigo-600', iconColor: 'text-indigo-600', iconBg: 'bg-indigo-50 dark:bg-indigo-900/30' },
            { key: 'sick',   label: 'Sick',   color: 'bg-[#ff6b00]', iconColor: 'text-[#ff6b00]', iconBg: 'bg-orange-50 dark:bg-orange-900/30' },
            { key: 'comp_off', label: 'Comp-Off', color: 'bg-teal-500', iconColor: 'text-teal-500', iconBg: 'bg-teal-50' },
          ].map(({ key, label, color, iconColor, iconBg }) => {
            const b = leaveBalances[key] || { used: 0, accrued: 0, annual: 0 };
            const remaining = Math.max(0, b.annual - b.used);
            const pct = b.annual > 0 ? Math.min(100, (b.used / b.annual) * 100) : 0;
            return (
              <div key={key} className="w-[145px] p-5 rounded-[24px] bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-700 flex-shrink-0 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-full ${iconBg}`}>
                    <Umbrella className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <span className="font-bold text-[#0a192f] dark:text-white text-[15px]">{label}</span>
                </div>
                <div className="flex flex-col mt-auto">
                  <span className={`text-[42px] font-black ${iconColor} leading-none tracking-tighter mb-1`}>{remaining}</span>
                  <span className="text-xs font-bold text-gray-400 dark:text-slate-500 mb-3">/ {b.annual}</span>
                  
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {loading && <p className="text-xs font-bold text-gray-400 mt-2">Loading balances...</p>}
      </div>

      <div 
        onClick={() => setApplyOpen(true)}
        className="w-full h-[64px] mb-8 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#e66000] hover:to-[#e67e00] text-white rounded-[20px] shadow-[0_8px_24px_rgba(255,107,0,0.25)] flex justify-between items-center px-6 cursor-pointer active:scale-95 transition-all"
      >
        <div className="flex items-center gap-4">
          <Umbrella className="w-6 h-6" />
          <span className="font-bold text-[17px]">Apply for Leave</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[19px] font-black text-[#0a192f] dark:text-white">Leave History</h3>
          <span className="text-xs font-bold text-[#ff6b00] cursor-pointer flex items-center gap-0.5">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
        
        {loading ? (
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400">Loading history...</p>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center mt-4">
            <div className="w-28 h-28 bg-[#f5f8ff] dark:bg-blue-900/10 rounded-[40px] flex items-center justify-center mb-5 relative">
              <Umbrella className="w-14 h-14 text-indigo-400" />
            </div>
            <h4 className="text-[17px] font-black text-[#0a192f] dark:text-white mb-2">No requests yet</h4>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">You haven't applied for any leaves.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave) => (
              <div 
                key={leave.id} 
                className={`flex flex-col p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 border-l-4 ${getBorderColor(leave.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px] text-[#0a192f] dark:text-white capitalize">{leave.leave_type}</span>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                      {format(parseISO(leave.start_date), 'MMM d')} - {format(parseISO(leave.end_date), 'MMM d')}
                    </span>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>
                <p className="text-[13px] text-gray-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {leave.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-3xl w-[95vw] max-w-[820px] p-0 overflow-hidden max-h-[90vh]">
          <div className="p-6 pb-2">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold text-[#0a192f] dark:text-white">Apply for Leave</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-slate-400">Fill in the details below to apply for leave</DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 px-6 overflow-y-auto max-h-[60vh]">
            {/* LEFT — Select Leave Type */}
            <div>
              <h3 className="text-sm font-bold text-[#0a192f] dark:text-white mb-1">1. Select Leave Type</h3>
              <p className="text-xs text-gray-400 mb-3">Choose the type of leave you want to apply for</p>

              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search leave type..."
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={leaveSearch}
                  onChange={e => setLeaveSearch(e.target.value)}
                />
                <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
                {APPLY_LEAVE_TYPES.filter(t => t.label.toLowerCase().includes(leaveSearch.toLowerCase())).map(t => {
                  const bal = leaveBalances[t.key] || { used: 0, accrued: 0, annual: 0 };
                  const avail = Math.max(0, bal.annual - bal.used);
                  const isSelected = leaveData.leaveType === t.key;
                  return (
                    <div
                      key={t.key}
                      onClick={() => setLeaveData({ ...leaveData, leaveType: t.key })}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 border-2 border-transparent'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.iconBg}`}>
                        <t.icon className={`w-4 h-4 ${t.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0a192f] dark:text-white truncate">{t.label}</p>
                        <p className="text-[11px] text-gray-400">{avail} days available</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Balance Summary */}
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/30">
                <p className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1.5 mb-2">
                  <Umbrella className="w-3.5 h-3.5" /> Leave Balance Summary
                </p>
                <div className="space-y-1">
                  {[
                    { key: 'casual', label: 'Casual Leave (CL)' },
                    { key: 'el_pl', label: 'Earned Leave (EL)' },
                    { key: 'sick', label: 'Sick Leave (SL)' },
                    { key: 'comp_off', label: 'Comp-Off (CO)' },
                  ].map(({ key, label }) => {
                    const b = leaveBalances[key] || { used: 0, annual: 0 };
                    return (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-slate-400">{label}</span>
                        <span className="font-bold text-[#0a192f] dark:text-white">{Math.max(0, b.annual - b.used)} days</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT — Leave Details */}
            <div>
              <h3 className="text-sm font-bold text-[#0a192f] dark:text-white mb-1 mt-4 md:mt-0">2. Leave Details</h3>
              <p className="text-xs text-gray-400 mb-3">Provide your leave date and duration</p>

              {/* Duration Toggle */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Leave Duration</p>
                <div className="flex rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button onClick={() => setDurationType('single')} className={`flex-1 py-2 text-sm font-semibold transition-all ${durationType === 'single' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Single Day</button>
                  <button onClick={() => setDurationType('multiple')} className={`flex-1 py-2 text-sm font-semibold transition-all ${durationType === 'multiple' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Multiple Days</button>
                </div>
              </div>

              {/* Date Inputs */}
              <div className={`mb-4 ${durationType === 'multiple' ? 'grid grid-cols-2 gap-3' : ''}`}>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">{durationType === 'single' ? 'Leave Date' : 'From'}</p>
                  <Input
                    type="date"
                    value={leaveData.startDate}
                    onChange={e => {
                      const val = e.target.value;
                      setLeaveData({ ...leaveData, startDate: val, endDate: durationType === 'single' ? val : leaveData.endDate });
                    }}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="h-10 rounded-xl text-sm dark:bg-slate-900 dark:border-slate-700"
                  />
                </div>
                {durationType === 'multiple' && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">To</p>
                    <Input
                      type="date"
                      value={leaveData.endDate}
                      onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })}
                      min={leaveData.startDate || format(new Date(), 'yyyy-MM-dd')}
                      className="h-10 rounded-xl text-sm dark:bg-slate-900 dark:border-slate-700"
                    />
                  </div>
                )}
              </div>

              {/* Session (Half Day) */}
              {durationType === 'single' && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Session (Half Day)</p>
                  <div className="flex rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    {[{ v: 'full', l: 'Full Day' }, { v: 'first_half', l: 'First Half (AM)' }, { v: 'second_half', l: 'Second Half (PM)' }].map(s => (
                      <button key={s.v} onClick={() => setSessionType(s.v)} className={`flex-1 py-2 text-xs font-semibold transition-all ${sessionType === s.v ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>{s.l}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[#0a192f] dark:text-white mb-1">3. Reason for Leave</h3>
                <p className="text-xs text-gray-400 mb-2">Please provide reason for your leave</p>
                <div className="relative">
                  <textarea
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Brief reason for your leave..."
                    maxLength={500}
                    value={leaveData.reason}
                    onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">{leaveData.reason.length}/500</span>
                </div>
              </div>

              {/* Important Notes */}
              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30">
                <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1.5">📋 Important Notes</p>
                <ul className="text-[11px] text-red-600 dark:text-red-400/80 space-y-1">
                  <li>• Your leave application will be sent to HR for approval.</li>
                  <li>• You will be notified once your leave is approved or rejected.</li>
                  <li>• Please ensure you have sufficient balance before applying.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-100 dark:border-slate-700">
            <Button variant="outline" onClick={() => setApplyOpen(false)} className="h-10 px-6 rounded-xl font-bold dark:border-slate-700">Cancel</Button>
            <Button onClick={handleApplyLeave} disabled={actionLoading} className="h-10 px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold">
              {actionLoading ? "Submitting..." : "Submit Leave"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
