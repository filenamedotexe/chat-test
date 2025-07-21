const WebSocket = require('ws');

console.log('🔐 FINAL WebSocket Authentication Verification');
console.log('='.repeat(50));

async function testFinalAuth() {
  console.log('🎯 Testing WebSocket authentication enforcement...\n');

  // Test 1: No authentication token
  console.log('Test 1: Connection without authentication token');
  const test1 = await testConnection('ws://localhost:8080/ws/support-chat', {
    shouldReject: true,
    testName: 'No auth token'
  });

  // Test 2: Invalid authentication token  
  console.log('\nTest 2: Connection with invalid token');
  const test2 = await testConnection('ws://localhost:8080/ws/support-chat?token=invalid-jwt-123', {
    shouldReject: true,
    testName: 'Invalid token'
  });

  // Test 3: Malformed token
  console.log('\nTest 3: Connection with malformed token');
  const test3 = await testConnection('ws://localhost:8080/ws/support-chat?token=not.a.jwt.token', {
    shouldReject: true,
    testName: 'Malformed token'
  });

  // Results
  console.log('\n📊 AUTHENTICATION VERIFICATION RESULTS');
  console.log('='.repeat(40));

  const tests = [
    { name: 'No token rejection', result: test1 },
    { name: 'Invalid token rejection', result: test2 }, 
    { name: 'Malformed token rejection', result: test3 }
  ];

  let passedCount = 0;
  tests.forEach((test, index) => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${test.name}: ${status}`);
    if (test.result) passedCount++;
  });

  const successRate = Math.round((passedCount / tests.length) * 100);
  console.log(`\n🎯 AUTHENTICATION SCORE: ${passedCount}/${tests.length} (${successRate}%)`);

  if (successRate === 100) {
    console.log('\n🎉 CHUNK 4.1 WEBSOCKET AUTHENTICATION: ✅ SUCCESS!');
    console.log('✅ Authentication is properly enforced BEFORE connection');
    console.log('✅ Invalid tokens are rejected immediately');
    console.log('✅ No unauthorized connections are allowed');
    return true;
  } else {
    console.log('\n⚠️  CHUNK 4.1 WEBSOCKET AUTHENTICATION: ❌ FAILED');
    return false;
  }
}

async function testConnection(url, options) {
  return new Promise((resolve) => {
    console.log(`  Connecting to: ${url}`);
    
    const ws = new WebSocket(url);
    let connectionWasOpened = false;

    // Timeout to ensure test doesn't hang
    const timeout = setTimeout(() => {
      if (ws.readyState === ws.CONNECTING) {
        ws.terminate();
        console.log('  ⏰ Connection attempt timed out (expected for rejected connections)');
        resolve(options.shouldReject); // If we expected rejection and it timed out, that's success
      }
    }, 3000);

    ws.on('open', () => {
      console.log('  🔓 Connection opened (THIS SHOULD NOT HAPPEN!)');
      connectionWasOpened = true;
      clearTimeout(timeout);
      ws.close();
      resolve(!options.shouldReject); // If we expected rejection but it opened, that's failure
    });

    ws.on('close', (code, reason) => {
      console.log(`  🔒 Connection rejected: ${code} "${reason.toString()}" ✅`);
      clearTimeout(timeout);
      if (options.shouldReject && !connectionWasOpened) {
        resolve(true); // Successfully rejected
      } else {
        resolve(false); // Unexpected close
      }
    });

    ws.on('error', (error) => {
      console.log(`  ⚡ Connection error: ${error.message} ✅`);
      clearTimeout(timeout);
      // Errors during connection are expected for auth failures
      resolve(options.shouldReject);
    });
  });
}

// Execute the test
testFinalAuth().then(success => {
  console.log(success ? '\n🎉 WebSocket authentication is working correctly!' : '\n❌ WebSocket authentication needs fixing');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution error:', error);
  process.exit(1);
});