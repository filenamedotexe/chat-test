/**
 * Comprehensive NextAuth.js Session Testing
 * This tests actual login sessions and authentication flow
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
      cookies[name.trim()] = value;
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

async function testLogin(email, password) {
  console.log(`\nTesting login for: ${email}`);
  
  // Step 1: Get CSRF token
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;
  const cookies = extractCookies(csrfResponse.headers);
  
  console.log(`  ✓ Got CSRF token: ${csrfToken.substring(0, 20)}...`);
  
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
    console.log(`  ✓ Login successful (Status: ${loginResponse.status})`);
    
    // Step 3: Get session
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': formatCookies(cookies)
      }
    });
    
    const session = await sessionResponse.json();
    console.log(`  ✓ Session retrieved:`, session);
    
    return { success: true, session, cookies };
  } else {
    const error = await loginResponse.text();
    console.log(`  ✗ Login failed (Status: ${loginResponse.status})`);
    console.log(`    Error:`, error);
    return { success: false, error };
  }
}

async function testProtectedRoute(path, cookies) {
  console.log(`\nTesting protected route: ${path}`);
  
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Cookie': formatCookies(cookies)
    },
    redirect: 'manual'
  });
  
  console.log(`  Status: ${response.status}`);
  if (response.status === 200) {
    console.log(`  ✓ Access granted`);
    return true;
  } else if (response.status === 307 || response.status === 302) {
    const location = response.headers.get('location');
    console.log(`  ✗ Redirected to: ${location}`);
    return false;
  } else {
    console.log(`  ✗ Access denied`);
    return false;
  }
}

async function testAPIEndpoint(path, cookies, method = 'GET', body = null) {
  console.log(`\nTesting API endpoint: ${method} ${path}`);
  
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
  
  const response = await fetch(`${BASE_URL}${path}`, options);
  
  console.log(`  Status: ${response.status}`);
  
  if (response.status === 200) {
    const data = await response.json();
    console.log(`  ✓ Success:`, data);
    return { success: true, data };
  } else if (response.status === 307 || response.status === 302) {
    console.log(`  ✗ Redirected (not authenticated)`);
    return { success: false, reason: 'redirect' };
  } else {
    const error = await response.text();
    console.log(`  ✗ Failed:`, error);
    return { success: false, error };
  }
}

async function runComprehensiveTests() {
  console.log('🔐 COMPREHENSIVE AUTHENTICATION SESSION TESTING');
  console.log('==============================================');
  
  // Test 1: Login as admin
  console.log('\n1. ADMIN LOGIN TEST');
  const adminLogin = await testLogin('admin@example.com', 'admin123');
  
  if (!adminLogin.success) {
    console.log('  ❌ Admin login failed - check credentials');
    return;
  }
  
  // Test 2: Admin access to protected routes
  console.log('\n2. ADMIN ROUTE ACCESS TEST');
  await testProtectedRoute('/admin', adminLogin.cookies);
  await testProtectedRoute('/admin/users', adminLogin.cookies);
  
  // Test 3: Admin API access
  console.log('\n3. ADMIN API ACCESS TEST');
  await testAPIEndpoint('/api/admin/users', adminLogin.cookies);
  await testAPIEndpoint('/api/admin/chat-history', adminLogin.cookies);
  await testAPIEndpoint('/api/admin/permission-groups', adminLogin.cookies);
  
  // Test 4: Create a regular user
  console.log('\n4. USER CREATION TEST');
  const timestamp = Date.now();
  const newUser = await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: `testuser_${timestamp}@example.com`,
    password: 'TestUser123',
    name: 'Test User'
  });
  
  if (newUser.success) {
    console.log(`  ✓ Created user: ${newUser.data.user.email}`);
  }
  
  // Test 5: Login as regular user
  console.log('\n5. USER LOGIN TEST');
  const userLogin = await testLogin(`testuser_${timestamp}@example.com`, 'TestUser123');
  
  if (!userLogin.success) {
    console.log('  ❌ User login failed');
    return;
  }
  
  // Test 6: User access restrictions
  console.log('\n6. USER ACCESS RESTRICTION TEST');
  await testProtectedRoute('/admin', userLogin.cookies); // Should be denied
  await testAPIEndpoint('/api/admin/users', userLogin.cookies); // Should be denied
  await testAPIEndpoint('/api/user/me', userLogin.cookies); // Should be allowed
  
  // Test 7: Chat history isolation
  console.log('\n7. CHAT HISTORY ISOLATION TEST');
  
  // Send chat as user 1
  const chatResponse1 = await testAPIEndpoint('/api/chat-langchain', userLogin.cookies, 'POST', {
    messages: [{ role: 'user', content: 'Test message from user 1' }],
    sessionId: `user1_session_${timestamp}`
  });
  
  // Create another user
  const user2 = await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: `testuser2_${timestamp}@example.com`,
    password: 'TestUser123',
    name: 'Test User 2'
  });
  
  const user2Login = await testLogin(`testuser2_${timestamp}@example.com`, 'TestUser123');
  
  // Try to access user1's chat (should fail or return empty)
  const chatCheck = await testAPIEndpoint(`/api/memory?sessionId=user1_session_${timestamp}`, user2Login.cookies);
  
  // Test 8: Permission management
  console.log('\n8. PERMISSION MANAGEMENT TEST');
  
  // As admin, grant permission to user
  const grantPermission = await testAPIEndpoint('/api/admin/permissions', adminLogin.cookies, 'POST', {
    user_id: newUser.data.user.id,
    app_id: 1 // Assuming app ID 1 exists
  });
  
  // Test 9: Session logout
  console.log('\n9. SESSION LOGOUT TEST');
  
  const logoutResponse = await fetch(`${BASE_URL}/api/auth/signout`, {
    method: 'POST',
    headers: {
      'Cookie': formatCookies(userLogin.cookies)
    }
  });
  
  console.log(`  Logout status: ${logoutResponse.status}`);
  
  // Try to access protected route after logout
  await testProtectedRoute('/api/user/me', userLogin.cookies); // Should fail
  
  // Test 10: Security tests
  console.log('\n10. SECURITY VULNERABILITY TESTS');
  
  // SQL Injection attempt
  await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: "test'; DROP TABLE users; --",
    password: 'Test123',
    name: 'SQL Test'
  });
  
  // XSS attempt
  await testAPIEndpoint('/api/auth/register', {}, 'POST', {
    email: 'xss@test.com',
    password: 'Test123',
    name: '<script>alert("XSS")</script>'
  });
  
  console.log('\n==============================================');
  console.log('TESTING COMPLETE');
  console.log('==============================================');
}

// Run the tests
runComprehensiveTests().catch(console.error);