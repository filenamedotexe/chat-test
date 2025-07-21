import { ChatOpenAI } from "@langchain/openai";

// Initialize OpenAI with streaming enabled
export const createChatModel = (streaming: boolean = true) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in environment variables");
  }

  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4-turbo",
    temperature: 0.7,
    streaming,
    // Match the behavior of the current implementation
    maxTokens: undefined, // Let the model decide
  });
};

// Default chat model with streaming enabled
export const chatModel = createChatModel(true);

// Non-streaming model for specific use cases
export const nonStreamingChatModel = createChatModel(false);

// System prompt to match current implementation
export const SYSTEM_PROMPT = "You are a helpful assistant created by Neon.tech and Aceternity. Your job is to answer questions asked by the user in a polite and respectful manner. Always answer in markdown.";