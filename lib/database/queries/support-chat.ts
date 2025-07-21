// Support Chat Database Query Functions
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Export sql instance for direct queries if needed
export { sql };

// Types for Support Chat
export interface Conversation {
  id: number;
  user_id: number;
  admin_id?: number;
  status: 'open' | 'closed' | 'transferred' | 'in_progress';
  type: 'support' | 'ai_handoff';
  subject: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: Date;
  updated_at: Date;
  context_json?: any;
  transferred_from_conversation_id?: number;
}

export interface SupportMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: 'user' | 'admin' | 'system';
  content: string;
  message_type: 'text' | 'system' | 'handoff' | 'file';
  created_at: Date;
  read_at?: Date;
  metadata_json?: any;
}

export interface ConversationParticipant {
  conversation_id: number;
  user_id: number;
  role: 'participant' | 'admin' | 'observer';
  joined_at: Date;
  last_read_at?: Date;
}

export interface ConversationWithDetails extends Conversation {
  user_email?: string;
  user_name?: string;
  admin_email?: string;
  admin_name?: string;
  message_count?: number;
  unread_count?: number;
  last_message?: string;
  last_message_at?: Date;
}

export interface MessageWithSender extends SupportMessage {
  sender_email?: string;
  sender_name?: string;
  sender_role?: string;
}

