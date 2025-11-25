// src/pages/ChatPage/components/EmptyChatState.tsx
import { IoChatboxEllipsesSharp } from "react-icons/io5";

interface EmptyChatStateProps {
  isConnected: boolean;
}

export default function EmptyChatState({ isConnected }: EmptyChatStateProps) {
  return (
    <div className="h-full bg-background rounded-lg shadow-md flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <IoChatboxEllipsesSharp className='w-1/2 h-1/2 mb-4 mx-auto text-secondary'/>
        <h2 className="text-2xl font-bold text-main mb-2">
          Your Messages
        </h2>
        <p className="text-secondary mb-4">
          Select a conversation from the sidebar to start chatting with your lecturers or students.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-secondary">
            {isConnected ? 'Real-time chat enabled' : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  );
}