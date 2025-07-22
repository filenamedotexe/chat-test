import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import { supportChatQueries } from '@/lib/database/queries/support-chat';

// Input validation schemas
const updateConversationSchema = z.object({
  status: z.enum(['open', 'closed', 'transferred', 'in_progress']).optional(),
  admin_id: z.coerce.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

const paramsSchema = z.object({
  id: z.coerce.number(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = paramsSchema.parse(params);
    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === 'admin';

    // Get conversation with messages
    const conversationData = await supportChatQueries.getConversationById(id);
    
    if (!conversationData) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check permissions: user can only see their own conversations, admins can see all
    if (!isAdmin && conversationData.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get messages for this conversation
    const messages = await supportChatQueries.getConversationMessages(id);

    // Mark messages as read for the current user
    await supportChatQueries.markMessagesAsRead(id, userId);

    const response = {
      conversation: {
        id: conversationData.id,
        subject: conversationData.subject,
        status: conversationData.status,
        priority: conversationData.priority,
        type: conversationData.type,
        createdAt: conversationData.created_at,
        updatedAt: conversationData.updated_at,
        context_json: conversationData.context_json,
        user: {
          id: conversationData.user_id,
          name: conversationData.user_name || 'User'
        },
        admin: conversationData.admin_id ? {
          id: conversationData.admin_id,
          name: conversationData.admin_name || 'Admin'
        } : null
      },
      messages: messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender_type: msg.sender_type,
        sender: {
          id: msg.sender_id,
          name: msg.sender_name || (msg.sender_type === 'admin' ? 'Admin' : 'User')
        },
        createdAt: msg.created_at,
        readAt: msg.read_at
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching conversation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid conversation ID', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = paramsSchema.parse(params);
    const body = await req.json();
    const updates = updateConversationSchema.parse(body);
    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === 'admin';

    // Get conversation to check permissions
    const conversationData = await supportChatQueries.getConversationById(id);
    
    if (!conversationData) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check permissions: only admins can update conversations, or users can close their own
    if (!isAdmin && conversationData.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Non-admin users can only close their own conversations
    if (!isAdmin && updates.status && updates.status !== 'closed') {
      return NextResponse.json(
        { error: 'Users can only close conversations' },
        { status: 403 }
      );
    }

    // Apply updates
    if (updates.status) {
      await supportChatQueries.updateConversationStatus(id, updates.status);
    }

    if (updates.admin_id && isAdmin) {
      await supportChatQueries.assignConversationToAdmin(id, updates.admin_id);
    }

    // Get updated conversation
    const updatedConversation = await supportChatQueries.getConversationById(id);

    if (!updatedConversation) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: updatedConversation.id,
        subject: updatedConversation.subject,
        status: updatedConversation.status,
        priority: updatedConversation.priority,
        type: updatedConversation.type,
        updated_at: updatedConversation.updated_at,
        admin: updatedConversation.admin_id ? {
          id: updatedConversation.admin_id,
          name: updatedConversation.admin_name || 'Admin'
        } : null
      }
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update conversation' },
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

    const { id } = paramsSchema.parse(params);
    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === 'admin';

    // Get conversation to check permissions
    const conversationData = await supportChatQueries.getConversationById(id);
    
    if (!conversationData) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check permissions: users can close their own conversations, admins can close any
    if (!isAdmin && conversationData.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Soft delete by marking as closed
    await supportChatQueries.updateConversationStatus(id, 'closed');

    return NextResponse.json(
      { message: 'Conversation closed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error closing conversation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid conversation ID', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to close conversation' },
      { status: 500 }
    );
  }
}