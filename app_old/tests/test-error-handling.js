const ENDPOINT = 'http://localhost:3000/api/chat-langchain';

async function testErrorScenario(name, payload, expectedError) {
  console.log(`\n🧪 Testing: ${name}`);
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`✅ Error caught (${response.status}):`, data.error);
      if (expectedError && data.error?.code !== expectedError) {
        console.log(`⚠️  Expected error code: ${expectedError}, got: ${data.error?.code}`);
      }
    } else {
      console.log(`❌ Expected error but request succeeded`);
    }
    
    return { status: response.status, data };
  } catch (error) {
    console.log(`❌ Network/parsing error:`, error.message);
    return { error: error.message };
  }
}

async function runErrorTests() {
  console.log('🚀 Starting Error Handling Tests\n');
  
  // Test 1: Missing messages
  await testErrorScenario(
    'Missing messages array',
    { memoryType: 'buffer' },
    'INVALID_INPUT'
  );
  
  // Test 2: Empty messages array
  await testErrorScenario(
    'Empty messages array',
    { messages: [] },
    'INVALID_INPUT'
  );
  
  // Test 3: No user message
  await testErrorScenario(
    'No user message (only system)',
    { 
      messages: [
        { role: 'system', content: 'You are helpful' }
      ] 
    },
    'INVALID_INPUT'
  );
  
  // Test 4: Invalid message format
  await testErrorScenario(
    'Invalid message format',
    { 
      messages: [
        { content: 'Hello' } // missing role
      ] 
    },
    'INVALID_INPUT'
  );
  
  // Test 5: Invalid memory type
  await testErrorScenario(
    'Invalid memory type',
    { 
      messages: [{ role: 'user', content: 'Hello' }],
      memoryType: 'invalid-type'
    }
  );
  
  // Test 6: Invalid prompt template
  await testErrorScenario(
    'Invalid prompt template ID',
    { 
      messages: [{ role: 'user', content: 'Hello' }],
      promptTemplateId: 'non-existent-template'
    }
  );
  
  // Test 7: Simulate rate limit (if we had a way to trigger it)
  console.log('\n📝 Rate limit handling would be tested with actual API limits');
  
  // Test 8: Test retry mechanism
  console.log('\n🔄 Testing retry mechanism...');
  const start = Date.now();
  await testErrorScenario(
    'Transient error simulation',
    { 
      messages: [{ role: 'user', content: 'Test retry mechanism' }],
      // This would need a special flag to simulate transient errors
    }
  );
  const duration = Date.now() - start;
  console.log(`   Request duration: ${duration}ms (retries would add delay)`);
  
  // Test 9: Database error simulation
  console.log('\n💾 Database error handling would require DB connection issues');
  
  // Test valid request to ensure error handling doesn't break normal flow
  console.log('\n✅ Testing valid request...');
  const validResponse = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Hello, this is a valid test' }],
      memoryType: 'buffer',
      promptTemplateId: 'default'
    })
  });
  
  if (validResponse.ok) {
    console.log('✅ Valid request succeeded');
  } else {
    console.log('❌ Valid request failed:', await validResponse.text());
  }
}

// Run the tests
runErrorTests().catch(console.error);