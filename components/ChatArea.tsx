import React, { useState, useRef, useEffect } from 'react';
import { Channel, Message, User, Server } from '../types';
import { Hash, Volume2, PlusCircle, Smile, Gift, Bot, Sparkles } from 'lucide-react';

interface ChatAreaProps {
  channel: Channel;
  currentUser: User;
  server?: Server; 
  serverName: string;
  users: Record<string, User>; // Add users prop to look up author details
  onViewProfile: (user: User) => void;
  onSendMessage: (text: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
    channel, 
    currentUser, 
    server, 
    serverName, 
    users, 
    onViewProfile,
    onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [channel.messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleMagicReply = async () => {
      // For now, this just adds a fun message, as logic was moved to App.tsx mostly.
      // We can just trigger a canned response or delegate to onSendMessage if we want user to say it.
      onSendMessage("✨ *FurBot Magic* ✨");
  };

  const getUserColor = (userId: string) => {
      if (!server) return '#e2e8f0'; 
      const roleIds = server.members[userId] || [];
      const primaryRole = server.roles.find(r => roleIds.includes(r.id));
      return primaryRole ? primaryRole.color : '#e2e8f0';
  };

  return (
    <div className="flex flex-col h-full bg-slate-700 min-w-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center shadow-sm bg-slate-800 shrink-0 border-b border-slate-900">
        <div className="flex items-center text-slate-200 font-bold mr-4 truncate">
          {channel.type === 'text' ? <Hash size={20} className="text-slate-400 mr-2 shrink-0" /> : <Volume2 size={20} className="text-slate-400 mr-2 shrink-0" />}
          <span className="truncate">{channel.name}</span>
        </div>
        <div className="text-slate-400 text-xs border-l border-slate-600 pl-4 truncate hidden sm:block">
          {serverName}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {channel.messages.map((msg) => {
          // Look up user from global DB or fallback to current if match (though global DB should have it)
          const user = users[msg.userId] || { id: msg.userId, username: 'Unknown', avatar: '', status: 'offline' };
          const nameColor = getUserColor(msg.userId);
          
          return (
            <div key={msg.id} className={`flex group ${msg.isSystem ? 'justify-center my-4' : ''}`}>
               {msg.isSystem ? (
                 <span className="text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded">{msg.content}</span>
               ) : (
                 <>
                  <img 
                    src={user.avatar} 
                    alt={user.username} 
                    onClick={() => onViewProfile(user as User)}
                    className="w-10 h-10 rounded-full mr-4 mt-1 hover:opacity-80 cursor-pointer object-cover" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1 flex-wrap">
                      <span 
                        onClick={() => onViewProfile(user as User)}
                        className="font-semibold mr-2 hover:underline cursor-pointer"
                        style={{ color: user.isBot ? '#818cf8' : nameColor }}
                      >
                        {user.username}
                      </span>
                      {user.isBot && <span className="bg-indigo-600 text-[10px] text-white px-1.5 rounded mr-2">BOT</span>}
                      <span className="text-xs text-slate-400">{msg.timestamp}</span>
                    </div>
                    <p className={`text-slate-300 whitespace-pre-wrap break-words ${user.isBot ? 'text-indigo-200' : ''}`}>{msg.content}</p>
                  </div>
                 </>
               )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-800 shrink-0">
        <div className="bg-slate-700 rounded-lg p-2 flex items-center shadow-inner">
          <button className="text-slate-400 hover:text-slate-200 p-2 shrink-0">
            <PlusCircle size={22} />
          </button>
          <input
            type="text"
            className="bg-transparent flex-1 text-slate-200 placeholder-slate-400 outline-none px-2 min-w-0"
            placeholder={`Message #${channel.name}`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            className="text-indigo-400 hover:text-indigo-300 p-2 mr-1 relative group shrink-0"
            onClick={handleMagicReply}
            title="Summon FurBot Magic"
          >
            <Sparkles size={22} />
          </button>
          <button className="text-slate-400 hover:text-slate-200 p-2 shrink-0 hidden sm:block">
            <Gift size={22} />
          </button>
          <button className="text-slate-400 hover:text-slate-200 p-2 shrink-0">
            <Smile size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};