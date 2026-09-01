const fs = require('fs');
const file = 'src/components/layout/DashboardLayout.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix notifications fetch
code = code.replace(
  /\.from\('notifications'\)[\s\S]*?\.select\('\*'\)[\s\S]*?\.eq\('employee_id', empData.id\)/g,
  `.from('notifications').select('*').eq('user_id', empData.auth_user_id)`
);

// Fix markAllAsRead
code = code.replace(
  /\.update\(\{ is_read: true \}\)[\s\S]*?\.eq\('employee_id', employee.id\)/g,
  `.update({ is_read: true }).eq('user_id', employee.auth_user_id)`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed fetch for notifications');
