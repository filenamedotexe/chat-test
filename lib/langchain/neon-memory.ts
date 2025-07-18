import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { neon } from "@neondatabase/serverless";

export interface NeonChatMessageHistoryOptions {
  sessionId: string;
  databaseUrl: string;
  tableName?: string;
}

export class NeonChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace = ["langchain", "memory", "chat_message_histories", "neon"];
  
  private sessionId: string;
  private sql: any;
  private tableName: string;

  constructor(options: NeonChatMessageHistoryOptions) {
    super();
    this.sessionId = options.sessionId;
    this.tableName = options.tableName || "chat_history";
    
    // Initialize Neon connection
    if (!options.databaseUrl || options.databaseUrl === "your-neon-database-url") {
      console.warn("Neon database URL not configured, memory will not persist");
      this.sql = null;
    } else {
      this.sql = neon(options.databaseUrl);
    }
  }

  async getMessages(): Promise<BaseMessage[]> {
    if (!this.sql) {
      return [];
    }

    try {
      // First check if session_id column exists, if not fall back to getting all messages
      let rows;
      try {
        rows = await this.sql`
          SELECT user_message, assistant_message, created_at
          FROM chat_history
          WHERE session_id = ${this.sessionId}
          ORDER BY created_at ASC
        `;
      } catch (columnError) {
        console.log("session_id column doesn't exist yet, getting all messages");
        rows = await this.sql`
          SELECT user_message, assistant_message, created_at
          FROM chat_history
          ORDER BY created_at ASC
        `;
      }

      const messages: BaseMessage[] = [];
      
      for (const row of rows) {
        // Add user message
        if (row.user_message) {
          messages.push(new HumanMessage(row.user_message));
        }
        // Add assistant message
        if (row.assistant_message) {
          messages.push(new AIMessage(row.assistant_message));
        }
      }

      return messages;
    } catch (error) {
      console.error("Error retrieving messages from Neon:", error);
      return [];
    }
  }

  async addMessage(message: BaseMessage): Promise<void> {
    if (!this.sql) {
      return;
    }

    // We'll store messages in pairs for now to match the existing schema
    // This is a temporary solution - in production, you'd want a more flexible schema
    console.log("Message added to memory (not persisted individually):", message);
  }

  async addMessages(messages: BaseMessage[]): Promise<void> {
    for (const message of messages) {
      await this.addMessage(message);
    }
  }

  async clear(): Promise<void> {
    if (!this.sql) {
      return;
    }

    try {
      await this.sql`
        DELETE FROM ${this.sql(this.tableName)}
        WHERE session_id = ${this.sessionId}
      `;
    } catch (error) {
      console.error("Error clearing messages from Neon:", error);
    }
  }

  // Helper method to save a conversation turn (user + assistant messages)
  async saveConversationTurn(userMessage: string, assistantMessage: string): Promise<void> {
    if (!this.sql) {
      return;
    }

    try {
      // Try to insert with session_id, if column doesn't exist, fall back to original schema
      try {
        await this.sql`
          INSERT INTO chat_history (
            session_id,
            user_message,
            assistant_message,
            created_at
          ) VALUES (
            ${this.sessionId},
            ${userMessage},
            ${assistantMessage},
            NOW()
          )
        `;
      } catch (columnError) {
        console.log("session_id column doesn't exist, using original schema");
        await this.sql`
          INSERT INTO chat_history (
            user_message,
            assistant_message,
            created_at
          ) VALUES (
            ${userMessage},
            ${assistantMessage},
            NOW()
          )
        `;
      }
    } catch (error) {
      console.error("Error saving conversation to Neon:", error);
    }
  }
}

// Helper function to create memory with current database URL
export function createNeonMemory(sessionId: string): NeonChatMessageHistory {
  return new NeonChatMessageHistory({
    sessionId,
    databaseUrl: process.env.DATABASE_URL || "",
  });
}