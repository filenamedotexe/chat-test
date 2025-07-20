import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      default_model,
      temperature,
      max_tokens,
      save_history,
      share_conversations,
      code_execution,
      web_search,
      image_generation,
      auto_title,
      suggestion_mode
    } = body;

    // Validate model
    const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet'];
    if (default_model && !validModels.includes(default_model)) {
      return NextResponse.json(
        { error: 'Invalid model selection' },
        { status: 400 }
      );
    }

    // Validate temperature
    if (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
      return NextResponse.json(
        { error: 'Temperature must be a number between 0 and 2' },
        { status: 400 }
      );
    }

    // Validate max_tokens
    if (max_tokens !== undefined && (typeof max_tokens !== 'number' || max_tokens < 1 || max_tokens > 32768)) {
      return NextResponse.json(
        { error: 'Max tokens must be between 1 and 32768' },
        { status: 400 }
      );
    }

    // Validate suggestion_mode
    if (suggestion_mode && !['none', 'balanced', 'creative', 'precise'].includes(suggestion_mode)) {
      return NextResponse.json(
        { error: 'Invalid suggestion mode' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Check if user preferences exist
    const existing = await sql(`
      SELECT user_id FROM user_preferences
      WHERE user_id = ${userId}
    `);

    // Build chat settings object - use same field names as frontend expects
    const chatSettingsData = {
      default_model: default_model || 'gpt-3.5-turbo',
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 2048,
      save_history: save_history ?? true,
      share_conversations: share_conversations ?? false,
      code_execution: code_execution ?? false,
      web_search: web_search ?? false,
      image_generation: image_generation ?? false,
      auto_title: auto_title ?? true,
      suggestion_mode: suggestion_mode || 'balanced'
    };

    if (existing.length > 0) {
      // Update existing preferences with new chat settings
      await sql(`
        UPDATE user_preferences
        SET chat_settings = '${JSON.stringify(chatSettingsData)}'::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `);
    } else {
      // Create new preferences with chat settings
      await sql(`
        INSERT INTO user_preferences (user_id, chat_settings)
        VALUES (${userId}, '${JSON.stringify(chatSettingsData)}'::jsonb)
      `);
    }

    // Log activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'chat_settings_updated', '${JSON.stringify(chatSettingsData)}'::jsonb)
    `);

    // Update user's last activity
    await sql(`
      UPDATE users 
      SET last_activity = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `);

    return NextResponse.json({
      success: true,
      message: 'Chat settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating chat settings:', error);
    return NextResponse.json(
      { error: 'Failed to update chat settings' },
      { status: 500 }
    );
  }
}