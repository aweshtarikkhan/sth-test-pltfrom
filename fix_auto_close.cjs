const fs = require('fs');
const file = 'src/pages/LeaveManagementPage.tsx';
let c = fs.readFileSync(file, 'utf8');

// Add states
const stateAnchor = 'const [durationType, setDurationType] = useState<"single" | "multiple">("single");';
if (!c.includes('const [calOpen1, setCalOpen1] = useState(false);')) {
  c = c.replace(stateAnchor, `${stateAnchor}\n  const [calOpen1, setCalOpen1] = useState(false);\n  const [calOpen2, setCalOpen2] = useState(false);\n  const [calOpen3, setCalOpen3] = useState(false);`);
}

// Replace single day popover
c = c.replace(
  '<Popover>',
  '<Popover open={calOpen1} onOpenChange={setCalOpen1}>'
);
// Replace multiple days From popover
c = c.replace(
  '<Popover>',
  '<Popover open={calOpen2} onOpenChange={setCalOpen2}>'
);
// Replace multiple days To popover
c = c.replace(
  '<Popover>',
  '<Popover open={calOpen3} onOpenChange={setCalOpen3}>'
);

// Add setCalOpen(false) in onSelect handlers
c = c.replace(
  'setLeaveData({ ...leaveData, startDate: str, endDate: str });\n                        }',
  'setLeaveData({ ...leaveData, startDate: str, endDate: str });\n                          setCalOpen1(false);\n                        }'
);

c = c.replace(
  'if (d) setLeaveData({ ...leaveData, startDate: format(d, "yyyy-MM-dd") });\n                        }}',
  'if (d) { setLeaveData({ ...leaveData, startDate: format(d, "yyyy-MM-dd") }); setCalOpen2(false); }\n                        }}'
);

c = c.replace(
  'if (d) setLeaveData({ ...leaveData, endDate: format(d, "yyyy-MM-dd") });\n                        }}',
  'if (d) { setLeaveData({ ...leaveData, endDate: format(d, "yyyy-MM-dd") }); setCalOpen3(false); }\n                        }}'
);

fs.writeFileSync(file, c);
console.log('Fixed popovers');
