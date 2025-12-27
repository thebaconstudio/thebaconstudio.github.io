import React, { useState } from 'react';
import { Video, User } from '../types';
import { ThumbsUp, ThumbsDown, Share2, MessageCircle, Heart, Send } from 'lucide-react';

interface VideoPlayerProps {
  video: Video;
  onBack: () => void;
  currentUser: User;
  onViewProfile: (user: User) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onBack, currentUser, onViewProfile }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{user: User, text: string}[]>([
    { user: video.uploader, text: 'Thanks for watching everyone! Let me know what you think.' }
  ]);

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    setComments([{ user: currentUser, text: commentText }, ...comments]);
    setCommentText('');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-900">
      <div className="w-full max-w-6xl mx-auto p-6">
        {/* Player */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-4 group">
          {video.url ? (
            <video 
              src={video.url} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
              poster={video.thumbnail}
            />
          ) : (
            <>
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 transition-transform hover:scale-110">
                   <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-red-500"></div>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="mb-6">
          <button onClick={onBack} className="text-slate-400 hover:text-white mb-2 text-sm flex items-center gap-1">
             ← Back to Feed
          </button>
          <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src={video.uploader.avatar} 
                alt={video.uploader.username} 
                onClick={() => onViewProfile(video.uploader)}
                className="w-12 h-12 rounded-full border border-slate-700 cursor-pointer hover:opacity-80 transition" 
              />
              <div>
                <p 
                    className="font-semibold text-white cursor-pointer hover:underline"
                    onClick={() => onViewProfile(video.uploader)}
                >
                    {video.uploader.username}
                </p>
                <p className="text-sm text-slate-400">{video.views} views • {video.timestamp}</p>
              </div>
              <button className="ml-4 px-4 py-2 bg-slate-100 text-slate-900 rounded-full font-medium hover:bg-white transition-colors">
                Subscribe
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800 rounded-full overflow-hidden">
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-slate-200 border-r border-slate-700">
                  <ThumbsUp size={18} /> Like
                </button>
                <button className="px-4 py-2 hover:bg-slate-700 text-slate-200">
                  <ThumbsDown size={18} />
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-200">
                <Share2 size={18} /> Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-200">
                <Heart size={18} /> Save
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-slate-800/50 p-4 rounded-xl text-slate-300 text-sm mb-8 whitespace-pre-wrap">
          {video.description}
        </div>

        {/* Comments Section */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageCircle size={20} /> {comments.length} Comments
          </h3>
          
          <div className="flex gap-4 mb-8">
            <img src={currentUser.avatar} alt="You" className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-transparent border-b border-slate-700 focus:border-indigo-500 outline-none pb-2 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={handlePostComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {comments.map((comment, idx) => (
              <div key={idx} className="flex gap-4">
                <img 
                    src={comment.user.avatar} 
                    alt={comment.user.username} 
                    onClick={() => onViewProfile(comment.user)}
                    className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80" 
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                        className="font-semibold text-sm text-white cursor-pointer hover:underline"
                        onClick={() => onViewProfile(comment.user)}
                    >
                        {comment.user.username}
                    </span>
                    <span className="text-xs text-slate-500">Just now</span>
                  </div>
                  <p className="text-slate-300 text-sm">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};