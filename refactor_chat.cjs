const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// 1. Remove sidebarTab logic
code = code.replace(/const \[sidebarTab, setSidebarTab\] = useState\w*<.*>\('chats'\);/, '');
code = code.replace(/const \[sidebarTab, setSidebarTab\] = useState.*?;/, '');

// 2. Simplify handleUserSelect
code = code.replace(
/const handleUserSelect = \(emp: any\) => \{[\s\S]*?\};/m,
`const handleUserSelect = (emp: any) => {
      setSelectedTarget(emp);
      setSelectedType('dm');
      setSelectedConnection(null);
    };`
);

// 3. Remove pending request banner
const bannerStart = code.indexOf('{/* Pending Request Banner */}');
if (bannerStart > -1) {
  const bannerEnd = code.indexOf('{/* Main Chat Area */}');
  if (bannerEnd > -1) {
    code = code.substring(0, bannerStart) + code.substring(bannerEnd);
  }
}

// 4. In the sidebar, find where `filteredEmployees.map` is, and replace it with TWO maps.
// First, let's locate the entire Direct Messages block.
const dmBlockRegex = /\{\/\* Direct Messages Section \*\/\}[\s\S]*?\{\/\* Groups Section \*\/\}/;
const match = code.match(dmBlockRegex);
if (match) {
  const newDmBlock = `{/* HR / Admin Section */}
                  <div className="mb-4">
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
                                {emp.name} <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{emp.designation || 'HR'}</span>
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
                    )}
                  </div>
                  
                  {/* Groups Section */}`;
  
  code = code.replace(dmBlockRegex, newDmBlock);
}

// 5. Clean up tabs in sidebar
const tabsRegex = /<div className="flex bg-gray-50 dark:bg-slate-900 rounded-2xl p-1 mb-4">[\s\S]*?<\/button>\s*<\/div>/;
code = code.replace(tabsRegex, '');

code = code.replace(/{sidebarTab === 'chats' && \(/g, '{true && (');
code = code.replace(/<div className="space-y-3">\s*\{requests\.length === 0 \? \([\s\S]*?\)\s*\)\s*}/g, ''); // Try to wipe out the requests section if it's there
code = code.replace(/\) : \(\s*\/\* Requests Tab \*\/[\s\S]*?\)\}/, '}'); // Remove the ) : ( ... ) block completely

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Refactored successfully');
