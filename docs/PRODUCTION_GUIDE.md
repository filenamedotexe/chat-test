# Production Deployment Guide

## Overview

This guide covers deploying the chat authentication system to production with enterprise-grade security, performance, and reliability considerations.

## Pre-Deployment Checklist

### Security Requirements
- [ ] **NEXTAUTH_SECRET**: Generate cryptographically secure secret (32+ characters)
- [ ] **Database Security**: Enable SSL, configure connection limits
- [ ] **HTTPS**: SSL certificate configured and enforced
- [ ] **Environment Variables**: All secrets stored securely (not in code)
- [ ] **Admin Password**: Default admin password changed
- [ ] **CORS Configuration**: Restrict to allowed origins
- [ ] **Rate Limiting**: Configure appropriate limits
- [ ] **Session Configuration**: Set secure session timeouts

### Performance Requirements
- [ ] **Database Indexing**: All performance indexes created
- [ ] **Connection Pooling**: Database connection limits configured
- [ ] **CDN Setup**: Static assets served via CDN
- [ ] **Caching Strategy**: Redis or similar for session caching
- [ ] **Load Testing**: System tested under expected load

### Monitoring Requirements
- [ ] **Health Checks**: Application health endpoints
- [ ] **Error Tracking**: Sentry or similar error monitoring
- [ ] **Performance Monitoring**: APM solution configured
- [ ] **Log Aggregation**: Centralized logging setup
- [ ] **Uptime Monitoring**: External uptime checks

## Environment Variables

### Required Production Variables

```bash
# Application
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
PORT=3000

# Security
NEXTAUTH_SECRET=your-cryptographically-secure-secret-here
# Generate with: openssl rand -base64 32

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
# Ensure SSL is enabled in production

# AI Services
OPENAI_API_KEY=sk-your-production-api-key

# Optional: External Services
REDIS_URL=redis://user:password@host:6379
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-new-relic-key
```

### Security Best Practices for Environment Variables

1. **Never commit secrets to version control**
2. **Use secret management services** (AWS Secrets Manager, Azure Key Vault, etc.)
3. **Rotate secrets regularly** (quarterly minimum)
4. **Use different secrets for each environment**
5. **Limit access to production secrets**

## Database Configuration

### Production Database Setup

#### Neon (Recommended)
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Optimize for production
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
```

#### Connection Pooling
```javascript
// For high-traffic deployments
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Database Backup Strategy

#### Automated Backups
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y/%m/%d)"
mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > $BACKUP_DIR/chat_system_$(date +%H%M).sql
gzip $BACKUP_DIR/chat_system_$(date +%H%M).sql

# Retain 30 days of backups
find /backups -type f -mtime +30 -delete
```

#### Point-in-Time Recovery
- Enable WAL archiving
- Configure automated PITR backups
- Test recovery procedures monthly

## Security Configuration

### Session Security

```typescript
// apps/base-template/app/api/auth/[...nextauth]/route.ts
export const authOptions: NextAuthOptions = {
  // Production session configuration
  session: {
    strategy: 'database',
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60,  // 1 hour
  },
  
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true, // HTTPS only
        domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : 'localhost'
      }
    }
  },
  
  // Security callbacks
  callbacks: {
    session: async ({ session, user }) => {
      // Log session access for audit
      console.log(`Session accessed: ${user.email} at ${new Date().toISOString()}`);
      return session;
    }
  }
};
```

### HTTPS and Security Headers

```javascript
// middleware.ts - Add security headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (if HTTPS)
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}
```

### Rate Limiting

```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  analytics: true,
});

