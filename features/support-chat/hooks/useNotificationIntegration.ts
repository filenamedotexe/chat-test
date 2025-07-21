'use client';

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { useWebSocket } from './useWebSocket';
import { WSMessage } from '@/lib/websocket/server';
import { SupportChatMessage, SupportChatConversation } from '@/lib/types/support-chat';

interface UseNotificationIntegrationOptions {
  conversationId?: number;
  isActive?: boolean; // Whether the conversation is currently being viewed
}

export function useNotificationIntegration({ 
  conversationId, 
  isActive = false 
}: UseNotificationIntegrationOptions = {}) {
  const { data: session } = useSession();
  const { 
    showNotification, 
    showToast, 
    setUnreadCount,
    preferences 
  } = useNotifications();

  // Handle new message notifications
  const handleNewMessage = useCallback((message: WSMessage) => {
    if (message.type !== 'message' || !message.data) {
      return;
    }

    const messageData = message.data as SupportChatMessage;
    
    // Don't notify for own messages
    if (messageData.sender_id === parseInt(session?.user?.id || '0')) {
      return;
    }

    // Don't show notifications if the conversation is currently active
    if (isActive && !document.hidden) {
      return;
    }

    const senderName = messageData.sender_name || 'Support';
    const notificationTitle = `New message from ${senderName}`;
    const messagePreview = messageData.content.length > 100 
      ? `${messageData.content.substring(0, 100)}...`
      : messageData.content;

    // Show browser notification
    showNotification(notificationTitle, messagePreview, {
      tag: `support-message-${messageData.id}`,
      requireInteraction: false
    });

    // Show toast notification
    showToast(`${senderName}: ${messagePreview}`, 'info');
  }, [session?.user?.id, isActive, showNotification, showToast]);

  // Handle conversation status changes
  const handleConversationUpdate = useCallback((message: WSMessage) => {
    if (message.type !== 'conversation_updated' || !message.data) {
      return;
    }

    const conversationData = message.data as Partial<SupportChatConversation>;
    
    // Notify admins when conversation status changes
    if (session?.user?.role === 'admin') {
      switch (conversationData.status) {
        case 'open':
          showToast(`Conversation #${conversationData.id} opened`, 'info');
          break;
        case 'resolved':
          showToast(`Conversation #${conversationData.id} resolved`, 'success');
          break;
        case 'closed':
          showToast(`Conversation #${conversationData.id} closed`, 'info');
          break;
      }
    }
  }, [session?.user?.role, showToast]);

  // Handle user join/leave notifications
  const handleUserPresence = useCallback((message: WSMessage) => {
    if (!message.data) return;

    const { userId, userEmail } = message.data;
    
    // Don't notify about own presence
    if (userId === parseInt(session?.user?.id || '0')) {
      return;
    }

    const userName = userEmail?.split('@')[0] || 'User';

    switch (message.type) {
      case 'user_joined':
        if (session?.user?.role === 'admin' || isActive) {
          showToast(`${userName} joined the conversation`, 'info');
        }
        break;
      case 'user_left':
        if (session?.user?.role === 'admin' || isActive) {
          showToast(`${userName} left the conversation`, 'info');
        }
        break;
    }
  }, [session?.user?.id, session?.user?.role, isActive, showToast]);

  // Handle admin notifications for new conversations
  const handleNewConversation = useCallback((message: WSMessage) => {
    if (message.type !== 'new_conversation' || !message.data) {
      return;
    }

    // Only notify admins
    if (session?.user?.role !== 'admin') {
      return;
    }

    const conversationData = message.data as SupportChatConversation;
    const notificationTitle = 'New Support Conversation';
    const notificationMessage = `${conversationData.user_name} started a new conversation: ${conversationData.subject}`;

    showNotification(notificationTitle, notificationMessage, {
      tag: `new-conversation-${conversationData.id}`,
      requireInteraction: true // Require admin attention
    });

    showToast(`New conversation from ${conversationData.user_name}`, 'info');
  }, [session?.user?.role, showNotification, showToast]);

  // Set up WebSocket message handler
  const webSocketHandler = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'message':
        handleNewMessage(message);
        break;
      case 'conversation_updated':
        handleConversationUpdate(message);
        break;
      case 'user_joined':
      case 'user_left':
        handleUserPresence(message);
        break;
      case 'new_conversation':
        handleNewConversation(message);
        break;
      default:
        // Ignore other message types
        break;
    }
  }, [handleNewMessage, handleConversationUpdate, handleUserPresence, handleNewConversation]);

  // Initialize WebSocket with notification handler
  const { connectionStatus, isConnected } = useWebSocket({
    conversationId,
    onMessage: webSocketHandler,
    autoConnect: true
  });

  // Update unread counts based on conversations
  const updateUnreadCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/support-chat/conversations?unread_only=true');
      if (response.ok) {
        const conversations = await response.json();
        const totalUnread = conversations.reduce((sum: number, conv: any) => {
          return sum + (conv.unread_count || 0);
        }, 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Failed to update unread counts:', error);
    }
  }, [setUnreadCount]);

  // Periodically update unread counts
  useEffect(() => {
    updateUnreadCounts();
    
    const interval = setInterval(updateUnreadCounts, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [updateUnreadCounts]);

  // Notification methods for external use
  const notifyNewMessage = useCallback((message: SupportChatMessage, conversation?: SupportChatConversation) => {
    const senderName = message.sender_name || 'Support';
    const notificationTitle = conversation 
      ? `${senderName} in "${conversation.subject}"`
      : `New message from ${senderName}`;
    
    const messagePreview = message.content.length > 100 
      ? `${message.content.substring(0, 100)}...`
      : message.content;

    showNotification(notificationTitle, messagePreview);
    showToast(`${senderName}: ${messagePreview}`, 'info');
  }, [showNotification, showToast]);

  const notifyConversationStatusChange = useCallback((conversation: SupportChatConversation, oldStatus: string) => {
    if (session?.user?.role === 'admin') {
      showToast(`Conversation "${conversation.subject}" changed from ${oldStatus} to ${conversation.status}`, 'info');
    }
  }, [session?.user?.role, showToast]);

  return {
    connectionStatus,
    isConnected,
    notifyNewMessage,
    notifyConversationStatusChange,
    updateUnreadCounts,
    preferences
  };
}