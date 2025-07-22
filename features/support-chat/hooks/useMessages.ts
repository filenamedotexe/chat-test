'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { WSMessage } from '@/lib/websocket/server';

export interface Message {
  id: number;
  senderId: number;
  senderType: 'user' | 'admin' | 'system';
  senderName: string;
  content: string;
  messageType: 'text' | 'system' | 'handoff' | 'file';
  createdAt: string;
  readAt?: string;
  metadata?: any;
}

export interface ConversationDetails {
  id: number;
  subject: string;
  status: string;
  priority: string;
  type?: string;
  createdAt: string;
  context_json?: any; // AI handoff context data
  admin?: {
    id: number;
    name: string;
    email: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ConversationResponse {
  conversation: ConversationDetails;
  messages: Message[];
}

export function useMessages(conversationId: number) {
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Handle real-time WebSocket messages
  const handleRealTimeMessage = (wsMessage: WSMessage) => {
    console.log('🎯 Received real-time message:', wsMessage.type);
    
    if (wsMessage.type === 'message' && wsMessage.data) {
      const newMessage = wsMessage.data as Message;
      
      // Add new message to the list (avoid duplicates)
      const exists = messages.find((msg: Message) => msg.id === newMessage.id);
      if (!exists) {
        setMessages([...messages, newMessage]);
      }
    }
  };

  // WebSocket integration for real-time updates
  const { 
    connectionStatus, 
    isConnected, 
    sendReadReceipt: wsReadReceipt,
    typingUsers
  } = useWebSocket({
    conversationId,
    autoConnect: true,
    onMessage: handleRealTimeMessage,
    onTyping: (userId, isTyping) => {
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'stopped typing'}`);
    },
    onUserJoined: (userId, userEmail) => {
      console.log(`User ${userEmail} joined the conversation`);
    },
    onUserLeft: (userId, userEmail) => {
      console.log(`User ${userEmail} left the conversation`);
    },
    onReadReceipt: (messageId, readBy) => {
      console.log(`Message ${messageId} read by user ${readBy}`);
      // Update message read status
      setMessages(
        messages.map((msg: Message) => 
          msg.id === messageId 
            ? { ...msg, readAt: new Date().toISOString() }
            : msg
        )
      );
    }
  });

  const fetchConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/support-chat/conversations/${conversationId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ConversationResponse = await response.json();
      
      setConversation(data.conversation);
      setMessages(data.messages);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversation';
      setError(errorMessage);
      console.error('Error fetching conversation:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async (content: string, messageType: string = 'text', attachments?: File[]): Promise<Message> => {
    try {
      setSending(true);
      
      // Validate input
      if (!content.trim()) {
        throw new Error('Message content cannot be empty');
      }
      
      if (content.length > 2000) {
        throw new Error('Message too long (max 2000 characters)');
      }
      
      // TODO: Handle file attachments separately
      const response = await fetch('/api/support-chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId,
          content: content.trim(),
          messageType,
        }),
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before sending another message.');
        } else if (response.status === 404) {
          throw new Error('Conversation not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to send messages in this conversation');
        }
        
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Add new message to the list
      setMessages([...messages, result.message]);
      
      return result.message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      throw new Error(errorMessage);
    } finally {
      setSending(false);
    }
  };
  
  const markAsRead = async (messageId: number): Promise<void> => {
    try {
      const response = await fetch(`/api/support-chat/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}), // Empty body marks as read
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Update message read status locally
      setMessages(
        messages.map((msg: Message) => 
          msg.id === messageId 
            ? { ...msg, readAt: new Date().toISOString() }
            : msg
        )
      );

      // Send WebSocket read receipt for real-time updates
      if (isConnected) {
        wsReadReceipt(messageId);
      }
      
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };
  
  const addMessage = (message: Message) => {
    // Avoid duplicates
    const exists = messages.find((m: Message) => m.id === message.id);
    if (exists) return;
    
    setMessages([...messages, message]);
  };
  
  const refresh = () => {
    fetchConversation();
  };
  
  // Initial load
  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);
  
  return {
    conversation,
    messages,
    loading,
    error,
    sending,
    sendMessage,
    markAsRead,
    addMessage,
    refresh,
    // WebSocket integration
    connectionStatus,
    isConnected,
    typingUsers,
  };
}