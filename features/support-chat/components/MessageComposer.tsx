'use client';

import { useState } from 'react';

interface MessageComposerProps {
  conversationId: number;
  onMessageSent?: (message: any) => void;
  disabled?: boolean;
}

export function MessageComposer({ conversationId, onMessageSent, disabled = false }: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;
    
    setSending(true);
    
    try {
      // Import the useMessages hook functionality here
      const response = await fetch('/api/support-chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId,
          content: message.trim(),
          messageType: 'text',
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
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send message: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Message sent successfully:', result.message);
      
      setMessage('');
      setAttachments([]);
      
      // Trigger parent component to refresh messages
      if (onMessageSent) {
        onMessageSent(result.message);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast/notification to user
      alert(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      {/* File Attachments */}
      {attachments.length > 0 && (
        <div className="mb-4">
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-2">
                <div className="flex items-center space-x-2">
                  <div className="text-blue-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex space-x-2">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-blue-500 transition-colors"
              rows={3}
              maxLength={2000}
              disabled={sending || disabled}
            />
          </div>
        </div>
        
        {/* Bottom Row - File Upload, Character Count, Send Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* File Upload */}
            <input
              type="file"
              id="file-upload"
              onChange={handleFileSelect}
              multiple
              accept="image/*,application/pdf,.txt,.doc,.docx,.zip"
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center space-x-1 text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-sm">Attach</span>
            </label>
            
            {/* Character Count */}
            <span className="text-xs text-gray-500">
              {message.length}/2000
            </span>
          </div>
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={sending || disabled || (!message.trim() && attachments.length === 0)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}