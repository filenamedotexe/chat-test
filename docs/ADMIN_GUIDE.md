# Admin User Guide

## Getting Started

As an admin user, you have full access to the system including user management, app permissions, and chat history oversight. This guide covers all administrative functions.

## Default Admin Access

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `AdminPass123!`

> **Important**: Change the default password immediately after first login.

## Admin Dashboard Overview

Access the admin dashboard at `/admin` after logging in. The dashboard provides:

### System Overview
- **Total Users**: Current user count
- **Active Users**: Users active in the last 30 days  
- **Total Apps**: Registered applications
- **Total Chats**: Chat messages across all users

### Quick Actions
- **Discover Apps**: Scan for new applications
- **Create User**: Add new users manually
- **View Chat History**: Browse all conversations
- **Export Data**: Download system data

## User Management

### Viewing Users
Navigate to **Admin > Users** to see all system users with:
- User details (name, email, role)
- Account status (active/inactive)
- Permission groups
- Last login information
- Quick action buttons

### Creating Users
1. Click **"Add User"** button
2. Fill in user details:
   - **Email**: Must be unique
   - **Name**: Display name
   - **Password**: Temporary password (user should change)
   - **Role**: Admin or User
   - **Permission Group**: Choose from available templates
3. Click **"Create User"**

### Editing Users
1. Click **"Edit"** next to any user
2. Modify available fields:
   - **Name**: Update display name
   - **Role**: Change between Admin/User
   - **Permission Group**: Assign different template
   - **Status**: Activate/deactivate account
3. Click **"Save Changes"**

### User Roles

#### Admin Role
- Full system access
- Can manage all users and apps
- View all chat history
- Grant/revoke permissions
- Access admin dashboard

#### User Role  
- Limited to own data
- Can only access permitted apps
- Cannot see other users' data
- Cannot access admin functions

### Permission Groups

#### Available Templates
- **default_user**: Basic chat access only
- **notes_user_group**: Chat + Notes app access
- **analyst**: Analytics viewing permissions
- **power_user**: Multiple app access
- **admin**: Full system access

#### Managing Permission Groups
1. Go to **Admin > Permission Groups**
2. View all available templates
3. See permissions included in each group
4. Assign groups to users during creation/editing

## App Management

### App Discovery
The system can automatically discover apps in the `/apps` directory:

1. **Navigate to Admin > Apps**
2. **Click "Discover Apps"**
3. **Review found applications**
4. **Confirm registration**

### App Registry
View all registered apps with:
- App name and description
- Installation path
- Authentication requirements
- Default permissions
- Active status

### App Configuration
Each app requires an `app.config.json` file:

```json
{
  "name": "Notes Application",
  "slug": "notes",
  "description": "Personal note-taking app",
  "version": "1.0.0",
  "path": "/notes",
  "requires_auth": true,
  "default_permissions": ["notes.read", "notes.write"],
  "icon": "📝"
}
```

## Permission Management

### Individual User Permissions
1. **Go to Admin > Users**
2. **Click user name** for detailed view
3. **View "App Permissions" section**
4. **Grant/revoke access** to specific apps
5. **Set expiration dates** (optional)

### Bulk Permission Management
1. **Navigate to Admin > Permissions**
2. **View permissions matrix** (users vs apps)
3. **Click checkboxes** to grant/revoke access
4. **Use filters** to find specific users/apps
5. **Apply changes** instantly

### Permission Inheritance
- **Base Permissions**: Applied to all authenticated users
- **Group Permissions**: Additional permissions from permission groups
- **Individual Permissions**: Specific app access granted to users
- **Admin Override**: Admins always have full access

## Chat History Management

### Viewing All Conversations
1. **Navigate to Admin > Chat History**
2. **Browse all user conversations**
3. **Use filters**:
   - Filter by user
   - Filter by app
   - Date range selection
   - Search message content
4. **Expand messages** to view full conversations

