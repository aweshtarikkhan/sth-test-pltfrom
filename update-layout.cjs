const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

// 1. Add Settings icon import
if (!code.includes('Settings')) {
  code = code.replace("LogOut, MessageCircle, Moon, Sun, X, CheckCircle2, Menu, ChevronRight, Fingerprint", "LogOut, MessageCircle, Moon, Sun, X, CheckCircle2, Menu, ChevronRight, Fingerprint, Settings");
}

// 2. Replace navItems array
const oldNavItems = `  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Leave Management', icon: Umbrella, path: '/leaves' },
    { name: 'Holidays List', icon: CalendarDays, path: '/holidays' },
    { name: 'Team Chat', icon: MessageCircle, path: '/chat' },
  ];`;
  
const newNavItems = `  const navItems = [
    { name: 'History', icon: History, path: '/history' },
    { name: 'Leaves', icon: Umbrella, path: '/leaves' },
    { name: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Chat', icon: MessageCircle, path: '/chat' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];`;
  
code = code.replace(oldNavItems, newNavItems);

// 3. Remove Mobile Hamburger Menu (Sheet)
const oldSheet = `            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 mr-2 text-white/80 hover:bg-white/10 rounded-lg">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-[#0a192f] border-r-white/10 flex flex-col [&>button]:hidden">
                {sidebarContent}
              </SheetContent>
            </Sheet>`;
            
code = code.replace(oldSheet, '');

// 4. Update the bottom menu layout
const oldBottomMenuRegex = /\{\/\* Mobile Bottom Navigation - AssayBiz Style \*\/\}\s*<div className="md:hidden fixed bottom-0 left-0 right-0[\s\S]*?<\/div>\s*<\/main>/;

const newBottomMenu = `{/* Mobile Bottom Navigation - AssayBiz Style */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around items-end px-2 pb-safe pt-2 z-[9999] shadow-[0_-10px_30px_rgba(0,0,0,0.15)] min-h-[70px]" style={{ paddingBottom: "env(safe-area-inset-bottom, 20px)" }}>
          {navItems.map((item, index) => {
            const isCenter = index === 2; // Home button at index 2
            
            if (isCenter) {
              return (
                <div key={item.name} className="flex-1 flex justify-center z-[10000]">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      \`-mt-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 transition-transform active:scale-95 \${
                        isActive ? 'bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'
                      }\`
                    }
                  >
                    <div className="flex flex-col items-center">
                      <item.icon className="w-6 h-6 text-white" />
                      <span className="text-[8px] font-bold text-white mt-0.5">HOME</span>
                    </div>
                  </NavLink>
                </div>
              );
            }
            
            return (
              <div key={item.name} className="flex-1 flex justify-center">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    \`flex flex-col items-center gap-1 p-1 \${
                      isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'
                    }\`
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </NavLink>
              </div>
            );
          })}
        </div>
      </main>`;
      
code = code.replace(oldBottomMenuRegex, newBottomMenu);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Updated DashboardLayout styling and routes.");
