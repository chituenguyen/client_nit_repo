// src/pages/ChatPage/components/ConversationsList.tsx
import { useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle, BiSearch } from 'react-icons/bi';
import { useConversations } from '../../../hooks/useChatQuery';
import { useChatStore } from '../../../stores/chatStore';
import { useOnlineStatus } from '../../../hooks/useChatWebSocket';
import ConversationItem from './ConversationItem';
import { formatTime } from '../utils/timeFormatters';

interface ConversationsListProps {
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  isWsConnected: boolean;
}

export default function ConversationsList({ 
  selectedUserId, 
  onSelectUser, 
  isWsConnected 
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: conversations, isLoading, error, refetch } = useConversations();
  const totalUnread = useChatStore(s => s.totalUnreadCount);
  const onlineUsers = useOnlineStatus();

  const filteredConversations = conversations?.filter(conv => 
    conv.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="h-full rounded-lg flex flex-col">
        <div className="p-4 border-b border-color">
          <h2 className="text-xl font-bold text-main">Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AiOutlineLoading3Quarters className="animate-spin inline-block text-3xl mb-2 text-main" />
            <p className="text-secondary text-sm">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full rounded-lg shadow-md flex flex-col">
        <div className="p-4 border-b border-color">
          <h2 className="text-xl font-bold text-main">Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <BiErrorCircle className="inline-block text-4xl mb-2" style={{ color: 'var(--color-danger)' }} />
            <p className="text-secondary mb-3 text-sm">Failed to load conversations</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg transition-colors text-sm text-white font-medium"
              style={{ backgroundColor: 'var(--color-danger)' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg flex flex-col overflow-hidden gap-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-main">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full text-white" style={{ backgroundColor: 'var(--color-danger)' }}>
                {totalUnread}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-secondary">
              {isWsConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="relative">
          <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-main text-sm placeholder:text-secondary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-5xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-main mb-2">
              {searchQuery ? 'No results found' : 'No conversations yet'}
            </h3>
            <p className="text-secondary text-sm">
              {searchQuery 
                ? `No conversations match "${searchQuery}"`
                : 'Start a conversation with your lecturers or students'
              }
            </p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conv) => {
              const isOnline = Array.isArray(onlineUsers) ? onlineUsers.includes(conv.user.id) : false;
              
              return (
                <ConversationItem
                  key={conv.user.id}
                  conversation={conv}
                  isOnline={isOnline}
                  isSelected={selectedUserId === conv.user.id}
                  onSelect={() => onSelectUser(conv.user.id)}
                  formatTime={formatTime}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}