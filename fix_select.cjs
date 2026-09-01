const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

code = code.replace(
  /\.select\('id, name, username, designation, role, org_id, auth_user_id, avatar_url, profile_image'\)/,
  `.select('id, name, username, designation, role, org_id, auth_user_id')`
);

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed select statement');
