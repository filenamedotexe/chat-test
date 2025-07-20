import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'OPENAI_API_KEY not found in environment' 
      });
    }
    
    // Test the API key
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ 
        success: false, 
        error: `OpenAI API error: ${response.status}`,
        details: error,
        keyPrefix: apiKey.substring(0, 10) + '...',
      });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API key is valid',
      keyPrefix: apiKey.substring(0, 10) + '...',
      modelsAvailable: data.data.length,
      models: data.data.slice(0, 5).map((m: any) => m.id),
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}