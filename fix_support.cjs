const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

if (!code.includes("import { useLocation } from 'react-router-dom';")) {
  code = code.replace(
    /import React, \{ useState, useEffect, useRef \} from 'react';/,
    "import React, { useState, useEffect, useRef } from 'react';\nimport { useLocation } from 'react-router-dom';"
  );
}

// Ensure the import exists in case the first replace missed (if React import is different)
if (!code.includes("import { useLocation }")) {
  code = "import { useLocation } from 'react-router-dom';\n" + code;
}

// Insert inside ChatPage
const hookCode = `
  const location = useLocation();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (employeeList.length > 0 && location.search.includes('support=true') && !initializedRef.current) {
      initializedRef.current = true;
      const hr = employeeList.find(e => 
        e.designation?.toLowerCase().includes('hr') || 
        e.designation?.toLowerCase().includes('admin') || 
        e.designation?.toLowerCase().includes('manager')
      );
      if (hr) {
        setSelectedType('dm');
        setSelectedTarget(hr);
      }
    }
  }, [employeeList, location]);
`;

code = code.replace(
  /const \[loadingMessages, setLoadingMessages\] = useState\(false\);/,
  `const [loadingMessages, setLoadingMessages] = useState(false);\n${hookCode}`
);

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed auto-select HR in ChatPage');
