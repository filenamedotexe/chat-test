import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

export async function GET(req: Request) {
  try {
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4-turbo",
      temperature: 0.7,
    });

    const memory = new ConversationSummaryMemory({
      llm: model,
      memoryKey: "history",
      returnMessages: false,
    });

    const chain = new ConversationChain({
      llm: model,
      memory,
    });

    // Have a conversation
    const response1 = await chain.call({ input: "Hi, my name is Test User and I work at TestCorp." });
    console.log("Response 1:", response1);

    const response2 = await chain.call({ input: "I'm a senior developer working on AI projects." });
    console.log("Response 2:", response2);

    const response3 = await chain.call({ input: "What do you remember about me?" });
    console.log("Response 3:", response3);

    // Get the memory
    const memoryVars = await memory.loadMemoryVariables({});
    console.log("Memory variables:", memoryVars);

    return Response.json({
      responses: [response1, response2, response3],
      memory: memoryVars,
      success: true
    });

  } catch (error) {
    console.error("Test summary error:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}