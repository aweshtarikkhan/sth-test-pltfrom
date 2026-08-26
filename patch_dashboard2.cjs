const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const handleCancelLeaveOld = `  const handleCancelLeave = async (leaveId: string) => {
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
  };`;

const handleCancelLeaveNew = `  const handleCancelLeave = async (leaveId: string) => {
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
  };`;

content = content.replace(handleCancelLeaveOld, handleCancelLeaveNew);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('patched Dashboard.tsx again');
