const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// 1. Change sender username to name
code = code.replace(
  /msg\.sender\?\.username/g,
  'msg.sender?.name'
);

// 2. Add Info button for groups as well
code = code.replace(
  /\{selectedType === 'dm' && \(\s*<div className="flex gap-1">\s*<Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-full" onClick=\{\(\) => setShowInfoDialog\(true\)\}><Info className="w-4 h-4" \/><\/Button>\s*<\/div>\s*\)\}/,
  `{(selectedType === 'dm' || selectedType === 'group') && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-full" onClick={() => setShowInfoDialog(true)}><Info className="w-4 h-4" /></Button>
                    </div>
                  )}`
);

// 3. Render the Info Dialog
const infoDialog = `
      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-sm dark:bg-slate-800 dark:border-slate-700 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="dark:text-white font-bold">
              {selectedType === 'dm' ? 'Profile Info' : 'Group Info'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedType === 'dm' && selectedTarget && (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-3xl flex items-center justify-center font-bold text-3xl overflow-hidden">
                  {selectedTarget.avatar_url || selectedTarget.profile_image ? (
                    <img src={selectedTarget.avatar_url || selectedTarget.profile_image} className="w-full h-full object-cover" alt="" />
                  ) : (
                    (selectedTarget.name || '?').charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTarget.name}</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{selectedTarget.designation || 'Employee'}</p>
                  {selectedTarget.username && (
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">@{selectedTarget.username}</p>
                  )}
                </div>
              </div>
            )}
            
            {selectedType === 'group' && selectedTarget && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTarget.name}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Created by {selectedTarget.created_by === employee?.id ? 'You' : 'Admin'}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Group Members</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {(() => {
                       // We'll show all employees since we don't have members fetched synchronously,
                       // OR we can just fetch them dynamically, but React state is better.
                       // For simplicity since group features are new, let's render a message or fetch on mount!
                       return <GroupMembersList groupId={selectedTarget.id} supabase={supabase} currentUserId={employee?.id} employeeList={employeeList} />
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
`;

// Insert infoDialog before the closing div
code = code.replace(
  /<\/div>\s*<\/div>\s*<Dialog open=\{showCreateGroup\}/,
  `</div>\n      </div>\n${infoDialog}\n      <Dialog open={showCreateGroup}`
);

// Inject GroupMembersList component at the top of the file or above ChatPage
const groupMembersListCode = `
function GroupMembersList({ groupId, supabase, currentUserId, employeeList }: any) {
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('chat_group_members')
        .select('employee_id')
        .eq('group_id', groupId);
      
      if (data) {
        const memberIds = data.map((d: any) => d.employee_id);
        const mems = employeeList.filter((e: any) => memberIds.includes(e.id));
        setMembers(mems);
      }
      setLoading(false);
    };
    if (groupId) fetchMembers();
  }, [groupId]);

  if (loading) return <div className="text-sm text-gray-400">Loading members...</div>;
  if (members.length === 0) return <div className="text-sm text-gray-400">No members found.</div>;

  return (
    <>
      {members.map(m => (
        <div key={m.id} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-slate-300 overflow-hidden">
            {m.avatar_url || m.profile_image ? <img src={m.avatar_url || m.profile_image} className="w-full h-full object-cover" /> : (m.name || '?').charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{m.name} {m.id === currentUserId && '(You)'}</p>
            <p className="text-[10px] text-gray-500 truncate">{m.designation || 'Employee'}</p>
          </div>
        </div>
      ))}
    </>
  );
}

function ChatPage`;

code = code.replace(/function ChatPage/, groupMembersListCode);

// Add React import if missing
if (!code.includes('import React')) {
  code = code.replace(/import \{ useState/, 'import React, { useState');
}

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed chat page');
