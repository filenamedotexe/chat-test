import { PROMPT_TEMPLATES } from "@/lib/langchain-core";

export async function GET() {
  return Response.json({
    templates: PROMPT_TEMPLATES,
    success: true
  });
}