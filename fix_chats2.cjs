const fs = require('fs');
const file = 'src/components/layout/DashboardLayout.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the entire unread chat check and notification combining block
const targetBlock = /\/\/ Check for unread chat messages[\s\S]*?setUnreadChats\(0\);\s*\}\s*\}/;

const replacementBlock = `// Check for unread chat messages
            try {
              const { data: unreadMsgs } = await supabase
                .from('chat_messages')
                .select('*, sender:employees!sender_id(name)')
                .eq('receiver_id', empData.id)
                .eq('status', 'sent');
                
              if (unreadMsgs && unreadMsgs.length > 0) {
                 setUnreadChats(unreadMsgs.length);
                 const chatNotifs = unreadMsgs.map(m => ({
                    id: 'chat-' + m.id,
                    title: 'New Message from ' + (m.sender?.name || 'Someone'),
                    message: m.message || (m.file_url ? 'Sent an attachment' : 'Sent a message'),
                    is_read: false,
                    type: 'chat',
                    created_at: m.created_at
                 }));
                 setNotifications(prev => {
                    const combined = [...chatNotifs, ...prev];
                    combined.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    return combined.slice(0, 15);
                 });
              } else {
                 setUnreadChats(0);
              }
            } catch (err) {
              setUnreadChats(0);
            }
          }`;

code = code.replace(targetBlock, replacementBlock);
fs.writeFileSync(file, code, 'utf8');
console.log('Fixed chat notifications combine');
