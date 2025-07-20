import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    // Step 1: Test basic response
    const step1 = { step: 1, message: "Basic route working" };
    
    // Step 2: Check environment variable
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const step2 = { step: 2, hasApiKey, keyLength: process.env.OPENAI_API_KEY?.length };
    
    // Step 3: Test LangChain import
    let step3;
    try {
      const { ChatOpenAI } = await import("@langchain/openai");
      step3 = { step: 3, import: "success", ChatOpenAI: typeof ChatOpenAI };
    } catch (e) {
      step3 = { step: 3, import: "failed", error: e instanceof Error ? e.message : "Unknown" };
      throw e;
    }
    
    // Step 4: Create model instance
    let step4;
    try {
      const { ChatOpenAI } = await import("@langchain/openai");
      const model = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4-turbo",
      });
      step4 = { step: 4, model: "created" };
    } catch (e) {
      step4 = { step: 4, model: "failed", error: e instanceof Error ? e.message : "Unknown" };
      throw e;
    }
    
    // Step 5: Test invoke
    let step5;
    try {
      const { ChatOpenAI } = await import("@langchain/openai");
      const { HumanMessage } = await import("@langchain/core/messages");
      
      const model = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4-turbo",
      });
      
      const response = await model.invoke([
        new HumanMessage("Say 'Hello from LangChain!'"),
      ]);
      
      step5 = { step: 5, invoke: "success", response: response.content };
    } catch (e) {
      step5 = { step: 5, invoke: "failed", error: e instanceof Error ? e.message : "Unknown" };
      throw e;
    }
    
    return NextResponse.json({
      success: true,
      steps: [step1, step2, step3, step4, step5],
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}