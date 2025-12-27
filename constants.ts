import { Server, User, Video } from './types';

export const STORAGE_KEYS = {
  SERVERS: 'furstream_servers_v1',
  USERS: 'furstream_users_v1',
  VIDEOS: 'furstream_videos_v1',
  DMS: 'furstream_dms_v1',
  CURRENT_USER_ID: 'furstream_active_uid_v1'
};

export const MAIN_USER_ID = 'u1';

export const DEFAULT_USER: User = {
  id: 'u1',
  username: 'NeonPaws',
  avatar: 'https://picsum.photos/id/1025/200/200',
  status: 'online',
  bio: 'Just a neon fox making my way through the digital forest. 🦊✨',
  bannerColor: '#4f46e5',
  friends: []
};

export const SECONDARY_USER: User = {
  id: 'u2',
  username: 'GlitchWolf',
  avatar: 'https://picsum.photos/id/1003/200/200',
  status: 'idle',
  bio: 'System breach detected... just kidding! I love retro tech.',
  bannerColor: '#0ea5e9',
  friends: []
};

export const INITIAL_USERS: Record<string, User> = {
  u1: DEFAULT_USER,
  u2: SECONDARY_USER,
  bot: { 
    id: 'bot', 
    username: 'FurBot AI', 
    avatar: 'https://picsum.photos/id/1080/200/200', 
    status: 'online', 
    isBot: true,
    bio: 'I am your helpful AI assistant! Ask me anything about the server.',
    bannerColor: '#6366f1',
    friends: []
  }
};

export const INITIAL_VIDEOS: Video[] = [];

export const INITIAL_SERVERS: Server[] = [];