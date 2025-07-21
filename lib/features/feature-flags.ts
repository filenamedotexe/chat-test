import { neon } from '@neondatabase/serverless';
import { unstable_cache, revalidateTag } from 'next/cache';

export interface FeatureFlag {
  feature_key: string;
  display_name: string;
  description?: string;
  default_enabled: boolean;
  rollout_percentage: number;
}

export interface UserFeatureOverride {
  feature_key: string;
  enabled: boolean;
  enabled_at: Date;
}

export interface FeatureFlagGroup {
  group_key: string;
  display_name: string;
  description?: string;
}

export class FeatureFlagService {
  private sql = neon(process.env.DATABASE_URL!);

  /**
   * Check if a feature is enabled for a specific user
   * Checks in order: user override > group assignment > rollout percentage > default
   */
  async isFeatureEnabled(userId: string | number, featureKey: string): Promise<boolean> {
    try {
      // Convert string ID to number if needed
      const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      
      // Check user-specific override first
      const userOverride = await this.sql`
        SELECT enabled FROM user_feature_flags 
        WHERE user_id = ${numericUserId} AND feature_key = ${featureKey}
      `;
      
      if (userOverride.length > 0) {
        return userOverride[0].enabled;
      }

      // Check if user is in a group that has this feature
      const groupFeature = await this.sql`
        SELECT 1 FROM user_feature_groups ufg
        JOIN feature_flag_group_assignments ffga ON ufg.group_key = ffga.group_key
        WHERE ufg.user_id = ${numericUserId} AND ffga.feature_key = ${featureKey}
        LIMIT 1
      `;
      
      if (groupFeature.length > 0) {
        return true;
      }

      // Get feature configuration
      const feature = await this.getFeatureConfig(featureKey);
      if (!feature) {
        return false; // Feature doesn't exist
      }

      // Check rollout percentage
      if (feature.rollout_percentage > 0 && feature.rollout_percentage < 100) {
        // Simple hash-based rollout (deterministic per user)
        const hash = this.hashUserId(userId.toString());
        const bucket = hash % 100;
        return bucket < feature.rollout_percentage;
      }

      return feature.default_enabled;
    } catch (error) {
      console.error('Error checking feature flag:', error);
      return false; // Fail closed
    }
  }

  /**
   * Get all enabled features for a user
   */
  async getUserFeatures(userId: string | number): Promise<string[]> {
    const getCachedFeatures = unstable_cache(
      async () => {
        // Convert string ID to number if needed
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        
        // Get user role
        const userResult = await this.sql`
          SELECT role FROM users WHERE id = ${numericUserId}
        `;
        const userRole = userResult[0]?.role || 'user';
        
        const result = await this.sql`
          WITH user_features AS (
            -- User-specific overrides
            SELECT feature_key, enabled FROM user_feature_flags WHERE user_id = ${numericUserId}
            UNION
            -- Features from groups
            SELECT ffga.feature_key, true as enabled
            FROM user_feature_groups ufg
            JOIN feature_flag_group_assignments ffga ON ufg.group_key = ffga.group_key
            WHERE ufg.user_id = ${numericUserId}
          ),
          all_features AS (
            SELECT 
              ff.feature_key,
              COALESCE(uf.enabled, ff.default_enabled) as is_enabled,
              ff.rollout_percentage
            FROM feature_flags ff
            LEFT JOIN user_features uf ON ff.feature_key = uf.feature_key
          )
          SELECT feature_key FROM all_features WHERE is_enabled = true
        `;
        
        // Also check rollout percentages for features without explicit overrides
        const allFeatures = await this.sql`
          SELECT feature_key, rollout_percentage, default_enabled 
          FROM feature_flags 
          WHERE feature_key NOT IN (
            SELECT feature_key FROM user_feature_flags WHERE user_id = ${numericUserId}
          )
        `;
        
        let enabledFeatures = result.map(r => r.feature_key);
        
        // Add features based on rollout percentage
        for (const feature of allFeatures) {
          if (feature.rollout_percentage > 0 && feature.rollout_percentage < 100) {
            const hash = this.hashUserId(userId.toString());
            const bucket = hash % 100;
            if (bucket < feature.rollout_percentage && !enabledFeatures.includes(feature.feature_key)) {
              enabledFeatures.push(feature.feature_key);
            }
          }
        }
        
        // For admins, return all features
        if (userRole === 'admin') {
          // Get all feature keys
          const allFeatureKeys = await this.sql`
            SELECT feature_key FROM feature_flags
          `;
          return allFeatureKeys.map(f => f.feature_key);
        }
        
        // Filter out admin-only features for non-admin users
        enabledFeatures = enabledFeatures.filter(f => f !== 'admin_panel');
        
        return enabledFeatures;
      },
      [`user-features-${userId}`],
      { revalidate: 60 } // Cache for 1 minute only
    );

    return getCachedFeatures();
  }

