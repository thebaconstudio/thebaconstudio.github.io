import React from 'react';
import { Server, ViewMode } from '../types';
import { Play, Plus, Compass } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface ServerRailProps {
  servers: Server[];
  activeServerId: string | null;
  currentView: ViewMode;
  onServerSelect: (serverId: string | null) => void;
  onCreateServer: () => void;
  onDiscoverySelect: () => void;
}

export const ServerRail: React.FC<ServerRailProps> = ({ 
  servers, 
  activeServerId, 
  currentView,
  onServerSelect, 
  onCreateServer,
  onDiscoverySelect 
}) => {
  return (
    <div className="w-[72px] bg-slate-950 flex flex-col items-center py-3 space-y-2 overflow-y-auto no-scrollbar border-r border-slate-900 z-20 h-full shrink-0">
      {/* Home / Video Feed Button */}
      <div className="mb-2 shrink-0">
        <Tooltip text="Home / Videos">
            <button
            onClick={() => onServerSelect(null)}
            className={`w-12 h-12 rounded-[24px] transition-all duration-300 flex items-center justify-center group relative
                ${activeServerId === null && currentView === ViewMode.VIDEO_FEED
                    ? 'bg-indigo-600 rounded-[16px]' 
                    : 'bg-slate-800 hover:bg-indigo-600 hover:rounded-[16px]'}`}
            >
            <Play size={24} className="text-white fill-white" />
            {activeServerId === null && currentView === ViewMode.VIDEO_FEED && (
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-10 bg-white rounded-r-full" />
            )}
            </button>
        </Tooltip>
      </div>

      <div className="w-8 h-[2px] bg-slate-800 rounded-full mx-auto shrink-0" />

      {/* Server List */}
      <div className="flex-1 flex flex-col items-center space-y-2 w-full">
          {servers.map((server) => (
            <div key={server.id} className="relative shrink-0">
                {activeServerId === server.id && (
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-10 bg-white rounded-r-full" />
                )}
                <Tooltip text={server.name}>
                    <button
                        onClick={() => onServerSelect(server.id)}
                        className={`w-12 h-12 rounded-[24px] transition-all duration-300 overflow-hidden group relative
                        ${activeServerId === server.id 
                            ? 'rounded-[16px] ring-2 ring-indigo-500' 
                            : 'hover:rounded-[16px] hover:bg-indigo-600'}`}
                    >
                        <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                    </button>
                </Tooltip>
            </div>
          ))}
      </div>

      {/* Discovery Button */}
      <div className="mt-2 shrink-0">
         <Tooltip text="Discover Dens">
            <button 
              onClick={onDiscoverySelect}
              className={`w-12 h-12 rounded-[24px] transition-all duration-300 flex items-center justify-center group relative
                ${currentView === ViewMode.DISCOVERY 
                    ? 'bg-green-600 rounded-[16px] text-white' 
                    : 'bg-slate-800 hover:bg-green-600 hover:rounded-[16px] text-green-500 hover:text-white'}`}
            >
            <Compass size={24} />
            {currentView === ViewMode.DISCOVERY && (
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-10 bg-white rounded-r-full" />
            )}
            </button>
        </Tooltip>
      </div>

      {/* Add Server Placeholder */}
      <div className="mt-2 shrink-0 pb-2">
         <Tooltip text="Create Your Den">
            <button 
              onClick={onCreateServer}
              className="w-12 h-12 rounded-[24px] bg-slate-800 hover:bg-indigo-500 hover:rounded-[16px] text-indigo-400 hover:text-white transition-all duration-300 flex items-center justify-center group"
            >
            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
        </Tooltip>
      </div>
    </div>
  );
};