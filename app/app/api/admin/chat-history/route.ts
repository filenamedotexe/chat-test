import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    const userId = searchParams.get('user_id');
    const appId = searchParams.get('app_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build dynamic query
    let whereConditions = [];
    let params: any = { limit, offset };
    let paramIndex = 1;

    if (userId) {
      whereConditions.push(`ch.user_id = $${paramIndex++}`);
      params.userId = parseInt(userId);
    }
    if (appId) {
      whereConditions.push(`ch.app_id = $${paramIndex++}`);
      params.appId = parseInt(appId);
    }
    if (dateFrom) {
      whereConditions.push(`ch.created_at >= $${paramIndex++}`);
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      whereConditions.push(`ch.created_at <= $${paramIndex++}`);
      params.dateTo = dateTo + ' 23:59:59';
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Fetch chat history with user and app info
    const query = `
      SELECT 
        ch.*,
        u.email as user_email,
        u.name as user_name,
        a.name as app_name
      FROM chat_history ch
      LEFT JOIN users u ON ch.user_id = u.id
      LEFT JOIN apps a ON ch.app_id = a.id
      ${whereClause}
      ORDER BY ch.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    let chats;
    if (Object.keys(params).length === 2) {
      // Only limit and offset
      chats = await sql(query);
    } else {
      // Dynamic params - build the query manually
      let finalQuery = query;
      let values = [];
      
      if (userId) {
        finalQuery = finalQuery.replace('$1', '$1');
        values.push(parseInt(userId));
      }
      if (appId) {
        const placeholder = userId ? '$2' : '$1';
        finalQuery = finalQuery.replace(placeholder, placeholder);
        values.push(parseInt(appId));
      }
      if (dateFrom) {
        const placeholder = `$${values.length + 1}`;
        finalQuery = finalQuery.replace(placeholder, placeholder);
        values.push(dateFrom);
      }
      if (dateTo) {
        const placeholder = `$${values.length + 1}`;
        finalQuery = finalQuery.replace(placeholder, placeholder);
        values.push(dateTo + ' 23:59:59');
      }

      // For now, use a simpler approach
      chats = await sql`
        SELECT 
          ch.*,
          u.email as user_email,
          u.name as user_name,
          a.name as app_name
        FROM chat_history ch
        LEFT JOIN users u ON ch.user_id = u.id
        LEFT JOIN apps a ON ch.app_id = a.id
        WHERE 1=1
          ${userId ? sql`AND ch.user_id = ${parseInt(userId)}` : sql``}
          ${appId ? sql`AND ch.app_id = ${parseInt(appId)}` : sql``}
          ${dateFrom ? sql`AND ch.created_at >= ${dateFrom}` : sql``}
          ${dateTo ? sql`AND ch.created_at <= ${dateTo + ' 23:59:59'}` : sql``}
        ORDER BY ch.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return new Response('Internal server error', { status: 500 });
  }
}