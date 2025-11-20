// src/pages/ChatPage.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle, BiSearch, BiSend } from 'react-icons/bi';
import { IoChatboxEllipsesSharp } from "react-icons/io5";
import { 
  useConversations, 
  useChatHistory, 
  useMarkAllChatsAsRead 
} from '../hooks/useChatQuery';
import { useChatWebSocket, useTypingIndicator, useOnlineStatus } from '../hooks/useChatWebSocket';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import type { Chat } from '../types';

export default function ChatPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Kết nối WebSocket khi vào trang
  const { isConnected } = useChatWebSocket({
    autoConnect: true,
    onConnect: () => console.log('✅ Chat WebSocket connected'),
    onDisconnect: () => console.log('🔌 Chat WebSocket disconnected'),
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleCloseChat = () => {
    setSelectedUserId(null);
  };

  return (
    <section className="flex gap-4 h-[calc(100vh-230px)] p-4">
      <aside className="w-full lg:w-80 flex-shrink-0">
        <ConversationsList 
          selectedUserId={selectedUserId}
          onSelectUser={handleSelectUser}
          isWsConnected={isConnected}
        />
      </aside>

      {/* Main Chat Area - Desktop */}
      <main className="hidden lg:flex lg:flex-1 flex-col">
        {selectedUserId ? (
          <ChatWindow userId={selectedUserId} onClose={handleCloseChat} />
        ) : (
          <EmptyChatState isConnected={isConnected} />
        )}
      </main>

      {/* Chat Window Overlay - Mobile */}
      {selectedUserId && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <ChatWindow userId={selectedUserId} onClose={handleCloseChat} isMobile />
        </div>
      )}
    </section>
  );
}

/* === Conversations List === */
interface ConversationsListProps {
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  isWsConnected: boolean;
}

