export enum ViewMode {
  VIDEO_FEED = 'VIDEO_FEED',
  SERVER_CHAT = 'SERVER_CHAT',
  VIDEO_PLAYER = 'VIDEO_PLAYER',
  DISCOVERY = 'DISCOVERY',
  DM_CHAT = 'DM_CHAT',
  FRIENDS = 'FRIENDS'
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  isBot?: boolean;
  bio?: string;
  bannerColor?: string;
  friends?: string[]; // List of user IDs
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  messages: Message[];
}

export interface DMChannel {
  id: string; // usually "dm_uid1_uid2" or "group_timestamp"
  participants: string[]; // [uid1, uid2, ...]
  messages: Message[];
  lastMessageAt: number; // For sorting
  name?: string; // Optional name for Group Chats
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[]; 
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  description?: string;
  memberCount?: number;
  banner?: string;
  channels: Channel[];
  ownerId: string;
  roles: Role[];
  members: Record<string, string[]>; // userId -> array of roleIds
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  uploader: User;
  views: string;
  timestamp: string;
  length: string;
  description: string;
  url?: string;
}

export interface AppState {
  currentView: ViewMode;
  activeServerId: string | null;
  activeChannelId: string | null;
  activeVideoId: string | null;
  activeDMChannelId: string | null;
  currentUser: User;
}