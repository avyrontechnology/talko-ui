/**
 * Talko service endpoint map. Base URL comes from lib/config.ts.
 * Mirrors src/routes/__init__.py (prefix /talko-service/v1).
 */
export const endpoints = {
  health: "/health",

  // Auth context (who-am-I: auth type, scope, superadmin flag)
  authContext: "/auth/context",

  // Calls
  callCreate: "/call",
  callHangup: "/call/hangup",
  callTransfer: "/call/transfer",
  callDetails: "/call/details",

  // CDR
  cdrs: "/cdrs",
  agentCallLogs: "/cdrs/agent_call_logs",
  callRecordHistory: "/cdrs/call-record-history",
  cdrCustomFields: (callId: string) => `/cdrs/${callId}/custom-fields`,

  // Analytics
  analytics: "/get-analytics",

  // Call records (simple CRUD)
  callRecord: "/call-record",
  callRecordById: (id: string) => `/call-record/${id}`,
  callRecords: "/call-records",

  // Dialer
  dialerLeadLists: "/dialer/lead-lists",
  dialerBulkLeads: (listId: string) => `/dialer/lead-lists/${listId}/leads`,

  // DIDs
  didsByBoard: "/dids/by-service-board",
  didsAvailable: "/dids/available-for-assignment",
  didsAssign: "/dids/assign-did-numbers",
  didsUnassign: "/dids/unassign-did-numbers",
  didsStatusUpdate: "/dids/apply-did-status-update",
  didsList: "/dids/list-dids",
  didsStatusMeta: "/dids/status-metadata",
  didsAssignAi: "/dids/assign-ai-agent",
  didsReleaseAi: "/dids/release-ai-agent",
  didsAiAvailable: "/dids/ai-agent/available",
  didsPartnerAi: "/dids/partner-ai-agent-dids",

  // Vendors
  vendors: "/vendors",
  vendorById: (id: string) => `/vendors/${id}`,
  vendorActivate: (id: string) => `/vendors/${id}/activate`,
  vendorDeactivate: (id: string) => `/vendors/${id}/deactivate`,

  // Vendor configs
  vendorConfigs: "/vendor_configs",
  vendorConfigById: (id: string) => `/vendor_configs/${id}`,

  // Partner configs
  partnerConfigs: "/partner_configs",
  partnerConfigById: (id: string) => `/partner_configs/${id}`,

  // Agent mapping
  agentMapping: "/call_agent_mapping",
  agentBoardMapping: "/call_agent_mapping/service-board-mapping",

  // Custom fields
  customFields: "/custom-fields",
  customFieldById: (id: string) => `/custom-fields/${id}`,

  // Partner API keys + webhooks
  apiKeys: "/partner_api_keys",
  apiKeyRevoke: (id: string) => `/partner_api_keys/${id}/revoke`,
  webhookConfig: "/partner_webhooks/config",
  webhookConfigByPartner: (partnerId: string | number) =>
    `/partner_webhooks/config/${partnerId}`,
  webhookDeliveries: "/partner_webhooks/deliveries",

  // Assets
  assets: "/assets",
  digitalAssets: "/digital_assets",
  digitalAssetUpload: "/upload_digital_asset",
  digitalAssetDelete: "/delete_digital_asset",
} as const;
