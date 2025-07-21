'use client';

import { useEffect } from 'react';
import { useNotifications } from './NotificationProvider';
import { useConversations } from '@/features/support-chat/hooks/useConversations';
import { Badge } from '@chat/ui';

interface UnreadCounterProps {
  className?: string;
  showZero?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export function UnreadCounter({ 
  className = '', 
  showZero = false, 
  variant = 'destructive' 
}: UnreadCounterProps) {
  const { unreadCount, setUnreadCount } = useNotifications();
  const { conversations, loading } = useConversations();

  // Calculate unread count from conversations
  useEffect(() => {
    if (!loading && conversations) {
      const totalUnread = conversations.reduce((total, conversation) => {
        return total + (conversation.unreadCount || 0);
      }, 0);
      
      setUnreadCount(totalUnread);
    }
  }, [conversations, loading, setUnreadCount]);

  if (!showZero && unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant={variant} className={`${className} min-w-5 h-5 flex items-center justify-center p-0 text-xs`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}

interface UnreadDotProps {
  className?: string;
  show?: boolean;
}

export function UnreadDot({ className = '', show }: UnreadDotProps) {
  const { unreadCount } = useNotifications();
  const hasUnread = show !== undefined ? show : unreadCount > 0;

  if (!hasUnread) {
    return null;
  }

  return (
    <div className={`absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ${className}`} />
  );
}

interface ConversationUnreadProps {
  conversationId: number;
  unreadCount?: number;
  className?: string;
}

export function ConversationUnread({ 
  conversationId, 
  unreadCount = 0,
  className = '' 
}: ConversationUnreadProps) {
  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={`${className} min-w-5 h-5 flex items-center justify-center p-0 text-xs`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}