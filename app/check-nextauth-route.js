#!/usr/bin/env node

// Test the NextAuth routes directly
const testRoutes = async () => {
  console.log('🔍 Testing NextAuth Routes\n');
  
  const routes = [
    '/api/auth/csrf',
    '/api/auth/session',
    '/api/auth/providers',
  ];
  
  for (const route of routes) {
    try {
      console.log(`Testing ${route}...`);
      const response = await fetch(`http://localhost:3000${route}`);
      console.log(`  Status: ${response.status}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log(`  Response:`, JSON.stringify(data, null, 2));
        } else {
          const text = await response.text();
          console.log(`  Response (text):`, text.substring(0, 100));
        }
      } else {
        const text = await response.text();
        console.log(`  Error:`, text.substring(0, 200));
      }
    } catch (error) {
      console.log(`  Failed:`, error.message);
    }
    console.log();
  }
};

testRoutes();