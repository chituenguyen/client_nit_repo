// src/pages/ChatPage/components/MessageGroup.tsx
import React from 'react';
import MessageBubble from './MessageBubble';
import { formatDetailedTime } from '../utils/timeFormatters';
import type { GroupedMessage } from '../types';

interface MessageGroupProps {
  group: GroupedMessage;
  onMarkAsRead: (messageId: string) => void;
  lastSeenMessageId: string | null;
  otherUserAvatar?: string | null;
}

export default function MessageGroup({ 
  group, 
  onMarkAsRead, 
  lastSeenMessageId,
  otherUserAvatar
}: MessageGroupProps) {
  if (group.type !== 'message-group' || !group.messages) return null;

  return (
    <div className="space-y-3">
      {group.showTime && (
        <div className="flex justify-center">
          <p className="text-xs text-secondary px-3 py-1 bg-component rounded-full">
            {formatDetailedTime(group.timestamp!)}
          </p>
        </div>
      )}
      
      <div className={`flex gap-2 ${group.isOwn ? 'justify-end' : 'justify-start'}`}>
        {!group.isOwn && (
          <img
            src={group.sender?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.sender?.fullName || '')}&background=random`}
            alt={group.sender?.fullName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 self-end"
          />
        )}

        <div className={`flex flex-col gap-1 max-w-[70%] ${group.isOwn ? 'items-end' : 'items-start'}`}>
          {group.messages.map((chat, index) => {
            const isLast = index === group.messages!.length - 1;
            // Kiểm tra xem tin nhắn này có phải là tin nhắn cuối cùng đã seen không
            const isLastSeenMessage = chat.id === lastSeenMessageId;
            
            return (
              <div key={chat.id} className="w-full flex flex-col gap-1">
                <MessageBubble
                  chat={chat}
                  isOwn={group.isOwn!}
                  isFirstInGroup={index === 0}
                  isLastInGroup={isLast}
                  onMarkAsRead={onMarkAsRead}
                  showTime={isLast}
                />
                
                {/* Chỉ hiển thị avatar ở tin nhắn cuối cùng đã seen và là tin nhắn của MÌNH */}
                {group.isOwn && isLastSeenMessage && (
                  <div className="flex items-center gap-1 px-1 justify-end">
                    <img
                      src={otherUserAvatar || `https://ui-avatars.com/api/?name=User&background=random`}
                      alt="seen"
                      className="w-4 h-4 rounded-full object-cover"
                      title="Đã xem"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}