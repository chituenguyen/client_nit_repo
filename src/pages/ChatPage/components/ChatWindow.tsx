// src/pages/ChatPage/components/ChatWindow.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle, BiSend } from 'react-icons/bi';
import { useChatHistory, useMarkAllChatsAsRead } from '../../../hooks/useChatQuery';
import { useChatWebSocket, useTypingIndicator, useOnlineStatus } from '../../../hooks/useChatWebSocket';
import { useChatStore } from '../../../stores/chatStore';
import { useAuthStore } from '../../../stores/authStore';
import ChatHeader from './ChatHeader';
import MessageGroup from './MessageGroup';
import TypingIndicator from './TypingIndicator';
import { groupMessages } from '../utils/messageGrouping';

interface ChatWindowProps {
  userId: string;
  onClose: () => void;
  isMobile?: boolean;
  wsContext: ReturnType<typeof useChatWebSocket>;
}

export default function ChatWindow({ 
  userId, 
  onClose, 
  isMobile = false, 
  wsContext 
}: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const currentUser = useAuthStore(s => s.user);
  
  const rawChats = useChatStore(s => s.chats);
  
  const { isLoading, error, refetch } = useChatHistory({
    userId,
    page: 1,
    limit: 100,
  });

  const groupedChats = useMemo(() => {
    return groupMessages(rawChats, currentUser?.id);
  }, [rawChats, currentUser?.id]);

  const otherUser = useChatStore(s => s.otherUser);
  const markAllAsRead = useMarkAllChatsAsRead();
  
  const { sendMessage: wsSendMessage, sendTyping, markAsRead, isConnected } = wsContext;
  const isTyping = useTypingIndicator(userId);
  const isOnlineStatus = useOnlineStatus(userId);
  const isOnline = typeof isOnlineStatus === 'boolean' ? isOnlineStatus : false;

  // Tìm tin nhắn cuối cùng của mình đã được seen
  const lastSeenMessageId = useMemo(() => {
    if (!rawChats || rawChats.length === 0) return null;
    
    // Sắp xếp theo thời gian gửi (mới nhất trước)
    const sorted = [...rawChats].sort((a, b) => 
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
    
    // Tìm tin nhắn cuối cùng của MÌNH mà đã được seen (isRead = true)
    const myLastSeenMsg = sorted.find(m => 
      m.senderId === currentUser?.id && m.isRead
    );
    
    return myLastSeenMsg?.id || null;
  }, [rawChats, currentUser?.id]);

  useEffect(() => {
    if (groupedChats.length > 0) {
      messageContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupedChats]);

  useEffect(() => {
    if (userId) {
      markAllAsRead.mutate(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (isConnected) {
      sendTyping(userId, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(userId, false);
      }, 2000);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!isConnected) {
      console.error('❌ Cannot send: WebSocket not connected');
      alert('Cannot send message: Not connected to chat server');
      return;
    }

    wsSendMessage(userId, message.trim());
    
    if (isConnected) {
      sendTyping(userId, false);
    }
    
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    setMessage('');
    
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

      {!isConnected && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-center">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Not connected to chat server. Reconnecting...
          </p>
        </div>
      )}

      <div className="messageContainer flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
        {groupedChats.length === 0 ? (
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
            {groupedChats.map((group, groupIndex) => {
              if (group.type === 'date-separator') {
                return null;
              }

              return (
                <MessageGroup
                  key={`group-${groupIndex}`}
                  group={group}
                  onMarkAsRead={markAsRead}
                  lastSeenMessageId={lastSeenMessageId}
                  otherUserAvatar={otherUser?.avatarUrl}
                />
              );
            })}
            <div ref={messageContainerRef} />
          </>
        )}

        {isTyping && (
          <TypingIndicator 
            avatarUrl={otherUser?.avatarUrl}
            fullName={otherUser?.fullName}
          />
        )}
      </div>

      <div className="p-4 border-t border-color bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 px-4 py-2.5 bg-surface border border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-main placeholder:text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!message.trim() || !isConnected}
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