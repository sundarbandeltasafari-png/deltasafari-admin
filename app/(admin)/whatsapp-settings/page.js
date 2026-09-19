"use client";
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
    getWhatsAppOtpSettingsUrl,
    updateWhatsAppOtpSettingsUrl,
    testWhatsAppOtpUrl,
    getWhatsAppTemplatesUrl,
    createWhatsAppTemplateUrl,
    deleteWhatsAppTemplateItemUrl,
    updateWhatsAppTemplateItemUrl,
    publishWhatsAppTemplateUrl,
    updateWhatsAppTemplateStatusUrl,
    syncMetaTemplatesStatusUrl,
    getInvoiceConfigUrl,
    updateInvoiceConfigUrl,
    getWhatsAppInvoiceTemplatesUrl,
    createWhatsAppInvoiceTemplateUrl,
    updateWhatsAppInvoiceTemplateUrl,
    deleteWhatsAppInvoiceTemplateUrl
} from '@/app/routes/whatsappRoutes';
import LoadingComponent from '@/components/common/LoadingComponent';
import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';

const WhatsAppSettingsPage = () => {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [activeMainTab, setActiveMainTab] = useState('otp'); // 'otp' | 'razorpay'

    // ==========================================
    // 1. WhatsApp OTP Verification State
    // ==========================================
    const [savingOtp, setSavingOtp] = useState(false);
    const [otpSettings, setOtpSettings] = useState({
        whatsapp_otp_enabled: 1,
        whatsapp_otp_template_name: 'otp_verification',
        whatsapp_otp_template_language: 'en_US',
        whatsapp_otp_template_type: 'authentication',
        whatsapp_otp_expiry_minutes: 10,
        whatsapp_otp_custom_text: '',
        whatsapp_forgot_template_name: 'otp_verification',
        whatsapp_forgot_template_language: 'en_US',
        whatsapp_forgot_template_type: 'authentication',
        whatsapp_forgot_custom_text: ''
    });

    const [envStatus, setEnvStatus] = useState(null);

    // WhatsApp Live Test Tool State
    const [testPhoneNumber, setTestPhoneNumber] = useState('');
    const [testRecipientName, setTestRecipientName] = useState('');
    const [testingOtp, setTestingOtp] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // WhatsApp OTP Template Manager State
    const [templatesList, setTemplatesList] = useState([]);
    const [createOtpModalOpen, setCreateOtpModalOpen] = useState(false);
    const [creatingOtpTemplate, setCreatingOtpTemplate] = useState(false);
    const [newOtpTemplate, setNewOtpTemplate] = useState({
        name: '',
        title: '',
        category: 'authentication',
        template_type: 'authentication',
        language: 'en_US',
        template_text: '{{1}} is your Delta Safari verification code. For your security, do not share this code.',
        set_as_active: true,
        submit_to_meta: false
    });

    // OTP Live Interactive Preview & Action State
    const [selectedOtpTemplateForPreview, setSelectedOtpTemplateForPreview] = useState(null);
    const [publishingTemplateId, setPublishingTemplateId] = useState(null);
    const [syncingMetaStatus, setSyncingMetaStatus] = useState(false);
    const [editOtpModalOpen, setEditOtpModalOpen] = useState(false);
    const [editingOtpTemplate, setEditingOtpTemplate] = useState(null);
    const [editOtpForm, setEditOtpForm] = useState({
        id: null,
        name: '',
        title: '',
        category: 'authentication',
        template_type: 'authentication',
        language: 'en_US',
        template_text: '',
        meta_status: 'APPROVED'
    });
    const [savingEditOtp, setSavingEditOtp] = useState(false);

    // ==========================================
    // 2. WhatsApp & Razorpay Automation State
    // ==========================================
    const [savingRazorpay, setSavingRazorpay] = useState(false);
    const [showKeySecret, setShowKeySecret] = useState(false);
    const [razorpayConfig, setRazorpayConfig] = useState({
        razorpay_key_id: '',
        razorpay_key_secret: '',
        razorpay_webhook_secret: '',
        auto_send_whatsapp_invoice: 1,
        default_whatsapp_template_id: null,
        company_name: 'DELTA SAFARI',
        tagline: 'WHERE EXPECTATIONS MEET REALITY',
        mobile_numbers: '+91 7029533240',
        website: 'sundarbandeltasafari.com'
    });

    // WhatsApp Invoice Templates state
    const [invoiceTemplates, setInvoiceTemplates] = useState([]);
    const [loadingInvoiceTemplates, setLoadingInvoiceTemplates] = useState(false);
    const [invoiceTemplateModalOpen, setInvoiceTemplateModalOpen] = useState(false);
    const [editingInvoiceTemplate, setEditingInvoiceTemplate] = useState(null);
    const [invoiceTemplateForm, setInvoiceTemplateForm] = useState({
        name: '',
        title: '',
        category: 'invoice',
        template_text: '',
        is_default: 0
    });
    const [savingInvoiceTemplate, setSavingInvoiceTemplate] = useState(false);
    const [selectedInvoiceTemplateForPreview, setSelectedInvoiceTemplateForPreview] = useState(null);

    // Sample Invoice object for live preview
    const sampleInvoice = {
        invoice_no: 'INV-0030018',
        invoice_date: new Date().toISOString().split('T')[0],
        customer_name: 'Kaushik Bhattacharjee',
        customer_phone: '8777810327',
        package_name: '2N 3D Sundarban Safari Special Package',
        number_of_pax: 5,
        room_required: '2 Rooms (1 AC, 1 Non-AC)',
        departure_date_text: '26/09/2026 to 28/09/2026',
        pickup_drop: 'Canning',
        subtotal: 14500,
        advance_received: 2500,
        advance_note: '500/pax',
        total_due_amount: 12000,
        razorpay_payment_url: 'https://rzp.io/i/samplePayDeltaSafari'
    };

    // Check URL query param on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam && ['otp', 'razorpay'].includes(tabParam)) {
                setActiveMainTab(tabParam);
            }
        }
    }, []);

    // Load configurations on mount
    useEffect(() => {
        if (token) {
            loadAllConfigurations();
        }
    }, [token]);

    const loadAllConfigurations = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadOtpSettings(),
                loadOtpTemplates(),
                loadRazorpayConfig(),
                loadInvoiceTemplates()
            ]);
        } catch (e) {
            console.error('Error loading configurations:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadOtpSettings = () => {
        return axiosGet(getWhatsAppOtpSettingsUrl, token).then((res) => {
            if (res?.status) {
                if (res?.env_status) setEnvStatus(res.env_status);
                if (res?.settings) {
                    setOtpSettings((prev) => ({
                        ...prev,
                        ...res.settings
                    }));
                }
            }
        }).catch((err) => {
            console.error('Error fetching WhatsApp OTP settings:', err);
        });
    };

    const loadOtpTemplates = () => {
        return axiosGet(`${getWhatsAppTemplatesUrl}?category=otp`, token).then((res) => {
            if (res?.status && res?.templates) {
                const otpOnly = res.templates.filter(t => t.category !== 'invoice');
                setTemplatesList(otpOnly);
                setSelectedOtpTemplateForPreview((prev) => {
                    if (prev && otpOnly.some((t) => t.id === prev.id)) {
                        return otpOnly.find((t) => t.id === prev.id);
                    }
                    return otpOnly.find((t) => t.name === otpSettings.whatsapp_otp_template_name) || otpOnly[0] || null;
                });
            }
        }).catch(() => {});
    };

    const loadRazorpayConfig = () => {
        return axiosGet(getInvoiceConfigUrl, token).then((res) => {
            if (res?.status && res.data) {
                setRazorpayConfig((prev) => ({
                    ...prev,
                    ...res.data
                }));
            }
        }).catch((err) => {
            console.error('Error fetching Razorpay config:', err);
        });
    };

    const loadInvoiceTemplates = () => {
        setLoadingInvoiceTemplates(true);
        return axiosGet(getWhatsAppInvoiceTemplatesUrl, token).then((res) => {
            if (res?.status && res.data) {
                setInvoiceTemplates(res.data);
                const def = res.data.find(t => t.is_default === 1) || res.data[0];
                if (def && !selectedInvoiceTemplateForPreview) {
                    setSelectedInvoiceTemplateForPreview(def);
                }
            }
        }).catch((err) => {
            console.error('Error fetching invoice templates:', err);
        }).finally(() => {
            setLoadingInvoiceTemplates(false);
        });
    };

    // ==========================================
    // Save Handlers
    // ==========================================

    // Save WhatsApp OTP Settings
    const handleSaveOtpSettings = async (e) => {
        e.preventDefault();
        setSavingOtp(true);
        try {
            const res = await axiosPut(updateWhatsAppOtpSettingsUrl, otpSettings, token);
            if (res?.status) {
                showMessage(res.msg || 'WhatsApp OTP settings saved successfully!', 'success');
                loadOtpSettings();
            } else {
                showMessage(res?.msg || 'Failed to save settings', 'error');
            }
        } catch (err) {
            showMessage(err?.response?.data?.msg || err.message || 'Error saving settings', 'error');
        } finally {
            setSavingOtp(false);
        }
    };

    // Save Razorpay & WhatsApp Invoice Automation Configuration
    const handleSaveRazorpayConfig = async (e) => {
        e.preventDefault();
        setSavingRazorpay(true);
        try {
            const res = await axiosPost(updateInvoiceConfigUrl, razorpayConfig, token);
            if (res?.status) {
                showMessage('🎉 Razorpay integration keys & automation settings saved successfully!', 'success');
                loadRazorpayConfig();
            } else {
                showMessage(res?.msg || 'Failed to save Razorpay configuration.', 'error');
            }
        } catch (err) {
            showMessage(err.response?.data?.msg || err.message || 'Error saving settings.', 'error');
        } finally {
            setSavingRazorpay(false);
        }
    };

    // Handler to create new WhatsApp OTP template
    const handleCreateOtpTemplate = async (e) => {
        e.preventDefault();
        const cleanName = (newOtpTemplate.name || '').replace(/[^a-z0-9_]/g, '_').toLowerCase().trim();
        if (!cleanName) {
            showMessage('Please enter a template name (lowercase letters, numbers, underscores only)', 'error');
            return;
        }
        setCreatingOtpTemplate(true);
        try {
            const payload = {
                ...newOtpTemplate,
                name: cleanName
            };
            const res = await axiosPost(createWhatsAppTemplateUrl, payload, token);
            if (res?.status) {
                showMessage(res.msg || 'Template created successfully!', 'success');
                setCreateOtpModalOpen(false);
                loadOtpTemplates();
                if (newOtpTemplate.set_as_active) {
                    setOtpSettings((prev) => ({
                        ...prev,
                        whatsapp_otp_template_name: cleanName,
                        whatsapp_otp_template_language: newOtpTemplate.language,
                        whatsapp_otp_template_type: newOtpTemplate.template_type,
                        whatsapp_forgot_template_name: cleanName,
                        whatsapp_forgot_template_language: newOtpTemplate.language,
                        whatsapp_forgot_template_type: newOtpTemplate.template_type
                    }));
                }
            } else {
                showMessage(res?.msg || 'Failed to create template', 'error');
            }
        } catch (err) {
            showMessage(err?.response?.data?.msg || err.message, 'error');
        } finally {
            setCreatingOtpTemplate(false);
        }
    };

    // Delete OTP Template
    const handleDeleteOtpTemplate = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
        try {
            const res = await axiosDelete(`${deleteWhatsAppTemplateItemUrl}${id}`, token);
            if (res?.status) {
                showMessage('Template deleted successfully', 'success');
                loadOtpTemplates();
                if (otpSettings.whatsapp_otp_template_name === name) {
                    setOtpSettings(prev => ({ 
                        ...prev, 
                        whatsapp_otp_template_name: 'otp_verification',
                        whatsapp_forgot_template_name: 'otp_verification'
                    }));
                }
            } else {
                showMessage(res?.msg || 'Failed to delete template', 'error');
            }
        } catch (err) {
            showMessage(err?.message, 'error');
        }
    };

    // Send Live Test OTP
    const handleSendTestOtp = async (e) => {
        e.preventDefault();
        const cleanPhone = (testPhoneNumber || '').replace(/\D/g, '').slice(-10);
        if (!cleanPhone || cleanPhone.length !== 10) {
            showMessage('Please enter a valid 10-digit mobile number for the test', 'error');
            return;
        }

        setTestingOtp(true);
        setTestResult(null);

        const tplName = otpSettings.whatsapp_otp_template_name || 'otp_verification';
        const langCode = otpSettings.whatsapp_otp_template_language || 'en_US';
        const tplType = otpSettings.whatsapp_otp_template_type || 'authentication';

        try {
            const res = await axiosPost(testWhatsAppOtpUrl, {
                phone_number: cleanPhone,
                recipient_name: testRecipientName || 'Test Traveler',
                otp_type: 'login',
                template_name: tplName,
                language_code: langCode,
                template_type: tplType
            }, token);

            setTestResult({
                status: res?.status || false,
                msg: res?.msg || 'Test OTP dispatched',
                details: res?.details || null
            });

            if (res?.status) {
                showMessage(res.msg || 'Test OTP sent successfully!', 'success');
            } else {
                showMessage(res?.msg || 'Failed to send test OTP', 'error');
            }
        } catch (err) {
            const errMsg = err?.response?.data?.msg || err.message || 'Error executing test OTP dispatch';
            setTestResult({
                status: false,
                msg: errMsg,
                details: err?.response?.data?.details || null
            });
            showMessage(errMsg, 'error');
        } finally {
            setTestingOtp(false);
        }
    };

    // ==========================================
    // OTP Template Manager Action Handlers
    // ==========================================

    // Select Active OTP Template
    const handleSelectActiveTemplate = (tpl) => {
        setOtpSettings((prev) => ({
            ...prev,
            whatsapp_otp_template_name: tpl.name,
            whatsapp_forgot_template_name: tpl.name,
            whatsapp_otp_template_language: tpl.language || prev.whatsapp_otp_template_language || 'en_US',
            whatsapp_forgot_template_language: tpl.language || prev.whatsapp_otp_template_language || 'en_US',
            whatsapp_otp_template_type: tpl.template_type || 'authentication',
            whatsapp_forgot_template_type: tpl.template_type || 'authentication'
        }));
        setSelectedOtpTemplateForPreview(tpl);
        showMessage(`Active template switched to "${tpl.name}". Click "Save OTP Settings" to persist.`, 'info');
    };

    // Publish / Submit template to Meta WhatsApp Cloud API
    const handlePublishTemplate = async (tpl) => {
        setPublishingTemplateId(tpl.id);
        try {
            const res = await axiosPost(`${publishWhatsAppTemplateUrl}${tpl.id}/publish`, {}, token);
            if (res?.status) {
                const isVerified = (res.meta_status === 'APPROVED' || res.is_active === true);
                if (isVerified) {
                    setOtpSettings((prev) => ({
                        ...prev,
                        whatsapp_otp_template_name: tpl.name,
                        whatsapp_forgot_template_name: tpl.name,
                        whatsapp_otp_template_language: tpl.language || prev.whatsapp_otp_template_language || 'en_US',
                        whatsapp_forgot_template_language: tpl.language || prev.whatsapp_forgot_template_language || 'en_US',
                        whatsapp_otp_template_type: tpl.template_type || 'authentication',
                        whatsapp_forgot_template_type: tpl.template_type || 'authentication'
                    }));
                    setSelectedOtpTemplateForPreview(tpl);
                    showMessage(res.msg || `🎉 Template "${tpl.name}" was VERIFIED by Meta and has been automatically set as your Active OTP Template!`, 'success');
                } else {
                    showMessage(res.msg || `Template "${tpl.name}" submitted to Meta. Status: ${res.meta_status || 'PENDING'}`, 'info');
                }
                loadOtpTemplates();
                loadOtpSettings();
            } else {
                showMessage(res?.msg || `Failed to publish template "${tpl.name}"`, 'error');
                loadOtpTemplates();
            }
        } catch (err) {
            showMessage(err?.response?.data?.msg || err.message || 'Error publishing template to Meta', 'error');
            loadOtpTemplates();
        } finally {
            setPublishingTemplateId(null);
        }
    };

    // Manually Update Status (Verified / Approved, Rejected, Pending, Local Draft)
    const handleUpdateTemplateStatus = async (tplOrId, newStatus) => {
        const tplId = typeof tplOrId === 'object' ? tplOrId.id : tplOrId;
        const tplObj = typeof tplOrId === 'object' ? tplOrId : templatesList.find(t => t.id === tplId);
        try {
            const res = await axiosPost(`${updateWhatsAppTemplateStatusUrl}${tplId}/status`, { status: newStatus }, token);
            if (res?.status) {
                if (newStatus === 'APPROVED' && tplObj) {
                    setOtpSettings((prev) => ({
                        ...prev,
                        whatsapp_otp_template_name: tplObj.name,
                        whatsapp_forgot_template_name: tplObj.name,
                        whatsapp_otp_template_language: tplObj.language || prev.whatsapp_otp_template_language || 'en_US',
                        whatsapp_forgot_template_language: tplObj.language || prev.whatsapp_forgot_template_language || 'en_US',
                        whatsapp_otp_template_type: tplObj.template_type || 'authentication',
                        whatsapp_forgot_template_type: tplObj.template_type || 'authentication'
                    }));
                    setSelectedOtpTemplateForPreview(tplObj);
                    showMessage(`🎉 Template "${tplObj.name}" set to VERIFIED and automatically activated for OTP delivery!`, 'success');
                } else {
                    showMessage(`Template status updated to ${newStatus === 'APPROVED' ? 'VERIFIED (APPROVED)' : newStatus}!`, 'success');
                }
                loadOtpTemplates();
                loadOtpSettings();
            } else {
                showMessage(res?.msg || 'Failed to update status', 'error');
            }
        } catch (err) {
            showMessage(err?.response?.data?.msg || err.message, 'error');
        }
    };

    // Sync all templates with Meta Cloud API
    const handleSyncAllMetaTemplates = async () => {
        setSyncingMetaStatus(true);
        try {
            const res = await axiosGet(syncMetaTemplatesStatusUrl, token);
            if (res?.status) {
                showMessage(res.msg || 'Meta templates synced successfully!', 'success');
                loadOtpTemplates();
                loadOtpSettings();
            } else {
                showMessage(res?.msg || 'Failed to sync with Meta. Please verify credentials in backend .env', 'error');
            }
        } catch (err) {
            showMessage(err?.response?.data?.msg || err.message, 'error');
        } finally {
            setSyncingMetaStatus(false);
        }
    };

    // Open Edit Modal for OTP Template
    const handleOpenEditOtpTemplate = (tpl) => {
        setEditingOtpTemplate(tpl);
        setEditOtpForm({
            id: tpl.id,
            name: tpl.name,
            title: tpl.title || tpl.name,
            category: tpl.category || 'authentication',
            template_type: tpl.template_type || 'authentication',
            language: tpl.language || 'en_US',
            template_text: tpl.template_text || '',
            meta_status: tpl.meta_status || 'APPROVED'
        });
        setEditOtpModalOpen(true);
    };

    // Save Edit OTP Template
    const handleSaveEditOtpTemplate = async (e) => {
        e.preventDefault();
        setSavingEditOtp(true);
        try {
            const res = await axiosPut(`${updateWhatsAppTemplateItemUrl}${editOtpForm.id}`, editOtpForm, token);
            if (res?.status) {
                if (editOtpForm.meta_status === 'APPROVED') {
                    setOtpSettings((prev) => ({
                        ...prev,
                        whatsapp_otp_template_name: editOtpForm.name,
                        whatsapp_forgot_template_name: editOtpForm.name,
                        whatsapp_otp_template_language: editOtpForm.language || prev.whatsapp_otp_template_language || 'en_US',
                        whatsapp_forgot_template_language: editOtpForm.language || prev.whatsapp_forgot_template_language || 'en_US',
                        whatsapp_otp_template_type: editOtpForm.template_type || 'authentication',
                        whatsapp_forgot_template_type: editOtpForm.template_type || 'authentication'
                    }));
                }
                showMessage('Template updated successfully!', 'success');
                setEditOtpModalOpen(false);
                loadOtpTemplates();
                loadOtpSettings();
            } else {
                showMessage(res?.msg || 'Failed to update template', 'error');
            }
        } catch (err) {
            showMessage(err?.response?.data?.msg || err.message, 'error');
        } finally {
            setSavingEditOtp(false);
        }
    };

    // Helper: Render sample text for OTP Chat preview
    const getRenderedOtpPreviewText = (templateText, templateType = 'authentication', sampleOtp = '842109', sampleName = 'Kaushik Bhattacharjee') => {
        if (!templateText) return 'Sample OTP verification message will appear here.';
        if (templateType === 'utility_2var') {
            return templateText
                .replace(/\{\{1\}\}/g, sampleName)
                .replace(/\{\{2\}\}/g, sampleOtp)
                .replace(/\{\{otp\}\}/gi, sampleOtp)
                .replace(/\{\{name\}\}/gi, sampleName);
        }
        return templateText
            .replace(/\{\{1\}\}/g, sampleOtp)
            .replace(/\{\{2\}\}/g, sampleName)
            .replace(/\{\{otp\}\}/gi, sampleOtp)
            .replace(/\{\{name\}\}/gi, sampleName)
            .replace(/\{\{expiry\}\}/gi, '10');
    };

    // ==========================================
    // Invoice WhatsApp Template Handlers
    // ==========================================
    const handleOpenCreateInvoiceTemplate = () => {
        setEditingInvoiceTemplate(null);
        setInvoiceTemplateForm({
            name: '',
            title: '',
            category: 'invoice',
            template_text: `🐅 *DELTA SAFARI - Official Tour Booking Invoice* 🌿\n\nDear *{{customer_name}}*,\n\nThank you for choosing *Delta Safari* for your upcoming wildlife experience! Your safari booking invoice *#{{invoice_no}}* has been generated.\n\n📋 *Tour Summary:*\n• Package: *{{package_name}}*\n• Safari Date: *{{departure_date}}*\n• Total Travelers: *{{pax}}*\n• Room Allotment: *{{rooms}}*\n• Pickup Hub: *{{pickup_drop}}*\n\n💰 *Payment Breakdown:*\n• Package Total: *₹{{total_amount}}*\n• Advance Due: *₹{{advance_amount}}* ({{advance_note}})\n• Balance Due at Arrival: *₹{{due_amount}}*\n\n👇 *Pay Your Advance Securely via Razorpay Payment Link:*\n{{payment_link}}\n\n_Payment confirmation and official GST receipt are generated instantly upon transaction completion._\n\n💬 Need help? Reply directly to this WhatsApp chat or call {{contact_number}}.\n_Visit: {{website}}_`,
            is_default: invoiceTemplates.length === 0 ? 1 : 0,
            meta_status: 'LOCAL'
        });
        setInvoiceTemplateModalOpen(true);
    };

    const handleOpenEditInvoiceTemplate = (tmpl) => {
        setEditingInvoiceTemplate(tmpl);
        setInvoiceTemplateForm({
            name: tmpl.name,
            title: tmpl.title || '',
            category: tmpl.category || 'invoice',
            template_text: tmpl.template_text || '',
            is_default: tmpl.is_default || 0,
            meta_status: tmpl.meta_status || 'LOCAL'
        });
        setInvoiceTemplateModalOpen(true);
    };

    const handleSaveInvoiceTemplate = async (e) => {
        e.preventDefault();
        setSavingInvoiceTemplate(true);
        try {
            let res;
            if (editingInvoiceTemplate) {
                res = await axiosPut(`${updateWhatsAppInvoiceTemplateUrl}${editingInvoiceTemplate.id}`, invoiceTemplateForm, token);
            } else {
                res = await axiosPost(createWhatsAppInvoiceTemplateUrl, invoiceTemplateForm, token);
            }

            if (res?.status) {
                showMessage(editingInvoiceTemplate ? 'Template updated successfully!' : 'New WhatsApp template created!', 'success');
                setInvoiceTemplateModalOpen(false);
                loadInvoiceTemplates();
            } else {
                showMessage(res?.msg || 'Failed to save template.', 'error');
            }
        } catch (err) {
            showMessage(err.response?.data?.msg || err.message || 'Error saving template.', 'error');
        } finally {
            setSavingInvoiceTemplate(false);
        }
    };

    const handleDeleteInvoiceTemplate = async (id) => {
        if (!window.confirm('Are you sure you want to delete this WhatsApp template?')) return;
        try {
            const res = await axiosDelete(`${deleteWhatsAppInvoiceTemplateUrl}${id}`, token);
            if (res?.status) {
                showMessage('Template deleted successfully.', 'success');
                loadInvoiceTemplates();
            } else {
                showMessage(res?.msg || 'Failed to delete template.', 'error');
            }
        } catch (err) {
            showMessage(err.response?.data?.msg || err.message || 'Error deleting template.', 'error');
        }
    };

    // Publish WhatsApp Invoice Template to Meta
    const handlePublishInvoiceTemplate = async (tmpl) => {
        setPublishingTemplateId(tmpl.id);
        try {
            const res = await axiosPost(`${publishWhatsAppTemplateUrl}${tmpl.id}/publish`, {}, token);
            if (res?.status) {
                const isVerified = (res.meta_status === 'APPROVED' || res.is_active === true);
                if (isVerified) {
                    setSelectedInvoiceTemplateForPreview(tmpl);
                    showMessage(res.msg || `🎉 Template "${tmpl.name}" was VERIFIED by Meta and automatically set as Default Invoice Template!`, 'success');
                } else {
                    showMessage(res.msg || `Template "${tmpl.name}" submitted to Meta. Review status: ${res.meta_status || 'PENDING'}`, 'info');
                }
                loadInvoiceTemplates();
            } else {
                showMessage(res?.msg || `Failed to publish template "${tmpl.name}"`, 'error');
                loadInvoiceTemplates();
            }
        } catch (err) {
            showMessage(err?.response?.data?.msg || err.message || 'Error publishing template to Meta', 'error');
            loadInvoiceTemplates();
        } finally {
            setPublishingTemplateId(null);
        }
    };

    // Update WhatsApp Invoice Template Status (Dropdown)
    const handleUpdateInvoiceTemplateStatus = async (tmpl, newStatus) => {
        try {
            const res = await axiosPost(`${updateWhatsAppTemplateStatusUrl}${tmpl.id}/status`, { status: newStatus }, token);
            if (res?.status) {
                if (newStatus === 'APPROVED') {
                    showMessage(`🎉 Template "${tmpl.name}" set to VERIFIED and automatically set as Default Invoice Template!`, 'success');
                } else {
                    showMessage(`Template status updated to ${newStatus === 'APPROVED' ? 'VERIFIED (APPROVED)' : newStatus}!`, 'success');
                }
                loadInvoiceTemplates();
            } else {
                showMessage(res?.msg || 'Failed to update status', 'error');
            }
        } catch (err) {
            showMessage(err?.response?.data?.msg || err.message, 'error');
        }
    };

    // Set Default WhatsApp Invoice Template
    const handleSetDefaultInvoiceTemplate = async (tmpl) => {
        try {
            const res = await axiosPut(`${updateWhatsAppInvoiceTemplateUrl}${tmpl.id}`, {
                ...tmpl,
                is_default: 1
            }, token);
            if (res?.status) {
                showMessage(`🌟 "${tmpl.name}" set as default template for WhatsApp invoice deliveries!`, 'success');
                loadInvoiceTemplates();
            } else {
                showMessage(res?.msg || 'Failed to set default template.', 'error');
            }
        } catch (err) {
            showMessage(err?.response?.data?.msg || err.message || 'Error updating default template.', 'error');
        }
    };

    const handleInsertPlaceholder = (placeholderVal) => {
        setInvoiceTemplateForm(prev => ({
            ...prev,
            template_text: (prev.template_text ? prev.template_text + ' ' : '') + placeholderVal
        }));
    };

    // Render sample live WhatsApp text
    const getRenderedSampleText = (rawText) => {
        if (!rawText) return '';
        let t = rawText;
        const map = {
            '[Name]': sampleInvoice.customer_name,
            '{{name}}': sampleInvoice.customer_name,
            '{{customer_name}}': sampleInvoice.customer_name,
            '{{customer_phone}}': sampleInvoice.customer_phone,
            '[No]': sampleInvoice.invoice_no,
            '{{no}}': sampleInvoice.invoice_no,
            '{{invoice_no}}': sampleInvoice.invoice_no,
            '[Booking Date]': sampleInvoice.invoice_date,
            '{{booking_date}}': sampleInvoice.invoice_date,
            '{{invoice_date}}': sampleInvoice.invoice_date,
            '[Package Name]': sampleInvoice.package_name,
            '{{package_name}}': sampleInvoice.package_name,
            '[Member]': `${sampleInvoice.number_of_pax} Persons (4 Adults, 1 Child)`,
            '{{member}}': `${sampleInvoice.number_of_pax} Persons (4 Adults, 1 Child)`,
            '{{pax}}': `${sampleInvoice.number_of_pax} Persons (4 Adults, 1 Child)`,
            '[Rooms]': sampleInvoice.room_required,
            '{{rooms}}': sampleInvoice.room_required,
            '[Travel Date]': sampleInvoice.departure_date_text,
            '{{travel_date}}': sampleInvoice.departure_date_text,
            '{{departure_date}}': sampleInvoice.departure_date_text,
            '[Type]': 'Standard Bengali Non-Veg Menu',
            '{{type}}': 'Standard Bengali Non-Veg Menu',
            '{{food}}': 'Standard Bengali Non-Veg Menu',
            '{{food_type}}': 'Standard Bengali Non-Veg Menu',
            '[Pickup]': sampleInvoice.pickup_drop,
            '{{pickup}}': sampleInvoice.pickup_drop,
            '{{pickup_drop}}': sampleInvoice.pickup_drop,
            '[Total Amount]': Number(sampleInvoice.subtotal).toLocaleString('en-IN'),
            '{{total_amount}}': Number(sampleInvoice.subtotal).toLocaleString('en-IN'),
            '[Discount]': '0',
            '{{discount}}': '0',
            '[Advance]': Number(sampleInvoice.advance_received).toLocaleString('en-IN'),
            '{{advance}}': Number(sampleInvoice.advance_received).toLocaleString('en-IN'),
            '{{advance_amount}}': Number(sampleInvoice.advance_received).toLocaleString('en-IN'),
            '[Due]': Number(sampleInvoice.total_due_amount).toLocaleString('en-IN'),
            '{{due}}': Number(sampleInvoice.total_due_amount).toLocaleString('en-IN'),
            '{{due_amount}}': Number(sampleInvoice.total_due_amount).toLocaleString('en-IN'),
            '{{advance_note}}': sampleInvoice.advance_note,
            '{{payment_link}}': sampleInvoice.razorpay_payment_url,
            '{{company_name}}': razorpayConfig.company_name || 'DELTA SAFARI',
            '{{tagline}}': razorpayConfig.tagline || 'WHERE EXPECTATIONS MEET REALITY',
            '{{website}}': razorpayConfig.website || 'sundarbandeltasafari.com',
            '{{contact_number}}': razorpayConfig.mobile_numbers || '+91 7029533240'
        };

        for (const [k, v] of Object.entries(map)) {
            t = t.split(k).join(v);
        }
        return t;
    };

    const previewTemplate = selectedInvoiceTemplateForPreview || invoiceTemplates.find(t => t.is_default === 1) || invoiceTemplates[0];
    const previewOtpTemplate = selectedOtpTemplateForPreview || templatesList.find(t => t.name === otpSettings.whatsapp_otp_template_name) || templatesList[0];

    return (
        <div className="container-xxl flex-grow-1 container-p-y pb-5" style={{ minHeight: '100vh', fontFamily: "'Public Sans', sans-serif" }}>
            <div className="row">
                <div className="col-12">
                    {/* Top Header */}
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-3">
                        <div>
                            <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                                <span className="p-2 rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', backgroundColor: '#25D366' }}>
                                    <i className="ri-whatsapp-line fs-5"></i>
                                </span>
                                <span>WhatsApp &amp; Razorpay Settings</span>
                            </h4>
                            <p className="text-muted small mb-0">
                                Centralized management for WhatsApp OTP verification, Meta templates, and automated Razorpay payment link invoices.
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <a 
                                href="https://business.facebook.com/wa/manage/message-templates/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-outline-secondary btn-sm bg-white d-flex align-items-center gap-1 shadow-xs rounded-pill px-3"
                            >
                                <i className="ri-external-link-line"></i> Meta Business Suite ↗
                            </a>
                            <a 
                                href="https://dashboard.razorpay.com/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-outline-primary btn-sm bg-white d-flex align-items-center gap-1 shadow-xs rounded-pill px-3"
                            >
                                <i className="ri-external-link-line"></i> Razorpay Dashboard ↗
                            </a>
                        </div>
                    </div>

                    {/* Meta Cloud API Status Bar (Credentials managed via backend .env) */}
                    <div className="card border-0 shadow-xs rounded-3 mb-4 overflow-hidden" style={{ borderLeft: '4px solid #25D366', backgroundColor: '#f3faf5' }}>
                        <div className="card-body p-3 p-md-3.5">
                            <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0 bg-success text-white" style={{ width: '42px', height: '42px', backgroundColor: '#25D366' }}>
                                        <i className="ri-shield-check-line fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <h6 className="mb-0 fw-bold text-dark">Meta WhatsApp Business Cloud API Integration</h6>
                                            <span className="badge bg-success text-white rounded-pill px-2.5 py-1 text-xs">
                                                <i className="ri-check-line me-1"></i> Connected via Backend .env
                                            </span>
                                        </div>
                                        <p className="mb-0 text-muted small mt-1" style={{ fontSize: '12.5px' }}>
                                            API credentials (Access Token, Phone ID, WABA ID) are securely loaded directly from backend environment variables.
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Webhook Info Badges */}
                                <div className="d-flex flex-wrap align-items-center gap-2">
                                    <div className="bg-white border rounded-pill px-3 py-1.5 small shadow-2xs d-flex align-items-center gap-2">
                                        <span className="text-muted text-xs">Phone ID:</span>
                                        <strong className="text-dark font-monospace text-xs">
                                            {envStatus?.masked_phone_id || 'Configured in .env'}
                                        </strong>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1.5 bg-white shadow-2xs d-flex align-items-center gap-1 text-xs"
                                        onClick={() => {
                                            const url = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3002/webhook/whatsapp` : 'https://sundarbandeltasafari.com/webhook/whatsapp';
                                            navigator.clipboard.writeText(url);
                                            showMessage('WhatsApp Webhook URL copied!', 'success');
                                        }}
                                        title="Copy Meta WhatsApp Webhook URL"
                                    >
                                        <i className="ri-file-copy-line text-success"></i> Copy Webhook URL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs Header */}
                    <div className="card border-0 shadow-xs rounded-4 mb-4 bg-white">
                        <div className="card-body p-2">
                            <ul className="nav nav-pills nav-fill gap-2" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button
                                        type="button"
                                        className={`nav-link rounded-3 py-2.5 px-3 fw-bold d-flex align-items-center justify-content-center gap-2 ${activeMainTab === 'otp' ? 'active shadow-sm text-white' : 'text-secondary bg-light'}`}
                                        style={activeMainTab === 'otp' ? { backgroundColor: '#25D366' } : {}}
                                        onClick={() => setActiveMainTab('otp')}
                                    >
                                        <i className="ri-shield-keyhole-line fs-5"></i>
                                        <span>WhatsApp OTP &amp; Verification</span>
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        type="button"
                                        className={`nav-link rounded-3 py-2.5 px-3 fw-bold d-flex align-items-center justify-content-center gap-2 ${activeMainTab === 'razorpay' ? 'active shadow-sm text-white' : 'text-secondary bg-light'}`}
                                        style={activeMainTab === 'razorpay' ? { backgroundColor: '#0066cc' } : {}}
                                        onClick={() => setActiveMainTab('razorpay')}
                                    >
                                        <i className="ri-bank-card-line fs-5"></i>
                                        <span>📱 WhatsApp &amp; Razorpay Automation</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingComponent />
                    ) : (
                        <>
                            {/* ======================================================== */}
                            {/* TAB 1: WHATSAPP OTP & AUTHENTICATION                     */}
                            {/* ======================================================== */}
                            {activeMainTab === 'otp' && (
                                <form onSubmit={handleSaveOtpSettings}>
                                    <div className="row g-4">
                                        {/* OTP Service Activation Switch */}
                                        <div className="col-12">
                                            <div className="p-3 bg-white rounded-3 border shadow-xs d-flex align-items-center justify-content-between">
                                                <div>
                                                    <strong className="d-block text-dark">Enable WhatsApp OTP Verification</strong>
                                                    <small className="text-muted">
                                                        When active, travelers providing their WhatsApp phone number during Registration, Login, or Password Reset receive their OTP code via official WhatsApp Cloud API.
                                                    </small>
                                                </div>
                                                <div className="form-check form-switch fs-4 mb-0">
                                                    <input 
                                                        className="form-check-input cursor-pointer" 
                                                        type="checkbox" 
                                                        id="whatsapp_otp_enabled" 
                                                        checked={Number(otpSettings.whatsapp_otp_enabled) === 1} 
                                                        onChange={(e) => setOtpSettings({ ...otpSettings, whatsapp_otp_enabled: e.target.checked ? 1 : 0 })} 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ======================================================== */}
                                        {/* WhatsApp OTP Template Manager & Interactive Preview     */}
                                        {/* ======================================================== */}
                                        <div className="col-12">
                                            <div className="row g-4">
                                                {/* Left Column: Template List with Bodies, Badges & Actions */}
                                                <div className="col-12 col-xl-7">
                                                    {/* Template List Card */}
                                                    <div className="card border shadow-xs rounded-4 bg-white mb-4">
                                                        <div className="card-header bg-white border-bottom py-3 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                                                            <div>
                                                                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-1.5">
                                                                    <i className="ri-shield-keyhole-line text-success fs-5"></i> 
                                                                    <span>WhatsApp OTP &amp; Authentication Templates</span>
                                                                </h6>
                                                                <small className="text-muted">Click any template to view its live customer chat preview</small>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 shadow-2xs fw-semibold px-2.5 py-1.5 rounded-pill text-xs"
                                                                    onClick={handleSyncAllMetaTemplates}
                                                                    disabled={syncingMetaStatus}
                                                                    title="Sync status of all templates from Meta Cloud API"
                                                                >
                                                                    <i className={`ri-refresh-line ${syncingMetaStatus ? 'ri-spin' : ''}`}></i>
                                                                    <span>{syncingMetaStatus ? 'Syncing...' : 'Sync Meta Status'}</span>
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 shadow-2xs fw-semibold px-2.5 py-1.5 rounded-pill text-xs"
                                                                    onClick={() => setCreateOtpModalOpen(true)}
                                                                >
                                                                    <i className="ri-add-line fs-6"></i>
                                                                    <span>+ Register Template</span>
                                                                </button>
                                                                <a 
                                                                    href="https://business.facebook.com/wa/manage/message-templates/" 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-2xs rounded-pill px-2.5 py-1.5 text-xs bg-white"
                                                                >
                                                                    <i className="ri-external-link-line"></i> Meta Manager ↗
                                                                </a>
                                                            </div>
                                                        </div>

                                                        <div className="card-body p-3 p-md-4">
                                                            {templatesList.length === 0 ? (
                                                                <div className="p-4 bg-light rounded-3 text-center border">
                                                                    <i className="ri-shield-keyhole-line fs-1 text-muted"></i>
                                                                    <p className="text-muted small my-2">No OTP templates found.</p>
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn btn-sm btn-success rounded-pill px-3"
                                                                        onClick={() => setCreateOtpModalOpen(true)}
                                                                    >
                                                                        Register Template
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="d-flex flex-column gap-3">
                                                                    {templatesList.map((tpl) => {
                                                                        const isSelected = (previewOtpTemplate?.id === tpl.id) || (!selectedOtpTemplateForPreview && tpl.name === otpSettings.whatsapp_otp_template_name);
                                                                        const isActive = (otpSettings.whatsapp_otp_template_name === tpl.name);
                                                                        const st = (tpl.meta_status || 'APPROVED').toUpperCase();

                                                                        return (
                                                                            <div 
                                                                                key={tpl.id}
                                                                                onClick={() => setSelectedOtpTemplateForPreview(tpl)}
                                                                                className={`p-3 rounded-3 border transition-all cursor-pointer ${isSelected ? 'border-success bg-white shadow-xs' : 'bg-light'}`}
                                                                                style={{ cursor: 'pointer' }}
                                                                            >
                                                                                {/* Header Row */}
                                                                                <div className="d-flex justify-content-between align-items-start gap-2 mb-2 flex-wrap">
                                                                                    <div>
                                                                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                                            <strong className="text-dark font-monospace fs-6">{tpl.name}</strong>
                                                                                            
                                                                                            {/* Category Badge */}
                                                                                            <span className={`badge rounded-pill px-2 py-0.5 text-2xs fw-semibold ${tpl.category === 'authentication' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-info-subtle text-info-emphasis border border-info-subtle'}`}>
                                                                                                {tpl.category === 'authentication' ? 'AUTHENTICATION' : 'UTILITY'}
                                                                                            </span>

                                                                                            {/* Meta Verification Status Badge */}
                                                                                            {st === 'APPROVED' || st === 'VERIFIED' ? (
                                                                                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 text-2xs fw-bold d-inline-flex align-items-center gap-1">
                                                                                                    <i className="ri-checkbox-circle-fill text-success"></i> VERIFIED (APPROVED)
                                                                                                </span>
                                                                                            ) : st === 'REJECTED' ? (
                                                                                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 text-2xs fw-bold d-inline-flex align-items-center gap-1">
                                                                                                    <i className="ri-close-circle-fill text-danger"></i> REJECTED
                                                                                                </span>
                                                                                            ) : st === 'PENDING' ? (
                                                                                                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-1 text-2xs fw-bold d-inline-flex align-items-center gap-1">
                                                                                                    <i className="ri-time-line text-warning"></i> PENDING REVIEW
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="badge bg-secondary-subtle text-secondary border rounded-pill px-2.5 py-1 text-2xs fw-medium d-inline-flex align-items-center gap-1">
                                                                                                    <i className="ri-draft-line"></i> LOCAL DRAFT
                                                                                                </span>
                                                                                            )}

                                                                                            {/* Active OTP Badge */}
                                                                                            {isActive && (
                                                                                                <span className="badge bg-success text-white rounded-pill px-2.5 py-1 text-2xs fw-bold">
                                                                                                    🌟 Active OTP Template
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <small className="text-muted d-block mt-1">
                                                                                            {tpl.title || tpl.name} &bull; Language: <code>{tpl.language || 'en_US'}</code> &bull; Format: <code>{tpl.template_type || 'authentication'}</code>
                                                                                        </small>
                                                                                    </div>

                                                                                    {/* Action Buttons Top Right */}
                                                                                    <div className="d-flex align-items-center gap-1">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => { e.stopPropagation(); handleOpenEditOtpTemplate(tpl); }}
                                                                                            className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-0.5 text-xs"
                                                                                            title="Edit template body and details"
                                                                                        >
                                                                                            <i className="ri-edit-line"></i> Edit
                                                                                        </button>
                                                                                        {tpl.is_default !== 1 && !['otp_verification', 'deltasafari_otp', 'deltasafari_register_otp', 'forgot_password'].includes(tpl.name) && (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteOtpTemplate(tpl.id, tpl.name); }}
                                                                                                className="btn btn-xs btn-outline-danger rounded-pill px-2 py-0.5 text-xs"
                                                                                                title="Delete template"
                                                                                            >
                                                                                                <i className="ri-delete-bin-line"></i>
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Template Body Text Display */}
                                                                                <div className="p-2 bg-white rounded-2 border small font-monospace text-dark mb-2" style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.45', backgroundColor: '#fafafa' }}>
                                                                                    {tpl.template_text || '{{1}} is your verification code.'}
                                                                                </div>

                                                                                {/* Bottom Action Toolbar */}
                                                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-1 border-top">
                                                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                                        {/* Set as Active Button */}
                                                                                        {isActive ? (
                                                                                            <span className="badge bg-success text-white px-2.5 py-1 text-xs rounded-pill">
                                                                                                <i className="ri-check-line me-1"></i> Active for OTPs
                                                                                            </span>
                                                                                        ) : (
                                                                                            <button 
                                                                                                type="button" 
                                                                                                className="btn btn-xs btn-outline-success rounded-pill px-2.5 py-1 text-xs fw-semibold"
                                                                                                onClick={(e) => { e.stopPropagation(); handleSelectActiveTemplate(tpl); }}
                                                                                            >
                                                                                                <i className="ri-check-line me-1"></i> Set as Active
                                                                                            </button>
                                                                                        )}

                                                                                        {/* Publish to Meta Button */}
                                                                                        <button
                                                                                            type="button"
                                                                                            className="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1 text-xs d-inline-flex align-items-center gap-1"
                                                                                            disabled={publishingTemplateId === tpl.id}
                                                                                            onClick={(e) => { e.stopPropagation(); handlePublishTemplate(tpl); }}
                                                                                            title="Publish or re-verify this template on Meta Cloud API"
                                                                                        >
                                                                                            {publishingTemplateId === tpl.id ? (
                                                                                                <>
                                                                                                    <span className="spinner-border spinner-border-sm" role="status" style={{ width: '10px', height: '10px' }}></span>
                                                                                                    <span>Publishing...</span>
                                                                                                </>
                                                                                            ) : (
                                                                                                <>
                                                                                                    <i className="ri-upload-cloud-line text-primary"></i>
                                                                                                    <span>Publish to Meta</span>
                                                                                                </>
                                                                                            )}
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Status Dropdown */}
                                                                                    <div className="d-flex align-items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                                                        <label className="text-muted text-2xs fw-semibold mb-0" style={{ whiteSpace: 'nowrap' }}>Status:</label>
                                                                                        <select 
                                                                                            className={`form-select form-select-xs rounded-pill px-2.5 py-1 text-2xs fw-bold border ${
                                                                                                st === 'APPROVED' || st === 'VERIFIED' 
                                                                                                    ? 'bg-success-subtle text-success border-success-subtle' 
                                                                                                    : st === 'REJECTED' 
                                                                                                    ? 'bg-danger-subtle text-danger border-danger-subtle' 
                                                                                                    : st === 'PENDING' 
                                                                                                    ? 'bg-warning-subtle text-warning-emphasis border-warning-subtle' 
                                                                                                    : 'bg-light text-secondary border-secondary-subtle'
                                                                                            }`}
                                                                                            style={{ width: 'auto', minWidth: '140px', cursor: 'pointer', fontSize: '11.5px' }}
                                                                                            value={st === 'VERIFIED' ? 'APPROVED' : st}
                                                                                            onChange={(e) => handleUpdateTemplateStatus(tpl, e.target.value)}
                                                                                            title="Select verification review status"
                                                                                        >
                                                                                            <option value="APPROVED" className="text-success fw-bold">✓ Verified (Approved)</option>
                                                                                            <option value="REJECTED" className="text-danger fw-bold">✗ Rejected</option>
                                                                                            <option value="PENDING" className="text-warning-emphasis fw-bold">⏱ Pending Review</option>
                                                                                            <option value="LOCAL" className="text-secondary fw-normal">⚪ Local Draft</option>
                                                                                        </select>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Active OTP Template Configuration Card */}
                                                    <div className="card border shadow-xs rounded-4 bg-white">
                                                        <div className="card-header bg-white border-bottom py-3">
                                                            <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-1.5">
                                                                <i className="ri-settings-4-line text-success fs-5"></i> 
                                                                <span>Active OTP Template &amp; Delivery Settings</span>
                                                            </h6>
                                                            <small className="text-muted">Configure active template name, validity duration, and session fallback message</small>
                                                        </div>

                                                        <div className="card-body p-3 p-md-4">
                                                            <div className="row g-3">
                                                                {/* Active Meta Template Name */}
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-semibold text-dark small d-flex align-items-center gap-1.5">
                                                                        <i className="ri-shield-keyhole-line text-success"></i>
                                                                        <span>Active Meta Template Identifier Name</span>
                                                                        <span className="text-danger">*</span>
                                                                    </label>
                                                                    <input 
                                                                        type="text" 
                                                                        className="form-control font-monospace form-control-sm" 
                                                                        name="whatsapp_otp_template_name" 
                                                                        value={otpSettings.whatsapp_otp_template_name || ''} 
                                                                        onChange={(e) => setOtpSettings({ 
                                                                            ...otpSettings, 
                                                                            whatsapp_otp_template_name: e.target.value,
                                                                            whatsapp_forgot_template_name: e.target.value
                                                                        })} 
                                                                        placeholder="e.g. otp_verification" 
                                                                        required
                                                                    />
                                                                    <small className="text-muted text-xs d-block mt-1">
                                                                        Dispatched for Registration, Login, and Forgot Password verification.
                                                                    </small>
                                                                </div>

                                                                {/* Template Language Code */}
                                                                <div className="col-md-3">
                                                                    <label className="form-label fw-semibold text-dark small">
                                                                        Template Language Code <span className="text-danger">*</span>
                                                                    </label>
                                                                    <select 
                                                                        className="form-select form-select-sm" 
                                                                        value={otpSettings.whatsapp_otp_template_language || 'en_US'}
                                                                        onChange={(e) => setOtpSettings({ 
                                                                            ...otpSettings, 
                                                                            whatsapp_otp_template_language: e.target.value,
                                                                            whatsapp_forgot_template_language: e.target.value 
                                                                        })}
                                                                    >
                                                                        <option value="en_US">en_US - English (United States)</option>
                                                                        <option value="en">en - English</option>
                                                                        <option value="en_GB">en_GB - English (United Kingdom)</option>
                                                                        <option value="hi">hi - Hindi</option>
                                                                        <option value="bn">bn - Bengali</option>
                                                                    </select>
                                                                    <small className="text-muted text-xs d-block mt-1">
                                                                        Configured in Meta (default: <code>en_US</code>).
                                                                    </small>
                                                                </div>

                                                                {/* Validity Duration */}
                                                                <div className="col-md-3">
                                                                    <label className="form-label fw-semibold text-dark small">OTP Validity Duration (Minutes)</label>
                                                                    <input 
                                                                        type="number" 
                                                                        className="form-control form-control-sm" 
                                                                        name="whatsapp_otp_expiry_minutes" 
                                                                        min="1" 
                                                                        max="60" 
                                                                        value={otpSettings.whatsapp_otp_expiry_minutes || 10} 
                                                                        onChange={(e) => setOtpSettings({ ...otpSettings, whatsapp_otp_expiry_minutes: e.target.value })} 
                                                                    />
                                                                    <small className="text-muted text-xs d-block mt-1">Recommended 5 to 15 mins.</small>
                                                                </div>

                                                                {/* Template Type / Component Structure */}
                                                                <div className="col-12">
                                                                    <label className="form-label fw-semibold text-dark small mb-2">
                                                                        Template Structure Format
                                                                    </label>
                                                                    <div className="row g-3">
                                                                        <div className="col-md-4">
                                                                            <div 
                                                                                className={`card h-100 p-3 border cursor-pointer ${otpSettings.whatsapp_otp_template_type === 'authentication' ? 'border-success bg-success-subtle shadow-xs' : 'border-light-subtle bg-white'}`}
                                                                                style={{ cursor: 'pointer' }}
                                                                                onClick={() => setOtpSettings({ 
                                                                                    ...otpSettings, 
                                                                                    whatsapp_otp_template_type: 'authentication',
                                                                                    whatsapp_forgot_template_type: 'authentication'
                                                                                })}
                                                                            >
                                                                                <div className="d-flex align-items-center gap-2 mb-1.5">
                                                                                    <input 
                                                                                        type="radio" 
                                                                                        name="whatsapp_otp_template_type" 
                                                                                        checked={otpSettings.whatsapp_otp_template_type === 'authentication'} 
                                                                                        onChange={() => {}} 
                                                                                        className="form-check-input mt-0"
                                                                                    />
                                                                                    <strong className="text-dark small">Authentication (Recommended)</strong>
                                                                                </div>
                                                                                <p className="text-muted text-xs mb-0">
                                                                                    Official Meta OTP standard with 1-click &quot;Copy Code&quot; button.
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-md-4">
                                                                            <div 
                                                                                className={`card h-100 p-3 border cursor-pointer ${otpSettings.whatsapp_otp_template_type === 'utility_1var' ? 'border-success bg-success-subtle shadow-xs' : 'border-light-subtle bg-white'}`}
                                                                                style={{ cursor: 'pointer' }}
                                                                                onClick={() => setOtpSettings({ 
                                                                                    ...otpSettings, 
                                                                                    whatsapp_otp_template_type: 'utility_1var',
                                                                                    whatsapp_forgot_template_type: 'utility_1var'
                                                                                })}
                                                                            >
                                                                                <div className="d-flex align-items-center gap-2 mb-1.5">
                                                                                    <input 
                                                                                        type="radio" 
                                                                                        name="whatsapp_otp_template_type" 
                                                                                        checked={otpSettings.whatsapp_otp_template_type === 'utility_1var'} 
                                                                                        onChange={() => {}} 
                                                                                        className="form-check-input mt-0"
                                                                                    />
                                                                                    <strong className="text-dark small">Utility (1 Variable)</strong>
                                                                                </div>
                                                                                <p className="text-muted text-xs mb-0">
                                                                                    Single parameter <code>&#123;&#123;1&#125;&#125;</code> for OTP code in message body.
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-md-4">
                                                                            <div 
                                                                                className={`card h-100 p-3 border cursor-pointer ${otpSettings.whatsapp_otp_template_type === 'utility_2var' ? 'border-success bg-success-subtle shadow-xs' : 'border-light-subtle bg-white'}`}
                                                                                style={{ cursor: 'pointer' }}
                                                                                onClick={() => setOtpSettings({ 
                                                                                    ...otpSettings, 
                                                                                    whatsapp_otp_template_type: 'utility_2var',
                                                                                    whatsapp_forgot_template_type: 'utility_2var'
                                                                                })}
                                                                            >
                                                                                <div className="d-flex align-items-center gap-2 mb-1.5">
                                                                                    <input 
                                                                                        type="radio" 
                                                                                        name="whatsapp_otp_template_type" 
                                                                                        checked={otpSettings.whatsapp_otp_template_type === 'utility_2var'} 
                                                                                        onChange={() => {}} 
                                                                                        className="form-check-input mt-0"
                                                                                    />
                                                                                    <strong className="text-dark small">Utility (2 Variables)</strong>
                                                                                </div>
                                                                                <p className="text-muted text-xs mb-0">
                                                                                    <code>&#123;&#123;1&#125;&#125;</code> for Traveler Name and <code>&#123;&#123;2&#125;&#125;</code> for OTP code.
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Custom Text Format */}
                                                                <div className="col-12">
                                                                    <label className="form-label fw-semibold text-dark small">Custom Text Message Format (Session Mode)</label>
                                                                    <textarea 
                                                                        className="form-control font-monospace form-control-sm" 
                                                                        rows="2" 
                                                                        value={otpSettings.whatsapp_otp_custom_text || ''} 
                                                                        onChange={(e) => setOtpSettings({ 
                                                                            ...otpSettings, 
                                                                            whatsapp_otp_custom_text: e.target.value,
                                                                            whatsapp_forgot_custom_text: e.target.value
                                                                        })} 
                                                                        placeholder="Hello {{name}}, your verification code is {{otp}}. Valid for {{expiry}} mins."
                                                                    ></textarea>
                                                                    <small className="text-muted text-xs d-block mt-1">
                                                                        Fallback message used when sending freeform session OTPs. Tags: <code>&#123;&#123;otp&#125;&#125;</code>, <code>&#123;&#123;name&#125;&#125;</code>, <code>&#123;&#123;expiry&#125;&#125;</code>.
                                                                    </small>
                                                                </div>

                                                                <div className="col-12 text-end pt-2">
                                                                    <button 
                                                                        type="submit" 
                                                                        className="btn btn-primary px-4 py-2 rounded-pill shadow-xs fw-semibold"
                                                                        disabled={savingOtp}
                                                                        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                                                                    >
                                                                        {savingOtp ? (
                                                                            <>
                                                                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                                                                <span>Saving Settings...</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <i className="ri-save-line me-1"></i>
                                                                                <span>Save OTP Settings</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: Dynamic Live WhatsApp OTP Chat Preview */}
                                                <div className="col-12 col-xl-5">
                                                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top" style={{ top: '85px' }}>
                                                        <div className="card-header text-white py-3 px-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#075E54' }}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="rounded-circle bg-white text-success d-flex align-items-center justify-content-center fw-bold" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                                                                    DS
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-0 fw-bold text-white small">Delta Safari Official WhatsApp</h6>
                                                                    <small className="text-white-50 text-xs">Customer OTP Live Preview</small>
                                                                </div>
                                                            </div>
                                                            <span className="badge bg-white text-success rounded-pill px-2.5 py-1 text-xs fw-semibold">
                                                                Interactive Preview
                                                            </span>
                                                        </div>

                                                        <div className="card-body p-3" style={{ backgroundColor: '#ECE5DD', minHeight: '440px', maxHeight: '680px', overflowY: 'auto' }}>
                                                            {/* WhatsApp Chat Bubble */}
                                                            <div className="p-3 bg-white rounded-3 shadow-xs mb-3 border-0" style={{ borderTopLeftRadius: '0px', maxWidth: '100%' }}>
                                                                <div className="text-dark small font-monospace" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '12.5px' }}>
                                                                    {getRenderedOtpPreviewText(previewOtpTemplate?.template_text, previewOtpTemplate?.template_type)}
                                                                </div>
                                                                <div className="text-end mt-2">
                                                                    <small className="text-muted text-xs">
                                                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                                                                    </small>
                                                                </div>
                                                            </div>

                                                            {/* Copy Code Button for Authentication templates */}
                                                            {(previewOtpTemplate?.template_type === 'authentication' || previewOtpTemplate?.category === 'authentication') && (
                                                                <div className="p-2 bg-white rounded-3 shadow-xs border text-center mb-2">
                                                                    <div className="fw-bold text-primary small d-flex align-items-center justify-content-center gap-1.5">
                                                                        <i className="ri-file-copy-line text-success fs-5"></i>
                                                                        <span>Copy Code (1-Click Meta Button)</span>
                                                                    </div>
                                                                    <small className="text-muted d-block text-xs mt-0.5">
                                                                        Official Meta authentication button with instant one-tap copy.
                                                                    </small>
                                                                </div>
                                                            )}

                                                            {/* Preview Info Pill Card */}
                                                            <div className="p-3 bg-white rounded-3 shadow-xs border mt-3">
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <span className="text-xs fw-bold text-dark text-uppercase">Selected Template Details:</span>
                                                                    {previewOtpTemplate && (
                                                                        <span className={`badge rounded-pill px-2.5 py-1 text-2xs fw-bold ${previewOtpTemplate.meta_status === 'APPROVED' || previewOtpTemplate.meta_status === 'VERIFIED' ? 'bg-success-subtle text-success border border-success-subtle' : previewOtpTemplate.meta_status === 'REJECTED' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'}`}>
                                                                            {previewOtpTemplate.meta_status === 'APPROVED' ? 'VERIFIED (APPROVED)' : previewOtpTemplate.meta_status || 'LOCAL'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="small text-dark font-monospace text-xs mb-2">
                                                                    <div><strong>Meta Name:</strong> {previewOtpTemplate?.name || 'otp_verification'}</div>
                                                                    <div><strong>Category:</strong> {previewOtpTemplate?.category || 'authentication'}</div>
                                                                    <div><strong>Language:</strong> {previewOtpTemplate?.language || 'en_US'}</div>
                                                                    <div><strong>Type:</strong> {previewOtpTemplate?.template_type || 'authentication'}</div>
                                                                </div>
                                                                {previewOtpTemplate && otpSettings.whatsapp_otp_template_name !== previewOtpTemplate.name ? (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-success w-100 rounded-pill py-1.5 fw-semibold text-xs shadow-xs"
                                                                        onClick={() => handleSelectActiveTemplate(previewOtpTemplate)}
                                                                        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                                                                    >
                                                                        <i className="ri-check-line me-1"></i> Make Active OTP Template
                                                                    </button>
                                                                ) : (
                                                                    <div className="text-center text-success small fw-semibold py-1">
                                                                        <i className="ri-checkbox-circle-fill me-1"></i> Currently Active for All Dispatches
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ======================================================== */}
                                        {/* Card 3: Live Diagnostic & Test Tool                     */}
                                        {/* ======================================================== */}
                                        <div className="col-12">
                                            <div className="card border shadow-xs rounded-3 bg-white">
                                                <div className="card-header bg-white border-bottom py-3 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                                                    <div>
                                                        <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-1.5">
                                                            <i className="ri-flask-line text-warning fs-5"></i> 
                                                            <span>Live WhatsApp OTP Diagnostic &amp; Test Tool</span>
                                                        </h6>
                                                        <small className="text-muted">Send a live test verification code to your phone to confirm Meta delivery for your active template</small>
                                                    </div>
                                                    <span className="badge bg-light text-dark border px-2.5 py-1 text-xs">
                                                        Live Diagnostic
                                                    </span>
                                                </div>
                                                <div className="card-body p-3 p-md-4">
                                                    <div className="row g-3 align-items-end">
                                                        <div className="col-md-5">
                                                            <label className="form-label fw-semibold text-dark small mb-1">
                                                                Recipient WhatsApp Phone Number <span className="text-danger">*</span>
                                                            </label>
                                                            <div className="input-group input-group-sm">
                                                                <span className="input-group-text bg-light fw-semibold text-muted">+91</span>
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control font-monospace" 
                                                                    placeholder="9876543210" 
                                                                    value={testPhoneNumber} 
                                                                    onChange={(e) => setTestPhoneNumber(e.target.value)} 
                                                                    maxLength={10} 
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label fw-semibold text-dark small mb-1">
                                                                Recipient Name (Optional)
                                                            </label>
                                                            <input 
                                                                type="text" 
                                                                className="form-control form-control-sm" 
                                                                placeholder="Sandip Halder" 
                                                                value={testRecipientName} 
                                                                onChange={(e) => setTestRecipientName(e.target.value)} 
                                                            />
                                                        </div>
                                                        <div className="col-md-3">
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-sm btn-dark w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-1.5 shadow-xs" 
                                                                onClick={handleSendTestOtp} 
                                                                disabled={testingOtp}
                                                            >
                                                                {testingOtp ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                                                        <span>Dispatching...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="ri-send-plane-fill"></i>
                                                                        <span>Dispatch Test OTP</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Test Result Box */}
                                                    {testResult && (
                                                        <div className={`mt-3 p-3 rounded-3 border ${testResult.status ? 'bg-success-subtle border-success-subtle text-success-emphasis' : 'bg-danger-subtle border-danger-subtle text-danger-emphasis'}`}>
                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                <i className={`fs-5 ${testResult.status ? 'ri-checkbox-circle-fill text-success' : 'ri-error-warning-fill text-danger'}`}></i>
                                                                <strong className={testResult.status ? 'text-success' : 'text-danger'}>
                                                                    {testResult.status ? 'Test OTP Dispatched Successfully' : 'Test OTP Dispatch Failed'}
                                                                </strong>
                                                            </div>
                                                            <p className="mb-1 small">{testResult.msg}</p>
                                                            {testResult.details && (
                                                                <div className="mt-2 p-2 bg-white rounded border small font-monospace text-dark text-xs">
                                                                    <div><strong>Generated OTP:</strong> {testResult.details.testOtp}</div>
                                                                    <div><strong>Recipient:</strong> {testResult.details.recipient}</div>
                                                                    <div><strong>Template Used:</strong> {testResult.details.templateName} ({testResult.details.languageCode}, {testResult.details.templateType})</div>
                                                                    {testResult.details.messageId && <div><strong>Meta Message ID:</strong> {testResult.details.messageId}</div>}
                                                                    {testResult.details.errorCode && <div className="text-danger"><strong>Meta Error Code:</strong> {testResult.details.errorCode}</div>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* ======================================================== */}
                            {/* TAB 2: WHATSAPP & RAZORPAY AUTOMATION                    */}
                            {/* ======================================================== */}
                            {activeMainTab === 'razorpay' && (
                                <div className="row g-4">
                                    {/* Left Column: Razorpay Keys & WhatsApp Template Manager */}
                                    <div className="col-12 col-xl-7">
                                        <form onSubmit={handleSaveRazorpayConfig}>
                                            {/* Razorpay API Keys Card */}
                                            <div className="card border shadow-xs rounded-4 mb-4 bg-white">
                                                <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                                                    <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                                                        <i className="ri ri-bank-card-fill text-primary fs-5"></i>
                                                        <span>Razorpay Integration Keys (Payment Links &amp; Webhook)</span>
                                                    </h6>
                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 text-xs">
                                                        Live &amp; Test Supported
                                                    </span>
                                                </div>
                                                <div className="card-body p-3 p-md-4">
                                                    <div className="row g-3">
                                                        {/* Key ID */}
                                                        <div className="col-12 col-md-6">
                                                            <label className="form-label small fw-semibold text-dark">Razorpay Key ID <span className="text-danger">*</span></label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm rounded-3 font-monospace"
                                                                placeholder="rzp_live_xxxxxxxx or rzp_test_xxxx"
                                                                value={razorpayConfig.razorpay_key_id || ''}
                                                                onChange={(e) => setRazorpayConfig({ ...razorpayConfig, razorpay_key_id: e.target.value })}
                                                            />
                                                            <small className="text-muted text-xs d-block mt-1">Found in Razorpay Dashboard &rarr; Settings &rarr; API Keys.</small>
                                                        </div>

                                                        {/* Key Secret */}
                                                        <div className="col-12 col-md-6">
                                                            <label className="form-label small fw-semibold text-dark d-flex align-items-center justify-content-between">
                                                                <span>Razorpay Key Secret <span className="text-danger">*</span></span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link btn-xs p-0 text-muted text-decoration-none"
                                                                    onClick={() => setShowKeySecret(!showKeySecret)}
                                                                >
                                                                    <i className={showKeySecret ? "ri-eye-off-line" : "ri-eye-line"}></i>
                                                                    <span className="ms-1">{showKeySecret ? 'Hide' : 'Show'}</span>
                                                                </button>
                                                            </label>
                                                            <input
                                                                type={showKeySecret ? "text" : "password"}
                                                                className="form-control form-control-sm rounded-3 font-monospace"
                                                                placeholder="••••••••••••••••"
                                                                value={razorpayConfig.razorpay_key_secret || ''}
                                                                onChange={(e) => setRazorpayConfig({ ...razorpayConfig, razorpay_key_secret: e.target.value })}
                                                            />
                                                        </div>

                                                        {/* Webhook Secret */}
                                                        <div className="col-12">
                                                            <label className="form-label small fw-semibold text-dark">Razorpay Webhook Secret</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm rounded-3 font-monospace"
                                                                placeholder="R2aj8d4H3KwkKjkNO12FQ7B2"
                                                                value={razorpayConfig.razorpay_webhook_secret || ''}
                                                                onChange={(e) => setRazorpayConfig({ ...razorpayConfig, razorpay_webhook_secret: e.target.value })}
                                                            />
                                                            <small className="text-muted text-xs d-block mt-1">Shared secret configured for the Razorpay Webhook endpoint.</small>
                                                        </div>
                                                    </div>

                                                    {/* Auto-Delivery Switch */}
                                                    <div className="mt-3.5 p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between">
                                                        <div>
                                                            <strong className="d-block text-dark small">Automatic WhatsApp Invoice &amp; Payment Link Delivery</strong>
                                                            <small className="text-muted text-xs">
                                                                Automatically delivers the official booking summary &amp; dynamic Razorpay link to customer's WhatsApp upon invoice generation.
                                                            </small>
                                                        </div>
                                                        <div className="form-check form-switch fs-5 mb-0 ms-2">
                                                            <input
                                                                className="form-check-input cursor-pointer"
                                                                type="checkbox"
                                                                id="autoSendSwitch"
                                                                checked={Number(razorpayConfig.auto_send_whatsapp_invoice) === 1}
                                                                onChange={(e) => setRazorpayConfig({ ...razorpayConfig, auto_send_whatsapp_invoice: e.target.checked ? 1 : 0 })}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Instant Payment Webhook Guide */}
                                                    <div className="mt-3 p-3 bg-white rounded-3 border border-primary border-opacity-25">
                                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                                            <span className="fw-bold small text-primary d-flex align-items-center gap-1.5">
                                                                <i className="ri ri-webhook-line fs-6"></i>
                                                                <span>Instant Payment Confirmation Webhook Setup</span>
                                                            </span>
                                                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-0.5 text-xs">
                                                                Auto-Settle Active
                                                            </span>
                                                        </div>
                                                        <p className="text-muted text-xs mb-2">
                                                            When a traveler completes payment via the link sent on WhatsApp, Razorpay calls this Webhook to immediately mark the invoice <strong>Paid</strong>, update CRM records, and dispatch a WhatsApp receipt.
                                                        </p>

                                                        <div className="row g-2 align-items-center mb-2">
                                                            <div className="col-12 col-md-7">
                                                                <label className="text-dark fw-semibold mb-1 text-xs">Webhook URL (Paste into Razorpay Dashboard):</label>
                                                                <div className="input-group input-group-sm">
                                                                    <input 
                                                                        type="text" 
                                                                        readOnly 
                                                                        className="form-control bg-light font-monospace text-primary fw-semibold text-xs"
                                                                        value={`${(typeof window !== 'undefined' ? window.location.origin : 'https://sundarbandeltasafari.com').replace(':3000', ':3002').replace(':3001', ':3002')}/webhook/razorpay`}
                                                                    />
                                                                    <button 
                                                                        className="btn btn-outline-primary"
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const url = `${window.location.origin.replace(':3000', ':3002').replace(':3001', ':3002')}/webhook/razorpay`;
                                                                            navigator.clipboard.writeText(url);
                                                                            showMessage('Webhook URL copied to clipboard!', 'success');
                                                                        }}
                                                                    >
                                                                        <i className="ri ri-file-copy-line"></i> Copy
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="col-12 col-md-5">
                                                                <label className="text-dark fw-semibold mb-1 text-xs">Secret:</label>
                                                                <div className="input-group input-group-sm">
                                                                    <input 
                                                                        type="text" 
                                                                        readOnly 
                                                                        className="form-control bg-light font-monospace text-xs"
                                                                        value={razorpayConfig.razorpay_webhook_secret || 'R2aj8d4H3KwkKjkNO12FQ7B2'}
                                                                    />
                                                                    <button 
                                                                        className="btn btn-outline-secondary"
                                                                        type="button"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(razorpayConfig.razorpay_webhook_secret || 'R2aj8d4H3KwkKjkNO12FQ7B2');
                                                                            showMessage('Webhook Secret copied!', 'success');
                                                                        }}
                                                                    >
                                                                        <i className="ri ri-file-copy-line"></i> Copy
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="d-flex align-items-center gap-2 pt-1 flex-wrap text-xs">
                                                            <span className="text-dark fw-bold">Active Events in Razorpay:</span>
                                                            <span className="badge bg-light text-dark border"><i className="ri ri-checkbox-circle-fill text-success me-1"></i>payment_link.paid</span>
                                                            <span className="badge bg-light text-dark border"><i className="ri ri-checkbox-circle-fill text-success me-1"></i>payment.captured</span>
                                                            <span className="badge bg-light text-dark border"><i className="ri ri-checkbox-circle-fill text-success me-1"></i>order.paid</span>
                                                        </div>
                                                    </div>

                                                    <div className="text-end mt-3">
                                                        <button
                                                            type="submit"
                                                            disabled={savingRazorpay}
                                                            className="btn btn-primary rounded-pill px-4 shadow-sm"
                                                            style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                                        >
                                                            {savingRazorpay ? 'Saving Keys...' : 'Save Razorpay Configuration'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>

                                        {/* Available WhatsApp Invoice Templates List */}
                                        <div className="card border shadow-xs rounded-4 bg-white">
                                            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                <div>
                                                    <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                                                        <i className="ri ri-message-3-line text-success fs-5"></i>
                                                        <span>WhatsApp Invoice &amp; Payment Link Message Templates</span>
                                                    </h6>
                                                    <small className="text-muted">Click any template to view its live customer chat preview</small>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleSyncAllMetaTemplates}
                                                        disabled={syncingMetaStatus}
                                                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-2xs d-inline-flex align-items-center gap-1.5 text-xs"
                                                        title="Sync verification review status with Meta Business Account"
                                                    >
                                                        <i className={`ri-refresh-line ${syncingMetaStatus ? 'ri-spin' : ''}`}></i>
                                                        <span>{syncingMetaStatus ? 'Syncing...' : 'Sync Meta Status'}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenCreateInvoiceTemplate}
                                                        className="btn btn-sm btn-success rounded-pill px-3 shadow-xs d-inline-flex align-items-center gap-1"
                                                        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                                                    >
                                                        <i className="ri ri-add-line"></i>
                                                        <span>+ Create Template</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="card-body p-3 p-md-4">
                                                {loadingInvoiceTemplates ? (
                                                    <div className="text-center py-4">
                                                        <span className="spinner-border spinner-border-sm text-primary"></span>
                                                        <span className="small text-muted ms-2">Loading templates...</span>
                                                    </div>
                                                ) : invoiceTemplates.length === 0 ? (
                                                    <div className="p-4 bg-light rounded-4 text-center border">
                                                        <i className="ri ri-chat-settings-line fs-1 text-muted"></i>
                                                        <p className="text-muted small my-2">No custom WhatsApp invoice templates found.</p>
                                                        <button
                                                            type="button"
                                                            onClick={handleOpenCreateInvoiceTemplate}
                                                            className="btn btn-sm btn-primary rounded-pill px-3"
                                                        >
                                                            Create Default Template
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-column gap-3">
                                                        {invoiceTemplates.map((tmpl) => {
                                                            const isDefault = Number(tmpl.is_default) === 1;
                                                            const st = (tmpl.meta_status || 'LOCAL').toUpperCase();
                                                            const isSelected = previewTemplate?.id === tmpl.id;

                                                            return (
                                                                <div
                                                                    key={tmpl.id}
                                                                    onClick={() => setSelectedInvoiceTemplateForPreview(tmpl)}
                                                                    className={`p-3 rounded-3 border transition-all cursor-pointer ${isSelected ? 'border-success bg-white shadow-sm ring-1 ring-success' : 'bg-light'}`}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    {/* Header Row */}
                                                                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2 flex-wrap">
                                                                        <div>
                                                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                                <strong className="text-dark fs-6">{tmpl.name}</strong>

                                                                                {/* Category Badge */}
                                                                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5 text-2xs fw-bold">
                                                                                    UTILITY
                                                                                </span>

                                                                                {/* Meta Verification Status Badge */}
                                                                                {st === 'APPROVED' || st === 'VERIFIED' ? (
                                                                                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 text-2xs fw-bold d-inline-flex align-items-center gap-1">
                                                                                        <i className="ri-checkbox-circle-fill text-success"></i> VERIFIED (APPROVED)
                                                                                    </span>
                                                                                ) : st === 'REJECTED' ? (
                                                                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 text-2xs fw-bold d-inline-flex align-items-center gap-1">
                                                                                        <i className="ri-close-circle-fill text-danger"></i> REJECTED
                                                                                    </span>
                                                                                ) : st === 'PENDING' ? (
                                                                                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-1 text-2xs fw-bold d-inline-flex align-items-center gap-1">
                                                                                        <i className="ri-time-line text-warning"></i> PENDING REVIEW
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="badge bg-secondary-subtle text-secondary border rounded-pill px-2.5 py-1 text-2xs fw-medium d-inline-flex align-items-center gap-1">
                                                                                        <i className="ri-draft-line"></i> LOCAL DRAFT
                                                                                    </span>
                                                                                )}

                                                                                {/* Default Template Badge */}
                                                                                {isDefault && (
                                                                                    <span className="badge bg-success text-white rounded-pill px-2.5 py-1 text-2xs fw-bold">
                                                                                        🌟 Default Template
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <small className="text-muted d-block mt-1">
                                                                                {tmpl.title || tmpl.category} &bull; Razorpay Link Automated Dynamic Template
                                                                            </small>
                                                                        </div>

                                                                        {/* Action Buttons Top Right */}
                                                                        <div className="d-flex align-items-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); handleOpenEditInvoiceTemplate(tmpl); }}
                                                                                className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-0.5 text-xs"
                                                                                title="Edit template body and settings"
                                                                            >
                                                                                <i className="ri-edit-line"></i> Edit
                                                                            </button>
                                                                            {invoiceTemplates.length > 1 && !isDefault && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteInvoiceTemplate(tmpl.id); }}
                                                                                    className="btn btn-xs btn-outline-danger rounded-pill px-2 py-0.5 text-xs"
                                                                                    title="Delete template"
                                                                                >
                                                                                    <i className="ri-delete-bin-line"></i>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Template Body Text Display */}
                                                                    <div className="p-2 bg-white rounded-2 border small font-monospace text-dark mb-2" style={{ whiteSpace: 'pre-wrap', fontSize: '11.5px', lineHeight: '1.45', maxHeight: '110px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
                                                                        {tmpl.template_text}
                                                                    </div>

                                                                    {/* Bottom Action Toolbar */}
                                                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-1 border-top">
                                                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                            {/* Set as Default Button */}
                                                                            {isDefault ? (
                                                                                <span className="badge bg-success text-white px-2.5 py-1 text-xs rounded-pill">
                                                                                    <i className="ri-check-line me-1"></i> Default for Invoices
                                                                                </span>
                                                                            ) : (
                                                                                <button 
                                                                                    type="button" 
                                                                                    className="btn btn-xs btn-outline-success rounded-pill px-2.5 py-1 text-xs fw-semibold"
                                                                                    onClick={(e) => { e.stopPropagation(); handleSetDefaultInvoiceTemplate(tmpl); }}
                                                                                >
                                                                                    <i className="ri-check-line me-1"></i> Set as Default
                                                                                </button>
                                                                            )}

                                                                            {/* Publish to Meta Button */}
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1 text-xs d-inline-flex align-items-center gap-1"
                                                                                disabled={publishingTemplateId === tmpl.id}
                                                                                onClick={(e) => { e.stopPropagation(); handlePublishInvoiceTemplate(tmpl); }}
                                                                                title="Publish or re-verify this invoice template on Meta Cloud API"
                                                                            >
                                                                                {publishingTemplateId === tmpl.id ? (
                                                                                    <>
                                                                                        <span className="spinner-border spinner-border-sm" role="status" style={{ width: '10px', height: '10px' }}></span>
                                                                                        <span>Publishing...</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <i className="ri-upload-cloud-line text-primary"></i>
                                                                                        <span>Publish to Meta</span>
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>

                                                                        {/* Status Dropdown */}
                                                                        <div className="d-flex align-items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                                            <label className="text-muted text-2xs fw-semibold mb-0" style={{ whiteSpace: 'nowrap' }}>Status:</label>
                                                                            <select 
                                                                                className={`form-select form-select-xs rounded-pill px-2.5 py-1 text-2xs fw-bold border ${
                                                                                    st === 'APPROVED' || st === 'VERIFIED' 
                                                                                        ? 'bg-success-subtle text-success border-success-subtle' 
                                                                                        : st === 'REJECTED' 
                                                                                        ? 'bg-danger-subtle text-danger border-danger-subtle' 
                                                                                        : st === 'PENDING' 
                                                                                        ? 'bg-warning-subtle text-warning-emphasis border-warning-subtle' 
                                                                                        : 'bg-light text-secondary border-secondary-subtle'
                                                                                }`}
                                                                                style={{ width: 'auto', minWidth: '140px', cursor: 'pointer', fontSize: '11.5px' }}
                                                                                value={st === 'VERIFIED' ? 'APPROVED' : st}
                                                                                onChange={(e) => handleUpdateInvoiceTemplateStatus(tmpl, e.target.value)}
                                                                                title="Select verification review status"
                                                                            >
                                                                                <option value="APPROVED" className="text-success fw-bold">✓ Verified (Approved)</option>
                                                                                <option value="REJECTED" className="text-danger fw-bold">✗ Rejected</option>
                                                                                <option value="PENDING" className="text-warning-emphasis fw-bold">⏱ Pending Review</option>
                                                                                <option value="LOCAL" className="text-secondary fw-normal">⚪ Local Draft</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Dynamic Live WhatsApp Message Preview */}
                                    <div className="col-12 col-xl-5">
                                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top" style={{ top: '85px' }}>
                                            <div className="card-header text-white py-3 px-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#075E54' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="rounded-circle bg-white text-success d-flex align-items-center justify-content-center fw-bold" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                                                        DS
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0 fw-bold text-white small">Delta Safari Official WhatsApp</h6>
                                                        <small className="text-white-50 text-xs">Customer Invoice Live Preview</small>
                                                    </div>
                                                </div>
                                                <span className="badge bg-white text-success rounded-pill px-2.5 py-1 text-xs fw-semibold">
                                                    Interactive Preview
                                                </span>
                                            </div>

                                            <div className="card-body p-3" style={{ backgroundColor: '#ECE5DD', minHeight: '460px', maxHeight: '680px', overflowY: 'auto' }}>
                                                {/* WhatsApp Chat Bubble */}
                                                <div className="p-3 bg-white rounded-3 shadow-xs mb-3 border-0" style={{ borderTopLeftRadius: '0px', maxWidth: '100%' }}>
                                                    <div className="text-dark small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '12.5px' }}>
                                                        {getRenderedSampleText(previewTemplate?.template_text || '')}
                                                    </div>
                                                    <div className="text-end mt-2">
                                                        <small className="text-muted text-xs">
                                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                                                        </small>
                                                    </div>
                                                </div>

                                                {/* Razorpay Action Button inside chat */}
                                                <div className="p-2 bg-white rounded-3 shadow-xs border text-center mb-2">
                                                    <div className="fw-bold text-primary small d-flex align-items-center justify-content-center gap-1.5">
                                                        <i className="ri ri-secure-payment-fill text-success fs-5"></i>
                                                        <span>Secure Razorpay Payment Gateway</span>
                                                    </div>
                                                    <small className="text-muted d-block text-xs mt-0.5">
                                                        Generated dynamically with 256-bit SSL encryption &amp; auto-reconciliation.
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="card-footer bg-white p-3 border-top d-flex justify-content-between align-items-center">
                                                <small className="text-muted text-xs">
                                                    Active: <strong>{previewTemplate?.name || 'Default Template'}</strong>
                                                </small>
                                                <button
                                                    type="button"
                                                    onClick={handleOpenCreateInvoiceTemplate}
                                                    className="btn btn-xs btn-outline-success rounded-pill px-3"
                                                >
                                                    + New Template
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ======================================================== */}
            {/* Modal: Create WhatsApp OTP Template                     */}
            {/* ======================================================== */}
            {createOtpModalOpen && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                            <div className="modal-header bg-light border-bottom py-3 px-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="p-2 rounded bg-success bg-opacity-10 text-success">
                                        <i className="ri-whatsapp-line fs-5"></i>
                                    </div>
                                    <div>
                                        <h5 className="modal-title fw-bold text-dark mb-0">Register New WhatsApp OTP Template</h5>
                                        <small className="text-muted">Save template locally and optionally submit to Meta Cloud API</small>
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setCreateOtpModalOpen(false)} disabled={creatingOtpTemplate}></button>
                            </div>
                            <form onSubmit={handleCreateOtpTemplate}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-dark small mb-1">
                                                Template Identifier Name <span className="text-danger">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control font-monospace form-control-sm" 
                                                placeholder="e.g. deltasafari_otp"
                                                value={newOtpTemplate.name}
                                                onChange={(e) => setNewOtpTemplate({ ...newOtpTemplate, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                                required
                                            />
                                            <small className="text-muted text-xs">Lowercase letters, numbers, and underscores only.</small>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-dark small mb-1">Display Title / Label</label>
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm" 
                                                placeholder="Customer Registration OTP"
                                                value={newOtpTemplate.title}
                                                onChange={(e) => setNewOtpTemplate({ ...newOtpTemplate, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-dark small mb-1">Category <span className="text-danger">*</span></label>
                                            <select 
                                                className="form-select form-select-sm"
                                                value={newOtpTemplate.category}
                                                onChange={(e) => setNewOtpTemplate({ ...newOtpTemplate, category: e.target.value })}
                                            >
                                                <option value="authentication">AUTHENTICATION (For OTP codes &amp; 1-click Copy Code button)</option>
                                                <option value="utility">UTILITY (Alerts, confirmations)</option>
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-dark small mb-1">Language <span className="text-danger">*</span></label>
                                            <select 
                                                className="form-select form-select-sm"
                                                value={newOtpTemplate.language}
                                                onChange={(e) => setNewOtpTemplate({ ...newOtpTemplate, language: e.target.value })}
                                            >
                                                <option value="en_US">English (US) - en_US</option>
                                                <option value="en">English - en</option>
                                                <option value="hi">Hindi - hi</option>
                                                <option value="bn">Bengali - bn</option>
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold text-dark small mb-1">Message Body Text <span className="text-danger">*</span></label>
                                            <textarea 
                                                className="form-control form-control-sm font-monospace" 
                                                rows="3" 
                                                value={newOtpTemplate.template_text}
                                                onChange={(e) => setNewOtpTemplate({ ...newOtpTemplate, template_text: e.target.value })}
                                                required
                                            />
                                            <small className="text-muted text-xs">Use <code>&#123;&#123;1&#125;&#125;</code> for OTP code placeholder.</small>
                                        </div>

                                        <div className="col-12">
                                            <div className="p-3 bg-light rounded-3 border">
                                                <div className="form-check form-switch mb-2">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        id="setAsActiveSwitch"
                                                        checked={newOtpTemplate.set_as_active}
                                                        onChange={(e) => setNewOtpTemplate({ ...newOtpTemplate, set_as_active: e.target.checked })}
                                                    />
                                                    <label className="form-check-label text-dark small fw-semibold" htmlFor="setAsActiveSwitch">
                                                        Set as active template immediately upon creation
                                                    </label>
                                                </div>
                                                <div className="form-check form-switch mb-0">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        id="submitToMetaSwitch"
                                                        checked={newOtpTemplate.submit_to_meta}
                                                        onChange={(e) => setNewOtpTemplate({ ...newOtpTemplate, submit_to_meta: e.target.checked })}
                                                    />
                                                    <label className="form-check-label text-dark small fw-semibold" htmlFor="submitToMetaSwitch">
                                                        Submit template directly to Meta WhatsApp Cloud API for automated review
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top py-2.5 px-4 d-flex justify-content-between">
                                    <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={() => setCreateOtpModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-sm btn-success px-4" 
                                        disabled={creatingOtpTemplate}
                                        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                                    >
                                        {creatingOtpTemplate ? 'Submitting...' : 'Save & Register Template'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* Modal: Edit WhatsApp OTP Template                       */}
            {/* ======================================================== */}
            {editOtpModalOpen && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                            <div className="modal-header bg-light border-bottom py-3 px-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="p-2 rounded bg-primary bg-opacity-10 text-primary">
                                        <i className="ri-edit-2-line fs-5"></i>
                                    </div>
                                    <div>
                                        <h5 className="modal-title fw-bold text-dark mb-0">Edit WhatsApp OTP Template</h5>
                                        <small className="text-muted font-monospace">{editOtpForm.name}</small>
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setEditOtpModalOpen(false)} disabled={savingEditOtp}></button>
                            </div>
                            <form onSubmit={handleSaveEditOtpTemplate}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-dark small mb-1">
                                                Template Identifier (Slug)
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control font-monospace form-control-sm bg-light" 
                                                value={editOtpForm.name || ''}
                                                disabled
                                            />
                                            <small className="text-muted text-xs">Registered name on Meta WhatsApp Cloud API.</small>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-dark small mb-1">Display Title / Label</label>
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm" 
                                                value={editOtpForm.title || ''}
                                                onChange={(e) => setEditOtpForm({ ...editOtpForm, title: e.target.value })}
                                                placeholder="e.g. Customer OTP Verification"
                                                required
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold text-dark small mb-1">Category <span className="text-danger">*</span></label>
                                            <select 
                                                className="form-select form-select-sm"
                                                value={editOtpForm.category || 'authentication'}
                                                onChange={(e) => setEditOtpForm({ ...editOtpForm, category: e.target.value })}
                                            >
                                                <option value="authentication">AUTHENTICATION (OTP &amp; 1-click Copy button)</option>
                                                <option value="utility">UTILITY (Alerts, notifications)</option>
                                                <option value="marketing">MARKETING (Promotional)</option>
                                            </select>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold text-dark small mb-1">Language <span className="text-danger">*</span></label>
                                            <select 
                                                className="form-select form-select-sm"
                                                value={editOtpForm.language || 'en_US'}
                                                onChange={(e) => setEditOtpForm({ ...editOtpForm, language: e.target.value })}
                                            >
                                                <option value="en_US">English (US) - en_US</option>
                                                <option value="en">English - en</option>
                                                <option value="hi">Hindi - hi</option>
                                                <option value="bn">Bengali - bn</option>
                                            </select>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold text-dark small mb-1">Meta Verification Status</label>
                                            <select 
                                                className="form-select form-select-sm fw-semibold"
                                                value={editOtpForm.meta_status || 'APPROVED'}
                                                onChange={(e) => setEditOtpForm({ ...editOtpForm, meta_status: e.target.value })}
                                            >
                                                <option value="APPROVED" className="text-success">APPROVED (Verified)</option>
                                                <option value="REJECTED" className="text-danger">REJECTED</option>
                                                <option value="PENDING" className="text-warning">PENDING REVIEW</option>
                                                <option value="LOCAL" className="text-muted">LOCAL DRAFT</option>
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <label className="form-label fw-semibold text-dark small mb-0">
                                                    Message Body Text <span className="text-danger">*</span>
                                                </label>
                                                <div className="d-flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditOtpForm({ ...editOtpForm, template_text: (editOtpForm.template_text || '') + ' {{1}}' })}
                                                        className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-0 text-xs"
                                                    >
                                                        + {'{{1}}'} (OTP)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditOtpForm({ ...editOtpForm, template_text: (editOtpForm.template_text || '') + ' {{2}}' })}
                                                        className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-0 text-xs"
                                                    >
                                                        + {'{{2}}'} (Name)
                                                    </button>
                                                </div>
                                            </div>
                                            <textarea 
                                                className="form-control form-control-sm font-monospace" 
                                                rows="5" 
                                                value={editOtpForm.template_text || ''}
                                                onChange={(e) => setEditOtpForm({ ...editOtpForm, template_text: e.target.value })}
                                                required
                                            />
                                            <small className="text-muted text-xs">
                                                Note: For <code>AUTHENTICATION</code> templates with a 1-click Copy Code button, Meta requires the body to contain the verification code parameter <code>&#123;&#123;1&#125;&#125;</code>.
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top py-2.5 px-4 d-flex justify-content-between">
                                    <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={() => setEditOtpModalOpen(false)} disabled={savingEditOtp}>
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-sm btn-primary px-4" 
                                        disabled={savingEditOtp}
                                    >
                                        {savingEditOtp ? 'Saving Changes...' : 'Update Template Body'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* Modal: Create / Edit WhatsApp Invoice Template          */}
            {/* ======================================================== */}
            {invoiceTemplateModalOpen && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header text-white py-3 px-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#075E54' }}>
                                <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-whatsapp-fill"></i>
                                    <span>{editingInvoiceTemplate ? 'Edit WhatsApp Invoice Template' : 'Create New WhatsApp Invoice Template'}</span>
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setInvoiceTemplateModalOpen(false)}></button>
                            </div>

                            <form onSubmit={handleSaveInvoiceTemplate}>
                                <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-5">
                                            <label className="form-label small fw-bold">Template Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="e.g. Official Invoice with Razorpay Payment Link"
                                                value={invoiceTemplateForm.name}
                                                onChange={(e) => setInvoiceTemplateForm({ ...invoiceTemplateForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold">Category / Title</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="e.g. Booking Confirmation"
                                                value={invoiceTemplateForm.title}
                                                onChange={(e) => setInvoiceTemplateForm({ ...invoiceTemplateForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12 col-md-3">
                                            <label className="form-label small fw-semibold">Meta Status</label>
                                            <select 
                                                className="form-select rounded-3 fw-semibold"
                                                value={invoiceTemplateForm.meta_status || 'LOCAL'}
                                                onChange={(e) => setInvoiceTemplateForm({ ...invoiceTemplateForm, meta_status: e.target.value })}
                                            >
                                                <option value="APPROVED" className="text-success">✓ Verified (Approved)</option>
                                                <option value="REJECTED" className="text-danger">✗ Rejected</option>
                                                <option value="PENDING" className="text-warning">⏱ Pending Review</option>
                                                <option value="LOCAL" className="text-muted">⚪ Local Draft</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Placeholders Toolbar */}
                                    <div className="mb-2 p-2 bg-light rounded-3 border">
                                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                                            <label className="form-label small fw-bold text-dark mb-0">
                                                <i className="ri ri-code-s-slash-line text-primary me-1"></i>
                                                Click Placeholders to Insert Dynamic Data:
                                            </label>
                                            <small className="text-muted text-xs">Replaces automatically with live booking details</small>
                                        </div>
                                        <div className="d-flex flex-wrap gap-1.5">
                                            {[
                                                { label: '{{name}}', val: '{{name}}' },
                                                { label: '{{no}}', val: '{{no}}' },
                                                { label: '{{booking_date}}', val: '{{booking_date}}' },
                                                { label: '{{package_name}}', val: '{{package_name}}' },
                                                { label: '{{travel_date}}', val: '{{travel_date}}' },
                                                { label: '{{member}}', val: '{{member}}' },
                                                { label: '{{rooms}}', val: '{{rooms}}' },
                                                { label: '{{type}} (Food)', val: '{{type}}' },
                                                { label: '{{pickup}}', val: '{{pickup}}' },
                                                { label: '{{total_amount}}', val: '{{total_amount}}' },
                                                { label: '{{discount}}', val: '{{discount}}' },
                                                { label: '{{advance}}', val: '{{advance}}' },
                                                { label: '{{due}}', val: '{{due}}' },
                                                { label: '💳 {{payment_link}}', val: '{{payment_link}}' },
                                                { label: '{{website}}', val: '{{website}}' },
                                                { label: '{{contact_number}}', val: '{{contact_number}}' }
                                            ].map((ph, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleInsertPlaceholder(ph.val)}
                                                    className="btn btn-xs btn-outline-primary bg-white rounded-pill px-2 py-0.5 shadow-2xs font-monospace text-xs"
                                                >
                                                    + {ph.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Template Textarea */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Message Content (WhatsApp Formatted) <span className="text-danger">*</span></label>
                                        <textarea
                                            className="form-control font-monospace rounded-3"
                                            rows="9"
                                            placeholder="Write your template text with *bold*, _italics_, and {{placeholders}}..."
                                            value={invoiceTemplateForm.template_text}
                                            onChange={(e) => setInvoiceTemplateForm({ ...invoiceTemplateForm, template_text: e.target.value })}
                                            required
                                            style={{ fontSize: '12.5px', lineHeight: '1.5' }}
                                        ></textarea>
                                        <small className="text-muted d-block mt-1 text-xs">
                                            Tip: Include <code>&#123;&#123;payment_link&#125;&#125;</code> so the traveler receives their Razorpay payment link.
                                        </small>
                                    </div>

                                    {/* Set As Default Checkbox */}
                                    <div className="form-check form-switch p-2 bg-light rounded-3 border">
                                        <input
                                            className="form-check-input ms-0 me-2"
                                            type="checkbox"
                                            id="templateDefaultSwitch"
                                            checked={Number(invoiceTemplateForm.is_default) === 1}
                                            onChange={(e) => setInvoiceTemplateForm({ ...invoiceTemplateForm, is_default: e.target.checked ? 1 : 0 })}
                                        />
                                        <label className="form-check-label small fw-bold text-dark" htmlFor="templateDefaultSwitch">
                                            Set as default WhatsApp template for automated invoice deliveries
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between">
                                    <button type="button" className="btn btn-outline-secondary rounded-pill px-3" onClick={() => setInvoiceTemplateModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingInvoiceTemplate}
                                        className="btn btn-success rounded-pill px-4 shadow-xs"
                                        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                                    >
                                        {savingInvoiceTemplate ? 'Saving Template...' : (editingInvoiceTemplate ? 'Update Template' : 'Create Template')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppSettingsPage;
