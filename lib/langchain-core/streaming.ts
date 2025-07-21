import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { AIMessage } from "@langchain/core/messages";

/**
 * Custom callback handler for streaming LangChain responses
 * Compatible with Vercel AI SDK's streaming format
 */
export class StreamingCallbackHandler extends BaseCallbackHandler {
  name = "streaming_callback_handler";
  
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private encoder: TextEncoder;
  private isComplete = false;
  private fullContent = "";

  constructor(writer: WritableStreamDefaultWriter<Uint8Array>) {
    super();
    this.writer = writer;
    this.encoder = new TextEncoder();
  }

  async handleLLMNewToken(
    token: string,
    _idx: { prompt: number; completion: number },
    _runId: string,
    _parentRunId?: string,
    _tags?: string[]
  ): Promise<void> {
    try {
      // Accumulate the full content
      this.fullContent += token;
      
      // Stream the token in the format expected by useChat hook
      const chunk = this.encoder.encode(`data: ${JSON.stringify({
        id: Date.now().toString(),
        object: "chat.completion.chunk",
        choices: [{
          delta: { content: token },
          index: 0,
          finish_reason: null
        }]
      })}\n\n`);
      
      await this.writer.write(chunk);
    } catch (error) {
      console.error("Error in handleLLMNewToken:", error);
    }
  }

  async handleLLMEnd(
    _output: any,
    _runId: string,
    _parentRunId?: string,
    _tags?: string[]
  ): Promise<void> {
    try {
      if (!this.isComplete) {
        // Send the final chunk
        const finalChunk = this.encoder.encode(`data: ${JSON.stringify({
          id: Date.now().toString(),
          object: "chat.completion.chunk",
          choices: [{
            delta: {},
            index: 0,
            finish_reason: "stop"
          }]
        })}\n\n`);
        
        await this.writer.write(finalChunk);
        
        // Send the done signal
        const doneChunk = this.encoder.encode(`data: [DONE]\n\n`);
        await this.writer.write(doneChunk);
        
        this.isComplete = true;
      }
    } catch (error) {
      console.error("Error in handleLLMEnd:", error);
    }
  }

  async handleLLMError(
    error: Error,
    _runId: string,
    _parentRunId?: string,
    _tags?: string[]
  ): Promise<void> {
    try {
      const errorChunk = this.encoder.encode(`data: ${JSON.stringify({
        error: {
          message: error.message,
          type: "invalid_request_error"
        }
      })}\n\n`);
      
      await this.writer.write(errorChunk);
    } catch (writeError) {
      console.error("Error writing error chunk:", writeError);
    }
  }

  getFullContent(): string {
    return this.fullContent;
  }
}

/**
 * Creates a streaming response compatible with Vercel AI SDK
 */
export function createStreamingResponse(): {
  stream: ReadableStream<Uint8Array>;
  writer: WritableStreamDefaultWriter<Uint8Array>;
} {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  
  return {
    stream: readable,
    writer
  };
}

/**
 * Alternative simpler streaming approach using Server-Sent Events
 */
export class SimpleStreamingHandler extends BaseCallbackHandler {
  name = "simple_streaming_handler";
  
  private controller: ReadableStreamDefaultController<Uint8Array>;
  private encoder: TextEncoder;
  private fullContent = "";

  constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
    super();
    this.controller = controller;
    this.encoder = new TextEncoder();
  }

  async handleLLMNewToken(token: string): Promise<void> {
    try {
      this.fullContent += token;
      
      // Simple text streaming - just send the token
      const chunk = this.encoder.encode(token);
      this.controller.enqueue(chunk);
    } catch (error) {
      console.error("Error in simple streaming:", error);
    }
  }

  async handleLLMEnd(): Promise<void> {
    try {
      this.controller.close();
    } catch (error) {
      console.error("Error closing stream:", error);
    }
  }

  async handleLLMError(error: Error): Promise<void> {
    try {
      this.controller.error(error);
    } catch (controllerError) {
      console.error("Error reporting stream error:", controllerError);
    }
  }

  getFullContent(): string {
    return this.fullContent;
  }
}