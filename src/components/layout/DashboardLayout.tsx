import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, History, CalendarDays, Umbrella, HelpCircle, Bell, LogOut, MessageCircle, Moon, Sun, X, CheckCircle2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { format } from 'date-fns';

export default function DashboardLayout() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employee, setEmployee] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        const { data: empData } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();
        if (empData) setEmployee(empData);
        
        if (empData) {
          const { data: notifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('employee_id', empData.id)
            .order('created_at', { ascending: false })
            .limit(10);
          if (notifs) setNotifications(notifs);
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    if (!employee) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('employee_id', employee.id)
      .eq('is_read', false);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Leave Management', icon: Umbrella, path: '/leaves' },
    { name: 'Holidays List', icon: CalendarDays, path: '/holidays' },
    { name: 'Team Chat', icon: MessageCircle, path: '/chat' },
  ];
  
  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-white/10 bg-[#0a192f] text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-wide text-white">AssayPortal</h1>
        </div>
      </div>
      
      {/* Profile section in sidebar */}
      <div className="p-4 border-b border-white/10 bg-[#0d213b] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shadow-sm shrink-0">
          {employee?.name?.charAt(0) || 'E'}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">{employee?.name || 'Employee'}</span>
          <span className="text-xs text-blue-200">{employee?.designation || 'Staff'}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto bg-[#0a192f]">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-blue-100 hover:bg-white/10'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-white/10 bg-[#0a192f]">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-red-500 hover:border-red-500 transition-all shadow-sm active:scale-95"
        >
          <LogOut className="w-4 h-4 mr-2 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0a192f] flex-col transition-colors z-20 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header - Dark Blue AssayBiz Theme */}
        <header className="h-16 bg-[#0a192f] flex items-center justify-between px-4 md:px-8 z-10 shrink-0 shadow-md">
          <div className="flex items-center">
            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 mr-2 text-white/80 hover:bg-white/10 rounded-lg">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-[#0a192f] border-r-white/10 flex flex-col [&>button]:hidden">
                {sidebarContent}
              </SheetContent>
            </Sheet>

            {/* Desktop Title / Clock */}
            <div className="hidden sm:block text-sm text-white">
              <div className="font-bold tracking-wide">
                AssayBiz Attendance
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-white/80 hover:bg-white/10 rounded-full transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) markAllAsRead();
                }}
                className="relative p-2 text-white/80 hover:bg-white/10 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#0a192f]">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 dark:text-slate-400 text-sm">
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                        {notifications.map(n => (
                          <div key={n.id} className={`p-4 ${!n.is_read ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile - Mobile Hidden (since we have bottom nav and sidebar) */}
            <div className="hidden md:flex items-center ml-2">
              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-orange-400">
                {employee?.name?.charAt(0) || 'E'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900 pb-20 md:pb-0 transition-colors relative">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation - AssayBiz Style */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around items-end px-2 pb-5 pt-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          {navItems.slice(0,2).map(item => (
            <div key={item.name} className="flex-1 flex justify-center">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 p-1 ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'}`
                }
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.name === 'Dashboard' ? 'Home' : item.name}</span>
              </NavLink>
            </div>
          ))}
          
          {/* Center Raised Action / Calendar (mapped to holidays) */}
          <div className="flex-1 flex justify-center">
            <NavLink
              to="/holidays"
              className={({ isActive }) =>
                `-mt-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 transition-transform active:scale-95 ${isActive ? 'bg-orange-600' : 'bg-orange-500'}`
              }
            >
              <CalendarDays className="w-6 h-6 text-white" />
            </NavLink>
          </div>

          {navItems.slice(2,5).map(item => {
             if (item.name === 'Holidays List') return null; // Used in center
             const label = item.name === 'Leave Management' ? 'Leaves' : item.name === 'Team Chat' ? 'Chat' : item.name;
             return (
              <div key={item.name} className="flex-1 flex justify-center">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 p-1 ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'}`
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{label}</span>
                </NavLink>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  );
}
