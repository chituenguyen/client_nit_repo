// src/hooks/useChatQuery.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import chatApi from '../api/chatApi';
import { useChatStore } from '../stores/chatStore';
import { AxiosError } from 'axios';
import type { 
  ChatHistoryParams, 
  SendChatPayload,
} from '../types';

// ==================== ERROR TYPES ====================
interface ApiErrorResponse {
  message?: string;
  statusCode?: number;
  error?: string;
}

// ==================== QUERY KEYS ====================
export const chatKeys = {
  all: ['chats'] as const,
  histories: () => [...chatKeys.all, 'history'] as const,
  history: (userId: string, params?: Omit<ChatHistoryParams, 'userId'>) => 
    [...chatKeys.histories(), userId, params] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
};

// ==================== HOOKS ====================

/**
 * Hook để lấy lịch sử tin nhắn với một user
 * Hỗ trợ pagination thông thường
 */
export const useChatHistory = (params: ChatHistoryParams) => {
  const setChats = useChatStore((s) => s.setChats);
  const setOtherUser = useChatStore((s) => s.setOtherUser);
  const setLoading = useChatStore((s) => s.setLoading);
  const setError = useChatStore((s) => s.setError);
  const setMeta = useChatStore((s) => s.setMeta);

  return useQuery({
    queryKey: chatKeys.history(params.userId, { page: params.page, limit: params.limit }),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await chatApi.getChatHistory(params);
        
        // Parse response theo đúng schema: data.data.data[]
        const chats = response.data?.data?.data || [];
        const otherUser = response.data?.data?.otherUser;
        const meta = response.data?.data?.meta;
        
        setChats(chats);
        
        if (otherUser) {
          setOtherUser(otherUser);
        }
        
        if (meta) {
          setMeta(meta);
        }
        
        setError(null);
        return chats;
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || 'Không thể tải lịch sử tin nhắn';
        
        console.error('❌ Lỗi khi tải lịch sử tin nhắn:', {
          userId: params.userId,
          status: error.response?.status,
          message: errorMessage,
        });
        
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!params.userId,
    staleTime: 0, // 0 để luôn refetch khi invalidate
    gcTime: 5 * 60 * 1000, // 5 phút
    retry: 1, // Giảm retry để nhanh hơn
    refetchOnMount: 'always', // Luôn refetch khi mount
    refetchOnWindowFocus: true, // Refetch khi focus window
    refetchInterval: false, // Không auto refetch (dùng WebSocket)
  });
};

/**
 * Hook để lấy lịch sử tin nhắn với infinite scroll
 */
