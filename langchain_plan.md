# LangChain Migration Plan

## Instructions for Claude (Self-Reference)

**CRITICAL: Read this section before every action during implementation**

1. **Work in small, testable chunks** - Complete one step fully before moving to next
2. **Always test after each change** - Run `npm run dev` and verify functionality
3. **Never assume** - Check file contents, test imports, verify API responses
4. **Update this document** - Add ✅ when complete, ❌ if blocked, add brief notes
5. **Refer back after EVERY chunk** - Re-read current step and next steps
6. **Check dependencies** - Verify package versions and compatibility
7. **Preserve existing functionality** - Streaming must continue working
8. **Test database operations** - Verify saves/loads work correctly
9. **Keep UI responsive** - Maintain current animations and UX

## Current State Analysis

- **Framework**: Next.js 14.2.13 with App Router
- **AI**: Vercel AI SDK with OpenAI (GPT-4-turbo)
- **Database**: Neon PostgreSQL (serverless)
- **Key Feature**: Streaming responses with animated text
- **UI**: Framer Motion animations, chat bubble interface

## Migration Steps

### Phase 1: Setup & Dependencies
- [ ] **Step 1.1**: Install LangChain packages
  ```bash
  npm install langchain @langchain/openai @langchain/community
  ```
  Notes: _____

- [ ] **Step 1.2**: Create lib/langchain/config.ts for LangChain setup
  - Initialize OpenAI with streaming enabled
  - Configure model parameters
  Notes: _____

- [ ] **Step 1.3**: Test basic LangChain connection
  - Create test route at app/api/test-langchain/route.ts
  - Verify OpenAI key works with LangChain
  Notes: _____

### Phase 2: Memory Implementation
- [ ] **Step 2.1**: Create custom Neon memory class (lib/langchain/neon-memory.ts)
  - Extend BaseListChatMessageHistory
  - Implement getMessages(), addMessage(), clear()
  - Use existing Neon connection
  Notes: _____

- [ ] **Step 2.2**: Update database schema if needed
  - Add session_id column
  - Add metadata jsonb column
  - Create migration script
  Notes: _____

- [ ] **Step 2.3**: Test memory persistence
  - Save messages to Neon
  - Load conversation history
  - Verify data integrity
  Notes: _____

### Phase 3: Streaming Implementation
- [ ] **Step 3.1**: Create streaming handler (lib/langchain/streaming.ts)
  - Implement TransformStream for token streaming
  - Create custom callback handler
  - Match current UI streaming behavior
  Notes: _____

- [ ] **Step 3.2**: Build LangChain conversation chain
  - Use ConversationChain with BufferMemory
  - Connect Neon memory store
  - Enable streaming callbacks
  Notes: _____

### Phase 4: API Route Migration
- [ ] **Step 4.1**: Create new API route (app/api/chat-langchain/route.ts)
  - Keep original route for rollback
  - Implement POST handler with LangChain
  - Match current response format
  Notes: _____

- [ ] **Step 4.2**: Test streaming response
  - Verify tokens stream correctly
  - Check response format matches UI expectations
  - Test error handling
  Notes: _____

### Phase 5: Frontend Integration
- [ ] **Step 5.1**: Update chat configuration
  - Point to new API endpoint
  - Verify useChat hook compatibility
  - Test all UI interactions
  Notes: _____

- [ ] **Step 5.2**: Add session management
  - Generate/store session IDs
  - Load previous conversations
  - Add "Continue conversation" feature
  Notes: _____

### Phase 6: Enhanced Features
- [ ] **Step 6.1**: Add conversation summarization
  - Implement ConversationSummaryMemory option
  - Add UI toggle for memory type
  - Test token usage optimization
  Notes: _____

- [ ] **Step 6.2**: Add system prompt customization
  - Create prompt templates
  - Allow runtime prompt switching
  - Test different personalities
  Notes: _____

### Phase 7: Testing & Optimization
- [ ] **Step 7.1**: Performance testing
  - Measure response times
  - Check memory usage
  - Optimize database queries
  Notes: _____

- [ ] **Step 7.2**: Error handling
  - Test API failures
  - Handle streaming errors
  - Add retry logic
  Notes: _____

- [ ] **Step 7.3**: Final integration test
  - Full conversation flow
  - Memory persistence
  - UI responsiveness
  Notes: _____

### Phase 8: Cleanup & Documentation
- [ ] **Step 8.1**: Remove old API route
  - Delete app/api/chat/route.ts
  - Update imports
  Notes: _____

- [ ] **Step 8.2**: Update README
  - Document LangChain features
  - Add setup instructions
  - Include examples
  Notes: _____

## Rollback Plan

If issues arise:
1. Revert to original app/api/chat/route.ts
2. Point frontend back to /api/chat
3. Keep LangChain code for debugging
4. Document specific failure points

## Success Criteria

- ✅ Streaming works identically to current implementation
- ✅ All current UI features functional
- ✅ Conversation history persists in Neon
- ✅ Can load and continue previous conversations
- ✅ Performance equal or better than current
- ✅ No breaking changes to user experience

## Progress Notes

_Add notes here as implementation progresses_

---

**REMINDER**: After completing each checkbox, test thoroughly and update notes before proceeding!