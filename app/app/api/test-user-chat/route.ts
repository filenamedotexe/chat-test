import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getServerSession } from '@chat/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const sql = neon(process.env.DATABASE_URL!);

    // Check if user_id column exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chat_history' 
      AND column_name = 'user_id'
    `;

    // Get recent chat history
    let recentChats;
    if (columnCheck.length > 0) {
      // user_id column exists
      recentChats = await sql`
        SELECT 
          ch.id,
          ch.user_message,
          ch.assistant_message,
          ch.user_id,
          ch.session_id,
          ch.created_at,
          u.email as user_email
        FROM chat_history ch
        LEFT JOIN users u ON ch.user_id = u.id
        ORDER BY ch.created_at DESC
        LIMIT 5
      `;
    } else {
      // user_id column doesn't exist
      recentChats = await sql`
        SELECT 
          id,
          user_message,
          assistant_message,
          session_id,
          created_at
        FROM chat_history
        ORDER BY created_at DESC
        LIMIT 5
      `;
    }

    return NextResponse.json({
      currentUser: session?.user || null,
      hasUserIdColumn: columnCheck.length > 0,
      recentChats: recentChats,
      message: columnCheck.length > 0 
        ? 'User ID column exists in chat_history table' 
        : 'User ID column NOT found in chat_history table'
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Failed to test', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}