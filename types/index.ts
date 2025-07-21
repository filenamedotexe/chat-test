// Shared TypeScript types for all chat applications

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

export type MemoryType = 'buffer' | 'summary';

export interface ChatSessionConfig {
  sessionId: string;
  memoryType: MemoryType;
  maxTokenLimit?: number;
  promptTemplateId?: string;
}

export * from './app';
export * from './validation';