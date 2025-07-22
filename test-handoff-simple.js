// Simple test to check handoff keywords
function testKeywordDetection() {
  console.log('🔍 Testing handoff keyword detection...');
  
  const HANDOFF_KEYWORDS = [
    'speak to human', 'talk to human', 'human support', 'customer service',
    'contact support', 'help desk', 'live agent', 'representative',
    'frustrated', 'angry', 'not working', 'broken', 'fix this',
    'billing', 'payment', 'charge', 'refund', 'cancel subscription',
    'bug', 'error', 'crash', 'not responding', 'urgent', 'emergency'
  ];
  
  const testMessages = [
    'I need to speak to human support immediately',
    'This is urgent, I cannot access my account', 
    'I am frustrated, this is not working',
    'There is a bug in the system',
    'I need help with billing issues'
  ];
  
  let passedTests = 0;
  
  testMessages.forEach((message, index) => {
    const lowerMessage = message.toLowerCase();
    const hasKeyword = HANDOFF_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    console.log(`Test ${index + 1}: "${message}" -> ${hasKeyword ? '✅ HANDOFF' : '❌ NO HANDOFF'}`);
    if (hasKeyword) passedTests++;
  });
  
  console.log(`\nKeyword detection: ${passedTests}/${testMessages.length} tests passed`);
  return passedTests === testMessages.length;
}

// Test the logic
const keywordTestsPass = testKeywordDetection();

if (keywordTestsPass) {
  console.log('\n✅ Keyword detection logic works - issue is in API integration');
} else {
  console.log('\n❌ Keyword detection logic needs fixing');
}