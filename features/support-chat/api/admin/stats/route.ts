import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import { supportChatQueries, sql } from '@/lib/database/queries/support-chat';

// Input validation schema
const statsQuerySchema = z.object({
  period: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
  adminId: z.coerce.number().optional(),
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
    const { period, adminId } = statsQuerySchema.parse(queryParams);

    // Calculate date range
    const periodHours = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
      '90d': 24 * 90
    };
    
    const hoursAgo = periodHours[period];
    const startDate = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));

    // Get comprehensive conversation statistics
    const [
      overallStats,
      statusBreakdown,
      priorityBreakdown,
      adminPerformance,
      responseTimeStats,
      dailyVolume
    ] = await Promise.all([
      // Overall statistics
      sql`
        SELECT 
          COUNT(*) as total_conversations,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_conversations,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_conversations,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_conversations,
          COUNT(CASE WHEN admin_id IS NULL THEN 1 END) as unassigned_conversations,
          COUNT(CASE WHEN created_at >= ${startDate.toISOString()} THEN 1 END) as new_conversations_period
        FROM conversations
      `,

      // Status breakdown
      sql`
        SELECT 
          status,
          COUNT(*) as count,
          ROUND(AVG(EXTRACT(epoch FROM (updated_at - created_at))/3600)::numeric, 2) as avg_duration_hours
        FROM conversations
        WHERE created_at >= ${startDate.toISOString()}
        GROUP BY status
        ORDER BY count DESC
      `,

      // Priority breakdown
      sql`
        SELECT 
          priority,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count
        FROM conversations
        WHERE created_at >= ${startDate.toISOString()}
        GROUP BY priority
        ORDER BY 
          CASE priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'normal' THEN 3 
            WHEN 'low' THEN 4 
          END
      `,

      // Admin performance
      sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(c.id) as assigned_conversations,
          COUNT(CASE WHEN c.status = 'closed' THEN 1 END) as resolved_conversations,
          ROUND(AVG(
            CASE WHEN c.status = 'closed' 
            THEN EXTRACT(epoch FROM (c.updated_at - c.created_at))/3600 
            END
          )::numeric, 2) as avg_resolution_time_hours,
          COUNT(DISTINCT sm.id) as total_messages_sent
        FROM users u
        LEFT JOIN conversations c ON u.id = c.admin_id AND c.created_at >= ${startDate.toISOString()}
        LEFT JOIN support_messages sm ON u.id = sm.sender_id AND sm.sender_type = 'admin' AND sm.created_at >= ${startDate.toISOString()}
        WHERE u.role = 'admin'
        GROUP BY u.id, u.name, u.email
        HAVING COUNT(c.id) > 0 OR COUNT(sm.id) > 0
        ORDER BY resolved_conversations DESC, assigned_conversations DESC
      `,

      // Response time statistics
      sql`
        SELECT 
          ROUND(AVG(
            EXTRACT(epoch FROM (first_admin_response.created_at - c.created_at))/60
          )::numeric, 2) as avg_first_response_time_minutes,
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(epoch FROM (first_admin_response.created_at - c.created_at))/60
          )::numeric, 2) as median_first_response_time_minutes,
          COUNT(CASE WHEN EXTRACT(epoch FROM (first_admin_response.created_at - c.created_at))/60 <= 60 THEN 1 END) as responses_within_1hour,
          COUNT(*) as total_conversations_with_response
        FROM conversations c
        JOIN (
          SELECT DISTINCT ON (conversation_id) 
            conversation_id, created_at
          FROM support_messages 
          WHERE sender_type = 'admin' 
          ORDER BY conversation_id, created_at ASC
        ) first_admin_response ON c.id = first_admin_response.conversation_id
        WHERE c.created_at >= ${startDate.toISOString()}
      `,

      // Daily conversation volume
      sql`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as new_conversations,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_conversations
        FROM conversations
        WHERE created_at >= ${startDate.toISOString()}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
      `
    ]);

    // Get current queue status
    const queueStats = await sql`
      SELECT 
        COUNT(CASE WHEN status = 'open' AND admin_id IS NULL THEN 1 END) as unassigned_queue,
        COUNT(CASE WHEN status = 'open' AND admin_id IS NOT NULL THEN 1 END) as assigned_queue,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_queue,
        COUNT(CASE WHEN priority = 'urgent' AND status != 'closed' THEN 1 END) as urgent_queue
      FROM conversations
    `;

    // Format response
    const response = {
      period,
      generatedAt: new Date().toISOString(),
      
      overview: {
        totalConversations: parseInt(overallStats[0]?.total_conversations || '0'),
        newConversationsThisPeriod: parseInt(overallStats[0]?.new_conversations_period || '0'),
        openConversations: parseInt(overallStats[0]?.open_conversations || '0'),
        inProgressConversations: parseInt(overallStats[0]?.in_progress_conversations || '0'),
        closedConversations: parseInt(overallStats[0]?.closed_conversations || '0'),
        unassignedConversations: parseInt(overallStats[0]?.unassigned_conversations || '0')
      },

      queue: {
        unassigned: parseInt(queueStats[0]?.unassigned_queue || '0'),
        assigned: parseInt(queueStats[0]?.assigned_queue || '0'),
        inProgress: parseInt(queueStats[0]?.in_progress_queue || '0'),
        urgent: parseInt(queueStats[0]?.urgent_queue || '0')
      },

      statusBreakdown: statusBreakdown.map((s: any) => ({
        status: s.status,
        count: parseInt(s.count),
        avgDurationHours: parseFloat(s.avg_duration_hours || '0')
      })),

      priorityBreakdown: priorityBreakdown.map((p: any) => ({
        priority: p.priority,
        count: parseInt(p.count),
        openCount: parseInt(p.open_count || '0')
      })),

      adminPerformance: adminPerformance.map((a: any) => ({
        adminId: a.id,
        name: a.name,
        email: a.email,
        assignedConversations: parseInt(a.assigned_conversations || '0'),
        resolvedConversations: parseInt(a.resolved_conversations || '0'),
        avgResolutionTimeHours: parseFloat(a.avg_resolution_time_hours || '0'),
        totalMessagesSent: parseInt(a.total_messages_sent || '0'),
        resolutionRate: a.assigned_conversations > 0 
          ? Math.round((a.resolved_conversations / a.assigned_conversations) * 100)
          : 0
      })),

      responseTime: responseTimeStats[0] ? {
        avgFirstResponseMinutes: parseFloat(responseTimeStats[0].avg_first_response_time_minutes || '0'),
        medianFirstResponseMinutes: parseFloat(responseTimeStats[0].median_first_response_time_minutes || '0'),
        responsesWithin1Hour: parseInt(responseTimeStats[0].responses_within_1hour || '0'),
        totalConversationsWithResponse: parseInt(responseTimeStats[0].total_conversations_with_response || '0'),
        responseRate: responseTimeStats[0].total_conversations_with_response > 0
          ? Math.round((responseTimeStats[0].responses_within_1hour / responseTimeStats[0].total_conversations_with_response) * 100)
          : 0
      } : null,

      dailyVolume: dailyVolume.map((d: any) => ({
        date: d.date,
        newConversations: parseInt(d.new_conversations || '0'),
        closedConversations: parseInt(d.closed_conversations || '0')
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching support chat stats:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}