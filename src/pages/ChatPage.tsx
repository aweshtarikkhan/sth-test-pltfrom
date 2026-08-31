import { useLocation } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Send, UserCircle2, Users, MessageSquare, Plus, Check, CheckCheck, UserPlus, X, ShieldAlert, Search, ChevronLeft, Phone, Video, Info, MessageCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';


function GroupMembersList({ groupId, supabase, currentUserId, employeeList }: any) {
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('chat_group_members')
        .select('employee_id')
        .eq('group_id', groupId);
      
      if (data) {
        const memberIds = data.map((d: any) => d.employee_id);
        const mems = employeeList.filter((e: any) => memberIds.includes(e.id));
        setMembers(mems);
      }
      setLoading(false);
    };
    if (groupId) fetchMembers();
  }, [groupId]);

  if (loading) return <div className="text-sm text-gray-400">Loading members...</div>;
  if (members.length === 0) return <div className="text-sm text-gray-400">No members found.</div>;

  return (
    <>
      {members.map(m => (
        <div key={m.id} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-slate-300 overflow-hidden">
            {m.avatar_url || m.profile_image ? <img src={m.avatar_url || m.profile_image} className="w-full h-full object-cover" /> : (m.name || '?').charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{m.name} {m.id === currentUserId && '(You)'}</p>
            <p className="text-[10px] text-gray-500 truncate">{m.designation || 'Employee'}</p>
          </div>
        </div>
      ))}
    </>
  );
}

