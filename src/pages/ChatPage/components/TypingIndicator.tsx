// src/pages/ChatPage/components/TypingIndicator.tsx
interface TypingIndicatorProps {
  avatarUrl?: string | null;
  fullName?: string;
}

export default function TypingIndicator({ avatarUrl, fullName }: TypingIndicatorProps) {
  return (
    <div className="flex gap-2 items-end">
      <img
        src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || '')}&background=random`}
        alt="typing"
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
      <div className="px-4 py-2.5 rounded-2xl rounded-bl-none bg-background border border-color">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}