const fs = require('fs');

let code = fs.readFileSync('src/pages/HistoryPage.tsx', 'utf8');

const returnStatementRegex = /return \(\s*<div className="max-w-5xl mx-auto space-y-6">([\s\S]*?)<\/div>\s*\);\s*}\s*$/;

const newRender = `return (
    <div className="relative w-full max-w-lg mx-auto md:max-w-5xl pb-6">
      {/* Background Top Banner (AssayBiz Blue) */}
      <div className="absolute -top-8 -left-4 -right-4 h-64 bg-[#0a192f] rounded-b-[40px] z-0 hidden sm:block md:hidden"></div>

      <div className="relative z-10 space-y-5 mt-2">
        {/* Header and Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="px-1 md:px-0 text-gray-900 md:text-gray-900 dark:text-white sm:text-white md:dark:text-white">
            <h1 className="text-2xl font-bold mb-1">Attendance History</h1>
            {employeeShift && (
              <p className="text-xs opacity-90 font-medium">
                Shift: {employeeShift.name} ({employeeShift.start_time?.slice(0,5)} - {employeeShift.end_time?.slice(0,5)}) &bull; Grace: {employeeShift.grace_minutes ?? 15}m
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 dark:border-slate-700 self-start sm:self-auto shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-full dark:hover:bg-slate-700 hover:bg-orange-50 text-orange-600 dark:text-orange-400">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="font-bold text-gray-800 dark:text-white w-28 text-center text-sm">
              {format(currentMonth, 'MMM yyyy')}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth}
              disabled={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) > new Date()}
              className="h-8 w-8 rounded-full dark:hover:bg-slate-700 hover:bg-orange-50 text-orange-600 dark:text-orange-400"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Desktop View */}
        <Card className="hidden md:block rounded-3xl shadow-sm border-gray-100 dark:border-slate-700 overflow-hidden dark:bg-slate-800 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-gray-50/80 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-100 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Clock In</th>
                  <th className="px-6 py-4">Clock Out</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">Loading records...</td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">No attendance records found for this month.</td>
                  </tr>
                ) : (
                  records.map((record) => {
                    const reg = regularizationsMap[record.date];
                    const isPendingReg = reg && reg.status === 'pending';
                    const isApprovedReg = reg && reg.status === 'approved';

                    return (
                      <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                          {format(parseISO(record.date), 'EEE, MMM dd')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={\`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border \${getStatusColor(record.status)}\`}>
                            {getStatusIcon(record.status)}
                            <span className="ml-1.5">{formatStatusLabel(record.status)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-slate-200 font-medium">
                          {record.clock_in_time ? (
                            <div className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                              {format(new Date(record.clock_in_time), 'hh:mm a')}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-slate-200 font-medium">
                          {record.clock_out_time ? (
                            <div className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                              {format(new Date(record.clock_out_time), 'hh:mm a')}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {isPendingReg ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </span>
                          ) : isApprovedReg ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Regularized
                            </span>
                          ) : (
                            record.status !== 'holiday' && record.status !== 'approved_leave' && (
                              <Button 
                                variant="outline" 
                                onClick={() => openRegularizeModal(record.date, record.clock_in_time, record.clock_out_time)}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/30 h-8 rounded-xl font-bold text-xs"
                              >
                                Regularize
                              </Button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <p className="text-center text-gray-500 py-8 font-medium">Loading records...</p>
          ) : records.length === 0 ? (
            <p className="text-center text-gray-500 py-8 font-medium">No attendance records found.</p>
          ) : (
            records.map((record) => {
              const reg = regularizationsMap[record.date];
              const isPendingReg = reg && reg.status === 'pending';
              const isApprovedReg = reg && reg.status === 'approved';
              
              return (
                <div key={record.id} className="p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-700/50 pb-3 mb-3">
                    <div className="font-bold text-gray-900 dark:text-white text-base">
                      {format(parseISO(record.date), 'EEE, MMM dd')}
                    </div>
                    <div className={\`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border \${getStatusColor(record.status)}\`}>
                      {getStatusIcon(record.status)}
                      <span className="ml-1">{formatStatusLabel(record.status)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3 bg-gray-50/50 dark:bg-slate-900/20 p-3 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-0.5">Clock In</span>
                      <span className="font-bold text-gray-800 dark:text-slate-200">
                        {record.clock_in_time ? format(new Date(record.clock_in_time), 'hh:mm a') : '-'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-0.5">Clock Out</span>
                      <span className="font-bold text-gray-800 dark:text-slate-200">
                        {record.clock_out_time ? format(new Date(record.clock_out_time), 'hh:mm a') : '-'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-1 flex justify-end">
                    {isPendingReg ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">Pending Review</span>
                    ) : isApprovedReg ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">Regularized</span>
                    ) : (
                      record.status !== 'holiday' && record.status !== 'approved_leave' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openRegularizeModal(record.date, record.clock_in_time, record.clock_out_time)}
                          className="text-xs h-8 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 font-bold"
                        >
                          Regularize
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <RegularizeDialog
          open={regDialogOpen}
          onOpenChange={setRegDialogOpen}
          employee={employee}
          defaultDate={selectedRegDate}
          defaultClockIn={selectedClockIn}
          defaultClockOut={selectedClockOut}
          onSuccess={loadData}
        />
      </div>
    </div>
  );
}`;

if (returnStatementRegex.test(code)) {
  code = code.replace(returnStatementRegex, newRender);
  fs.writeFileSync('src/pages/HistoryPage.tsx', code);
  console.log("HistoryPage patched successfully!");
} else {
  console.log("Could not match the return statement in HistoryPage.tsx");
}