  /**
   * Get feature configuration
   */
  async getFeatureConfig(featureKey: string): Promise<FeatureFlag | null> {
    const getCachedConfig = unstable_cache(
      async () => {
        const result = await this.sql`
          SELECT * FROM feature_flags WHERE feature_key = ${featureKey}
        `;
        return result[0] as FeatureFlag || null;
      },
      [`feature-config-${featureKey}`],
      { revalidate: 3600 } // Cache for 1 hour
    );

    return getCachedConfig();
  }

  /**
   * Get all feature flags
   */
  async getAllFeatures(): Promise<FeatureFlag[]> {
    const getCachedFeatures = unstable_cache(
      async () => {
        const result = await this.sql`
          SELECT * FROM feature_flags ORDER BY display_name
        `;
        return result as FeatureFlag[];
      },
      ['all-features'],
      { revalidate: 3600 } // Cache for 1 hour
    );

    return getCachedFeatures();
  }

  /**
   * Update user feature override
   */
  async setUserFeatureOverride(userId: string | number, featureKey: string, enabled: boolean): Promise<void> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    await this.sql`
      INSERT INTO user_feature_flags (user_id, feature_key, enabled)
      VALUES (${numericUserId}, ${featureKey}, ${enabled})
      ON CONFLICT (user_id, feature_key)
      DO UPDATE SET enabled = ${enabled}, enabled_at = CURRENT_TIMESTAMP
    `;
    
    // Invalidate cache
    // Note: In production, you'd want to use a proper cache invalidation strategy
  }

  /**
   * Add user to feature group
   */
  async addUserToGroup(userId: string | number, groupKey: string): Promise<void> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    await this.sql`
      INSERT INTO user_feature_groups (user_id, group_key)
      VALUES (${numericUserId}, ${groupKey})
      ON CONFLICT (user_id, group_key) DO NOTHING
    `;
  }

  /**
   * Remove user from feature group
   */
  async removeUserFromGroup(userId: string | number, groupKey: string): Promise<void> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    await this.sql`
      DELETE FROM user_feature_groups 
      WHERE user_id = ${numericUserId} AND group_key = ${groupKey}
    `;
  }

  /**
   * Simple hash function for deterministic rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Admin functions
   */
  async updateFeatureFlag(
    featureKey: string, 
    updates: Partial<Omit<FeatureFlag, 'feature_key'>>
  ): Promise<void> {
    const setClause = [];
    const values = [];
    
    if ('display_name' in updates) {
      setClause.push(`display_name = $${values.length + 2}`);
      values.push(updates.display_name);
    }
    if ('description' in updates) {
      setClause.push(`description = $${values.length + 2}`);
      values.push(updates.description);
    }
    if ('default_enabled' in updates) {
      setClause.push(`default_enabled = $${values.length + 2}`);
      values.push(updates.default_enabled);
    }
    if ('rollout_percentage' in updates) {
      setClause.push(`rollout_percentage = $${values.length + 2}`);
      values.push(updates.rollout_percentage);
    }
    
    if (setClause.length === 0) return;
    
    const query = `
      UPDATE feature_flags 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE feature_key = $1
    `;
    
    await this.sql(query, [featureKey, ...values]);
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagService();