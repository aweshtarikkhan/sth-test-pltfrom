const fs = require('fs');
const file = 'src/components/layout/DashboardLayout.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `                          <div key={n.id} className={\`p-4 \${!n.is_read ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}\`}>`;

const replacementStr = `                          <div key={n.id} onClick={() => { if(n.type==='chat') { setShowNotifications(false); navigate('/chat'); } }} className={\`p-4 \${n.type==='chat'?'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50':''} \${!n.is_read ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}\`}>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync(file, code, 'utf8');
console.log('Made chat notif clickable');
