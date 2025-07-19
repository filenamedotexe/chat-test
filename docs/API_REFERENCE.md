# API Reference

## Authentication

All API endpoints require authentication except for registration and NextAuth.js endpoints. Include the session token in requests via cookies (browser) or Authorization header.

### Authentication Headers
```bash
# Browser automatically includes session cookies
# For API clients:
Authorization: Bearer <session-token>
```

## Base URL
```
Development: http://localhost:3001
Production: https://yourdomain.com
```

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "User Name"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

**Error Responses:**
- `400`: Invalid input (email format, weak password, etc.)
- `409`: Email already exists
- `500`: Server error

### Login (NextAuth.js)
```http
POST /api/auth/signin
```
Use NextAuth.js signIn() function or direct form POST.

### Logout
```http
POST /api/auth/signout
```
Use NextAuth.js signOut() function.

## User Endpoints

### Get Current User
```http
GET /api/user/me
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "permission_group": "default_user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `401`: Not authenticated

### Get User's Apps
```http
GET /api/user/apps
```

**Response (200):**
```json
{
  "apps": [
    {
      "id": 1,
      "name": "Chat Application",
      "slug": "chat",
      "description": "AI-powered chat interface",
      "path": "/chat",
      "icon": "💬",
      "requires_auth": true
    }
  ]
}
```

### Update User Profile
```http
PUT /api/user/profile
```

**Request Body:**
```json
{
  "name": "Updated Name"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Updated Name",
    "role": "user"
  }
}
```

### Get User Permissions
```http
GET /api/user/permissions
```

**Response (200):**
```json
{
  "permissions": [
    "app.access",
    "profile.read",
    "profile.update",
    "chat.read",
    "chat.write"
  ],
  "apps": [
    {
      "slug": "chat",
      "name": "Chat Application",
      "permissions": ["chat.read", "chat.write"]
    }
  ]
}
```

## Admin Endpoints

### List All Users
```http
GET /api/admin/users
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `search`: Search term for email/name
- `role`: Filter by role (admin, user)
- `active`: Filter by status (true, false)

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "permission_group": "default_user",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "last_login": "2024-01-02T12:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 2
}
```

### Update User
```http
PUT /api/admin/users/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "admin",
  "permission_group": "power_user",
  "is_active": false
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Updated Name",
    "role": "admin",
    "permission_group": "power_user",
    "is_active": false
  }
}
```

### Get Chat History
```http
GET /api/admin/chat-history
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `user_id`: Filter by user ID
- `app_id`: Filter by app ID
- `start_date`: Filter from date (ISO 8601)
- `end_date`: Filter to date (ISO 8601)
- `search`: Search message content

**Response (200):**
```json
{
  "chats": [
    {
      "id": 1,
      "user_message": "Hello, how are you?",
      "assistant_message": "I'm doing well, thank you!",
      "created_at": "2024-01-01T12:00:00Z",
      "session_id": "session-123",
      "user": {
        "id": 1,
        "name": "User Name",
        "email": "user@example.com"
      },
      "app": {
        "id": 1,
        "name": "Chat Application",
        "slug": "chat"
      }
    }
  ],
  "total": 500,
  "page": 1,
  "totalPages": 25
}
```

### Export Chat History
```http
GET /api/admin/chat-history/export
```

**Query Parameters:** Same as chat history endpoint

**Response:** CSV file download with chat data

### Get Permission Groups
```http
GET /api/admin/permission-groups
```

**Response (200):**
```json
{
  "groups": [
    {
      "id": "default_user",
      "name": "Default User",
      "description": "Basic user permissions",
      "permissions": ["app.access", "profile.read", "profile.update"],
      "inheritance": "base"
    }
  ]
}
```

### Discover Apps
```http
POST /api/admin/discover-apps
```

