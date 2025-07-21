'use client';

import { useState } from 'react';
import { ConversationHeader } from '../../components/ConversationHeader';
import { MessageThread } from '../../components/MessageThread';
import { MessageComposer } from '../../components/MessageComposer';

interface ConversationManagementProps {
  params: {
    id: string;
  };
}

export default function ConversationManagement({ params }: ConversationManagementProps) {
  const conversationId = parseInt(params.id);
  const [assignedAdmin, setAssignedAdmin] = useState<string>('');
  const [conversationStatus, setConversationStatus] = useState<string>('open');

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto h-[calc(100vh-5rem)] px-4 sm:px-6 max-w-6xl">
        <div className="flex h-full gap-4">
          {/* Main Conversation Area */}
          <div className="flex-1 flex flex-col">
            {/* Conversation Header */}
            <ConversationHeader conversationId={conversationId} isAdmin={true} />
            
            {/* Message Thread - Scrollable */}
            <div className="flex-1 overflow-hidden">
              <MessageThread conversationId={conversationId} />
            </div>
            
            {/* Message Composer - Fixed at bottom */}
            <MessageComposer conversationId={conversationId} />
          </div>

          {/* Admin Sidebar */}
          <div className="w-80 bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white">Admin Controls</h3>
            
            {/* Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Assign to Admin</label>
              <select 
                value={assignedAdmin}
                onChange={(e) => setAssignedAdmin(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg"
              >
                <option value="">Unassigned</option>
                <option value="admin1">Admin User 1</option>
                <option value="admin2">Admin User 2</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Conversation Status</label>
              <select 
                value={conversationStatus}
                onChange={(e) => setConversationStatus(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Save Changes
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                Transfer Conversation
              </button>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                Close Conversation
              </button>
            </div>

            {/* Conversation Info */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Conversation Details</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <p><span className="text-gray-400">Created:</span> --</p>
                <p><span className="text-gray-400">Priority:</span> --</p>
                <p><span className="text-gray-400">Messages:</span> --</p>
                <p><span className="text-gray-400">User:</span> --</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}