'use client';

import { useEffect, useRef, useState } from 'react';
import type { Message } from './useMessages';

export interface WSMessage {
  type: 'message' | 'join_conversation' | 'leave_conversation' | 'typing' | 'read_receipt';
  conversationId?: number;
  data?: any;
}

export interface UseRealTimeUpdatesOptions {
  conversationId?: number;
  onMessage?: (message: Message) => void;
  onTyping?: (userId: number, isTyping: boolean) => void;
  onReadReceipt?: (messageId: number, readBy: number) => void;
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }
    
    setConnectionStatus('connecting');
    
    try {
      // TODO: Replace with actual WebSocket server URL
      const wsUrl = `ws${window.location.protocol === 'https:' ? 's' : ''}://${window.location.host}/ws/support-chat`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Join conversation room if specified
        if (options.conversationId) {
          send({
            type: 'join_conversation',
            conversationId: options.conversationId,
          });
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const wsMessage: WSMessage = JSON.parse(event.data);
          handleMessage(wsMessage);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          setConnectionStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)); // Exponential backoff, max 10s
        } else {
          setConnectionStatus('disconnected');
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  };
  
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      // Leave conversation room if joined
      if (options.conversationId) {
        send({
          type: 'leave_conversation',
          conversationId: options.conversationId,
        });
      }
      
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setTypingUsers(new Set());
  };
  
  const send = (message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  };
  
  const handleMessage = (wsMessage: WSMessage) => {
    switch (wsMessage.type) {
      case 'message':
        if (options.onMessage && wsMessage.data) {
          options.onMessage(wsMessage.data as Message);
        }
        break;
        
      case 'typing':
        if (options.onTyping && wsMessage.data) {
          const { userId, isTyping } = wsMessage.data;
          
          const newSet = new Set(typingUsers);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          setTypingUsers(newSet);
          
          options.onTyping(userId, isTyping);
        }
        break;
        
      case 'read_receipt':
        if (options.onReadReceipt && wsMessage.data) {
          const { messageId, readBy } = wsMessage.data;
          options.onReadReceipt(messageId, readBy);
        }
        break;
        
      default:
        console.log('Unhandled WebSocket message:', wsMessage);
    }
  };
  
  const sendTyping = (isTyping: boolean) => {
    if (options.conversationId) {
      send({
        type: 'typing',
        conversationId: options.conversationId,
        data: { isTyping },
      });
    }
  };
  
  const sendReadReceipt = (messageId: number) => {
    if (options.conversationId) {
      send({
        type: 'read_receipt',
        conversationId: options.conversationId,
        data: { messageId },
      });
    }
  };
  
  // Auto-connect when component mounts or conversationId changes
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [options.conversationId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);
  
  return {
    isConnected,
    connectionStatus,
    typingUsers: Array.from(typingUsers),
    connect,
    disconnect,
    send,
    sendTyping,
    sendReadReceipt,
  };
}