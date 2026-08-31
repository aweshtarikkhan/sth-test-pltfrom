import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, User, HelpCircle, LogOut, ChevronRight, Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage({ session }: { session: any }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const settingsOptions = [
    { name: 'Profile Settings', icon: User, path: '/profile', description: 'Update your personal details' },
    { name: 'Holiday List', icon: CalendarDays, path: '/holidays', description: 'View company holidays' },
    { name: 'Help & Support', icon: HelpCircle, path: '/chat?support=true', description: 'Contact HR or IT' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto md:max-w-3xl pb-4 px-4 pt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden divide-y divide-gray-50 dark:divide-slate-700/50">
          {settingsOptions.map((option, i) => (
            <div 
              key={i}
              onClick={() => navigate(option.path)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                  <option.icon className="w-5 h-5 text-[#0a192f] dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{option.name}</h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">{option.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>

        {/* Theme Toggle */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div 
            onClick={toggleTheme}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                {isDarkMode ? <Moon className="w-5 h-5 text-[#0a192f] dark:text-slate-300" /> : <Sun className="w-5 h-5 text-[#0a192f] dark:text-slate-300" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Appearance</h3>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">{isDarkMode ? 'Dark mode is on' : 'Light mode is on'}</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${isDarkMode ? 'bg-orange-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mt-6">
          <div 
            onClick={handleLogout}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-red-600 dark:text-red-500 text-sm">Sign Out</h3>
                <p className="text-xs font-medium text-red-500/70 dark:text-red-400/70 mt-0.5">Log out of your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
