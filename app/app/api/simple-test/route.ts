import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Simple test working",
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasDatabase: !!process.env.DATABASE_URL,
    }
  });
}