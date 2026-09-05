const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002/';
const SERVER_URL = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;

// WhatsApp Business Cloud API CRM Endpoints
export const getWhatsAppContactsUrl = `${SERVER_URL}admin/whatsapp/contacts`;
export const createManualLeadUrl = `${SERVER_URL}admin/whatsapp/contacts/manual`;
export const getWhatsAppMessagesUrl = `${SERVER_URL}admin/whatsapp/messages/`;
export const sendWhatsAppMessageUrl = `${SERVER_URL}admin/whatsapp/send`;
export const getWhatsAppStatsUrl = `${SERVER_URL}admin/whatsapp/stats`;
export const getWhatsAppConfigStatusUrl = `${SERVER_URL}admin/whatsapp/config-status`;
export const deleteWhatsAppContactUrl = `${SERVER_URL}admin/whatsapp/contacts/`;

// Lead Distribution & Management Endpoints (Super Admin)
export const getLeadManagersUrl = `${SERVER_URL}admin/whatsapp/lead-managers`;
export const toggleLeadManagerUrl = `${SERVER_URL}admin/whatsapp/lead-managers/toggle`;
export const assignLeadUrl = `${SERVER_URL}admin/whatsapp/assign-lead`;

// Lead Follow-up & Pipeline Endpoints
export const saveLeadFollowupUrl = `${SERVER_URL}admin/crm/followups/save`;
export const convertLeadUrl = `${SERVER_URL}admin/crm/followups/convert`;
export const reopenLeadUrl = `${SERVER_URL}admin/crm/followups/reopen`;
export const getFollowupsListUrl = `${SERVER_URL}admin/crm/followups`;
export const getFollowupStatsUrl = `${SERVER_URL}admin/crm/followups/stats`;
export const getSingleLeadFollowupUrl = `${SERVER_URL}admin/crm/followups/contact/`;
export const getFollowupLogsUrl = `${SERVER_URL}admin/crm/followups/logs/`;

// WhatsApp Marketing & Broadcast Campaign Endpoints
export const getMarketingAudienceLeadsUrl = `${SERVER_URL}admin/whatsapp/marketing/leads`;
export const createMarketingCampaignUrl = `${SERVER_URL}admin/whatsapp/marketing/campaigns`;
export const getMarketingCampaignsUrl = `${SERVER_URL}admin/whatsapp/marketing/campaigns`;
export const getMarketingCampaignDetailsUrl = `${SERVER_URL}admin/whatsapp/marketing/campaigns/`;

// Safari Peak Dates & Calendar Endpoints
export const getPeakDatesUrl = `${SERVER_URL}admin/crm/peak-dates`;
export const createPeakDateUrl = `${SERVER_URL}admin/crm/peak-dates`;
export const updatePeakDateUrl = `${SERVER_URL}admin/crm/peak-dates/`;
export const deletePeakDateUrl = `${SERVER_URL}admin/crm/peak-dates/`;

// Billing & Customer Invoice Endpoints
export const getInvoicesListUrl = `${SERVER_URL}admin/crm/invoices`;
export const createInvoiceUrl = `${SERVER_URL}admin/crm/invoices`;
export const getSingleInvoiceUrl = `${SERVER_URL}admin/crm/invoices/`;
export const deleteInvoiceUrl = `${SERVER_URL}admin/crm/invoices/`;
export const getInvoiceConfigUrl = `${SERVER_URL}admin/crm/invoices/config`;
export const updateInvoiceConfigUrl = `${SERVER_URL}admin/crm/invoices/config`;
export const getNextInvoiceNumberUrl = `${SERVER_URL}admin/crm/invoices/next-number`;
export const getBillingStatsUrl = `${SERVER_URL}admin/crm/invoices/stats`;

