import { api, getData, postData, patchData, putData, deleteData } from "./api-client";
import { endpoints } from "./endpoints";
import type {
  AgentMapping,
  ApiKeyItem,
  CallCreatePayload,
  Cdr,
  CustomField,
  DidRecord,
  HangupPayload,
  HealthResponse,
  LeadList,
  PartnerConfig,
  TransferPayload,
  Vendor,
  VendorConfig,
  CallRecord,
  WebhookConfig,
  WebhookDelivery,
} from "./types";

/* ---------- Health ---------- */

export interface AuthContext {
  user_id: number | null;
  partner_id: number | null;
  auth_type: "jwt" | "api_key";
  is_superadmin: boolean;
  role: string | null;
}

export const fetchAuthContext = () => getData<AuthContext>(endpoints.authContext);

export interface TalkoUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  partner_id?: number | null;
  is_active: boolean;
}

export const fetchTalkoUsers = () => getData<TalkoUser[]>(endpoints.authUsers);
export const createTalkoUser = (body: { name: string; email: string; phone?: string; password: string; role?: string; partner_id?: number | null }) =>
  postData<TalkoUser>(endpoints.authUsers, body);
export const updateTalkoUser = (id: string, body: { role?: string; partner_id?: number | null; is_active?: boolean }) =>
  patchData<TalkoUser>(endpoints.authUserById(id), body);
export const fetchHealth = () => getData<HealthResponse>(endpoints.health);

/* ---------- Calls ---------- */
export const createCall = (body: CallCreatePayload) =>
  postData<{ status: string; message: string }>(endpoints.callCreate, body);
export const hangupCall = (body: HangupPayload) =>
  postData(endpoints.callHangup, body);
export const transferCall = (body: TransferPayload) =>
  postData(endpoints.callTransfer, body);
export const fetchCallDetails = (params: {
  call_id?: string;
  call_uuid?: string;
  vendor_config_id: string;
}) => getData(endpoints.callDetails, { params });

/* ---------- CDR ---------- */
export interface CdrListParams {
  offset?: number;
  limit?: number;
}
export const fetchCdrs = (params: CdrListParams = {}) =>
  getData<Cdr[]>(endpoints.cdrs, { params });

export const fetchAgentCallLogs = (params: Record<string, string | number | boolean>) =>
  getData<{ call_histories: Cdr[]; total_count: number }>(endpoints.agentCallLogs, {
    params,
  });

export const fetchCallHistory = (params: { offset?: number; limit?: number; payload: string }) =>
  getData<{ call_record: Cdr[]; total_count: number }>(endpoints.callRecordHistory, {
    params,
  });

export const setCdrCustomFields = (callId: string, custom_fields: Record<string, unknown>) =>
  postData(endpoints.cdrCustomFields(callId), { custom_fields });

/* ---------- Analytics ---------- */
export const fetchAnalytics = (params: {
  analytics_type: string;
  payload: string;
  offset?: number;
  limit?: number;
}) => getData<{ analytics_type: string; data: unknown }>(endpoints.analytics, { params });

/* ---------- Call records ---------- */
export const fetchCallRecords = () => getData<CallRecord[]>(endpoints.callRecords);
export const fetchCallRecord = (id: string) =>
  getData<CallRecord>(endpoints.callRecordById(id));
export const createCallRecord = (body: Omit<CallRecord, "record_id" | "id">) =>
  postData(endpoints.callRecord, body);
export const updateCallRecord = (id: string, body: Partial<CallRecord>) =>
  putData(endpoints.callRecordById(id), body);
export const deleteCallRecord = (id: string) =>
  deleteData(endpoints.callRecordById(id));

/* ---------- Dialer ---------- */
export const fetchLeadLists = () =>
  getData<{ lists: LeadList[] }>(endpoints.dialerLeadLists);
export const uploadDialerLeads = (
  listId: string,
  body: { data: Record<string, string>[]; duplicate_option?: string; skill_id?: string },
) => postData(endpoints.dialerBulkLeads(listId), body);

/* ---------- DIDs ---------- */
export const fetchDidsByBoard = (service_board_id: string | number) =>
  getData(endpoints.didsByBoard, { params: { service_board_id } });
export const fetchAvailableDids = () => getData(endpoints.didsAvailable);
export const assignDids = (body: unknown) => postData(endpoints.didsAssign, body);
export const unassignDids = (did_numbers: string[]) =>
  postData(endpoints.didsUnassign, { did_numbers });
export const updateDidStatus = (body: {
  did_numbers: string[];
  action: string;
  service_board_id?: number;
  agent_id?: string;
}) => patchData(endpoints.didsStatusUpdate, body);
export const fetchDidList = (params: Record<string, string | number>) =>
  getData<{ total: number; page: number; limit: number; dids: DidRecord[] }>(
    endpoints.didsList,
    { params },
  );
export const fetchDidStatusMeta = () => getData(endpoints.didsStatusMeta);
export const assignAiAgentDid = (body: {
  partner_id: number;
  agent_bot_id: string;
  did_number?: string;
}) => postData(endpoints.didsAssignAi, body);
export const releaseAiAgentDid = (body: { partner_id: number; agent_bot_id: string }) =>
  postData(endpoints.didsReleaseAi, body);
