# Support Chat Implementation Plan
**Feature Name**: `support_chat`  
**Date**: July 2025  
**Goal**: Implement user-to-admin messaging system with AI handoff capabilities

---

## 🚨 CRITICAL EXECUTION INSTRUCTIONS

### MANDATORY RULES - READ BEFORE EVERY CHUNK:
1. **NEVER MOVE TO NEXT CHUNK** until current chunk has ✅ green checkmark
2. **ALWAYS RE-READ THIS DOCUMENT** after completing each chunk
3. **TEST EVERYTHING** with Playwright (user role, admin role, edge cases)
4. **DOUBLE-CHECK FOR ERRORS** - TypeScript compilation, runtime errors, console errors
5. **LEAVE BRIEF NOTES** after each chunk in the "Chunk Notes" section
6. **ZERO ASSUMPTIONS** - If something looks "probably fine", test it explicitly
7. **BREAK THE APP = START OVER** - If any existing functionality breaks, rollback and fix
8. **UPDATE TODO LIST** using TodoWrite tool for each chunk

### TESTING REQUIREMENTS PER CHUNK:
- TypeScript compilation: `npx tsc --noEmit --skipLibCheck`
- Server starts: `npm run dev` with no errors
- Playwright test with both roles (user/admin)
- Manual testing of new functionality
- Regression testing of existing features

### ROLLBACK PROCEDURE:
```bash
# If anything breaks
git stash
git checkout main
npm run dev  # Verify working state
git checkout support-chat-implementation
git reset --hard HEAD~1  # Go back one commit
```

---

## 📋 IMPLEMENTATION PHASES

### Phase 0: Setup and Preparation ⏱️ (30 mins)
**Goal**: Create branch, document current state, setup testing baseline

#### Chunk 0.1: Environment Preparation
**Tasks**:
1. Create feature branch: `support-chat-implementation`
2. Run full Playwright test suite to establish baseline
3. Document current working state
4. Create rollback point

**Verification**:
- [ ] New branch created and pushed
- [ ] All existing tests pass (screenshot results)
- [ ] `npm run dev` starts without errors
- [ ] Both user and admin login work correctly

**Files to create/modify**: None yet
**Dependencies**: None

---

### Phase 1: Database Schema Implementation ⏱️ (45 mins)
**Goal**: Add tables for conversations and messages

#### Chunk 1.1: Database Migration Script
**Tasks**:
1. Create migration script: `migrations/003_support_chat.sql`
2. Design tables:
   - `conversations` (id, user_id, admin_id, status, type, created_at, updated_at, context_json)
   - `support_messages` (id, conversation_id, sender_id, sender_type, content, message_type, created_at, read_at, metadata_json)
   - `conversation_participants` (conversation_id, user_id, role, joined_at, last_read_at)
3. Add indexes for performance
4. Include foreign key constraints

**Critical Schema Details**:
```sql
-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'transferred'
    type VARCHAR(50) DEFAULT 'support', -- 'support', 'ai_handoff'
    subject VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    context_json JSONB, -- For AI handoff data
    transferred_from_conversation_id INTEGER REFERENCES conversations(id)
);

-- Support messages table  
CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user', 'admin', 'system'
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'system', 'handoff'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    metadata_json JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at DESC);
```

**Verification**:
- [ ] Migration script created at correct path
- [ ] All tables created successfully in dev database
- [ ] Foreign key constraints work correctly
- [ ] Indexes are created
- [ ] Can insert/query test data successfully
- [ ] No impact on existing functionality

**Test Script**: Create `test-support-chat-db.js` to verify all CRUD operations

---

#### Chunk 1.2: Database Query Functions
**Tasks**:
1. Create `/lib/database/queries/support-chat.ts`
2. Implement functions:
   - `createConversation(userId, subject, context?)`
   - `getConversationById(conversationId)`
   - `getUserConversations(userId, status?)`
   - `getAdminConversations(adminId?, status?)`
   - `addMessage(conversationId, senderId, content, senderType)`
   - `getConversationMessages(conversationId)`
   - `updateConversationStatus(conversationId, status)`
   - `assignConversationToAdmin(conversationId, adminId)`
   - `markMessagesAsRead(conversationId, userId)`

