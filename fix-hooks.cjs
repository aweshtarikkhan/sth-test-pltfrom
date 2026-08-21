const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// 1. Remove the misplaced useState declarations
code = code.replace(
  "  const [sidebarTab, setSidebarTab] = useState<'chats' | 'requests'>('chats');\n  const [searchQuery, setSearchQuery] = useState('');\n  const [loadingMessages, setLoadingMessages] = useState(false); // we reuse loading for now, or just default false since it wasn't there\n",
  ""
);

// 2. Insert them at the top of the component
code = code.replace(
  "  const [processingRequest, setProcessingRequest] = useState(false);",
  "  const [processingRequest, setProcessingRequest] = useState(false);\n  const [sidebarTab, setSidebarTab] = useState<'chats' | 'requests'>('chats');\n  const [searchQuery, setSearchQuery] = useState('');\n  const [loadingMessages, setLoadingMessages] = useState(false);"
);

fs.writeFileSync('src/pages/ChatPage.tsx', code);
console.log("Moved useState to top to fix React Hook rules!");
