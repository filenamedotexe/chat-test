import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate, 
  HumanMessagePromptTemplate,
  MessagesPlaceholder 
} from "@langchain/core/prompts";
import { NeonChatMessageHistory } from "./neon-memory";
import { StreamingCallbackHandler, SimpleStreamingHandler } from "./streaming";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";

interface ConversationChainOptions {
  sessionId: string;
  streaming?: boolean;
  systemPrompt?: string;
  temperature?: number;
  modelName?: string;
}

/**
 * Creates a conversation chain with memory and streaming support
 */
export async function createConversationChain(options: ConversationChainOptions) {
  const {
    sessionId,
    streaming = true,
    systemPrompt = "You are a helpful assistant created by Neon.tech and Aceternity. Your job is to answer questions asked by the user in a polite and respectful manner. Always answer in markdown.",
    temperature = 0.7,
    modelName = "gpt-4-turbo"
  } = options;

  // Initialize the chat model
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName,
    temperature,
    streaming,
  });

  // Create memory with Neon persistence
  const chatHistory = new NeonChatMessageHistory({
    sessionId,
    databaseUrl: process.env.DATABASE_URL || "",
  });

  const memory = new BufferMemory({
    chatHistory,
    returnMessages: true,
    memoryKey: "history",
  });

  // Create the prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ]);

  // Create the conversation chain
  const chain = new ConversationChain({
    llm: model,
    memory,
    prompt,
    verbose: false, // Set to true for debugging
  });

  return { chain, memory, chatHistory };
}

/**
 * Stream a response using the conversation chain
 */
export async function streamConversationResponse(
  chain: ConversationChain,
  input: string,
  writer: WritableStreamDefaultWriter<Uint8Array>
) {
  const streamingHandler = new StreamingCallbackHandler(writer);
  
  try {
    // Run the chain with streaming callback
    const response = await chain.call(
      { input },
      { callbacks: [streamingHandler] }
    );
    
    // Return the full response content
    return {
      content: response.response || streamingHandler.getFullContent(),
      success: true
    };
  } catch (error) {
    console.error("Error in conversation stream:", error);
    throw error;
  } finally {
    await writer.close();
  }
}

/**
 * Simple streaming response for basic use cases
 */
export async function simpleStreamResponse(
  chain: ConversationChain,
  input: string
): Promise<ReadableStream<Uint8Array>> {
  return new ReadableStream({
    async start(controller) {
      const handler = new SimpleStreamingHandler(controller);
      
      try {
        await chain.call(
          { input },
          { callbacks: [handler] }
        );
      } catch (error) {
        console.error("Error in simple stream:", error);
        controller.error(error);
      }
    },
  });
}

/**
 * Get a non-streaming response
 */
export async function getConversationResponse(
  chain: ConversationChain,
  input: string
): Promise<string> {
  const response = await chain.call({ input });
  return response.response;
}

/**
 * Load conversation history for a session
 */
export async function loadConversationHistory(sessionId: string) {
  const chatHistory = new NeonChatMessageHistory({
    sessionId,
    databaseUrl: process.env.DATABASE_URL || "",
  });
  
  const messages = await chatHistory.getMessages();
  return messages;
}

/**
 * Clear conversation history for a session
 */
export async function clearConversationHistory(sessionId: string) {
  const chatHistory = new NeonChatMessageHistory({
    sessionId,
    databaseUrl: process.env.DATABASE_URL || "",
  });
  
  await chatHistory.clear();
}