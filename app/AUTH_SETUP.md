# Authentication Setup Instructions

## Prerequisites
1. Make sure you have the server running:
   ```bash
   cd apps/base-template
   npm run dev
   ```

2. Ensure your database connection is configured in `.env.local`

## Setting Up Authentication

### Option 1: Using the setup script
```bash
# From the app directory
./setup-auth.js
```

### Option 2: Using curl
```bash
curl -X GET http://localhost:3000/api/setup-auth-database
```

### Option 3: Direct browser access
Visit: http://localhost:3000/api/setup-auth-database

## Default Credentials
After running the setup, you can login with:
- **Email**: admin@example.com
- **Password**: admin123

⚠️ **IMPORTANT**: Change these credentials in production!

## What the Setup Does
1. Creates all required authentication tables:
   - `users` - User accounts
   - `accounts` - NextAuth OAuth accounts
   - `sessions` - Active user sessions
   - `verification_tokens` - Email verification tokens
   - `apps` - Application registry
   - `user_app_permissions` - User permissions for apps

2. Creates indexes for performance

3. Sets up database triggers for `updated_at` timestamps

4. Inserts:
   - Default admin user (admin@example.com / admin123)
   - Base chat template app registration

## Troubleshooting

### "Failed to connect to server"
- Make sure the server is running on port 3000
- Check if another service is using port 3000
- Try ports 3001 or 3002 if 3000 is occupied

### "Failed to set up database"
- Check your DATABASE_URL in `.env.local`
- Ensure your database is accessible
- Check the server logs for detailed error messages

### Login still not working after setup
1. Check if the user was created:
   ```sql
   SELECT * FROM users WHERE email = 'admin@example.com';
   ```

2. Verify the server is using the correct database

3. Clear your browser cookies/session

4. Check the server logs for authentication errors

## Running Tests
After setting up authentication, you can run the test suite:

```bash
# Simple login test
./test-login-simple.js

# Full authentication test
./test-auth-100.js

# Complete auth test with all pages
./complete-auth-test.js
```

All tests expect the default admin@example.com user to exist.