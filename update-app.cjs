const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import ProfilePage')) {
  code = code.replace(
    "import ChatPage from './pages/ChatPage';",
    "import ChatPage from './pages/ChatPage';\nimport ProfilePage from './pages/ProfilePage';"
  );
}

if (!code.includes('<Route path="/profile"')) {
  code = code.replace(
    '<Route path="/chat" element={<ChatPage session={session} />} />',
    '<Route path="/chat" element={<ChatPage session={session} />} />\n            <Route path="/profile" element={<ProfilePage />} />'
  );
}

fs.writeFileSync('src/App.tsx', code);
console.log("Added ProfilePage route to App.tsx");
