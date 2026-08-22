import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Umbrella, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
        const DEFAULT_ANNUAL: Record<string, number> = { casual: 12, sick: 5, paid: 8 };
        const bmap: Record<string, { used: number; accrued: number; annual: number }> = {};
        ['casual', 'sick', 'paid'].forEach((t) => {
          const bal = (balancesRes.data || []).find((b: any) => b.leave_type === t);
          const pol = (policiesRes.data || []).find((p: any) => p.leave_type === t);
          bmap[t] = {
            used: bal?.used ?? 0,
            accrued: bal?.accrued ?? 0,
            annual: pol?.annual_limit ?? DEFAULT_ANNUAL[t] ?? 0,
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
    if (!leaveData.startDate || !leaveData.endDate || !leaveData.reason) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    try {
      const days = (new Date(leaveData.endDate).getTime() - new Date(leaveData.startDate).getTime()) / (1000 * 3600 * 24) + 1;
      
      const { error } = await supabase.from('leaves').insert({
        org_id: employee.org_id,
        employee_id: employee.id,
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
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
            { key: 'sick',   label: 'Sick',   color: 'bg-[#ff6b00]', iconColor: 'text-[#ff6b00]', iconBg: 'bg-orange-50 dark:bg-orange-900/30' },
            { key: 'paid',   label: 'Paid',   color: 'bg-green-500', iconColor: 'text-green-500', iconBg: 'bg-green-50 dark:bg-green-900/30' },
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
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-3xl w-[92vw] max-w-md p-5">
          <DialogHeader className="text-left space-y-1 mb-2">
            <DialogTitle className="text-lg font-bold">Apply for Leave</DialogTitle>
            <DialogDescription className="text-xs font-medium dark:text-slate-400">Submit a new request to HR.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Start Date</Label>
                <Input 
                  type="date" 
                  value={leaveData.startDate} 
                  onChange={e => setLeaveData({...leaveData, startDate: e.target.value})}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="h-10 rounded-xl text-sm dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">End Date</Label>
                <Input 
                  type="date" 
                  value={leaveData.endDate} 
                  onChange={e => setLeaveData({...leaveData, endDate: e.target.value})}
                  min={leaveData.startDate || format(new Date(), 'yyyy-MM-dd')}
                  className="h-10 rounded-xl text-sm dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Leave Type</Label>
              <select 
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                value={leaveData.leaveType}
                onChange={e => setLeaveData({...leaveData, leaveType: e.target.value})}
              >
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="paid">Paid Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Reason</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 resize-none"
                placeholder="Brief reason..."
                value={leaveData.reason}
                onChange={e => setLeaveData({...leaveData, reason: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-4">
            <Button variant="outline" onClick={() => setApplyOpen(false)} className="w-full sm:w-auto h-10 rounded-xl font-bold dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
            <Button onClick={handleApplyLeave} disabled={actionLoading} className="w-full sm:w-auto h-10 bg-orange-500 text-white hover:bg-orange-600 rounded-xl font-bold">
              {actionLoading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