**Verification**:
- [ ] All functions implemented with proper TypeScript types
- [ ] Database connections work correctly
- [ ] Error handling for all edge cases
- [ ] Test all functions with sample data
- [ ] Performance test with larger datasets

**Dependencies**: Existing database connection, user queries for reference

---

### Phase 2: Feature Flag and API Setup ⏱️ (60 mins)
**Goal**: Add feature flag and core API endpoints

#### Chunk 2.1: Feature Flag Registration
**Tasks**:
1. Add `support_chat` feature to database:
   ```sql
   INSERT INTO feature_flags (feature_key, display_name, description, default_enabled) 
   VALUES ('support_chat', 'Support Chat', 'Direct messaging with administrators', false);
   ```
2. Update feature flag types in `/types/features.ts`
3. Test feature flag service with new feature
4. Update admin features UI to show new feature

**Verification**:
- [ ] Feature flag visible in admin panel
- [ ] Feature flag service returns correct status
- [ ] TypeScript types updated and compile cleanly
- [ ] Can enable/disable feature through admin UI
- [ ] Feature flag middleware works correctly

---

#### Chunk 2.2: Core API Endpoints - Conversations
**Tasks**:
1. Create `/features/support-chat/api/conversations/route.ts`
   - GET: List user's conversations (with pagination)
   - POST: Create new conversation
2. Create `/features/support-chat/api/conversations/[id]/route.ts`
   - GET: Get conversation with messages
   - PUT: Update conversation (status, assign admin)
   - DELETE: Close conversation (soft delete)
3. Create API forwarding routes in `/app/api/support-chat/`
4. Add middleware protection (authentication required)

**API Specifications**:
```typescript
// GET /api/support-chat/conversations
interface ConversationsResponse {
  conversations: {
    id: number;
    subject: string;
    status: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    admin?: { id: number; name: string; };
  }[];
  pagination: { page: number; total: number; hasMore: boolean; };
}

// POST /api/support-chat/conversations  
interface CreateConversationRequest {
  subject: string;
  initialMessage: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  context?: any; // For AI handoff data
}

// GET /api/support-chat/conversations/[id]
interface ConversationDetailsResponse {
  conversation: {
    id: number;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    admin?: { id: number; name: string; email: string; };
  };
  messages: {
    id: number;
    senderId: number;
    senderType: 'user' | 'admin' | 'system';
    senderName: string;
    content: string;
    messageType: string;
    createdAt: string;
    readAt?: string;
  }[];
}
```

**Verification**:
- [ ] All API endpoints respond correctly
- [ ] Authentication middleware works
- [ ] Feature flag protection works
- [ ] Proper error handling (401, 403, 404, 500)
- [ ] TypeScript types match API responses exactly
- [ ] Test with Postman/curl for all scenarios
- [ ] Admin can access all conversations, users only their own

---

#### Chunk 2.3: Core API Endpoints - Messages  
**Tasks**:
1. Create `/features/support-chat/api/messages/route.ts`
   - POST: Send new message in conversation
2. Create `/features/support-chat/api/messages/[id]/route.ts`  
   - PUT: Mark message as read
   - DELETE: Delete message (admin only)
3. Create admin-specific endpoints:
   - `/features/support-chat/api/admin/conversations/route.ts` (admin dashboard)
   - `/features/support-chat/api/admin/stats/route.ts` (conversation metrics)
4. Add rate limiting for message sending

**Verification**:
- [ ] Messages send successfully
- [ ] Read receipts work correctly
- [ ] Admin endpoints require admin role
- [ ] Rate limiting prevents spam
- [ ] Message history loads correctly
- [ ] Real-time updates work (test manually for now)

---

### Phase 3: Basic UI Implementation ⏱️ (90 mins)
**Goal**: Create user and admin interfaces

