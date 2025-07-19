import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryMemory } from "langchain/memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

async function testSummaryMemory() {
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4-turbo",
    temperature: 0.7,
  });

  const memory = new ConversationSummaryMemory({
    llm: model,
    returnMessages: false,
    memoryKey: "history",
  });

  // Add some messages
  await memory.saveContext(
    { input: "Hi, my name is Emma. I'm a marine biologist." },
    { output: "Hello Emma! Nice to meet you. Being a marine biologist sounds fascinating!" }
  );

  await memory.saveContext(
    { input: "I study dolphins in Hawaii." },
    { output: "That's amazing! Dolphins are such intelligent creatures." }
  );

  await memory.saveContext(
    { input: "What do you remember about me?" },
    { output: "Let me recall what you've told me..." }
  );

  // Get the summary
  const memoryVars = await memory.loadMemoryVariables({});
  console.log("Memory variables:", memoryVars);

  // Get the buffer
  const buffer = await memory.buffer;
  console.log("Memory buffer:", buffer);
}

testSummaryMemory().catch(console.error);