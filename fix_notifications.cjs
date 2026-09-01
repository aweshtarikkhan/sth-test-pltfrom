const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

// 1. Add UPDATE listener for chat_messages to remove them when read
const chatListenerStr = `.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: \`receiver_id=eq.\${employee.id}\` },`;
const newChatListenerStr = `.on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: \`receiver_id=eq.\${employee.id}\` },
          (payload) => {
            if (payload.new.status === 'read') {
              setNotifications(prev => prev.filter(n => n.id !== 'chat-' + payload.new.id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: \`receiver_id=eq.\${employee.id}\` },`;
code = code.replace(chatListenerStr, newChatListenerStr);

// 2. Add useEffect to auto-clear leave notifications when visiting /leaves
const autoClearLeavesEffect = `
  // Auto-clear leave notifications when visiting /leaves
  useEffect(() => {
    if (location.pathname === '/leaves' && employee) {
      setNotifications(prev => prev.filter(n => !['leave_approved', 'leave_rejected', 'leave_request'].includes(n.type)));
      supabase.from('notifications')
        .update({ is_read: true })
        .in('type', ['leave_approved', 'leave_rejected', 'leave_request'])
        .eq('user_id', employee.auth_user_id)
        .eq('is_read', false)
        .then();
    }
  }, [location.pathname, employee]);
`;
code = code.replace(/const unreadCount = notifications\.filter/, `${autoClearLeavesEffect}\n  const unreadCount = notifications.filter`);


// 3. Add a Clear All button in the Notification Panel header
const headerRegex = /<h3 className="font-bold text-gray-900 dark:text-white">Notifications<\/h3>\s*<button onClick=\{\(\) => setShowNotifications\(false\)\}/;
const newHeader = `<h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button onClick={() => setNotifications([])} className="text-xs text-orange-600 dark:text-orange-400 hover:underline mr-2">
                          Clear All
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)}`;
code = code.replace(headerRegex, newHeader);


// 4. Update markAllAsRead so it updates chat_messages as well? 
// Actually, no. If they just open the bell, we shouldn't mark chat messages as read in the DB because they haven't read the chat yet. 
// BUT we should remove chat messages from the notification list if they click a chat notification?
// Instead of that, let's add an 'x' to clear individual notifications
const notifMapRegex = /<div key=\{n\.id\} className=\{\`p-4 \$\{!n\.is_read \? 'bg-orange-50\/50 dark:bg-orange-900\/10' : ''\}\`\}>\s*<p className="text-sm font-bold text-gray-900 dark:text-white">\{n\.title\}<\/p>\s*<p className="text-xs text-gray-600 dark:text-slate-300 mt-1">\{n\.message\}<\/p>\s*<\/div>/g;

const newNotifMap = `<div key={n.id} className={\`p-4 relative group \${!n.is_read ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}\`}>
                            <div className="pr-6">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{n.title}</p>
                              <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">{n.message}</p>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotifications(prev => prev.filter(item => item.id !== n.id));
                              }}
                              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Clear notification"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>`;

code = code.replace(notifMapRegex, newNotifMap);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code, 'utf8');
console.log('Patched DashboardLayout.tsx');
