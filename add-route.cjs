const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('SettingsPage')) {
  code = code.replace("import ProfilePage from './pages/ProfilePage';", "import ProfilePage from './pages/ProfilePage';\nimport SettingsPage from './pages/SettingsPage';");
  code = code.replace('<Route path="/profile" element={<ProfilePage />} />', '<Route path="/profile" element={<ProfilePage />} />\n            <Route path="/settings" element={<SettingsPage session={session} />} />');
  fs.writeFileSync('src/App.tsx', code);
  console.log("Added SettingsPage to routes in App.tsx");
}
