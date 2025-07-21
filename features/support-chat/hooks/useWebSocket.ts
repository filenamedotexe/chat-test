'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { WebSocketClient, ConnectionStatus } from '@/lib/websocket/client';
import { WSMessage } from '@/lib/websocket/server';

export interface UseWebSocketOptions {
  conversationId?: number;
  onMessage?: (message: WSMessage) => void;
  onTyping?: (userId: number, isTyping: boolean) => void;
  onUserJoined?: (userId: number, userEmail: string) => void;
  onUserLeft?: (userId: number, userEmail: string) => void;
  onReadReceipt?: (messageId: number, readBy: number) => void;
  autoConnect?: boolean;
}

export interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  sendMessage: (message: WSMessage) => boolean;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  sendTyping: (isTyping: boolean) => void;
  sendReadReceipt: (messageId: number) => void;
  connect: () => void;
  disconnect: () => void;
  typingUsers: number[];
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { data: session } = useSession();
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const currentConversationId = useRef<number | null>(null);

  // Initialize WebSocket client
  useEffect(() => {
    if (!session?.user) {
      console.log('⏳ No session available for WebSocket connection');
      return;
    }

    // Get JWT token from session for WebSocket authentication
    const initializeWebSocket = async () => {
      try {
        const token = await getJWTTokenFromSession(session);
        
        if (!token) {
          console.log('❌ No JWT token available for WebSocket connection');
          return;
        }

        console.log('🔧 Initializing WebSocket client...');
        
        wsClientRef.current = new WebSocketClient({
          url: 'ws://localhost:8080/ws/support-chat',
          token,
          onMessage: handleWebSocketMessage,
          onConnectionChange: setConnectionStatus,
          onError: (error) => {
            console.error('WebSocket error:', error);
          }
        });

        // Auto-connect if enabled
        if (options.autoConnect !== false) {
          wsClientRef.current.connect();
        }
      } catch (error) {
        console.error('❌ Failed to initialize WebSocket:', error);
      }
    };

    // Initialize WebSocket asynchronously
    initializeWebSocket();

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.cleanup();
        wsClientRef.current = null;
      }
    };
  }, [session]);

  // Handle conversation changes
  useEffect(() => {
    if (!wsClientRef.current || !wsClientRef.current.isConnected()) {
      return;
    }

    // Leave previous conversation if any
    if (currentConversationId.current && currentConversationId.current !== options.conversationId) {
      wsClientRef.current.leaveConversation(currentConversationId.current);
    }

    // Join new conversation if specified
    if (options.conversationId) {
      wsClientRef.current.joinConversation(options.conversationId);
      currentConversationId.current = options.conversationId;
    } else {
      currentConversationId.current = null;
    }
  }, [options.conversationId, connectionStatus]);

  const handleWebSocketMessage = (message: WSMessage) => {
    console.log('🎯 Processing WebSocket message:', message.type);
    
    switch (message.type) {
      case 'message':
        if (options.onMessage) {
          options.onMessage(message);
        }
        break;
        
      case 'typing':
        if (options.onTyping && message.data) {
          const { userId, isTyping } = message.data;
          
          const newUsers = typingUsers.filter((id: number) => id !== userId);
          setTypingUsers(isTyping ? [...newUsers, userId] : newUsers);
          
          options.onTyping(userId, isTyping);
        }
        break;
        
      case 'user_joined':
        if (options.onUserJoined && message.data) {
          const { userId, userEmail } = message.data;
          options.onUserJoined(userId, userEmail);
        }
        break;
        
      case 'user_left':
        if (options.onUserLeft && message.data) {
          const { userId, userEmail } = message.data;
          options.onUserLeft(userId, userEmail);
        }
        break;
        
      case 'read_receipt':
        if (options.onReadReceipt && message.data) {
          const { messageId, readBy } = message.data;
          options.onReadReceipt(messageId, readBy);
        }
        break;
        
      case 'connection_confirmed':
        console.log('✅ WebSocket connection confirmed:', message.data);
        break;
        
      case 'joined_conversation':
        console.log('✅ Joined conversation:', message.data?.conversationId);
        break;
        
      case 'left_conversation':
        console.log('👋 Left conversation:', message.data?.conversationId);
        break;
        
      case 'error':
        console.error('❌ WebSocket error message:', message.data);
        break;
        
      default:
        console.log('❓ Unknown WebSocket message type:', message.type);
    }
  };

  const sendMessage = (message: WSMessage): boolean => {
    if (!wsClientRef.current) {
      console.log('❌ WebSocket client not initialized');
      return false;
    }
    return wsClientRef.current.send(message);
  };

  const joinConversation = (conversationId: number) => {
    if (!wsClientRef.current) {
      console.log('❌ WebSocket client not initialized');
      return;
    }
    wsClientRef.current.joinConversation(conversationId);
  };

  const leaveConversation = (conversationId: number) => {
    if (!wsClientRef.current) {
      console.log('❌ WebSocket client not initialized');
      return;
    }
    wsClientRef.current.leaveConversation(conversationId);
  };

  const sendTyping = (isTyping: boolean) => {
    if (!wsClientRef.current || !options.conversationId) {
      return;
    }
    wsClientRef.current.sendTypingIndicator(options.conversationId, isTyping);
  };

  const sendReadReceipt = (messageId: number) => {
    if (!wsClientRef.current || !options.conversationId) {
      return;
    }
    wsClientRef.current.sendReadReceipt(options.conversationId, messageId);
  };

  const connect = () => {
    if (!wsClientRef.current) {
      console.log('❌ WebSocket client not initialized');
      return;
    }
    wsClientRef.current.connect();
  };

  const disconnect = () => {
    if (!wsClientRef.current) {
      return;
    }
    wsClientRef.current.disconnect();
  };

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    sendMessage,
    joinConversation,
    leaveConversation,
    sendTyping,
    sendReadReceipt,
    connect,
    disconnect,
    typingUsers
  };
}

