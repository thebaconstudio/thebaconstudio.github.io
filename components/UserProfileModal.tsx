import React from 'react';
import { User, Server } from '../types';
import { X, Users, MessageSquare, UserPlus, Check } from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  server?: Server;
  currentUserId?: string;
  onSwitchAccount?: (userId: string) => void;
  onSendMessage?: (userId: string) => void;
  onAddFriend?: (userId: string) => void;
  isFriend?: boolean;
  allUsers?: Record<string, User>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
    user, 
    onClose, 
    server, 
    currentUserId, 
    onSwitchAccount,
    onSendMessage,
    onAddFriend,
    isFriend,
    allUsers 
}) => {
  // Get user roles in the current server context
  const userRoleIds = server?.members[user.id] || [];
  const userRoles = server?.roles.filter(r => userRoleIds.includes(r.id)) || [];

  const isCurrentUser = user.id === currentUserId;

  return (
    <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-[360px] bg-[#111214] rounded-2xl overflow-hidden shadow-2xl relative animate-scale-in"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
      >
        {/* Banner */}
        <div 
          className="h-24 w-full relative" 
          style={{ backgroundColor: user.bannerColor || '#1e293b' }}
        >
             <button onClick={onClose} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition">
                 <X size={16} />
             </button>
             
             {/* Switch Account (Debug/Demo feature) */}
             {onSwitchAccount && !user.isBot && !isCurrentUser && (
                 <button 
                    onClick={() => onSwitchAccount(user.id)}
                    className="absolute top-2 left-2 px-3 py-1.5 rounded bg-black/20 hover:bg-black/40 text-white/70 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                 >
                     <Users size={14} /> Switch
                 </button>
             )}
        </div>

        {/* Avatar */}
        <div className="px-4 relative flex justify-between items-end -mt-10 mb-3">
            <div className="p-1.5 bg-[#111214] rounded-full">
                <div className="relative">
                    <img 
                        src={user.avatar} 
                        alt={user.username} 
                        className="w-20 h-20 rounded-full object-cover"
                    />
                    <div 
                        className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#111214] ${
                            user.status === 'online' ? 'bg-green-500' :
                            user.status === 'idle' ? 'bg-yellow-500' :
                            user.status === 'dnd' ? 'bg-red-500' : 'bg-slate-500'
                        }`}
                    />
                </div>
            </div>
            
            {/* Action Buttons */}
            {!isCurrentUser && !user.isBot && (
                <div className="flex gap-2 mb-1">
                    {onSendMessage && (
                        <button 
                            onClick={() => onSendMessage(user.id)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition shadow-lg"
                            title="Send Message"
                        >
                            <MessageSquare size={20} />
                        </button>
                    )}
                    {onAddFriend && (
                        <button 
                            onClick={() => onAddFriend(user.id)}
                            disabled={isFriend}
                            className={`p-2 rounded-full text-white transition shadow-lg flex items-center justify-center ${
                                isFriend ? 'bg-green-600 cursor-default' : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                            title={isFriend ? "Friends" : "Add Friend"}
                        >
                            {isFriend ? <Check size={20} /> : <UserPlus size={20} />}
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Content */}
        <div className="px-5 pb-6">
          <div className="mb-4">
             <h2 className="text-xl font-bold text-white leading-tight">{user.username}</h2>
             {user.isBot && <span className="bg-indigo-600 text-[10px] px-1.5 py-0.5 rounded text-white font-medium align-middle ml-1">BOT</span>}
             <p className="text-xs text-slate-400 mt-0.5">#{user.id}</p>
          </div>

          <div className="bg-[#2b2d31] rounded-lg p-3 mb-4">
              <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">About Me</h3>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {user.bio || "This user is a mystery... ✨"}
              </p>
          </div>

          {userRoles.length > 0 && (
              <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Roles</h3>
                  <div className="flex flex-wrap gap-1.5">
                      {userRoles.map(role => (
                          <div 
                            key={role.id} 
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#2b2d31] border border-transparent"
                          >
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                              <span className="text-xs font-medium text-slate-200">{role.name}</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Quick Note Input Mock */}
          <div className="mt-2">
              <input 
                type="text" 
                placeholder={`Message @${user.username}`} 
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition"
              />
          </div>
        </div>
      </div>
    </div>
  );
};