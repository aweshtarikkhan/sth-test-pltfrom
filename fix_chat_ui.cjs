const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// 1. Add avatar_url and profile_image to select
code = code.replace(
  /\.select\('id, name, username, designation, role, org_id'\)/,
  `.select('id, name, username, designation, role, org_id, avatar_url, profile_image')`
);
// wait, the actual select might not be exactly that.
// Let's use regex to find the employee select.
code = code.replace(
  /\.select\(['"](.*designation.*)['"]\)/,
  `.select('id, name, username, designation, role, org_id, auth_user_id, avatar_url, profile_image')`
);

// 2. Remove Phone and Video buttons
const buttonsRegex = /<Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600\s*rounded-full"><Phone className="w-4 h-4" \/><\/Button>\s*<Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600\s*rounded-full"><Video className="w-4 h-4" \/><\/Button>/;
code = code.replace(buttonsRegex, '');

// 3. Info button action
// Currently it's:
// <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-full"><Info className="w-4 h-4" /></Button>
// I need to add an onClick to set a state for showing info dialog.
code = code.replace(
  /<Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600(\s*)rounded-full"><Info className="w-4 h-4" \/><\/Button>/,
  `<Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600$1rounded-full" onClick={() => setShowInfoDialog(true)}><Info className="w-4 h-4" /></Button>`
);

// 4. Add state for showInfoDialog
if (!code.includes('showInfoDialog')) {
  code = code.replace(
    /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
    `const [searchQuery, setSearchQuery] = useState('');\n  const [showInfoDialog, setShowInfoDialog] = useState(false);`
  );
}

// 5. Add Info Dialog JSX at the end of the return statement
const infoDialogJsx = `
      {/* User Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Info</DialogTitle>
          </DialogHeader>
          {selectedTarget && (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center font-bold text-4xl overflow-hidden shadow-sm">
                {selectedTarget.avatar_url || selectedTarget.profile_image ? (
                  <img src={selectedTarget.avatar_url || selectedTarget.profile_image} alt={selectedTarget.name} className="w-full h-full object-cover" />
                ) : (
                  (selectedTarget.name || '?').charAt(0)
                )}
              </div>
              <div className="text-center">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">{selectedTarget.name}</h3>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">{selectedTarget.designation || selectedTarget.role || 'Employee'}</p>
                <p className="text-xs text-gray-500 mt-2">@{selectedTarget.username || selectedTarget.name?.toLowerCase().replace(/\\s+/g, '')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
`;

code = code.replace(/<\/div>\s*<\/div>\s*<\/ErrorBoundary>\s*\);\s*\}/, `${infoDialogJsx}\n    </div>\n  </div>\n    </ErrorBoundary>\n  );\n}`);

// 6. Fix Profile pictures everywhere in ChatPage
// In HR section:
code = code.replace(
  /<div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shadow-sm">\s*\{\(emp\.name \|\| '\?'\)\.charAt\(0\)\}\s*<\/div>/g,
  `<div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
    {emp.avatar_url || emp.profile_image ? <img src={emp.avatar_url || emp.profile_image} className="w-full h-full object-cover" alt="" /> : (emp.name || '?').charAt(0)}
  </div>`
);

// In Colleagues section:
code = code.replace(
  /<div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center font-bold text-lg shadow-sm">\s*\{\(emp\.name \|\| '\?'\)\.charAt\(0\)\}\s*<\/div>/g,
  `<div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
    {emp.avatar_url || emp.profile_image ? <img src={emp.avatar_url || emp.profile_image} className="w-full h-full object-cover" alt="" /> : (emp.name || '?').charAt(0)}
  </div>`
);

// In Chat Header:
code = code.replace(
  /\{selectedType === 'group' \? <Users className="w-5 h-5" \/> : \(selectedTarget\.name \|\| '\?'\)\.charAt\(0\)\}/,
  `{selectedType === 'group' ? <Users className="w-5 h-5" /> : (
    selectedTarget.avatar_url || selectedTarget.profile_image ? <img src={selectedTarget.avatar_url || selectedTarget.profile_image} className="w-full h-full object-cover" alt="" /> : (selectedTarget.name || '?').charAt(0)
  )}`
);
code = code.replace(/<div className="w-10 h-10 bg-orange-100 dark:bg-orange-900\/30 text-orange-600 dark:text-orange-400\s*rounded-2xl flex items-center justify-center font-bold">/, `<div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center font-bold overflow-hidden">`);

// In Message Bubbles:
// There is a place where message sender profile is displayed. Let's see if it's there.
code = code.replace(
  /<div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">\s*\{\(msg\.sender_name \|\| '\?'\)\.charAt\(0\)\}\s*<\/div>/g,
  `<div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm overflow-hidden">
    {msg.sender_avatar || msg.sender_profile_image ? <img src={msg.sender_avatar || msg.sender_profile_image} className="w-full h-full object-cover" alt="" /> : (msg.sender_name || '?').charAt(0)}
  </div>`
);

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Done script');
