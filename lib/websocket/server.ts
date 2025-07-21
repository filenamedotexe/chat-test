import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { verifySession } from '@/lib/auth';

export interface WSMessage {
  type: 'message' | 'join_conversation' | 'leave_conversation' | 'typing' | 'read_receipt' | 'user_joined' | 'user_left' | 'joined_conversation' | 'left_conversation' | 'connection_confirmed' | 'error' | 'conversation_updated' | 'new_conversation';
  conversationId?: number;
  data?: any;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  userEmail?: string;
  isAuthenticated: boolean;
  conversationId?: number;
}

export interface User {
  id: number;
  email: string;
  name?: string;
}

let wss: WebSocketServer | null = null;

export function createWebSocketServer() {
  if (wss) {
    console.log('WebSocket server already exists');
    return wss;
  }

  wss = new WebSocketServer({ 
    port: 8080,
    path: '/ws/support-chat',
    verifyClient: async (info: any) => {
      console.log('🔍 Verifying client before connection...');
      
      // Extract authentication from query params or headers
      const url = parse(info.req.url || '', true);
      const token = url.query.token as string || info.req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        console.log('❌ No authentication token - rejecting connection');
        return false;
      }

      try {
        // Verify authentication BEFORE allowing connection
        const session = await verifySession(token);
        if (!session || !session.user) {
          console.log('❌ Invalid authentication token - rejecting connection');
          return false;
        }
        
        console.log('✅ Authentication successful - allowing connection');
        // Store user info in the request for later use
        (info.req as any).user = session.user;
        return true;
      } catch (error) {
        console.log('❌ Authentication error - rejecting connection:', error);
        return false;
      }
    }
  });

  console.log('WebSocket server starting on port 8080...');

  wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    console.log('✅ New WebSocket connection established (pre-authenticated)');
    
    // Get user info from the request (set in verifyClient)
    const user = (req as any).user;
    
    if (!user) {
      console.log('❌ No user info found - this should not happen!');
      ws.terminate();
      return;
    }

    // Add user info to WebSocket
    ws.userId = user.id;
    ws.userEmail = user.email;
    ws.isAuthenticated = true;

    console.log(`✅ WebSocket authenticated for user: ${user.email} (ID: ${user.id})`);

    // Handle messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);
        
        await handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: { error: 'Invalid message format' }
        }));
      }
    });

    // Handle connection close
    ws.on('close', (code: number, reason: Buffer) => {
      console.log(`WebSocket connection closed for user ${ws.userEmail}: ${code} ${reason.toString()}`);
      
      // Leave any conversation rooms
      if (ws.conversationId) {
        leaveConversationRoom(ws, ws.conversationId);
      }
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_confirmed',
      data: { 
        userId: ws.userId,
        userEmail: ws.userEmail 
      }
    }));
  });

  wss.on('error', (error: Error) => {
    console.error('WebSocket server error:', error);
  });

  console.log('✅ WebSocket server created successfully on port 8080');
  return wss;
}

async function handleWebSocketMessage(ws: AuthenticatedWebSocket, message: WSMessage) {
  if (!ws.isAuthenticated) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { error: 'Not authenticated' }
    }));
    return;
  }

  switch (message.type) {
    case 'join_conversation':
      if (message.conversationId) {
        await joinConversationRoom(ws, message.conversationId);
      }
      break;
      
    case 'leave_conversation':
      if (message.conversationId) {
        await leaveConversationRoom(ws, message.conversationId);
      }
      break;
      
    case 'typing':
      if (ws.conversationId && message.data) {
        await broadcastToConversation(ws.conversationId, {
          type: 'typing',
          conversationId: ws.conversationId,
          data: {
            userId: ws.userId,
            isTyping: message.data.isTyping
          }
        }, ws);
      }
      break;
      
    case 'message':
      // Message handling will be done through HTTP API
      // This just broadcasts the message was sent
      if (ws.conversationId && message.data) {
        await broadcastToConversation(ws.conversationId, {
          type: 'message',
          conversationId: ws.conversationId,
          data: message.data
        }, ws);
      }
      break;
      
    case 'read_receipt':
      if (ws.conversationId && message.data) {
        await broadcastToConversation(ws.conversationId, {
          type: 'read_receipt',
          conversationId: ws.conversationId,
          data: {
            messageId: message.data.messageId,
            readBy: ws.userId
          }
        }, ws);
      }
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        data: { error: 'Unknown message type' }
      }));
  }
}

// Import the connection manager
import { joinConversationRoom, leaveConversationRoom, broadcastToConversation } from './connections';

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

export function closeWebSocketServer() {
  if (wss) {
    console.log('Closing WebSocket server...');
    wss.close();
    wss = null;
  }
}