const ENDPOINT = 'http://localhost:3000/api/chat-langchain';
const MEMORY_ENDPOINT = 'http://localhost:3000/api/memory';

async function streamToString(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  
  return result;
}

async function testConversation(sessionId, memoryType, promptTemplateId, messages) {
  console.log(`\n📝 Testing ${promptTemplateId} with ${memoryType} memory`);
  console.log(`   Session: ${sessionId}`);
  
  const results = [];
  
  for (let i = 0; i < messages.length; i++) {
    console.log(`\n   Message ${i + 1}: "${messages[i]}"`);
    
    const startTime = Date.now();
    
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: messages[i] }],
        memoryType,
        sessionId,
        promptTemplateId
      })
    });
    
    if (!response.ok) {
      console.log(`   ❌ Error: ${response.status}`);
      const error = await response.json();
      console.log(`      ${error.error?.message || 'Unknown error'}`);
      results.push({ error: true });
      continue;
    }
    
    const content = await streamToString(response);
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Response received (${duration}ms)`);
    console.log(`      Preview: ${content.substring(0, 100)}...`);
    
    results.push({ 
      success: true, 
      duration, 
      length: content.length 
    });
    
    // Small delay between messages
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

async function testMemoryRetrieval(sessionId) {
  console.log(`\n🧠 Testing memory retrieval for session: ${sessionId}`);
  
  const response = await fetch(`${MEMORY_ENDPOINT}?sessionId=${sessionId}&action=history`);
  
  if (!response.ok) {
    console.log(`   ❌ Failed to retrieve history: ${response.status}`);
    return null;
  }
  
  const data = await response.json();
  console.log(`   ✅ Retrieved ${data.messages?.length || 0} messages`);
  
  return data.messages;
}

async function runIntegrationTests() {
  console.log('🚀 Starting LangChain Integration Tests');
  console.log('=====================================\n');
  
  const timestamp = Date.now();
  
  // Test 1: Buffer Memory with Default Assistant
  const session1 = `integration-buffer-default-${timestamp}`;
  await testConversation(
    session1,
    'buffer',
    'default',
    [
      'Hi, my name is Integration Test User and I work at Test Corp',
      'What is my name?',
      'Where do I work?'
    ]
  );
  
  // Verify memory persistence
  await testMemoryRetrieval(session1);
  
  // Test 2: Summary Memory with Technical Expert
  const session2 = `integration-summary-tech-${timestamp}`;
  await testConversation(
    session2,
    'summary',
    'technical',
    [
      'Explain the concept of dependency injection',
      'Give me a practical example in TypeScript',
      'What did I ask you about first?'
    ]
  );
  
  // Test 3: Personality Switching Mid-Conversation
  const session3 = `integration-personality-switch-${timestamp}`;
  console.log('\n🎭 Testing personality switching in same session');
  
  await testConversation(session3, 'buffer', 'creative', ['Write a poem about coding']);
  await testConversation(session3, 'buffer', 'concise', ['Summarize our conversation']);
  await testConversation(session3, 'buffer', 'teacher', ['Explain what we discussed']);
  
  // Test 4: Error Recovery
  console.log('\n🔧 Testing error recovery');
  const session4 = `integration-error-recovery-${timestamp}`;
  
  // First, cause an error with invalid input
  await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [], // Invalid: empty array
      sessionId: session4
    })
  });
  
  // Then verify normal operation continues
  await testConversation(session4, 'buffer', 'default', ['Hello after error']);
  
  // Test 5: Concurrent Requests
  console.log('\n⚡ Testing concurrent requests');
  const concurrentPromises = [
    testConversation(`concurrent-1-${timestamp}`, 'buffer', 'default', ['Test 1']),
    testConversation(`concurrent-2-${timestamp}`, 'buffer', 'default', ['Test 2']),
    testConversation(`concurrent-3-${timestamp}`, 'summary', 'technical', ['Test 3'])
  ];
  
  await Promise.all(concurrentPromises);
  
  // Test 6: Long Conversation Memory
  console.log('\n📚 Testing long conversation memory');
  const session5 = `integration-long-conv-${timestamp}`;
  const longMessages = [
    'My name is Memory Test User',
    'I am 25 years old',
    'I live in San Francisco',
    'I work as a software engineer',
    'My favorite programming language is TypeScript',
    'Tell me everything you remember about me'
  ];
  
  const longResults = await testConversation(session5, 'buffer', 'default', longMessages);
  
  // Summary
  console.log('\n📊 Integration Test Summary');
  console.log('===========================');
  
  const allResults = [
    ...longResults
  ];
  
  const successful = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => r.error).length;
  const avgDuration = allResults
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / successful || 0;
  
  console.log(`✅ Successful requests: ${successful}`);
  console.log(`❌ Failed requests: ${failed}`);
  console.log(`⏱️  Average response time: ${avgDuration.toFixed(0)}ms`);
  console.log(`\n✨ Integration tests completed!`);
}

// Run the tests
runIntegrationTests().catch(console.error);