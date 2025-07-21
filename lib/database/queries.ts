// Database query utilities
import { neon } from '@neondatabase/serverless';
import type { User, App, UserAppPermission, ChatHistory } from './types';

const sql = neon(process.env.DATABASE_URL!);

// Export user pages queries
export * from './queries/user-pages';

// Export support chat queries
export * from './queries/support-chat';

// User queries
export const userQueries = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users 
      WHERE email = ${email} AND is_active = true
    ` as User[];
    return result[0] || null;
  },

  async findById(id: number): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users 
      WHERE id = ${id}
    ` as User[];
    return result[0] || null;
  },

  async create(data: Partial<User>): Promise<User> {
    const result = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${data.email}, ${data.password_hash}, ${data.name}, ${data.role || 'user'})
      RETURNING *
    ` as User[];
    return result[0];
  },

  async update(id: number, data: Partial<User>): Promise<User> {
    const result = await sql`
      UPDATE users 
      SET 
        email = COALESCE(${data.email}, email),
        name = COALESCE(${data.name}, name),
        role = COALESCE(${data.role}, role),
        is_active = COALESCE(${data.is_active}, is_active)
      WHERE id = ${id}
      RETURNING *
    ` as User[];
    return result[0];
  },

  async listAll(): Promise<User[]> {
    const result = await sql`
      SELECT id, email, name, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    return result as User[];
  },

  async getAllUsers(): Promise<User[]> {
    return userQueries.listAll();
  },

  async updateUser(id: number, data: Partial<User>): Promise<User | null> {
    try {
      return await userQueries.update(id, data);
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }
};

// App queries
export const appQueries = {
  async findBySlug(slug: string): Promise<App | null> {
    const result = await sql`
      SELECT * FROM apps 
      WHERE slug = ${slug} AND is_active = true
    ` as App[];
    return result[0] || null;
  },

  async listActive(): Promise<App[]> {
    const result = await sql`
      SELECT * FROM apps 
      WHERE is_active = true
      ORDER BY name
    `;
    return result as App[];
  },

  async create(data: Partial<App>): Promise<App> {
    const result = await sql`
      INSERT INTO apps (name, slug, description, path, icon, requires_auth)
      VALUES (${data.name}, ${data.slug}, ${data.description}, ${data.path}, ${data.icon}, ${data.requires_auth ?? true})
      RETURNING *
    ` as App[];
    return result[0];
  },

  async getAllApps(): Promise<App[]> {
    const result = await sql`
      SELECT * FROM apps
      ORDER BY name
    `;
    return result as App[];
  },

  async upsertApp(appData: Partial<App>): Promise<App> {
    const result = await sql`
      INSERT INTO apps (name, slug, description, path, icon, requires_auth, version, dependencies, author, license, repository, port, dev_command, build_command, start_command, last_scanned)
      VALUES (
        ${appData.name},
        ${appData.slug},
        ${appData.description || ''},
        ${appData.path || '/'},
        ${appData.icon || '📱'},
        ${appData.requires_auth ?? true},
        ${appData.version || '1.0.0'},
        ${JSON.stringify(appData.dependencies || [])},
        ${appData.author || ''},
        ${appData.license || ''},
        ${appData.repository || ''},
        ${appData.port || 3000},
        ${appData.dev_command || 'npm run dev'},
        ${appData.build_command || 'npm run build'},
        ${appData.start_command || 'npm run start'},
        NOW()
      )
      ON CONFLICT (slug) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        path = EXCLUDED.path,
        icon = EXCLUDED.icon,
        requires_auth = EXCLUDED.requires_auth,
        version = EXCLUDED.version,
        dependencies = EXCLUDED.dependencies,
        author = EXCLUDED.author,
        license = EXCLUDED.license,
        repository = EXCLUDED.repository,
        port = EXCLUDED.port,
        dev_command = EXCLUDED.dev_command,
        build_command = EXCLUDED.build_command,
        start_command = EXCLUDED.start_command,
        last_scanned = NOW(),
        updated_at = NOW()
      RETURNING *
    ` as App[];
    return result[0];
  },

  async markAppInactive(slug: string): Promise<void> {
    await sql`
      UPDATE apps 
      SET is_active = false, updated_at = NOW()
      WHERE slug = ${slug}
    `;
  }
};

