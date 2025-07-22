'use client';

import { useEffect, useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { ConversationHeader } from '../../components/ConversationHeader';
import { MessageThread } from '../../components/MessageThread';
import { MessageComposer } from '../../components/MessageComposer';
import { AIHandoffContext } from '../../components/AIHandoffContext';

interface ConversationPageProps {
  params: {
    id: string;
  };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const conversationId = parseInt(params.id);
  const { conversation, messages, loading, error, sendMessage, refresh } = useMessages(conversationId);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Redirect if invalid conversation ID
  useEffect(() => {
    if (isNaN(conversationId)) {
      window.location.href = '/support';
    }
  }, [conversationId]);

  const handleMessageSent = async (messageData: any) => {
    // Refresh the conversation to get the latest messages
    refresh();
  };

  const handleSendMessage = async (content: string) => {
    try {
      setSendingMessage(true);
      await sendMessage(content);
      // Messages will be updated by the hook automatically
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white pt-20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-white mb-2">Conversation Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a 
            href="/support" 
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Conversations
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto h-[calc(100vh-5rem)] px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col h-full">
          {/* Conversation Header */}
          <ConversationHeader conversationId={conversationId} conversation={conversation} />
          
          {/* AI Handoff Context (if applicable) */}
          {conversation?.type === 'ai_handoff' && conversation?.context_json && (
            <AIHandoffContext contextData={conversation.context_json} />
          )}
          
          {/* Message Thread - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <MessageThread conversationId={conversationId} messages={messages} />
          </div>
          
          {/* Message Composer - Fixed at bottom */}
          <MessageComposer 
            conversationId={conversationId} 
            onMessageSent={handleMessageSent}
            disabled={sendingMessage}
          />
        </div>
      </div>
    </div>
  );
}