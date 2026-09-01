const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// 1. Find Direct Messages section and replace it with HR & Management + Colleagues
const dmStart = code.indexOf('{/* Direct Messages Section */}');
if (dmStart > -1) {
  // Find where this section ends. It's the last thing in the Chats tab.
  // We can just find the end of the `filteredEmployees.map(...)` block or just look for the end of the `chats` wrapper block.
  // Let's replace the whole `filteredEmployees.map` chunk.
  
  const targetRegex = /\{\/\* Direct Messages Section \*\/\}[\s\S]*?\}\)\s*\)\}/;
  
  const newDmBlock = `{/* HR & Management Section */}
                  <div className="mb-4 mt-6">
                    <div className="px-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">HR & Management</span>
                    </div>
                    {filteredEmployees.filter(e => e.designation?.toLowerCase().includes('hr') || e.designation?.toLowerCase().includes('admin') || e.designation?.toLowerCase().includes('manager')).map(emp => {
                        return (
                          <button
                            key={\`emp-\${emp.id}\`}
                            onClick={() => handleUserSelect(emp)}
                            className={\`w-full flex items-center gap-3 p-3 rounded-2xl transition-all \${
                              selectedType === 'dm' && selectedTarget?.id === emp.id
                                ? 'bg-orange-50 dark:bg-orange-900/20 shadow-sm border border-orange-100 dark:border-orange-900/50'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent'
                            }\`}
                          >
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shadow-sm">
                                {(emp.name || '?').charAt(0)}
                              </div>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {emp.name} <span className="ml-2 inline-flex items-center text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">{emp.designation || 'HR'}</span>
                              </p>
                              <p className="text-xs font-medium text-gray-500 truncate">
                                @{emp.username || emp.name.toLowerCase().replace(/\\s+/g, '')}
                              </p>
                            </div>
                          </button>
                        );
                    })}
                  </div>

                  {/* Direct Messages Section */}
                  <div>
                    <div className="px-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Colleagues</span>
                    </div>
                    {filteredEmployees.filter(e => !(e.designation?.toLowerCase().includes('hr') || e.designation?.toLowerCase().includes('admin') || e.designation?.toLowerCase().includes('manager'))).length === 0 ? (
                      <p className="text-xs text-gray-400 px-2 italic font-medium">No users found.</p>
                    ) : (
                      filteredEmployees.filter(e => !(e.designation?.toLowerCase().includes('hr') || e.designation?.toLowerCase().includes('admin') || e.designation?.toLowerCase().includes('manager'))).map(emp => {
                        return (
                          <button
                            key={\`emp-\${emp.id}\`}
                            onClick={() => handleUserSelect(emp)}
                            className={\`w-full flex items-center gap-3 p-3 rounded-2xl transition-all \${
                              selectedType === 'dm' && selectedTarget?.id === emp.id
                                ? 'bg-orange-50 dark:bg-orange-900/20 shadow-sm border border-orange-100 dark:border-orange-900/50'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent'
                            }\`}
                          >
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center font-bold text-lg shadow-sm">
                                {(emp.name || '?').charAt(0)}
                              </div>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{emp.name}</p>
                              <p className="text-xs font-medium text-gray-500 truncate">
                                @{emp.username || emp.name.toLowerCase().replace(/\\s+/g, '')}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}`;
                    
  code = code.replace(targetRegex, newDmBlock);
}

// 2. Remove tabs completely
const tabsRegex = /<div className="flex bg-gray-50 dark:bg-slate-900 rounded-2xl p-1 mb-4">[\s\S]*?<\/button>\s*<\/div>/;
code = code.replace(tabsRegex, '');

// 3. Remove the wrapper `{sidebarTab === 'chats' ? (` and the requests tab
// The code has:
/*
  {sidebarTab === 'chats' ? (
    <>
      {/* Groups Section * /
      ...
    </>
  ) : (
    /* Requests Tab * /
    <div className="space-y-3">
      ...
    </div>
  )}
*/
// It's safer to just replace all `sidebarTab` conditionals if we can match them.
// Actually, since I removed `sidebarTab` from state, we can just replace:
code = code.replace(/\{sidebarTab === 'chats' \? \(\s*<>/, '<>');
code = code.replace(/<\/>\s*\)\s*:\s*\(\s*\/\*\s*Requests Tab\s*\*\/[\s\S]*?<\/div>\s*\)\}/, '</>');

// Let's also remove `sidebarTab` state if it's there
code = code.replace(/const \[sidebarTab, setSidebarTab\].*?;/, '');

// Fix handleUserSelect
code = code.replace(
/const handleUserSelect = \(emp: any\) => \{[\s\S]*?\};/m,
`const handleUserSelect = (emp: any) => {
      setSelectedTarget(emp);
      setSelectedType('dm');
      setSelectedConnection(null);
    };`
);

// Remove Pending Request Banner
const bannerRegex = /\{\/\* Pending Request Banner \*\/\}[\s\S]*?<\/div>\s*\)\}/;
code = code.replace(bannerRegex, '');

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed HR UI');
