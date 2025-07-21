'use client';

import { ConnectionStatus } from '@/lib/websocket/client';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export function ConnectionStatusIndicator({ status, className = '' }: ConnectionStatusIndicatorProps) {
  const getStatusInfo = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return {
          text: 'Connected',
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          borderColor: 'border-green-400/20',
          icon: (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )
        };
      case 'connecting':
        return {
          text: 'Connecting...',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/20',
          icon: (
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          )
        };
      case 'reconnecting':
        return {
          text: 'Reconnecting...',
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          borderColor: 'border-orange-400/20',
          icon: (
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
          )
        };
      case 'disconnected':
        return {
          text: 'Disconnected',
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/20',
          icon: (
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          )
        };
      case 'error':
        return {
          text: 'Connection Error',
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/20',
          icon: (
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          )
        };
      default:
        return {
          text: 'Unknown',
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/20',
          icon: (
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          )
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${statusInfo.bgColor} ${statusInfo.borderColor} ${className}`}>
      {statusInfo.icon}
      <span className={`text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    </div>
  );
}

interface TypingIndicatorProps {
  typingUsers: number[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className = '' }: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    const count = typingUsers.length;
    if (count === 1) {
      return 'Someone is typing...';
    } else if (count === 2) {
      return '2 people are typing...';
    } else {
      return `${count} people are typing...`;
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-400 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}

interface RealTimeStatusProps {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  typingUsers: number[];
  className?: string;
}

export function RealTimeStatus({ connectionStatus, isConnected, typingUsers, className = '' }: RealTimeStatusProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <ConnectionStatusIndicator status={connectionStatus} />
      <TypingIndicator typingUsers={typingUsers} />
    </div>
  );
}