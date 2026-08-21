const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

code = code.replace(
  "import { LayoutDashboard, History, CalendarDays, Umbrella, HelpCircle, Bell, LogOut, MessageCircle, Moon, Sun, X, CheckCircle2 } from 'lucide-react';",
  "import { LayoutDashboard, History, CalendarDays, Umbrella, HelpCircle, Bell, LogOut, MessageCircle, Moon, Sun, X, CheckCircle2, Menu } from 'lucide-react';\nimport { Sheet, SheetContent, SheetTrigger } from \"@/components/ui/sheet\";"
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Fixed imports!");
