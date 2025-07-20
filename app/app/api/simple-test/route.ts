import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';


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