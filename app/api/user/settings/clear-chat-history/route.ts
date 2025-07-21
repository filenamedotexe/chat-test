import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { confirmation, chatIds } = body;

    // Validate confirmation
    if (!confirmation || confirmation !== 'CLEAR HISTORY') {
      return NextResponse.json(
        { error: 'Please type "CLEAR HISTORY" to confirm' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    let deletedChats = 0;
    let deletedMessages = 0;

    if (chatIds && Array.isArray(chatIds) && chatIds.length > 0) {
      // Clear specific chats
      for (const chatId of chatIds) {
        if (typeof chatId !== 'string') continue;

        // Verify ownership
        const chatOwnership = await sql(`
          SELECT id FROM chats 
          WHERE id = ${chatId} AND user_id = ${userId}
        `);

        if (chatOwnership.length === 0) continue;

        // Count messages before deletion
        const messageCount = await sql(`
          SELECT COUNT(*) as count FROM messages 
          WHERE chat_id = ${chatId}
        `);
        deletedMessages += parseInt(messageCount[0].count || '0');

        // Delete messages
        await sql(`
          DELETE FROM messages WHERE chat_id = ${chatId}
        `);

        // Delete chat
        await sql(`
          DELETE FROM chats WHERE id = ${chatId}
        `);

        deletedChats++;
      }
    } else {
      // Clear all chat history
      // Count messages before deletion
      const messageCount = await sql(`
        SELECT COUNT(*) as count 
        FROM messages m
        JOIN chats c ON m.chat_id = c.id
        WHERE c.user_id = ${userId}
      `);
      deletedMessages = parseInt(messageCount[0].count || '0');

      // Delete all messages from user's chats
      await sql(`
        DELETE FROM messages 
        WHERE chat_id IN (
          SELECT id FROM chats WHERE user_id = ${userId}
        )
      `);

      // Count and delete all chats
      const chatCount = await sql(`
        SELECT COUNT(*) as count FROM chats WHERE user_id = ${userId}
      `);
      deletedChats = parseInt(chatCount[0].count || '0');

      await sql(`
        DELETE FROM chats WHERE user_id = ${userId}
      `);
    }

    // Log activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'chat_history_cleared', ${JSON.stringify({ 
        deleted_chats: deletedChats,
        deleted_messages: deletedMessages,
        partial: chatIds ? true : false,
        timestamp: new Date().toISOString()
      })})
    `);

    // Update user's last activity
    await sql(`
      UPDATE users 
      SET last_activity = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `);

    return NextResponse.json({
      success: true,
      message: chatIds 
        ? `Cleared ${deletedChats} chat(s) with ${deletedMessages} message(s)`
        : 'All chat history cleared successfully',
      stats: {
        chats_deleted: deletedChats,
        messages_deleted: deletedMessages
      }
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}