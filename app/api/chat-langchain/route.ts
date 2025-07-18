import { StreamingTextResponse } from "ai";
import { createConversationChain, streamConversationResponse } from "@/lib/langchain/conversation";
import { 
  LangChainError, 
  ERROR_CODES, 
  handleOpenAIError, 
  handleDatabaseError,
  formatErrorResponse,
  withRetry 
} from "@/lib/langchain/error-handler";

export async function POST(req: Request) {
  try {
    const { 
      messages, 
      memoryType = "buffer", 
      maxTokenLimit = 2000, 
      sessionId: providedSessionId,
      promptTemplateId = "default"
    } = await req.json();
    
    // Validate input
    if (!messages || !Array.isArray(messages)) {
      throw new LangChainError(
        'Messages must be an array',
        ERROR_CODES.INVALID_INPUT,
        400
      );
    }
    
    // Extract the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      throw new LangChainError(
        'No user message found',
        ERROR_CODES.INVALID_INPUT,
        400
      );
    }
    
    // Use provided session ID or generate new one
    const sessionId = providedSessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract system prompt from messages if present
    const systemMessage = messages.find((msg: any) => msg.role === "system");
    const systemPrompt = systemMessage?.content || undefined;
    
    // Create conversation chain with memory (with retry)
    const { chain, chatHistory } = await withRetry(
      () => createConversationChain({
        sessionId,
        streaming: true,
        systemPrompt,
        promptTemplateId,
        memoryType: memoryType as "buffer" | "summary",
        maxTokenLimit,
      }),
      2,  // max retries
      1000 // initial delay
    );
    
    // Create stream
    const encoder = new TextEncoder();
    let fullContent = "";
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the response using the conversation chain
          const response = await chain.call(
            { input: lastMessage.content },
            {
              callbacks: [{
                handleLLMNewToken(token: string) {
                  fullContent += token;
                  const formattedChunk = encoder.encode(token);
                  controller.enqueue(formattedChunk);
                },
                async handleLLMEnd() {
                  console.log("LLM finished, full content:", fullContent);
                  // Save the conversation turn to the database
                  try {
                    await chatHistory.saveConversationTurn(lastMessage.content, fullContent);
                    console.log("Conversation saved to database");
                  } catch (error) {
                    console.error("Error saving conversation:", error);
                  }
                },
                handleLLMError(error: Error) {
                  console.error("LLM streaming error:", error);
                  const langchainError = handleOpenAIError(error);
                  controller.error(langchainError);
                }
              }]
            }
          );
          
          // Close the stream after the response is complete
          controller.close();
          
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });
    
    return new StreamingTextResponse(readableStream);
    
  } catch (error) {
    console.error("LangChain route error:", error);
    
    // Handle specific error types
    if (error instanceof LangChainError) {
      return new Response(
        JSON.stringify(formatErrorResponse(error)),
        { status: error.statusCode, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Handle OpenAI errors
    if (error instanceof Error && (error.message?.includes('OpenAI') || error.message?.includes('429'))) {
      const langchainError = handleOpenAIError(error);
      return new Response(
        JSON.stringify(formatErrorResponse(langchainError)),
        { status: langchainError.statusCode, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Default error response
    return new Response(
      JSON.stringify(formatErrorResponse(error)),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}