// Permission queries
export const permissionQueries = {
  async hasPermission(userId: number, appSlug: string): Promise<boolean> {
    const result = await sql`
      SELECT 1
      FROM user_app_permissions uap
      JOIN apps a ON a.id = uap.app_id
      WHERE uap.user_id = ${userId}
        AND a.slug = ${appSlug}
        AND a.is_active = true
        AND (uap.expires_at IS NULL OR uap.expires_at > CURRENT_TIMESTAMP)
    `;
    return result.length > 0;
  },

  async getUserApps(userId: number): Promise<App[]> {
    const result = await sql`
      SELECT a.*
      FROM apps a
      JOIN user_app_permissions uap ON a.id = uap.app_id
      WHERE uap.user_id = ${userId}
        AND a.is_active = true
        AND (uap.expires_at IS NULL OR uap.expires_at > CURRENT_TIMESTAMP)
      ORDER BY a.name
    `;
    return result as App[];
  },

  async grantPermission(userId: number, appId: number, grantedBy: number): Promise<void> {
    await sql`
      INSERT INTO user_app_permissions (user_id, app_id, granted_by)
      VALUES (${userId}, ${appId}, ${grantedBy})
      ON CONFLICT (user_id, app_id) 
      DO UPDATE SET 
        granted_by = ${grantedBy},
        granted_at = CURRENT_TIMESTAMP
    `;
  },

  async revokePermission(userId: number, appId: number): Promise<void> {
    await sql`
      DELETE FROM user_app_permissions
      WHERE user_id = ${userId} AND app_id = ${appId}
    `;
  },

  async getUserPermissions(userId: number): Promise<UserAppPermission[]> {
    const result = await sql`
      SELECT * FROM user_app_permissions
      WHERE user_id = ${userId}
    `;
    return result as UserAppPermission[];
  },

  async getUserPermissionGroup(userId: number): Promise<string | null> {
    const result = await sql`
      SELECT permission_group FROM users
      WHERE id = ${userId}
    `;
    return result[0]?.permission_group || null;
  },

  async setUserPermissionGroup(userId: number, groupId: string): Promise<void> {
    await sql`
      UPDATE users 
      SET permission_group = ${groupId}, updated_at = NOW()
      WHERE id = ${userId}
    `;
  },

  async getEffectiveUserPermissions(userId: number, appSlug?: string): Promise<string[]> {
    // Get user role and permission group
    const user = await userQueries.findById(userId);
    if (!user) return [];

    const { calculateUserPermissions } = await import('./permission-templates');
    return calculateUserPermissions(user.role, user.permission_group || undefined, appSlug);
  },

  async checkUserPermission(userId: number, permission: string, appSlug?: string): Promise<boolean> {
    const userPermissions = await permissionQueries.getEffectiveUserPermissions(userId, appSlug);
    const { hasPermission } = await import('./permission-templates');
    return hasPermission(userPermissions, permission);
  }
};

// Chat history queries
export const chatQueries = {
  async saveMessage(data: {
    user_message: string;
    assistant_message: string;
    session_id?: string;
    metadata?: Record<string, any>;
    user_id?: number;
    app_id?: number;
  }): Promise<ChatHistory> {
    const result = await sql`
      INSERT INTO chat_history (
        user_message, 
        assistant_message, 
        session_id, 
        metadata, 
        user_id, 
        app_id
      )
      VALUES (
        ${data.user_message}, 
        ${data.assistant_message}, 
        ${data.session_id}, 
        ${data.metadata || {}}, 
        ${data.user_id}, 
        ${data.app_id}
      )
      RETURNING *
    ` as ChatHistory[];
    return result[0];
  },

  async getUserHistory(userId: number, limit = 50): Promise<ChatHistory[]> {
    const result = await sql`
      SELECT * FROM chat_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result as ChatHistory[];
  },

  async getSessionHistory(sessionId: string): Promise<ChatHistory[]> {
    const result = await sql`
      SELECT * FROM chat_history
      WHERE session_id = ${sessionId}
      ORDER BY created_at ASC
    `;
    return result as ChatHistory[];
  },

  async getUserChats(userId: number, limit = 10): Promise<ChatHistory[]> {
    const result = await sql`
      SELECT * FROM chat_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result as ChatHistory[];
  },

  async getUserChatCount(userId: number): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as count FROM chat_history
      WHERE user_id = ${userId}
    `;
    return parseInt(result[0].count || '0');
  }
};