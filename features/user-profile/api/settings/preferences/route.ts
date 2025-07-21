import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
      theme,
      language,
      timezone,
      date_format,
      notifications_enabled,
      email_notifications,
      show_activity,
      data_collection,
      analytics_enabled,
      keyboard_shortcuts,
      developer_mode
    } = body;

    // Validate theme
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme. Must be light, dark, or system' },
        { status: 400 }
      );
    }

    // Validate language
    if (language && typeof language !== 'string') {
      return NextResponse.json(
        { error: 'Invalid language format' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Check if preferences exist
    const existing = await sql(`
      SELECT user_id FROM user_preferences
      WHERE user_id = ${userId}
    `);

    const preferencesData = {
      ...(theme !== undefined && { theme }),
      ...(language !== undefined && { language }),
      ...(timezone !== undefined && { timezone }),
      ...(date_format !== undefined && { date_format }),
      ...(notifications_enabled !== undefined && { notifications_enabled }),
      ...(email_notifications !== undefined && { email_notifications }),
      ...(show_activity !== undefined && { show_activity }),
      ...(data_collection !== undefined && { data_collection }),
      ...(analytics_enabled !== undefined && { analytics_enabled }),
      ...(keyboard_shortcuts !== undefined && { keyboard_shortcuts }),
      ...(developer_mode !== undefined && { developer_mode })
    };

    if (existing.length > 0) {
      // Update existing preferences
      const updateFields = Object.entries(preferencesData)
        .map(([key, value]) => {
          if (typeof value === 'boolean') {
            return `${key} = ${value}`;
          } else {
            return `${key} = '${value}'`;
          }
        })
        .join(', ');

      if (updateFields) {
        await sql(`
          UPDATE user_preferences
          SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `);
      }
    } else {
      // Create new preferences
      const fields = ['user_id', ...Object.keys(preferencesData)];
      const values = [userId, ...Object.values(preferencesData)];
      
      const fieldString = fields.join(', ');
      const valueString = values.map((v, i) => {
        if (i === 0) return v; // user_id is a number
        if (typeof v === 'boolean') return v;
        return `'${v}'`;
      }).join(', ');

      await sql(`
        INSERT INTO user_preferences (${fieldString})
        VALUES (${valueString})
      `);
    }

    // Log activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'preferences_updated', '${JSON.stringify(preferencesData)}'::jsonb)
    `);

    // Update user's last activity
    await sql(`
      UPDATE users 
      SET last_activity = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `);

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}