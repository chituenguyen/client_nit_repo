// src/stores/chatStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type Chat, type ChatListUser, type ChatUser } from '../types';

interface ChatStore {
  // State
  chats: Chat[];
  chatUsers: ChatListUser[];
  selectedUserId: string | null;
  otherUser: ChatUser | null; // Thông tin user đang chat
  isLoading: boolean;
  error: string | null;
  
  // Pagination (sử dụng meta từ API)
  totalChats: number;
  currentPage: number;
  pageLimit: number;
  totalPages: number;

  // Unread count
  totalUnreadCount: number;

  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  setChatUsers: (users: ChatListUser[]) => void;
  setSelectedUserId: (userId: string | null) => void;
  setOtherUser: (user: ChatUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMeta: (meta: { total: number; page: number; limit: number; totalPages: number }) => void;
  setTotalUnreadCount: (count: number) => void;
  markChatsAsRead: (userId: string) => void;
  reset: () => void;
  resetError: () => void;
}

const initialState = {
  chats: [],
  chatUsers: [],
  selectedUserId: null,
  otherUser: null,
  isLoading: false,
  error: null,
  totalChats: 0,
  currentPage: 1,
  pageLimit: 50,
  totalPages: 0,
  totalUnreadCount: 0,
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Set danh sách chats
      setChats: (chats) => 
        set({ chats, error: null }, false, 'setChats'),

      // Thêm một chat mới (realtime)
      addChat: (chat) =>
        set((state) => {
          // Kiểm tra xem chat đã tồn tại chưa
          const exists = state.chats.some(c => c.id === chat.id);
          if (exists) return state;

          return {
            chats: [chat, ...state.chats],
            totalChats: state.totalChats + 1,
          };
        }, false, 'addChat'),

      // Cập nhật chat (ví dụ: đánh dấu đã đọc)
      updateChat: (chatId, updates) =>
        set((state) => ({
          chats: state.chats.map(c =>
            c.id === chatId ? { ...c, ...updates } : c
          ),
        }), false, 'updateChat'),

      // Set danh sách chat users
      setChatUsers: (users) =>
        set({ chatUsers: users, error: null }, false, 'setChatUsers'),

      // Set user đang được chọn để chat
      setSelectedUserId: (userId) =>
        set({ selectedUserId: userId }, false, 'setSelectedUserId'),

      // Set thông tin other user (từ API response)
      setOtherUser: (user) =>
        set({ otherUser: user }, false, 'setOtherUser'),

      // Set loading state
      setLoading: (isLoading) => 
        set({ isLoading }, false, 'setLoading'),

      // Set error
      setError: (error) => 
        set({ error, isLoading: false }, false, 'setError'),

      // Set meta (thay vì setPagination)
      setMeta: (meta) =>
        set({
          totalChats: meta.total,
          currentPage: meta.page,
          pageLimit: meta.limit,
          totalPages: meta.totalPages,
        }, false, 'setMeta'),

      // Set tổng số tin nhắn chưa đọc
      setTotalUnreadCount: (count) =>
        set({ totalUnreadCount: count }, false, 'setTotalUnreadCount'),

      // Đánh dấu tất cả tin nhắn từ một user đã đọc
      markChatsAsRead: (userId) =>
        set((state) => ({
          chats: state.chats.map(c =>
            (c.senderId === userId || c.receiverId === userId)
              ? { ...c, isRead: true }
              : c
          ),
          chatUsers: state.chatUsers.map(u =>
            u.user.id === userId
              ? { 
                  ...u, 
                  unreadCount: 0, 
                  lastMessage: { ...u.lastMessage, isRead: true }
                }
              : u
          ),
          totalUnreadCount: Math.max(0, state.totalUnreadCount - (state.chatUsers.find(u => u.user.id === userId)?.unreadCount || 0)),
        }), false, 'markChatsAsRead'),

      // Reset toàn bộ store
      reset: () => 
        set(initialState, false, 'reset'),

      // Reset lỗi
      resetError: () => 
        set({ error: null }, false, 'resetError'),
    }),
    { name: 'ChatStore' }
  )
);

// Selectors để dễ dàng lấy state
export const selectChats = (state: ChatStore) => state.chats;
export const selectChatUsers = (state: ChatStore) => state.chatUsers;
export const selectSelectedUserId = (state: ChatStore) => state.selectedUserId;
export const selectOtherUser = (state: ChatStore) => state.otherUser;
export const selectIsLoading = (state: ChatStore) => state.isLoading;
export const selectError = (state: ChatStore) => state.error;
export const selectMeta = (state: ChatStore) => ({
  total: state.totalChats,
  page: state.currentPage,
  limit: state.pageLimit,
  totalPages: state.totalPages,
});
export const selectTotalUnreadCount = (state: ChatStore) => state.totalUnreadCount;