**Response (200):**
```json
{
  "success": true,
  "discovered": [
    {
      "name": "Notes App",
      "slug": "notes",
      "path": "/notes",
      "status": "registered"
    }
  ],
  "errors": []
}
```

### Grant App Permission
```http
POST /api/admin/permissions
```

**Request Body:**
```json
{
  "user_id": 1,
  "app_id": 2,
  "expires_at": "2024-12-31T23:59:59Z"  // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "permission": {
    "user_id": 1,
    "app_id": 2,
    "granted_by": 3,
    "granted_at": "2024-01-01T12:00:00Z",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

### Revoke App Permission
```http
DELETE /api/admin/permissions
```

**Request Body:**
```json
{
  "user_id": 1,
  "app_id": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Permission revoked successfully"
}
```

## Chat Endpoints

### Send Chat Message
```http
POST /api/chat-langchain
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "memoryType": "buffer",
  "maxTokenLimit": 4000,
  "sessionId": "session-123",
  "promptTemplateId": "helpful"
}
```

**Response:** Server-Sent Events (SSE) stream with message chunks

### Get Available Prompts
```http
GET /api/prompts
```

**Response (200):**
```json
{
  "prompts": [
    {
      "id": "helpful",
      "name": "Helpful Assistant",
      "description": "A helpful AI assistant",
      "prompt": "You are a helpful AI assistant...",
      "icon": "🤖"
    }
  ]
}
```

### Get Chat Memory
```http
GET /api/memory
```

**Query Parameters:**
- `sessionId`: Session identifier
- `action`: "history" or "clear"

**Response (200):**
```json
{
  "history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant", 
      "content": "Hi there!"
    }
  ]
}
```

## Setup Endpoints

### Setup Database
```http
POST /api/setup-auth-database
```

**Response (200):**
```json
{
  "success": true,
  "message": "Database setup completed",
  "admin_created": true,
  "tables_created": [
    "users",
    "accounts", 
    "sessions",
    "apps",
    "user_app_permissions"
  ]
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., duplicate email)
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error

## Rate Limiting

### Limits
- **Authentication endpoints**: 5 requests per minute per IP
- **Chat endpoints**: 30 requests per minute per user
- **Admin endpoints**: 100 requests per minute per admin
- **General API**: 60 requests per minute per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## Authentication Flow

### For Web Applications
1. Use NextAuth.js `signIn()` function
2. Session automatically managed via cookies
3. Use `useSession()` hook to access user data
4. Middleware automatically protects routes

### For API Clients
1. POST to `/api/auth/signin` with credentials
2. Extract session token from response cookies
3. Include token in Authorization header for subsequent requests
4. Handle token expiration and refresh

## Example Usage

### JavaScript/TypeScript
```typescript
// Get current user
const response = await fetch('/api/user/me', {
  credentials: 'include'  // Include cookies
});
const { user } = await response.json();

// Update user profile
const updateResponse = await fetch('/api/user/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'New Name'
  })
});
```

### cURL Examples
```bash
# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","name":"Test User"}'

# Get user info (with session cookie)
curl -X GET http://localhost:3001/api/user/me \
  -H "Cookie: next-auth.session-token=<session-token>"

# Admin: List users
curl -X GET http://localhost:3001/api/admin/users \
  -H "Cookie: next-auth.session-token=<admin-session-token>"
```

## Security Considerations

### Input Validation
All endpoints perform comprehensive input validation:
- Email format and SQL injection prevention
- Password strength requirements
- XSS protection via DOMPurify
- Parameter type and range validation

### CSRF Protection
- NextAuth.js provides built-in CSRF protection
- All state-changing requests require valid CSRF tokens
- Use NextAuth.js client methods for authentication

### Session Security
- Secure, HttpOnly cookies
- Session token rotation
- Configurable session timeout
- Automatic session cleanup

### Permission Checking
- All admin endpoints verify admin role
- User endpoints check resource ownership
- App access verified against permissions
- Server-side validation for all operations