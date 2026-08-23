const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002/';
const SERVER_URL = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;

// WhatsApp Business Cloud API CRM Endpoints
export const getWhatsAppContactsUrl = `${SERVER_URL}admin/whatsapp/contacts`;
export const getWhatsAppMessagesUrl = `${SERVER_URL}admin/whatsapp/messages/`;
export const sendWhatsAppMessageUrl = `${SERVER_URL}admin/whatsapp/send`;
export const getWhatsAppStatsUrl = `${SERVER_URL}admin/whatsapp/stats`;
export const getWhatsAppConfigStatusUrl = `${SERVER_URL}admin/whatsapp/config-status`;

// Lead Distribution & Management Endpoints (Super Admin)
export const getLeadManagersUrl = `${SERVER_URL}admin/whatsapp/lead-managers`;
export const toggleLeadManagerUrl = `${SERVER_URL}admin/whatsapp/lead-managers/toggle`;
export const assignLeadUrl = `${SERVER_URL}admin/whatsapp/assign-lead`;

// Lead Follow-up & Pipeline Endpoints
export const saveLeadFollowupUrl = `${SERVER_URL}admin/crm/followups/save`;
export const getFollowupsListUrl = `${SERVER_URL}admin/crm/followups`;
export const getFollowupStatsUrl = `${SERVER_URL}admin/crm/followups/stats`;
export const getSingleLeadFollowupUrl = `${SERVER_URL}admin/crm/followups/contact/`;
export const getFollowupLogsUrl = `${SERVER_URL}admin/crm/followups/logs/`;
