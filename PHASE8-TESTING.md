# PHASE 8 TESTING GUIDE - REAL-TIME CHAT SYSTEM

## Overview
Phase 8 implements a real-time chat system with WebSocket support:
- 1-1 direct messaging
- Real-time message delivery
- Typing indicators
- Online/offline status tracking
- Read receipts
- Message history with pagination
- Conversation list

## Prerequisites
- Server running: `yarn start:dev`
- Database connected
- Have authentication tokens for at least 2 users (to test messaging between them)

## Testing Endpoints

### Base URLs
```
REST API: http://localhost:3000/api/v1/chat
WebSocket: ws://localhost:3000/chat
```

---

## Part 1: REST API Testing

### 1.1 Get Conversations List
```bash
GET /api/v1/chat/conversations
Authorization: Bearer <your-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "user": {
        "id": "user-uuid",
        "email": "student@elearning.com",
        "fullName": "Nguyễn Văn A",
        "avatarUrl": null,
        "role": "STUDENT"
      },
      "lastMessage": {
        "id": "message-uuid",
        "messageContent": "Hello!",
        "sentAt": "2024-01-15T10:00:00.000Z",
        "isRead": true,
        "isSentByMe": false
      },
      "unreadCount": 2
    }
  ]
}
```

### 1.2 Get Message History with a User
```bash
GET /api/v1/chat/messages/<user-id>?page=1&limit=50
Authorization: Bearer <your-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50, max: 100)

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "message-uuid",
        "senderId": "sender-uuid",
        "receiverId": "receiver-uuid",
        "messageContent": "Hello, how are you?",
        "isRead": true,
        "sentAt": "2024-01-15T10:00:00.000Z",
        "readAt": "2024-01-15T10:05:00.000Z",
        "sender": {
          "id": "sender-uuid",
          "email": "student@elearning.com",
          "fullName": "Nguyễn Văn A",
          "avatarUrl": null,
          "role": "STUDENT"
        },
        "receiver": {
          "id": "receiver-uuid",
          "email": "lecturer@elearning.com",
          "fullName": "Nguyễn Văn B",
          "avatarUrl": null,
          "role": "LECTURER"
        }
      }
    ],
    "otherUser": {
      "id": "user-uuid",
      "email": "student@elearning.com",
      "fullName": "Nguyễn Văn A",
      "avatarUrl": null,
      "role": "STUDENT"
    },
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "totalPages": 2
    }
  }
}
```

### 1.3 Send Message (REST - WebSocket preferred)
```bash
POST /api/v1/chat/messages
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "receiverId": "user-uuid",
  "messageContent": "Hello, how are you?"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "senderId": "your-uuid",
    "receiverId": "user-uuid",
    "messageContent": "Hello, how are you?",
    "isRead": false,
    "sentAt": "2024-01-15T10:00:00.000Z",
    "readAt": null,
    "sender": { /* sender info */ },
    "receiver": { /* receiver info */ }
  }
}
```

### 1.4 Mark Message as Read
```bash
POST /api/v1/chat/messages/<message-id>/read
Authorization: Bearer <your-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "isRead": true,
    "readAt": "2024-01-15T10:05:00.000Z"
  }
}
```

### 1.5 Mark All Messages from User as Read
```bash
POST /api/v1/chat/messages/read-all/<sender-id>
Authorization: Bearer <your-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### 1.6 Get Unread Count
```bash
GET /api/v1/chat/unread-count
Authorization: Bearer <your-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 12
  }
}
```

### 1.7 Delete Message (Admin or sender within 5 minutes)
```bash
DELETE /api/v1/chat/messages/<message-id>
Authorization: Bearer <your-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Message deleted successfully"
  }
}
```

**Error Cases:**
- 400: Cannot delete messages older than 5 minutes (non-admin)
- 400: Can only delete your own messages
- 404: Message not found

---

## Part 2: WebSocket Testing

### 2.1 Connection Setup

**Using Socket.io Client (JavaScript):**
```javascript
import io from 'socket.io-client';

// Connect with JWT token
const socket = io('http://localhost:3000/chat', {
  query: {
    token: 'your-jwt-token-here'
  }
});