#### Chunk 3.1: Feature Directory Structure
**Tasks**:
1. Create `/features/support-chat/` directory structure:
   ```
   /features/support-chat/
   ├── config.ts
   ├── pages/
   │   ├── user/
   │   │   ├── ConversationsPage.tsx
   │   │   └── ConversationPage.tsx
   │   └── admin/
   │       ├── SupportDashboard.tsx
   │       └── ConversationManagement.tsx
   ├── components/
   │   ├── ConversationList.tsx
   │   ├── MessageThread.tsx
   │   ├── MessageComposer.tsx
   │   └── ConversationHeader.tsx
   ├── hooks/
   │   ├── useConversations.ts
   │   ├── useMessages.ts
   │   └── useRealTimeUpdates.ts
   └── api/ (already created in Phase 2)
   ```
2. Create feature config file
3. Add to main feature registry

**Verification**:
- [ ] Directory structure matches exactly
- [ ] Feature config follows existing pattern
- [ ] No import errors or circular dependencies
- [ ] Feature appears in feature list

---

#### Chunk 3.2: User Interface - Conversations List
**Tasks**:
1. Create `ConversationsPage.tsx` - main page showing all user conversations
2. Create `ConversationList.tsx` - reusable component for displaying conversations
3. Create `useConversations.ts` - hook for fetching conversations
4. Add routing: `/support` → conversations list
5. Add dashboard card for support chat feature
6. Style with existing design system (dark theme, consistent with app)

**UI Requirements**:
- Show conversation subject, last message preview, timestamp
- Unread message indicators
- Filter by status (open/closed)
- "New Conversation" button
- Empty state when no conversations
- Loading states
- Error handling with user-friendly messages

**Verification**:
- [ ] Page loads without errors
- [ ] Conversations display correctly
- [ ] New conversation button works
- [ ] Responsive design (mobile/desktop)
- [ ] Dark theme consistent with app
- [ ] Loading and error states work
- [ ] Feature flag gates access correctly

---

#### Chunk 3.3: User Interface - Individual Conversation
**Tasks**:
1. Create `ConversationPage.tsx` - individual conversation view
2. Create `MessageThread.tsx` - message display component  
3. Create `MessageComposer.tsx` - message input component
4. Create `useMessages.ts` - hook for message management
5. Add routing: `/support/[conversationId]`
6. Implement message sending functionality

**UI Requirements**:
- Display all messages in chronological order
- Show sender names and timestamps
- Message composer at bottom
- Scroll to bottom on new messages
- "Typing..." indicators (placeholder for now)
- Message status indicators (sent, delivered, read)

**Verification**:
- [ ] Messages display correctly
- [ ] Can send new messages
- [ ] Message history loads properly
- [ ] Scroll behavior works correctly
- [ ] Input validation (max length, etc.)
- [ ] Error handling for failed sends
- [ ] Both user and admin can participate in conversation

---

#### Chunk 3.4: Admin Interface - Support Dashboard
**Tasks**:
1. Create `SupportDashboard.tsx` - admin overview of all conversations
2. Create admin routing: `/admin/support`
3. Add navigation item to admin menu
4. Implement conversation assignment to admins
5. Add conversation status management
6. Create stats/metrics display

**Admin UI Requirements**:
- List all conversations (open, assigned, closed)
- Conversation priority indicators  
- Quick assignment to admins
- Status change buttons (open → in progress → closed)
- Response time tracking
- Search/filter conversations
- Bulk actions (close multiple, assign multiple)

**Verification**:
- [ ] Admin can see all conversations
- [ ] Assignment functionality works
- [ ] Status changes persist correctly
- [ ] Metrics display accurately
- [ ] Search and filters work
- [ ] Admin menu integration works
- [ ] Only admins can access (role protection)

---

### Phase 4: Real-Time Features ⏱️ (120 mins)
**Goal**: Implement WebSocket for real-time messaging

#### Chunk 4.1: WebSocket Server Setup
**Tasks**:
1. Install dependencies: `npm install ws @types/ws`
2. Create WebSocket server: `/lib/websocket/server.ts`
3. Create connection manager: `/lib/websocket/connections.ts`
4. Add user authentication for WebSocket connections
5. Implement message broadcasting
6. Add connection cleanup on disconnect

**WebSocket Architecture**:
```typescript
// Connection events
interface WSMessage {
  type: 'message' | 'join_conversation' | 'leave_conversation' | 'typing' | 'read_receipt';
  conversationId?: number;
  data?: any;
}

// Server manages connections per conversation
class ConversationRoom {
  conversationId: number;
  connections: Set<AuthenticatedWebSocket>;
  
  broadcast(message: WSMessage, exclude?: AuthenticatedWebSocket): void;
  addConnection(ws: AuthenticatedWebSocket): void;
  removeConnection(ws: AuthenticatedWebSocket): void;
}
```

