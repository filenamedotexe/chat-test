import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StreamingTextResponse } from "ai";
import { createNeonMemory } from "@/lib/langchain/neon-memory";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Extract the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return new Response("No user message found", { status: 400 });
    }
    
    // Generate session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize LangChain ChatOpenAI with streaming
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4-turbo",
      temperature: 0.7,
      streaming: true,
    });
    
    // Convert messages to LangChain format
    const langchainMessages = messages.map((msg: any) => {
      if (msg.role === "system") {
        return new SystemMessage(msg.content);
      } else if (msg.role === "user") {
        return new HumanMessage(msg.content);
      }
      return new HumanMessage(msg.content);
    });
    
    // Add system prompt if not present
    if (!messages.some((msg: any) => msg.role === "system")) {
      langchainMessages.unshift(
        new SystemMessage(
          "You are a helpful assistant created by Neon.tech and Aceternity. Your job is to answer questions asked by the user in a polite and respectful manner. Always answer in markdown."
        )
      );
    }
    
    // Create stream
    const stream = await model.stream(langchainMessages);
    
    // Convert LangChain stream to format compatible with Vercel AI SDK
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let fullContent = "";
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = typeof chunk.content === 'string' ? chunk.content : '';
            fullContent += content;
            
            // Format as Vercel AI SDK expects
            const formattedChunk = encoder.encode(content);
            controller.enqueue(formattedChunk);
          }
          
          // Save to database after completion
          const memory = createNeonMemory(sessionId);
          await memory.saveConversationTurn(lastMessage.content, fullContent);
          
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
    
    return new StreamingTextResponse(readableStream);
    
  } catch (error) {
    console.error("LangChain route error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}