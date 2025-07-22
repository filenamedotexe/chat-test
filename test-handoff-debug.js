// Debug test to check handoff detection logic
const { detectSupportHandoff } = require('./lib/support-chat/handoff-detection.ts');

async function testHandoffDetection() {
  console.log('🔍 Testing handoff detection logic directly...');
  
  // Test 1: Direct request
  const messages1 = [
    { role: 'user', content: 'Hello, I need some help' },
    { role: 'assistant', content: 'Sure, what can I help you with?' },
    { role: 'user', content: 'I need to speak to human support immediately' }
  ];
  
  const result1 = await detectSupportHandoff(messages1, messages1[2].content);
  console.log('Test 1 - Direct request:', result1.shouldHandoff ? '✅ PASS' : '❌ FAIL');
  
  // Test 2: Urgent keywords
  const messages2 = [
    { role: 'user', content: 'This is urgent, I cannot access my account' }
  ];
  
  const result2 = await detectSupportHandoff(messages2, messages2[0].content);
  console.log('Test 2 - Urgent keywords:', result2.shouldHandoff ? '✅ PASS' : '❌ FAIL');
  
  // Test 3: Frustration patterns
  const messages3 = [
    { role: 'user', content: 'This is not working' },
    { role: 'assistant', content: 'Let me help you with that' },
    { role: 'user', content: 'I tried that already and it still doesnt work' },
    { role: 'assistant', content: 'I understand your frustration' },
    { role: 'user', content: 'This is terrible, nothing is helping' }
  ];
  
  const result3 = await detectSupportHandoff(messages3, messages3[4].content);
  console.log('Test 3 - Frustration:', result3.shouldHandoff ? '✅ PASS' : '❌ FAIL');
  
  if (result1.shouldHandoff || result2.shouldHandoff || result3.shouldHandoff) {
    console.log('\n✅ Handoff detection logic works - issue is likely in API integration');
  } else {
    console.log('\n❌ Handoff detection logic has issues');
  }
}

testHandoffDetection().catch(console.error);