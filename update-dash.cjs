const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. Add getGreeting function
const getGreetingFunc = `  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };
  
  return (`;

code = code.replace("  return (", getGreetingFunc);

// 2. Replace static greeting
const oldGreeting = `<p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Good Morning,</p>`;
const newGreeting = `<p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{getGreeting()}</p>`;
code = code.replace(oldGreeting, newGreeting);

// 3. Remove the Action Buttons block
// We will use regex to match the entire grid block
const actionButtonsRegex = /\{\/\* Action Buttons \*\/\}\s*<div className="grid grid-cols-2 gap-3">[\s\S]*?<\/div>\s*<\/div>/;
code = code.replace(actionButtonsRegex, "");

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Updated Dashboard with dynamic greeting and removed action buttons.");
