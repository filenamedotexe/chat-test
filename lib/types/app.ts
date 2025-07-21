export interface AppConfig {
  name: string;
  slug: string;
  description: string;
  version: string;
  icon?: string;
  path: string;
  requires_auth: boolean;
  default_permissions?: string[];
  dependencies?: string[];
  author?: string;
  license?: string;
  repository?: string;
  port?: number;
  dev_command?: string;
  build_command?: string;
  start_command?: string;
}

export interface AppMetadata extends AppConfig {
  id?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  last_scanned?: string;
}

export interface AppDiscoveryResult {
  discovered: AppMetadata[];
  registered: AppMetadata[];
  errors: { path: string; error: string }[];
}