// Connection successful
socket.on('connected', (data) => {
  console.log('Connected:', data);
  // Output: { message: 'Successfully connected to chat', userId: 'your-uuid' }
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
});
```

**Using Postman (WebSocket):**
1. Open Postman → New → WebSocket Request
2. URL: `ws://localhost:3000/chat?token=your-jwt-token`
3. Click "Connect"

### 2.2 WebSocket Events

#### Event: `send_message`
**Emit from client:**
```javascript
socket.emit('send_message', {
  receiverId: 'user-uuid',
  messageContent: 'Hello from WebSocket!'
});
```

**Receive acknowledgment:**
```javascript
socket.on('message_sent', (data) => {
  console.log('Message sent:', data);
  // { success: true, message: { id, senderId, receiverId, messageContent, ... } }
});
```

**Receiver gets:**
```javascript
socket.on('receive_message', (message) => {
  console.log('New message:', message);
  // { id, senderId, receiverId, messageContent, sentAt, sender: {...}, receiver: {...} }
});
```

#### Event: `mark_as_read`
**Emit from client (receiver):**
```javascript
socket.emit('mark_as_read', {
  messageId: 'message-uuid'
});
```

**Sender receives:**
```javascript
socket.on('message_read', (data) => {
  console.log('Message was read:', data);
  // { messageId: 'uuid', readAt: '2024-01-15T10:05:00.000Z', readBy: 'user-uuid' }
});
```

#### Event: `typing`
**Emit from client:**
```javascript
// Start typing
socket.emit('typing', {
  receiverId: 'user-uuid',
  isTyping: true
});

// Stop typing
socket.emit('typing', {
  receiverId: 'user-uuid',
  isTyping: false
});
```

**Receiver gets:**
```javascript
socket.on('user_typing', (data) => {
  console.log('User typing status:', data);
  // { userId: 'sender-uuid', isTyping: true }
});
```

#### Event: `user_online` / `user_offline`
**Listen for user status:**
```javascript
socket.on('user_online', (data) => {
  console.log('User came online:', data.userId);
});

socket.on('user_offline', (data) => {
  console.log('User went offline:', data.userId);
});
```

#### Event: `get_online_users`
**Emit from client:**
```javascript
socket.emit('get_online_users', {}, (response) => {
  console.log('Online users:', response.onlineUsers);
  // { onlineUsers: ['uuid1', 'uuid2', ...] }
});
```

#### Event: `is_user_online`
**Check if specific user is online:**
```javascript
socket.emit('is_user_online', { userId: 'user-uuid' }, (response) => {
  console.log('Is online?', response);
  // { userId: 'uuid', isOnline: true }
});
```

---

## Testing Scenarios

### Scenario 1: Basic Chat Flow (2 Users)

**User A (Student):**
1. Login and get token
   ```bash
   POST /api/v1/auth/login
   { "email": "student1@elearning.com", "password": "student123" }
   ```
   Save token as `TOKEN_A`

2. Connect to WebSocket
   ```javascript
   const socketA = io('http://localhost:3000/chat', {
     query: { token: TOKEN_A }
   });
   ```

3. Send message to User B
   ```javascript
   socketA.emit('send_message', {
     receiverId: USER_B_ID,
     messageContent: 'Hi there!'
   });
   ```

**User B (Student/Lecturer):**
1. Login and get token
   ```bash
   POST /api/v1/auth/login
   { "email": "student2@elearning.com", "password": "student123" }
   ```
   Save token as `TOKEN_B`

2. Connect to WebSocket
   ```javascript
   const socketB = io('http://localhost:3000/chat', {
     query: { token: TOKEN_B }
   });
   ```

3. Listen for messages
   ```javascript
   socketB.on('receive_message', (message) => {
     console.log('Received:', message.messageContent);
     // Output: "Hi there!"
   });
   ```

4. Reply to User A
   ```javascript
   socketB.emit('send_message', {
     receiverId: USER_A_ID,
     messageContent: 'Hello! How can I help?'
   });
   ```

5. Mark as read
   ```javascript
   socketB.emit('mark_as_read', {
     messageId: message.id
   });
   ```

### Scenario 2: Typing Indicator