**Verification**:
- [ ] WebSocket server starts correctly
- [ ] Authentication works for WebSocket connections
- [ ] Can join/leave conversation rooms
- [ ] Message broadcasting works
- [ ] Connection cleanup prevents memory leaks
- [ ] Multiple users can connect to same conversation

---

#### Chunk 4.2: Client-Side WebSocket Integration
**Tasks**:
1. Create WebSocket client: `/lib/websocket/client.ts`
2. Create React hook: `useWebSocket.ts`
3. Update `useMessages.ts` to use WebSocket for real-time updates
4. Add connection status indicators
5. Implement reconnection logic
6. Add typing indicators

**Client Features**:
- Automatic connection on conversation page load
- Real-time message updates
- Typing indicators
- Connection status (connected/disconnected/reconnecting)
- Automatic reconnection on disconnect
- Message delivery confirmations

**Verification**:
- [ ] WebSocket connects automatically when entering conversation
- [ ] Messages appear in real-time for all participants
- [ ] Typing indicators work
- [ ] Connection status displays correctly
- [ ] Reconnection works after network interruption
- [ ] Performance is acceptable (no lag, memory leaks)

---

#### Chunk 4.3: Real-Time Notifications
**Tasks**:
1. Create notification system: `/components/notifications/`
2. Add browser notification permissions
3. Implement toast notifications for new messages
4. Add unread message counters
5. Create notification preferences for users
6. Add admin notification center

**Notification Features**:
- Browser notifications for new messages (when tab not active)
- Toast notifications within app
- Unread message badges
- Sound notifications (optional)
- Email notifications for urgent messages (future)

**Verification**:
- [ ] Browser notifications work correctly
- [ ] Toast notifications appear for new messages
- [ ] Unread counters update in real-time
- [ ] Notification preferences save correctly
- [ ] Admin gets notified of new conversations
- [ ] Notifications don't spam users

---

### Phase 5: AI Chat Integration ⏱️ (90 mins)
**Goal**: Enable handoff from AI chat to support chat

#### Chunk 5.1: AI Chat Handoff Detection
**Tasks**:
1. Update AI chat to detect support requests
2. Add "Talk to Human" button in AI chat
3. Create handoff context collection
4. Implement conversation transfer API
5. Update AI prompts to suggest human help when appropriate

**Handoff Triggers**:
- User explicitly asks for human help
- AI detects frustrated sentiment
- User asks about billing/account issues
- Technical problems AI can't solve
- Keywords: "speak to human", "customer service", "help", "support"

**Context Collection**:
```typescript
interface HandoffContext {
  aiChatHistory: ChatMessage[];
  userIntent: string;
  urgency: 'low' | 'normal' | 'high';
  category: 'technical' | 'billing' | 'feature' | 'bug' | 'other';
  summary: string;
}
```

**Verification**:
- [ ] AI chat detects support requests correctly
- [ ] Handoff button appears at appropriate times
- [ ] Context collection captures relevant information
- [ ] Transfer creates support conversation with context
- [ ] User is redirected to support chat
- [ ] AI chat history is preserved in support context

---

#### Chunk 5.2: Support Chat Context Display
**Tasks**:
1. Update conversation display to show AI handoff context
2. Add context summary at top of support conversation
3. Create expandable AI chat history viewer
4. Add handoff message in conversation thread
5. Style handoff context distinctly

**Context Display**:
- Clear visual indicator that conversation came from AI
- Summary of user's issue
- Expandable full AI chat history
- Admin can see why conversation was created
- Smooth transition for user experience

**Verification**:
- [ ] Handoff context displays correctly in support chat
- [ ] AI chat history is accessible and readable
- [ ] Visual indicators are clear and helpful
- [ ] Admin understands the context immediately
- [ ] User experience feels seamless
- [ ] Context helps admin provide better support

---

### Phase 6: Dashboard Integration ⏱️ (45 mins)
**Goal**: Add support chat cards to dashboard

