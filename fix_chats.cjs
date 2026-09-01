const fs = require('fs');
const file = 'src/components/layout/DashboardLayout.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\.from\('messages'\)[\s\S]*?\.select\('id'\)[\s\S]*?\.eq\('receiver_id', empData.id\)[\s\S]*?\.eq\('is_read', false\)/g,
  `.from('chat_messages').select('id').eq('receiver_id', empData.id).eq('status', 'sent')`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed chat_messages query');
