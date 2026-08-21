const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

// The bottom nav maps are wrong, let's fix them to show Home, History, (Holidays), Leaves, Chat
// Replace the entire slice(2,4) logic with slice(2,5) logic
const oldNav = `{navItems.slice(2,4).map(item => {
             // Let's remap the last two to Leave and Chat
             if (item.name === 'Holidays List') return null; // Used in center
             const label = item.name === 'Leave Management' ? 'Leaves' : 'Chat';
             return (
              <div key={item.name} className="flex-1 flex justify-center">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    \`flex flex-col items-center gap-1 p-1 \${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'}\`
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{label}</span>
                </NavLink>
              </div>
            )
          })}`;

const newNav = `{navItems.slice(2,5).map(item => {
             if (item.name === 'Holidays List') return null; // Used in center
             const label = item.name === 'Leave Management' ? 'Leaves' : item.name === 'Team Chat' ? 'Chat' : item.name;
             return (
              <div key={item.name} className="flex-1 flex justify-center">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    \`flex flex-col items-center gap-1 p-1 \${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'}\`
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{label}</span>
                </NavLink>
              </div>
            )
          })}`;

code = code.replace(oldNav, newNav);
fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Fixed bottom navigation items!");
