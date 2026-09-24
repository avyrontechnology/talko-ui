/**
 * Talko service endpoint map. Base URL comes from lib/config.ts.
 * Mirrors src/routes/__init__.py (prefix /talko-service/v1).
 */
export const endpoints = {
  health: "/health",

  // Auth context (who-am-I: auth type, scope, superadmin flag)
  authContext: "/auth/context",

  // Talko-native user auth + management
  authUsers: "/auth/users",
  authUserById: (id: string) => `/auth/users/${id}`,

  // Calls
  callCreate: "/call",
  callHangup: "/call/hangup",
  callTransfer: "/call/transfer",
  callDetails: "/call/details",
  callGrpcHangup: "/call/grpc/hangup",
  callGrpcTransfer: "/call/grpc/transfer",
  callGrpcStatus: "/call/grpc/status",
  callSupervise: "/call/supervise",
  callAttendedStart: "/call/transfer/attended-start",
  callAttendedComplete: "/call/transfer/attended-complete",

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
  didsByWorkspace: "/dids/by-workspace",
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
  didsExternalImport: "/dids/external/import",
  didsInternalProvision: "/dids/internal/provision",
  didsMapExternalInternal: "/dids/map-external-internal",
  didsPoolUtilization: "/dids/pool-utilization",

  // Vendors
  vendors: "/vendors",
  vendorById: (id: string) => `/vendors/${id}`,
  vendorActivate: (id: string) => `/vendors/${id}/activate`,
  vendorDeactivate: (id: string) => `/vendors/${id}/deactivate`,

  // Vendor configs
  vendorConfigs: "/vendor_configs",
  vendorConfigById: (id: string) => `/vendor_configs/${id}`,
  vendorConfigPool: (id: string) => `/vendor_configs/${id}/pool`,

  // Partner configs
  partnerConfigs: "/partner_configs",
  partnerConfigById: (id: string) => `/partner_configs/${id}`,

  // Agent mapping
  agentMapping: "/call_agent_mapping",
  agentWorkspaceMapping: "/call_agent_mapping/workspace-mapping",

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

  // Clients (partner-scoped)
  clients: "/clients",
  clientById: (id: string) => `/clients/${id}`,
  clientActivate: (id: string) => `/clients/${id}/activate`,
  clientDeactivate: (id: string) => `/clients/${id}/deactivate`,

  // Billing (wholesaler / reseller)
  billingRateCards: "/billing/rate-cards",
  billingTopup: "/billing/topup",
  billingLedger: "/billing/ledger",
  billingTransactions: "/billing/transactions",
  billingPrice: "/billing/price",

  // Assets (call assets only)
  assets: "/assets",
} as const;
