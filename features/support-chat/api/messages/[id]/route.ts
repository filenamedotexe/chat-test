import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import { supportChatQueries, sql } from '@/lib/database/queries/support-chat';

// Input validation schemas
const markReadSchema = z.object({
  readAt: z.string().datetime().optional(),
});

const paramsSchema = z.object({
  id: z.coerce.number(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: messageId } = paramsSchema.parse(params);
    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === 'admin';

    // Get the message to verify it exists and get conversation info
    const messages = await supportChatQueries.getConversationMessages(messageId);
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Get the conversation to check permissions
    const conversation = await supportChatQueries.getConversationById(message.conversation_id);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check permissions: user can mark messages as read in their conversations, admins in any
    if (!isAdmin && conversation.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse request body for any additional data
    const body = await req.json().catch(() => ({}));
    const updates = markReadSchema.parse(body);

    // Mark message as read
    await supportChatQueries.markMessagesAsRead(message.conversation_id, userId);

    return NextResponse.json({
      message: 'Message marked as read',
      messageId: messageId,
      readAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admins can delete messages
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: messageId } = paramsSchema.parse(params);

    // Get the message to verify it exists
    const messages = await supportChatQueries.getConversationMessages(messageId);
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // For now, we'll implement soft delete by updating the content
    // In a full implementation, you might add a 'deleted_at' column to the schema
    await sql`
      UPDATE support_messages 
      SET content = '[Message deleted by admin]',
          metadata_json = jsonb_set(
            COALESCE(metadata_json, '{}'), 
            '{deleted}', 
            'true'
          )
      WHERE id = ${messageId}
    `;

    return NextResponse.json({
      message: 'Message deleted successfully',
      messageId: messageId
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid message ID', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}