#### Chunk 6.1: User Dashboard Card
**Tasks**:
1. Create `SupportChatCard.tsx` for user dashboard
2. Show unread message count
3. Add quick access to active conversations
4. Display "New Message" indicator
5. Add to dashboard card grid
6. Feature flag protection

**Card Features**:
- Unread message count badge
- "Contact Support" quick action
- List of recent/active conversations
- Status indicators (response pending, admin online, etc.)

**Verification**:
- [ ] Card appears on user dashboard when feature enabled
- [ ] Unread counts display correctly
- [ ] Quick actions work properly
- [ ] Card design matches existing dashboard cards
- [ ] Feature flag protection works
- [ ] Card updates in real-time

---

#### Chunk 6.2: Admin Dashboard Integration
**Tasks**:
1. Create admin support chat card for admin dashboard
2. Show conversation queue metrics
3. Add quick stats (open, pending, urgent)
4. Display admin assignment status
5. Quick access to support dashboard

**Admin Card Features**:
- Total conversations by status
- Unassigned conversation count
- Average response time
- Urgent conversation alerts
- Quick link to support dashboard

**Verification**:
- [ ] Admin card shows correct metrics
- [ ] Stats update in real-time
- [ ] Quick links navigate correctly
- [ ] Urgent conversation alerts work
- [ ] Card integrates well with admin dashboard
- [ ] Only visible to admin users

---

### Phase 7: Advanced Features ⏱️ (90 mins)
**Goal**: Add conversation management, file uploads, search

#### Chunk 7.1: File Upload Support
**Tasks**:
1. Add file upload API: `/api/support-chat/upload`
2. Integrate with message system
3. Add file preview and download
4. Implement file type restrictions
5. Add file storage (local/cloud)
6. Update message types for file attachments

**File Upload Features**:
- Support images, documents, logs
- File size limits (10MB max)
- Virus scanning (basic)
- Preview for images
- Download links for files
- File metadata storage

**Verification**:
- [ ] File uploads work correctly
- [ ] File previews display properly
- [ ] Download links work
- [ ] File size limits enforced
- [ ] Security restrictions work (file types, sizes)
- [ ] Files persist correctly

---

#### Chunk 7.2: Conversation Search and Management
**Tasks**:
1. Add full-text search API for conversations
2. Implement conversation tagging system
3. Add conversation archiving
4. Create conversation templates for common issues
5. Add conversation export functionality
6. Implement conversation merging for duplicates

**Search and Management Features**:
- Search messages and conversation subjects
- Tag conversations by topic/category
- Archive old conversations
- Template responses for common questions
- Export conversation history
- Merge duplicate conversations

**Verification**:
- [ ] Search returns relevant results quickly
- [ ] Tagging system works correctly
- [ ] Archive/restore functionality works
- [ ] Templates speed up admin responses
- [ ] Export generates correct format
- [ ] Conversation merging preserves history

---

### Phase 8: Testing and Polish ⏱️ (120 mins)
**Goal**: Comprehensive testing, bug fixes, performance optimization

#### Chunk 8.1: Comprehensive Playwright Test Suite
**Tasks**:
1. Create test suite: `e2e/support-chat.spec.ts`
2. Test user conversation creation and messaging
3. Test admin conversation management
4. Test AI handoff flow
5. Test real-time messaging
6. Test file upload functionality
7. Test error scenarios and edge cases

**Test Scenarios**:
- User creates conversation, sends messages, receives responses
- Admin views all conversations, assigns to self, responds
- AI chat handoff creates support conversation with context
- Real-time messaging works between user and admin
- File uploads and downloads work correctly
- Feature flag controls access appropriately
- Error handling works for network failures, invalid data
- Performance testing with multiple conversations/users

**Verification**:
- [ ] All user flows test successfully
- [ ] All admin flows test successfully  
- [ ] AI handoff flow tests successfully
- [ ] Real-time features test successfully
- [ ] File upload tests pass
- [ ] Error scenarios handled gracefully
- [ ] Performance tests show acceptable results

---

