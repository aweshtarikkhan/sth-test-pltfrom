const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

const newSidebarContent = `
  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-transparent bg-blue-600 dark:bg-blue-900 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shadow-sm">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-wide">Portal</h1>
        </div>
      </div>
      
      {/* Mobile-only profile section */}
      <div className="md:hidden p-4 border-b border-gray-100 dark:border-slate-700 bg-blue-50/50 dark:bg-slate-800/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/80 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg shadow-sm border border-blue-200 dark:border-blue-800 shrink-0">
          {employee?.name?.charAt(0) || 'E'}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900 dark:text-white">{employee?.name || 'Employee'}</span>
          <span className="text-xs text-gray-500 dark:text-slate-400">{employee?.designation || 'Staff'}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              \`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 \${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700/50'
              }\`
            }
          >
            <item.icon className="w-5 h-5 mr-3 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
        <button 
          className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
        >
          <HelpCircle className="w-4 h-4 mr-2 shrink-0" />
          Help Desk
        </button>
      </div>
    </>
  );
`;

// Extract old sidebarContent and replace it
const sidebarContentRegex = /const sidebarContent = \(\s*<>\s*<div className="h-16[\s\S]*?<\/button>\s*<\/div>\s*<\/>\s*\);/;
code = code.replace(sidebarContentRegex, newSidebarContent.trim());

// Hide default close button on SheetContent
code = code.replace(
  '<SheetContent side="left" className="p-0 w-64 bg-white dark:bg-slate-800 border-r-gray-200 dark:border-slate-700 flex flex-col">',
  '<SheetContent side="left" className="p-0 w-72 bg-white dark:bg-slate-800 border-r-gray-200 dark:border-slate-700 flex flex-col [&>button]:hidden">'
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Patched sidebar");
