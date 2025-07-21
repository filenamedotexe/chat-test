'use client';

import { useState } from 'react';
import { useConversations } from '../../hooks/useConversations';
import { ConversationList } from '../../components/ConversationList';

interface NewConversationData {
  subject: string;
  initialMessage: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export default function ConversationsPage() {
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationData, setNewConversationData] = useState<NewConversationData>({
    subject: '',
    initialMessage: '',
    priority: 'normal'
  });
  const [creating, setCreating] = useState(false);
  
  const { conversations, loading, error, createConversation, refresh } = useConversations();

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newConversationData.subject.trim() || !newConversationData.initialMessage.trim()) {
      alert('Please fill in both subject and message');
      return;
    }

    setCreating(true);
    
    try {
      const newConversation = await createConversation({
        subject: newConversationData.subject.trim(),
        initialMessage: newConversationData.initialMessage.trim(),
        priority: newConversationData.priority
      });
      
      // Reset form and close modal
      setNewConversationData({
        subject: '',
        initialMessage: '',
        priority: 'normal'
      });
      setShowNewConversation(false);
      
      // Navigate to the new conversation
      window.location.href = `/support/${newConversation.id}`;
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert(error instanceof Error ? error.message : 'Failed to create conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Support Conversations</h1>
              <p className="text-gray-400 mt-1">Manage your support requests and conversations with our team</p>
            </div>
            <button 
              onClick={() => setShowNewConversation(true)}
              className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              New Conversation
            </button>
          </div>
          
          {/* Conversations List */}
          <ConversationList conversations={conversations} loading={loading} error={error} />
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">New Support Conversation</h2>
            
            <form onSubmit={handleCreateConversation}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={newConversationData.subject}
                    onChange={(e) => setNewConversationData({ ...newConversationData, subject: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Brief description of your issue"
                    maxLength={255}
                    required
                    disabled={creating}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                  <select
                    value={newConversationData.priority}
                    onChange={(e) => setNewConversationData({ 
                      ...newConversationData, 
                      priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent'
                    })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    disabled={creating}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                  <textarea
                    value={newConversationData.initialMessage}
                    onChange={(e) => setNewConversationData({ ...newConversationData, initialMessage: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Please describe your issue in detail"
                    rows={4}
                    maxLength={2000}
                    required
                    disabled={creating}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {newConversationData.initialMessage.length}/2000
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewConversation(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  disabled={creating || !newConversationData.subject.trim() || !newConversationData.initialMessage.trim()}
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Conversation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}