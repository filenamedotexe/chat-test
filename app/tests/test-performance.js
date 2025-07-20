const ENDPOINT = 'http://localhost:3000/api/chat-langchain';

async function measureResponseTime(promptTemplateId, message, memoryType = 'buffer') {
  const startTime = Date.now();
  const sessionId = `perf-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        memoryType,
        sessionId,
        promptTemplateId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let firstTokenTime = null;
    let tokenCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;
      
      if (!firstTokenTime && chunk.length > 0) {
        firstTokenTime = Date.now() - startTime;
      }
      
      // Rough token count (words)
      tokenCount += chunk.split(/\s+/).filter(w => w.length > 0).length;
    }

    const totalTime = Date.now() - startTime;

    return {
      promptTemplateId,
      memoryType,
      totalTime,
      firstTokenTime,
      responseLength: fullResponse.length,
      estimatedTokens: tokenCount,
      tokensPerSecond: tokenCount / (totalTime / 1000)
    };
  } catch (error) {
    return {
      promptTemplateId,
      memoryType,
      error: error.message
    };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting LangChain Performance Tests\n');
  
  const testCases = [
    { promptId: 'default', message: 'What is the capital of France?', memory: 'buffer' },
    { promptId: 'default', message: 'What is the capital of France?', memory: 'summary' },
    { promptId: 'concise', message: 'Explain quantum computing', memory: 'buffer' },
    { promptId: 'technical', message: 'How does React virtual DOM work?', memory: 'buffer' },
    { promptId: 'creative', message: 'Write a haiku about JavaScript', memory: 'buffer' },
  ];

  const results = [];

  for (const test of testCases) {
    console.log(`\nTesting: ${test.promptId} (${test.memory}) - "${test.message}"`);
    const result = await measureResponseTime(test.promptId, test.message, test.memory);
    results.push(result);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else {
      console.log(`✅ Total time: ${result.totalTime}ms`);
      console.log(`   First token: ${result.firstTokenTime}ms`);
      console.log(`   Response length: ${result.responseLength} chars`);
      console.log(`   Estimated tokens: ${result.estimatedTokens}`);
      console.log(`   Tokens/second: ${result.tokensPerSecond.toFixed(2)}`);
    }
  }

  // Summary statistics
  console.log('\n📊 Performance Summary\n');
  const successful = results.filter(r => !r.error);
  
  if (successful.length > 0) {
    const avgTotalTime = successful.reduce((sum, r) => sum + r.totalTime, 0) / successful.length;
    const avgFirstToken = successful.reduce((sum, r) => sum + r.firstTokenTime, 0) / successful.length;
    const avgTokensPerSec = successful.reduce((sum, r) => sum + r.tokensPerSecond, 0) / successful.length;
    
    console.log(`Average total time: ${avgTotalTime.toFixed(0)}ms`);
    console.log(`Average first token: ${avgFirstToken.toFixed(0)}ms`);
    console.log(`Average tokens/second: ${avgTokensPerSec.toFixed(2)}`);
    
    // Memory type comparison
    const bufferResults = successful.filter(r => r.memoryType === 'buffer');
    const summaryResults = successful.filter(r => r.memoryType === 'summary');
    
    if (bufferResults.length > 0 && summaryResults.length > 0) {
      console.log('\n🧠 Memory Type Comparison:');
      const bufferAvg = bufferResults.reduce((sum, r) => sum + r.totalTime, 0) / bufferResults.length;
      const summaryAvg = summaryResults.reduce((sum, r) => sum + r.totalTime, 0) / summaryResults.length;
      console.log(`Buffer memory avg: ${bufferAvg.toFixed(0)}ms`);
      console.log(`Summary memory avg: ${summaryAvg.toFixed(0)}ms`);
      console.log(`Difference: ${Math.abs(bufferAvg - summaryAvg).toFixed(0)}ms`);
    }
  }

  // Test database query performance
  console.log('\n🗄️ Testing Database Performance\n');
  const sessionId = 'db-perf-test';
  
  // First, create some history
  for (let i = 0; i < 5; i++) {
    await measureResponseTime('default', `Test message ${i}`, 'buffer');
  }
  
  // Now measure retrieval time
  const dbStartTime = Date.now();
  const historyResponse = await fetch(`http://localhost:3000/api/memory?sessionId=${sessionId}&action=history`);
  const dbEndTime = Date.now();
  
  if (historyResponse.ok) {
    const data = await historyResponse.json();
    console.log(`Database query time: ${dbEndTime - dbStartTime}ms`);
    console.log(`Messages retrieved: ${data.messages?.length || 0}`);
  }
}

// Run the tests
runPerformanceTests().catch(console.error);