### Chat Analytics
- **Total Messages**: System-wide message count
- **Messages Today/Week/Month**: Activity metrics
- **Most Active Users**: Top conversationalists
- **Messages by App**: Usage per application
- **Recent Activity**: Latest conversations

### Data Export
1. **Click "Export CSV"** for spreadsheet export
2. **Includes**:
   - User information
   - Message content
   - Timestamps
   - App context
   - Session details

### Privacy Considerations
- **User Privacy**: Respect user confidentiality
- **Data Handling**: Follow company privacy policies
- **Access Logging**: Admin access is logged
- **Data Retention**: Follow data retention requirements

## Security Management

### Security Monitoring
- **Failed Login Attempts**: Monitor authentication failures
- **Permission Violations**: Track unauthorized access attempts
- **Suspicious Activity**: Review unusual user behavior
- **SQL Injection Attempts**: Monitor for attack patterns

### Security Best Practices
1. **Regular Password Updates**: Change admin passwords frequently
2. **User Account Reviews**: Regularly audit user access
3. **Permission Audits**: Review app permissions quarterly
4. **Session Monitoring**: Watch for unusual session activity
5. **Data Backup**: Ensure regular database backups

### Running Security Audits
```bash
# Run security audit from base-template directory
npm run test:security
```

The audit checks:
- SQL injection prevention
- XSS protection
- Input validation
- Authentication bypass attempts
- Permission validation

## System Maintenance

### Performance Monitoring
1. **Monitor Response Times**: Check API endpoint performance
2. **Database Performance**: Watch query execution times
3. **User Load**: Track concurrent user sessions
4. **Memory Usage**: Monitor system resource usage

### Regular Maintenance Tasks

#### Daily
- Review security logs
- Check failed login attempts
- Monitor system performance

#### Weekly  
- Review user activity
- Check app permission changes
- Audit new user registrations

#### Monthly
- Full permission audit
- User account cleanup (inactive users)
- Database performance optimization
- Security system updates

### Database Maintenance
```bash
# Performance testing
node tests/performance-test.js

# Check database health in Neon dashboard
# Run VACUUM ANALYZE periodically for large datasets
```

## Troubleshooting Common Issues

### User Cannot Login
1. **Check account status** - Ensure user is active
2. **Verify credentials** - User may need password reset
3. **Check role assignment** - Ensure proper role is set
4. **Review session logs** - Look for authentication errors

### User Cannot Access App
1. **Check app registration** - Ensure app is in registry
2. **Verify permissions** - Check user has app access
3. **Review permission group** - May need group change
4. **Check app status** - App may be disabled

### Performance Issues
1. **Check database connection** - Verify DATABASE_URL
2. **Monitor query performance** - Look for slow queries
3. **Review user load** - Check concurrent sessions
4. **Check system resources** - Monitor memory/CPU usage

### Data Issues
1. **Verify database schema** - Ensure all tables exist
2. **Check data integrity** - Look for orphaned records
3. **Review migration logs** - Ensure all migrations ran
4. **Backup verification** - Test backup restoration

## Advanced Administration

### Custom Permission Templates
Create new permission groups by:
1. **Modifying permission templates** in codebase
2. **Adding to database** permission groups
3. **Testing inheritance** with test users
4. **Documenting permissions** for team reference

### API Access Management
- **Monitor API usage** per user
- **Rate limiting** configuration
- **API key management** (if implemented)
- **Endpoint security** monitoring

### Integration Management
- **OAuth providers** setup (if enabled)
- **External service** connections
- **Webhook** configurations
- **Third-party** integrations

## Getting Help

### Documentation
- **Authentication Guide**: `/docs/AUTHENTICATION.md`
- **API Documentation**: In-app API reference
- **Security Guide**: Security best practices

### Support Contacts
- **Technical Issues**: Contact development team
- **Security Concerns**: Contact security team
- **User Issues**: Help desk or support team

### Emergency Procedures
- **Security Breach**: Immediately disable affected accounts
- **System Outage**: Follow incident response procedures
- **Data Loss**: Restore from latest backup
- **Unauthorized Access**: Review access logs and revoke permissions