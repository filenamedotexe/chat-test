'use client';

import { useEffect, useRef } from 'react';

interface MessageThreadProps {
  conversationId: number;
  messages?: Message[];
}

interface Message {
  id: number;
  senderId: number;
  senderType: 'user' | 'admin' | 'system';
  senderName: string;
  content: string;
  messageType: string;
  createdAt: string;
  readAt?: string;
}

export function MessageThread({ conversationId, messages: propMessages }: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Use prop messages or fallback to placeholder
  const messages: Message[] = propMessages || [
    {
      id: 1,
      senderId: 1,
      senderType: 'user',
      senderName: 'John Doe',
      content: 'Hi, I\'m having trouble logging into my account. Every time I try to sign in, it says my credentials are invalid, but I\'m sure they\'re correct.',
      messageType: 'text',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    },
    {
      id: 2,
      senderId: 2,
      senderType: 'admin',
      senderName: 'Support Agent',
      content: 'Hi John! I\'m sorry to hear you\'re having trouble with your account. Let me help you with that. Can you tell me what email address you\'re using to sign in?',
      messageType: 'text',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
      readAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    },
    {
      id: 3,
      senderId: 1,
      senderType: 'user',
      senderName: 'John Doe',
      content: 'I\'m using john.doe@example.com - that should be the correct email address.',
      messageType: 'text',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 min ago
    },
    {
      id: 4,
      senderId: 2,
      senderType: 'system',
      senderName: 'System',
      content: 'Conversation was assigned to Support Agent',
      messageType: 'system',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    }
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.senderType === 'user';
    const isSystem = message.senderType === 'system';
    const showDateDivider = index === 0 || 
      formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

    return (
      <div key={message.id}>
        {/* Date Divider */}
        {showDateDivider && (
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-800 text-gray-400 text-sm px-3 py-1 rounded-full">
              {formatDate(message.createdAt)}
            </div>
          </div>
        )}
        
        {/* System Message */}
        {isSystem ? (
          <div className="flex justify-center my-2">
            <div className="bg-gray-800 text-gray-400 text-sm px-3 py-1 rounded-lg max-w-md text-center">
              {message.content}
            </div>
          </div>
        ) : (
          /* User/Admin Message */
          <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md ${
              isCurrentUser 
                ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                : 'bg-gray-800 text-white rounded-r-lg rounded-tl-lg'
            } px-4 py-2`}>
              {/* Sender Name (for admin messages) */}
              {!isCurrentUser && (
                <div className="text-xs text-gray-400 mb-1">
                  {message.senderName}
                </div>
              )}
              
              {/* Message Content */}
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
              
              {/* Timestamp and Read Status */}
              <div className={`text-xs mt-2 ${
                isCurrentUser ? 'text-blue-200' : 'text-gray-500'
              } flex items-center justify-between`}>
                <span>{formatTime(message.createdAt)}</span>
                {isCurrentUser && (
                  <span className="ml-2">
                    {message.readAt ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-950 rounded-lg"
      style={{ maxHeight: 'calc(100vh - 16rem)' }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message below.</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => renderMessage(message, index))
      )}
      
      {/* Typing Indicator (placeholder) */}
      {false && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-800 text-gray-400 px-4 py-2 rounded-r-lg rounded-tl-lg">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}