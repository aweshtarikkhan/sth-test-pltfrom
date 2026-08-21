const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// 1. Remove it from inside the useEffect
const badLogic = `
  const connectionsMap = connections.reduce((acc: any, conn: any) => {
    const otherId = conn.sender_id === employee?.id ? conn.receiver_id : conn.sender_id;
    acc[otherId] = conn;
    return acc;
  }, {});

  const requests = connections.filter(c => c.status === 'pending' && c.receiver_id === employee?.id);
  const pendingRequestsCount = requests.length;

  const filteredEmployees = employeeList.filter(emp => 
    (emp?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
    (emp?.username || '').toLowerCase().includes((searchQuery || '').toLowerCase())
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

code = code.replace(badLogic, "");

// 2. Add it right before the MAIN component return
// The main return looks like:
//   return (
//     <div className="relative w-full max-w-6xl mx-auto h-[calc(100vh-7rem)] md:h-[calc(100vh-3rem)] flex flex-col">
const target = `  return (
    <div className="relative w-full max-w-6xl mx-auto h-[calc(100vh-7rem)]`;

code = code.replace(target, badLogic + "\n" + target);

fs.writeFileSync('src/pages/ChatPage.tsx', code);
console.log("Moved logic out of useEffect and before the main return!");
