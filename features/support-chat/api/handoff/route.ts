import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";
import { supportChatQueries } from "@/lib/database/queries/support-chat";
import type { HandoffContext } from "@/lib/support-chat/handoff-detection";

const handoffRequestSchema = z.object({
  context: z.object({
    aiChatHistory: z.array(z.object({
      role: z.string(),
      content: z.string(),
      id: z.string().optional(),
    })),
    userIntent: z.string(),
    urgency: z.enum(['low', 'normal', 'high']),
    category: z.enum(['technical', 'billing', 'feature', 'bug', 'other']),
    summary: z.string(),
    handoffReason: z.string(),
  }),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { context, sessionId } = handoffRequestSchema.parse(body);

    // Create support conversation with handoff context
    const conversationData = {
      userId: parseInt(session.user.id),
      subject: `AI Handoff: ${context.userIntent}`,
      priority: context.urgency === 'high' ? 'urgent' : 
                context.urgency === 'normal' ? 'normal' : 'low',
      type: 'ai_handoff' as const,
      contextJson: {
        aiChatHistory: context.aiChatHistory,
        handoffReason: context.handoffReason,
        userIntent: context.userIntent,
        urgency: context.urgency,
        category: context.category,
        originalSessionId: sessionId,
        handoffTimestamp: new Date().toISOString(),
        summary: context.summary,
      }
    };

    const conversation = await supportChatQueries.createConversation(
      conversationData.userId,
      conversationData.subject,
      conversationData.contextJson,
      conversationData.priority as any,
      conversationData.type
    );

    // Add initial system message explaining the handoff
    const systemMessage = `This conversation was transferred from AI chat.

**Reason for handoff:** ${context.handoffReason}
**User intent:** ${context.userIntent}
**Category:** ${context.category}
**Summary:** ${context.summary}

The user's previous AI chat history is available in the conversation context. Please provide personalized assistance based on their needs.`;

    await supportChatQueries.addMessage(
      conversation.id,
      parseInt(session.user.id), // Use actual user ID for system message attribution
      systemMessage,
      'system',
      'handoff'
    );

    // Add user's latest message as the opening message
    if (context.aiChatHistory.length > 0) {
      const latestUserMessage = context.aiChatHistory
        .filter(msg => msg.role === 'user')
        .pop();
      
      if (latestUserMessage) {
        await supportChatQueries.addMessage(
          conversation.id,
          parseInt(session.user.id),
          latestUserMessage.content,
          'user',
          'text'
        );
      }
    }

    return Response.json({
      success: true,
      conversationId: conversation.id,
      message: 'Successfully transferred to human support'
    });

  } catch (error) {
    console.error('Handoff error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response('Invalid handoff data', { status: 400 });
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}