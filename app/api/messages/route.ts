import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import { supportChatQueries } from '@/lib/database/queries/support-chat';

// Input validation schema
const sendMessageSchema = z.object({
  conversationId: z.coerce.number(),
  content: z.string().min(1).max(10000),
  messageType: z.enum(['text', 'system', 'handoff']).default('text'),
});

// Rate limiting - simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30; // 30 messages per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  userLimit.count++;
  return true;
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

    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === 'admin';

    // Check rate limiting (admins have higher limits)
    if (!isAdmin && !checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending another message.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { conversationId, content, messageType } = sendMessageSchema.parse(body);

    // Verify conversation exists and user has access
    const conversation = await supportChatQueries.getConversationById(conversationId);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check permissions: user can only message their own conversations, admins can message any
    if (!isAdmin && conversation.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Determine sender type
    const senderType = isAdmin ? 'admin' : 'user';

    // Add message to conversation
    const message = await supportChatQueries.addMessage(
      conversationId,
      userId,
      content,
      senderType,
      messageType
    );

    // Update conversation's updated_at timestamp
    await supportChatQueries.updateConversationStatus(conversationId, conversation.status);

    // Get sender name for response
    const senderName = session.user.name || (isAdmin ? 'Admin' : 'User');

    return NextResponse.json({
      message: {
        id: message.id,
        conversationId: message.conversation_id,
        content: message.content,
        senderType: message.sender_type,
        messageType: message.message_type,
        createdAt: message.created_at,
        sender: {
          id: userId,
          name: senderName
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid message data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}