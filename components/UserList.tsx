import React from 'react';
import { Server, User, Role } from '../types';

interface UserListProps {
  server: Server;
  users: Record<string, User>;
  onViewProfile: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({ server, users, onViewProfile }) => {
  // Helper to get user's highest role based on the order in server.roles
  const getUserHighestRole = (userId: string): Role | null => {
    const userRoleIds = server.members[userId] || [];
    // Find the first role in the server's role list that the user possesses
    // This assumes server.roles is ordered by priority (highest first)
    return server.roles.find(role => userRoleIds.includes(role.id)) || null;
  };

  // Group users by role
  // We use a Map to preserve the order of roles as defined in the server
  const groups = new Map<Role | 'Online', User[]>();
  
  // Initialize role groups
  server.roles.forEach(role => groups.set(role, []));
  groups.set('Online', []); // Fallback group for users without roles

  // Distribute members into groups
  Object.keys(server.members).forEach(userId => {
    const user = users[userId];
    if (!user) return;
    
    const role = getUserHighestRole(userId);
    if (role) {
      const group = groups.get(role);
      if (group) group.push(user);
    } else {
      groups.get('Online')?.push(user);
    }
  });

  return (
    <div className="w-60 bg-slate-900 border-l border-slate-950 flex flex-col h-full shrink-0 overflow-y-auto custom-scrollbar p-3 hidden md:flex">
       {/* Render Groups */}
       {Array.from(groups.entries()).map(([role, groupUsers]) => {
         if (groupUsers.length === 0) return null;
         
         const isOnlineGroup = role === 'Online';
         const roleName = isOnlineGroup ? 'Online' : (role as Role).name;
         // Use role color, or default slate if 'Online' (or if role color is too dark/black)
         const roleColor = isOnlineGroup ? '#94a3b8' : (role as Role).color; 

         return (
           <div key={isOnlineGroup ? 'online' : (role as Role).id} className="mb-6">
             <h3 className="text-xs font-bold uppercase mb-2 px-2 truncate" style={{ color: roleColor }}>
               {roleName} — {groupUsers.length}
             </h3>
             <div className="space-y-0.5">
               {groupUsers.map(user => (
                 <div 
                    key={user.id} 
                    onClick={() => onViewProfile(user)}
                    className="flex items-center px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer group opacity-90 hover:opacity-100 transition-opacity"
                 >
                    <div className="relative mr-3 shrink-0">
                       <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                       <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                           user.status === 'online' ? 'bg-green-500' :
                           user.status === 'idle' ? 'bg-yellow-500' :
                           user.status === 'dnd' ? 'bg-red-500' : 'bg-slate-500'
                       }`}></div>
                    </div>
                    <div className="min-w-0 overflow-hidden">
                       <div className="font-medium text-sm truncate" style={{ color: isOnlineGroup ? '#e2e8f0' : roleColor }}>
                          {user.username}
                       </div>
                       {user.isBot && <span className="text-[10px] bg-indigo-600 text-white px-1 rounded inline-block mt-0.5">BOT</span>}
                    </div>
                 </div>
               ))}
             </div>
           </div>
         );
       })}
    </div>
  );
};