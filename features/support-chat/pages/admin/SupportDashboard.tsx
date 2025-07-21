'use client';

import { useState, useEffect } from 'react';
import { ConversationList } from '../../components/ConversationList';

export default function SupportDashboard() {
  console.log('🎯 SupportDashboard component mounting');
  
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    unassigned: 0,
    urgent: 0
  });
  const [selectedConversations, setSelectedConversations] = useState<number[]>([]);

  // Load admin conversations
  async function loadConversations() {
    console.log('🔄 loadConversations called');
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedPriority !== 'all') params.set('priority', selectedPriority);
      
      const url = `/api/support-chat/admin/conversations?${params}`;
      console.log('📡 API URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to load conversations: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📡 API Data received:', data);
      
      setConversations(data.conversations || []);
      
      // Calculate stats
      const total = data.conversations?.length || 0;
      const open = data.conversations?.filter((c: any) => c.status === 'open')?.length || 0;
      const unassigned = data.conversations?.filter((c: any) => !c.admin)?.length || 0;
      const urgent = data.conversations?.filter((c: any) => c.priority === 'urgent')?.length || 0;
      
      console.log('📊 Stats calculated:', { total, open, unassigned, urgent });
      setStats({ total, open, unassigned, urgent });
      setError(null);
      
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversations');
      
      // Fallback to placeholder data for UI testing
      setConversations([
        {
          id: 1,
          subject: "Login Issues with App",
          status: "open",
          priority: "high",
          lastMessage: "I can't seem to log into my account...",
          lastMessageAt: new Date(),
          unreadCount: 2,
          user: { id: 1, name: "John Doe", email: "john@example.com" },
          admin: null
        },
        {
          id: 2,
          subject: "Feature Request - Dark Mode",
          status: "in_progress",
          priority: "normal",
          lastMessage: "Thanks for the suggestion! We'll consider it...",
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
          unreadCount: 0,
          user: { id: 2, name: "Jane Smith", email: "jane@example.com" },
          admin: { id: 1, name: "Support Admin", email: "admin@example.com" }
        }
      ]);
      setStats({ total: 2, open: 1, unassigned: 1, urgent: 0 });
    } finally {
      console.log('✅ Loading complete');
      setLoading(false);
    }
  }

  // Load conversations on component mount and filter changes
  useEffect(() => {
    console.log('🔥 useEffect triggered with:', { selectedStatus, selectedPriority });
    console.log('🔥 About to call loadConversations...');
    loadConversations().catch(error => {
      console.error('🔥 useEffect loadConversations error:', error);
    });
  }, [selectedStatus, selectedPriority]);
  
  // Additional useEffect for debugging - runs on every render
  useEffect(() => {
    console.log('🔥 Simple useEffect running - component is alive');
  });

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* Bulk Actions Modal */}
      {selectedConversations.length > 0 && (
        <div className="fixed top-20 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg z-40 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {selectedConversations.length} conversation{selectedConversations.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkAssign()}
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
              >
                Assign
              </button>
              <button 
                onClick={() => handleBulkStatusChange('closed')}
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
              >
                Close
              </button>
              <button 
                onClick={() => setSelectedConversations([])}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Support Dashboard</h1>
              <p className="text-gray-400 mt-1">Manage customer support conversations and requests</p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                Bulk Actions
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400">Total Conversations</h3>
              <p className="text-2xl font-bold text-white mt-2">{loading ? '--' : stats.total}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400">Open Conversations</h3>
              <p className="text-2xl font-bold text-yellow-500 mt-2">{loading ? '--' : stats.open}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400">Unassigned</h3>
              <p className="text-2xl font-bold text-red-500 mt-2">{loading ? '--' : stats.unassigned}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400">Urgent Priority</h3>
              <p className="text-2xl font-bold text-orange-500 mt-2">{loading ? '--' : stats.urgent}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
            <select 
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          {/* Conversations List */}
          <ConversationList 
            isAdmin={true} 
            status={selectedStatus} 
            priority={selectedPriority}
            conversations={conversations}
            loading={loading}
            error={error}
            onConversationSelect={handleConversationSelect}
            selectedConversations={selectedConversations}
            onAssignConversation={handleAssignConversation}
            onChangeStatus={handleChangeStatus}
          />
        </div>
      </div>
    </div>
  );

  // Handle conversation selection for bulk actions
  function handleConversationSelect(conversationId: number, selected: boolean) {
    if (selected) {
      setSelectedConversations([...selectedConversations, conversationId]);
    } else {
      setSelectedConversations(selectedConversations.filter(id => id !== conversationId));
    }
  }

  // Handle individual conversation assignment
  async function handleAssignConversation(conversationId: number, adminId: number) {
    try {
      const response = await fetch(`/api/support-chat/admin/conversations/${conversationId}/assign`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      
      if (response.ok) {
        await loadConversations(); // Reload data
      }
    } catch (error) {
      console.error('Failed to assign conversation:', error);
    }
  }

  // Handle status change
  async function handleChangeStatus(conversationId: number, newStatus: string) {
    try {
      const response = await fetch(`/api/support-chat/admin/conversations/${conversationId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        await loadConversations(); // Reload data
      }
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  }

  // Handle bulk assignment
  async function handleBulkAssign() {
    // In a real app, this would open a modal to select admin
    const adminId = 1; // For demo purposes
    
    try {
      const response = await fetch('/api/support-chat/admin/conversations/bulk', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationIds: selectedConversations, 
          action: 'assign',
          adminId
        })
      });
      
      if (response.ok) {
        setSelectedConversations([]);
        await loadConversations();
      }
    } catch (error) {
      console.error('Failed to bulk assign:', error);
    }
  }

  // Handle bulk status change
  async function handleBulkStatusChange(newStatus: string) {
    try {
      const response = await fetch('/api/support-chat/admin/conversations/bulk', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationIds: selectedConversations, 
          action: 'status',
          status: newStatus
        })
      });
      
      if (response.ok) {
        setSelectedConversations([]);
        await loadConversations();
      }
    } catch (error) {
      console.error('Failed to bulk change status:', error);
    }
  }

  // Load conversations on component mount and filter changes
  useEffect(() => {
    console.log('🔥 useEffect triggered with:', { selectedStatus, selectedPriority });
    console.log('🔥 About to call loadConversations...');
    loadConversations().catch(error => {
      console.error('🔥 useEffect loadConversations error:', error);
    });
  }, [selectedStatus, selectedPriority]);
  
  // Additional useEffect for debugging - runs on every render
  useEffect(() => {
    console.log('🔥 Simple useEffect running - component is alive');
  });
}