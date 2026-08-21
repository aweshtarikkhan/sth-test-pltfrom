const fs = require('fs');

let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

const returnStatementRegex = /return \(\s*<div className="max-w-6xl mx-auto h-\[calc\(100vh-8rem\)\] flex flex-col">([\s\S]*?)<\/Dialog>\s*<\/div>\s*\);\s*}\s*$/;

const newRender = `return (
    <div className="relative w-full max-w-6xl mx-auto h-[calc(100vh-7rem)] md:h-[calc(100vh-3rem)] flex flex-col">
      {/* Background Top Banner (AssayBiz Blue) */}
      <div className="absolute -top-8 -left-4 -right-4 h-48 bg-[#0a192f] rounded-b-[40px] z-0 hidden sm:block md:hidden"></div>

      <div className="relative z-10 flex justify-between items-end mb-4 px-1 md:px-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-white md:dark:text-white mb-1">Team Chat</h1>
          <p className="text-gray-500 dark:text-slate-400 sm:text-blue-100/80 md:dark:text-slate-400 text-sm font-medium">Connect directly or in groups</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* Sidebar */}
        <div className="w-full md:w-80 flex flex-col shrink-0 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/20">
            <div className="flex bg-gray-100 dark:bg-slate-900 rounded-xl p-1 mb-4">
              <button
                onClick={() => setSidebarTab('chats')}
                className={\`flex-1 text-sm font-bold py-2 rounded-lg transition-all \${sidebarTab === 'chats' ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                Chats
              </button>
              <button
                onClick={() => setSidebarTab('requests')}
                className={\`flex-1 text-sm font-bold py-2 rounded-lg transition-all relative \${sidebarTab === 'requests' ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                Requests
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
            
            {sidebarTab === 'chats' && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users or groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-xl h-10 text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {sidebarTab === 'chats' ? (
              <>
                {/* Groups Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Groups</span>
                    <button onClick={() => setShowCreateGroup(true)} className="text-orange-500 hover:text-orange-600 p-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {groups.length === 0 ? (
                    <p className="text-xs text-gray-400 px-2 italic">No groups yet.</p>
                  ) : (
                    groups.map(group => (
                      <button
                        key={\`group-\${group.id}\`}
                        onClick={() => { setSelectedType('group'); setSelectedTarget(group); }}
                        className={\`w-full flex items-center gap-3 p-3 rounded-2xl transition-all \${
                          selectedType === 'group' && selectedTarget?.id === group.id
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'
                        }\`}
                      >
                        <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                          selectedType === 'group' && selectedTarget?.id === group.id ? 'bg-white/20' : 'bg-[#0a192f] text-white'
                        }\`}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                          <p className="text-sm font-bold truncate">{group.name}</p>
                          <p className={\`text-[10px] font-medium truncate \${selectedType === 'group' && selectedTarget?.id === group.id ? 'text-white/80' : 'text-gray-500 dark:text-slate-400'}\`}>
                            {group.created_by === employee?.id ? 'You are admin' : 'Group member'}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Direct Messages Section */}
                <div>
                  <div className="px-2 mb-2">
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Direct Messages</span>
                  </div>
                  {filteredEmployees.length === 0 ? (
                    <p className="text-xs text-gray-400 px-2 italic">No users found.</p>
                  ) : (
                    filteredEmployees.map(emp => {
                      const conn = connectionsMap[emp.id];
                      const isConnected = conn?.status === 'accepted';
                      const isPending = conn?.status === 'pending';
                      
                      return (
                        <button
                          key={\`emp-\${emp.id}\`}
                          onClick={() => handleUserSelect(emp)}
                          className={\`w-full flex items-center gap-3 p-3 rounded-2xl transition-all \${
                            selectedType === 'dm' && selectedTarget?.id === emp.id
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                              : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'
                          }\`}
                        >
                          <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg \${
                            selectedType === 'dm' && selectedTarget?.id === emp.id ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
                          }\`}>
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-bold truncate flex items-center gap-1">
                              {emp.name}
                              {isConnected && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                            </p>
                            <p className={\`text-[10px] font-medium truncate \${selectedType === 'dm' && selectedTarget?.id === emp.id ? 'text-white/80' : 'text-gray-500 dark:text-slate-400'}\`}>
                              @{emp.username}
                            </p>
                          </div>
                          {!isConnected && !isPending && selectedType !== 'dm' && (
                            <UserPlus className="w-4 h-4 text-gray-400" />
                          )}
                          {isPending && selectedType !== 'dm' && (
                            <Clock className="w-4 h-4 text-amber-500" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              /* Requests Tab */
              <div className="space-y-3">
                {requests.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-500">No pending requests</p>
                  </div>
                ) : (
                  requests.map(req => {
                    const isOutgoing = req.sender_id === employee?.id;
                    const otherPersonId = isOutgoing ? req.receiver_id : req.sender_id;
                    const otherPerson = employeeList.find(e => e.id === otherPersonId);
                    if (!otherPerson) return null;

                    return (
                      <div key={\`req-\${req.id}\`} className="p-3 bg-gray-50 dark:bg-slate-900/30 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                            {otherPerson.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{otherPerson.name}</p>
                            <p className="text-xs text-gray-500">@{otherPerson.username}</p>
                          </div>
                        </div>
                        {isOutgoing ? (
                          <div className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg text-center uppercase tracking-wider">
                            Request Sent
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs rounded-xl border-gray-200 dark:border-slate-600 font-bold" onClick={() => handleConnectionResponse('rejected')}>Decline</Button>
                            <Button size="sm" className="flex-1 h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold" onClick={() => handleConnectionResponse('accepted')}>Accept</Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={\`flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden \${!selectedTarget ? 'hidden md:flex' : 'flex'}\`}>
          {!selectedTarget ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 dark:bg-slate-900/20">
              <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <MessageCircle className="w-10 h-10 text-blue-300 dark:text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Messages</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm max-w-xs">Select a colleague or group from the sidebar to start chatting.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between px-4 bg-[#0a192f] text-white shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedTarget(null)} className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-full">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-bold shadow-sm">
                    {selectedType === 'group' ? <Users className="w-5 h-5" /> : selectedTarget.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{selectedTarget.name}</h3>
                    <p className="text-xs text-blue-200">
                      {selectedType === 'group' ? 'Group Chat' : \`@\${selectedTarget.username}\`}
                    </p>
                  </div>
                </div>
                {selectedType === 'dm' && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full"><Phone className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full"><Video className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full"><Info className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/30">
                {loadingMessages ? (
                  <div className="flex-1 flex justify-center items-center h-full">
                    <div className="animate-pulse flex space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 space-y-3">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                      <MessageCircle className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-medium">Say hello to {selectedType === 'group' ? 'the group' : selectedTarget.name}!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender_id === employee.id;
                    const showSender = selectedType === 'group' && !isMine && (idx === 0 || messages[idx-1].sender_id !== msg.sender_id);
                    
                    return (
                      <div key={msg.id} className={\`flex flex-col \${isMine ? 'items-end' : 'items-start'}\`}>
                        {showSender && (
                          <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase tracking-wider">@{msg.sender?.username}</span>
                        )}
                        <div
                          className={\`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl flex flex-col shadow-sm \${
                            isMine
                              ? 'bg-orange-500 text-white rounded-tr-sm'
                              : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-600 rounded-tl-sm'
                          }\`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          
                          {/* Read Receipts */}
                          <div className={\`flex items-center gap-1 self-end mt-1.5 \${isMine ? 'text-orange-200' : 'text-gray-400 dark:text-slate-500'}\`}>
                            <span className="text-[9px] font-medium">
                              {format(new Date(msg.created_at), 'hh:mm a')}
                            </span>
                            {isMine && (
                              <>
                                {msg.status === 'sent' && <Check className="w-3 h-3 text-white/60" />}
                                {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-white/60" />}
                                {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-[#0a192f]" />}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Pending Request Banner */}
              {selectedType === 'request' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-900/50 flex flex-col items-center justify-center space-y-3">
                  <div className="flex items-center text-amber-700 dark:text-amber-500 text-sm font-bold uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 mr-2" /> Message Request
                  </div>
                  <p className="text-xs text-amber-600/80 dark:text-amber-500/80 text-center font-medium">
                    If you accept, they will be able to message you directly.
                  </p>
                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" size="sm" onClick={() => handleConnectionResponse('rejected')} disabled={processingRequest} className="border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl font-bold">
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => handleConnectionResponse('accepted')} disabled={processingRequest} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-600/20">
                      Accept Request
                    </Button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              {(selectedType === 'dm' || selectedType === 'group') && selectedTarget && (
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={\`Message \${selectedType === 'group' ? selectedTarget.name : '@'+selectedTarget.username}...\`}
                      className="flex-1 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-full pl-4 pr-12 h-12 shadow-inner"
                      disabled={sending || (selectedType === 'dm' && selectedConnection?.status === 'pending' && selectedConnection.sender_id === employee.id)}
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={!newMessage.trim() || sending || (selectedType === 'dm' && selectedConnection?.status === 'pending' && selectedConnection.sender_id === employee.id)} 
                      className="absolute right-1 top-1 w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                  </form>
                  {selectedType === 'dm' && selectedConnection?.status === 'pending' && selectedConnection.sender_id === employee.id && (
                    <p className="text-[10px] text-center text-slate-400 font-semibold uppercase tracking-wider mt-3">Waiting for @{selectedTarget.username} to accept</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="dark:text-white font-bold">Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-400">Group Name</label>
              <Input
                placeholder="e.g. Project Alpha Team"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-700 dark:text-white rounded-xl h-12"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-400">Select Members</label>
              <div className="border border-gray-200 dark:border-slate-700 rounded-2xl max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700/50 bg-gray-50/50 dark:bg-slate-900/30">
                {employeeList.map(emp => (
                  <label key={emp.id} className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMembers([...selectedMembers, emp.id]);
                        else setSelectedMembers(selectedMembers.filter(id => id !== emp.id));
                      }}
                      className="rounded border-gray-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500 w-4 h-4"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{emp.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">@{emp.username}</p>
                      </div>
                    </div>
                  </label>
                ))}
                {employeeList.length === 0 && (
                  <div className="p-4 text-sm font-medium text-slate-500 text-center">No other employees found.</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGroup(false)} disabled={creatingGroup} className="dark:border-slate-700 dark:text-slate-300 rounded-xl font-bold h-10">
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={creatingGroup || !newGroupName.trim() || selectedMembers.length === 0} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-10 shadow-lg shadow-orange-500/20">
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;

if (returnStatementRegex.test(code)) {
  code = code.replace(returnStatementRegex, newRender);
  fs.writeFileSync('src/pages/ChatPage.tsx', code);
  console.log("ChatPage patched successfully!");
} else {
  console.log("Could not match the return statement in ChatPage.tsx");
}