function ChatPage({ session }: { session: any }) {
  const [employee, setEmployee] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [groupList, setGroupList] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  
  const [selectedType, setSelectedType] = useState<'dm' | 'group' | 'request' | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

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
    const newMsg = words.join(' ') + (words.length > 0 ? ' ' : '') + '@' + user.name.replace(/\s+/g, '') + ' ';
    setNewMessage(newMsg);
    setShowMentions(false);
  };

  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.search.includes('support=true') && employeeList.length > 0) {
      // Find HR admin - prefer 'hr admin' designation, then hr, then admin, then manager
      const hr = employeeList.find(e => e.designation?.toLowerCase().includes('hr admin')) ||
        employeeList.find(e => e.designation?.toLowerCase().includes('hr')) ||
        employeeList.find(e => e.designation?.toLowerCase().includes('admin')) ||
        employeeList.find(e => e.designation?.toLowerCase().includes('manager')) ||
        employeeList[0];
      if (hr) {
        setSelectedType('dm');
        setSelectedTarget(hr);
      }
    }
  }, [location.search, employeeList]);


  // Load current employee profile
  useEffect(() => {
    const loadEmployee = async () => {
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (empData) {
        setEmployee(empData);
      }
    };
    loadEmployee();
  }, [session]);

  // Load sidebar data
  const loadSidebarData = async () => {
    if (!employee) return;
    
    // Load all other employees in org
    const { data: emps } = await supabase
      .from('employees')
      .select('id, name, username, designation, org_id, auth_user_id')
      .eq('org_id', employee.org_id)
      .neq('id', employee.id)
      .order('name');
      
    setEmployeeList(emps || []);

    // Load connections
    const { data: conns } = await supabase
      .from('chat_connections')
      .select('*')
      .or(`sender_id.eq.${employee.id},receiver_id.eq.${employee.id}`);
      
    setConnections(conns || []);

    // Load groups user is part of
    const { data: grps } = await supabase
      .from('chat_groups')
      .select('id, name, created_at, chat_group_members!inner(employee_id)')
      .eq('org_id', employee.org_id)
      .eq('chat_group_members.employee_id', employee.id)
      .order('created_at');
      
    setGroupList(grps || []);
  };

  useEffect(() => {
    loadSidebarData();
  }, [employee]);

  // Read messages when opened
  const markMessagesAsRead = async (targetId: string, type: string) => {
    if (!employee) return;
    let query = supabase.from('chat_messages').update({ status: 'read' }).eq('status', 'sent');
    
    if (type === 'dm') {
      query = query.eq('sender_id', targetId).eq('receiver_id', employee.id);
    } else if (type === 'group') {
      query = query.eq('group_id', targetId).neq('sender_id', employee.id);
    }
    
    await query;
  };

  // Load messages when target changes
  useEffect(() => {
    if (!employee || !selectedTarget || !selectedType) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('chat_messages')
          .select('*, sender:employees!sender_id(id, name, username)')
          .order('created_at', { ascending: true });

        if (selectedType === 'dm' || selectedType === 'request') {
          query = query.or(`and(sender_id.eq.${selectedTarget.id},receiver_id.eq.${employee.id}),and(sender_id.eq.${employee.id},receiver_id.eq.${selectedTarget.id})`);
        } else if (selectedType === 'group') {
          query = query.eq('group_id', selectedTarget.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setMessages(data || []);
        
        // Mark as read if it's an accepted DM or Group
        if (selectedType === 'dm' || selectedType === 'group') {
          await markMessagesAsRead(selectedTarget.id, selectedType);
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [employee, selectedTarget, selectedType]);

  // Realtime subscription
  useEffect(() => {
    if (!employee) return;

    const channel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id === employee.id || msg.receiver_id === employee.id || msg.group_id) {
            let isRelevant = false;
            if ((selectedType === 'dm' || selectedType === 'request') && selectedTarget) {
              isRelevant = !msg.group_id && (msg.sender_id === selectedTarget.id || msg.receiver_id === selectedTarget.id);
            } else if (selectedType === 'group' && selectedTarget) {
              isRelevant = msg.group_id === selectedTarget.id;
            }

            if (isRelevant) {
              const { data: senderData } = await supabase.from('employees').select('id, name, username').eq('id', msg.sender_id).single();
              const enrichedMsg = { ...msg, sender: senderData };
              
              setMessages(prev => {
                if (prev.find(m => m.id === enrichedMsg.id)) return prev;
                return [...prev, enrichedMsg];
              });
              
              // Mark as read immediately if chat is open
              if (selectedType === 'dm' || selectedType === 'group') {
                if (msg.sender_id !== employee.id) {
                  await supabase.from('chat_messages').update({ status: 'read' }).eq('id', msg.id);
                }
              }
            } else {
              // Reload sidebar if a new connection might be formed
              if (!msg.group_id && msg.receiver_id === employee.id) {
                loadSidebarData();
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const msg = payload.new as any;
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: msg.status } : m));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_connections' },
        () => loadSidebarData()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_connections' },
        (payload) => {
           loadSidebarData();
           const conn = payload.new as any;
           if (selectedConnection && selectedConnection.id === conn.id && conn.status === 'accepted') {
             setSelectedType('dm');
           }
        }
      )
      .subscribe();

  

  const connectionsMap = connections.reduce((acc: any, conn: any) => {
    const otherId = conn.sender_id === employee?.id ? conn.receiver_id : conn.sender_id;
    acc[otherId] = conn;
    return acc;
  }, {});

  const requests = connections.filter(c => c.status === 'pending' && c.receiver_id === employee?.id);
  const pendingRequestsCount = requests.length;

  const filteredEmployees = employeeList.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (emp: any) => {
      setSelectedTarget(emp);
      setSelectedType('dm');
      setSelectedConnection(null);
    };

  return () => {
      supabase.removeChannel(channel);
    };
  }, [employee, selectedTarget, selectedType, selectedConnection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !employee || !selectedTarget) return;

    setSending(true);
    try {
      // Create connection if sending first DM
      if (selectedType === 'dm' && !selectedConnection) {
        const { data: newConn, error: connErr } = await supabase.from('chat_connections').insert({
          org_id: employee.org_id,
          sender_id: employee.id,
          receiver_id: selectedTarget.id,
          status: 'accepted'
        }).select().single();
        if (!connErr) {
          setSelectedConnection(newConn);
          // Don't change selectedType, let receiver handle the request
        }
      }

      const payload: any = {
        org_id: employee.org_id,
        sender_id: employee.id,
        message: newMessage.trim(),
        status: 'sent'
      };
      
      if (selectedType === 'dm') {
        payload.receiver_id = selectedTarget.id;
      } else {
        payload.group_id = selectedTarget.id;
      }

      const { error } = await supabase.from('chat_messages').insert(payload);
      if (error) throw error;
      setNewMessage("");
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleConnectionResponse = async (status: 'accepted' | 'rejected') => {
    if (!selectedConnection) return;
    setProcessingRequest(true);
    try {
      const { error } = await supabase.from('chat_connections').update({ status }).eq('id', selectedConnection.id);
      if (error) throw error;
      if (status === 'accepted') {
        setSelectedType('dm');
        await markMessagesAsRead(selectedTarget.id, 'dm');
      } else {
        setSelectedType(null);
        setSelectedTarget(null);
      }
      toast({ title: 'Success', description: `Request ${status} successfully.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingRequest(false);
      loadSidebarData();
    }
  };
  
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      toast({ title: 'Validation', description: 'Enter group name and select at least 1 member.', variant: 'destructive' });
      return;
    }
    
    setCreatingGroup(true);
    try {
      const { data: groupData, error: groupErr } = await supabase
        .from('chat_groups')
        .insert({ org_id: employee.org_id, name: newGroupName.trim(), created_by: employee.id })
        .select().single();
        
      if (groupErr) throw groupErr;
      
      const memberInserts = [...selectedMembers, employee.id].map(id => ({
        group_id: groupData.id,
        employee_id: id
      }));
      
      const { error: memErr } = await supabase.from('chat_group_members').insert(memberInserts);
      if (memErr) throw memErr;
      
      toast({ title: 'Success', description: 'Group created successfully!' });
      setShowCreateGroup(false);
      setNewGroupName("");
      setSelectedMembers([]);
      loadSidebarData();
      
      setSelectedType('group');
      setSelectedTarget(groupData);
    } catch (err: any) {
      toast({ title: 'Failed to create group', description: err.message, variant: 'destructive' });
    } finally {
      setCreatingGroup(false);
    }
  };

  if (!employee) {
    return <div className="flex items-center justify-center h-full dark:text-slate-300">Loading...</div>;
  }

  // Derived lists
  const pendingRequests = connections.filter(c => c.receiver_id === employee.id && c.status === 'pending');
  const activeConnections = connections.filter(c => c.status === 'accepted' || (c.sender_id === employee.id && c.status === 'pending'));

  const pendingUsers = pendingRequests.map(c => {
    const u = employeeList.find(e => e.id === c.sender_id);
    return u ? { ...u, connection: c } : null;
  }).filter(Boolean);

  const activeUsers = employeeList.map(emp => {
    const conn = activeConnections.find(c => c.sender_id === emp.id || c.receiver_id === emp.id);
    return { ...emp, connection: conn || null };
  }).filter(emp => !pendingRequests.some(c => c.sender_id === emp.id));


  const connectionsMap = connections.reduce((acc: any, conn: any) => {
    const otherId = conn.sender_id === employee?.id ? conn.receiver_id : conn.sender_id;
    acc[otherId] = conn;
    return acc;
  }, {});

  const requests = connections.filter(c => c.status === 'pending' && c.receiver_id === employee?.id);
  const pendingRequestsCount = requests.length;

  const filteredEmployees = employeeList.filter(emp => 
    (emp?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
    (emp?.username || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleUserSelect = (emp: any) => {
    const conn = connectionsMap[emp.id];
    setSelectedTarget(emp);
    
    if (!conn) {
      // Logic for new connection would go here if needed, or handled when sending message
      setSelectedType('dm');
      setSelectedConnection(null);
    } else if (conn.status === 'pending') {
      setSelectedType(conn.receiver_id === employee?.id ? 'request' : 'dm');
      setSelectedConnection(conn);
    } else {
      setSelectedType('dm');
      setSelectedConnection(conn);
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto h-full flex flex-col pb-4 px-2 pt-2">
      <div className={`relative z-10 flex justify-between items-end mb-4 px-2 ${selectedTarget ? 'hidden md:flex' : 'flex'}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Team Chat</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Connect directly or in groups</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* Sidebar */}
        <div className={`w-full md:w-80 flex flex-col shrink-0 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${selectedTarget ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-slate-700/50">
            
            
            {true && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users or groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-700 rounded-xl h-10 text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <>
                {/* Groups Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Groups</span>
                    <button onClick={() => setShowCreateGroup(true)} className="text-orange-500 hover:text-orange-600 p-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {groupList.length === 0 ? (
                    <p className="text-xs text-gray-400 px-2 italic font-medium">No groups yet.</p>
                  ) : (
                    groupList.map(group => (
                      <button
                        key={`group-${group.id}`}
                        onClick={() => { setSelectedType('group'); setSelectedTarget(group); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                          selectedType === 'group' && selectedTarget?.id === group.id
                            ? 'bg-orange-50 dark:bg-slate-700'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-orange-100 dark:bg-slate-800 text-orange-600 font-bold text-lg">
    {group.name.substring(0, 2).toUpperCase()}
  </div>
                        <div className="flex-1 text-left overflow-hidden">
                          <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{group.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {group.created_by === employee?.id ? 'Admin' : 'Member'}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* HR & Management Section */}
                  <div className="mb-4 mt-6">
                    <div className="px-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">HR & Management</span>
                    </div>
                    {filteredEmployees.filter(e => e.designation?.toLowerCase().includes('hr') || e.designation?.toLowerCase().includes('admin') || e.designation?.toLowerCase().includes('manager')).map(emp => {
                        return (
                          <button
                            key={`emp-${emp.id}`}
                            onClick={() => handleUserSelect(emp)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                              selectedType === 'dm' && selectedTarget?.id === emp.id
                                ? 'bg-orange-50 dark:bg-orange-900/20 shadow-sm border border-orange-100 dark:border-orange-900/50'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent'
                            }`}
                          >
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
    {emp.avatar_url || emp.profile_image ? <img src={emp.avatar_url || emp.profile_image} className="w-full h-full object-cover" alt="" /> : (emp.name || '?').charAt(0)}
  </div>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {emp.name} <span className="ml-2 inline-flex items-center text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">{emp.designation || 'HR'}</span>
                              </p>
                              <p className="text-xs font-medium text-gray-500 truncate">
                                @{emp.username || emp.name.toLowerCase().replace(/\s+/g, '')}
                              </p>
                            </div>
                          </button>
                        );
                    })}
                  </div>

                  {/* Direct Messages Section */}
                  <div>
                    <div className="px-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Colleagues</span>
                    </div>
                    {filteredEmployees.filter(e => !(e.designation?.toLowerCase().includes('hr') || e.designation?.toLowerCase().includes('admin') || e.designation?.toLowerCase().includes('manager'))).length === 0 ? (
                      <p className="text-xs text-gray-400 px-2 italic font-medium">No users found.</p>
                    ) : (
                      filteredEmployees.filter(e => !(e.designation?.toLowerCase().includes('hr') || e.designation?.toLowerCase().includes('admin') || e.designation?.toLowerCase().includes('manager'))).map(emp => {
                        return (
                          <button
                            key={`emp-${emp.id}`}
                            onClick={() => handleUserSelect(emp)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                              selectedType === 'dm' && selectedTarget?.id === emp.id
                                ? 'bg-orange-50 dark:bg-orange-900/20 shadow-sm border border-orange-100 dark:border-orange-900/50'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent'
                            }`}
                          >
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
    {emp.avatar_url || emp.profile_image ? <img src={emp.avatar_url || emp.profile_image} className="w-full h-full object-cover" alt="" /> : (emp.name || '?').charAt(0)}
  </div>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{emp.name}</p>
                              <p className="text-xs font-medium text-gray-500 truncate">
                                @{emp.username || emp.name.toLowerCase().replace(/\s+/g, '')}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                </div>
              </>
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${!selectedTarget ? 'hidden md:flex' : 'flex'}`}>
          {!selectedTarget ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-blue-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <MessageCircle className="w-10 h-10 text-blue-400 dark:text-slate-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Messages</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm max-w-xs font-medium">Select a colleague or group from the sidebar to start chatting.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between px-4 bg-white dark:bg-slate-800 shrink-0">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowInfoDialog(true)}>
                  <button onClick={() => setSelectedTarget(null)} className="md:hidden p-2 -ml-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-full">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                  </button>
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center font-bold overflow-hidden">
                    {selectedType === 'group' ? <span className="text-lg">{selectedTarget.name.substring(0, 2).toUpperCase()}</span> : (
    selectedTarget.avatar_url || selectedTarget.profile_image ? <img src={selectedTarget.avatar_url || selectedTarget.profile_image} className="w-full h-full object-cover" alt="" /> : (selectedTarget.name || '?').charAt(0)
  )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{selectedTarget.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {selectedType === 'group' ? 'Group Chat' : `@${selectedTarget.username}`}
                    </p>
                  </div>
                </div>
                {(selectedType === 'dm' || selectedType === 'group') && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-full" onClick={() => setShowInfoDialog(true)}><Info className="w-4 h-4" /></Button>
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
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700">
                      <MessageCircle className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-bold">Say hello to {selectedType === 'group' ? 'the group' : selectedTarget.name}!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender_id === employee.id;
                    const showSender = selectedType === 'group' && !isMine && (idx === 0 || messages[idx-1].sender_id !== msg.sender_id);
                    
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        {showSender && (
                          <span className="text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">@{msg.sender?.name}</span>
                        )}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl flex flex-col shadow-sm ${
                            isMine
                              ? 'bg-orange-500 text-white rounded-tr-sm'
                              : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-tl-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words font-medium">{msg.message}</p>
                          
                          {/* Read Receipts */}
                          <div className={`flex items-center gap-1 self-end mt-1.5 ${isMine ? 'text-orange-100' : 'text-gray-400 dark:text-slate-500'}`}>
                            <span className="text-[9px] font-bold">
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                            {isMine && (
                              <>
                                {msg.status === 'sent' && <Check className="w-3 h-3 opacity-70" />}
                                {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 opacity-70" />}
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

              

              {/* Input Area */}
              {(selectedType === 'dm' || selectedType === 'group') && selectedTarget && (
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 shrink-0">
                  
                  <form onSubmit={handleSendMessage} className="flex gap-2 relative">
{showMentions && groupMembers.length > 0 && (
                    <div className="absolute bottom-full mb-2 right-0 left-0 mx-0 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                      <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-700">Mentions</div>
                      
                      {groupMembers
                        .filter(m => m.name.toLowerCase().includes(mentionQuery) || (m.username && m.username.toLowerCase().includes(mentionQuery)))
                        .sort((a, b) => a.name.localeCompare(b.name))
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

                    <Input
                      value={newMessage}
                      onChange={handleInputText}
                      placeholder={`Message ${selectedType === 'group' ? selectedTarget.name : '@' + (selectedTarget?.username || selectedTarget?.name?.replace(/\s+/g, '').toLowerCase() || 'user')}...`}
                      className="flex-1 bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-700 text-gray-900 dark:text-white rounded-full pl-5 pr-14 h-12 font-medium"
                      disabled={sending}
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={!newMessage.trim() || sending} 
                      className="absolute right-1 top-1 w-10 h-10 bg-[#0a192f] hover:bg-[#0a192f]/90 text-white rounded-full shadow-md transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                  </form>
                  
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      
      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-sm dark:bg-slate-800 dark:border-slate-700 rounded-3xl z-[100]">
          <DialogHeader>
            <DialogTitle className="dark:text-white font-bold">
              {selectedType === 'dm' ? 'Profile Info' : 'Group Info'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedType === 'dm' && selectedTarget && (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-3xl flex items-center justify-center font-bold text-3xl overflow-hidden">
                  {selectedTarget.avatar_url || selectedTarget.profile_image ? (
                    <img src={selectedTarget.avatar_url || selectedTarget.profile_image} className="w-full h-full object-cover" alt="" />
                  ) : (
                    (selectedTarget.name || '?').charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTarget.name}</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{selectedTarget.designation || 'Employee'}</p>
                  {selectedTarget.username && (
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">@{selectedTarget.username}</p>
                  )}
                </div>
              </div>
            )}
            
            {selectedType === 'group' && selectedTarget && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center font-bold text-3xl">
                    {selectedTarget.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTarget.name}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Created by {selectedTarget.created_by === employee?.id ? 'You' : 'Admin'}</p>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-100 dark:border-slate-700 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Group Members</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    <GroupMembersList groupId={selectedTarget.id} supabase={supabase} currentUserId={employee?.id} employeeList={employeeList} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="dark:text-white font-bold">Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Group Name</label>
              <Input
                placeholder="e.g. Project Alpha Team"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:text-white rounded-xl h-12 font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Select Members</label>
              <div className="border border-gray-100 dark:border-slate-700 rounded-2xl max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700/50 bg-white dark:bg-slate-900/30">
                {employeeList.map(emp => (
                  <label key={emp.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMembers([...selectedMembers, emp.id]);
                        else setSelectedMembers(selectedMembers.filter(id => id !== emp.id));
                      }}
                      className="rounded border-gray-200 dark:border-slate-600 text-orange-500 focus:ring-orange-500 w-4 h-4"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
                        {(emp.name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{emp.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400">@{emp.username}</p>
                      </div>
                    </div>
                  </label>
                ))}
                {employeeList.length === 0 && (
                  <div className="p-4 text-sm font-bold text-gray-400 text-center">No other employees found.</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-4 sm:space-x-0 pt-4 mt-2 border-t border-gray-100 dark:border-slate-700/50">
            <Button variant="outline" onClick={() => setShowCreateGroup(false)} disabled={creatingGroup} className="border-gray-200 dark:border-slate-700 dark:text-slate-300 rounded-xl font-bold h-10">
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={creatingGroup || !newGroupName.trim() || selectedMembers.length === 0} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-10 shadow-md shadow-orange-500/20">
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("CHAT PAGE ERROR:", error, info);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', backgroundColor: '#fee' }}>
          <h2>Something went wrong in ChatPage.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.info && this.state.info.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ChatPageWrapper(props: any) {
  return <ErrorBoundary><ChatPage {...props} /></ErrorBoundary>;
}
