const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// 1. Make header clickable
code = code.replace(
  /<div className="flex items-center gap-3">/,
  '<div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowInfoDialog(true)}>'
);

// 2. Change group icon to initials
code = code.replace(
  /\{selectedType === 'group' \? <Users className="w-5 h-5" \/> : \(/,
  "{selectedType === 'group' ? <span className=\"text-lg\">{selectedTarget.name.substring(0, 2).toUpperCase()}</span> : ("
);

// 3. Insert the Info Dialog before <Dialog open={showCreateGroup}
const infoDialog = `
      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-sm dark:bg-slate-800 dark:border-slate-700 rounded-3xl z-[100]">
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
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center font-bold text-3xl">
                    {selectedTarget.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTarget.name}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Created by {selectedTarget.created_by === employee?.id ? 'You' : 'Admin'}</p>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-100 dark:border-slate-700 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Group Members</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    <GroupMembersList groupId={selectedTarget.id} supabase={supabase} currentUserId={employee?.id} employeeList={employeeList} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
`;

if (!code.includes('<Dialog open={showInfoDialog}')) {
  // Try to insert right before showCreateGroup Dialog
  if (code.includes('<Dialog open={showCreateGroup}')) {
    code = code.replace(
      /<Dialog open=\{showCreateGroup\}/,
      infoDialog + '\n      <Dialog open={showCreateGroup}'
    );
  } else {
    // Fallback: insert before closing div of return
    code = code.replace(
      /<\/div>\s*\)\;\s*\}\s*class ErrorBoundary/,
      infoDialog + '\n    </div>\n  );\n}\n\nclass ErrorBoundary'
    );
  }
}

// 4. Update Mentions logic: "aur name ke alphabet se sort hoe jaye jo likhte jaye ya sleect krke ho jaye mention"
// Meaning: Sort mentions alphabetically and correctly match the typed query
const replaceMentionsLogic = `
                      {groupMembers
                        .filter(m => m.name.toLowerCase().includes(mentionQuery) || (m.username && m.username.toLowerCase().includes(mentionQuery)))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(m => (
`;
code = code.replace(
  /\{groupMembers[\s\S]*?\.map\(m => \(/,
  replaceMentionsLogic
);


fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed dialog info and group icon');
