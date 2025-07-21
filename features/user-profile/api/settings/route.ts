import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Get user preferences
    const preferences = await sql(`
      SELECT * FROM user_preferences
      WHERE user_id = ${userId}
    `);

    // Get chat settings from user_preferences
    const userPrefs = await sql(`
      SELECT chat_settings FROM user_preferences
      WHERE user_id = ${userId}
    `);

    // Get login history count
    const loginHistoryCount = await sql(`
      SELECT COUNT(*) as count
      FROM login_history
      WHERE user_id = ${userId}
    `);

    // Get active API keys
    const apiKeys = await sql(`
      SELECT 
        id,
        name,
        key_preview,
        last_used,
        created_at,
        expires_at,
        is_active
      FROM api_keys
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY created_at DESC
    `);

    // Get activity stats
    const activityStats = await sql(`
      SELECT 
        COUNT(*) as total_activities,
        MAX(created_at) as last_activity
      FROM user_activity
      WHERE user_id = ${userId}
    `);

    // Get chat count (placeholder - chats table doesn't exist yet)
    const chatCount = [{ count: '0' }];

    // Default values if no settings exist
    const defaultPreferences = {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY',
      notifications_enabled: true,
      email_notifications: true,
      show_activity: true,
      data_collection: true,
      analytics_enabled: true,
      keyboard_shortcuts: true,
      developer_mode: false
    };

    const defaultChatSettings = {
      default_model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2048,
      save_history: true,
      share_conversations: false,
      code_execution: false,
      web_search: false,
      image_generation: false,
      auto_title: true,
      suggestion_mode: 'balanced'
    };

    // Extract chat settings from preferences or use defaults
    const chatSettings = userPrefs[0]?.chat_settings || (preferences[0]?.chat_settings) || defaultChatSettings;
    
    return NextResponse.json({
      preferences: preferences[0] || defaultPreferences,
      chatSettings: chatSettings,
      security: {
        loginHistoryCount: parseInt(loginHistoryCount[0].count || '0'),
        apiKeys: apiKeys,
        twoFactorEnabled: false // Would need to implement 2FA
      },
      activity: {
        totalActivities: parseInt(activityStats[0].total_activities || '0'),
        lastActivity: activityStats[0].last_activity,
        chatCount: parseInt(chatCount[0].count || '0')
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}