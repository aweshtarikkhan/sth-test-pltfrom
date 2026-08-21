const fs = require('fs');

let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// Insert the missing state and logic right before the return statement
const missingLogic = `
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'requests'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false); // we reuse loading for now, or just default false since it wasn't there

  const connectionsMap = connections.reduce((acc: any, conn: any) => {
    const otherId = conn.sender_id === employee?.id ? conn.receiver_id : conn.sender_id;
    acc[otherId] = conn;
    return acc;
  }, {});

  const requests = connections.filter(c => c.status === 'pending' && c.receiver_id === employee?.id);
  const pendingRequestsCount = requests.length;

  const filteredEmployees = employeeList.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (emp: any) => {
    const conn = connectionsMap[emp.id];
    setSelectedTarget(emp);
    
    if (!conn) {
      // Logic for new connection would go here if needed, or handled when sending message
      setSelectedType('dm');
      setSelectedConnection(null);
    } else if (conn.status === 'pending') {
      setSelectedType(conn.receiver_id === employee?.id ? 'request' : 'dm');
      setSelectedConnection(conn);
    } else {
      setSelectedType('dm');
      setSelectedConnection(conn);
    }
  };
`;

code = code.replace(
  '  return (',
  missingLogic + '\n  return ('
);

// Now update the mobile views to be WhatsApp-like (toggle between list and chat)
// The sidebar should be hidden on mobile if a chat is selected
// The chat window should be hidden on mobile if NO chat is selected
code = code.replace(
  '<div className="w-full md:w-80 flex flex-col shrink-0 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">',
  '<div className={`w-full md:w-80 flex flex-col shrink-0 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${selectedTarget ? \'hidden md:flex\' : \'flex\'}`}>'
);

code = code.replace(
  '<div className={`flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${!selectedTarget ? \'hidden md:flex\' : \'flex\'}`}>',
  '<div className={`flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${!selectedTarget ? \'hidden md:flex\' : \'flex\'}`}>'
);

// We need to change the top header to not show when chat is open on mobile
// In chat mode, the header inside the chat box takes over.
code = code.replace(
  '<div className="relative z-10 flex justify-between items-end mb-4 px-1 md:px-0">',
  '<div className={`relative z-10 flex justify-between items-end mb-4 px-1 md:px-0 ${selectedTarget ? \'hidden md:flex\' : \'flex\'}`}>'
);

// And replace groups array (which wasn't defined, it was groupList)
code = code.replace(/groups\.length/g, 'groupList.length');
code = code.replace(/groups\.map/g, 'groupList.map');

fs.writeFileSync('src/pages/ChatPage.tsx', code);
console.log("Fixed missing variables and mobile visibility in ChatPage!");
