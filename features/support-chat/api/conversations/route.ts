import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import { supportChatQueries } from '@/lib/database/queries/support-chat';

// Input validation schemas
const createConversationSchema = z.object({
  subject: z.string().min(1).max(255),
  initialMessage: z.string().min(1).max(10000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  context: z.any().optional(), // For AI handoff data
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z.enum(['open', 'closed', 'transferred', 'in_progress']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, status } = paginationSchema.parse(queryParams);

    // Calculate offset from page
    const offset = (page - 1) * limit;

    // Get user's conversations
    const conversations = await supportChatQueries.getUserConversations(
      parseInt(session.user.id), 
      status,
      limit, 
      offset
    );

    // Calculate pagination info
    const total = conversations.length; // Note: This should be from a count query in production
    const hasMore = conversations.length === limit;

    const response = {
      conversations: conversations.map(conv => ({
        id: conv.id,
        subject: conv.subject,
        status: conv.status,
        lastMessage: conv.last_message || null,
        lastMessageAt: conv.last_message_at || conv.updated_at,
        unreadCount: conv.unread_count || 0,
        admin: conv.admin_id ? {
          id: conv.admin_id,
          name: conv.admin_name || 'Admin'
        } : null,
        priority: conv.priority,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at
      })),
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching conversations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { subject, initialMessage, priority, context } = createConversationSchema.parse(body);

    // Create new conversation
    const conversation = await supportChatQueries.createConversation(
      parseInt(session.user.id),
      subject,
      context,
      priority,
      context ? 'ai_handoff' : 'support' // Determine type based on context presence
    );

    // Add initial message using the query function
    await supportChatQueries.addMessage(
      conversation.id, 
      parseInt(session.user.id), 
      initialMessage, 
      'user'
    );

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        subject: conversation.subject,
        status: conversation.status,
        priority: conversation.priority,
        type: conversation.type,
        createdAt: conversation.created_at,
        context: conversation.context_json
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}