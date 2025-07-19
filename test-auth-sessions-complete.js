/**
 * Complete Authentication System Testing
 * Tests every aspect of the authentication implementation
 */

const BASE_URL = 'http://localhost:3000';

// Helper to extract cookies from response headers
function extractCookies(headers) {
  const cookies = {};
  const setCookieHeaders = headers.get('set-cookie');
  if (setCookieHeaders) {
    setCookieHeaders.split(',').forEach(cookie => {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      if (name && value) {
        cookies[name.trim()] = value;
      }
    });
  }
  return cookies;
}

// Helper to format cookies for requests
function formatCookies(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

// Test result tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logTest(name, passed, details = '') {
  if (passed) {
    console.log(`  ✅ ${name}`);
    testResults.passed++;
  } else {
    console.log(`  ❌ ${name}`);
    if (details) console.log(`     ${details}`);
    testResults.failed++;
    testResults.details.push({ name, details });
  }
}

async function testLogin(email, password) {
  console.log(`\n📝 Testing login for: ${email}`);
  
  try {
    // Step 1: Get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    const cookies = extractCookies(csrfResponse.headers);
    
    // Step 2: Attempt login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': formatCookies(cookies)
      },
      body: new URLSearchParams({
        email,
        password,
        csrfToken,
        json: 'true'
      }),
      redirect: 'manual'
    });
    
    const loginCookies = extractCookies(loginResponse.headers);
    Object.assign(cookies, loginCookies);
    
    if (loginResponse.status === 302 || loginResponse.status === 200) {
      // Step 3: Get session
      const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: {
          'Cookie': formatCookies(cookies)
        }
      });
      
      const session = await sessionResponse.json();
      
      if (session && session.user) {
        logTest(`Login successful for ${email}`, true);
        return { success: true, session, cookies };
      } else {
        logTest(`Login failed - no session for ${email}`, false);
        return { success: false, error: 'No session created' };
      }
    } else {
      const error = await loginResponse.text();
      logTest(`Login failed for ${email}`, false, `Status: ${loginResponse.status}`);
      return { success: false, error };
    }
  } catch (error) {
    logTest(`Login error for ${email}`, false, error.message);
    return { success: false, error: error.message };
  }
}