#### Chunk 8.2: Security and Performance Review
**Tasks**:
1. Security audit: SQL injection, XSS, CSRF protection
2. Performance optimization: database queries, WebSocket connections
3. Rate limiting implementation and testing
4. Memory leak detection and fixes
5. Load testing with multiple concurrent users
6. Code review for best practices

**Security Checklist**:
- [ ] All database queries use parameterized statements
- [ ] User input is properly sanitized and validated
- [ ] Authentication/authorization works correctly
- [ ] File uploads are secure (type checking, size limits)
- [ ] WebSocket connections are authenticated
- [ ] Rate limiting prevents abuse
- [ ] No sensitive data exposed in logs or errors

**Performance Checklist**:
- [ ] Database queries are optimized with proper indexes
- [ ] WebSocket connection management is efficient
- [ ] No memory leaks in long-running connections
- [ ] Response times are acceptable (< 200ms for API calls)
- [ ] File uploads don't block the UI
- [ ] Real-time updates don't cause performance degradation

---

#### Chunk 8.3: Final Integration and Documentation
**Tasks**:
1. Update main navigation to include support chat
2. Update user onboarding to mention support feature
3. Create admin documentation for support chat management
4. Add feature to settings page
5. Update CLAUDE.md with support chat information
6. Create user guide for support chat
7. Final end-to-end testing of complete feature

**Documentation Requirements**:
- User guide: How to create conversations, send messages, use features
- Admin guide: How to manage conversations, assign admins, use tools
- Technical documentation: API endpoints, WebSocket events, database schema
- Feature flag configuration and rollout strategy

**Verification**:
- [ ] Navigation integration works correctly
- [ ] User onboarding includes support chat
- [ ] Admin documentation is complete and accurate
- [ ] Settings integration works
- [ ] CLAUDE.md is updated with accurate information
- [ ] User guide is clear and helpful
- [ ] Complete feature works end-to-end without issues

---

## 🔧 CHUNK COMPLETION NOTES

**After each chunk, record brief notes here:**

### Chunk 0.1 Notes:
*[Leave space for notes after completion]*

### Chunk 1.1 Notes:
*[Leave space for notes after completion]*

### Chunk 1.2 Notes:
*[Leave space for notes after completion]*

*[Continue for all chunks...]*

---

## 📚 DEPENDENCIES AND RESOURCES

### NPM Packages Needed:
- `ws` and `@types/ws` - WebSocket server
- `multer` - File uploads (if not already installed)
- `sharp` - Image processing for previews (if needed)

### External Resources:
- WebSocket best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- Real-time chat patterns: https://socket.io/docs/v4/
- File upload security: https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload

### Database Performance:
- Ensure proper indexes on frequently queried columns
- Consider connection pooling for high-traffic scenarios
- Monitor query performance with EXPLAIN ANALYZE

---

## 🚨 EMERGENCY PROCEDURES

### If Build Breaks:
1. `git stash` immediately
2. `npm run dev` to verify main is working
3. Check error logs and identify root cause
4. Fix in isolation or rollback chunk

### If Tests Fail:
1. Don't proceed to next chunk
2. Investigate failing test thoroughly
3. Fix underlying issue, don't modify test to pass
4. Re-run full test suite before proceeding

### If Feature Flag Issues:
1. Disable feature flag immediately to prevent user impact
2. Test with feature disabled
3. Fix issue in development
4. Re-enable only after thorough testing

---

## 📈 SUCCESS METRICS

### Technical Metrics:
- All TypeScript compilation passes without errors
- All Playwright tests pass with > 95% reliability
- API response times < 200ms
- WebSocket connection establishment < 500ms
- Zero memory leaks in 24-hour stress test
- File upload/download success rate > 99%

### User Experience Metrics:
- Conversation creation success rate > 99%
- Message delivery success rate > 99.5%
- Real-time message latency < 100ms
- Feature flag toggling works in < 1 second
- No user-facing errors or broken functionality

### Integration Metrics:
- AI handoff success rate > 95%
- Dashboard cards load in < 2 seconds
- Admin tools respond in < 300ms
- Search results return in < 500ms
- All existing features continue working (regression testing)

---

*Document Complete - Ready for Implementation*
*Total Estimated Time: 12-15 hours over 2-3 days*
*Implementation should be done in order, with full testing after each chunk*