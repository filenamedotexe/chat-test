import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST() {
  try {
    const sql = process.env.DATABASE_URL && process.env.DATABASE_URL !== "your-neon-database-url" 
      ? neon(process.env.DATABASE_URL)
      : null;
    
    if (!sql) {
      return NextResponse.json({
        success: false,
        error: "Database URL not configured"
      }, { status: 500 });
    }

    const results = [];

    // Step 1: Create the main table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS chat_history (
          id SERIAL PRIMARY KEY,
          user_message TEXT NOT NULL,
          assistant_message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      results.push({ step: "create_table", status: "success", message: "chat_history table created" });
    } catch (error) {
      results.push({ step: "create_table", status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
    }

    // Step 2: Add session_id column
    try {
      await sql`
        ALTER TABLE chat_history 
        ADD COLUMN IF NOT EXISTS session_id VARCHAR(255)
      `;
      results.push({ step: "add_session_id", status: "success", message: "session_id column added" });
    } catch (error) {
      results.push({ step: "add_session_id", status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
    }

    // Step 3: Add metadata column
    try {
      await sql`
        ALTER TABLE chat_history 
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'
      `;
      results.push({ step: "add_metadata", status: "success", message: "metadata column added" });
    } catch (error) {
      results.push({ step: "add_metadata", status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
    }

    // Step 4: Create session index
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_chat_history_session_id 
        ON chat_history(session_id)
      `;
      results.push({ step: "session_index", status: "success", message: "session_id index created" });
    } catch (error) {
      results.push({ step: "session_index", status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
    }

    // Step 5: Create timestamp index
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_chat_history_created_at 
        ON chat_history(created_at)
      `;
      results.push({ step: "timestamp_index", status: "success", message: "created_at index created" });
    } catch (error) {
      results.push({ step: "timestamp_index", status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
    }

    // Step 6: Verify table structure
    try {
      const tableInfo = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'chat_history'
        ORDER BY ordinal_position
      `;
      results.push({ step: "verify_structure", status: "success", columns: tableInfo });
    } catch (error) {
      results.push({ step: "verify_structure", status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
    }

    const successCount = results.filter(r => r.status === "success").length;
    const totalSteps = results.length;

    return NextResponse.json({
      success: successCount === totalSteps,
      message: `Database setup completed: ${successCount}/${totalSteps} steps successful`,
      results
    });

  } catch (error) {
    console.error("Database setup error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}