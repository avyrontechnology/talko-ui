/** Shared TypeScript models mirroring talko-service DTOs. */

export interface TalkoEnvelope<T> {
  status: string;
  message: string;
  data: T;
}

/* ---------- Calls ---------- */
export type EntityType = "Lead" | "Contact";

export interface CallCreatePayload {
  entity_type: EntityType;
  entity_id?: string;
  entity_name?: string;
  service_board_id?: number;
  partner_id?: number;
  agent_number?: string;
  to_number?: string;
  cloud_agent_number?: string;
  outbound_type?: string;
  number_type?: string;
  dedicated_did?: string;
  enable_ai_bridge?: boolean;
  encryption_enabled?: boolean;
  lead_secret?: string;
  call_url?: string;
  context_data?: Record<string, unknown>;
}

export interface HangupPayload {
  call_id: string;
  enable_ai_bridge?: boolean;
}

export interface TransferPayload {
  call_id: string;
  destination_number: string;
  enable_ai_bridge?: boolean;
}

/* ---------- CDR ---------- */
export interface Cdr {
  id: string;
  call_uuid?: string;
  action?: string;
  calling_mode?: string;
  date_time?: string;
  solution?: string;
  customer?: string;
  agent?: string;
  call_status?: string;
  customer_status?: string;
  agent_status?: string;
  total_call_duration?: number;
  talk_time?: number;
  call_recording?: string;
  disposition?: string;
  sub_disposition?: string;
  notes?: string;
  did_number?: string;
  agent_number?: string;
  hangup_by?: string;
  entity_type?: string;
  entity_id?: string;
  vendor_id?: string;
  custom_fields?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Paged<T> {
  items: T[];
  total: number;
}

/* ---------- Analytics ---------- */
export type AnalyticsType =
  | "agent_call_analytics"
  | "total_agent_talk_time"
  | "agent_talk_time_distribution"
  | "partner_service_board"
  | "dashboard_call_trends";

export type TrendMetric =
  | "total_calls"
  | "total_connected_calls"
  | "total_unique_calls"
  | "total_missed_calls"
  | "lead_connected_calls"
  | "agent_connected_calls"
  | "lead_missed_calls"
  | "agent_missed_calls"
  | "total_talk_time"
  | "total_call_duration";

/* ---------- Vendors ---------- */
export interface Vendor {
  id: string;
  name: string;
  slug?: string;
  is_active?: boolean;
  vendor_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendorConfig {
  id: string;
  vendor_id: string;
  vendor_name?: string;
  name?: string;
  available_did?: string[];
  assigned_did?: string[];
  generic_url_handler?: Record<string, unknown>;
  cdr_url_handler?: Record<string, unknown>;
  dialer_url_handler?: Record<string, unknown>;
  transfer_url_handler?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

/* ---------- Partners ---------- */
export interface PartnerConfig {
  id: string;
  partner_id: number;
  vendor_id: string;
  vendor_config_id?: string;
  is_active?: boolean;
  enable_round_robin?: boolean;
  enable_agent_mapping?: boolean;
  enable_service_board?: boolean;
  service_board_ids?: number[];
  dialer_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/* ---------- DIDs ---------- */
export type DidStatus =
  | "available"
  | "mapped"
  | "cooling_period"
  | "cooldown_completed";

export interface DidRecord {
  did_number: string;
  status: DidStatus;
  partner_id?: number | null;
  service_board_id?: number | null;
  agent_id?: string | null;
  vendor_id?: string;
  spam_count?: number;
  cooldown_until?: string | null;
  assign_date?: string | null;
  mapped_date?: string | null;
}

/* ---------- Agent mapping ---------- */
export interface AgentMapping {
  id: string;
  agent_id: string;
  partner_id: number;
  service_board_id?: number;
  agent_number?: string;
  is_active?: boolean;
  did?: string[];
  created_at?: string;
  updated_at?: string;
}

/* ---------- Custom fields ---------- */
export interface CustomField {
  id: string;
  partner_id?: number;
  entity_type: string;
  field_name: string;
  field_slug: string;
  data_type: "string" | "number" | "date" | "boolean" | "choice";
  choice_options?: string[];
  is_required?: boolean;
  sequence?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/* ---------- API keys / webhooks ---------- */
export interface ApiKeyItem {
  id: string;
  key_prefix: string;
  partner_id: number;
  label?: string;
  is_active: boolean;
  created_at?: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
}

export interface WebhookConfig {
  id: string;
  partner_id: number;
  url: string;
  is_active: boolean;
  subscribed_events: string[];
  signing_secret_last_4?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookDelivery {
  id: string;
  partner_id: number;
  event_type: string;
  event_id: string;
  url: string;
  attempt_number: number;
  status_code?: number | null;
  success: boolean;
  error?: string | null;
  duration_ms?: number | null;
  created_at?: string;
}

/* ---------- Misc ---------- */
export interface CallRecord {
  record_id?: string;
  id?: string;
  caller: string;
  receiver: string;
  duration: number;
  timestamp: string;
}

export interface LeadList {
  id: string;
  name: string;
  description?: string;
  field_map?: string[];
}

export interface HealthResponse {
  status: string;
  service?: string;
  environment?: string;
  timestamp?: string;
  checks?: Record<string, unknown>;
}