async function testStreamingChat(cookies, message, sessionId) {
  console.log(`\n💬 Testing streaming chat API`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat-langchain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': formatCookies(cookies)
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        sessionId: sessionId
      })
    });
    
    if (response.status === 200) {
      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
      }
      
      logTest('Chat API accessed successfully', true);
      return { success: true, response: fullResponse };
    } else {
      logTest('Chat API failed', false, `Status: ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    logTest('Chat API error', false, error.message);
    return { success: false, error: error.message };
  }
}

async function testProtectedRoute(path, cookies, expectedStatus = 200) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Cookie': formatCookies(cookies)
    },
    redirect: 'manual'
  });
  
  const passed = response.status === expectedStatus;
  logTest(`${path} - Status ${response.status} (expected ${expectedStatus})`, passed);
  return passed;
}

async function testAPIEndpoint(path, cookies, method = 'GET', body = null, expectedStatus = 200) {
  const options = {
    method,
    headers: {
      'Cookie': formatCookies(cookies),
      'Content-Type': 'application/json'
    },
    redirect: 'manual'
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const passed = response.status === expectedStatus;
    
    let data = null;
    if (response.status === 200) {
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }
    }
    
    logTest(
      `${method} ${path} - Status ${response.status} (expected ${expectedStatus})`, 
      passed
    );
    
    return { success: passed, data, status: response.status };
  } catch (error) {
    logTest(`${method} ${path} - Error`, false, error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🔐 COMPLETE AUTHENTICATION SYSTEM TESTING');
  console.log('=========================================\n');
  
  // 1. Database Setup
  console.log('1️⃣  DATABASE SETUP TEST');
  await testAPIEndpoint('/api/setup-auth-database', {}, 'GET');
  
  // 2. Registration Tests
  console.log('\n2️⃣  REGISTRATION TESTS');
  const timestamp = Date.now();
  
  // Valid registration
  const user1 = await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: `user1_${timestamp}@example.com`,
    password: 'User1Pass123',
    name: 'User One'
  });
  
  // Duplicate email
  await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: `user1_${timestamp}@example.com`,
    password: 'User1Pass123',
    name: 'Duplicate'
  }, 409);
  
  // Invalid email
  await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: 'invalid-email',
    password: 'ValidPass123',
    name: 'Invalid'
  }, 400);
  
  // Weak password
  await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: `weak_${timestamp}@example.com`,
    password: 'weak',
    name: 'Weak'
  }, 400);
  
  // SQL injection
  await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: "test'; DROP TABLE users; --",
    password: 'Test123',
    name: 'SQL'
  }, 400);
  
  // XSS attempt
  await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: `xss_${timestamp}@example.com`,
    password: 'Test123',
    name: '<script>alert("XSS")</script>'
  }, 400);
  
  // Create second user
  const user2 = await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: `user2_${timestamp}@example.com`,
    password: 'User2Pass123',
    name: 'User Two'
  });
  
  // 3. Authentication Tests
  console.log('\n3️⃣  AUTHENTICATION TESTS');
  
  // Test unauthenticated access
  await testProtectedRoute('/', {}, 307);
  await testProtectedRoute('/chat', {}, 307);
  await testProtectedRoute('/admin', {}, 307);
  await testAPIEndpoint('/api/user/me', {}, 'GET', null, 307);
  await testAPIEndpoint('/api/admin/users', {}, 'GET', null, 307);
  
  // 4. Admin Login and Access
  console.log('\n4️⃣  ADMIN LOGIN AND ACCESS TESTS');
  const adminLogin = await testLogin('admin@example.com', 'admin123');
  
  if (adminLogin.success) {
    // Test admin access
    await testProtectedRoute('/admin', adminLogin.cookies);
    await testAPIEndpoint('/api/admin/users', adminLogin.cookies);
    await testAPIEndpoint('/api/admin/chat-history', adminLogin.cookies);
    await testAPIEndpoint('/api/admin/permission-groups', adminLogin.cookies);
    
    // Test admin can see all users
    const allUsers = await testAPIEndpoint('/api/admin/users', adminLogin.cookies);
    if (allUsers.data && Array.isArray(allUsers.data)) {
      logTest(`Admin can see ${allUsers.data.length} users`, true);
    }
  }
  
  // 5. User Login and Restrictions
  console.log('\n5️⃣  USER LOGIN AND RESTRICTION TESTS');
  const user1Login = await testLogin(`user1_${timestamp}@example.com`, 'User1Pass123');
  
  if (user1Login.success) {
    // Test user access
    await testAPIEndpoint('/api/user/me', user1Login.cookies);
    await testAPIEndpoint('/api/user/apps', user1Login.cookies);
    await testAPIEndpoint('/api/user/permissions', user1Login.cookies);
    
    // Test user restrictions
    await testProtectedRoute('/admin', user1Login.cookies, 403);
    await testAPIEndpoint('/api/admin/users', user1Login.cookies, 'GET', null, 403);
    await testAPIEndpoint('/api/admin/chat-history', user1Login.cookies, 'GET', null, 403);
  }
  
  // 6. Chat History Isolation
  console.log('\n6️⃣  CHAT HISTORY ISOLATION TESTS');
  
  if (user1Login.success) {
    // User 1 sends a chat
    const chat1 = await testStreamingChat(
      user1Login.cookies, 
      'This is a private message from User 1',
      `user1_session_${timestamp}`
    );
    
    // Login as User 2
    const user2Login = await testLogin(`user2_${timestamp}@example.com`, 'User2Pass123');
    
    if (user2Login.success) {
      // User 2 tries to access User 1's session
      const user2Access = await testAPIEndpoint(
        `/api/memory?sessionId=user1_session_${timestamp}`,
        user2Login.cookies
      );
      
      // Check if isolation works
      if (user2Access.data && user2Access.data.history) {
        logTest(
          'Chat history isolation', 
          user2Access.data.history.length === 0,
          'User 2 should not see User 1 messages'
        );
      }
    }
  }
  
  // 7. Permission Management
  console.log('\n7️⃣  PERMISSION MANAGEMENT TESTS');
  
  if (adminLogin.success && user1.data) {
    // Grant permission
    const grant = await testAPIEndpoint(
      '/api/admin/permissions',
      adminLogin.cookies,
      'POST',
      { user_id: user1.data.user.id, app_id: 1 }
    );
    
    // Revoke permission
    const revoke = await testAPIEndpoint(
      '/api/admin/permissions',
      adminLogin.cookies,
      'DELETE',
      { user_id: user1.data.user.id, app_id: 1 }
    );
    
    // Update user permission group
    const updateGroup = await testAPIEndpoint(
      `/api/admin/users/${user1.data.user.id}/permission-group`,
      adminLogin.cookies,
      'PUT',
      { permission_group: 'power_user' }
    );
  }
  
  // 8. App Discovery and Registration
  console.log('\n8️⃣  APP DISCOVERY TESTS');
  
  if (adminLogin.success) {
    const discover = await testAPIEndpoint(
      '/api/admin/discover-apps',
      adminLogin.cookies,
      'POST'
    );
    
    if (discover.data && discover.data.discovered) {
      logTest(
        `App discovery found ${discover.data.discovered.length} apps`,
        true
      );
    }
  }
  
  // 9. Session Management
  console.log('\n9️⃣  SESSION MANAGEMENT TESTS');
  
  if (user1Login.success) {
    // Test logout
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/signout`, {
      method: 'POST',
      headers: {
        'Cookie': formatCookies(user1Login.cookies)
      }
    });
    
    logTest('Logout successful', logoutResponse.ok);
    
    // Try to access after logout
    await testAPIEndpoint('/api/user/me', user1Login.cookies, 'GET', null, 307);
  }
  
  // 10. Security Headers and CORS
  console.log('\n🔟 SECURITY HEADERS TEST');
  
  const securityResponse = await fetch(`${BASE_URL}/`);
  const headers = securityResponse.headers;
  
  logTest(
    'X-Frame-Options header',
    headers.get('x-frame-options') !== null,
    headers.get('x-frame-options') || 'Not set'
  );
  
  logTest(
    'X-Content-Type-Options header',
    headers.get('x-content-type-options') !== null,
    headers.get('x-content-type-options') || 'Not set'
  );
  
  // 11. Performance Tests
  console.log('\n1️⃣1️⃣  PERFORMANCE TESTS');
  
  const perfStart = Date.now();
  await fetch(`${BASE_URL}/api/user/me`, { redirect: 'manual' });
  const perfEnd = Date.now();
  const responseTime = perfEnd - perfStart;
  
  logTest(
    `Response time ${responseTime}ms`,
    responseTime < 100,
    responseTime > 100 ? 'Too slow' : ''
  );
  
  // 12. Database Integrity
  console.log('\n1️⃣2️⃣  DATABASE INTEGRITY TESTS');
  
  // Test default admin exists
  const adminCheck = await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: 'admin@example.com',
    password: 'Test123',
    name: 'Admin'
  }, 409);
  
  // Final Summary
  console.log('\n=========================================');
  console.log('📊 FINAL TEST SUMMARY');
  console.log('=========================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed + testResults.warnings}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details.forEach(detail => {
      console.log(`  - ${detail.name}`);
      if (detail.details) console.log(`    ${detail.details}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The authentication system is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix the issues above.');
  }
}

// Run all tests
runAllTests().catch(console.error);