import { AuthenticatedWebSocket, WSMessage } from './server';

export class ConversationRoom {
  conversationId: number;
  connections: Set<AuthenticatedWebSocket>;

  constructor(conversationId: number) {
    this.conversationId = conversationId;
    this.connections = new Set();
  }

  addConnection(ws: AuthenticatedWebSocket): void {
    this.connections.add(ws);
    ws.conversationId = this.conversationId;
    console.log(`User ${ws.userEmail} joined conversation ${this.conversationId}. Total connections: ${this.connections.size}`);
  }

  removeConnection(ws: AuthenticatedWebSocket): void {
    this.connections.delete(ws);
    ws.conversationId = undefined;
    console.log(`User ${ws.userEmail} left conversation ${this.conversationId}. Total connections: ${this.connections.size}`);
    
    // Clean up empty rooms
    if (this.connections.size === 0) {
      conversationRooms.delete(this.conversationId);
      console.log(`Conversation room ${this.conversationId} cleaned up (no connections)`);
    }
  }

  broadcast(message: WSMessage, exclude?: AuthenticatedWebSocket): void {
    console.log(`Broadcasting to conversation ${this.conversationId}: ${message.type}`);
    
    this.connections.forEach((ws: AuthenticatedWebSocket) => {
      if (ws !== exclude && ws.readyState === ws.OPEN) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error sending message to user ${ws.userEmail}:`, error);
          // Remove broken connections
          this.removeConnection(ws);
        }
      }
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getConnectedUsers(): Array<{ userId: number; userEmail: string }> {
    return Array.from(this.connections).map(ws => ({
      userId: ws.userId!,
      userEmail: ws.userEmail!
    }));
  }
}

// Global registry of conversation rooms
const conversationRooms = new Map<number, ConversationRoom>();

export async function joinConversationRoom(ws: AuthenticatedWebSocket, conversationId: number): Promise<void> {
  try {
    // Leave current room if in one
    if (ws.conversationId) {
      await leaveConversationRoom(ws, ws.conversationId);
    }

    // Get or create conversation room
    let room = conversationRooms.get(conversationId);
    if (!room) {
      room = new ConversationRoom(conversationId);
      conversationRooms.set(conversationId, room);
      console.log(`Created new conversation room for conversation ${conversationId}`);
    }

    // Add connection to room
    room.addConnection(ws);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'joined_conversation',
      conversationId: conversationId,
      data: {
        conversationId,
        connectionCount: room.getConnectionCount(),
        connectedUsers: room.getConnectedUsers()
      }
    }));

    // Notify other users in the room
    room.broadcast({
      type: 'user_joined',
      conversationId: conversationId,
      data: {
        userId: ws.userId,
        userEmail: ws.userEmail,
        connectionCount: room.getConnectionCount()
      }
    }, ws);

  } catch (error) {
    console.error('Error joining conversation room:', error);
    ws.send(JSON.stringify({
      type: 'error',
      data: { error: 'Failed to join conversation' }
    }));
  }
}

export async function leaveConversationRoom(ws: AuthenticatedWebSocket, conversationId: number): Promise<void> {
  try {
    const room = conversationRooms.get(conversationId);
    if (!room) {
      console.log(`No room found for conversation ${conversationId}`);
      return;
    }

    // Notify other users before leaving
    room.broadcast({
      type: 'user_left',
      conversationId: conversationId,
      data: {
        userId: ws.userId,
        userEmail: ws.userEmail,
        connectionCount: room.getConnectionCount() - 1
      }
    }, ws);

    // Remove connection from room
    room.removeConnection(ws);

    // Send confirmation
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'left_conversation',
        conversationId: conversationId,
        data: { conversationId }
      }));
    }

  } catch (error) {
    console.error('Error leaving conversation room:', error);
  }
}

export async function broadcastToConversation(conversationId: number, message: WSMessage, exclude?: AuthenticatedWebSocket): Promise<void> {
  try {
    const room = conversationRooms.get(conversationId);
    if (!room) {
      console.log(`No room found for conversation ${conversationId} to broadcast to`);
      return;
    }

    room.broadcast(message, exclude);
  } catch (error) {
    console.error('Error broadcasting to conversation:', error);
  }
}

export function getConversationRoomStats(): Array<{ conversationId: number; connectionCount: number; connectedUsers: Array<{ userId: number; userEmail: string }> }> {
  return Array.from(conversationRooms.entries()).map(([conversationId, room]) => ({
    conversationId,
    connectionCount: room.getConnectionCount(),
    connectedUsers: room.getConnectedUsers()
  }));
}

export function cleanupAllRooms(): void {
  console.log('Cleaning up all conversation rooms...');
  conversationRooms.clear();
}

// Periodic cleanup of stale connections
setInterval(() => {
  conversationRooms.forEach((room, conversationId) => {
    const staleConnections: AuthenticatedWebSocket[] = [];
    
    room.connections.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.readyState !== ws.OPEN) {
        staleConnections.push(ws);
      }
    });
    
    staleConnections.forEach((ws) => {
      console.log(`Cleaning up stale connection for user ${ws.userEmail} in conversation ${conversationId}`);
      room.removeConnection(ws);
    });
  });
}, 30000); // Every 30 seconds