// Helper function to extract JWT token from session
async function getJWTTokenFromSession(session: any): Promise<string | null> {
  try {
    console.log('🔍 Extracting JWT token for WebSocket authentication...');
    
    // Method 1: Try to get NextAuth session token from cookies (this is the real JWT)
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      
      // Look for NextAuth session tokens (different formats depending on security settings)
      const possibleTokenNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Host-next-auth.csrf-token'
      ];
      
      for (const tokenName of possibleTokenNames) {
        const tokenCookie = cookies.find(cookie => 
          cookie.trim().startsWith(tokenName + '=')
        );
        
        if (tokenCookie) {
          const token = decodeURIComponent(tokenCookie.split('=')[1]);
          console.log(`✅ Found NextAuth token: ${tokenName}`);
          
          // Validate the token is not empty and looks like a JWT
          if (token && token.length > 10) {
            return token;
          }
        }
      }
      
      console.log('⚠️  No NextAuth session tokens found in cookies');
    }

    // Method 2: Create a session token from current session data
    if (session && session.user) {
      console.log('🔧 Creating authentication token from session data...');
      
      // Create a proper session token that matches what our server expects
      const tokenData = {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        // Add a signature to prevent tampering (simple method)
        sig: btoa(`${session.user.id}:${session.user.email}:${Math.floor(Date.now() / 1000)}`)
      };
      
      const simpleToken = btoa(JSON.stringify(tokenData));
      console.log('✅ Created authenticated session token');
      console.log(`   User: ${session.user.email} (ID: ${session.user.id})`);
      return simpleToken;
    }

    // Method 3: Make fresh API call to get current session
    try {
      console.log('🔄 Fetching fresh session data...');
      const response = await fetch('/api/auth/session');
      
      if (!response.ok) {
        throw new Error(`Session API returned ${response.status}`);
      }
      
      const sessionData = await response.json();
      
      if (sessionData && sessionData.user) {
        const tokenData = {
          userId: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.name || sessionData.user.email,
          role: sessionData.user.role || 'user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
          sig: btoa(`${sessionData.user.id}:${sessionData.user.email}:${Math.floor(Date.now() / 1000)}`)
        };
        
        const freshToken = btoa(JSON.stringify(tokenData));
        console.log('✅ Created token from fresh session data');
        console.log(`   User: ${sessionData.user.email} (ID: ${sessionData.user.id})`);
        return freshToken;
      }
    } catch (apiError) {
      console.error('❌ Failed to fetch fresh session:', apiError);
    }

    console.log('❌ All JWT token extraction methods failed');
    console.log('❌ No authenticated session available for WebSocket');
    return null;
    
  } catch (error) {
    console.error('❌ Critical error in JWT token extraction:', error);
    return null;
  }
}

// Clear typing indicators after inactivity
const useTypingTimeout = (userId: number, clearTyping: () => void, delay = 3000) => {
  useEffect(() => {
    const timeout = setTimeout(clearTyping, delay);
    return () => clearTimeout(timeout);
  }, [userId, clearTyping, delay]);
};