export const useInfiniteChatHistory = (userId: string, limit: number = 50) => {
  const setLoading = useChatStore((s) => s.setLoading);
  const setError = useChatStore((s) => s.setError);
  const setOtherUser = useChatStore((s) => s.setOtherUser);

  return useInfiniteQuery({
    queryKey: chatKeys.history(userId, { limit }),
    queryFn: async ({ pageParam = 1 }) => {
      try {
        setLoading(true);
        const response = await chatApi.getChatHistory({
          userId,
          page: pageParam,
          limit,
        });
        
        // Set otherUser từ response (chỉ cần set 1 lần)
        if (pageParam === 1 && response.data?.data?.otherUser) {
          setOtherUser(response.data.data.otherUser);
        }
        
        setError(null);
        return {
          chats: response.data?.data?.data || [],
          meta: response.data?.data?.meta || {
            total: 0,
            page: pageParam,
            limit,
            totalPages: 0,
          },
        };
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || 'Không thể tải tin nhắn';
        
        console.error('❌ Lỗi khi tải tin nhắn (infinite):', errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook để gửi tin nhắn
 */
export const useSendChat = () => {
  const queryClient = useQueryClient();
  const { setError, addChat } = useChatStore();

  return useMutation({
    mutationFn: (payload: SendChatPayload) => chatApi.sendChat(payload),
    onMutate: async (variables) => {
      // Optimistic update: Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: chatKeys.history(variables.receiverId) 
      });

      // Snapshot previous value
      const previousChats = queryClient.getQueryData(
        chatKeys.history(variables.receiverId, { page: 1, limit: 50 })
      );

      // Return context for rollback
      return { previousChats };
    },
    onSuccess: (response, variables) => {
      const newChat = response.data?.data;
      
      if (newChat) {
        // Update cache directly (faster than invalidate)
        queryClient.setQueryData<any[]>(
          chatKeys.history(variables.receiverId, { page: 1, limit: 50 }),
          (oldData) => {
            if (!oldData) return [newChat];
            // Replace temporary message with real one
            return oldData.map(chat => 
              chat.id.toString().startsWith('temp-') ? newChat : chat
            );
          }
        );
        
        addChat(newChat);
      }

      // Only invalidate conversations (for last message update)
      queryClient.invalidateQueries({ 
        queryKey: chatKeys.conversations(),
        refetchType: 'active'
      });
      
      console.log('✅ Gửi tin nhắn thành công:', response.data);
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousChats) {
        queryClient.setQueryData(
          chatKeys.history(variables.receiverId, { page: 1, limit: 50 }),
          context.previousChats
        );
      }
      
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Không thể gửi tin nhắn';
      
      console.error('❌ Lỗi khi gửi tin nhắn:', error);
      setError(errorMessage);
    },
  });
};

/**
 * Hook để lấy danh sách conversations
 */
export const useConversations = () => {
  const setChatUsers = useChatStore((s) => s.setChatUsers);
  const setLoading = useChatStore((s) => s.setLoading);
  const setError = useChatStore((s) => s.setError);
  const setTotalUnreadCount = useChatStore((s) => s.setTotalUnreadCount);

  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await chatApi.getConversations();
        
        const conversations = response.data?.data || [];
        setChatUsers(conversations);
        
        // Tính tổng số tin nhắn chưa đọc
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setTotalUnreadCount(totalUnread);
        
        console.log('📊 Conversations loaded:', {
          count: conversations.length,
          totalUnread,
          details: conversations.map(c => ({ 
            user: c.user.fullName, 
            unreadCount: c.unreadCount 
          }))
        });
        
        setError(null);
        return conversations;
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || 'Không thể tải danh sách conversations';
        
        console.error('❌ Lỗi khi tải conversations:', errorMessage);
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
 * Hook để đánh dấu tin nhắn đã đọc
 */
export const useMarkChatAsRead = () => {
  const queryClient = useQueryClient();
  const { setError, updateChat } = useChatStore();

  return useMutation({
    mutationFn: (chatId: string) => chatApi.markAsRead(chatId),
    onSuccess: (_, chatId) => {
      // Cập nhật chat trong store
      updateChat(chatId, { isRead: true });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      
      console.log('✅ Đánh dấu đã đọc thành công');
    },
    onError: (err) => {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Không thể đánh dấu đã đọc';
      
      console.error('❌ Lỗi khi đánh dấu đã đọc:', error);
      setError(errorMessage);
    },
  });
};

/**
 * Hook để đánh dấu tất cả tin nhắn từ một user đã đọc
 */
export const useMarkAllChatsAsRead = () => {
  const queryClient = useQueryClient();
  const { setError, markChatsAsRead } = useChatStore();

  return useMutation({
    mutationFn: (userId: string) => chatApi.markAllAsRead(userId),
    onSuccess: async (response, userId) => {
      console.log('✅ Đánh dấu tất cả đã đọc thành công:', response.data);
      
      // Cập nhật chats trong store
      markChatsAsRead(userId);

      // Update cache trực tiếp cho conversations - set unreadCount = 0
      queryClient.setQueryData<any>(
        chatKeys.conversations(),
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return oldData.map((conv: any) => {
            if (conv.user.id === userId) {
              return {
                ...conv,
                unreadCount: 0
              };
            }
            return conv;
          });
        }
      );

      // Update cache trực tiếp cho messages - set isRead = true
      queryClient.setQueryData<any>(
        chatKeys.history(userId, { page: 1, limit: 50 }),
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return oldData.map((message: any) => ({
            ...message,
            isRead: true
          }));
        }
      );

      // Refetch để đảm bảo sync với server
      await queryClient.refetchQueries({ 
        queryKey: chatKeys.conversations(),
        type: 'active'
      });
      
      console.log('🔄 Đã refetch conversations sau khi đánh dấu đã đọc');
    },
    onError: (err) => {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Không thể đánh dấu đã đọc';
      
      console.error('❌ Lỗi khi đánh dấu tất cả đã đọc:', error);
      setError(errorMessage);
    },
  });
};