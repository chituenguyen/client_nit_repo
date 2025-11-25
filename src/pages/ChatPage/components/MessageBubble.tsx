// src/pages/ChatPage/components/MessageBubble.tsx
import React, { useEffect, useRef } from 'react';
import type { Chat } from '../../../types';

interface MessageBubbleProps {
  chat: Chat;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onMarkAsRead: (messageId: string) => void;
  showTime?: boolean;
}

export default function MessageBubble({ 
  chat, 
  isOwn, 
  isFirstInGroup, 
  isLastInGroup, 
  onMarkAsRead, 
  showTime
}: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsRead = useRef(false);

  useEffect(() => {
    if (!isOwn && !chat.isRead && !hasMarkedAsRead.current && bubbleRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasMarkedAsRead.current) {
            hasMarkedAsRead.current = true;
            onMarkAsRead(chat.id);
          }
        },
        { threshold: 0.5 }
      );

      const currentRef = bubbleRef.current;
      observer.observe(currentRef);

      return () => {
        if (currentRef) {
          observer.unobserve(currentRef);
        }
        observer.disconnect();
      };
    }
  }, [chat.id, chat.isRead, isOwn, onMarkAsRead]);

  const chatTime = new Date(chat.sentAt);
  const timeString = `${chatTime.getHours().toString().padStart(2, '0')}:${chatTime.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div ref={bubbleRef}>
      <div
        className={`
          px-4 py-2.5 rounded-2xl relative
          ${isOwn 
            ? `bg-primary text-primary ${isLastInGroup ? 'rounded-br-none' : isFirstInGroup ? 'rounded-br-lg' : 'rounded-br-lg'}` 
            : `bg-background text-main border border-color ${isLastInGroup ? 'rounded-bl-none' : isFirstInGroup ? 'rounded-bl-lg' : 'rounded-bl-lg'}`
          }
        `}
      >
        <p className="text-sm break-words">{chat.messageContent}</p>
        
        {showTime && (
          <div className={`flex items-center mt-1 ${isOwn ? 'justify-start' : 'justify-end'}`}>
            <span className={`text-xs ${isOwn ? 'text-primary' : 'text-main'} opacity-70`}>
              {timeString}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}