**User A:**
```javascript
// User A starts typing
socketA.emit('typing', {
  receiverId: USER_B_ID,
  isTyping: true
});

// User B receives typing indicator
socketB.on('user_typing', (data) => {
  console.log(`${data.userId} is typing...`);
});

// User A stops typing (after sending message or timeout)
socketA.emit('typing', {
  receiverId: USER_B_ID,
  isTyping: false
});
```

### Scenario 3: Offline Message Delivery

**User A (online):**
1. Connect to WebSocket
2. Send message to User B (who is offline)
   ```javascript
   socketA.emit('send_message', {
     receiverId: USER_B_ID,
     messageContent: 'Are you there?'
   });
   ```
3. Message is saved to database ✅
4. User A receives acknowledgment ✅

**User B (comes online later):**
1. Connect to WebSocket
2. Fetch message history via REST API
   ```bash
   GET /api/v1/chat/messages/<USER_A_ID>?page=1&limit=50
   ```
3. See the offline message ✅
4. Mark as read
   ```javascript
   socketB.emit('mark_as_read', { messageId: 'message-uuid' });
   ```

### Scenario 4: Multiple Conversations

**User A chats with multiple users:**
1. Get conversations list
   ```bash
   GET /api/v1/chat/conversations
   ```
   Returns:
   ```json
   [
     { "user": { "fullName": "User B" }, "unreadCount": 3 },
     { "user": { "fullName": "User C" }, "unreadCount": 0 },
     { "user": { "fullName": "User D" }, "unreadCount": 1 }
   ]
   ```

2. Click on User B conversation
   ```bash
   GET /api/v1/chat/messages/<USER_B_ID>?page=1&limit=50
   ```

3. Mark all messages from User B as read
   ```bash
   POST /api/v1/chat/messages/read-all/<USER_B_ID>
   ```

### Scenario 5: Read Receipts

**User A sends message:**
```javascript
socketA.emit('send_message', {
  receiverId: USER_B_ID,
  messageContent: 'Did you finish the assignment?'
});

socketA.on('message_sent', (data) => {
  console.log('Message sent, waiting for read receipt...');
  // isRead: false
});
```

**User B reads message:**
```javascript
socketB.on('receive_message', (message) => {
  // User B opens the message
  socketB.emit('mark_as_read', {
    messageId: message.id
  });
});
```

**User A receives read receipt:**
```javascript
socketA.on('message_read', (data) => {
  console.log('Message was read at:', data.readAt);
  // Show double checkmark in UI
});
```

---

## Testing with Postman / Thunder Client

### REST API Testing:
1. Import collection (or create requests manually)
2. Set Bearer token in Authorization header
3. Test each endpoint

### WebSocket Testing with Postman:
1. **Connect:**
   - URL: `ws://localhost:3000/chat?token=<jwt-token>`
   - Click "Connect"

2. **Send message:**
   ```json
   {
     "event": "send_message",
     "data": {
       "receiverId": "user-uuid",
       "messageContent": "Test message"
     }
   }
   ```

3. **Listen for events:**
   - `connected`
   - `message_sent`
   - `receive_message`
   - `user_typing`
   - `user_online`
   - `user_offline`

---

## Testing with HTML Client

Create a simple HTML test client:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Chat Test Client</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Chat Test Client</h1>

  <div>
    <input id="token" placeholder="JWT Token" style="width: 500px" />
    <button onclick="connect()">Connect</button>
    <button onclick="disconnect()">Disconnect</button>
  </div>

  <div>
    <input id="receiverId" placeholder="Receiver ID" />
    <input id="message" placeholder="Message" />
    <button onclick="sendMessage()">Send</button>
  </div>

  <div>
    <h3>Messages:</h3>
    <div id="messages"></div>
  </div>

  <script>
    let socket;

    function connect() {
      const token = document.getElementById('token').value;
      socket = io('http://localhost:3000/chat', {
        query: { token }
      });

      socket.on('connected', (data) => {
        console.log('Connected:', data);
        addMessage('System', 'Connected to chat');
      });

      socket.on('receive_message', (message) => {
        addMessage(message.sender.fullName, message.messageContent);
      });

      socket.on('user_typing', (data) => {
        console.log('User typing:', data);
      });
    }

    function disconnect() {
      if (socket) socket.disconnect();
    }

    function sendMessage() {
      const receiverId = document.getElementById('receiverId').value;
      const messageContent = document.getElementById('message').value;

      socket.emit('send_message', {
        receiverId,
        messageContent
      });

      document.getElementById('message').value = '';
    }

    function addMessage(sender, text) {
      const div = document.createElement('div');
      div.innerHTML = `<strong>${sender}:</strong> ${text}`;
      document.getElementById('messages').appendChild(div);
    }
  </script>
