'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, X, MessageSquare, UserPlus, Clock, CheckCircle } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, ScrollArea } from '@chat/ui';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { formatDistanceToNow } from 'date-fns';

interface AdminNotification {
  id: string;
  type: 'new_conversation' | 'urgent_message' | 'conversation_escalated' | 'user_waiting';
  title: string;
  message: string;
  conversationId?: number;
  userId?: number;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

interface AdminNotificationCenterProps {
  className?: string;
}

export function AdminNotificationCenter({ className }: AdminNotificationCenterProps) {
  const { data: session } = useSession();
  const { showToast } = useNotifications();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Only show for admins - moved after all hooks
  const isAdmin = session?.user?.role === 'admin';

  // Load notifications
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Simulate loading admin notifications
      // In real implementation, this would fetch from API
      const mockNotifications: AdminNotification[] = [
        {
          id: '1',
          type: 'new_conversation',
          title: 'New Support Conversation',
          message: 'Zach Wieder started a conversation about "Login Issues"',
          conversationId: 31, // Use real conversation ID
          userId: 54,
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          read: false,
          urgent: false
        },
        {
          id: '2',
          type: 'urgent_message',
          title: 'Urgent Message',
          message: 'User reported critical bug in payment system',
          conversationId: 30, // Use real conversation ID
          userId: 54,
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          read: false,
          urgent: true
        },
        {
          id: '3',
          type: 'user_waiting',
          title: 'User Waiting',
          message: 'Customer has been waiting for response for 30 minutes',
          conversationId: 28, // Use real conversation ID with chat history
          userId: 54,
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          read: true,
          urgent: true
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const updated = notifications.map((n: AdminNotification) => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);

    // In real implementation, update on server
    try {
      // await fetch(`/api/admin/notifications/${notificationId}/read`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    const filtered = notifications.filter((n: AdminNotification) => n.id !== notificationId);
    setNotifications(filtered);
    
    try {
      // await fetch(`/api/admin/notifications/${notificationId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleNotificationClick = async (notification: AdminNotification) => {
    await markAsRead(notification.id);
    
    if (notification.conversationId) {
      // Navigate to conversation - using correct URL structure
      window.location.href = `/support/${notification.conversationId}`;
    }
  };

  const getNotificationIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'new_conversation':
        return <MessageSquare className="h-4 w-4" />;
      case 'urgent_message':
        return <Bell className="h-4 w-4 text-red-500" />;
      case 'conversation_escalated':
        return <UserPlus className="h-4 w-4" />;
      case 'user_waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.urgent && !n.read).length;

  // Return null for non-admins after all hooks are called
  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive"
            className="absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-red-600"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <Card className="w-96 max-h-96 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Admin Notifications</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-80">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    All caught up! No new notifications.
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-medium ${
                                    !notification.read ? 'text-gray-900' : 'text-gray-600'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  {notification.urgent && (
                                    <Badge variant="destructive" className="text-xs">
                                      URGENT
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  dismissNotification(notification.id);
                                }}
                                className="flex-shrink-0 ml-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}