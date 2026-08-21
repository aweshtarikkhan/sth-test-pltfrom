const fs = require('fs');

let code = fs.readFileSync('src/pages/LeaveManagementPage.tsx', 'utf8');

const returnStatementRegex = /return \(\s*<div className="max-w-5xl mx-auto space-y-6">([\s\S]*?)<\/div>\s*\);\s*}\s*$/;

const newRender = `return (
    <div className="relative w-full max-w-lg mx-auto md:max-w-5xl pb-6">
      {/* Background Top Banner (AssayBiz Blue) */}
      <div className="absolute -top-8 -left-4 -right-4 h-64 bg-[#0a192f] rounded-b-[40px] z-0 hidden sm:block md:hidden"></div>

      <div className="relative z-10 space-y-5 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 md:px-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-white md:dark:text-white mb-1">Leave Management</h1>
            <p className="text-gray-500 dark:text-slate-400 sm:text-blue-100/80 md:dark:text-slate-400 text-sm font-medium">Track and apply for leaves</p>
          </div>
          <Button 
            onClick={() => setApplyOpen(true)}
            className="w-full sm:w-auto h-12 sm:h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl sm:rounded-xl shadow-lg shadow-orange-500/20 font-bold active:scale-95 transition-all"
          >
            <Umbrella className="w-5 h-5 sm:w-4 sm:h-4 mr-2" /> Apply for Leave
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="col-span-1 bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Leave Balances</h3>
            <div className="space-y-4">
              {[
                { key: 'casual', label: 'Casual Leave', color: 'bg-blue-500' },
                { key: 'sick',   label: 'Sick Leave',   color: 'bg-orange-500' },
                { key: 'paid',   label: 'Paid Leave',   color: 'bg-green-500' },
              ].map(({ key, label, color }) => {
                const b = leaveBalances[key] || { used: 0, accrued: 0, annual: 0 };
                const remaining = Math.max(0, b.annual - b.used);
                const pct = b.annual > 0 ? Math.min(100, (b.used / b.annual) * 100) : 0;
                return (
                  <div key={key} className="p-4 rounded-2xl bg-gray-50/80 dark:bg-slate-900/50 border border-gray-100/50 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-700 dark:text-slate-300 text-sm">{label}</span>
                      <span className="text-sm font-black text-[#0a192f] dark:text-white">{remaining} left</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-slate-500 mb-2">{b.used} used of {b.annual}</div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={\`h-2 rounded-full \${pct >= 100 ? 'bg-red-500' : color}\`}
                        style={{ width: \`\${pct}%\` }}
                      />
                    </div>
                  </div>
                );
              })}
              {loading && <p className="text-xs font-bold text-gray-400 text-center">Loading balances...</p>}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Leave History</h3>
            <div>
              {loading ? (
                <p className="text-gray-500 dark:text-slate-400 font-bold text-center py-8">Loading history...</p>
              ) : leaves.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Umbrella className="w-8 h-8 text-blue-200 dark:text-slate-600" />
                  </div>
                  <p className="text-gray-900 dark:text-white font-bold">No leave requests found.</p>
                  <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Your leave history will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves.map((leave) => (
                    <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-bold text-gray-900 dark:text-white capitalize">{leave.leave_type} Leave</span>
                          {getStatusBadge(leave.status)}
                        </div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                          {format(parseISO(leave.start_date), 'MMM dd, yyyy')} - {format(parseISO(leave.end_date), 'MMM dd, yyyy')} 
                          <span className="mx-2 text-gray-300 dark:text-slate-600">•</span> 
                          {leave.days} day(s)
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-2 font-medium bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-gray-100 dark:border-slate-700">"{leave.reason}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription className="dark:text-slate-400">Submit a new leave application to HR.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-300 font-bold text-xs uppercase tracking-wider">Start Date</Label>
                <Input 
                  type="date" 
                  value={leaveData.startDate} 
                  onChange={e => setLeaveData({...leaveData, startDate: e.target.value})}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="dark:bg-slate-900 dark:border-slate-700 dark:text-white rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300 font-bold text-xs uppercase tracking-wider">End Date</Label>
                <Input 
                  type="date" 
                  value={leaveData.endDate} 
                  onChange={e => setLeaveData({...leaveData, endDate: e.target.value})}
                  min={leaveData.startDate || format(new Date(), 'yyyy-MM-dd')}
                  className="dark:bg-slate-900 dark:border-slate-700 dark:text-white rounded-xl h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300 font-bold text-xs uppercase tracking-wider">Leave Type</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                value={leaveData.leaveType}
                onChange={e => setLeaveData({...leaveData, leaveType: e.target.value})}
              >
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="paid">Paid Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300 font-bold text-xs uppercase tracking-wider">Reason</Label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                placeholder="Brief reason for your leave..."
                value={leaveData.reason}
                onChange={e => setLeaveData({...leaveData, reason: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl h-12 font-bold">Cancel</Button>
            <Button onClick={handleApplyLeave} disabled={actionLoading} className="bg-orange-500 text-white hover:bg-orange-600 rounded-xl h-12 font-bold shadow-lg shadow-orange-500/20 mt-2 sm:mt-0">
              {actionLoading ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;

if (returnStatementRegex.test(code)) {
  code = code.replace(returnStatementRegex, newRender);
  fs.writeFileSync('src/pages/LeaveManagementPage.tsx', code);
  console.log("LeaveManagementPage patched successfully!");
} else {
  console.log("Could not match the return statement in LeaveManagementPage.tsx");
}
