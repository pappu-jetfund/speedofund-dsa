export interface IApiKey {
  id?: number;
  api_key: string;
  client_id: string;
  client_name: string;
  is_active: boolean;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  allowed_ips?: string[];
  metadata?: any;
  blocked_until?: Date;
  blocked_reason?: string;
  last_used_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}
