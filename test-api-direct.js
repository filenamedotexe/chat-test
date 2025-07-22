// Direct API test to see if our handoff detection is being called
async function testAPIDirectly() {
  console.log('🎯 Testing API directly to see if handoff detection is called...');
  
  const testData = {
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'I need human support this is urgent' }
    ],
    memoryType: 'buffer',
    sessionId: 'test-session-123',
    userId: 1
  };
  
  try {
    console.log('📤 Sending request to /api/chat-langchain...');
    
    const response = await fetch('http://localhost:3000/api/chat-langchain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will likely fail due to auth, but we should see the logs
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log('🔒 Expected: Request rejected due to authentication (this is normal)');
      console.log('🔍 Check server console logs to see if our API was called');
    } else {
      console.log('📝 Response text:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

// Run test
testAPIDirectly();