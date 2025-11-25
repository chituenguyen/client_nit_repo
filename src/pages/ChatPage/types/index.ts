// src/pages/ChatPage/types/index.ts
import type { Chat } from "../../../types";

export interface GroupedMessage {
  type: 'date-separator' | 'message-group';
  date?: Date;
  dateLabel?: string;
  isOwn?: boolean;
  sender?: Chat['sender'];
  messages?: Chat[];
  showTime?: boolean;
  timestamp?: Date;
}