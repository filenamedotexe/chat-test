// Performance testing for authentication system
// Run with: node tests/performance-test.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

console.log('⚡ Starting Performance Tests...\n');

class PerformanceTester {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        totalRequests: 0,
        errors: 0
      }
    };
  }

  async measureRequest(name, requestFn, iterations = 1) {
    console.log(`Testing: ${name} (${iterations} iterations)...`);
    
    const times = [];
    let errors = 0;
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await requestFn();
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        errors++;
        console.log(`  Error in iteration ${i + 1}: ${error.message}`);
      }
    }
    
    if (times.length === 0) {
      console.log(`❌ ${name}: All requests failed`);
      return { name, error: 'All requests failed' };
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    this.results.tests.push({
      name,
      avgResponseTime: avg,
      maxResponseTime: max,
      minResponseTime: min,
      iterations,
      errors,
      successRate: ((iterations - errors) / iterations) * 100
    });
    
    this.results.summary.totalRequests += iterations;
    this.results.summary.errors += errors;
    this.results.summary.avgResponseTime = (this.results.summary.avgResponseTime + avg) / 2;
    this.results.summary.maxResponseTime = Math.max(this.results.summary.maxResponseTime, max);
    this.results.summary.minResponseTime = Math.min(this.results.summary.minResponseTime, min);
    
    console.log(`✅ ${name}: ${avg.toFixed(2)}ms avg, ${max.toFixed(2)}ms max, ${min.toFixed(2)}ms min`);
    if (errors > 0) {
      console.log(`⚠️  ${errors}/${iterations} requests failed`);
    }
    
    return this.results.tests[this.results.tests.length - 1];
  }

  async makeRequest(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return response;
  }

  async loadTest(name, requestFn, concurrency = 5, totalRequests = 25) {
    console.log(`Load Testing: ${name} (${concurrency} concurrent, ${totalRequests} total)...`);
    
    const start = performance.now();
    const batches = Math.ceil(totalRequests / concurrency);
    let completed = 0;
    let errors = 0;
    const times = [];
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, totalRequests - completed);
      const promises = [];
      
      for (let i = 0; i < batchSize; i++) {
        promises.push(
          (async () => {
            const requestStart = performance.now();
            try {
              await requestFn();
              const requestEnd = performance.now();
              times.push(requestEnd - requestStart);
            } catch (error) {
              errors++;
            }
          })()
        );
      }
      
      await Promise.all(promises);
      completed += batchSize;
    }
    
    const totalTime = performance.now() - start;
    const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const throughput = (totalRequests / (totalTime / 1000)).toFixed(2);
    
    console.log(`📊 ${name} Load Test Results:`);
    console.log(`   Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Throughput: ${throughput} req/sec`);
    console.log(`   Success Rate: ${((totalRequests - errors) / totalRequests * 100).toFixed(1)}%`);
    console.log(`   Average Response Time: ${avg.toFixed(2)}ms`);
    
    return {
      name,
      totalTime,
      throughput: parseFloat(throughput),
      successRate: ((totalRequests - errors) / totalRequests) * 100,
      avgResponseTime: avg,
      totalRequests,
      errors
    };
  }

  summary() {
    console.log('\n📊 Performance Test Summary:');
    console.log(`Total Requests: ${this.results.summary.totalRequests}`);
    console.log(`Average Response Time: ${this.results.summary.avgResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${this.results.summary.maxResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${this.results.summary.minResponseTime.toFixed(2)}ms`);
    console.log(`Error Rate: ${(this.results.summary.errors / this.results.summary.totalRequests * 100).toFixed(2)}%`);
    
    console.log('\n📋 Individual Test Results:');
    this.results.tests.forEach(test => {
      console.log(`   ${test.name}: ${test.avgResponseTime.toFixed(2)}ms avg (${test.successRate.toFixed(1)}% success)`);
    });
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    this.results.tests.forEach(test => {
      if (test.avgResponseTime > 1000) {
        console.log(`   ⚠️  ${test.name}: Response time over 1s - consider optimization`);
      }
      if (test.successRate < 95) {
        console.log(`   ⚠️  ${test.name}: Success rate below 95% - investigate errors`);
      }
    });
  }
}

