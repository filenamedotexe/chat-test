import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import { supportChatQueries, sql } from '@/lib/database/queries/support-chat';

// Input validation schemas
const adminConversationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['open', 'closed', 'transferred', 'in_progress']).optional(),
  adminId: z.coerce.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'priority']).default('updated_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
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

    // Admin only endpoint
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, status, adminId, priority, sortBy, sortOrder } = adminConversationQuerySchema.parse(queryParams);

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get admin conversations with advanced filtering
    const conversations = await supportChatQueries.getAdminConversations(
      adminId,
      status,
      limit,
      offset
    );

    // Get total count for pagination
    let countResult;
    if (status && adminId && priority) {
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM conversations c
        WHERE c.status = ${status} AND c.admin_id = ${adminId} AND c.priority = ${priority}
      `;
    } else if (status && adminId) {
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM conversations c
        WHERE c.status = ${status} AND c.admin_id = ${adminId}
      `;
    } else if (status) {
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM conversations c
        WHERE c.status = ${status}
      `;
    } else if (adminId) {
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM conversations c
        WHERE c.admin_id = ${adminId}
      `;
    } else {
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM conversations c
      `;
    }

    const total = parseInt(countResult[0]?.total || '0');
    const hasMore = offset + conversations.length < total;

    // Format response with additional admin metadata
    const response = {
      conversations: conversations.map(conv => ({
        id: conv.id,
        subject: conv.subject,
        status: conv.status,
        priority: conv.priority,
        type: conv.type,
        user: {
          id: conv.user_id,
          name: conv.user_name || 'User',
          email: conv.user_email
        },
        admin: conv.admin_id ? {
          id: conv.admin_id,
          name: conv.admin_name || 'Admin',
          email: conv.admin_email
        } : null,
        messageCount: conv.message_count || 0,
        unreadCount: conv.unread_count || 0,
        lastMessage: conv.last_message,
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        context: conv.context_json // AI handoff context if available
      })),
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        status,
        adminId,
        priority,
        sortBy,
        sortOrder
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    
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

// Bulk operations endpoint
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin only endpoint
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, conversationIds, data } = z.object({
      action: z.enum(['bulk_assign', 'bulk_status_change', 'bulk_close']),
      conversationIds: z.array(z.number()).min(1).max(50),
      data: z.object({
        adminId: z.number().optional(),
        status: z.enum(['open', 'closed', 'transferred', 'in_progress']).optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
      }).optional()
    }).parse(body);

    const results = [];

    // Perform bulk operation
    for (const conversationId of conversationIds) {
      try {
        switch (action) {
          case 'bulk_assign':
            if (data?.adminId) {
              await supportChatQueries.assignConversationToAdmin(conversationId, data.adminId);
              results.push({ conversationId, success: true, action: 'assigned' });
            }
            break;
            
          case 'bulk_status_change':
            if (data?.status) {
              await supportChatQueries.updateConversationStatus(conversationId, data.status);
              results.push({ conversationId, success: true, action: 'status_updated' });
            }
            break;
            
          case 'bulk_close':
            await supportChatQueries.updateConversationStatus(conversationId, 'closed');
            results.push({ conversationId, success: true, action: 'closed' });
            break;
        }
      } catch (error) {
        console.error(`Failed ${action} for conversation ${conversationId}:`, error);
        results.push({ 
          conversationId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      action,
      results,
      summary: {
        total: conversationIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid bulk operation data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}