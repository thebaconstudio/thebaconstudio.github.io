import React, { useState } from 'react';
import { User } from '../types';
import { X, Check, Users } from 'lucide-react';

interface CreateDMModalProps {
  friends: string[]; // List of friend IDs
  allUsers: Record<string, User>;
  onClose: () => void;
  onCreate: (selectedIds: string[]) => void;
}

export const CreateDMModal: React.FC<CreateDMModalProps> = ({ 
    friends, 
    allUsers, 
    onClose, 
    onCreate 
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(uid => uid !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) return;
    onCreate(selectedIds);
  };

  return (
    <div className="absolute inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <h2 className="font-bold text-white text-lg">New Message</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            {friends.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <Users size={48} className="mx-auto mb-3 opacity-20" />
                    <p>You don't have any friends to message yet.</p>
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2">Select Friends</div>
                    {friends.map(friendId => {
                        const user = allUsers[friendId];
                        if (!user) return null;
                        const isSelected = selectedIds.includes(friendId);
                        
                        return (
                            <div 
                                key={friendId}
                                onClick={() => toggleSelection(friendId)}
                                className={`flex items-center p-2 rounded-lg cursor-pointer border transition-all ${
                                    isSelected 
                                    ? 'bg-indigo-600/20 border-indigo-500/50' 
                                    : 'hover:bg-slate-800 border-transparent'
                                }`}
                            >
                                <div className="relative mr-3">
                                    <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" />
                                    {isSelected && (
                                        <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-0.5 border-2 border-slate-900">
                                            <Check size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={`font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-200'}`}>{user.username}</div>
                                    <div className="text-xs text-slate-500">{user.status}</div>
                                </div>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                    isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
                                }`}>
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
            <button 
                onClick={handleSubmit}
                disabled={selectedIds.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition"
            >
                {selectedIds.length > 1 ? 'Create Group Chat' : 'Start Conversation'}
            </button>
        </div>
      </div>
    </div>
  );
};