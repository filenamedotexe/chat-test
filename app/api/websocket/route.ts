import { NextRequest, NextResponse } from 'next/server';
import { createWebSocketServer, getWebSocketServer } from '@/lib/websocket/server';

// This route should be accessible without authentication for server initialization

export async function GET() {
  try {
    const existingServer = getWebSocketServer();
    
    if (existingServer) {
      return NextResponse.json({ 
        status: 'running',
        message: 'WebSocket server is already running on port 8080'
      });
    }

    // Create WebSocket server
    const server = createWebSocketServer();
    
    return NextResponse.json({ 
      status: 'started',
      message: 'WebSocket server started successfully on port 8080',
      path: '/ws/support-chat'
    });
  } catch (error) {
    console.error('Error starting WebSocket server:', error);
    return NextResponse.json(
      { error: 'Failed to start WebSocket server' }, 
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET(); // Same as GET for starting server
}