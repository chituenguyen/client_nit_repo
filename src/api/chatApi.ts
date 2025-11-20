// src/api/chatApi.ts
import api from './api';
import { type AxiosResponse } from 'axios';
import type {
  ChatHistoryParams,
  ChatHistoryResponse,
  SendChatPayload,
  SendChatResponse,
  ChatConversationsResponse,
} from '../types';

// ==================== CHAT API METHODS ====================

export const chatApi = {
  /**
   * Lấy lịch sử tin nhắn với một user cụ thể
   * @param userId - ID của user muốn xem lịch sử
   * @param page - Số trang (mặc định 1)
   * @param limit - Số tin nhắn mỗi trang (max 100)
   */
  getChatHistory: async (
    params: ChatHistoryParams
  ): Promise<AxiosResponse<ChatHistoryResponse>> => {
    const { userId, page = 1, limit = 50 } = params;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    return api.get(`/chat/messages/${userId}`, {
      params: {
        page,
        limit,
      },
    });
  },

  /**
   * Gửi tin nhắn mới
   * @param payload - Nội dung tin nhắn và receiverId
   */
  sendChat: async (
    payload: SendChatPayload
  ): Promise<AxiosResponse<SendChatResponse>> => {
    if (!payload.receiverId) {
      throw new Error('Receiver ID is required');
    }
    
    if (!payload.messageContent || payload.messageContent.trim() === '') {
      throw new Error('Message content cannot be empty');
    }

    return api.post('/chat/messages', payload);
  },

  /**
   * Lấy danh sách users đã chat
   */
  getConversations: async (): Promise<AxiosResponse<ChatConversationsResponse>> => {
    return api.get('/chat/conversations');
  },

  /**
   * Đánh dấu tin nhắn đã đọc
   * @param chatId - ID của tin nhắn
   */
  markAsRead: async (chatId: string): Promise<AxiosResponse<{ success: boolean }>> => {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    return api.post(`/chat/messages/${chatId}/read`);
  },

  /**
   * Đánh dấu tất cả tin nhắn từ một user đã đọc
   * @param userId - ID của user
   */
  markAllAsRead: async (userId: string): Promise<AxiosResponse<{ success: boolean }>> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return api.post(`/chat/messages/read-all/${userId}`);
  },
};

export default chatApi;