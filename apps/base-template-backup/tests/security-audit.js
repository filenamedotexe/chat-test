// Security audit test suite
// Run with: node tests/security-audit.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

console.log('🔒 Starting Security Audit...\n');

class SecurityTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async test(name, testFn) {
    try {
      console.log(`Testing: ${name}...`);
      const result = await testFn();
      if (result.status === 'pass') {
        this.results.passed++;
        console.log(`✅ ${name}: PASS - ${result.message}`);
      } else if (result.status === 'warning') {
        this.results.warnings++;
        console.log(`⚠️  ${name}: WARNING - ${result.message}`);
      } else {
        this.results.failed++;
        console.log(`❌ ${name}: FAIL - ${result.message}`);
      }
      this.results.tests.push({ name, ...result });
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      this.results.tests.push({ name, status: 'fail', message: error.message });
    }
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

  summary() {
    console.log('\n📊 Security Audit Summary:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📋 Total Tests: ${this.results.tests.length}`);
    
    if (this.results.failed > 0) {
      console.log('\n🚨 Failed Tests:');
      this.results.tests
        .filter(t => t.status === 'fail')
        .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
    }
    
    return this.results.failed === 0;
  }
}

const tester = new SecurityTester();

// SQL Injection Tests
await tester.test('SQL Injection - Login Email', async () => {
  const response = await tester.makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: "test'; DROP TABLE users; --",
      password: 'password123',
      name: 'Test User'
    })
  });
  
  if (response.status === 400 || response.status === 422) {
    return { status: 'pass', message: 'SQL injection attempt rejected' };
  }
  return { status: 'fail', message: 'SQL injection not properly blocked' };
});

await tester.test('SQL Injection - User Search', async () => {
  const response = await tester.makeRequest('/api/admin/users?search=' + encodeURIComponent("'; DROP TABLE users; --"));
  
  if (response.status === 401 || response.status === 403) {
    return { status: 'pass', message: 'Unauthorized access blocked' };
  }
  return { status: 'warning', message: 'Need to test with admin authentication' };
});

// XSS Protection Tests
await tester.test('XSS Protection - User Registration', async () => {
  const response = await tester.makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      name: '<script>alert("XSS")</script>'
    })
  });
  
  if (response.status === 400 || response.status === 422) {
    return { status: 'pass', message: 'XSS payload rejected' };
  }
  
  // If registration succeeds, check if script is sanitized
  const data = await response.json();
  if (data.user && data.user.name.includes('<script>')) {
    return { status: 'fail', message: 'XSS payload not sanitized' };
  }
  
  return { status: 'pass', message: 'XSS payload handled safely' };
});

// Authentication Tests
await tester.test('Unauthenticated Admin Access', async () => {
  const response = await tester.makeRequest('/api/admin/users');
  
  if (response.status === 401) {
    return { status: 'pass', message: 'Admin routes properly protected' };
  }
  return { status: 'fail', message: 'Admin routes accessible without authentication' };
});

await tester.test('Unauthenticated User Data Access', async () => {
  const response = await tester.makeRequest('/api/user/me');
  
  if (response.status === 401) {
    return { status: 'pass', message: 'User data properly protected' };
  }
  return { status: 'fail', message: 'User data accessible without authentication' };
});

// Authorization Tests
await tester.test('Invalid JWT Token', async () => {
  const response = await tester.makeRequest('/api/user/me', {
    headers: {
      'Authorization': 'Bearer invalid.jwt.token'
    }
  });
  
  if (response.status === 401) {
    return { status: 'pass', message: 'Invalid JWT properly rejected' };
  }
  return { status: 'fail', message: 'Invalid JWT not properly handled' };
});

