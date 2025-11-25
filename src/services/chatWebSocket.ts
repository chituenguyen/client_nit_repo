// src/services/chatWebSocket.ts - SIMPLIFIED CONNECTION
import { io, Socket } from 'socket.io-client';
import type { Chat } from '../types';

interface WebSocketConfig {
  url: string;
  token: string;
}

interface SendMessageData {
  receiverId: string;
  messageContent: string;
}

interface MarkAsReadData {
  messageId: string;
}

interface TypingData {
  receiverId: string;
  isTyping: boolean;
}

interface MessageReadEvent {
  messageId: string;
  readAt: string;
  readBy: string;
}

interface UserTypingEvent {
  userId: string;
  isTyping: boolean;
}

interface UserOnlineEvent {
  userId: string;
}

interface OnlineUsersResponse {
  onlineUsers: string[];
}

interface IsUserOnlineResponse {
  userId: string;
  isOnline: boolean;
}

export class ChatWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionPromise: Promise<void> | null = null;

  /**
   * Kết nối WebSocket - SIMPLIFIED VERSION
   */
  connect(config: WebSocketConfig): Promise<void> {
    // If already connecting, return existing promise
    if (this.connectionPromise) {
      console.log('⏳ Connection already in progress...');
      return this.connectionPromise;
    }

    // If already connected, resolve immediately
    if (this.socket?.connected) {
      console.log('✅ Already connected');
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Disconnect existing socket
        if (this.socket) {
          console.log('🔄 Disconnecting existing connection...');
          this.socket.disconnect();
          this.socket = null;
        }

        // Backend URL with /chat namespace
        const baseUrl = config.url;
        const namespace = '/chat';
        
        console.log('🔌 Connecting to:', baseUrl + namespace);
        console.log('🔑 Token:', config.token.substring(0, 20) + '...');

        // Create socket with namespace
        this.socket = io(`${baseUrl}${namespace}`, {
          query: { token: config.token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          forceNew: true,
          autoConnect: true,
          upgrade: true,
          rememberUpgrade: true,
        });

        // ✅ Success handler - resolve immediately on connect
        const handleConnect = () => {
          console.log('🎯 Socket.IO connect event fired');
          console.log('📊 Socket ID:', this.socket?.id);
          console.log('🔗 Transport:', this.socket?.io.engine?.transport?.name);
          
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          
          // Clean up listeners
          this.socket?.off('connect', handleConnect);
          this.socket?.off('connect_error', handleConnectError);
          
          console.log('✅ WebSocket connected successfully');
          resolve();
        };

        // ✅ Error handler
        const handleConnectError = (error: Error) => {
          console.error('❌ Connection error:', error.message);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Failed after ${this.maxReconnectAttempts} attempts`);
            
            // Clean up
            this.socket?.off('connect', handleConnect);
            this.socket?.off('connect_error', handleConnectError);
            this.socket?.disconnect();
            this.socket = null;
            this.connectionPromise = null;
            
            reject(new Error(`Failed to connect: ${error.message}`));
          }
        };

        // Attach listeners
        this.socket.on('connect', handleConnect);
        this.socket.on('connect_error', handleConnectError);

        // Optional: Listen to 'connected' event from backend
        this.socket.on('connected', (data) => {
          console.log('📩 Backend confirmed connection:', data);
        });

        // Standard event listeners
        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
        });

        this.socket.on('disconnect', (reason, details) => {
          console.warn('⚠️ Disconnected:', { reason, details });
          
          switch (reason) {
            case 'io server disconnect':
              console.error('🚫 Server disconnected. Check token validity.');
              break;
            case 'ping timeout':
              console.error('⏱️ Ping timeout - connection lost');
              break;
            case 'transport close':
              console.error('🔌 Transport closed');
              break;
          }
        });

        this.socket.on('reconnect_attempt', (attempt) => {
          console.log(`🔄 Reconnecting... (${attempt}/${this.maxReconnectAttempts})`);
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`✅ Reconnected after ${attemptNumber} attempts`);
          this.reconnectAttempts = 0;
        });

        this.socket.on('reconnect_failed', () => {
          console.error('❌ Reconnection failed');
        });

      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Ngắt kết nối
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
      console.log('✅ Disconnected');
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ==================== SEND EVENTS ====================

  sendMessage(data: SendMessageData): void {
    if (!this.socket?.connected) {
      console.error('❌ Cannot send message: not connected');
      throw new Error('WebSocket not connected');
    }
    console.log('📤 Sending message:', data);
    this.socket.emit('send_message', data);
  }

  markAsRead(data: MarkAsReadData): void {
    if (!this.socket?.connected) {
      console.error('❌ Cannot mark as read: not connected');
      throw new Error('WebSocket not connected');
    }
    console.log('👁️ Marking as read:', data);
    this.socket.emit('mark_as_read', data);
  }

  sendTyping(data: TypingData): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', data);
  }

  getOnlineUsers(callback: (response: OnlineUsersResponse) => void): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    this.socket.emit('get_online_users', {}, callback);
  }

  isUserOnline(userId: string, callback: (response: IsUserOnlineResponse) => void): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    this.socket.emit('is_user_online', { userId }, callback);
  }

  // ==================== LISTEN EVENTS ====================

  onReceiveMessage(callback: (message: Chat) => void): void {
    if (!this.socket) return;
    this.socket.on('receive_message', callback);
  }

  onMessageSent(callback: (data: { success: boolean; message: Chat }) => void): void {
    if (!this.socket) return;
    this.socket.on('message_sent', callback);
  }

  onMessageRead(callback: (data: MessageReadEvent) => void): void {
    if (!this.socket) return;
    this.socket.on('message_read', callback);
  }

  onUserTyping(callback: (data: UserTypingEvent) => void): void {
    if (!this.socket) return;
    this.socket.on('user_typing', callback);
  }

  onUserOnline(callback: (data: UserOnlineEvent) => void): void {
    if (!this.socket) return;
    this.socket.on('user_online', callback);
  }

  onUserOffline(callback: (data: UserOnlineEvent) => void): void {
    if (!this.socket) return;
    this.socket.on('user_offline', callback);
  }

  removeAllListeners(): void {
    if (!this.socket) return;
    console.log('🧹 Removing all listeners...');
    this.socket.off('receive_message');
    this.socket.off('message_sent');
    this.socket.off('message_read');
    this.socket.off('user_typing');
    this.socket.off('user_online');
    this.socket.off('user_offline');
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  // Debug helper
  getSocketInfo() {
    if (!this.socket) {
      return {
        exists: false,
        connected: false,
        id: null,
        transport: null,
      };
    }

    return {
      exists: true,
      connected: this.socket.connected,
      id: this.socket.id,
      transport: this.socket.io.engine?.transport?.name,
      reconnecting: this.socket.io.engine?.readyState === 'opening',
    };
  }
}

// Singleton instance
let chatWebSocketInstance: ChatWebSocketService | null = null;

export const getChatWebSocket = (): ChatWebSocketService => {
  if (!chatWebSocketInstance) {
    chatWebSocketInstance = new ChatWebSocketService();
  }
  return chatWebSocketInstance;
};

export const initChatWebSocket = async (token: string): Promise<ChatWebSocketService> => {
  const ws = getChatWebSocket();
  
  if (ws.isConnected()) {
    console.log('✅ Already connected');
    return ws;
  }

  // Use API base URL (same as REST API)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  // Extract base URL without /api/v1
  const wsUrl = apiBaseUrl.replace(/\/api\/v1$/, '') || 'http://localhost:3000';
  console.log('🔗 Initializing WebSocket:', wsUrl);

  try {
    await ws.connect({ url: wsUrl, token });
    console.log('✅ Initialization complete');
    console.log('📊 Socket info:', ws.getSocketInfo());
    return ws;
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    throw error;
  }
};

export default getChatWebSocket;