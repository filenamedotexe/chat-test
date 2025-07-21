import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory, ConversationSummaryMemory } from "langchain/memory";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate, 
  HumanMessagePromptTemplate,
  MessagesPlaceholder 
} from "@langchain/core/prompts";
import { NeonChatMessageHistory } from "./neon-memory";
import { StreamingCallbackHandler, SimpleStreamingHandler } from "./streaming";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { getPromptTemplate, getDefaultPrompt } from "./prompts";

interface ConversationChainOptions {
  sessionId: string;
  streaming?: boolean;
  systemPrompt?: string;
  promptTemplateId?: string;
  temperature?: number;
  modelName?: string;
  memoryType?: "buffer" | "summary";
  maxTokenLimit?: number;
  userId?: number;
}

/**
 * Creates a conversation chain with memory and streaming support
 */
export async function createConversationChain(options: ConversationChainOptions) {
  const {
    sessionId,
    streaming = true,
    systemPrompt,
    promptTemplateId = "default",
    temperature = 0.7,
    modelName = "gpt-4-turbo",
    memoryType = "buffer",
    maxTokenLimit = 2000,
    userId
  } = options;

  // Get the system prompt from template or use provided one
  let finalSystemPrompt = systemPrompt;
  if (!finalSystemPrompt && promptTemplateId) {
    const template = getPromptTemplate(promptTemplateId);
    finalSystemPrompt = template?.prompt || getDefaultPrompt();
  }
  finalSystemPrompt = finalSystemPrompt || getDefaultPrompt();

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
    userId,
  });

  // Create memory based on type
  let memory;
  if (memoryType === "summary") {
    memory = new ConversationSummaryMemory({
      llm: model,
      chatHistory,
      returnMessages: false,
      memoryKey: "history",
    });
  } else {
    memory = new BufferMemory({
      chatHistory,
      returnMessages: true,
      memoryKey: "history",
    });
  }

  // Create the prompt template based on memory type
  const prompt = memoryType === "summary" 
    ? ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(finalSystemPrompt + "\n\nConversation Summary:\n{history}"),
        HumanMessagePromptTemplate.fromTemplate("{input}"),
      ])
    : ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(finalSystemPrompt),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{input}"),
      ]);

  // Create the conversation chain
  const chain = new ConversationChain({
    llm: model,
    memory,
    prompt,
    verbose: true, // Set to true for debugging
  });

  // Load existing messages into memory
  const memoryVars = await memory.loadMemoryVariables({});
  console.log(`Memory loaded for session ${sessionId} (${memoryType}):`, JSON.stringify(memoryVars, null, 2));

  // For summary memory, if we have history, create a summary
  if (memoryType === "summary" && chatHistory) {
    const messages = await chatHistory.getMessages();
    if (messages.length > 0) {
      console.log(`Found ${messages.length} messages for summary memory`);
      // Load messages into memory to create summary
      for (let i = 0; i < messages.length; i += 2) {
        if (messages[i] && messages[i + 1]) {
          await memory.saveContext(
            { input: messages[i].content },
            { output: messages[i + 1].content }
          );
        }
      }
      const newMemoryVars = await memory.loadMemoryVariables({});
      console.log(`Memory after loading history:`, JSON.stringify(newMemoryVars, null, 2));
    }
  }

  return { chain, memory, chatHistory, memoryType };
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

/**
 * Get memory summary if using ConversationSummaryMemory
 */
export async function getMemorySummary(
  sessionId: string,
  memoryType: "buffer" | "summary" = "buffer"
): Promise<string | null> {
  if (memoryType !== "summary") {
    return null;
  }

  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4-turbo",
    temperature: 0.7,
  });

  const chatHistory = new NeonChatMessageHistory({
    sessionId,
    databaseUrl: process.env.DATABASE_URL || "",
  });

  const memory = new ConversationSummaryMemory({
    llm: model,
    chatHistory,
    returnMessages: true,
    memoryKey: "history",
  });

  try {
    const buffer = await memory.loadMemoryVariables({});
    const messages = buffer.history;
    
    if (Array.isArray(messages) && messages.length > 0) {
      // Get the summary from the memory buffer
      const summaryBuffer = await memory.loadMemoryVariables({});
      return summaryBuffer.history || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting memory summary:", error);
    return null;
  }
}