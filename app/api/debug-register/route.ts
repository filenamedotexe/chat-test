import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    console.log('Raw body:', body);
    console.log('Body length:', body.length);
    
    // Try to parse manually
    try {
      const parsed = JSON.parse(body);
      return NextResponse.json({
        success: true,
        parsed,
        message: 'JSON parsed successfully'
      });
    } catch (parseError) {
      return NextResponse.json({
        error: 'JSON parse failed',
        rawBody: body,
        bodyChars: body.split('').map((char, i) => ({
          index: i,
          char,
          code: char.charCodeAt(0)
        })),
        parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Request processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}