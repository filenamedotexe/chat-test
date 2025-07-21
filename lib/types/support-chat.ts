export interface SupportChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'system';
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportChatConversation {
  id: number;
  user_id: number;
  user_name?: string;
  assigned_to?: number;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  unreadCount?: number;
}