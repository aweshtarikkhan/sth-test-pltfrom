const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// I will remove the logic from inside useEffect properly using regex
const regex = /const connectionsMap = connections\.reduce\(\(acc: any, conn: any\) => \{[\s\S]*?setSelectedConnection\(conn\);\n      \}\n    \};\n\n  return \(\) => \{/m;
code = code.replace(regex, "return () => {");
fs.writeFileSync('src/pages/ChatPage.tsx', code);
console.log("Cleaned up duplicate variables inside useEffect.");
