const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

// Find the mentions block and move it INSIDE the form (after form opening tag)
// First, extract the mentions block
const mentionsBlockRegex = /(\{showMentions && groupMembers\.length > 0 && \([\s\S]*?\)\})\s*\n(\s*<form onSubmit=\{handleSendMessage\} className="flex gap-2 relative">)/;

const match = code.match(mentionsBlockRegex);
if (match) {
  // Remove from current position and place inside form
  code = code.replace(
    mentionsBlockRegex,
    `<form onSubmit={handleSendMessage} className="flex gap-2 relative">\n${match[1]}\n`
  );
  fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
  console.log('Moved mentions inside form, position is now relative to input');
} else {
  console.log('Pattern not found, trying alternate...');
  
  // Check if already inside form
  const insideFormCheck = code.indexOf('<form onSubmit={handleSendMessage}');
  const mentionsCheck = code.indexOf('{showMentions && groupMembers.length > 0');
  
  if (mentionsCheck > insideFormCheck) {
    console.log('Mentions is already after form tag (inside form)');
  } else {
    console.log('Mentions is before form tag (needs to be moved inside)');
  }
  
  console.log('Form idx:', insideFormCheck, 'Mentions idx:', mentionsCheck);
}