// WhatsApp Invoice & Payment Link Templates
export const getWhatsAppInvoiceTemplatesUrl = `${SERVER_URL}admin/crm/invoices/templates`;
export const createWhatsAppInvoiceTemplateUrl = `${SERVER_URL}admin/crm/invoices/templates`;
export const updateWhatsAppInvoiceTemplateUrl = `${SERVER_URL}admin/crm/invoices/templates/`; // append :id
export const deleteWhatsAppInvoiceTemplateUrl = `${SERVER_URL}admin/crm/invoices/templates/`; // append :id
export const sendInvoiceWhatsAppUrl = `${SERVER_URL}admin/crm/invoices/`; // append :id/send-whatsapp
export const generateInvoicePaymentLinkUrl = `${SERVER_URL}admin/crm/invoices/`; // append :id/payment-link
export const syncInvoicePaymentUrl = `${SERVER_URL}admin/crm/invoices/`; // append :id/sync-payment
export const updateInvoicePaymentStatusUrl = `${SERVER_URL}admin/crm/invoices/`; // append :id/payment-status
export const getInvoicePaymentsHistoryUrl = `${SERVER_URL}admin/crm/invoices/`; // append :id/payments
export const uploadInvoiceProofUrl = `${SERVER_URL}admin/crm/invoices/upload-proof`;
export const getInvoicesByContactUrl = `${SERVER_URL}admin/crm/invoices/by-contact/`; // append :contactId

// Booking Users & CRM Customer History
export const getBookingUsersUrl = `${SERVER_URL}admin/crm/booking-users`;

// Task Management & Kanban Board Endpoints
export const getTasksListUrl = `${SERVER_URL}admin/crm/tasks`;
export const createTaskUrl = `${SERVER_URL}admin/crm/tasks`;
export const getSingleTaskUrl = `${SERVER_URL}admin/crm/tasks/`;
export const updateTaskStatusUrl = `${SERVER_URL}admin/crm/tasks/`; // append :id/status
export const updateTaskUrl = `${SERVER_URL}admin/crm/tasks/`; // append :id
export const deleteTaskUrl = `${SERVER_URL}admin/crm/tasks/`; // append :id
export const getTaskStatsUrl = `${SERVER_URL}admin/crm/tasks/stats`;
export const getTaskUsersUrl = `${SERVER_URL}admin/crm/tasks/users`;
export const addTaskCommentUrl = `${SERVER_URL}admin/crm/tasks/`; // append :id/comments
export const markTaskAsReadUrl = `${SERVER_URL}admin/crm/tasks/`; // append :id/read

// Notice Board Endpoints (All Admin Users)
export const getNoticesListUrl = `${SERVER_URL}admin/crm/notices`;
export const createNoticeUrl = `${SERVER_URL}admin/crm/notices`;
export const getSingleNoticeUrl = `${SERVER_URL}admin/crm/notices/`; // append :id
export const updateNoticeUrl = `${SERVER_URL}admin/crm/notices/`; // append :id
export const togglePinNoticeUrl = `${SERVER_URL}admin/crm/notices/`; // append :id/pin
export const deleteNoticeUrl = `${SERVER_URL}admin/crm/notices/`; // append :id
export const getNoticeStatsUrl = `${SERVER_URL}admin/crm/notices/stats`;

// Real-Time Team Chat Endpoints (Socket.io + REST)
export const getChatUsersUrl = `${SERVER_URL}admin/crm/chat/users`;
export const getChatConversationsUrl = `${SERVER_URL}admin/crm/chat/conversations`;
export const createDirectChatUrl = `${SERVER_URL}admin/crm/chat/conversations/direct`;
export const getChatMessagesUrl = `${SERVER_URL}admin/crm/chat/conversations/`; // append :id/messages
export const sendChatMessageUrl = `${SERVER_URL}admin/crm/chat/conversations/`; // append :id/messages
export const markChatReadUrl = `${SERVER_URL}admin/crm/chat/conversations/`; // append :id/read
export const uploadChatFileUrl = `${SERVER_URL}admin/crm/chat/upload`;
export const getChatUnreadCountUrl = `${SERVER_URL}admin/crm/chat/unread-count`;
