#!/usr/bin/env node

async function testStreamResponse() {
  console.log('🔍 Testing Chat Stream Response\n');
  
  try {
    // First get a session
    const loginRes = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
        redirect: false,
        json: true,
      }),
    });
    
    const cookies = loginRes.headers.get('set-cookie') || '';
    console.log('Auth cookies received:', cookies ? '✅' : '❌');
    
    // Test the chat endpoint
    console.log('\nTesting /api/chat-langchain...');
    const response = await fetch('http://localhost:3000/api/chat-langchain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello, test message!' }],
        memoryType: 'buffer',
        sessionId: 'test-' + Date.now(),
        userId: '1',
      }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      // Check if it's a stream
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (response.body) {
        console.log('\n📥 Reading stream...');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          process.stdout.write(chunk); // Print chunks as they arrive
          fullResponse += chunk;
        }
        
        console.log('\n\n✅ Full response:', fullResponse);
        console.log('Response length:', fullResponse.length);
      } else {
        // Not a stream, read as text
        const text = await response.text();
        console.log('Response text:', text);
      }
    } else {
      const error = await response.text();
      console.log('❌ Error response:', error);
    }
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

testStreamResponse();