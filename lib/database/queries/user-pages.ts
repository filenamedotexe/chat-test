// User Pages specific database queries
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);


// User Activity queries
export const userActivityQueries = {
  async logActivity(data: {
    user_id: number;
    activity_type: string;
    activity_data?: any;
  }) {
    await sql`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${data.user_id}, ${data.activity_type}, ${JSON.stringify(data.activity_data || {})})
    `;
  },

  async getRecentActivity(userId: number, limit = 20) {
    return await sql`
      SELECT * FROM user_activity
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  },

  async getActivityStats(userId: number) {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        MAX(created_at) as last_activity
      FROM user_activity
      WHERE user_id = ${userId}
    `;
    return stats[0];
  }
};

// User Preferences queries
export const userPreferencesQueries = {
  async getPreferences(userId: number) {
    const result = await sql`
      SELECT * FROM user_preferences
      WHERE user_id = ${userId}
    `;
    return result[0];
  },

  async upsertPreferences(userId: number, preferences: any) {
    const result = await sql`
      INSERT INTO user_preferences (user_id, theme, language, notifications_enabled, email_notifications, show_activity, data_collection, analytics_enabled, keyboard_shortcuts, developer_mode)
      VALUES (${userId}, ${preferences.theme || 'system'}, ${preferences.language || 'en'}, ${preferences.notifications_enabled ?? true}, ${preferences.email_notifications ?? true}, ${preferences.show_activity ?? true}, ${preferences.data_collection ?? true}, ${preferences.analytics_enabled ?? true}, ${preferences.keyboard_shortcuts ?? true}, ${preferences.developer_mode ?? false})
      ON CONFLICT (user_id) DO UPDATE SET
        theme = EXCLUDED.theme,
        language = EXCLUDED.language,
        notifications_enabled = EXCLUDED.notifications_enabled,
        email_notifications = EXCLUDED.email_notifications,
        show_activity = EXCLUDED.show_activity,
        data_collection = EXCLUDED.data_collection,
        analytics_enabled = EXCLUDED.analytics_enabled,
        keyboard_shortcuts = EXCLUDED.keyboard_shortcuts,
        developer_mode = EXCLUDED.developer_mode,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  }
};

// Chat Settings queries
export const chatSettingsQueries = {
  async getSettings(userId: number) {
    const result = await sql`
      SELECT * FROM chat_settings
      WHERE user_id = ${userId}
    `;
    return result[0];
  },

  async upsertSettings(userId: number, settings: any) {
    const result = await sql`
      INSERT INTO chat_settings (user_id, default_model, temperature, max_tokens, save_history, share_conversations, code_execution, web_search, image_generation, auto_title, suggestion_mode)
      VALUES (${userId}, ${settings.default_model || 'gpt-4'}, ${settings.temperature ?? 0.7}, ${settings.max_tokens ?? 2048}, ${settings.save_history ?? true}, ${settings.share_conversations ?? false}, ${settings.code_execution ?? false}, ${settings.web_search ?? false}, ${settings.image_generation ?? false}, ${settings.auto_title ?? true}, ${settings.suggestion_mode || 'balanced'})
      ON CONFLICT (user_id) DO UPDATE SET
        default_model = EXCLUDED.default_model,
        temperature = EXCLUDED.temperature,
        max_tokens = EXCLUDED.max_tokens,
        save_history = EXCLUDED.save_history,
        share_conversations = EXCLUDED.share_conversations,
        code_execution = EXCLUDED.code_execution,
        web_search = EXCLUDED.web_search,
        image_generation = EXCLUDED.image_generation,
        auto_title = EXCLUDED.auto_title,
        suggestion_mode = EXCLUDED.suggestion_mode,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  }
};

// App Favorites queries
export const appFavoritesQueries = {
  async addFavorite(userId: number, appId: number) {
    await sql`
      INSERT INTO user_app_favorites (user_id, app_id)
      VALUES (${userId}, ${appId})
      ON CONFLICT (user_id, app_id) DO NOTHING
    `;
  },

  async removeFavorite(userId: number, appId: number) {
    await sql`
      DELETE FROM user_app_favorites
      WHERE user_id = ${userId} AND app_id = ${appId}
    `;
  },

  async getUserFavorites(userId: number) {
    return await sql`
      SELECT a.*, uaf.added_at
      FROM user_app_favorites uaf
      JOIN apps a ON a.id = uaf.app_id
      WHERE uaf.user_id = ${userId} AND a.is_active = true
      ORDER BY uaf.added_at DESC
    `;
  }
};

