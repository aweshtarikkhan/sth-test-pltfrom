const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// Replace the support=true logic - remove the ref-based guard since location can change
// Use location.search as dependency and trigger every time the URL has support=true
const oldCode = `  useEffect(() => {
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
  }, [employeeList, location]);`;

const newCode = `  useEffect(() => {
    if (location.search.includes('support=true') && employeeList.length > 0) {
      // Find HR admin - prefer 'hr admin' designation, then hr, then admin, then manager
      const hr = employeeList.find(e => e.designation?.toLowerCase().includes('hr admin')) ||
        employeeList.find(e => e.designation?.toLowerCase().includes('hr')) ||
        employeeList.find(e => e.designation?.toLowerCase().includes('admin')) ||
        employeeList.find(e => e.designation?.toLowerCase().includes('manager')) ||
        employeeList[0];
      if (hr) {
        setSelectedType('dm');
        setSelectedTarget(hr);
      }
    }
  }, [location.search, employeeList]);`;

if (code.includes('initializedRef.current')) {
  code = code.replace(oldCode, newCode);
  
  // Also remove the initializedRef since we don't need it anymore
  code = code.replace('\n  const initializedRef = useRef(false);\n', '\n');
  
  fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
  console.log('Fixed support=true logic');
} else {
  console.log('Pattern not found, code may already be updated');
  // Just write the file with correct logic anyway
  fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
}
