import { NextRequest } from "next/server";
import { getMemorySummary, loadConversationHistory, clearConversationHistory } from "@/lib/langchain-core";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const action = searchParams.get("action");
    const memoryType = searchParams.get("memoryType") as "buffer" | "summary" || "buffer";

    if (!sessionId) {
      return new Response("Session ID is required", { status: 400 });
    }

    if (action === "summary" && memoryType === "summary") {
      const summary = await getMemorySummary(sessionId, memoryType);
      return Response.json({ summary });
    }

    if (action === "history") {
      const messages = await loadConversationHistory(sessionId);
      return Response.json({ messages });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Memory API error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return new Response("Session ID is required", { status: 400 });
    }

    await clearConversationHistory(sessionId);
    return Response.json({ success: true });
    
  } catch (error) {
    console.error("Clear memory error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}