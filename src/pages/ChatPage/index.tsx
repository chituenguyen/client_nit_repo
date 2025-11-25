// src/pages/ChatPage/index.tsx
import { useState } from 'react';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import ConversationsList from './components/ConversationsList';
import ChatWindow from './components/ChatWindow';
import EmptyChatState from './components/EmptyChatState';

export default function ChatPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const wsContext = useChatWebSocket({
    autoConnect: true,
    onConnect: () => console.log('✅ Chat WebSocket connected'),
    onDisconnect: () => console.log('🔌 Chat WebSocket disconnected'),
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleCloseChat = () => {
    setSelectedUserId(null);
  };

  return (
    <section className="flex gap-4 h-[calc(100vh-230px)] p-4">
      <aside className="w-full lg:w-80 flex-shrink-0">
        <ConversationsList 
          selectedUserId={selectedUserId}
          onSelectUser={handleSelectUser}
          isWsConnected={wsContext.isConnected}
        />
      </aside>

      <main className="hidden lg:flex lg:flex-1 flex-col">
        {selectedUserId ? (
          <ChatWindow 
            userId={selectedUserId} 
            onClose={handleCloseChat}
            wsContext={wsContext} 
          />
        ) : (
          <EmptyChatState isConnected={wsContext.isConnected} />
        )}
      </main>

      {selectedUserId && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <ChatWindow 
            userId={selectedUserId} 
            onClose={handleCloseChat} 
            isMobile 
            wsContext={wsContext}
          />
        </div>
      )}
    </section>
  );
}