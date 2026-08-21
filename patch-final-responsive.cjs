const fs = require('fs');

// 1. Fix DashboardLayout (Hide live clock on mobile and reduce icon spacing)
let dlCode = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

dlCode = dlCode.replace(
  '<div className="text-sm">',
  '<div className="hidden sm:block text-sm">'
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', dlCode);
console.log("Patched DashboardLayout.tsx");

// 2. Fix HistoryPage
let hCode = fs.readFileSync('src/pages/HistoryPage.tsx', 'utf8');

// The mobile list code:
const mobileList = `
      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading records...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No attendance records found.</p>
        ) : (
          records.map((record) => {
            const reg = regularizationsMap[record.date];
            const isPendingReg = reg && reg.status === 'pending';
            const isApprovedReg = reg && reg.status === 'approved';
            
            return (
              <Card key={record.id} className="p-4 shadow-sm border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 pb-3 mb-3">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {format(parseISO(record.date), 'EEE, MMM dd')}
                  </div>
                  <div className={\`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border \${getStatusColor(record.status)}\`}>
                    {getStatusIcon(record.status)}
                    <span className="ml-1">{formatStatusLabel(record.status)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-slate-400">Clock In</span>
                    <span className="font-medium text-gray-800 dark:text-slate-200">
                      {record.clock_in_time ? format(new Date(record.clock_in_time), 'hh:mm a') : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-slate-400">Clock Out</span>
                    <span className="font-medium text-gray-800 dark:text-slate-200">
                      {record.clock_out_time ? format(new Date(record.clock_out_time), 'hh:mm a') : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                  {isPendingReg ? (
                    <span className="text-xs font-medium text-amber-600">Regularization Pending</span>
                  ) : isApprovedReg ? (
                    <span className="text-xs font-medium text-green-600">Regularized</span>
                  ) : (
                    record.status !== 'holiday' && record.status !== 'approved_leave' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openRegularizeModal(record.date, record.clock_in_time, record.clock_out_time)}
                        className="text-xs h-7"
                      >
                        Regularize
                      </Button>
                    )
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
`;

hCode = hCode.replace(
  '<Card className="shadow-sm border-gray-200 dark:border-slate-700 overflow-hidden dark:bg-slate-800">',
  '      {/* Desktop View */}\n      <Card className="hidden md:block shadow-sm border-gray-200 dark:border-slate-700 overflow-hidden dark:bg-slate-800">'
);

hCode = hCode.replace(
  '</Card>\n\n      <RegularizeDialog',
  '</Card>\n\n' + mobileList + '\n\n      <RegularizeDialog'
);

fs.writeFileSync('src/pages/HistoryPage.tsx', hCode);
console.log("Patched HistoryPage.tsx");

