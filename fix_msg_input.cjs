const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// 1. Change insert status from 'pending' to 'accepted'
code = code.replace(/status: 'pending'/g, "status: 'accepted'");

// 2. Remove disabled check on Input and Button
const disabledCheckInput = `disabled={sending || (selectedType === 'dm' && selectedConnection?.status === 'pending' && selectedConnection.sender_id === employee.id)}`;
const disabledCheckButton = `disabled={!newMessage.trim() || sending || (selectedType === 'dm' && selectedConnection?.status === 'pending' && selectedConnection.sender_id === employee.id)}`;
code = code.replace(disabledCheckInput, "disabled={sending}");
code = code.replace(disabledCheckButton, "disabled={!newMessage.trim() || sending}");

// 3. Remove "Waiting for ... to accept" paragraph
const waitMsgRegex = /\{selectedType === 'dm' && selectedConnection\?\.status === 'pending' && selectedConnection\.sender_id === employee\.id && \([\s\S]*?<\/p>\s*\)\}/;
code = code.replace(waitMsgRegex, '');

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed pending messaging');
