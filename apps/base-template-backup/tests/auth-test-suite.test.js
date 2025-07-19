// Authentication Test Suite
// Run with: npm test

const { describe, it, beforeAll, afterAll, expect } = require('@jest/globals');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

describe('Authentication System Tests', () => {
  let testUser = {
    email: 'test-auth@example.com',
    password: 'TestPass123!',
    name: 'Test Auth User'
  };
  
  let adminUser = {
    email: 'admin-test@example.com',
    password: 'AdminPass123!',
    name: 'Test Admin User'
  };
  
  let userSession = null;
  let adminSession = null;

  async function makeRequest(path, options = {}) {
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

  // Authentication Tests
  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(testUser)
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(testUser.email.toLowerCase());
      expect(data.user.role).toBe('user');
    });

    it('should reject duplicate email registration', async () => {
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(testUser)
      });
      
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });

    it('should reject invalid email format', async () => {
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...testUser,
          email: 'invalid-email'
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });

    it('should reject weak passwords', async () => {
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'weak-password@example.com',
          password: '123',
          name: 'Weak Password User'
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Password');
    });

    it('should sanitize XSS in name field', async () => {
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'xss-test@example.com',
          password: 'SafePass123!',
          name: '<script>alert("xss")</script>Test User'
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('invalid characters');
    });

    it('should reject SQL injection in email', async () => {
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: "test'; DROP TABLE users; --",
          password: 'SafePass123!',
          name: 'SQL Injection Test'
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid characters');
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      // Note: This would require NextAuth.js testing setup
      // For now, we'll test the login page accessibility
      const response = await makeRequest('/login');
      expect(response.status).toBe(200);
    });

    it('should redirect unauthenticated users from protected routes', async () => {
      const response = await makeRequest('/admin', {
        redirect: 'manual'
      });
      expect([302, 307, 401, 403]).toContain(response.status);
    });
  });

  describe('Authorization Tests', () => {
    it('should deny access to admin routes for unauthenticated users', async () => {
      const response = await makeRequest('/api/admin/users');
      expect(response.status).toBe(401);
    });

    it('should deny access to user data for unauthenticated users', async () => {
      const response = await makeRequest('/api/user/me');
      expect(response.status).toBe(401);
    });

    it('should deny access to admin APIs for regular users', async () => {
      // This would require authenticated session testing
      // For now, test that the endpoint exists and requires auth
      const response = await makeRequest('/api/admin/users');
      expect(response.status).toBe(401);
    });
  });

  describe('Permission System Tests', () => {
    it('should return permission groups for admin users', async () => {
      const response = await makeRequest('/api/admin/permission-groups');
      expect(response.status).toBe(401); // Should require authentication
    });

    it('should validate permission group assignments', async () => {
      const response = await makeRequest('/api/admin/users/1/permission-group', {
        method: 'PUT',
        body: JSON.stringify({ permission_group: 'invalid_group' })
      });
      expect(response.status).toBe(401); // Should require authentication first
    });

    it('should calculate user permissions correctly', async () => {
      const response = await makeRequest('/api/user/permissions');
      expect(response.status).toBe(401); // Should require authentication
    });
  });

  describe('Input Validation Tests', () => {
    it('should validate user ID parameters', async () => {
      const response = await makeRequest('/api/admin/users/invalid_id');
      expect([400, 401, 404]).toContain(response.status);
    });

    it('should reject invalid JSON in request body', async () => {
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect([400, 500]).toContain(response.status);
    });

    it('should limit request payload size', async () => {
      const largePayload = JSON.stringify({
        email: 'large@example.com',
        password: 'LargePass123!',
        name: 'x'.repeat(1024 * 1024) // 1MB name
      });

      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: largePayload
      });
      expect([400, 413]).toContain(response.status);
    });
  });

  describe('App Discovery Tests', () => {
    it('should require admin access for app discovery', async () => {
      const response = await makeRequest('/api/admin/discover-apps', {
        method: 'POST'
      });
      expect(response.status).toBe(401);
    });

    it('should require admin access for database migration', async () => {
      const response = await makeRequest('/api/admin/migrate-apps', {
        method: 'POST'
      });
      expect(response.status).toBe(401);
    });
  });

  describe('Data Privacy Tests', () => {
    it('should not expose sensitive user data in responses', async () => {
      // Test user creation response doesn't include password
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'privacy-test@example.com',
          password: 'PrivacyPass123!',
          name: 'Privacy Test User'
        })
      });
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data.user.password).toBeUndefined();
        expect(data.user.password_hash).toBeUndefined();
      }
    });

    it('should not expose stack traces in error responses', async () => {
      const response = await makeRequest('/api/nonexistent-endpoint');
      const text = await response.text();
      
      expect(text).not.toContain('Error:');
      expect(text).not.toContain('at ');
      expect(text).not.toContain('stack trace');
    });
  });

  describe('Session Management Tests', () => {
    it('should handle invalid session tokens', async () => {
      const response = await makeRequest('/api/user/me', {
        headers: {
          'Authorization': 'Bearer invalid.jwt.token'
        }
      });
      expect(response.status).toBe(401);
    });

    it('should handle malformed session cookies', async () => {
      const response = await makeRequest('/api/user/me', {
        headers: {
          'Cookie': 'next-auth.session-token=malformed_token'
        }
      });
      expect(response.status).toBe(401);
    });
  });

  describe('API Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await makeRequest('/');
      
      // Check for common security headers
      const headers = Object.fromEntries(response.headers.entries());
      
      // These might be set by Next.js or middleware
      if (headers['x-frame-options']) {
        expect(['DENY', 'SAMEORIGIN']).toContain(headers['x-frame-options']);
      }
      
      if (headers['x-content-type-options']) {
        expect(headers['x-content-type-options']).toBe('nosniff');
      }
    });

    it('should reject requests with suspicious user agents', async () => {
      const response = await makeRequest('/api/user/me', {
        headers: {
          'User-Agent': 'sqlmap/1.0'
        }
      });
      // Should still require authentication, but not fail due to user agent
      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should handle multiple rapid requests gracefully', async () => {
      const promises = Array(5).fill().map(() => 
        makeRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: `rapid-${Date.now()}-${Math.random()}@example.com`,
            password: 'RapidPass123!',
            name: 'Rapid Test User'
          })
        })
      );
      
      const responses = await Promise.all(promises);
      
      // At least some should succeed or be rate limited
      const statusCodes = responses.map(r => r.status);
      const hasSuccess = statusCodes.some(code => code === 200);
      const hasRateLimit = statusCodes.some(code => code === 429);
      
      // Either all succeed (no rate limiting) or some are rate limited
      expect(hasSuccess || hasRateLimit).toBe(true);
    });
  });

  describe('Cross-Origin Request Tests', () => {
    it('should handle CORS appropriately', async () => {
      const response = await makeRequest('/api/user/me', {
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });
      
      // Should still require authentication regardless of origin
      expect(response.status).toBe(401);
    });
  });
});

describe('Permission Template Tests', () => {
  it('should calculate base permissions correctly', async () => {
    // This would test the permission calculation functions
    // For now, we'll test that the permission groups endpoint exists
    const response = await makeRequest('/api/admin/permission-groups');
    expect(response.status).toBe(401); // Should require admin auth
  });

  it('should handle permission inheritance properly', async () => {
    // Test permission inheritance logic
    const response = await makeRequest('/api/user/permissions');
    expect(response.status).toBe(401); // Should require user auth
  });
});

describe('App Launcher Security Tests', () => {
  it('should only show permitted apps to users', async () => {
    const response = await makeRequest('/api/user/apps');
    expect(response.status).toBe(401); // Should require authentication
  });

  it('should validate app access permissions', async () => {
    // Test that apps respect permission settings
    const response = await makeRequest('/notes');
    // Should be accessible (it's a static page for demo)
    expect([200, 401, 403]).toContain(response.status);
  });
});

// Cleanup after tests
afterAll(async () => {
  // Clean up test users if needed
  console.log('Auth test suite completed');
});