// Usage in API routes
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { success, limit, reset, remaining } = await rateLimiter.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        }
      }
    );
  }
  
  // Continue with request
}
```

## Deployment Platforms

### Vercel (Recommended)

#### Build Configuration
```json
{
  "buildCommand": "turbo build --filter=@chat/base-template",
  "outputDirectory": "apps/base-template/.next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "apps/base-template/app/api/**": {
      "maxDuration": 30
    }
  }
}
```

#### Environment Variables Setup
1. Add all production environment variables in Vercel dashboard
2. Configure different values for preview and production branches
3. Use Vercel's secret scanning features

### AWS Deployment

#### ECS with Fargate
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build --filter=@chat/base-template

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/apps/base-template/.next ./apps/base-template/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm", "start", "--filter=@chat/base-template"]
```

#### ECS Task Definition
```json
{
  "family": "chat-auth-system",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "chat-app",
      "image": "your-ecr-repo/chat-auth:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:database-url"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:nextauth-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/chat-auth-system",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Monitoring and Logging

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    // Check database connectivity
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    // Check Redis connectivity (if used)
    // await redis.ping();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        // redis: 'healthy'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 503 }
    );
  }
}
```

### Error Monitoring with Sentry

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive information
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    return event;
  }
});

// Usage in API routes
export async function POST(req: Request) {
  try {
    // Your API logic
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
```

### Performance Monitoring

```typescript
// lib/metrics.ts
export class MetricsCollector {
  static async recordDatabaseQuery(operation: string, duration: number) {
    // Send to monitoring service
    console.log(`DB Query: ${operation} took ${duration}ms`);
  }
  
  static async recordAPICall(endpoint: string, method: string, duration: number, status: number) {
    // Send to monitoring service
    console.log(`API: ${method} ${endpoint} - ${status} (${duration}ms)`);
  }
  
  static async recordUserAction(userId: string, action: string) {
    // Send to analytics service
    console.log(`User ${userId}: ${action}`);
  }
}
```

## Performance Optimization

### Database Query Optimization

```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_chat_history_user_created 
ON chat_history(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_sessions_expires 
ON sessions(expires) WHERE expires > NOW();

-- Vacuum and analyze regularly
VACUUM ANALYZE chat_history;
VACUUM ANALYZE sessions;
```

### Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  static async getUserPermissions(userId: string) {
    const cacheKey = `user_permissions:${userId}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const permissions = await fetchUserPermissionsFromDB(userId);
    
    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(permissions));
    
    return permissions;
  }
  
  static async invalidateUserCache(userId: string) {
    await redis.del(`user_permissions:${userId}`);
  }
}
```

## Backup and Disaster Recovery

### Automated Backup System

```bash
#!/bin/bash
# backup-system.sh

set -e

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/chat-system"
S3_BUCKET="your-backup-bucket"

mkdir -p $BACKUP_DIR

# Database backup
echo "Starting database backup..."
pg_dump $DATABASE_URL > $BACKUP_DIR/database_$BACKUP_DATE.sql
gzip $BACKUP_DIR/database_$BACKUP_DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/database_$BACKUP_DATE.sql.gz s3://$S3_BUCKET/database/

# User data backup (if applicable)
echo "Backing up user data..."
# Add any additional backup procedures

# Cleanup old local backups (keep 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed successfully"
```

### Recovery Procedures

```bash
#!/bin/bash
# restore-system.sh

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

echo "WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Recovery cancelled"
    exit 1
fi

# Download from S3
aws s3 cp s3://your-backup-bucket/database/$BACKUP_FILE ./

# Restore database
gunzip -c $BACKUP_FILE | psql $DATABASE_URL

echo "Database restored successfully"
echo "Remember to:"
echo "1. Verify application functionality"
echo "2. Check user access"
echo "3. Update any changed secrets"
```

## Security Incident Response

### Incident Response Plan

1. **Detection**: Monitor for unusual activity
2. **Assessment**: Determine scope and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threats
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update procedures

### Emergency Procedures

```bash
# Emergency user lockdown
psql $DATABASE_URL -c "UPDATE users SET is_active = false WHERE role = 'user';"

# Emergency session invalidation
psql $DATABASE_URL -c "DELETE FROM sessions WHERE expires > NOW();"

# Emergency admin-only mode
psql $DATABASE_URL -c "UPDATE users SET is_active = false WHERE role != 'admin';"
```

### Security Monitoring Alerts

```typescript
// lib/security-monitor.ts
export class SecurityMonitor {
  static async checkSuspiciousActivity() {
    // Multiple failed logins
    const failedLogins = await db.query(`
      SELECT ip, COUNT(*) as attempts 
      FROM auth_logs 
      WHERE created_at > NOW() - INTERVAL '1 hour' 
      AND success = false 
      GROUP BY ip 
      HAVING COUNT(*) > 10
    `);
    
    if (failedLogins.length > 0) {
      await this.alertSecurityTeam('Multiple failed login attempts', failedLogins);
    }
    
    // Unusual permission changes
    const permissionChanges = await db.query(`
      SELECT * FROM audit_logs 
      WHERE action = 'permission_change' 
      AND created_at > NOW() - INTERVAL '1 hour'
    `);
    
    if (permissionChanges.length > 5) {
      await this.alertSecurityTeam('Unusual permission activity', permissionChanges);
    }
  }
  
  private static async alertSecurityTeam(message: string, data: any) {
    // Send to Slack, email, or incident management system
    console.error(`Security Alert: ${message}`, data);
  }
}
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily
- Monitor system health
- Check error rates
- Verify backup completion
- Review security logs

#### Weekly
- Database performance review
- User activity analysis
- Security patch assessment
- Capacity planning review

#### Monthly
- Full security audit
- Performance optimization
- Disaster recovery testing
- Documentation updates

### Database Maintenance

```sql
-- Weekly maintenance script
-- Analyze table statistics
ANALYZE;

-- Clean up expired sessions
DELETE FROM sessions WHERE expires < NOW() - INTERVAL '7 days';

-- Clean up old audit logs (keep 90 days)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Reindex if needed
REINDEX INDEX CONCURRENTLY idx_chat_history_user_id;

-- Check for orphaned records
SELECT COUNT(*) FROM user_app_permissions uap
LEFT JOIN users u ON uap.user_id = u.id
WHERE u.id IS NULL;
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Configure with session stickiness
2. **Database Read Replicas**: For read-heavy workloads
3. **Redis Cluster**: For session storage
4. **CDN**: For static assets

### Performance Thresholds

- **Response Time**: < 200ms for API calls
- **Database Queries**: < 100ms average
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%

### Auto-scaling Configuration

```yaml
# kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: chat-auth-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: chat-auth-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

This production guide ensures enterprise-grade deployment with proper security, monitoring, and disaster recovery procedures.