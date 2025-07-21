'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface NotificationPreferences {
  browser: boolean;
  toast: boolean;
  sound: boolean;
  email: boolean;
}

interface NotificationContextType {
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  showNotification: (title: string, message: string, options?: NotificationOptions) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    browser: true,
    toast: true,
    sound: true,
    email: false
  });
  const [hasPermission, setHasPermission] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  // Load user preferences from localStorage
  useEffect(() => {
    if (session?.user?.id) {
      const savedPrefs = localStorage.getItem(`notification-prefs-${session.user.id}`);
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          setPreferences({ ...preferences, ...parsed });
        } catch (error) {
          console.error('Failed to load notification preferences:', error);
        }
      }
    }
  }, [session?.user?.id]);

  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    
    // Save to localStorage
    if (session?.user?.id) {
      localStorage.setItem(`notification-prefs-${session.user.id}`, JSON.stringify(updated));
    }
  }, [preferences, session?.user?.id]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, message: string, options?: NotificationOptions) => {
    if (!preferences.browser || !hasPermission) {
      return;
    }

    // Don't show notifications if the tab is active
    if (!document.hidden) {
      return;
    }

    try {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Click handler to focus the window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }, [preferences.browser, hasPermission]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (!preferences.toast) {
      return;
    }

    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      default:
        toast(message);
    }
  }, [preferences.toast]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!preferences.sound) {
      return;
    }

    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [preferences.sound]);

  // Enhanced notification methods that include sound
  const enhancedShowNotification = useCallback((title: string, message: string, options?: NotificationOptions) => {
    showNotification(title, message, options);
    playNotificationSound();
  }, [showNotification, playNotificationSound]);

  const enhancedShowToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    showToast(message, type);
    if (type !== 'success') { // Don't play sound for success messages
      playNotificationSound();
    }
  }, [showToast, playNotificationSound]);

  const value: NotificationContextType = {
    preferences,
    updatePreferences,
    showNotification: enhancedShowNotification,
    showToast: enhancedShowToast,
    requestPermission,
    hasPermission,
    unreadCount,
    setUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}