const tester = new PerformanceTester();

// Test static page performance
await tester.measureRequest('Static Page Load', async () => {
  const response = await tester.makeRequest('/');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}, 10);

// Test authentication endpoints
await tester.measureRequest('Registration Endpoint', async () => {
  const response = await tester.makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `perf-test-${Date.now()}-${Math.random()}@example.com`,
      password: 'PerfTest123!',
      name: 'Performance Test User'
    })
  });
  // Don't throw on 409 (duplicate email) as that's expected in load tests
  if (response.status !== 200 && response.status !== 409 && response.status !== 400) {
    throw new Error(`HTTP ${response.status}`);
  }
}, 5);

// Test protected endpoint response time
await tester.measureRequest('Protected Endpoint (Unauthenticated)', async () => {
  const response = await tester.makeRequest('/api/user/me');
  if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
}, 10);

// Test admin endpoint response time
await tester.measureRequest('Admin Endpoint (Unauthenticated)', async () => {
  const response = await tester.makeRequest('/api/admin/users');
  if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
}, 10);

// Test permission groups endpoint
await tester.measureRequest('Permission Groups Endpoint', async () => {
  const response = await tester.makeRequest('/api/admin/permission-groups');
  if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
}, 5);

// Test app discovery endpoint
await tester.measureRequest('App Discovery Endpoint', async () => {
  const response = await tester.makeRequest('/api/admin/discover-apps', { method: 'POST' });
  if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
}, 5);

// Test user apps endpoint
await tester.measureRequest('User Apps Endpoint', async () => {
  const response = await tester.makeRequest('/api/user/apps');
  if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
}, 10);

// Load testing
console.log('\n🔥 Starting Load Tests...\n');

await tester.loadTest('Registration Load Test', async () => {
  const response = await tester.makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `load-test-${Date.now()}-${Math.random()}@example.com`,
      password: 'LoadTest123!',
      name: 'Load Test User'
    })
  });
  // Accept both success and conflict (duplicate email)
  if (response.status !== 200 && response.status !== 409 && response.status !== 400) {
    throw new Error(`HTTP ${response.status}`);
  }
}, 3, 15);

await tester.loadTest('Protected Route Load Test', async () => {
  const response = await tester.makeRequest('/api/user/me');
  if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
}, 5, 25);

await tester.loadTest('Static Page Load Test', async () => {
  const response = await tester.makeRequest('/');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}, 10, 50);

// Memory and session optimization tests
console.log('\n🧠 Memory and Session Tests...\n');

await tester.measureRequest('Session Lookup Performance', async () => {
  // Test multiple session checks
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(tester.makeRequest('/api/user/me'));
  }
  await Promise.all(promises);
}, 3);

await tester.measureRequest('Permission Calculation Performance', async () => {
  // Test permission checks
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(tester.makeRequest('/api/user/permissions'));
  }
  await Promise.all(promises);
}, 3);

// Database query performance simulation
await tester.measureRequest('Database Query Simulation', async () => {
  // Simulate database-heavy operations
  const promises = [
    tester.makeRequest('/api/admin/users'),
    tester.makeRequest('/api/admin/permission-groups'),
    tester.makeRequest('/api/user/apps')
  ];
  await Promise.all(promises);
}, 3);

console.log('\n⚡ Performance Testing Complete\n');
tester.summary();

// Performance benchmarks
console.log('\n🎯 Performance Benchmarks:');
console.log('   Excellent: < 200ms response time');
console.log('   Good: 200-500ms response time');
console.log('   Acceptable: 500-1000ms response time');
console.log('   Poor: > 1000ms response time');
console.log('   Success Rate: Should be > 95%');
console.log('   Throughput: Should handle > 10 req/sec');

process.exit(0);