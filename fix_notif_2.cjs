const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

// The file was not modified, so we will use more robust replacements.
// 1. UPDATE listener
const insertListener = "{ event: 'INSERT', schema: 'public', table: 'chat_messages'";
if (code.includes(insertListener)) {
  code = code.replace(
    /\{\s*event:\s*'INSERT',\s*schema:\s*'public',\s*table:\s*'chat_messages',\s*filter:\s*`receiver_id=eq\.\$\{employee\.id\}`\s*\}/,
    `{ event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: \`receiver_id=eq.\${employee.id}\` },
          (payload) => {
            if (payload.new.status === 'read') {
              setNotifications(prev => prev.filter(n => n.id !== 'chat-' + payload.new.id));
              setUnreadChats(prev => Math.max(0, prev - 1));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: \`receiver_id=eq.\${employee.id}\` }`
  );
}

// 2. Add useEffect to auto-clear leave notifications
const autoClearEffect = `
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
if (!code.includes('/leaves\' && employee')) {
  code = code.replace(
    /const unreadCount = notifications\.filter/,
    `${autoClearEffect}\n  const unreadCount = notifications.filter`
  );
}

// 3. Clear all button
if (!code.includes('Clear All')) {
  code = code.replace(
    /<h3 className="font-bold text-gray-900 dark:text-white">Notifications<\/h3>\s*<button onClick=\{\(\) => setShowNotifications\(false\)\}/,
    `<h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button onClick={() => { setNotifications([]); setUnreadChats(0); }} className="text-xs text-orange-600 dark:text-orange-400 hover:underline mr-2">
                          Clear All
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)}`
  );
}

// 4. X button
if (!code.includes('Clear notification')) {
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
                                if (n.type === 'chat') setUnreadChats(prev => Math.max(0, prev - 1));
                              }}
                              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Clear notification"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>`;
  code = code.replace(notifMapRegex, newNotifMap);
}

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code, 'utf8');
console.log('Fixed DashboardLayout.tsx');
