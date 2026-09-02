import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Umbrella, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const LEAVE_OPTIONS = [
  { key: "casual",    label: "Casual Leave" },
  { key: "sick",      label: "Sick Leave" },
  { key: "el_pl",     label: "Paid / Earned Leave" },
  { key: "comp_off",  label: "Compensatory Off" },
  { key: "wfh",       label: "Work From Home" },
  { key: "lwp",       label: "Leave Without Pay" },
  { key: "half_day",  label: "Half Day Leave" },
  { key: "maternity", label: "Maternity / Paternity Leave" },
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
    startDate: "",
    endDate: "",
    leaveType: "casual",
    reason: ""
  });

  const [durationType, setDurationType] = useState<"single" | "multiple">("single");

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: empData } = await supabase.from("employees").select("*").eq("auth_user_id", session.user.id).single();
      if (empData) {
        setEmployee(empData);
        const [leavesRes, balancesRes, policiesRes] = await Promise.all([
          supabase.from("leaves").select("*").eq("employee_id", empData.id).order("created_at", { ascending: false }),
          (supabase as any).from("employee_leave_balances").select("*").eq("employee_id", empData.id),
          (supabase as any).from("leave_policies").select("*").eq("org_id", empData.org_id),
        ]);
        setLeaves(leavesRes.data || []);
        const DEFAULT_ANNUAL: Record<string, number> = { casual: 12, sick: 5, el_pl: 0, comp_off: 0 };
        const ACCRUED_TYPES = ["el_pl", "comp_off"];
        const bmap: Record<string, { used: number; accrued: number; annual: number }> = {};
        ["casual", "sick", "el_pl", "comp_off"].forEach((t) => {
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
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [session]);

  const handleApplyLeave = async () => {
    if (!leaveData.startDate || !leaveData.reason) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const effectiveEnd = durationType === "single" ? leaveData.startDate : leaveData.endDate;
    if (!effectiveEnd) {
      toast({ title: "Error", description: "Please select end date", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      let days = (new Date(effectiveEnd).getTime() - new Date(leaveData.startDate).getTime()) / (1000 * 3600 * 24) + 1;
      if (leaveData.leaveType === "half_day") days = 0.5;
      const TRACKED = ["casual", "sick", "el_pl", "comp_off"];
      if (TRACKED.includes(leaveData.leaveType)) {
        const bal = leaveBalances[leaveData.leaveType] || { used: 0, annual: 0 };
        const remaining = Math.max(0, bal.annual - bal.used);
        if (days > remaining) {
          const typeName = LEAVE_OPTIONS.find(t => t.key === leaveData.leaveType)?.label || leaveData.leaveType;
          toast({ title: "Insufficient Leave Balance", description: `You have ${remaining} day(s) of ${typeName} remaining but applying for ${days} day(s).`, variant: "destructive" });
          setActionLoading(false);
          return;
        }
      }
      const { error } = await supabase.from("leaves").insert({
        org_id: employee.org_id,
        employee_id: employee.id,
        start_date: leaveData.startDate,
        end_date: effectiveEnd,
        leave_type: leaveData.leaveType,
        reason: leaveData.reason,
        days,
        status: "pending"
      });
      if (error) throw error;
      toast({ title: "Success", description: "Leave request submitted successfully" });
      setApplyOpen(false);
      setLeaveData({ startDate: "", endDate: "", leaveType: "casual", reason: "" });
      setDurationType("single");
      loadData();
      await supabase.from("notifications").insert({
        org_id: employee.org_id,
        title: "New Leave Request",
        message: `${employee.name} applied for ${days} day(s) leave.`,
        type: "leave_request"
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</span>;
      case "rejected": return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case "approved": return "border-l-green-500";
      case "rejected": return "border-l-red-500";
      default: return "border-l-yellow-500";
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto md:max-w-5xl px-5 pt-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0a192f] tracking-tight mb-1.5">Leave Management</h1>
        <p className="text-sm font-medium text-gray-500">Track and apply for leaves</p>
      </div>

      <div className="mb-8 overflow-x-auto pb-2 -mx-5 px-5">
        <div className="flex gap-4 min-w-max">
          {[
            { key: "casual",   label: "Casual",    color: "bg-blue-600",   iconColor: "text-blue-600",   iconBg: "bg-blue-50" },
            { key: "el_pl",    label: "Earned/PL", color: "bg-indigo-600", iconColor: "text-indigo-600", iconBg: "bg-indigo-50" },
            { key: "sick",     label: "Sick",      color: "bg-[#ff6b00]",  iconColor: "text-[#ff6b00]",  iconBg: "bg-orange-50" },
            { key: "comp_off", label: "Comp-Off",  color: "bg-teal-500",   iconColor: "text-teal-500",   iconBg: "bg-teal-50" },
          ].map(({ key, label, color, iconColor, iconBg }) => {
            const b = leaveBalances[key] || { used: 0, accrued: 0, annual: 0 };
            const remaining = Math.max(0, b.annual - b.used);
            const pct = b.annual > 0 ? Math.min(100, (b.used / b.annual) * 100) : 0;
            return (
              <div key={key} className="w-[145px] p-5 rounded-[24px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex-shrink-0 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-full ${iconBg}`}>
                    <Umbrella className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <span className="font-bold text-[#0a192f] text-[15px]">{label}</span>
                </div>
                <div className="flex flex-col mt-auto">
                  <span className={`text-[42px] font-black ${iconColor} leading-none tracking-tighter mb-1`}>{remaining}</span>
                  <span className="text-xs font-bold text-gray-400 mb-3">/ {b.annual}</span>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${pct >= 100 ? "bg-red-500" : color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {loading && <p className="text-xs font-bold text-gray-400 mt-2">Loading balances...</p>}
      </div>

      <div onClick={() => setApplyOpen(true)} className="w-full h-[64px] mb-8 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#e66000] hover:to-[#e67e00] text-white rounded-[20px] shadow-[0_8px_24px_rgba(255,107,0,0.25)] flex justify-between items-center px-6 cursor-pointer active:scale-95 transition-all">
        <div className="flex items-center gap-4">
          <Umbrella className="w-6 h-6" />
          <span className="font-bold text-[17px]">Apply for Leave</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <h3 className="text-[19px] font-black text-[#0a192f]">Leave History</h3>
        {loading ? (
          <p className="text-xs font-bold text-gray-500">Loading history...</p>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center mt-4">
            <div className="w-28 h-28 bg-[#f5f8ff] rounded-[40px] flex items-center justify-center mb-5">
              <Umbrella className="w-14 h-14 text-indigo-400" />
            </div>
            <h4 className="text-[17px] font-black text-[#0a192f] mb-2">No requests yet</h4>
            <p className="text-sm font-medium text-gray-500">You have not applied for any leaves.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave) => (
              <div key={leave.id} className={`flex flex-col p-4 rounded-2xl bg-white shadow-sm border border-gray-100 border-l-4 ${getBorderColor(leave.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px] text-[#0a192f]">
                      {LEAVE_OPTIONS.find(l => l.key === leave.leave_type)?.label || leave.leave_type}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      {format(parseISO(leave.start_date), "MMM d")} - {format(parseISO(leave.end_date), "MMM d")}
                    </span>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>
                <p className="text-[13px] text-gray-500 font-medium truncate mt-0.5">{leave.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={applyOpen} onOpenChange={(open) => { setApplyOpen(open); if (!open) { setLeaveData({ startDate: "", endDate: "", leaveType: "casual", reason: "" }); setDurationType("single"); } }}>
        <DialogContent className="rounded-2xl w-[92vw] max-w-md p-6">
          <DialogHeader className="text-left space-y-1 mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a192f]">Apply for Leave</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Fill in the details to submit a leave request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Leave Type</label>
              <select className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-[#0a192f]" value={leaveData.leaveType} onChange={e => setLeaveData({ ...leaveData, leaveType: e.target.value })}>
                {LEAVE_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Duration</label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                <button onClick={() => setDurationType("single")} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${durationType === "single" ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Single Day</button>
                <button onClick={() => setDurationType("multiple")} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${durationType === "multiple" ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Multiple Days</button>
              </div>
            </div>
            {durationType === "single" ? (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Leave Date</label>
                <Input type="date" value={leaveData.startDate} onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value, endDate: e.target.value })} min={format(new Date(), "yyyy-MM-dd")} className="h-11 rounded-xl text-sm" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">From</label>
                  <Input type="date" value={leaveData.startDate} onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })} min={format(new Date(), "yyyy-MM-dd")} className="h-11 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">To</label>
                  <Input type="date" value={leaveData.endDate} onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })} min={leaveData.startDate || format(new Date(), "yyyy-MM-dd")} className="h-11 rounded-xl text-sm" />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Reason</label>
              <div className="relative">
                <textarea className="w-full min-h-[90px] rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 text-[#0a192f]" placeholder="Brief reason for your leave..." maxLength={500} value={leaveData.reason} onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })} />
                <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">{leaveData.reason.length}/500</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setApplyOpen(false)} className="flex-1 h-11 rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleApplyLeave} disabled={actionLoading} className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold">
              {actionLoading ? "Submitting..." : "Submit Leave"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
