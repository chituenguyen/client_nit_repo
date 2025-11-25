// src/pages/ChatPage/components/ChatHeader.tsx

interface ChatHeaderProps {
  user: { fullName: string; avatarUrl: string | null; role: string } | null;
  isOnline: boolean;
  onClose?: () => void;
}

export default function ChatHeader({ user, isOnline, onClose }: ChatHeaderProps) {
  if (!user) return null;

  return (
    <div className="p-4 border-b border-color flex items-center gap-3">
      {onClose && (
        <button
          onClick={onClose}
          className="lg:hidden flex-shrink-0 p-2 hover:bg-component rounded-lg transition-colors"
          aria-label="Back to conversations"
        >
          <svg 
            className="w-6 h-6 text-main" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
      )}
      
      <div className="relative">
        <img
          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`}
          alt={user.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-main">{user.fullName}</h3>
        <div className="flex items-center gap-2">
          <p className="text-xs px-2 py-0.5 rounded-full inline-block" style={{
            backgroundColor: user.role === 'LECTURER' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: user.role === 'LECTURER' ? 'rgb(168, 85, 247)' : 'rgb(59, 130, 246)'
          }}>
            {user.role}
          </p>
          <span className="text-xs text-secondary">
            {isOnline ? 'Active now' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}