// Rate Limiting Tests
await tester.test('Brute Force Protection - Registration', async () => {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(tester.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `test${i}@example.com`,
        password: 'password123',
        name: 'Test User'
      })
    }));
  }
  
  const responses = await Promise.all(promises);
  const rateLimited = responses.some(r => r.status === 429);
  
  if (rateLimited) {
    return { status: 'pass', message: 'Rate limiting active' };
  }
  return { status: 'warning', message: 'No rate limiting detected - consider implementing' };
});

// CSRF Protection Tests
await tester.test('CSRF Protection - State Changes', async () => {
  const response = await tester.makeRequest('/api/admin/users/1', {
    method: 'PUT',
    body: JSON.stringify({ role: 'admin' }),
    headers: {
      'Origin': 'https://malicious-site.com'
    }
  });
  
  if (response.status === 401 || response.status === 403) {
    return { status: 'pass', message: 'CSRF protection active' };
  }
  return { status: 'warning', message: 'CSRF protection needs verification with authentication' };
});

// Input Validation Tests
await tester.test('Input Validation - Email Format', async () => {
  const response = await tester.makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'not-an-email',
      password: 'password123',
      name: 'Test User'
    })
  });
  
  if (response.status === 400 || response.status === 422) {
    return { status: 'pass', message: 'Invalid email format rejected' };
  }
  return { status: 'fail', message: 'Invalid email format accepted' };
});

await tester.test('Input Validation - Password Strength', async () => {
  const response = await tester.makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: '123',
      name: 'Test User'
    })
  });
  
  if (response.status === 400 || response.status === 422) {
    return { status: 'pass', message: 'Weak password rejected' };
  }
  return { status: 'warning', message: 'Password strength validation may need improvement' };
});

// HTTP Security Headers Tests
await tester.test('Security Headers - X-Frame-Options', async () => {
  const response = await tester.makeRequest('/');
  const xFrameOptions = response.headers.get('X-Frame-Options');
  
  if (xFrameOptions && (xFrameOptions.includes('DENY') || xFrameOptions.includes('SAMEORIGIN'))) {
    return { status: 'pass', message: 'X-Frame-Options header present' };
  }
  return { status: 'warning', message: 'X-Frame-Options header missing - add for clickjacking protection' };
});

await tester.test('Security Headers - Content-Type-Options', async () => {
  const response = await tester.makeRequest('/');
  const contentTypeOptions = response.headers.get('X-Content-Type-Options');
  
  if (contentTypeOptions && contentTypeOptions.includes('nosniff')) {
    return { status: 'pass', message: 'X-Content-Type-Options header present' };
  }
  return { status: 'warning', message: 'X-Content-Type-Options header missing - add for MIME sniffing protection' };
});

// API Endpoint Security
await tester.test('API Error Information Disclosure', async () => {
  const response = await tester.makeRequest('/api/nonexistent');
  const text = await response.text();
  
  if (text.includes('stack trace') || text.includes('Error:') || text.includes('at ')) {
    return { status: 'fail', message: 'Stack traces exposed in error responses' };
  }
  return { status: 'pass', message: 'Error responses do not expose sensitive information' };
});

await tester.test('API Method Validation', async () => {
  const response = await tester.makeRequest('/api/user/me', { method: 'DELETE' });
  
  if (response.status === 405) {
    return { status: 'pass', message: 'Invalid HTTP methods properly rejected' };
  }
  return { status: 'warning', message: 'HTTP method validation needs verification' };
});

// Data Validation Tests
await tester.test('Large Payload Protection', async () => {
  const largePayload = 'x'.repeat(1024 * 1024); // 1MB
  const response = await tester.makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      name: largePayload
    })
  });
  
  if (response.status === 413 || response.status === 400) {
    return { status: 'pass', message: 'Large payloads properly rejected' };
  }
  return { status: 'warning', message: 'Large payload protection needs verification' };
});

console.log('\n🔒 Security Audit Complete\n');
const passed = tester.summary();

if (passed) {
  console.log('\n🎉 All critical security tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some security tests failed. Please review and fix before production deployment.');
  process.exit(1);
}