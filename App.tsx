import React, { useState, useEffect } from 'react';
import { ServerRail } from './components/ServerRail';
import { ChatArea } from './components/ChatArea';
import { UserList } from './components/UserList';
import { VideoPlayer } from './components/VideoPlayer';
import { UserProfileModal } from './components/UserProfileModal';
import { CreateDMModal } from './components/CreateDMModal';
import { INITIAL_SERVERS, INITIAL_VIDEOS, INITIAL_USERS, STORAGE_KEYS, MAIN_USER_ID } from './constants';
import { AppState, ViewMode, Video, Server, Role, User, Message, DMChannel } from './types';
import { Hash, Volume2, Search, Bell, Video as VideoIcon, Upload, Sparkles, Settings, Camera, LogOut, Users, Compass, Shield, Plus, X, MessageSquare, UserPlus, Check } from 'lucide-react';
import { generateVideoDescription, generateAIResponse } from './services/geminiService';

const App = () => {
  // --- PERSISTENCE HELPERS ---
  const loadFromStorage = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      console.error("Storage load error", e);
      return fallback;
    }
  };

  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Storage save error", e);
    }
  };

  // --- STATE INITIALIZATION ---
  const [dbServers, setDbServers] = useState<Server[]>(() => loadFromStorage(STORAGE_KEYS.SERVERS, INITIAL_SERVERS));
  const [dbUsers, setDbUsers] = useState<Record<string, User>>(() => loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [dbVideos, setDbVideos] = useState<Video[]>(() => loadFromStorage(STORAGE_KEYS.VIDEOS, INITIAL_VIDEOS));
  const [dbDMs, setDbDMs] = useState<DMChannel[]>(() => loadFromStorage(STORAGE_KEYS.DMS, []));
  
  const [currentUserId, setCurrentUserId] = useState<string>(() => loadFromStorage(STORAGE_KEYS.CURRENT_USER_ID, MAIN_USER_ID));

  const currentUser = dbUsers[currentUserId] || dbUsers[MAIN_USER_ID];

  const [state, setState] = useState<AppState>({
    currentView: ViewMode.VIDEO_FEED,
    activeServerId: null,
    activeChannelId: null,
    activeVideoId: null,
    activeDMChannelId: null,
    currentUser: currentUser
  });

  // --- EFFECTS FOR PERSISTENCE ---
  useEffect(() => saveToStorage(STORAGE_KEYS.SERVERS, dbServers), [dbServers]);
  useEffect(() => saveToStorage(STORAGE_KEYS.USERS, dbUsers), [dbUsers]);
  useEffect(() => saveToStorage(STORAGE_KEYS.VIDEOS, dbVideos), [dbVideos]);
  useEffect(() => saveToStorage(STORAGE_KEYS.DMS, dbDMs), [dbDMs]);
  useEffect(() => saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, currentUserId), [currentUserId]);

  useEffect(() => {
    setState(prev => ({ ...prev, currentUser: dbUsers[currentUserId] }));
  }, [currentUserId, dbUsers]);

  // -- Modal States --
  const [showUpload, setShowUpload] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showCreateDMModal, setShowCreateDMModal] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  
  // -- Form States --
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
  const [editBio, setEditBio] = useState(currentUser.bio || '');

  useEffect(() => {
      setEditUsername(currentUser.username);
      setEditAvatar(currentUser.avatar);
      setEditBio(currentUser.bio || '');
  }, [currentUser]);
  
  const [newServerName, setNewServerName] = useState('');
  const [newServerIcon, setNewServerIcon] = useState('');

  const [settingsTab, setSettingsTab] = useState<'overview' | 'roles' | 'members'>('overview');
  const [editServerName, setEditServerName] = useState('');
  const [editServerDesc, setEditServerDesc] = useState('');
  const [editServerIcon, setEditServerIcon] = useState('');
  
  const [uploadTitle, setUploadTitle] = useState('');
  const [generatedDesc, setGeneratedDesc] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Derived state
  const myServers = dbServers.filter(s => s.members[currentUser.id]);
  const activeServer = dbServers.find(s => s.id === state.activeServerId);
  const activeChannel = activeServer?.channels.find(c => c.id === state.activeChannelId) || activeServer?.channels[0];
  const activeVideo = dbVideos.find(v => v.id === state.activeVideoId);
  const isServerOwner = activeServer?.ownerId === currentUser.id;
  
  // My DMs (sorted by last message roughly)
  const myDMs = dbDMs
    .filter(dm => dm.participants.includes(currentUser.id))
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    
  const activeDM = dbDMs.find(dm => dm.id === state.activeDMChannelId);

  // -- Helpers for DMs --
  const getDMName = (dm: DMChannel, currentUid: string): string => {
      if (dm.name) return dm.name;
      if (dm.participants.length === 2) {
          const otherId = dm.participants.find(id => id !== currentUid);
          return dbUsers[otherId || '']?.username || 'Unknown User';
      }
      // Group without name
      const otherIds = dm.participants.filter(id => id !== currentUid).slice(0, 3);
      const names = otherIds.map(id => dbUsers[id]?.username).join(', ');
      return names + (dm.participants.length > 4 ? ` +${dm.participants.length - 4}` : '');
  };

  // -- Handlers --

  const handleSwitchUser = (targetUserId: string) => {
      setCurrentUserId(targetUserId);
      setViewedUser(null); 
      // Reset view to feed to avoid stale state
      setState(prev => ({ 
          ...prev, 
          activeServerId: null, 
          currentView: ViewMode.VIDEO_FEED,
          activeDMChannelId: null,
          activeVideoId: null
      }));
  };

  const handleServerSelect = (serverId: string | null) => {
    setState(prev => ({
      ...prev,
      activeServerId: serverId,
      currentView: serverId ? ViewMode.SERVER_CHAT : ViewMode.VIDEO_FEED,
      activeVideoId: null,
      activeChannelId: null,
      activeDMChannelId: null
    }));
  };

  const handleDiscoverySelect = () => {
    setState(prev => ({
      ...prev,
      activeServerId: null,
      currentView: ViewMode.DISCOVERY,
      activeVideoId: null,
      activeDMChannelId: null
    }));
  };

  const handleStartDM = (targetUserId: string) => {
      setViewedUser(null); 

      if (targetUserId === currentUser.id) return;

      // Check if existing 1-on-1 DM exists
      const existingDM = dbDMs.find(dm => 
          dm.participants.length === 2 &&
          dm.participants.includes(currentUser.id) && 
          dm.participants.includes(targetUserId)
      );

      if (existingDM) {
          setState(prev => ({
              ...prev,
              activeServerId: null,
              activeDMChannelId: existingDM.id,
              currentView: ViewMode.DM_CHAT,
              activeVideoId: null
          }));
      } else {
          // Create new DM
          const newDM: DMChannel = {
              id: `dm_${[currentUser.id, targetUserId].sort().join('_')}`,
              participants: [currentUser.id, targetUserId],
              messages: [],
              lastMessageAt: Date.now()
          };
          setDbDMs(prev => [newDM, ...prev]);
          setState(prev => ({
              ...prev,
              activeServerId: null,
              activeDMChannelId: newDM.id,
              currentView: ViewMode.DM_CHAT,
              activeVideoId: null
          }));
      }
  };

  const handleCreateGroupDM = (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;

      if (selectedIds.length === 1) {
          handleStartDM(selectedIds[0]);
          setShowCreateDMModal(false);
          return;
      }

      // Group Chat Logic
      const participantIds = [currentUser.id, ...selectedIds];
      const newDM: DMChannel = {
          id: `group_${Date.now()}`,
          participants: participantIds,
          messages: [],
          lastMessageAt: Date.now(),
      };

      setDbDMs(prev => [newDM, ...prev]);
      setState(prev => ({
          ...prev,
          activeServerId: null,
          activeDMChannelId: newDM.id,
          currentView: ViewMode.DM_CHAT,
          activeVideoId: null
      }));
      setShowCreateDMModal(false);
  };

  const handleAddFriend = (targetUserId: string) => {
      if (currentUser.friends?.includes(targetUserId)) return;
      
      const updatedUser = {
          ...currentUser,
          friends: [...(currentUser.friends || []), targetUserId]
      };
      
      setDbUsers(prev => ({ ...prev, [currentUser.id]: updatedUser }));
  };

  const handleJoinServer = (server: Server) => {
      const updatedServer = {
          ...server,
          memberCount: (server.memberCount || 0) + 1,
          members: { ...server.members, [currentUser.id]: [] }
      };
      setDbServers(prev => prev.map(s => s.id === server.id ? updatedServer : s));
      handleServerSelect(server.id);
  };

  const handleLeaveServer = (serverId: string) => {
      if (isServerOwner) {
          if(confirm("As the owner, leaving will delete the server. Are you sure?")) {
             setDbServers(prev => prev.filter(s => s.id !== serverId));
             handleServerSelect(null);
             setShowServerSettings(false);
          }
          return;
      }

      const server = dbServers.find(s => s.id === serverId);
      if (server) {
          const { [currentUser.id]: removed, ...remainingMembers } = server.members;
          const updatedServer = {
              ...server,
              memberCount: Math.max(0, (server.memberCount || 1) - 1),
              members: remainingMembers
          };
          setDbServers(prev => prev.map(s => s.id === serverId ? updatedServer : s));
      }

      handleServerSelect(null);
      setShowServerSettings(false);
  };

  const handleVideoSelect = (video: Video) => {
    setState(prev => ({
      ...prev,
      currentView: ViewMode.VIDEO_PLAYER,
      activeVideoId: video.id
    }));
  };

  const handleBackToFeed = () => {
    setState(prev => ({
      ...prev,
      currentView: ViewMode.VIDEO_FEED,
      activeVideoId: null
    }));
  };

  // --- Chat Functions ---
  const handleSendMessage = async (channelId: string, content: string, isDM: boolean = false) => {
      const newMessage: Message = {
          id: Date.now().toString(),
          userId: currentUser.id,
          content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (isDM) {
          setDbDMs(prev => prev.map(dm => {
              if (dm.id === channelId) {
                  return {
                      ...dm,
                      messages: [...dm.messages, newMessage],
                      lastMessageAt: Date.now()
                  };
              }
              return dm;
          }));
      } else {
          // Server Chat
          if (!activeServer) return;
          const updatedServers = dbServers.map(s => {
              if (s.id === activeServer.id) {
                  return {
                      ...s,
                      channels: s.channels.map(c => {
                          if (c.id === channelId) {
                              return { ...c, messages: [...c.messages, newMessage] };
                          }
                          return c;
                      })
                  };
              }
              return s;
          });
          setDbServers(updatedServers);

          // AI Logic only in server chat for now
          if (content.toLowerCase().includes('@furbot') || content.toLowerCase().includes('@ai')) {
             const channel = activeServer.channels.find(c => c.id === channelId);
             const context = (channel ? channel.messages.slice(-5) : []).map(m => {
                 const u = dbUsers[m.userId] || { username: 'User' };
                 return `${u.username}: ${m.content}`;
             }).join('\n');
             const aiResponse = await generateAIResponse(context, content);
             const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                userId: 'bot',
                content: aiResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
             };
             setDbServers(prev => prev.map(s => {
                  if (s.id === activeServer.id) {
                      return { ...s, channels: s.channels.map(c => c.id === channelId ? { ...c, messages: [...c.messages, botMessage] } : c) };
                  }
                  return s;
              }));
          }
      }
  };
  
  const handleGenerateDescription = async () => {
    if(!uploadTitle) return;
    setIsGeneratingDesc(true);
    const desc = await generateVideoDescription(uploadTitle);
    setGeneratedDesc(desc);
    setIsGeneratingDesc(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadVideo = () => {
    if (!uploadFile || !uploadTitle) return;

    const newVideo: Video = {
      id: `v${Date.now()}`,
      title: uploadTitle,
      thumbnail: 'https://picsum.photos/seed/new/400/225', 
      uploader: currentUser,
      views: '0',
      timestamp: 'Just now',
      length: '0:00',
      description: generatedDesc || 'No description.',
      url: URL.createObjectURL(uploadFile)
    };

    setDbVideos([newVideo, ...dbVideos]);
    setUploadTitle('');
    setGeneratedDesc('');
    setUploadFile(null);
    setShowUpload(false);
    handleVideoSelect(newVideo);
  };

  const openProfile = () => {
      setEditUsername(currentUser.username);
      setEditAvatar(currentUser.avatar);
      setEditBio(currentUser.bio || '');
      setShowProfile(true);
  };

  const saveProfile = () => {
      const updatedUser = { ...currentUser, username: editUsername, avatar: editAvatar, bio: editBio };
      setDbUsers(prev => ({ ...prev, [currentUser.id]: updatedUser }));
      setShowProfile(false);
  };

  const createServer = () => {
      if (!newServerName.trim()) return;
      const newId = `s${Date.now()}`;
      const newServer: Server = {
          id: newId,
          name: newServerName,
          icon: newServerIcon || `https://ui-avatars.com/api/?name=${encodeURIComponent(newServerName)}&background=random`,
          description: 'A brand new den!',
          memberCount: 1,
          ownerId: currentUser.id,
          roles: [{ id: 'r1', name: 'Alpha', color: '#ef4444', permissions: ['all'] }],
          members: { [currentUser.id]: ['r1'] },
          channels: [
              { id: `c${Date.now()}-1`, name: 'welcome', type: 'text', messages: [] },
              { id: `c${Date.now()}-2`, name: 'general', type: 'text', messages: [] },
          ]
      };
      setDbServers(prev => [...prev, newServer]);
      setNewServerName('');
      setNewServerIcon('');
      setShowCreateServer(false);
      handleServerSelect(newId);
  };

  const openServerSettings = () => {
      if (!activeServer || activeServer.ownerId !== currentUser.id) return;
      setEditServerName(activeServer.name);
      setEditServerDesc(activeServer.description || '');
      setEditServerIcon(activeServer.icon);
      setSettingsTab('overview');
      setShowServerSettings(true);
  };

  const saveServerOverview = () => {
      if (!activeServer || activeServer.ownerId !== currentUser.id) return;
      const updatedServers = dbServers.map(s => {
          if (s.id === activeServer.id) {
              return { ...s, name: editServerName, description: editServerDesc, icon: editServerIcon };
          }
          return s;
      });
      setDbServers(updatedServers);
  };

  const addRole = () => {
      if (!activeServer || activeServer.ownerId !== currentUser.id) return;
      const newRole: Role = {
          id: `r${Date.now()}`,
          name: 'New Role',
          color: '#94a3b8',
          permissions: []
      };
      setDbServers(prev => prev.map(s => s.id === activeServer.id ? { ...s, roles: [...s.roles, newRole] } : s));
  };

  const updateRole = (roleId: string, updates: Partial<Role>) => {
      if (!activeServer || activeServer.ownerId !== currentUser.id) return;
      setDbServers(prev => prev.map(s => s.id === activeServer.id ? { ...s, roles: s.roles.map(r => r.id === roleId ? { ...r, ...updates } : r) } : s));
  };

  const deleteRole = (roleId: string) => {
      if (!activeServer || activeServer.ownerId !== currentUser.id) return;
      setDbServers(prev => prev.map(s => s.id === activeServer.id ? { ...s, roles: s.roles.filter(r => r.id !== roleId) } : s));
  };

  const toggleUserRole = (userId: string, roleId: string) => {
      if (!activeServer || activeServer.ownerId !== currentUser.id) return;
      const updatedServers = dbServers.map(s => {
          if (s.id === activeServer.id) {
              const userRoles = s.members[userId] || [];
              let newUserRoles;
              if (userRoles.includes(roleId)) {
                  newUserRoles = userRoles.filter(id => id !== roleId);
              } else {
                  newUserRoles = [...userRoles, roleId];
              }
              return { ...s, members: { ...s.members, [userId]: newUserRoles } };
          }
          return s;
      });
      setDbServers(updatedServers);
  };
  
  const handleViewProfile = (user: User) => {
      setViewedUser(user);
  };

  return (
    <div className="flex w-screen h-screen bg-slate-900 overflow-hidden font-sans">
      {/* Leftmost Rail */}
      <ServerRail 
        servers={myServers} 
        activeServerId={state.activeServerId} 
        currentView={state.currentView}
        onServerSelect={handleServerSelect} 
        onDiscoverySelect={handleDiscoverySelect}
        onCreateServer={() => setShowCreateServer(true)}
      />

      {/* SECONDARY SIDEBAR - Logic Branching */}
      {/* 1. Server Context */}
      {state.activeServerId && activeServer ? (
        <div className="w-60 bg-slate-900 flex flex-col shrink-0">
          <div className="h-12 px-4 flex items-center justify-between shadow-sm bg-slate-900 border-b border-slate-950 group relative hover:bg-slate-800 transition-colors cursor-pointer">
            <h2 className="font-bold text-slate-100 truncate flex-1">{activeServer.name}</h2>
            {isServerOwner ? (
                 <button onClick={openServerSettings} className="text-slate-400 hover:text-white p-1">
                     <Settings size={16} />
                 </button>
            ) : (
                <button 
                    onClick={() => handleLeaveServer(activeServer.id)}
                    className="text-slate-500 hover:text-red-500 p-1 opacity-100 transition-opacity"
                    title="Leave Den"
                >
                    <LogOut size={16} />
                </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeServer.channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setState(prev => ({ ...prev, activeChannelId: channel.id }))}
                className={`w-full flex items-center px-2 py-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 group
                  ${(state.activeChannelId === channel.id || (!state.activeChannelId && activeServer.channels[0].id === channel.id)) ? 'bg-slate-800 text-white' : ''}`}
              >
                {channel.type === 'text' ? <Hash size={18} className="mr-1.5 text-slate-500 group-hover:text-slate-300" /> : <Volume2 size={18} className="mr-1.5 text-slate-500 group-hover:text-slate-300" />}
                <span className="font-medium truncate">{channel.name}</span>
              </button>
            ))}
          </div>
          {/* User Panel */}
          <div className="bg-slate-950/50 p-2 flex items-center gap-2 group cursor-pointer hover:bg-slate-950/80 transition" onClick={openProfile}>
             <div className="relative">
                <img src={currentUser.avatar} className="w-8 h-8 rounded-full object-cover" alt="Me" />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${currentUser.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{currentUser.username}</div>
                <div className="text-xs text-slate-400 truncate flex items-center gap-1">
                   #{currentUser.id}
                </div>
             </div>
          </div>
        </div>
      ) : !state.activeServerId ? (
        /* 2. HOME / DM Context */
        <div className="w-60 bg-slate-900 flex flex-col shrink-0">
           {/* Fixed Header */}
           <div className="h-12 px-4 flex items-center border-b border-slate-950">
               <input type="text" placeholder="Find or start a conversation" className="bg-slate-950 w-full text-xs text-white p-1.5 rounded border border-slate-800 focus:border-indigo-500 outline-none" />
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
               {/* View Buttons */}
               <button 
                  onClick={() => setState(prev => ({ ...prev, currentView: ViewMode.VIDEO_FEED, activeDMChannelId: null }))}
                  className={`w-full flex items-center px-2 py-2 rounded font-medium ${state.currentView === ViewMode.VIDEO_FEED ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
               >
                   <VideoIcon size={18} className="mr-3" /> Videos
               </button>
               <button 
                  onClick={() => setState(prev => ({ ...prev, currentView: ViewMode.FRIENDS, activeDMChannelId: null }))}
                  className={`w-full flex items-center px-2 py-2 rounded font-medium ${state.currentView === ViewMode.FRIENDS ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
               >
                   <Users size={18} className="mr-3" /> Friends
               </button>

               {/* Direct Messages List */}
               <div className="pt-4 pb-1 pl-2 text-xs font-bold text-slate-500 uppercase flex justify-between items-center group">
                   <span>Direct Messages</span>
                   <button onClick={() => setShowCreateDMModal(true)} className="mr-2 text-slate-400 hover:text-white transition">
                       <Plus size={16} />
                   </button>
               </div>
               
               {myDMs.map(dm => {
                   const isGroup = dm.participants.length > 2;
                   const dmName = getDMName(dm, currentUser.id);
                   const otherUserId = dm.participants.find(id => id !== currentUser.id);
                   const otherUser = dbUsers[otherUserId || ''] || { username: 'Unknown', avatar: '', status: 'offline' };
                   
                   // Determine Icon
                   let iconSrc = otherUser.avatar;
                   let statusColor = otherUser.status === 'online' ? 'bg-green-500' : otherUser.status === 'idle' ? 'bg-yellow-500' : 'bg-slate-500';

                   if (isGroup) {
                       // Use first 2 avatars or generic
                       // For simplicity, just show generic group icon or first user avatar
                       // Could implement a multi-avatar stacked UI here later
                   }

                   return (
                       <button
                           key={dm.id}
                           onClick={() => setState(prev => ({ ...prev, currentView: ViewMode.DM_CHAT, activeDMChannelId: dm.id }))}
                           className={`w-full flex items-center px-2 py-1.5 rounded group ${state.activeDMChannelId === dm.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                       >
                           <div className="relative mr-3">
                               {isGroup ? (
                                   <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                       <Users size={16} />
                                   </div>
                               ) : (
                                   <>
                                     <img src={iconSrc} className="w-8 h-8 rounded-full object-cover" />
                                     <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${statusColor}`}></div>
                                   </>
                               )}
                           </div>
                           <div className="flex-1 text-left truncate">
                               <div className="font-medium truncate">{dmName}</div>
                               <div className="text-[10px] text-slate-500 truncate">{dm.messages.length > 0 ? dm.messages[dm.messages.length-1].content : 'No messages'}</div>
                           </div>
                       </button>
                   );
               })}
           </div>

            {/* User Panel (Bottom of sidebar) */}
            <div className="bg-slate-950/50 p-2 flex items-center gap-2 group cursor-pointer hover:bg-slate-950/80 transition" onClick={openProfile}>
                <div className="relative">
                    <img src={currentUser.avatar} className="w-8 h-8 rounded-full object-cover" alt="Me" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${currentUser.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{currentUser.username}</div>
                    <div className="text-xs text-slate-400 truncate flex items-center gap-1">#{currentUser.id}</div>
                </div>
            </div>
        </div>
      ) : null}


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-800 relative">
        {/* Top Bar (Only on Video Feed, Discovery, or Friends) */}
        {!state.activeServerId && state.currentView !== ViewMode.DM_CHAT && (
            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    {state.currentView === ViewMode.DISCOVERY ? (
                        <span className="bg-green-600 p-1.5 rounded text-white"><Compass size={20}/></span>
                    ) : state.currentView === ViewMode.FRIENDS ? (
                        <span className="bg-slate-600 p-1.5 rounded text-white"><Users size={20}/></span>
                    ) : (
                        <span className="bg-indigo-600 p-1.5 rounded text-white"><VideoIcon size={20}/></span>
                    )}
                    <h1 className="text-lg font-bold text-white hidden md:block">
                        {state.currentView === ViewMode.DISCOVERY ? 'Discover Dens' : state.currentView === ViewMode.FRIENDS ? 'Friends' : 'FurStream'}
                    </h1>
                </div>
                
                <div className="flex-1 max-w-xl mx-4">
                    {state.currentView !== ViewMode.FRIENDS && (
                        <div className="relative">
                            <input type="text" placeholder={state.currentView === ViewMode.DISCOVERY ? "Find a community..." : "Search videos, creators..."} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-full py-1.5 pl-10 pr-4 focus:outline-none focus:border-indigo-500 transition-all" />
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                    <button onClick={() => setShowUpload(true)} className="hover:text-white flex items-center gap-1 bg-slate-800 py-1.5 px-3 rounded-full border border-slate-700 hover:bg-slate-700 transition">
                       <Upload size={18} /> <span className="text-sm font-medium hidden sm:inline">Upload</span>
                    </button>
                    <Bell size={20} className="hover:text-white cursor-pointer" />
                    <button onClick={openProfile} className="relative group">
                        <img src={currentUser.avatar} className="w-8 h-8 rounded-full cursor-pointer border border-slate-700 object-cover" />
                        <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Settings size={12} className="text-white" />
                        </div>
                    </button>
                </div>
            </div>
        )}

        {/* Content Views */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* Server Chat */}
          {state.currentView === ViewMode.SERVER_CHAT && activeChannel && activeServer && (
            <div className="flex h-full">
                <div className="flex-1 min-w-0 h-full">
                    <ChatArea 
                        channel={activeChannel} 
                        currentUser={currentUser}
                        server={activeServer}
                        serverName={activeServer.name}
                        users={dbUsers}
                        onViewProfile={handleViewProfile}
                        onSendMessage={(text) => handleSendMessage(activeChannel.id, text, false)}
                    />
                </div>
                <UserList 
                    server={activeServer}
                    users={dbUsers}
                    onViewProfile={handleViewProfile}
                />
            </div>
          )}

          {/* DM Chat */}
          {state.currentView === ViewMode.DM_CHAT && activeDM && (
              <div className="flex h-full">
                  <div className="flex-1 min-w-0 h-full">
                      {/* DM Wrapper needs to adapter DMChannel to Channel interface expected by ChatArea */}
                      <ChatArea 
                        channel={{ ...activeDM, name: getDMName(activeDM, currentUser.id), type: 'text' }}
                        currentUser={currentUser}
                        serverName="Direct Message"
                        users={dbUsers}
                        onViewProfile={handleViewProfile}
                        onSendMessage={(text) => handleSendMessage(activeDM.id, text, true)}
                      />
                  </div>
              </div>
          )}

          {/* Friends List */}
          {state.currentView === ViewMode.FRIENDS && (
              <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                  <h2 className="text-xl font-bold text-white mb-6">Friends</h2>
                  <div className="space-y-2">
                      {/* Pending / Suggestions could go here */}
                      <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">My Pack — {(currentUser.friends || []).length}</h3>
                      {(currentUser.friends || []).length === 0 ? (
                          <div className="text-slate-400 text-sm italic">You haven't added any friends yet. Explore servers to meet people!</div>
                      ) : (
                          (currentUser.friends || []).map(friendId => {
                              const friend = dbUsers[friendId];
                              if (!friend) return null;
                              return (
                                  <div key={friendId} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-800 hover:bg-slate-800 transition">
                                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleViewProfile(friend)}>
                                          <div className="relative">
                                              <img src={friend.avatar} className="w-10 h-10 rounded-full object-cover" />
                                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${friend.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                                          </div>
                                          <div>
                                              <div className="font-bold text-white">{friend.username}</div>
                                              <div className="text-xs text-slate-400">{friend.status}</div>
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                          <button 
                                              onClick={() => handleStartDM(friend.id)}
                                              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-200"
                                              title="Message"
                                          >
                                              <MessageSquare size={18} />
                                          </button>
                                          <button className="p-2 bg-slate-700 hover:bg-red-600/20 hover:text-red-500 rounded-full text-slate-200" title="Remove">
                                              <X size={18} />
                                          </button>
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </div>
          )}

          {state.currentView === ViewMode.DISCOVERY && (
              <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                  <div className="max-w-6xl mx-auto">
                      <div className="mb-8 text-center">
                          <h2 className="text-3xl font-bold text-white mb-2">Find Your Pack</h2>
                          <p className="text-slate-400">Join communities that share your interests, hobbies, and species.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {dbServers.map(server => {
                              const isJoined = server.members[currentUser.id];
                              return (
                                  <div key={server.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all group shadow-lg">
                                      <div className="h-24 bg-slate-800 relative">
                                          {server.banner && <img src={server.banner} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />}
                                          <div className="absolute -bottom-6 left-4 border-4 border-slate-900 rounded-2xl overflow-hidden w-16 h-16 bg-slate-800">
                                              <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                                          </div>
                                      </div>
                                      <div className="pt-8 px-4 pb-4">
                                          <div className="flex justify-between items-start mb-2">
                                              <h3 className="font-bold text-white text-lg truncate pr-2">{server.name}</h3>
                                              {isJoined ? (
                                                  <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded border border-slate-700">JOINED</span>
                                              ) : (
                                                  <button 
                                                      onClick={() => handleJoinServer(server)}
                                                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors shadow-lg shadow-indigo-600/20"
                                                  >
                                                      Join
                                                  </button>
                                              )}
                                          </div>
                                          <p className="text-slate-400 text-sm mb-4 line-clamp-2 h-10">{server.description || 'No description provided.'}</p>
                                          <div className="flex items-center text-slate-500 text-xs">
                                              <Users size={14} className="mr-1" />
                                              <span>{server.memberCount || 0} Members</span>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          )}

          {state.currentView === ViewMode.VIDEO_FEED && (
            <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                {dbVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <VideoIcon size={48} className="mb-4 text-slate-600" />
                        <h2 className="text-xl font-bold text-white mb-2">No Videos Yet</h2>
                        <p className="text-center max-w-md">Be the first to upload a video to start the stream!</p>
                        <button 
                            onClick={() => setShowUpload(true)}
                            className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full font-medium transition-colors"
                        >
                            Upload Video
                        </button>
                    </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-white mb-4">Recommended For You</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {dbVideos.map(video => (
                            <div key={video.id} onClick={() => handleVideoSelect(video)} className="group cursor-pointer">
                                <div className="aspect-video bg-slate-700 rounded-xl overflow-hidden mb-3 relative shadow-md">
                                    {video.url ? (
                                        <video src={video.url} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    )}
                                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">{video.length}</span>
                                </div>
                                <div className="flex gap-3">
                                    <img src={video.uploader.avatar} alt="" className="w-9 h-9 rounded-full mt-1" />
                                    <div>
                                        <h3 className="text-white font-medium line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">{video.title}</h3>
                                        <p className="text-slate-400 text-sm mt-1">{video.uploader.username}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">{video.views} views • {video.timestamp}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                  </>
                )}
            </div>
          )}

          {state.currentView === ViewMode.VIDEO_PLAYER && activeVideo && (
            <VideoPlayer 
                video={activeVideo} 
                onBack={handleBackToFeed}
                currentUser={currentUser}
                onViewProfile={handleViewProfile}
            />
          )}

        </div>
      </div>
      
      {/* --- MODALS --- */}
      
      {/* Create DM / Group Chat Modal */}
      {showCreateDMModal && (
          <CreateDMModal 
              friends={currentUser.friends || []}
              allUsers={dbUsers}
              onClose={() => setShowCreateDMModal(false)}
              onCreate={handleCreateGroupDM}
          />
      )}

      {/* View User Profile Modal */}
      {showProfile && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowProfile(false)}>
            <div className="w-full max-w-[400px] bg-[#111214] rounded-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <div className="h-24 w-full" style={{ backgroundColor: editAvatar && editAvatar.includes('picsum') ? '#4f46e5' : '#1e293b' }}>
                    <button onClick={() => setShowProfile(false)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-4 relative">
                    <div className="absolute -top-10 left-4 p-1.5 bg-[#111214] rounded-full">
                        <img src={editAvatar} className="w-20 h-20 rounded-full object-cover" />
                    </div>
                </div>
                <div className="mt-12 px-6 pb-6 space-y-4">
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Username</label>
                        <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-[#2b2d31] rounded p-2 text-white mt-1 focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Bio</label>
                        <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} className="w-full bg-[#2b2d31] rounded p-2 text-white mt-1 focus:outline-none resize-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Avatar URL</label>
                        <input type="text" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} className="w-full bg-[#2b2d31] rounded p-2 text-white mt-1 focus:outline-none text-xs" />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={saveProfile} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-medium">Save Changes</button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* View OTHER User Profile Modal */}
      {viewedUser && (
          <UserProfileModal 
            user={viewedUser} 
            currentUserId={currentUser.id}
            onClose={() => setViewedUser(null)} 
            server={activeServer}
            onSwitchAccount={handleSwitchUser}
            onSendMessage={handleStartDM}
            onAddFriend={handleAddFriend}
            isFriend={currentUser.friends?.includes(viewedUser.id)}
            allUsers={dbUsers}
          />
      )}
      
      {/* Server Settings Modal */}
      {showServerSettings && activeServer && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 rounded-2xl w-full max-w-4xl h-[600px] border border-slate-700 shadow-2xl flex overflow-hidden">
                  {/* Sidebar */}
                  <div className="w-64 bg-slate-950 p-4 border-r border-slate-800 flex flex-col">
                      <div className="mb-6 px-2">
                          <h3 className="font-bold text-slate-400 text-xs uppercase mb-2">{activeServer.name}</h3>
                          <h2 className="font-bold text-white text-xl">Settings</h2>
                      </div>
                      <div className="space-y-1">
                          <button 
                             onClick={() => setSettingsTab('overview')}
                             className={`w-full text-left px-3 py-2 rounded font-medium ${settingsTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                          >
                              Overview
                          </button>
                          <button 
                             onClick={() => setSettingsTab('roles')}
                             className={`w-full text-left px-3 py-2 rounded font-medium flex items-center justify-between ${settingsTab === 'roles' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                          >
                              Roles <Shield size={14} />
                          </button>
                          <button 
                             onClick={() => setSettingsTab('members')}
                             className={`w-full text-left px-3 py-2 rounded font-medium flex items-center justify-between ${settingsTab === 'members' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                          >
                              Members <Users size={14} />
                          </button>
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-800">
                          <button 
                              onClick={() => { handleLeaveServer(activeServer.id); }}
                              className="w-full text-left px-3 py-2 rounded font-medium text-red-500 hover:bg-slate-800 flex items-center justify-between"
                          >
                              Delete Server <LogOut size={14} />
                          </button>
                      </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-slate-900 flex flex-col relative">
                      <button 
                          onClick={() => setShowServerSettings(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 border border-slate-700"
                      >
                          <X size={20} />
                      </button>

                      <div className="p-8 overflow-y-auto custom-scrollbar h-full">
                          {settingsTab === 'overview' && (
                              <div className="max-w-xl">
                                  <h2 className="text-2xl font-bold text-white mb-6">Server Overview</h2>
                                  <div className="flex gap-6 mb-8">
                                      <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                                          {editServerIcon ? <img src={editServerIcon} className="w-full h-full object-cover" /> : <Camera size={24} className="text-slate-500" />}
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                              <span className="text-xs text-white font-bold">CHANGE</span>
                                          </div>
                                      </div>
                                      <div className="flex-1 space-y-4">
                                          <div>
                                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Server Name</label>
                                              <input 
                                                  type="text" 
                                                  value={editServerName}
                                                  onChange={(e) => setEditServerName(e.target.value)}
                                                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Icon URL</label>
                                              <input 
                                                  type="text" 
                                                  value={editServerIcon}
                                                  onChange={(e) => setEditServerIcon(e.target.value)}
                                                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none text-sm"
                                              />
                                          </div>
                                      </div>
                                  </div>
                                  <div className="mb-8">
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                                      <textarea 
                                          rows={3}
                                          value={editServerDesc}
                                          onChange={(e) => setEditServerDesc(e.target.value)}
                                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none resize-none"
                                      />
                                  </div>
                                  <button onClick={saveServerOverview} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-medium">Save Changes</button>
                              </div>
                          )}

                          {settingsTab === 'roles' && (
                              <div>
                                  <div className="flex justify-between items-center mb-6">
                                      <h2 className="text-2xl font-bold text-white">Roles</h2>
                                      <button onClick={addRole} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1">
                                          <Plus size={16} /> Create Role
                                      </button>
                                  </div>
                                  <div className="space-y-2">
                                      {activeServer.roles.map(role => (
                                          <div key={role.id} className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center gap-4 group">
                                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }}></div>
                                              <div className="flex-1">
                                                  <input 
                                                      type="text" 
                                                      value={role.name}
                                                      onChange={(e) => updateRole(role.id, { name: e.target.value })}
                                                      className="bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-indigo-500 w-full"
                                                  />
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <input 
                                                      type="color" 
                                                      value={role.color}
                                                      onChange={(e) => updateRole(role.id, { color: e.target.value })}
                                                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                                  />
                                                  <button onClick={() => deleteRole(role.id)} className="text-slate-500 hover:text-red-500 p-2"><X size={16}/></button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {settingsTab === 'members' && (
                              <div>
                                  <h2 className="text-2xl font-bold text-white mb-6">Members</h2>
                                  <div className="space-y-2">
                                      {/* Only show members of this server */}
                                      {Object.keys(activeServer.members).map(memberId => {
                                          const user = dbUsers[memberId];
                                          if (!user) return null;

                                          const userRoles = activeServer.members[memberId] || [];
                                          return (
                                              <div key={user.id} className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between">
                                                  <div className="flex items-center gap-3">
                                                      <img src={user.avatar} className="w-10 h-10 rounded-full" />
                                                      <div>
                                                          <div className="text-white font-medium flex items-center gap-2">
                                                              {user.username}
                                                              {user.id === activeServer.ownerId && <Shield size={12} className="text-yellow-500" />}
                                                          </div>
                                                          <div className="text-xs text-slate-500">#{user.id}</div>
                                                      </div>
                                                  </div>
                                                  <div className="flex gap-1">
                                                      {activeServer.roles.map(role => (
                                                          <button
                                                              key={role.id}
                                                              onClick={() => toggleUserRole(user.id, role.id)}
                                                              className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
                                                                  userRoles.includes(role.id) 
                                                                    ? 'bg-opacity-20 border-opacity-50' 
                                                                    : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'
                                                              }`}
                                                              style={{ 
                                                                  borderColor: userRoles.includes(role.id) ? role.color : undefined,
                                                                  backgroundColor: userRoles.includes(role.id) ? role.color + '33' : undefined, // 20% opacity hex
                                                                  color: userRoles.includes(role.id) ? role.color : undefined
                                                              }}
                                                          >
                                                              {role.name}
                                                          </button>
                                                      ))}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                 <h3 className="font-bold text-white text-lg">Upload Video</h3>
                 <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="p-6 space-y-4">
                  <div 
                    className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-slate-700/30 transition cursor-pointer relative"
                  >
                      <input 
                        type="file" 
                        accept="video/*" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload size={48} className={`mb-2 ${uploadFile ? 'text-indigo-500' : ''}`} />
                      {uploadFile ? (
                          <div className="text-center">
                              <p className="font-medium text-white">{uploadFile.name}</p>
                              <p className="text-xs text-indigo-400 mt-1">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                      ) : (
                          <>
                            <p className="font-medium">Drag & drop video files or click to browse</p>
                            <p className="text-xs text-slate-500 mt-1">MP4, WEBM up to 2GB</p>
                          </>
                      )}
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                      placeholder="e.g., My First Fursuit Walk"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm text-slate-400">Description</label>
                      <button 
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingDesc || !uploadTitle}
                        className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                      >
                         <Sparkles size={12} /> {isGeneratingDesc ? 'Generating...' : 'Auto-Generate with AI'}
                      </button>
                    </div>
                    <textarea 
                      rows={4} 
                      value={generatedDesc}
                      onChange={(e) => setGeneratedDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none resize-none"
                      placeholder="Tell viewers about your video..."
                    ></textarea>
                  </div>
              </div>
              <div className="p-4 bg-slate-900 flex justify-end gap-2">
                 <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-slate-300 hover:text-white font-medium">Cancel</button>
                 <button 
                    onClick={handleUploadVideo}
                    disabled={!uploadFile || !uploadTitle}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     Upload
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Create Server Modal */}
      {showCreateServer && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Create Your Den</h2>
                    <p className="text-slate-400 text-sm mb-6">Give your new server a personality with a name and an icon.</p>
                    
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center bg-slate-800 text-slate-500">
                             {newServerIcon ? (
                                 <img src={newServerIcon} className="w-full h-full rounded-full object-cover" />
                             ) : (
                                 <div className="text-center">
                                     <Camera size={24} className="mx-auto mb-1" />
                                     <span className="text-[10px] uppercase font-bold">Icon</span>
                                 </div>
                             )}
                        </div>
                    </div>

                    <div className="space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Server Name</label>
                            <input 
                                type="text"
                                value={newServerName}
                                onChange={(e) => setNewServerName(e.target.value)}
                                placeholder="My Awesome Den"
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none" 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Icon URL (Optional)</label>
                            <input 
                                type="text"
                                value={newServerIcon}
                                onChange={(e) => setNewServerIcon(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none text-sm" 
                            />
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-950 flex justify-between items-center">
                     <button onClick={() => setShowCreateServer(false)} className="text-slate-400 hover:text-white text-sm font-medium px-4">Back</button>
                     <button 
                        onClick={createServer}
                        disabled={!newServerName.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         Create Den
                     </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;