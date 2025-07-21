// Error handling utilities for LangChain integration

export class LangChainError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'LangChainError';
  }
}

export const ERROR_CODES = {
  // OpenAI API errors
  OPENAI_API_KEY_MISSING: 'OPENAI_API_KEY_MISSING',
  OPENAI_RATE_LIMIT: 'OPENAI_RATE_LIMIT',
  OPENAI_TIMEOUT: 'OPENAI_TIMEOUT',
  OPENAI_INVALID_REQUEST: 'OPENAI_INVALID_REQUEST',
  
  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_SESSION_NOT_FOUND: 'DB_SESSION_NOT_FOUND',
  
  // Memory errors
  MEMORY_INITIALIZATION_FAILED: 'MEMORY_INITIALIZATION_FAILED',
  MEMORY_LOAD_FAILED: 'MEMORY_LOAD_FAILED',
  MEMORY_SAVE_FAILED: 'MEMORY_SAVE_FAILED',
  
  // Streaming errors
  STREAM_INITIALIZATION_FAILED: 'STREAM_INITIALIZATION_FAILED',
  STREAM_CHUNK_ERROR: 'STREAM_CHUNK_ERROR',
  STREAM_CLOSE_ERROR: 'STREAM_CLOSE_ERROR',
  
  // General errors
  INVALID_INPUT: 'INVALID_INPUT',
  CHAIN_EXECUTION_FAILED: 'CHAIN_EXECUTION_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export function handleOpenAIError(error: any): LangChainError {
  if (error.message?.includes('401')) {
    return new LangChainError(
      'OpenAI API key is invalid or missing',
      ERROR_CODES.OPENAI_API_KEY_MISSING,
      401
    );
  }
  
  if (error.message?.includes('429') || error.message?.includes('rate limit')) {
    return new LangChainError(
      'OpenAI API rate limit exceeded. Please try again later.',
      ERROR_CODES.OPENAI_RATE_LIMIT,
      429,
      { retryAfter: error.headers?.['retry-after'] }
    );
  }
  
  if (error.message?.includes('timeout')) {
    return new LangChainError(
      'OpenAI API request timed out',
      ERROR_CODES.OPENAI_TIMEOUT,
      504
    );
  }
  
  return new LangChainError(
    'OpenAI API error: ' + error.message,
    ERROR_CODES.OPENAI_INVALID_REQUEST,
    400
  );
}

export function handleDatabaseError(error: any, context?: string): LangChainError {
  if (error.message?.includes('connect')) {
    return new LangChainError(
      'Failed to connect to database',
      ERROR_CODES.DB_CONNECTION_FAILED,
      503
    );
  }
  
  return new LangChainError(
    `Database error${context ? ` in ${context}` : ''}: ${error.message}`,
    ERROR_CODES.DB_QUERY_FAILED,
    500
  );
}

export function handleMemoryError(error: any, operation: 'init' | 'load' | 'save'): LangChainError {
  const errorMap = {
    init: ERROR_CODES.MEMORY_INITIALIZATION_FAILED,
    load: ERROR_CODES.MEMORY_LOAD_FAILED,
    save: ERROR_CODES.MEMORY_SAVE_FAILED
  };
  
  return new LangChainError(
    `Memory ${operation} failed: ${error.message}`,
    errorMap[operation],
    500
  );
}

// Retry logic for transient failures
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error instanceof LangChainError) {
        if ([
          ERROR_CODES.OPENAI_API_KEY_MISSING,
          ERROR_CODES.OPENAI_INVALID_REQUEST,
          ERROR_CODES.INVALID_INPUT
        ].includes(error.code)) {
          throw error;
        }
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(backoffMultiplier, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Error response formatter
export function formatErrorResponse(error: any) {
  if (error instanceof LangChainError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      }
    };
  }
  
  return {
    error: {
      message: error.message || 'An unexpected error occurred',
      code: ERROR_CODES.UNKNOWN_ERROR
    }
  };
}