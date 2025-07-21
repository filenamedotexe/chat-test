'use client';

import { WSMessage } from './server';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface WebSocketClientOptions {
  url: string;
  token: string;
  onMessage?: (message: WSMessage) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;
  private messageQueue: WSMessage[] = [];

  constructor(options: WebSocketClientOptions) {
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options
    };
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection already in progress');
      return;
    }

    this.setConnectionStatus('connecting');
    console.log('🔗 Connecting to WebSocket server...');

    try {
      const wsUrl = `${this.options.url}?token=${encodeURIComponent(this.options.token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.setConnectionStatus('error');
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket...');
    this.isIntentionalClose = true;
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setConnectionStatus('disconnected');
  }

  send(message: WSMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('📤 Sent WebSocket message:', message.type);
        return true;
      } catch (error) {
        console.error('❌ Failed to send WebSocket message:', error);
        this.messageQueue.push(message);
        return false;
      }
    } else {
      console.log('⏳ WebSocket not connected, queueing message:', message.type);
      this.messageQueue.push(message);
      
      // Attempt to connect if not connected
      if (this.connectionStatus === 'disconnected') {
        this.connect();
      }
      
      return false;
    }
  }

  joinConversation(conversationId: number): void {
    this.send({
      type: 'join_conversation',
      conversationId,
      data: { conversationId }
    });
  }

  leaveConversation(conversationId: number): void {
    this.send({
      type: 'leave_conversation',
      conversationId,
      data: { conversationId }
    });
  }

  sendTypingIndicator(conversationId: number, isTyping: boolean): void {
    this.send({
      type: 'typing',
      conversationId,
      data: { isTyping }
    });
  }

  sendReadReceipt(conversationId: number, messageId: number): void {
    this.send({
      type: 'read_receipt',
      conversationId,
      data: { messageId }
    });
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  private handleOpen(event: Event): void {
    console.log('✅ WebSocket connected successfully');
    this.setConnectionStatus('connected');
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();
    
    // Send any queued messages
    this.flushMessageQueue();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WSMessage = JSON.parse(event.data);
      console.log('📨 Received WebSocket message:', message.type);
      
      if (this.options.onMessage) {
        this.options.onMessage(message);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`🔒 WebSocket connection closed: ${event.code} ${event.reason}`);
    this.ws = null;
    
    if (this.isIntentionalClose) {
      this.setConnectionStatus('disconnected');
      this.isIntentionalClose = false;
    } else {
      this.setConnectionStatus('disconnected');
      this.attemptReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('⚡ WebSocket error occurred:', event);
    this.setConnectionStatus('error');
    
    if (this.options.onError) {
      this.options.onError(event);
    }
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      console.log(`🔄 Connection status changed: ${this.connectionStatus} → ${status}`);
      this.connectionStatus = status;
      
      if (this.options.onConnectionChange) {
        this.options.onConnectionChange(status);
      }
    }
  }

  private attemptReconnect(): void {
    if (this.isIntentionalClose) {
      return;
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts!) {
      console.log('❌ Max reconnection attempts reached');
      this.setConnectionStatus('error');
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionStatus('reconnecting');
    
    const delay = Math.min(
      this.options.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.options.maxReconnectAttempts} in ${delay}ms...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

    console.log(`📤 Flushing ${this.messageQueue.length} queued messages...`);
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(message => {
      this.send(message);
    });
  }

  // Cleanup method for React component unmounting
  cleanup(): void {
    this.clearReconnectTimer();
    this.disconnect();
  }
}