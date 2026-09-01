const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

const mentionState = `
  const [showMentions, setShowMentions] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState('');
  const [groupMembers, setGroupMembers] = React.useState<any[]>([]);

  // When selectedTarget changes (if group), fetch members for mentions
  React.useEffect(() => {
    if (selectedType === 'group' && selectedTarget) {
      supabase.from('chat_group_members').select('employee_id').eq('group_id', selectedTarget.id).then(({data}) => {
        if (data) {
          const ids = data.map((d: any) => d.employee_id);
          setGroupMembers(employeeList.filter(e => ids.includes(e.id)));
        }
      });
    }
  }, [selectedTarget, selectedType, employeeList]);

  const handleInputText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    
    if (selectedType === 'group') {
      const lastWord = val.split(' ').pop() || '';
      if (lastWord.startsWith('@')) {
        setShowMentions(true);
        setMentionQuery(lastWord.substring(1).toLowerCase());
      } else {
        setShowMentions(false);
      }
    }
  };

  const handleMentionSelect = (user: any) => {
    const words = newMessage.split(' ');
    words.pop();
    const newMsg = words.join(' ') + (words.length > 0 ? ' ' : '') + '@' + user.name.replace(/\\s+/g, '') + ' ';
    setNewMessage(newMsg);
    setShowMentions(false);
  };
`;

code = code.replace(/const \[newMessage, setNewMessage\] = useState\(""\);/, `const [newMessage, setNewMessage] = useState("");\n${mentionState}`);

code = code.replace(/onChange=\{\(e\) => setNewMessage\(e\.target\.value\)\}/g, 'onChange={handleInputText}');

const mentionsDropdown = `
                  {showMentions && groupMembers.length > 0 && (
                    <div className="absolute bottom-[70px] left-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 w-64 max-h-48 overflow-y-auto">
                      <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-700">Mentions</div>
                      {groupMembers
                        .filter(m => m.name.toLowerCase().includes(mentionQuery) || (m.username && m.username.toLowerCase().includes(mentionQuery)))
                        .map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleMentionSelect(m)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-left"
                        >
                          <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                            {m.avatar_url || m.profile_image ? <img src={m.avatar_url || m.profile_image} className="w-full h-full object-cover" /> : (m.name || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{m.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
`;

code = code.replace(/<form onSubmit=\{handleSendMessage\}/, `${mentionsDropdown}\n                    <form onSubmit={handleSendMessage}`);

fs.writeFileSync('src/pages/ChatPage.tsx', code, 'utf8');
console.log('Fixed mentions file version');
