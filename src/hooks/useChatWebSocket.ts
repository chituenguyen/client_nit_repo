// src/hooks/useChatWebSocket.ts - FIXED ALL ERRORS
import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getChatWebSocket, initChatWebSocket } from '../services/chatWebSocket';
import { useChatStore } from '../stores/chatStore';
import { chatKeys } from './useChatQuery';
import type { Chat } from '../types';

interface UseChatWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useChatWebSocket = (options: UseChatWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const queryClient = useQueryClient();
  const wsRef = useRef(getChatWebSocket());
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  // Track if listeners are attached
  const listenersAttachedRef = useRef(false);

  const token = localStorage.getItem('token');
  const { addChat, updateChat } = useChatStore();

  // ==================== CONNECTION ====================

  const connect = useCallback(async () => {
    if (!token) {
      console.warn('⚠️ No token available for WebSocket connection');
      return;
    }

    // Don't reconnect if already connected
    if (wsRef.current.isConnected()) {
      console.log('✅ WebSocket already connected');
      setIsConnected(true);
      return;
    }

    try {
      await initChatWebSocket(token);
      setIsConnected(true);
      onConnect?.();
      console.log('✅ WebSocket connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      setIsConnected(false);
      onError?.(error as Error);
    }
  }, [token, onConnect, onError]);

  const disconnect = useCallback(() => {
    wsRef.current.disconnect();
    setIsConnected(false);
    listenersAttachedRef.current = false;
    onDisconnect?.();
  }, [onDisconnect]);

  // ==================== SEND ACTIONS ====================

  const sendMessage = useCallback((receiverId: string, messageContent: string) => {
    if (!isConnected) {
      console.warn('⚠️ WebSocket not connected');
      return;
    }

    wsRef.current.sendMessage({ receiverId, messageContent });
  }, [isConnected]);

  const markAsRead = useCallback((messageId: string) => {
    if (!isConnected) {
      console.warn('⚠️ WebSocket not connected');
      return;
    }

    wsRef.current.markAsRead({ messageId });
  }, [isConnected]);

  const sendTyping = useCallback((receiverId: string, isTyping: boolean) => {
    if (!isConnected) return;

    wsRef.current.sendTyping({ receiverId, isTyping });
  }, [isConnected]);

  const getOnlineUsers = useCallback(() => {
    if (!isConnected) return;

    wsRef.current.getOnlineUsers((response) => {
      setOnlineUsers(response.onlineUsers);
    });
  }, [isConnected]);

  const checkUserOnline = useCallback((userId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!isConnected) {
        resolve(false);
        return;
      }

      wsRef.current.isUserOnline(userId, (response) => {
        resolve(response.isOnline);
      });
    });
  }, [isConnected]);

  // ==================== EVENT LISTENERS ====================

  useEffect(() => {
    if (!isConnected || listenersAttachedRef.current) return;

    console.log('📡 Attaching WebSocket listeners...');
    listenersAttachedRef.current = true;

    // Copy ref to local variable for cleanup
    const ws = wsRef.current;

    // Receive new message
    ws.onReceiveMessage((message: Chat) => {
      console.log('📩 New message received:', message);
      addChat(message);
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      queryClient.invalidateQueries({ 
        queryKey: chatKeys.history(message.senderId) 
      });
    });

    // Message sent confirmation
    ws.onMessageSent((data) => {
      console.log('✅ Message sent:', data);
      
      if (data.success && data.message) {
        addChat(data.message);
        queryClient.invalidateQueries({ 
          queryKey: chatKeys.conversations() 
        });
      }
    });

    // Message read
    ws.onMessageRead((data) => {
      console.log('👁️ Message read:', data);
      updateChat(data.messageId, {
        isRead: true,
        readAt: data.readAt,
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    });

    // User typing
    ws.onUserTyping((data) => {
      window.dispatchEvent(new CustomEvent('user-typing', { detail: data }));
    });

    // User online
    ws.onUserOnline((data) => {
      console.log('🟢 User online:', data.userId);
      setOnlineUsers((prev) => {
        if (prev.includes(data.userId)) return prev;
        return [...prev, data.userId];
      });
      window.dispatchEvent(new CustomEvent('user-online', { detail: data }));
    });

    // User offline
    ws.onUserOffline((data) => {
      console.log('⚫ User offline:', data.userId);
      setOnlineUsers((prev) => prev.filter(id => id !== data.userId));
      window.dispatchEvent(new CustomEvent('user-offline', { detail: data }));
    });

    // Cleanup function
    return () => {
      console.log('🧹 Removing WebSocket listeners...');
      ws.removeAllListeners();
      listenersAttachedRef.current = false;
    };
  }, [isConnected, addChat, updateChat, queryClient]);

  // ==================== AUTO CONNECT ====================

  useEffect(() => {
    let mounted = true;

    if (autoConnect && token && !isConnected) {
      connect();
    }

    // Only disconnect on unmount
    return () => {
      mounted = false;
      if (!mounted) {
        disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, token]);

  // ==================== RETURN ====================

  return {
    isConnected,
    onlineUsers,
    connect,
    disconnect,
    sendMessage,
    markAsRead,
    sendTyping,
    getOnlineUsers,
    checkUserOnline,
  };
};

// ==================== TYPING INDICATOR HOOK ====================

interface TypingState {
  [userId: string]: boolean;
}

export const useTypingIndicator = (userId?: string) => {
  const [typingUsers, setTypingUsers] = useState<TypingState>({});
  const timeoutRefs = useRef<{ [userId: string]: number }>({});

  useEffect(() => {
    const handleTyping = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId: typingUserId, isTyping } = customEvent.detail;

      setTypingUsers((prev) => ({
        ...prev,
        [typingUserId]: isTyping,
      }));

      // Clear existing timeout
      if (timeoutRefs.current[typingUserId]) {
        clearTimeout(timeoutRefs.current[typingUserId]);
      }

      // Auto-clear after 3s if typing
      if (isTyping) {
        timeoutRefs.current[typingUserId] = window.setTimeout(() => {
          setTypingUsers((prev) => ({
            ...prev,
            [typingUserId]: false,
          }));
        }, 3000);
      }
    };

    window.addEventListener('user-typing', handleTyping);

    // Copy ref to local variable for cleanup
    const timeouts = timeoutRefs.current;

    return () => {
      window.removeEventListener('user-typing', handleTyping);
      // Clear all timeouts
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  if (userId) {
    return typingUsers[userId] || false;
  }

  return typingUsers;
};

// ==================== ONLINE STATUS HOOK ====================

export const useOnlineStatus = (userId?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const handleOnline = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId } = customEvent.detail;
      setOnlineUsers((prev) => {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      });
    };

    const handleOffline = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId } = customEvent.detail;
      setOnlineUsers((prev) => prev.filter(id => id !== userId));
    };

    window.addEventListener('user-online', handleOnline);
    window.addEventListener('user-offline', handleOffline);

    return () => {
      window.removeEventListener('user-online', handleOnline);
      window.removeEventListener('user-offline', handleOffline);
    };
  }, []);

  if (userId) {
    return onlineUsers.includes(userId);
  }

  return onlineUsers;
};

export default useChatWebSocket;