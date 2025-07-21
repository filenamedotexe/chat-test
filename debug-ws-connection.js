const WebSocket = require('ws');

console.log('🐛 DEBUGGING WebSocket Connection Behavior');
console.log('='.repeat(50));

async function debugConnection() {
  console.log('Testing connection without auth...');
  
  const ws = new WebSocket('ws://localhost:8080/ws/support-chat');
  
  ws.on('open', () => {
    console.log('❌ CONNECTION OPENED WITHOUT AUTH - THIS IS THE PROBLEM!');
    console.log('Server is NOT enforcing authentication properly');
    
    // Try to send a message
    ws.send(JSON.stringify({
      type: 'join_conversation',
      conversationId: 1
    }));
  });

  ws.on('message', (data) => {
    console.log('📨 Received message:', data.toString());
  });

  ws.on('close', (code, reason) => {
    console.log(`🔒 Connection closed: ${code} "${reason.toString()}"`);
  });

  ws.on('error', (error) => {
    console.log('⚡ Connection error:', error.message);
  });

  // Keep connection open for testing
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 3000);
}

debugConnection();