export const fetchAiAvailableDids = (partner_id: string | number) =>
  getData(endpoints.didsAiAvailable, { params: { partner_id } });
export const fetchPartnerAiDids = (params: { partner_id: string | number; agent_bot_id: string }) =>
  getData(endpoints.didsPartnerAi, { params });

/* ---------- Vendors ---------- */
export const fetchVendors = () => getData<Vendor[]>(endpoints.vendors);
export const fetchVendor = (id: string) => getData<Vendor>(endpoints.vendorById(id));
export const createVendor = (body: { name: string; vendor_type: string }) =>
  postData(endpoints.vendors, body);
export const activateVendor = (id: string) => patchData(endpoints.vendorActivate(id));
export const deactivateVendor = (id: string) =>
  patchData(endpoints.vendorDeactivate(id));

export const fetchVendorConfigs = () => getData<VendorConfig[]>(endpoints.vendorConfigs);
export const fetchVendorConfig = (id: string) =>
  getData<VendorConfig>(endpoints.vendorConfigById(id));
export const createVendorConfig = (body: Record<string, unknown>) =>
  postData(endpoints.vendorConfigs, body);
export const updateVendorConfig = (id: string, body: Record<string, unknown>) =>
  patchData(endpoints.vendorConfigById(id), body);

/* ---------- Partner configs ---------- */
export const fetchPartnerConfigs = () =>
  getData<PartnerConfig[]>(endpoints.partnerConfigs);
export const fetchPartnerConfig = (id: string) =>
  getData<PartnerConfig>(endpoints.partnerConfigById(id));
export const createPartnerConfig = (body: Record<string, unknown>) =>
  postData(endpoints.partnerConfigs, body);
export const updatePartnerConfig = (id: string, body: Record<string, unknown>) =>
  patchData(endpoints.partnerConfigById(id), body);

/* ---------- Agent mapping ---------- */
export const fetchAgentMappings = (params?: { agent_id?: string; partner_id?: string }) =>
  getData<AgentMapping[]>(endpoints.agentMapping, { params });
export const createAgentMapping = (body: { agent_id: string; partner_id: number }) =>
  postData(endpoints.agentMapping, body);
export const createBoardMapping = (body: {
  partner_id: number;
  service_board_id: number;
  agent_id: string;
  agent_number?: string;
  is_active?: boolean;
}) => postData(endpoints.agentBoardMapping, body);
export const fetchBoardAgents = (params: { service_board_id: string | number; partner_id: string | number }) =>
  getData<AgentMapping[]>(endpoints.agentBoardMapping, { params });

/* ---------- Custom fields ---------- */
export const fetchCustomFields = (entity_type = "TalkoCDR") =>
  getData<CustomField[]>(endpoints.customFields, { params: { entity_type } });
export const createCustomField = (body: Record<string, unknown>) =>
  postData(endpoints.customFields, body);
export const updateCustomField = (id: string, body: Record<string, unknown>) =>
  patchData(endpoints.customFieldById(id), body);
export const deleteCustomField = (id: string) =>
  deleteData(endpoints.customFieldById(id));

/* ---------- API keys ---------- */
export const createApiKey = (body: { partner_id: number; label?: string }) =>
  postData<
    ApiKeyItem & { key: string; key_prefix: string }
  >(endpoints.apiKeys, body);
export const fetchApiKeys = (partner_id: string | number) =>
  getData<ApiKeyItem[]>(endpoints.apiKeys, { params: { partner_id } });
export const revokeApiKey = (id: string) => postData(endpoints.apiKeyRevoke(id));

/* ---------- Webhooks ---------- */
export const createWebhookConfig = (body: {
  partner_id: number;
  url: string;
  subscribed_events?: string[];
}) => postData<WebhookConfig>(endpoints.webhookConfig, body);
export const fetchWebhookConfig = (partnerId: string | number) =>
  getData<WebhookConfig>(endpoints.webhookConfigByPartner(partnerId));
export const updateWebhookConfig = (
  partnerId: string | number,
  body: { url?: string; is_active?: boolean; subscribed_events?: string[] },
) => patchData<WebhookConfig>(endpoints.webhookConfigByPartner(partnerId), body);
export const fetchWebhookDeliveries = (params: { partner_id: string | number; limit?: number }) =>
  getData<WebhookDelivery[]>(endpoints.webhookDeliveries, { params });

/* ---------- Assets ---------- */
export const fetchAssets = (params: { partner_id: string | number; asset_type: string }) =>
  getData(endpoints.assets, { params });
export const fetchDigitalAssets = (params: { partner_id?: string | number; asset_type?: string }) =>
  getData(endpoints.digitalAssets, { params });
export const uploadDigitalAsset = (params: {
  partner_id: string | number;
  asset_type: string;
  file: File;
}) => {
  const form = new FormData();
  form.append("file", params.file);
  return api.post(
    `${endpoints.digitalAssetUpload}?partner_id=${params.partner_id}&asset_type=${params.asset_type}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
};
export const deleteDigitalAsset = (asset_id: string) =>
  api.delete(endpoints.digitalAssetDelete, { params: { asset_id } });
