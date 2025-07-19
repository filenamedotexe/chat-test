import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';

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

    // Check if chat settings exist
    const existing = await sql(`
      SELECT id FROM chat_settings
      WHERE user_id = ${userId}
    `);

    const chatSettingsData = {
      ...(default_model !== undefined && { default_model }),
      ...(temperature !== undefined && { temperature }),
      ...(max_tokens !== undefined && { max_tokens }),
      ...(save_history !== undefined && { save_history }),
      ...(share_conversations !== undefined && { share_conversations }),
      ...(code_execution !== undefined && { code_execution }),
      ...(web_search !== undefined && { web_search }),
      ...(image_generation !== undefined && { image_generation }),
      ...(auto_title !== undefined && { auto_title }),
      ...(suggestion_mode !== undefined && { suggestion_mode })
    };

    if (existing.length > 0) {
      // Update existing settings
      const updateFields = Object.entries(chatSettingsData)
        .map(([key, value]) => {
          if (typeof value === 'boolean' || typeof value === 'number') {
            return `${key} = ${value}`;
          } else {
            return `${key} = '${value}'`;
          }
        })
        .join(', ');

      if (updateFields) {
        await sql(`
          UPDATE chat_settings
          SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `);
      }
    } else {
      // Create new settings
      const fields = ['user_id', ...Object.keys(chatSettingsData)];
      const values = [userId, ...Object.values(chatSettingsData)];
      
      const fieldString = fields.join(', ');
      const valueString = values.map((v, i) => {
        if (i === 0) return v; // user_id is a number
        if (typeof v === 'boolean' || typeof v === 'number') return v;
        return `'${v}'`;
      }).join(', ');

      await sql(`
        INSERT INTO chat_settings (${fieldString})
        VALUES (${valueString})
      `);
    }

    // Log activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'chat_settings_updated', ${JSON.stringify(chatSettingsData)})
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