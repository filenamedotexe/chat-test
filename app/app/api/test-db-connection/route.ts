import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Test connection
    const connectionTest = await sql`SELECT NOW()`;
    
    // Check what tables exist
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    // Check specifically for chat-related tables
    const chatTables = tables.filter(t => 
      t.tablename.includes('chat') || 
      t.tablename.includes('message') ||
      t.tablename.includes('conversation')
    );
    
    // Check if chat_history table exists
    const chatHistoryExists = tables.some(t => t.tablename === 'chat_history');
    
    // If chat_history exists, check its structure
    let chatHistoryStructure = null;
    if (chatHistoryExists) {
      chatHistoryStructure = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'chat_history'
        ORDER BY ordinal_position;
      `;
    }
    
    // Check for conversations table
    const conversationsExists = tables.some(t => t.tablename === 'conversations');
    let conversationsStructure = null;
    if (conversationsExists) {
      conversationsStructure = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'conversations'
        ORDER BY ordinal_position;
      `;
    }
    
    // Count records in chat tables
    let chatHistoryCount = 0;
    let conversationsCount = 0;
    
    if (chatHistoryExists) {
      const count = await sql`SELECT COUNT(*) as count FROM chat_history`;
      chatHistoryCount = count[0].count;
    }
    
    if (conversationsExists) {
      const count = await sql`SELECT COUNT(*) as count FROM conversations`;
      conversationsCount = count[0].count;
    }
    
    return NextResponse.json({
      success: true,
      connection: 'Connected to Neon',
      timestamp: connectionTest[0].now,
      tables: {
        total: tables.length,
        all: tables.map(t => t.tablename),
        chatRelated: chatTables.map(t => t.tablename),
      },
      chatHistory: {
        exists: chatHistoryExists,
        structure: chatHistoryStructure,
        recordCount: chatHistoryCount,
      },
      conversations: {
        exists: conversationsExists,
        structure: conversationsStructure,
        recordCount: conversationsCount,
      },
      recommendation: !chatHistoryExists ? 
        'Chat history table is missing! Run migration at /api/setup-database' : 
        'Database structure looks good',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}