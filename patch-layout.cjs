const fs = require('fs');

let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

// Add Sheet and Menu imports
if (!code.includes('import { Sheet')) {
  code = code.replace(
    'import { HelpCircle, LogOut, LayoutDashboard, History, Umbrella, CalendarDays, MessageCircle, Bell, Sun, Moon, X } from \'lucide-react\';',
    'import { HelpCircle, LogOut, LayoutDashboard, History, Umbrella, CalendarDays, MessageCircle, Bell, Sun, Moon, X, Menu } from \'lucide-react\';\nimport { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";'
  );
}

// Add state for mobile menu
if (!code.includes('mobileMenuOpen')) {
  code = code.replace(
    'const [showNotifications, setShowNotifications] = useState(false);',
    'const [showNotifications, setShowNotifications] = useState(false);\n  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);'
  );
}

// Mobile sidebar content variable
const mobileSidebarCode = `
  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Portal</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              \`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700/50'
              }\`
            }
          >
            <item.icon className="w-5 h-5 mr-3 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <button 
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
        >
          <HelpCircle className="w-5 h-5 mr-3 shrink-0" />
          Help Desk
        </button>
      </div>
    </>
  );
`;

code = code.replace(
  'return (\n    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors">',
  mobileSidebarCode + '\n  return (\n    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors">'
);

// Update Desktop Sidebar visibility
code = code.replace(
  '<aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col transition-colors">',
  '<aside className="hidden md:flex w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex-col transition-colors">'
);

// DRY up the Desktop Sidebar content
const oldDesktopSidebar = `<div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-slate-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Portal</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                \`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700/50'
                }\`
              }
            >
              <item.icon className="w-5 h-5 mr-3 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <button 
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <HelpCircle className="w-5 h-5 mr-3 shrink-0" />
            Help Desk
          </button>
        </div>`;

code = code.replace(oldDesktopSidebar, '{sidebarContent}');

// Make Header Responsive
code = code.replace(
  '<header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-8 z-10 shrink-0 shadow-sm transition-colors">',
  '<header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 z-10 shrink-0 shadow-sm transition-colors">'
);

const headerMenuButton = `
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 mr-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-white dark:bg-slate-800 border-r-gray-200 dark:border-slate-700 flex flex-col">
                {sidebarContent}
              </SheetContent>
            </Sheet>
`;

code = code.replace(
  '<div className="flex items-center">',
  '<div className="flex items-center">' + headerMenuButton
);

// Responsive Profile text
code = code.replace(
  '<div className="flex flex-col mr-4">',
  '<div className="hidden sm:flex flex-col mr-4">'
);
code = code.replace(
  '<div className="flex items-center space-x-6">',
  '<div className="flex items-center space-x-2 md:space-x-6">'
);


// Adjust Page Content padding
code = code.replace(
  '<div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900 p-8 transition-colors">',
  '<div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 md:p-8 transition-colors">'
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Patched DashboardLayout.tsx");