function ConversationsList({ selectedUserId, onSelectUser, isWsConnected }: ConversationsListProps) {
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
          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-secondary">
              {isWsConnected ? 'Online' : 'Offline'}
            </span>
          </div>
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
            {filteredConversations.map((conv) => {
              const isOnline = Array.isArray(onlineUsers) ? onlineUsers.includes(conv.user.id) : false;
              
              return (
                <button
                  key={conv.user.id}
                  onClick={() => onSelectUser(conv.user.id)}
                  className={`
                    w-full p-4 flex gap-3 bg-background items-center hover:bg-component transition-colors rounded-md shadow-md
                    ${selectedUserId === conv.user.id ? 'bg-component' : ''}
                  `}
                >
                  {/* Avatar with Online Indicator */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={conv.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.user.fullName)}&background=random`}
                      alt={conv.user.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
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
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* === Chat Window === */
interface ChatWindowProps {
  userId: string;
  onClose: () => void;
  isMobile?: boolean;
}

function ChatWindow({ userId, onClose, isMobile = false }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null); 
  const currentUser = useAuthStore(s => s.user);
  
  // Lấy dữ liệu từ Store
  const rawChats = useChatStore(s => s.chats);
  
  // Fetch dữ liệu background
  const { isLoading, error, refetch } = useChatHistory({
    userId,
    page: 1,
    limit: 100,
  });

  // 👇👇👇 SỬA Ở ĐÂY: Sort theo thời gian (Cũ -> Mới) 👇👇👇
  const displayChats = useMemo(() => {
    if (!rawChats) return [];
    
    // Sort theo sentAt: Cũ nhất (timestamp nhỏ) -> Mới nhất (timestamp lớn)
    return [...rawChats].sort((a, b) => {
      const dateA = new Date(a.sentAt).getTime();
      const dateB = new Date(b.sentAt).getTime();
      return dateA - dateB;
    });
  }, [rawChats]);
  // 👆👆👆 KẾT THÚC SỬA 👆👆👆

  const otherUser = useChatStore(s => s.otherUser);
  const markAllAsRead = useMarkAllChatsAsRead();
  
  // WebSocket hooks
  const { sendMessage: wsSendMessage, sendTyping, markAsRead } = useChatWebSocket();
  const isTyping = useTypingIndicator(userId);
  const isOnlineStatus = useOnlineStatus(userId);
  const isOnline = typeof isOnlineStatus === 'boolean' ? isOnlineStatus : false;

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới hoặc mới load
  useEffect(() => {
    if (displayChats.length > 0) {
      messageContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayChats]); 

  // Mark all as read when entering chat
  useEffect(() => {
    if (userId) {
      markAllAsRead.mutate(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleTyping = (value: string) => {
    setMessage(value);
    sendTyping(userId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(userId, false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    wsSendMessage(userId, message.trim());
    
    sendTyping(userId, false);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    setMessage('');
    
    // Force scroll xuống sau khi gửi
    setTimeout(() => {
      messageContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (isLoading && rawChats.length === 0) {
    return (
      <div className={`h-full bg-background rounded-lg shadow-md flex items-center justify-center ${isMobile ? 'rounded-none' : ''}`}>
        <div className="text-center">
          <AiOutlineLoading3Quarters className="animate-spin inline-block text-3xl mb-2 text-main" />
          <p className="text-secondary">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error && rawChats.length === 0) {
    return (
      <div className={`h-full bg-background rounded-lg shadow-md flex flex-col ${isMobile ? 'rounded-none' : ''}`}>
        <ChatHeader user={otherUser} isOnline={isOnline} onClose={isMobile ? onClose : undefined} />
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
    <div className={`h-full bg-background rounded-lg shadow-md flex flex-col overflow-hidden ${isMobile ? 'rounded-none' : ''}`}>
      <ChatHeader user={otherUser} isOnline={isOnline} onClose={isMobile ? onClose : undefined} />

      <div className="messageContainer flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
        {displayChats.length === 0 ? (
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
            {displayChats.map((chat) => (
              <MessageBubble
                key={chat.id}
                chat={chat}
                isOwn={chat.senderId === currentUser?.id}
                onMarkAsRead={markAsRead}
              />
            ))}
            {/* Thẻ div rỗng này dùng để scroll xuống đáy */}
            <div ref={messageContainerRef} />
          </>
        )}

        {isTyping && (
          <div className="flex gap-2 items-end">
            <img
              src={otherUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.fullName || '')}&background=random`}
              alt="typing"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-none bg-background border border-color">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-color bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-surface border border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-main placeholder:text-secondary"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-6 py-2.5 bg-primary text-primary rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <BiSend className="text-lg" />
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
  isOnline: boolean;
  onClose?: () => void;
}

function ChatHeader({ user, isOnline, onClose }: ChatHeaderProps) {
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
            {isOnline ? '🟢 Active now' : '⚫ Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* === Message Bubble === */
interface MessageBubbleProps {
  chat: Chat;
  isOwn: boolean;
  onMarkAsRead: (messageId: string) => void;
}

function MessageBubble({ chat, isOwn, onMarkAsRead }: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Mark as read khi message vào viewport
  useEffect(() => {
    if (!isOwn && !chat.isRead && bubbleRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onMarkAsRead(chat.id);
          }
        },
        { threshold: 0.5 }
      );

      observer.observe(bubbleRef.current);

      return () => observer.disconnect();
    }
  }, [chat.id, chat.isRead, isOwn, onMarkAsRead]);

  return (
    <div ref={bubbleRef} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[70%] items-end ${isOwn ? 'flex-row-reverse' : ''}`}>
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
function EmptyChatState({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="h-full bg-background rounded-lg shadow-md flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <IoChatboxEllipsesSharp className='w-1/2 h-1/2 mb-4 mx-auto text-secondary'/>
        <h2 className="text-2xl font-bold text-main mb-2">
          Your Messages
        </h2>
        <p className="text-secondary mb-4">
          Select a conversation from the sidebar to start chatting with your lecturers or students.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-secondary">
            {isConnected ? 'Real-time chat enabled' : 'Connecting...'}
          </span>
        </div>
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