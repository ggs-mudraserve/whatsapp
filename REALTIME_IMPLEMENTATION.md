# Supabase Realtime Implementation - Task 2.5

This document explains the implementation of Supabase Realtime integration for receiving messages and updating the chat view in real-time (Tasks 2.5.1 and 2.5.2).

## Overview

The implementation provides real-time updates for:
- New incoming messages from customers, agents, chatbots, and system
- Conversation status changes 
- Conversation assignments and metadata updates
- Live chat list updates

## Architecture

### 1. Core Realtime Hook (`use-chat-realtime.ts`)

The main realtime functionality is encapsulated in two hooks:

#### `useChatRealtime(options)`
- **Purpose**: Global chat realtime subscriptions for messages and conversations
- **Subscriptions**:
  - `postgres_changes` on `messages` table (INSERT/UPDATE events)
  - `postgres_changes` on `conversations` table (all events)
- **Features**:
  - Automatic TanStack Query cache updates
  - Auth state handling and token refresh
  - Custom callbacks for message/conversation events
  - Connection status monitoring

#### `useConversationRealtime(conversationId)`
- **Purpose**: Conversation-specific realtime updates
- **Subscriptions**:
  - Filtered `postgres_changes` on `messages` table for specific conversation
- **Features**:
  - Dynamic subscription based on selected conversation
  - Automatic cleanup when conversation changes

### 2. Integration Patterns

#### Database Events Subscription
Following Context7 patterns for Supabase Realtime v2:

```typescript
const channel = supabase
  .channel('chat-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    },
    handleNewMessage
  )
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public', 
      table: 'conversations'
    },
    handleConversationUpdate
  )
  .subscribe()
```

#### Real-time Cache Updates
Optimistic updates to TanStack Query cache:

```typescript
// Update messages cache for new message
queryClient.setQueryData(
  chatQueryKeys.messagesList(message.conversation_id),
  (oldData: any) => {
    if (!oldData) return oldData
    
    // Add new message to the first page (most recent)
    const newPages = [...oldData.pages]
    if (newPages.length > 0) {
      newPages[0] = {
        ...newPages[0],
        data: [message, ...newPages[0].data]
      }
    }
    
    return { ...oldData, pages: newPages }
  }
)
```

#### Authentication Integration
Handles session changes and token refresh:

```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.access_token) {
    supabase.realtime.setAuth(session.access_token)
  } else if (event === 'SIGNED_OUT') {
    // Clean up channels
  }
})
```

## Component Integration

### 1. ConversationView Component

Updated to use realtime hooks:

```typescript
// Enable realtime updates for chat
useChatRealtime({
  enabled: true,
  onNewMessage: (message) => {
    console.log('New message received:', message)
  },
  onConversationUpdate: (updatedConversation) => {
    console.log('Conversation updated:', updatedConversation)
  }
})

// Enable conversation-specific realtime updates  
useConversationRealtime(conversation?.id || null)
```

### 2. ChatInterface Component

Complete chat interface with:
- Live conversation list with search
- Real-time message updates
- Connection status indicator
- Auto-conversation selection for new messages

```typescript
const { isConnected } = useChatRealtime({
  enabled: true,
  onNewMessage: (message) => {
    // Auto-select conversation if it's the first message to the user
    if (!selectedConversationId) {
      setSelectedConversation(message.conversation_id)
    }
  }
})
```

## Database Requirements

For the realtime implementation to work, the following database setup is required:

### 1. Publication Setup
```sql
-- Ensure messages table is in the realtime publication
ALTER publication supabase_realtime ADD TABLE messages;
ALTER publication supabase_realtime ADD TABLE conversations;
```

### 2. Row Level Security (RLS)
RLS policies must be properly configured to ensure users only receive updates for conversations they have access to based on their role and assignments.

### 3. Triggers and Notifications
The `public.insert_message` RPC should trigger `pg_notify` as mentioned in the PRD:
- Notifications are sent via `pg_notify` from the `public.insert_message` RPC
- This enables the realtime subscriptions to receive updates

## Usage Examples

### Basic Chat Interface
```typescript
import { ChatInterface } from '@/components/chat'

function MyPage() {
  return (
    <ChatInterface 
      templates={templates}
      className="h-full"
    />
  )
}
```

### Custom Realtime Integration
```typescript
import { useChatRealtime } from '@/components/chat'

function MyComponent() {
  const { isConnected } = useChatRealtime({
    enabled: true,
    onNewMessage: (message) => {
      // Custom handling for new messages
      showNotification(`New message from ${message.sender_type}`)
    },
    onConversationUpdate: (conversation) => {
      // Custom handling for conversation updates
      updateConversationInUI(conversation)
    }
  })

  return (
    <div>
      {!isConnected && <div>Reconnecting...</div>}
      {/* Your chat UI */}
    </div>
  )
}
```

## Performance Considerations

1. **Efficient Cache Updates**: Uses TanStack Query's optimistic updates to prevent unnecessary refetches
2. **Scoped Subscriptions**: Conversation-specific subscriptions reduce unnecessary updates
3. **Connection Management**: Automatic cleanup of channels when components unmount
4. **Auth State Sync**: Token refresh ensures realtime stays authenticated

## Error Handling

1. **Connection Issues**: UI indicates when realtime connection is lost
2. **Auth Failures**: Automatic token refresh on session changes
3. **Subscription Errors**: Graceful degradation with manual refresh options

## Testing the Implementation

1. **Dashboard Integration**: The updated dashboard page demonstrates the complete chat interface
2. **Real-time Verification**: Open multiple browser sessions to test live updates
3. **Connection Status**: Monitor the connection indicator during network changes
4. **Message Flow**: Test message sending/receiving across different user sessions

## Next Steps

With Tasks 2.5.1 and 2.5.2 complete, the next items are:
- Task 2.6: Frontend Chat List (Left Pane) - ✅ Already implemented in ChatInterface
- Task 3.4: Chat Interface Enhancements (buttons for chatbot/status control)

The realtime foundation is now in place and ready for the remaining chat features. 