import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET() {
  return NextResponse.json({ message: "Hello from API route!" });
}