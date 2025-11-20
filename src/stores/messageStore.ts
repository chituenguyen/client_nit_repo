// src/stores/messageStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Conversation, Message } from '../api/messageApi';

interface MessageStore {
  // State
  conversations: Conversation[];
  messages: Message[];
  selectedUserId: string | null;
  isLoading: boolean;
  error: string | null;
  isSocketConnected: boolean;
  typingUsers: Record<string, boolean>; // userId -> isTyping
  onlineUsers: Set<string>; // Set of online user IDs

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'seen') => void;
  setSelectedUserId: (userId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSocketConnected: (connected: boolean) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  updateConversationUnreadCount: (userId: string, count: number) => void;
  reset: () => void;
  resetError: () => void;
}

const initialState = {
  conversations: [],
  messages: [],
  selectedUserId: null,
  isLoading: false,
  error: null,
  isSocketConnected: false,
  typingUsers: {},
  onlineUsers: new Set<string>(),
};

export const useMessageStore = create<MessageStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Set danh sách cuộc hội thoại
      setConversations: (conversations) =>
        set({ conversations, error: null }, false, 'setConversations'),

      // Set danh sách tin nhắn
      setMessages: (messages) =>
        set({ messages, error: null }, false, 'setMessages'),

      // Thêm tin nhắn mới
      addMessage: (message) =>
        set(
          (state) => ({
            messages: [...state.messages, message],
          }),
          false,
          'addMessage'
        ),

      // Cập nhật trạng thái tin nhắn
      updateMessageStatus: (messageId, status) =>
        set(
          (state) => ({
            messages: state.messages.map((msg) =>
              msg.id === messageId ? { ...msg, status } : msg
            ),
          }),
          false,
          'updateMessageStatus'
        ),

      // Set user được chọn
      setSelectedUserId: (userId) =>
        set({ selectedUserId: userId }, false, 'setSelectedUserId'),

      // Set loading state
      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      // Set error
      setError: (error) =>
        set({ error, isLoading: false }, false, 'setError'),

      // Set socket connection status
      setSocketConnected: (connected) =>
        set({ isSocketConnected: connected }, false, 'setSocketConnected'),

      // Set user typing status
      setUserTyping: (userId, isTyping) =>
        set(
          (state) => ({
            typingUsers: { ...state.typingUsers, [userId]: isTyping },
          }),
          false,
          'setUserTyping'
        ),

      // Set user online/offline status
      setUserOnline: (userId, isOnline) =>
        set(
          (state) => {
            const newOnlineUsers = new Set(state.onlineUsers);
            if (isOnline) {
              newOnlineUsers.add(userId);
            } else {
              newOnlineUsers.delete(userId);
            }
            
            // Cập nhật isOnline trong conversations
            const updatedConversations = state.conversations.map((conv) =>
              conv.participantId === userId
                ? { ...conv, isOnline }
                : conv
            );

            return {
              onlineUsers: newOnlineUsers,
              conversations: updatedConversations,
            };
          },
          false,
          'setUserOnline'
        ),

      // Update unread count for a conversation
      updateConversationUnreadCount: (userId, count) =>
        set(
          (state) => ({
            conversations: state.conversations.map((conv) =>
              conv.participantId === userId
                ? { ...conv, unreadCount: count }
                : conv
            ),
          }),
          false,
          'updateConversationUnreadCount'
        ),

      // Reset toàn bộ store
      reset: () =>
        set(initialState, false, 'reset'),

      // Reset lỗi
      resetError: () =>
        set({ error: null }, false, 'resetError'),
    }),
    { name: 'MessageStore' }
  )
);

// Selectors để dễ dàng lấy state
export const selectConversations = (state: MessageStore) => state.conversations;
export const selectMessages = (state: MessageStore) => state.messages;
export const selectSelectedUserId = (state: MessageStore) => state.selectedUserId;
export const selectIsLoading = (state: MessageStore) => state.isLoading;
export const selectError = (state: MessageStore) => state.error;

