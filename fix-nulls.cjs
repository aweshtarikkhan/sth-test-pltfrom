const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// Fix filtering issue that might crash if name or username is null
code = code.replace(
  "emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || \n      emp.username.toLowerCase().includes(searchQuery.toLowerCase())",
  "(emp?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || \n      (emp?.username || '').toLowerCase().includes((searchQuery || '').toLowerCase())"
);

// Fix other places where properties of selectedTarget or emp are accessed without ?
code = code.replace(/emp\.name\.charAt/g, "(emp.name || '?').charAt");
code = code.replace(/otherPerson\.name\.charAt/g, "(otherPerson.name || '?').charAt");
code = code.replace(/selectedTarget\.name\.charAt/g, "(selectedTarget.name || '?').charAt");

// Fix groups map
code = code.replace(/group\.name\.charAt/g, "(group.name || '?').charAt");

fs.writeFileSync('src/pages/ChatPage.tsx', code);
console.log("Patched ChatPage to handle null names safely!");
