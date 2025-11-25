// src/pages/ChatPage/utils/messageGrouping.ts
import type { Chat } from '../../../types';
import type { GroupedMessage } from '../types';
import { formatDateSeparator } from './timeFormatters';

export function groupMessages(rawChats: Chat[], currentUserId?: string): GroupedMessage[] {
  if (!rawChats) return [];
  
  const sorted = [...rawChats].sort((a, b) => {
    const dateA = new Date(a.sentAt).getTime();
    const dateB = new Date(b.sentAt).getTime();
    return dateA - dateB;
  });

  const groups: GroupedMessage[] = [];
  let currentGroup: GroupedMessage | null = null;
  let currentDateGroup: string | null = null;

  sorted.forEach((chat, index) => {
    const chatDate = new Date(chat.sentAt);
    const dateKey = formatDateSeparator(chatDate);
    
    // Kiểm tra nếu cần tạo date separator mới
    if (dateKey !== currentDateGroup) {
      currentDateGroup = dateKey;
      groups.push({
        type: 'date-separator',
        date: chatDate,
        dateLabel: dateKey,
      });
      currentGroup = null;
    }

    const isOwn = chat.senderId === currentUserId;
    const prevChat = index > 0 ? sorted[index - 1] : null;
    const timeDiff = prevChat 
      ? (chatDate.getTime() - new Date(prevChat.sentAt).getTime()) / 60000 
      : 31;

    // Kiểm tra nếu cần tạo nhóm mới
    const shouldCreateNewGroup = 
      !currentGroup ||
      currentGroup.type === 'date-separator' ||
      currentGroup.isOwn !== isOwn ||
      timeDiff >= 30;

    if (shouldCreateNewGroup) {
      currentGroup = {
        type: 'message-group',
        isOwn,
        sender: chat.sender,
        messages: [chat],
        showTime: timeDiff >= 30,
        timestamp: chatDate,
      };
      groups.push(currentGroup);
    } else if (currentGroup && currentGroup.type === 'message-group' && currentGroup.messages) {
      // Thêm message vào nhóm hiện tại
      currentGroup.messages.push(chat);
    }
  });

  return groups;
}