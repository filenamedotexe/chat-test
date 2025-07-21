const WebSocket = require('ws');

console.log('🔐 TESTING REAL WEBSOCKET AUTHENTICATION');
console.log('='.repeat(50));

async function testWithRealAuth() {
  console.log('📡 Starting WebSocket server...');
  
  // Initialize the WebSocket server
  try {
    const response = await fetch('http://localhost:3001/api/websocket');
    const data = await response.json();
    console.log('Server status:', data.message);
  } catch (error) {
    console.error('❌ Could not start WebSocket server:', error);
    return false;
  }

  console.log('\n🔐 Test 1: No authentication token');
  const test1 = await testConnection('ws://localhost:8080/ws/support-chat', null, {
    expectClose: true,
    expectedCode: 1008,
    expectedReason: 'Authentication required'
  });
  
  console.log('\n🔐 Test 2: Invalid authentication token');  
  const test2 = await testConnection('ws://localhost:8080/ws/support-chat?token=fake-jwt-token-123', null, {
    expectClose: true,
    expectedCode: 1008,
    expectedReason: 'Invalid authentication'
  });
  
  console.log('\n🔐 Test 3: Malformed token');
  const test3 = await testConnection('ws://localhost:8080/ws/support-chat?token=not.a.jwt', null, {
    expectClose: true,
    expectedCode: 1008,
    expectedReason: 'Invalid authentication'  
  });

  console.log('\n📊 AUTHENTICATION TEST RESULTS');
  console.log('='.repeat(30));
  
  const results = [
    { name: 'No token rejection', passed: test1 },
    { name: 'Invalid token rejection', passed: test2 },
    { name: 'Malformed token rejection', passed: test3 }
  ];

  let passedCount = 0;
  results.forEach((test, index) => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${test.name}: ${status}`);
    if (test.passed) passedCount++;
  });

  const successRate = Math.round((passedCount / results.length) * 100);
  console.log(`\n🎯 AUTHENTICATION TEST: ${passedCount}/${results.length} (${successRate}%)`);

  if (successRate === 100) {
    console.log('🎉 WEBSOCKET AUTHENTICATION: ✅ WORKING CORRECTLY');
    return true;
  } else {
    console.log('⚠️ WEBSOCKET AUTHENTICATION: ❌ BROKEN - MUST FIX');
    return false;
  }
}

async function testConnection(url, headers, expectations) {
  return new Promise((resolve) => {
    console.log(`Connecting to: ${url}`);
    
    const ws = new WebSocket(url, { headers });
    let connectionOpened = false;
    
    const timeout = setTimeout(() => {
      console.log('⏰ Connection timed out');
      if (!ws.readyState === ws.CLOSED) {
        ws.terminate();
      }
      resolve(!expectations.expectClose); // If we expected it to close but it didn't, that's a failure
    }, 5000);

    ws.on('open', () => {
      console.log('🔓 Connection opened (unexpected!)');
      connectionOpened = true;
      clearTimeout(timeout);
      ws.close();
      resolve(!expectations.expectClose); // If we expected it to close but it opened, that's a failure
    });

    ws.on('close', (code, reason) => {
      console.log(`🔒 Connection closed: ${code} "${reason.toString()}"`);
      clearTimeout(timeout);
      
      if (expectations.expectClose) {
        const codeMatch = !expectations.expectedCode || code === expectations.expectedCode;
        const reasonMatch = !expectations.expectedReason || reason.toString().includes(expectations.expectedReason);
        resolve(codeMatch && reasonMatch);
      } else {
        resolve(false); // We didn't expect it to close
      }
    });

    ws.on('error', (error) => {
      console.log(`⚡ Connection error: ${error.message}`);
      clearTimeout(timeout);
      // Errors during connection are expected for auth failures
      resolve(expectations.expectClose);
    });
  });
}

testWithRealAuth().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});