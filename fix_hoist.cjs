const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

const extractRegex = /(const \[showMentions[\s\S]*?setShowMentions\(false\);\n  };\n)/;
const match = code.match(extractRegex);

if (match) {
  code = code.replace(match[0], '');
  // Insert it after const [searchQuery, setSearchQuery] = useState('');
  code = code.replace(
    /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
    "const [searchQuery, setSearchQuery] = useState('');\n\n" + match[0]
  );
  fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
  console.log('Fixed mention state hoisting error');
} else {
  console.log('Could not find mention state to extract');
}
