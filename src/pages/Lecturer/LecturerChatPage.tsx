import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useConversations, useChatHistory, useSendChat, useMarkAllChatsAsRead } from '../../hooks/useChatQuery';
import { useChatStore } from '../../stores/chatStore';
import useChatWebSocket from '../../hooks/useChatWebSocket';

// Component hiển thị trạng thái tin nhắn
function MessageStatus({ status }: { status?: 'sent' | 'delivered' | 'seen' }) {
  if (!status) return null;

  if (status === 'sent') {
    // Đã gửi - 1 dấu check xám
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-gray-400">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    );
  }

  if (status === 'delivered') {
    // Đã nhận - 2 dấu check xám
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-gray-400">
        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
      </svg>
    );
  }

  if (status === 'seen') {
    // Đã xem - 2 dấu check xanh
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-blue-500">
        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
      </svg>
    );
  }

  return null;
}

export default function LecturerChatPage() {
  // Default avatar SVG
  const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
  
  const user = useAuthStore(state => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'users'>('conversations'); // Tab hiện tại

  // Socket Hook - Kết nối và lắng nghe events
  const socket = useChatWebSocket();
  const typingTimeoutRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // API Hooks
  const { data: conversationsData, isLoading: loadingConversations } = useConversations();
  const conversations = conversationsData || [];
  
  // Socket state
  const isSocketConnected = socket.isConnected;
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  
  const users: any[] = [];
  const loadingUsers = false;
  
  const selectedUserId = useChatStore(state => state.selectedUserId);
  const setSelectedUserId = useChatStore(state => state.setSelectedUserId);
  
  const { data: messagesData, isLoading: loadingMessages } = useChatHistory({ 
    userId: selectedUserId || '', 
    page: 1, 
    limit: 50 
  });
  const messages = messagesData || [];
  
  const sendMessageMutation = useSendChat();
  const markAllAsReadMutation = useMarkAllChatsAsRead();

  // Chọn conversation đầu tiên khi load (chỉ trên desktop)
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768; // md breakpoint
    if (conversations.length > 0 && !selectedUserId && isDesktop) {
      setSelectedUserId(conversations[0].user.id);
    }
  }, [conversations, selectedUserId, setSelectedUserId]);

  // Đánh dấu tất cả tin nhắn đã đọc khi chọn user
  useEffect(() => {
    if (selectedUserId) {
      markAllAsReadMutation.mutate(selectedUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  // Filter conversations - Kiểm tra fullName tồn tại
  const filteredConversations = conversations.filter(conv => {
    if (!conv.user.fullName) return false;
    return conv.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter users
  const filteredUsers = users.filter(u => {
    if (!u.full_name) return false;
    return u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           u.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Tìm conversation được chọn
  const selectedConversation = conversations.find(
    conv => conv.user.id === selectedUserId
  );
  
  // Tìm user được chọn (có thể từ users list)
  const selectedUser = users.find(u => u.id === selectedUserId);

  // Format messages để hiển thị
  const formattedMessages = messages.map(msg => ({
    ...msg,
    content: msg.messageContent,
    isMine: msg.senderId === user?.id,
    time: (() => {
      const timestamp = msg.sentAt;
      if (!timestamp) return '';
      try {
        return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    })(),
    status: msg.isRead ? 'seen' : 'sent' as 'sent' | 'delivered' | 'seen',
  }));

  // Danh sách emoji phổ biến
  const emojis = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
    '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
    '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫',
    '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳',
    '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭',
    '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
    '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    '🔥', '⭐', '🌟', '✨', '💫', '💥', '💢', '💦', '💨', '🎉',
    '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈'
  ];

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedUserId && user) {
      const messageContent = newMessage.trim();
      
      // Clear input immediately for better UX
      setNewMessage('');
      setShowEmojiPicker(false);
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isSocketConnected) {
        socket.sendTyping(selectedUserId, false);
      }
      
      try {
        // Optimistic update: Hiển thị tin nhắn ngay lập tức
        const optimisticMessage = {
          id: `temp-${Date.now()}`, // Temporary ID
          senderId: user.id,
          receiverId: selectedUserId,
          messageContent: messageContent,
          isRead: false,
          sentAt: new Date().toISOString(),
          readAt: null,
          sender: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar,
            role: user.role.toUpperCase() as 'STUDENT' | 'LECTURER',
          },
          receiver: {
            id: selectedUserId,
            email: '',
            fullName: '',
            avatarUrl: null,
            role: 'STUDENT' as const,
          },
        };
        
        // Add to store immediately (will show in UI instantly)
        // Note: This will be replaced by real message from server
        console.log('⚡ Optimistic update:', optimisticMessage);
        
        // Ưu tiên gửi qua socket nếu đã kết nối
        if (isSocketConnected) {
          console.log('📤 Sending message via WebSocket');
          socket.sendMessage(selectedUserId, messageContent);
        } else {
          // Fallback: Gửi qua REST API nếu socket không kết nối
          console.log('📤 Sending message via REST API (socket not connected)');
          sendMessageMutation.mutate({
            receiverId: selectedUserId,
            messageContent: messageContent,
          });
        }
      } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
        
        // Nếu socket fail, thử gửi qua API
        if (isSocketConnected) {
          console.log('⚠️ Socket send failed, falling back to REST API');
          sendMessageMutation.mutate({
            receiverId: selectedUserId,
            messageContent: messageContent,
          });
        }
        
        // Restore message to input if failed
        setNewMessage(messageContent);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle typing indicator
  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    
    if (!selectedUserId || !isSocketConnected) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start
    if (value.trim()) {
      socket.sendTyping(selectedUserId, true);

      // Auto stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socket.sendTyping(selectedUserId, false);
      }, 3000);
    } else {
      // Send typing stop immediately if empty
      socket.sendTyping(selectedUserId, false);
    }
  }, [selectedUserId, isSocketConnected, socket]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Listen for typing events from WebSocket
  useEffect(() => {
    const handleTyping = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId, isTyping } = customEvent.detail;
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    };

    window.addEventListener('user-typing', handleTyping);
    return () => window.removeEventListener('user-typing', handleTyping);
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [formattedMessages]);

  const handleBackToList = () => {
    setSelectedUserId(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar - Danh sách chat */}
      {/* Trên mobile: Ẩn khi có conversation được chọn */}
      <div className={`w-full md:w-80 bg-surface md:border-r border-gray-200 dark:border-gray-700 flex flex-col ${
        selectedUserId ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header with Tabs */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-main">Chat</h2>
            {/* Socket connection indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-secondary">
                {isSocketConnected ? 'Đã kết nối' : 'Đang kết nối...'}
              </span>
            </div>
          </div>
          
          {/* Tabs - Tạm ẩn tab "Người dùng" vì backend chưa có API */}
          {false && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'conversations'
                  ? 'bg-primary text-primary'
                  : 'text-secondary hover:bg-component'
              }`}
            >
              Tin nhắn
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-primary text-primary'
                  : 'text-secondary hover:bg-component'
              }`}
            >
              Người dùng
            </button>
          </div>
          )}
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Chat List / Users List */}
        <div className="flex-1 overflow-y-auto">
          {/* Tab: Conversations */}
          {activeTab === 'conversations' && (
            <>
              {loadingConversations ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-secondary">Đang tải...</div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-secondary">Chưa có cuộc hội thoại nào</div>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isOnline = socket.onlineUsers.includes(conversation.user.id);
                  const lastMessageTime = new Date(conversation.lastMessage.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div
                      key={conversation.user.id}
                      onClick={() => setSelectedUserId(conversation.user.id)}
                      className={`flex items-start gap-3 p-3 md:p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 ${
                        selectedUserId === conversation.user.id
                          ? 'bg-component'
                          : 'hover:bg-component'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={conversation.user.avatarUrl || DEFAULT_AVATAR}
                          alt={conversation.user.fullName}
                          className="w-11 h-11 md:w-12 md:h-12 rounded-full object-cover"
                        />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 rounded-full border-2 border-surface"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm text-main truncate">
                            {conversation.user.fullName}
                          </h4>
                          <span className="text-xs text-secondary flex-shrink-0 ml-2">
                            {lastMessageTime}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs md:text-sm text-secondary truncate flex-1">
                            {conversation.lastMessage.isSentByMe ? 'Bạn: ' : ''}{conversation.lastMessage.messageContent}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="flex-shrink-0 ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Tab: Users */}
          {activeTab === 'users' && (
            <>
              {loadingUsers ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-secondary">Đang tải...</div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-secondary">Không tìm thấy người dùng</div>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setActiveTab('conversations'); // Chuyển về tab conversations khi chọn user
                    }}
                    className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 ${
                      selectedUserId === user.id
                        ? 'bg-component'
                        : 'hover:bg-component'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatar || DEFAULT_AVATAR}
                        alt={user.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-main truncate">
                          {user.full_name}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.role === 'student' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        }`}>
                          {user.role === 'student' ? 'Học sinh' : 'Giảng viên'}
                        </span>
                      </div>
                      <p className="text-xs text-secondary truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {/* Trên mobile: Ẩn khi chưa có conversation được chọn */}
      <div className={`flex-1 flex flex-col ${
        selectedUserId ? 'flex' : 'hidden md:flex'
      }`}>
        {/* Chat Header */}
        {selectedConversation || selectedUser ? (
          <div className="bg-surface border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Nút Back - Chỉ hiện trên mobile */}
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="md:hidden p-2 -ml-2 rounded-lg hover:bg-component transition-colors"
                  aria-label="Quay lại danh sách"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="text-main">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                  </svg>
                </button>
                
                <div className="relative">
                  <img
                    src={selectedConversation?.user.avatarUrl || selectedUser?.avatar || DEFAULT_AVATAR}
                    alt={selectedConversation?.user.fullName || selectedUser?.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {selectedUserId && socket.onlineUsers.includes(selectedUserId) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base text-main">
                    {selectedConversation?.user.fullName || selectedUser?.full_name}
                  </h3>
                  <p className="text-xs text-secondary">
                    {selectedUserId && typingUsers[selectedUserId] ? (
                      <span className="text-blue-500 italic">Đang nhập...</span>
                    ) : selectedUserId && socket.onlineUsers.includes(selectedUserId) ? (
                      'Đang hoạt động'
                    ) : selectedConversation ? (
                      'Không hoạt động'
                    ) : (
                      selectedUser?.email
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:block bg-surface border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="text-secondary text-center">Chọn một người để bắt đầu trò chuyện</div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-background">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-secondary text-sm">Đang tải tin nhắn...</div>
            </div>
          ) : formattedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-secondary text-sm">Chưa có tin nhắn nào</div>
            </div>
          ) : (
            <>
              {formattedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${message.isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                {!message.isMine && (selectedConversation || selectedUser) && (
                  <img
                    src={selectedConversation?.user.avatarUrl || selectedUser?.avatar || DEFAULT_AVATAR}
                    alt={selectedConversation?.user.fullName || selectedUser?.full_name}
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className={`flex flex-col ${message.isMine ? 'items-end' : 'items-start'} max-w-[75%] md:max-w-md`}>
                  <div
                    className={`px-3 md:px-4 py-2 rounded-2xl ${
                      message.isMine
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-component text-main rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-2">
                    <span className="text-xs text-secondary">{message.time}</span>
                    {message.isMine && <MessageStatus status={message.status} />}
                  </div>
                </div>
              </div>
              ))}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-surface border-t border-gray-200 dark:border-gray-700 p-3 md:p-4">
          <div className="flex items-end gap-2 md:gap-3 relative">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 w-[calc(100vw-2rem)] max-w-sm md:w-80 h-64 bg-surface rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-main text-sm">Chọn emoji</h4>
                  </div>
                  <div className="p-2 h-52 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-1">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="text-xl md:text-2xl p-1.5 md:p-2 hover:bg-component rounded-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-lg hover:bg-component transition-colors flex-shrink-0"
              aria-label="Open emoji picker"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
              </svg>
            </button>
            
            <div className="flex-1 bg-background rounded-lg border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 transition-colors">
              <textarea
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                rows={1}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-transparent border-none resize-none focus:outline-none text-main text-sm max-h-32"
                style={{ minHeight: '40px' }}
              />
            </div>

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2.5 md:p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" className="md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

