import { NextResponse } from "next/server";
import { createNeonMemory } from "@/lib/langchain/neon-memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    const testSessionId = "test-session-" + Date.now();
    
    // Test direct database connection first
    const sql = process.env.DATABASE_URL && process.env.DATABASE_URL !== "your-neon-database-url" 
      ? neon(process.env.DATABASE_URL)
      : null;
    
    if (!sql) {
      return NextResponse.json({
        success: false,
        error: "Database not configured"
      });
    }
    
    // Test 1: Direct database insert
    let directInsertResult;
    try {
      await sql`
        INSERT INTO chat_history (
          user_message,
          assistant_message,
          created_at
        ) VALUES (
          ${"Test user message"},
          ${"Test assistant message"},
          NOW()
        )
      `;
      directInsertResult = { status: "success", message: "Direct insert worked" };
    } catch (error) {
      directInsertResult = { status: "failed", error: error instanceof Error ? error.message : "Unknown" };
    }
    
    // Test 2: Direct database read
    let directReadResult;
    try {
      const rows = await sql`SELECT COUNT(*) as count FROM chat_history`;
      directReadResult = { status: "success", totalRows: rows[0].count };
    } catch (error) {
      directReadResult = { status: "failed", error: error instanceof Error ? error.message : "Unknown" };
    }
    
    // Test 3: Memory class test
    const memory = createNeonMemory(testSessionId);
    
    // Save a conversation turn using memory class
    let memorySaveResult;
    try {
      await memory.saveConversationTurn(
        "Memory test user message",
        "Memory test assistant message"
      );
      memorySaveResult = { status: "success" };
    } catch (error) {
      memorySaveResult = { status: "failed", error: error instanceof Error ? error.message : "Unknown" };
    }
    
    // Retrieve messages using memory class
    let memoryReadResult;
    try {
      const messages = await memory.getMessages();
      memoryReadResult = { 
        status: "success", 
        count: messages.length,
        messages: messages.slice(-4).map(m => ({
          type: m._getType(),
          content: typeof m.content === 'string' ? m.content.substring(0, 50) + "..." : "Complex content..."
        }))
      };
    } catch (error) {
      memoryReadResult = { status: "failed", error: error instanceof Error ? error.message : "Unknown" };
    }
    
    return NextResponse.json({
      success: true,
      sessionId: testSessionId,
      databaseUrl: process.env.DATABASE_URL ? "configured" : "not configured",
      tests: {
        directInsert: directInsertResult,
        directRead: directReadResult,
        memorySave: memorySaveResult,
        memoryRead: memoryReadResult
      }
    });
    
  } catch (error) {
    console.error("Memory test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}