// App Access Requests queries
export const appAccessRequestQueries = {
  async createRequest(data: {
    user_id: number;
    app_id: number;
    reason: string;
  }) {
    const result = await sql`
      INSERT INTO app_access_requests (user_id, app_id, reason)
      VALUES (${data.user_id}, ${data.app_id}, ${data.reason})
      RETURNING *
    `;
    return result[0];
  },

  async getUserRequests(userId: number) {
    return await sql`
      SELECT aar.*, a.name as app_name, a.slug as app_slug, a.icon as app_icon
      FROM app_access_requests aar
      JOIN apps a ON a.id = aar.app_id
      WHERE aar.user_id = ${userId}
      ORDER BY aar.requested_at DESC
    `;
  },

  async getPendingRequests() {
    return await sql`
      SELECT aar.*, a.name as app_name, u.name as user_name, u.email as user_email
      FROM app_access_requests aar
      JOIN apps a ON a.id = aar.app_id
      JOIN users u ON u.id = aar.user_id
      WHERE aar.status = 'pending'
      ORDER BY aar.requested_at ASC
    `;
  },

  async reviewRequest(requestId: number, reviewerId: number, status: 'approved' | 'rejected', notes?: string) {
    await sql`
      UPDATE app_access_requests
      SET status = ${status}, 
          reviewed_at = CURRENT_TIMESTAMP, 
          reviewed_by = ${reviewerId},
          admin_notes = ${notes}
      WHERE id = ${requestId}
    `;
  }
};

// App Launch History queries
export const appLaunchHistoryQueries = {
  async recordLaunch(userId: number, appId: number) {
    await sql`
      INSERT INTO app_launch_history (user_id, app_id)
      VALUES (${userId}, ${appId})
    `;
  },

  async getRecentLaunches(userId: number, limit = 10) {
    return await sql`
      SELECT DISTINCT ON (a.id) 
        a.*, 
        alh.launched_at as last_launched
      FROM app_launch_history alh
      JOIN apps a ON a.id = alh.app_id
      WHERE alh.user_id = ${userId} AND a.is_active = true
      ORDER BY a.id, alh.launched_at DESC
      LIMIT ${limit}
    `;
  },

  async getUserLaunchStats(userId: number) {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_launches,
        COUNT(DISTINCT app_id) as unique_apps,
        COUNT(DISTINCT DATE(launched_at)) as active_days
      FROM app_launch_history
      WHERE user_id = ${userId}
    `;
    return stats[0];
  }
};

// Login History queries
export const loginHistoryQueries = {
  async recordLogin(data: {
    user_id: number;
    ip_address?: string;
    user_agent?: string;
    location?: string;
    success: boolean;
  }) {
    await sql`
      INSERT INTO login_history (user_id, ip_address, user_agent, location, success)
      VALUES (${data.user_id}, ${data.ip_address}, ${data.user_agent}, ${data.location}, ${data.success})
    `;
  },

  async getUserLoginHistory(userId: number, limit = 50) {
    return await sql`
      SELECT * FROM login_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  },

  async getFailedLoginAttempts(userId: number, hours = 24) {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM login_history
      WHERE user_id = ${userId} 
        AND success = false 
        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
    `;
    return parseInt(result[0].count || '0');
  }
};

// API Keys queries
export const apiKeyQueries = {
  async createKey(data: {
    user_id: number;
    name: string;
    key_hash: string;
    key_preview: string;
    expires_at?: Date;
  }) {
    const result = await sql`
      INSERT INTO api_keys (user_id, name, key_hash, key_preview, expires_at)
      VALUES (${data.user_id}, ${data.name}, ${data.key_hash}, ${data.key_preview}, ${data.expires_at})
      RETURNING *
    `;
    return result[0];
  },

  async getUserKeys(userId: number) {
    return await sql`
      SELECT id, name, key_preview, last_used, created_at, expires_at, is_active
      FROM api_keys
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
  },

  async revokeKey(keyId: number, userId: number) {
    await sql`
      UPDATE api_keys
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${keyId} AND user_id = ${userId}
    `;
  },

  async updateKeyLastUsed(keyHash: string) {
    await sql`
      UPDATE api_keys
      SET last_used = CURRENT_TIMESTAMP
      WHERE key_hash = ${keyHash} AND is_active = true
    `;
  }
};