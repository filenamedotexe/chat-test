import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@chat/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    // Create a mock request/response for NextAuth
    const url = new URL('/api/auth/session', request.url);
    
    // Create NextAuth handler
    const handler = NextAuth(authOptions);
    
    // Create a new Request object
    const authRequest = new Request(url, {
      method: 'GET',
      headers: request.headers,
    });
    
    // Call the handler
    const response = await handler(authRequest);
    
    // Get the response body
    const body = await response.text();
    
    return NextResponse.json({
      success: true,
      handlerType: typeof handler,
      responseStatus: response.status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      responseBody: body,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 10),
    }, { status: 500 });
  }
}