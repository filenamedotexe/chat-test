'use client';

import { useState } from 'react';
import { useNotifications } from './NotificationProvider';
import { Switch, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@chat/ui';
import { Bell, Volume2, Mail, Monitor } from 'lucide-react';

interface NotificationPreferencesProps {
  className?: string;
}

export function NotificationPreferences({ className }: NotificationPreferencesProps) {
  const {
    preferences,
    updatePreferences,
    requestPermission,
    hasPermission,
    showToast
  } = useNotifications();
  
  const [isRequesting, setIsRequesting] = useState(false);

  const handlePermissionRequest = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        showToast('Browser notifications enabled!', 'success');
      } else {
        showToast('Browser notification permission denied', 'error');
      }
    } catch (error) {
      showToast('Failed to request notification permission', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  const testNotification = () => {
    if (hasPermission) {
      // Test browser notification
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from Support Chat',
        icon: '/favicon.ico'
      });
      
      setTimeout(() => notification.close(), 3000);
      showToast('Test notification sent!', 'success');
    } else {
      showToast('Browser notification permission required', 'error');
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications for new support messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium">Browser Notifications</div>
                <div className="text-sm text-gray-500">
                  Show desktop notifications when chat is not active
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={preferences.browser && hasPermission}
                onCheckedChange={(checked: boolean) => {
                  if (checked && !hasPermission) {
                    handlePermissionRequest();
                  } else {
                    updatePreferences({ browser: checked });
                  }
                }}
                disabled={preferences.browser && !hasPermission}
              />
              {!hasPermission && preferences.browser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePermissionRequest}
                  disabled={isRequesting}
                >
                  {isRequesting ? 'Requesting...' : 'Enable'}
                </Button>
              )}
            </div>
          </div>

          {/* Toast Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium">In-App Notifications</div>
                <div className="text-sm text-gray-500">
                  Show toast notifications within the application
                </div>
              </div>
            </div>
            <Switch
              checked={preferences.toast}
              onCheckedChange={(checked: boolean) => updatePreferences({ toast: checked })}
            />
          </div>

          {/* Sound Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium">Sound Notifications</div>
                <div className="text-sm text-gray-500">
                  Play sound when new messages arrive
                </div>
              </div>
            </div>
            <Switch
              checked={preferences.sound}
              onCheckedChange={(checked: boolean) => updatePreferences({ sound: checked })}
            />
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-500">
                  Send email for urgent messages (coming soon)
                </div>
              </div>
            </div>
            <Switch
              checked={preferences.email}
              onCheckedChange={(checked: boolean) => updatePreferences({ email: checked })}
              disabled={true}
            />
          </div>

          {/* Test Button */}
          {(preferences.browser || preferences.toast) && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={testNotification}
                disabled={!hasPermission && preferences.browser}
                className="w-full"
              >
                Test Notifications
              </Button>
            </div>
          )}

          {/* Permission Status */}
          <div className="pt-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`} />
              Browser permission: {hasPermission ? 'Granted' : 'Not granted'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}