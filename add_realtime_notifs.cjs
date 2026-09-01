const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

// We will add a new useEffect after the main checkUser effect, which depends on `employee`
const targetStr = `  const unreadCount = notifications.filter(n => !n.is_read).length;`;

const newEffect = `
  useEffect(() => {
    if (!employee) return;

    // Real-time listener for new chat messages
    const chatChannel = supabase
      .channel('dashboard-chat-msgs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: \`receiver_id=eq.\${employee.id}\` },
        async (payload) => {
          const newMsg = payload.new;
          
          // Only alert if we're not currently on the chat page, or if we are, maybe we shouldn't show it?
          // The user requested it to show on the notification bar
          
          // Fetch sender name
          const { data: senderData } = await supabase
            .from('employees')
            .select('name')
            .eq('id', newMsg.sender_id)
            .single();
            
          const senderName = senderData?.name || 'Someone';
          
          // Pop a toast notification
          toast({
            title: \`New Message from \${senderName}\`,
            description: newMsg.message || 'Sent an attachment',
            duration: 5000,
          });
          
          // Add to notifications list
          setNotifications(prev => {
            const newNotif = {
              id: 'chat-' + newMsg.id,
              title: \`New Message from \${senderName}\`,
              message: newMsg.message || 'Sent an attachment',
              is_read: false,
              type: 'chat',
              created_at: newMsg.created_at
            };
            return [newNotif, ...prev].slice(0, 15);
          });
          setUnreadChats(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [employee]);

`;

code = code.replace(targetStr, newEffect + targetStr);
fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code, 'utf8');
console.log('Real-time chat notifications added');