</body>
</html>
```

Save as `chat-test.html` and open in browser.

---

## Common Issues and Solutions

### Issue 1: WebSocket connection fails
**Solution:**
- Check JWT token is valid
- Verify token is passed in query: `?token=xxx`
- Check CORS settings in `main.ts`
- Ensure server is running

### Issue 2: Messages not delivered in real-time
**Solution:**
- Check both users are connected (online)
- Verify receiverId is correct
- Check server logs for errors
- Test with REST API first to ensure database works

### Issue 3: "Cannot send message to yourself"
**Solution:**
- Verify receiverId is different from senderId
- Check user IDs are correct

### Issue 4: Read receipts not working
**Solution:**
- Ensure sender is online to receive the event
- Check message belongs to the receiver
- Verify mark_as_read event is emitted correctly

### Issue 5: Typing indicator not showing
**Solution:**
- Check receiver is online
- Verify receiverId is correct
- Ensure isTyping boolean is set correctly

---

## Database Verification

Check messages in database:

```sql
-- View all messages
SELECT
  cm.id,
  s.full_name as sender_name,
  r.full_name as receiver_name,
  cm.message_content,
  cm.is_read,
  cm.sent_at,
  cm.read_at
FROM chat_messages cm
JOIN users s ON cm.sender_id = s.id
JOIN users r ON cm.receiver_id = r.id
ORDER BY cm.sent_at DESC;

-- Count unread messages per user
SELECT
  receiver_id,
  u.full_name,
  COUNT(*) as unread_count
FROM chat_messages cm
JOIN users u ON cm.receiver_id = u.id
WHERE cm.is_read = false
GROUP BY receiver_id, u.full_name;

-- Messages between two specific users
SELECT
  CASE WHEN sender_id = '<user-a-id>' THEN 'Me' ELSE 'Other' END as from,
  message_content,
  sent_at,
  is_read
FROM chat_messages
WHERE (sender_id = '<user-a-id>' AND receiver_id = '<user-b-id>')
   OR (sender_id = '<user-b-id>' AND receiver_id = '<user-a-id>')
ORDER BY sent_at ASC;
```

---

## Performance Considerations

### Pagination:
- Default: 50 messages per page
- Max: 100 messages per page
- Load more with `page` parameter

### Connection Limits:
- Rate limiting: 100 requests per minute (ThrottlerModule)
- WebSocket connections: Limited by Node.js event loop

### Scaling:
For production with multiple servers:
- Use Redis adapter for Socket.io
- Store online users in Redis instead of in-memory Map
- Use message queue for offline message delivery

---

## Next Steps

After Phase 8 is tested:
- **Phase 9**: Implement Calendar Events (auto-create from schedules/assignments)
- **Phase 10**: Implement Email Notifications

---

## Summary

Phase 8 provides:
✅ Real-time 1-1 chat with WebSocket
✅ Message history with pagination (50/page)
✅ Typing indicators
✅ Online/offline status tracking
✅ Read receipts
✅ Conversation list with unread count
✅ Offline message support
✅ Message deletion (5-minute window)
✅ REST API fallback endpoints

**Total Endpoints:** 7 REST + 6 WebSocket events

**WebSocket Events:**
- `send_message` - Send a message
- `mark_as_read` - Mark message as read
- `typing` - Typing indicator
- `get_online_users` - Get list of online users
- `is_user_online` - Check if user is online
- `receive_message` - Receive new message
- `message_read` - Message was read notification
- `user_online` - User came online
- `user_offline` - User went offline
- `user_typing` - User is typing
