import { PROMPT_TEMPLATES } from "@chat/langchain-core";

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET() {
  return Response.json({
    templates: PROMPT_TEMPLATES,
    success: true
  });
}