'use client';

import { useState, useEffect } from 'react';

export interface Conversation {
  id: number;
  subject: string;
  status: 'open' | 'closed' | 'transferred' | 'in_progress';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  admin?: {
    id: number;
    name: string;
    email: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UseConversationsOptions {
  status?: string;
  priority?: string;
  limit?: number;
  isAdmin?: boolean;
}

export function useConversations(options: UseConversationsOptions = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false
  });

  const fetchConversations = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: (options.limit || 20).toString(),
      });
      
      if (options.status && options.status !== 'all') {
        params.set('status', options.status);
      }
      
      if (options.priority && options.priority !== 'all') {
        params.set('priority', options.priority);
      }
      
      // Choose endpoint based on admin status
      const endpoint = options.isAdmin 
        ? `/api/support-chat/admin/conversations?${params.toString()}`
        : `/api/support-chat/conversations?${params.toString()}`;
      
      const response = await fetch(endpoint, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ConversationsResponse = await response.json();
      
      if (page === 1) {
        setConversations(data.conversations);
      } else {
        setConversations([...conversations, ...data.conversations]);
      }
      
      setPagination(data.pagination);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchConversations(pagination.page + 1);
    }
  };
  
  const refresh = () => {
    fetchConversations(1);
  };
  
  const createConversation = async (data: {
    subject: string;
    initialMessage: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    context?: any;
  }): Promise<Conversation> => {
    try {
      // Validate input
      if (!data.subject.trim()) {
        throw new Error('Subject is required');
      }
      
      if (!data.initialMessage.trim()) {
        throw new Error('Initial message is required');
      }
      
      if (data.subject.length > 255) {
        throw new Error('Subject too long (max 255 characters)');
      }
      
      if (data.initialMessage.length > 2000) {
        throw new Error('Initial message too long (max 2000 characters)');
      }
      
      const response = await fetch('/api/support-chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: data.subject.trim(),
          initialMessage: data.initialMessage.trim(),
          priority: data.priority || 'normal',
          context: data.context
        }),
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before creating another conversation.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to create conversations');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create conversation: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Add new conversation to the beginning of the list
      setConversations([result.conversation, ...conversations]);
      
      return result.conversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      throw new Error(errorMessage);
    }
  };
  
  const updateConversation = async (id: number, updates: {
    status?: string;
    adminId?: number;
    priority?: string;
  }): Promise<Conversation> => {
    try {
      const response = await fetch(`/api/support-chat/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update conversation in the list
      setConversations(
        conversations.map(conv => 
          conv.id === id ? { ...conv, ...result.conversation } : conv
        )
      );
      
      return result.conversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation';
      throw new Error(errorMessage);
    }
  };
  
  // Initial load
  useEffect(() => {
    fetchConversations(1);
  }, [options.status, options.priority, options.isAdmin]);
  
  return {
    conversations,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
    createConversation,
    updateConversation,
  };
}