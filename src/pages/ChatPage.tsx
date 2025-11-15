// src/pages/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle, BiSearch, BiSend } from 'react-icons/bi';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { 
  useConversations, 
  useChatHistory, 
  useSendChat,
  useMarkAllChatsAsRead 
} from '../hooks/useChatQuery';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import type { Chat } from '../types';

export default function ChatPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <section className="flex gap-4 h-[calc(100vh-180px)] p-4">
      {/* Left Sidebar - Conversations List */}
      <aside className="w-full lg:w-80 flex-shrink-0">
        <ConversationsList 
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
        />
      </aside>

      {/* Main Chat Area */}
      <main className="hidden lg:flex lg:flex-1 flex-col">
        {selectedUserId ? (
          <ChatWindow userId={selectedUserId} />
        ) : (
          <EmptyChatState />
        )}
      </main>
    </section>
  );
}

/* === Conversations List === */
interface ConversationsListProps {
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
}

function ConversationsList({ selectedUserId, onSelectUser }: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: conversations, isLoading, error, refetch } = useConversations();
  const totalUnread = useChatStore(s => s.totalUnreadCount);

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
      {/* Header */}
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
        </div>

        {/* Search */}
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

      {/* Conversations */}
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
            {filteredConversations.map((conv) => (
              <button
                key={conv.user.id}
                onClick={() => onSelectUser(conv.user.id)}
                className={`
                  w-full p-4 flex gap-3 bg-background items-center hover:bg-component transition-colors rounded-md shadow-md
                  ${selectedUserId === conv.user.id ? 'bg-component' : ''}
                `}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.user.fullName)}&background=random`}
                    alt={conv.user.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conv.unreadCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                      style={{ backgroundColor: 'var(--color-danger)' }}
                    >
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-start justify-between">
                    <h3 className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-main' : 'text-main'}`}>
                      {conv.user.fullName}
                    </h3>
                    <span className="text-xs text-secondary">
                      {formatTime(conv.lastMessage.sentAt)}
                    </span>
                  </div>
                  
                  <p className={`text-sm truncate ${conv.lastMessage.isRead || conv.lastMessage.isSentByMe ? 'text-secondary' : 'text-main font-medium'}`}>
                    {conv.lastMessage.isSentByMe && (
                      <span className="text-secondary">You: </span>
                    )}
                    {conv.lastMessage.messageContent}
                  </p>
                  
                  <span className="text-xs px-2 py-0.5 rounded-full inline-block mt-1" style={{
                    backgroundColor: conv.user.role === 'LECTURER' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: conv.user.role === 'LECTURER' ? 'rgb(168, 85, 247)' : 'rgb(59, 130, 246)'
                  }}>
                    {conv.user.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* === Chat Window === */
interface ChatWindowProps {
  userId: string;
}

function ChatWindow({ userId }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore(s => s.user);
  
  const { data: chats, isLoading, error, refetch } = useChatHistory({
    userId,
    page: 1,
    limit: 100,
  });

  const otherUser = useChatStore(s => s.otherUser);
  const sendChat = useSendChat();
  const markAllAsRead = useMarkAllChatsAsRead();

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  // Mark all as read when entering chat
  useEffect(() => {
    if (userId) {
      markAllAsRead.mutate(userId);
    }
  }, [userId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || sendChat.isPending) return;

    sendChat.mutate(
      {
        receiverId: userId,
        messageContent: message.trim(),
      },
      {
        onSuccess: () => {
          setMessage('');
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-full bg-background rounded-lg shadow-md flex items-center justify-center">
        <div className="text-center">
          <AiOutlineLoading3Quarters className="animate-spin inline-block text-3xl mb-2 text-main" />
          <p className="text-secondary">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-background rounded-lg shadow-md flex flex-col">
        <ChatHeader user={otherUser} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <BiErrorCircle className="inline-block text-4xl mb-2" style={{ color: 'var(--color-danger)' }} />
            <p className="text-secondary mb-3">Failed to load messages</p>
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
    <div className="h-full bg-background rounded-lg shadow-md flex flex-col overflow-hidden">
      {/* Chat Header */}
      <ChatHeader user={otherUser} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!chats || chats.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">👋</div>
            <h3 className="text-lg font-semibold text-main mb-2">
              Start the conversation
            </h3>
            <p className="text-secondary text-sm">
              Send a message to {otherUser?.fullName || 'this user'}
            </p>
          </div>
        ) : (
          <>
            {chats.map((chat) => (
              <MessageBubble
                key={chat.id}
                chat={chat}
                isOwn={chat.senderId === currentUser?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-color bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sendChat.isPending}
            className="flex-1 px-4 py-2.5 bg-surface border border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-main placeholder:text-secondary"
          />
          <button
            type="submit"
            disabled={!message.trim() || sendChat.isPending}
            className="px-6 py-2.5 bg-primary text-primary rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sendChat.isPending ? (
              <AiOutlineLoading3Quarters className="animate-spin" />
            ) : (
              <BiSend className="text-lg" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

/* === Chat Header === */
interface ChatHeaderProps {
  user: { fullName: string; avatarUrl: string | null; role: string } | null;
}

function ChatHeader({ user }: ChatHeaderProps) {
  if (!user) return null;

  return (
    <div className="p-4 border-b border-color flex items-center gap-3">
      <img
        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`}
        alt={user.fullName}
        className="w-10 h-10 rounded-full object-cover"
      />

      <div className="flex-1">
        <h3 className="font-semibold text-main">{user.fullName}</h3>
        <p className="text-xs px-2 py-0.5 rounded-full inline-block" style={{
          backgroundColor: user.role === 'LECTURER' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          color: user.role === 'LECTURER' ? 'rgb(168, 85, 247)' : 'rgb(59, 130, 246)'
        }}>
          {user.role}
        </p>
      </div>

      <button className="p-2 hover:bg-component rounded-lg transition-colors">
        <BsThreeDotsVertical className="text-main" />
      </button>
    </div>
  );
}

/* === Message Bubble === */
interface MessageBubbleProps {
  chat: Chat;
  isOwn: boolean;
}

function MessageBubble({ chat, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && (
          <img
            src={chat.sender.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.sender.fullName)}&background=random`}
            alt={chat.sender.fullName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        )}

        <div>
          <div
            className={`
              px-4 py-2.5 rounded-2xl
              ${isOwn 
                ? 'bg-primary text-primary rounded-br-none' 
                : 'bg-background text-main rounded-bl-none border border-color'
              }
            `}
          >
            <p className="text-sm break-words">{chat.messageContent}</p>
          </div>
          
          <div className={`flex items-center gap-1 mt-1 text-xs text-secondary ${isOwn ? 'justify-end' : ''}`}>
            <span>{formatTime(chat.sentAt)}</span>
            {isOwn && (
              <span>{chat.isRead ? '✓✓' : '✓'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* === Empty State === */
function EmptyChatState() {
  return (
    <div className="h-full bg-background rounded-lg shadow-md flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4">💬</div>
        <h2 className="text-2xl font-bold text-main mb-2">
          Your Messages
        </h2>
        <p className="text-secondary">
          Select a conversation from the sidebar to start chatting with your lecturers or students.
        </p>
      </div>
    </div>
  );
}

/* === Utility Functions === */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}