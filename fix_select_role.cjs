const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

code = code.replace(
  /\.select\('id, name, username, designation, role, org_id, auth_user_id'\)/,
  `.select('id, name, username, designation, org_id, auth_user_id')` // I'll keep auth_user_id and org_id just in case, they DO exist.
);

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed select statement removing role');
