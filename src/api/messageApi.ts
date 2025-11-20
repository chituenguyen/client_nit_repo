// src/api/messageApi.ts
import api from './api';
import { type AxiosResponse } from 'axios';

// ==================== TYPES ====================

export interface Conversation {
  id: string;
  messageId?: string; // ID của tin nhắn cuối cùng
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageContent?: string; // API có thể dùng messageContent
  createdAt?: string;
  sentAt?: string; // API có thể dùng sentAt thay vì createdAt
  timestamp?: string; // Fallback field
  isRead?: boolean; // Trạng thái đã đọc
  status?: 'sent' | 'delivered' | 'seen';
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar: string;
  role: 'student' | 'lecturer';
}

export interface ConversationsResponse {
  data: Conversation[];
  total?: number;
}

export interface MessagesResponse {
  data: Message[];
  total?: number;
}

export interface UsersResponse {
  data: User[];
  total?: number;
}

export interface SendMessageData {
  receiverId: string;
  messageContent: string; // API expects 'messageContent' not 'content'
}

// ==================== API METHODS ====================

export const messageApi = {
  /**
   * Lấy danh sách users (students hoặc lecturers)
   * @param role - 'student' hoặc 'lecturer' (optional)
   */
  getUsers: async (role?: 'student' | 'lecturer'): Promise<AxiosResponse<UsersResponse>> => {
    const params = role ? { role } : {};
    return api.get('/users', { params });
  },

  /**
   * Lấy danh sách các cuộc hội thoại
   */
  getConversations: async (): Promise<AxiosResponse<ConversationsResponse>> => {
    return api.get('/chat/conversations');
  },

  /**
   * Lấy tin nhắn với một user cụ thể
   * @param userId - ID của user muốn xem tin nhắn
   */
  getMessages: async (userId: string): Promise<AxiosResponse<MessagesResponse>> => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return api.get(`/chat/messages/${userId}`);
  },

  /**
   * Gửi tin nhắn mới (REST endpoint - websocket)
   * @param data - Dữ liệu tin nhắn (receiverId, content)
   */
  sendMessage: async (data: SendMessageData): Promise<AxiosResponse<Message>> => {
    return api.post('/chat/messages', data);
  },

  /**
   * Đánh dấu một tin nhắn cụ thể đã đọc
   * @param messageId - ID của tin nhắn cần đánh dấu đã đọc
   */
  markMessageAsRead: async (messageId: string): Promise<AxiosResponse<void>> => {
    return api.post(`/chat/messages/${messageId}/read`);
  },

  /**
   * Đánh dấu tất cả tin nhắn từ một user đã đọc
   * @param senderId - ID của người gửi để đánh dấu tất cả tin nhắn của họ đã đọc
   */
  markAllMessagesAsRead: async (senderId: string): Promise<AxiosResponse<void>> => {
    return api.post(`/chat/messages/read-all/${senderId}`);
  },
};

export default messageApi;

