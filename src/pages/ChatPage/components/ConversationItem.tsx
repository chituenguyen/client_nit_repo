// src/pages/ChatPage/components/ConversationItem.tsx

interface Conversation {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    messageContent: string;
    sentAt: string;
    isRead: boolean;
    isSentByMe: boolean;
  };
  unreadCount: number;
}

interface ConversationItemProps {
  conversation: Conversation;
  isOnline: boolean;
  isSelected: boolean;
  onSelect: () => void;
  formatTime: (dateString: string) => string;
}

export default function ConversationItem({
  conversation,
  isOnline,
  isSelected,
  onSelect,
  formatTime
}: ConversationItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-4 flex gap-3 bg-background items-center hover:bg-component transition-colors rounded-md shadow-md
        ${isSelected ? 'bg-component' : ''}
      `}
    >
      <div className="relative flex-shrink-0">
        <img
          src={conversation.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.user.fullName)}&background=random`}
          alt={conversation.user.fullName}
          className="w-12 h-12 rounded-full object-cover"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
        {conversation.unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
            style={{ backgroundColor: 'var(--color-danger)' }}
          >
            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-start justify-between">
          <h3 className={`font-semibold truncate ${conversation.unreadCount > 0 ? 'text-main' : 'text-main'}`}>
            {conversation.user.fullName}
          </h3>
          <span className="text-xs text-secondary">
            {formatTime(conversation.lastMessage.sentAt)}
          </span>
        </div>
        
        <p className={`text-sm truncate ${conversation.lastMessage.isRead || conversation.lastMessage.isSentByMe ? 'text-secondary' : 'text-main font-medium'}`}>
          {conversation.lastMessage.isSentByMe && (
            <span className="text-secondary">You: </span>
          )}
          {conversation.lastMessage.messageContent}
        </p>
      </div>
    </button>
  );
}