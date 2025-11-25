// src/hooks/useMessageQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import messageApi, { type SendMessageData } from '../api/messageApi';
import { useMessageStore } from '../stores/messageStore';
import { AxiosError } from 'axios';

// ==================== ERROR TYPES ====================
interface ApiErrorResponse {
  message?: string;
  statusCode?: number;
  error?: string;
}

// ==================== QUERY KEYS ====================
export const messageKeys = {
  all: ['messages'] as const,
  users: (role?: string) => [...messageKeys.all, 'users', role] as const,
  conversations: () => [...messageKeys.all, 'conversations'] as const,
  messages: (userId: string) => [...messageKeys.all, 'list', userId] as const,
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format thời gian cho hiển thị (10:30, Hôm qua, 2 ngày trước...)
 */
const formatMessageTime = (isoString: string): string => {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Hôm nay - hiển thị giờ
  if (diffInDays === 0) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // Hôm qua
  if (diffInDays === 1) {
    return 'Hôm qua';
  }
  
  // 2-7 ngày trước
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }
  
  // Lâu hơn - hiển thị ngày/tháng
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

// ==================== HOOKS ====================

/**
 * Hook để lấy danh sách users
 */
export const useUsers = (role?: 'student' | 'lecturer') => {
  const setLoading = useMessageStore((s) => s.setLoading);
  const setError = useMessageStore((s) => s.setError);

  return useQuery({
    queryKey: messageKeys.users(role),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await messageApi.getUsers(role);
        
        // Parse response
        const users = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        setError(null);
        
        return users;
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || 'Không thể tải danh sách người dùng';
        
        console.error('❌ Lỗi khi tải users:', {
          status: error.response?.status,
          message: errorMessage,
        });
        
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 60 * 1000, // 1 phút
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Hook để lấy danh sách cuộc hội thoại
 */
export const useConversations = () => {
  const setConversations = useMessageStore((s) => s.setConversations);
  const setLoading = useMessageStore((s) => s.setLoading);
  const setError = useMessageStore((s) => s.setError);

  return useQuery({
    queryKey: messageKeys.conversations(),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await messageApi.getConversations();
        
        // Parse response - có thể là data.data hoặc data
        const rawConversations = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        console.log('✅ Raw conversations from API:', rawConversations);
        
        // Default avatar (SVG data URI)
        const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
        
        // Transform API response sang format Conversation interface
        const conversations = rawConversations.map((conv: any) => ({
          id: conv.user?.id || conv.id || '',
          messageId: conv.lastMessage?.id || '',
          participantId: conv.user?.id || '',
          participantName: conv.user?.fullName || conv.user?.full_name || '',
          participantAvatar: conv.user?.avatarUrl || conv.user?.avatar || defaultAvatar,
          lastMessage: conv.lastMessage?.messageContent || conv.lastMessage?.content || '',
          lastMessageTime: formatMessageTime(conv.lastMessage?.sentAt || conv.lastMessage?.createdAt || ''),
          unreadCount: conv.unreadCount || 0,
          isOnline: false,
        }));

        console.log('✅ Transformed conversations:', conversations);
        
        setConversations(conversations);
        setError(null);
        
        return conversations;
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || 'Không thể tải danh sách cuộc hội thoại';
        
        console.error('❌ Lỗi khi tải conversations:', {
          status: error.response?.status,
          message: errorMessage,
        });
        
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 30 * 1000, // 30 giây
    gcTime: 5 * 60 * 1000, // 5 phút
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook để lấy tin nhắn với một user cụ thể
 */
export const useMessages = (userId: string | undefined) => {
  const setMessages = useMessageStore((s) => s.setMessages);
  const setLoading = useMessageStore((s) => s.setLoading);
  const setError = useMessageStore((s) => s.setError);

  return useQuery({
    queryKey: messageKeys.messages(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      try {
        setLoading(true);
        const response = await messageApi.getMessages(userId);
        
        console.log('✅ Raw messages response:', response.data);
        
        // Parse response - API trả về nested structure: { success, data: { data: [], otherUser, meta } }
        const responseData: any = response.data;
        let rawMessages: any[] = [];
        
        if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
          // Case 1: { data: { data: Array } }
          rawMessages = responseData.data.data;
        } else if (Array.isArray(responseData?.data)) {
          // Case 2: { data: Array }
          rawMessages = responseData.data;
        } else if (Array.isArray(responseData)) {
          // Case 3: Array directly
          rawMessages = responseData;
        }
        
        console.log('🔍 Raw messages array:', rawMessages);
        
        // Transform messages - API có thể dùng messageContent thay vì content
        const messages = rawMessages.map((msg: any) => ({
          ...msg,
          content: msg.messageContent || msg.content || '',
          // Giữ lại tất cả timestamp fields
          sentAt: msg.sentAt,
          createdAt: msg.createdAt,
          timestamp: msg.timestamp,
        }));
        
        console.log('✅ Parsed messages:', messages);
        
        setMessages(messages);
        setError(null);
        
        return messages;
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || 'Không thể tải tin nhắn';
        
        console.error('❌ Lỗi khi tải messages:', {
          userId,
          status: error.response?.status,
          message: errorMessage,
        });
        
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 giây
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Hook để gửi tin nhắn
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const addMessage = useMessageStore((s) => s.addMessage);
  const setError = useMessageStore((s) => s.setError);

  return useMutation({
    mutationFn: (data: SendMessageData) => {
      console.log('📤 Sending message with data:', data);
      return messageApi.sendMessage(data);
    },
    onSuccess: (response, variables) => {
      // Parse response - có thể là response.data.data hoặc response.data
      const responseData: any = response.data;
      const rawMessage = responseData?.data || responseData;
      
      console.log('✅ Gửi tin nhắn thành công:', rawMessage);
      
      // Transform message - map messageContent -> content và giữ timestamp
      const newMessage = {
        ...rawMessage,
        content: rawMessage.messageContent || rawMessage.content || '',
        sentAt: rawMessage.sentAt,
        createdAt: rawMessage.createdAt,
        timestamp: rawMessage.timestamp || new Date().toISOString(), // Fallback to now
      };
      
      // Thêm tin nhắn vào store
      if (newMessage) {
        addMessage(newMessage);
      }
      
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: messageKeys.messages(variables.receiverId) });
    },
    onError: (err) => {
      const error = err as AxiosError<any>;
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || 'Không thể gửi tin nhắn';
      
      console.error('❌ Lỗi khi gửi tin nhắn:');
      console.error('Status:', error.response?.status);
      console.error('Error Data:', JSON.stringify(errorData, null, 2));
      console.error('Message:', errorMessage);
      
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
};

/**
 * Hook để đánh dấu một tin nhắn cụ thể đã đọc
 */
export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();
  const updateMessageStatus = useMessageStore((s) => s.updateMessageStatus);
  const setError = useMessageStore((s) => s.setError);

  return useMutation({
    mutationFn: (messageId: string) => messageApi.markMessageAsRead(messageId),
    onSuccess: (_, messageId) => {
      // Cập nhật status trong store
      updateMessageStatus(messageId, 'seen');
      
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      
      console.log('✅ Đánh dấu tin nhắn đã đọc thành công:', messageId);
    },
    onError: (err) => {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Không thể đánh dấu tin nhắn đã đọc';
      
      console.error('❌ Lỗi khi đánh dấu tin nhắn đã đọc:', error);
      setError(errorMessage);
    },
  });
};

/**
 * Hook để đánh dấu tất cả tin nhắn từ một user đã đọc
 */
export const useMarkAllMessagesAsRead = () => {
  const queryClient = useQueryClient();
  const setError = useMessageStore((s) => s.setError);

  return useMutation({
    mutationFn: (senderId: string) => messageApi.markAllMessagesAsRead(senderId),
    onSuccess: (_, senderId) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: messageKeys.messages(senderId) });
      
      console.log('✅ Đánh dấu tất cả tin nhắn đã đọc thành công:', senderId);
    },
    onError: (err) => {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Không thể đánh dấu tất cả tin nhắn đã đọc';
      
      console.error('❌ Lỗi khi đánh dấu tất cả tin nhắn đã đọc:', error);
      setError(errorMessage);
    },
  });
};

