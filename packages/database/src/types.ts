// Database type definitions

export interface User {
  id: number;
  email: string;
  password_hash?: string;
  name?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface App {
  id: number;
  name: string;
  slug: string;
  description?: string;
  path: string;
  icon?: string;
  is_active: boolean;
  requires_auth: boolean;
  created_at: Date;
}

export interface UserAppPermission {
  user_id: number;
  app_id: number;
  granted_by?: number;
  granted_at: Date;
  expires_at?: Date;
}

export interface ChatHistory {
  id: number;
  user_message: string;
  assistant_message: string;
  created_at: Date;
  session_id?: string;
  metadata?: Record<string, any>;
  user_id?: number;
  app_id?: number;
}