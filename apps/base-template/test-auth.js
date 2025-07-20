// Test authentication flow
async function testAuth() {
  console.log('Testing authentication flow...\n');
  
  // 1. Test login endpoint
  console.log('1. Testing login with demo credentials...');
  try {
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    const loginText = await loginResponse.text();
    console.log('Login response:', loginText.substring(0, 200) + '...');
  } catch (error) {
    console.error('Login test error:', error.message);
  }
  
  // 2. Test CSRF token endpoint
  console.log('\n2. Testing CSRF token endpoint...');
  try {
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    console.log('CSRF response status:', csrfResponse.status);
    const csrfData = await csrfResponse.json();
    console.log('CSRF token:', csrfData);
  } catch (error) {
    console.error('CSRF test error:', error.message);
  }
  
  // 3. Test session endpoint
  console.log('\n3. Testing session endpoint...');
  try {
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    console.log('Session response status:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('Session data:', sessionData);
  } catch (error) {
    console.error('Session test error:', error.message);
  }
  
  // 4. Test protected API endpoint
  console.log('\n4. Testing protected API endpoint...');
  try {
    const protectedResponse = await fetch('http://localhost:3000/api/user/profile');
    console.log('Protected endpoint status:', protectedResponse.status);
    if (protectedResponse.status === 401) {
      console.log('Correctly blocked - user not authenticated');
    }
  } catch (error) {
    console.error('Protected endpoint test error:', error.message);
  }
  
  // 5. Check database connection
  console.log('\n5. Testing database connection...');
  try {
    const dbResponse = await fetch('http://localhost:3000/api/test-db');
    console.log('Database test status:', dbResponse.status);
    const dbData = await dbResponse.text();
    console.log('Database response:', dbData);
  } catch (error) {
    console.error('Database test error:', error.message);
  }
}

testAuth().catch(console.error);