// Core conversation functions
export const supportChatQueries = {
  
  /**
   * Create a new conversation
   */
  async createConversation(
    userId: number, 
    subject: string, 
    context?: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    type: 'support' | 'ai_handoff' = 'support'
  ): Promise<Conversation> {
    try {
      const result = await sql`
        INSERT INTO conversations (
          user_id, 
          subject, 
          priority, 
          type, 
          context_json
        )
        VALUES (
          ${userId}, 
          ${subject}, 
          ${priority}, 
          ${type}, 
          ${context ? JSON.stringify(context) : null}
        )
        RETURNING *
      ` as Conversation[];
      
      if (!result[0]) {
        throw new Error('Failed to create conversation');
      }
      
      // Add user as participant
      await sql`
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES (${result[0].id}, ${userId}, 'participant')
      `;
      
      return result[0];
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Get conversation by ID with full details
   */
  async getConversationById(conversationId: number): Promise<ConversationWithDetails | null> {
    try {
      const result = await sql`
        SELECT 
          c.*,
          u.email as user_email,
          u.name as user_name,
          a.email as admin_email,
          a.name as admin_name,
          (
            SELECT COUNT(*)::int 
            FROM support_messages sm 
            WHERE sm.conversation_id = c.id
          ) as message_count,
          (
            SELECT sm.content 
            FROM support_messages sm 
            WHERE sm.conversation_id = c.id 
            ORDER BY sm.created_at DESC 
            LIMIT 1
          ) as last_message,
          (
            SELECT sm.created_at 
            FROM support_messages sm 
            WHERE sm.conversation_id = c.id 
            ORDER BY sm.created_at DESC 
            LIMIT 1
          ) as last_message_at
        FROM conversations c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN users a ON c.admin_id = a.id
        WHERE c.id = ${conversationId}
      ` as ConversationWithDetails[];
      
      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to get conversation: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Get conversations for a specific user
   */
  async getUserConversations(
    userId: number, 
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ConversationWithDetails[]> {
    try {
      let result;
      
      if (status) {
        result = await sql`
          SELECT 
            c.*,
            u.email as user_email,
            u.name as user_name,
            a.email as admin_email,
            a.name as admin_name,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id
            ) as message_count,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              AND sm.read_at IS NULL 
              AND sm.sender_type != 'user'
            ) as unread_count,
            (
              SELECT sm.content 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message,
            (
              SELECT sm.created_at 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message_at
          FROM conversations c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN users a ON c.admin_id = a.id
          WHERE c.user_id = ${userId} AND c.status = ${status}
          ORDER BY c.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as ConversationWithDetails[];
      } else {
        result = await sql`
          SELECT 
            c.*,
            u.email as user_email,
            u.name as user_name,
            a.email as admin_email,
            a.name as admin_name,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id
            ) as message_count,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              AND sm.read_at IS NULL 
              AND sm.sender_type != 'user'
            ) as unread_count,
            (
              SELECT sm.content 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message,
            (
              SELECT sm.created_at 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message_at
          FROM conversations c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN users a ON c.admin_id = a.id
          WHERE c.user_id = ${userId}
          ORDER BY c.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as ConversationWithDetails[];
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get user conversations: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Get conversations for admin management
   */
  async getAdminConversations(
    adminId?: number, 
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationWithDetails[]> {
    try {
      let result;
      
      if (adminId && status) {
        result = await sql`
          SELECT 
            c.*,
            u.email as user_email,
            u.name as user_name,
            a.email as admin_email,
            a.name as admin_name,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id
            ) as message_count,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              AND sm.read_at IS NULL 
              AND sm.sender_type = 'user'
            ) as unread_count,
            (
              SELECT sm.content 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message,
            (
              SELECT sm.created_at 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message_at
          FROM conversations c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN users a ON c.admin_id = a.id
          WHERE c.admin_id = ${adminId} AND c.status = ${status}
          ORDER BY 
            CASE WHEN c.priority = 'urgent' THEN 1
               WHEN c.priority = 'high' THEN 2
               WHEN c.priority = 'normal' THEN 3
               ELSE 4 END,
          c.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as ConversationWithDetails[];
      } else if (adminId) {
        result = await sql`
          SELECT 
            c.*,
            u.email as user_email,
            u.name as user_name,
            a.email as admin_email,
            a.name as admin_name,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id
            ) as message_count,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              AND sm.read_at IS NULL 
              AND sm.sender_type = 'user'
            ) as unread_count,
            (
              SELECT sm.content 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message,
            (
              SELECT sm.created_at 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message_at
          FROM conversations c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN users a ON c.admin_id = a.id
          WHERE c.admin_id = ${adminId}
          ORDER BY 
            CASE WHEN c.priority = 'urgent' THEN 1
               WHEN c.priority = 'high' THEN 2
               WHEN c.priority = 'normal' THEN 3
               ELSE 4 END,
          c.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as ConversationWithDetails[];
      } else if (status) {
        result = await sql`
          SELECT 
            c.*,
            u.email as user_email,
            u.name as user_name,
            a.email as admin_email,
            a.name as admin_name,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id
            ) as message_count,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              AND sm.read_at IS NULL 
              AND sm.sender_type = 'user'
            ) as unread_count,
            (
              SELECT sm.content 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message,
            (
              SELECT sm.created_at 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message_at
          FROM conversations c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN users a ON c.admin_id = a.id
          WHERE c.status = ${status}
          ORDER BY 
            CASE WHEN c.priority = 'urgent' THEN 1
               WHEN c.priority = 'high' THEN 2
               WHEN c.priority = 'normal' THEN 3
               ELSE 4 END,
          c.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as ConversationWithDetails[];
      } else {
        result = await sql`
          SELECT 
            c.*,
            u.email as user_email,
            u.name as user_name,
            a.email as admin_email,
            a.name as admin_name,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id
            ) as message_count,
            (
              SELECT COUNT(*)::int 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              AND sm.read_at IS NULL 
              AND sm.sender_type = 'user'
            ) as unread_count,
            (
              SELECT sm.content 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message,
            (
              SELECT sm.created_at 
              FROM support_messages sm 
              WHERE sm.conversation_id = c.id 
              ORDER BY sm.created_at DESC 
              LIMIT 1
            ) as last_message_at
          FROM conversations c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN users a ON c.admin_id = a.id
          ORDER BY 
            CASE WHEN c.priority = 'urgent' THEN 1
               WHEN c.priority = 'high' THEN 2
               WHEN c.priority = 'normal' THEN 3
               ELSE 4 END,
          c.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as ConversationWithDetails[];
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get admin conversations: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: number,
    senderId: number,
    content: string,
    senderType: 'user' | 'admin' | 'system',
    messageType: 'text' | 'system' | 'handoff' | 'file' = 'text',
    metadata?: any
  ): Promise<SupportMessage> {
    try {
      const result = await sql`
        INSERT INTO support_messages (
          conversation_id,
          sender_id,
          sender_type,
          content,
          message_type,
          metadata_json
        )
        VALUES (
          ${conversationId},
          ${senderId},
          ${senderType},
          ${content},
          ${messageType},
          ${metadata ? JSON.stringify(metadata) : null}
        )
        RETURNING *
      ` as SupportMessage[];
      
      if (!result[0]) {
        throw new Error('Failed to create message');
      }
      
      // Update conversation's updated_at timestamp
      await sql`
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${conversationId}
      `;
      
      return result[0];
    } catch (error) {
      throw new Error(`Failed to add message: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Get all messages for a conversation
   */
  async getConversationMessages(
    conversationId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<MessageWithSender[]> {
    try {
      const result = await sql`
        SELECT 
          sm.*,
          u.email as sender_email,
          u.name as sender_name,
          u.role as sender_role
        FROM support_messages sm
        JOIN users u ON sm.sender_id = u.id
        WHERE sm.conversation_id = ${conversationId}
        ORDER BY sm.created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      ` as MessageWithSender[];
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get conversation messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Update conversation status
   */
  async updateConversationStatus(
    conversationId: number, 
    status: 'open' | 'closed' | 'transferred' | 'in_progress'
  ): Promise<Conversation> {
    try {
      const result = await sql`
        UPDATE conversations 
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${conversationId}
        RETURNING *
      ` as Conversation[];
      
      if (!result[0]) {
        throw new Error('Conversation not found');
      }
      
      return result[0];
    } catch (error) {
      throw new Error(`Failed to update conversation status: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Assign conversation to an admin
   */
  async assignConversationToAdmin(
    conversationId: number, 
    adminId: number
  ): Promise<Conversation> {
    try {
      const result = await sql`
        UPDATE conversations 
        SET admin_id = ${adminId}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${conversationId}
        RETURNING *
      ` as Conversation[];
      
      if (!result[0]) {
        throw new Error('Conversation not found');
      }
      
      // Add admin as participant if not already
      await sql`
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES (${conversationId}, ${adminId}, 'admin')
        ON CONFLICT (conversation_id, user_id) DO UPDATE SET
          role = 'admin',
          last_read_at = CURRENT_TIMESTAMP
      `;
      
      return result[0];
    } catch (error) {
      throw new Error(`Failed to assign conversation to admin: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Mark messages as read by a specific user
   */
  async markMessagesAsRead(
    conversationId: number, 
    userId: number
  ): Promise<number> {
    try {
      const result = await sql`
        UPDATE support_messages 
        SET read_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ${conversationId}
        AND sender_id != ${userId}
        AND read_at IS NULL
        RETURNING id
      `;
      
      // Update participant's last read timestamp
      await sql`
        UPDATE conversation_participants 
        SET last_read_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ${conversationId} 
        AND user_id = ${userId}
      `;
      
      return result.length;
    } catch (error) {
      throw new Error(`Failed to mark messages as read: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Get conversation statistics for admin dashboard
   */
  async getConversationStats(): Promise<{
    total: number;
    open: number;
    in_progress: number;
    closed: number;
    unassigned: number;
    urgent: number;
  }> {
    try {
      const result = await sql`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'open')::int as open,
          COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
          COUNT(*) FILTER (WHERE status = 'closed')::int as closed,
          COUNT(*) FILTER (WHERE admin_id IS NULL AND status != 'closed')::int as unassigned,
          COUNT(*) FILTER (WHERE priority = 'urgent' AND status != 'closed')::int as urgent
        FROM conversations
      `;
      
      return result[0] as any;
    } catch (error) {
      throw new Error(`Failed to get conversation stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Search conversations by content
   */
  async searchConversations(
    query: string,
    userId?: number,
    limit: number = 20
  ): Promise<ConversationWithDetails[]> {
    try {
      const result = await sql`
        SELECT DISTINCT
          c.*,
          u.email as user_email,
          u.name as user_name,
          a.email as admin_email,
          a.name as admin_name,
          (
            SELECT COUNT(*)::int 
            FROM support_messages sm 
            WHERE sm.conversation_id = c.id
          ) as message_count,
          ts_rank(to_tsvector('english', c.subject || ' ' || COALESCE(sm.content, '')), plainto_tsquery('english', ${query})) as rank
        FROM conversations c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN users a ON c.admin_id = a.id
        LEFT JOIN support_messages sm ON c.id = sm.conversation_id
        WHERE (
          to_tsvector('english', c.subject) @@ plainto_tsquery('english', ${query})
          OR to_tsvector('english', sm.content) @@ plainto_tsquery('english', ${query})
        )
        ${userId ? sql`AND c.user_id = ${userId}` : sql``}
        ORDER BY rank DESC, c.updated_at DESC
        LIMIT ${limit}
      ` as ConversationWithDetails[];
      
      return result;
    } catch (error) {
      throw new Error(`Failed to search conversations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};