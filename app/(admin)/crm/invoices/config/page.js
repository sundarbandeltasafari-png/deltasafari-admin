'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
    getInvoiceConfigUrl,
    updateInvoiceConfigUrl,
    getWhatsAppInvoiceTemplatesUrl,
    createWhatsAppInvoiceTemplateUrl,
    updateWhatsAppInvoiceTemplateUrl,
    deleteWhatsAppInvoiceTemplateUrl
} from '@/app/routes/whatsappRoutes';
import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import InvoicePrintTemplate from '@/components/admin/invoice/InvoicePrintTemplate';

export default function InvoiceConfigPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('company'); // 'company', 'bank', 'terms', 'whatsapp'

    const [formData, setFormData] = useState({
        company_name: 'DELTA SAFARI',
        tagline: 'WHERE EXPECTATIONS MEET REALITY',
        logo_url: '',
        address: 'Canning, Herobhanga, South 24 Parganas- 743329',
        msme_reg: 'UDYAM-WB-18-0109198',
        trade_licence: '767',
        mobile_numbers: '+91 7029533240 & +91 6297603562',
        email: 'sundarban.deltasafari@gmail.com',
        website: 'sundarbandeltasafari.com',
        bank_name: 'STATE BANK OF INDIA',
        account_holder: 'SANDIP HALDER',
        account_number: '34193984830',
        ifsc_code: 'SBIN0011367',
        upi_id: '',
        default_gst_percent: 0,
        terms_conditions: '',
        invoice_prefix: 'INV-00',
        next_invoice_number: 30019,
        razorpay_key_id: 'rzp_test_RQWjJm9q5lEiA8',
        razorpay_key_secret: 'XwAWgPdeymk9XLHqndmSD27c',
        razorpay_webhook_secret: 'R2aj8d4H3KwkKjkNO12FQ7B2',
        auto_send_whatsapp_invoice: 1,
        default_whatsapp_template_id: null
    });

    // WhatsApp Templates state
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        title: '',
        category: 'invoice',
        template_text: '',
        is_default: 0
    });
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState(null);

    // Sample preview invoice object
    const sampleInvoice = {
        invoice_no: `${formData.invoice_prefix || 'INV-00'}${formData.next_invoice_number || 30018}`,
        invoice_date: new Date().toISOString().split('T')[0],
        customer_name: 'Kaushik Bhattacharjee',
        customer_address: 'West Bengal',
        customer_phone: '8777810327',
        pickup_drop: 'Canning',
        package_name: '2N 3D Sundarban Safari Special Package',
        number_of_pax: 5,
        room_required: '2 Rooms (1 AC, 1 Non-AC)',
        food_preference: 'Non Veg',
        departure_date_text: '26/09/2026 to 28/09/2026',
        items: [
            { sn: 1, description: '2N 3D Sundarban Hilsa Festival Special(5 Sharing)', rate: 2700, person: 5, amount: 13500 },
            { sn: 2, description: 'AC Charges', rate: 1000, person: '', amount: 1000 }
        ],
        subtotal: 14500,
        gst_percent: formData.default_gst_percent || 0,
        gst_amount: 0,
        discount_amount: 0,
        advance_note: '500/pax',
        advance_received: 2500,
        total_due_amount: 12000,
        razorpay_payment_url: 'https://rzp.io/i/samplePayDeltaSafari'
    };

    const fetchConfig = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosGet(getInvoiceConfigUrl, token);
            if (res?.status && res.data) {
                setFormData((prev) => ({
                    ...prev,
                    ...res.data
                }));
            }
        } catch (err) {
            console.error('Error fetching invoice config:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        if (!token) return;
        setLoadingTemplates(true);
        try {
            const res = await axiosGet(getWhatsAppInvoiceTemplatesUrl, token);
            if (res?.status && res.data) {
                setTemplates(res.data);
                const def = res.data.find(t => t.is_default === 1) || res.data[0];
                if (def && !selectedTemplateForPreview) {
                    setSelectedTemplateForPreview(def);
                }
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchConfig();
            fetchTemplates();
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axiosPost(updateInvoiceConfigUrl, formData, token);
            if (res?.status) {
                showMessage('success', '🎉 Invoice format and business settings saved successfully!');
            } else {
                showMessage('error', res?.msg || 'Failed to save configuration.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error saving invoice settings.');
        } finally {
            setSaving(false);
        }
    };

    // Open Template Creator Modal
    const handleOpenCreateTemplate = () => {
        setEditingTemplate(null);
        setTemplateForm({
            name: '',
            title: '',
            category: 'invoice',
            template_text: `Hello {{customer_name}},

🎉 Greetings from *DELTA SAFARI*! Your Sundarban safari booking has been generated.

Here are your official booking & invoice details:
📄 *Invoice No:* {{invoice_no}}
📦 *Package:* {{package_name}}
👥 *Total Members:* {{pax}}
🏨 *Accommodation:* {{rooms}}
📅 *Booking / Travel Date:* {{departure_date}}
📍 *Pickup & Drop:* {{pickup_drop}}

💰 *Total Package Cost:* ₹{{total_amount}}
💵 *Advance Received:* ₹{{advance_amount}}
💳 *Remaining Due Balance:* ₹{{due_amount}}

👇 *Pay Your Booking Amount Securely via Razorpay Payment Link:*
{{payment_link}}
_(Supports GooglePay, PhonePe, Paytm, UPI, Cards, NetBanking)_

Thank you for choosing *DELTA SAFARI*!

🌐 Website: {{website}}
📞 Support: {{contact_number}}`,
            is_default: templates.length === 0 ? 1 : 0
        });
        setTemplateModalOpen(true);
    };

    // Open Template Edit Modal
    const handleOpenEditTemplate = (tmpl) => {
        setEditingTemplate(tmpl);
        setTemplateForm({
            name: tmpl.name || '',
            title: tmpl.title || '',
            category: tmpl.category || 'invoice',
            template_text: tmpl.template_text || '',
            is_default: tmpl.is_default || 0
        });
        setTemplateModalOpen(true);
    };

    // Insert placeholder variable into template textarea
    const handleInsertPlaceholder = (placeholder) => {
        setTemplateForm(prev => ({
            ...prev,
            template_text: (prev.template_text || '') + placeholder
        }));
    };

    // Save Template (Create or Update)
    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        if (!templateForm.name.trim() || !templateForm.template_text.trim()) {
            showMessage('error', 'Please fill in the Template Name and Message Text.');
            return;
        }

        setSavingTemplate(true);
        try {
            let res;
            if (editingTemplate) {
                res = await axiosPut(`${updateWhatsAppInvoiceTemplateUrl}${editingTemplate.id}`, templateForm, token);
            } else {
                res = await axiosPost(createWhatsAppInvoiceTemplateUrl, templateForm, token);
            }

            if (res?.status) {
                showMessage('success', editingTemplate ? 'Template updated successfully!' : '🎉 New WhatsApp template created!');
                setTemplateModalOpen(false);
                fetchTemplates();
            } else {
                showMessage('error', res?.msg || 'Failed to save template.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error saving template.');
        } finally {
            setSavingTemplate(false);
        }
    };

    // Delete Template
    const handleDeleteTemplate = async (id) => {
        if (!confirm('Are you sure you want to delete this WhatsApp template?')) return;
        try {
            const res = await axiosDelete(`${deleteWhatsAppInvoiceTemplateUrl}${id}`, token);
            if (res?.status) {
                showMessage('success', 'Template removed successfully.');
                fetchTemplates();
            } else {
                showMessage('error', res?.msg || 'Failed to delete template.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error deleting template.');
        }
    };

    // Render sample live WhatsApp text
    const getRenderedSampleText = (rawText) => {
        if (!rawText) return '';
        let t = rawText;
        const map = {
            '{{customer_name}}': sampleInvoice.customer_name,
            '{{customer_phone}}': sampleInvoice.customer_phone,
            '{{invoice_no}}': sampleInvoice.invoice_no,
            '{{invoice_date}}': sampleInvoice.invoice_date,
            '{{package_name}}': sampleInvoice.package_name,
            '{{pax}}': `${sampleInvoice.number_of_pax} Persons (4 Adults, 1 Child)`,
            '{{rooms}}': sampleInvoice.room_required,
            '{{departure_date}}': sampleInvoice.departure_date_text,
            '{{booking_date}}': sampleInvoice.departure_date_text,
            '{{pickup_drop}}': sampleInvoice.pickup_drop,
            '{{total_amount}}': Number(sampleInvoice.subtotal).toLocaleString('en-IN'),
            '{{advance_amount}}': Number(sampleInvoice.advance_received).toLocaleString('en-IN'),
            '{{due_amount}}': Number(sampleInvoice.total_due_amount).toLocaleString('en-IN'),
            '{{advance_note}}': sampleInvoice.advance_note,
            '{{payment_link}}': sampleInvoice.razorpay_payment_url,
            '{{company_name}}': formData.company_name || 'DELTA SAFARI',
            '{{tagline}}': formData.tagline || 'WHERE EXPECTATIONS MEET REALITY',
            '{{website}}': formData.website || 'sundarbandeltasafari.com',
            '{{contact_number}}': formData.mobile_numbers || '+91 7029533240'
        };

        for (const [k, v] of Object.entries(map)) {
            t = t.split(k).join(v);
        }
        return t;
    };

    if (user && Number(user.admin) !== 1) {
        return (
            <div className="container-xxl flex-grow-1 container-p-y text-center py-5">
                <div className="card p-5 border-0 shadow-sm rounded-4 mx-auto bg-white" style={{ maxWidth: '500px' }}>
                    <div className="avatar avatar-xl rounded-circle bg-label-danger mx-auto mb-3 d-flex align-items-center justify-content-center">
                        <i className="ri ri-lock-2-fill fs-2 text-danger"></i>
                    </div>
                    <h4 className="fw-bold mb-2 text-dark">Access Restricted</h4>
                    <p className="text-muted small mb-4">
                        Invoice, Razorpay, and WhatsApp configuration is restricted to Super Administrators.
                    </p>
                    <Link href="/crm/invoices" className="btn btn-primary rounded-pill px-4">
                        Back to Invoices
                    </Link>
                </div>
            </div>
        );
    }

    const previewTemplate = selectedTemplateForPreview || templates.find(t => t.is_default === 1) || templates[0];

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header Banner */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-settings-4-fill text-primary fs-3"></i>
                        <span>Invoice Format, Razorpay &amp; WhatsApp Configuration</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Configure company branding, official bank account, Razorpay payment links, and customizable WhatsApp templates.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Link href="/crm/invoices/preview" target="_blank" className="btn btn-outline-info rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-xs">
                        <i className="ri ri-file-paper-2-line"></i>
                        <span>📄 View Dummy PDF</span>
                    </Link>
                    <Link href="/crm/invoices" className="btn btn-outline-primary rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-xs">
                        <i className="ri ri-file-list-3-line"></i>
                        <span>All Invoices</span>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="p-5 text-center bg-white rounded-4 shadow-sm">
                    <LoadingComponent />
                    <p className="text-muted small mt-2">Loading invoice &amp; WhatsApp settings...</p>
                </div>
            ) : (
                <div className="row g-4">
                    {/* Left Column: Form Tabs & Inputs */}
                    <div className="col-12 col-xl-7">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            {/* Card Tab Header */}
                            <div className="card-header bg-light border-bottom p-2">
                                <ul className="nav nav-pills gap-1">
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('company')}
                                            className={`nav-link rounded-pill py-2 px-3 fw-semibold small ${activeTab === 'company' ? 'active shadow-xs' : ''}`}
                                        >
                                            <i className="ri ri-building-line me-1"></i> Company &amp; Contacts
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('bank')}
                                            className={`nav-link rounded-pill py-2 px-3 fw-semibold small ${activeTab === 'bank' ? 'active shadow-xs' : ''}`}
                                        >
                                            <i className="ri ri-bank-line me-1"></i> Bank Account
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('terms')}
                                            className={`nav-link rounded-pill py-2 px-3 fw-semibold small ${activeTab === 'terms' ? 'active shadow-xs' : ''}`}
                                        >
                                            <i className="ri ri-file-text-line me-1"></i> Terms &amp; Sequences
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('whatsapp')}
                                            className={`nav-link rounded-pill py-2 px-3 fw-semibold small ${activeTab === 'whatsapp' ? 'active shadow-xs' : ''}`}
                                            style={activeTab === 'whatsapp' ? { backgroundColor: '#25D366', borderColor: '#25D366' } : {}}
                                        >
                                            <i className="ri ri-whatsapp-line me-1"></i> 📱 WhatsApp &amp; Razorpay
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="card-body p-4">
                                    {/* 1. Company Tab */}
                                    {activeTab === 'company' && (
                                        <div>
                                            <h6 className="fw-bold text-primary mb-3">1. Business Identity &amp; Header Info</h6>
                                            <div className="row g-3">
                                                <div className="col-12 col-md-8">
                                                    <label className="form-label small fw-bold">Company Name <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        value={formData.company_name}
                                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-12 col-md-4">
                                                    <label className="form-label small fw-semibold">Tagline / Motto</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        value={formData.tagline}
                                                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-bold">Address Line</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-semibold">MSME Registration No.</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        value={formData.msme_reg}
                                                        onChange={(e) => setFormData({ ...formData, msme_reg: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-semibold">Trade Licence No.</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        value={formData.trade_licence}
                                                        onChange={(e) => setFormData({ ...formData, trade_licence: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-bold">Mobile Numbers (shown on invoice)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        value={formData.mobile_numbers}
                                                        onChange={(e) => setFormData({ ...formData, mobile_numbers: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-semibold">Official Mail ID</label>
                                                    <input
                                                        type="email"
                                                        className="form-control rounded-3"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-semibold">Website Domain</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        value={formData.website}
                                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Bank Tab */}
                                    {activeTab === 'bank' && (
                                        <div>
                                            <h6 className="fw-bold text-primary mb-3">2. Bank &amp; Payment Details for Customer Deposits</h6>
                                            <div className="row g-3">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-bold">Bank Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        value={formData.bank_name}
                                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-bold">A/C Holder Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        value={formData.account_holder}
                                                        onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-bold">Account Number</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3 font-monospace"
                                                        value={formData.account_number}
                                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-bold">IFSC Code</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3 font-monospace"
                                                        value={formData.ifsc_code}
                                                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-semibold">UPI ID / QR Handle (Optional)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        placeholder="e.g. deltasafari@sbi"
                                                        value={formData.upi_id}
                                                        onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Terms & Sequence Tab */}
                                    {activeTab === 'terms' && (
                                        <div>
                                            <h6 className="fw-bold text-primary mb-3">3. Terms &amp; Conditions and Sequence Settings</h6>
                                            <div className="row g-3">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-bold">Invoice Prefix</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3 font-monospace"
                                                        value={formData.invoice_prefix}
                                                        onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                                                    />
                                                    <small className="text-muted" style={{ fontSize: '11px' }}>Format: <code>INV-YYYY-MM-XXXXXX</code> (e.g. <code>INV-2026-09-056962</code> with 6-digit random number)</small>
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-bold">Next Invoice Number</label>
                                                    <input
                                                        type="number"
                                                        className="form-control rounded-3 font-monospace"
                                                        value={formData.next_invoice_number}
                                                        onChange={(e) => setFormData({ ...formData, next_invoice_number: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-bold">Default Terms &amp; Conditions (Editable per invoice)</label>
                                                    <textarea
                                                        className="form-control rounded-3 fst-italic"
                                                        rows="6"
                                                        value={formData.terms_conditions}
                                                        onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. WhatsApp & Razorpay Tab */}
                                    {activeTab === 'whatsapp' && (
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h6 className="fw-bold text-success mb-0 d-flex align-items-center gap-1.5">
                                                        <i className="ri ri-whatsapp-fill fs-5"></i>
                                                        <span>WhatsApp Invoice &amp; Razorpay Payment Link Automation</span>
                                                    </h6>
                                                    <small className="text-muted">
                                                        Auto-send personalized WhatsApp booking messages with instant Razorpay payment links upon invoice generation.
                                                    </small>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleOpenCreateTemplate}
                                                    className="btn btn-sm btn-success rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-xs"
                                                >
                                                    <i className="ri ri-add-line"></i>
                                                    <span>+ Create WhatsApp Template</span>
                                                </button>
                                            </div>

                                            {/* Razorpay API Keys Configuration */}
                                            <div className="card border p-3 rounded-4 bg-light mb-4 shadow-2xs">
                                                <h6 className="fw-bold text-dark mb-2 pb-1 border-bottom d-flex align-items-center gap-1.5">
                                                    <i className="ri ri-bank-card-fill text-primary"></i>
                                                    <span>Razorpay Integration Keys (Payment Link API & Webhooks)</span>
                                                </h6>
                                                <div className="row g-3">
                                                    <div className="col-12 col-md-4">
                                                        <label className="form-label small fw-semibold">Razorpay Key ID</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm rounded-3 font-monospace"
                                                            placeholder="rzp_live_xxxxxxxx or rzp_test_xxxx"
                                                            value={formData.razorpay_key_id}
                                                            onChange={(e) => setFormData({ ...formData, razorpay_key_id: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-4">
                                                        <label className="form-label small fw-semibold">Razorpay Key Secret</label>
                                                        <input
                                                            type="password"
                                                            className="form-control form-control-sm rounded-3 font-monospace"
                                                            placeholder="••••••••••••••••"
                                                            value={formData.razorpay_key_secret}
                                                            onChange={(e) => setFormData({ ...formData, razorpay_key_secret: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-4">
                                                        <label className="form-label small fw-semibold">Razorpay Webhook Secret</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm rounded-3 font-monospace"
                                                            placeholder="R2aj8d4H3KwkKjkNO12FQ7B2"
                                                            value={formData.razorpay_webhook_secret || ''}
                                                            onChange={(e) => setFormData({ ...formData, razorpay_webhook_secret: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-2.5 form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="autoSendSwitch"
                                                        checked={Number(formData.auto_send_whatsapp_invoice) === 1}
                                                        onChange={(e) => setFormData({ ...formData, auto_send_whatsapp_invoice: e.target.checked ? 1 : 0 })}
                                                    />
                                                    <label className="form-check-label small fw-bold text-dark" htmlFor="autoSendSwitch">
                                                        Automatically deliver WhatsApp message with Razorpay Payment Link when creating new invoices
                                                    </label>
                                                </div>

                                                {/* Razorpay Webhook Setup Guide */}
                                                <div className="mt-3 p-3 bg-white rounded-3 border border-primary border-opacity-25">
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <span className="fw-bold small text-primary d-flex align-items-center gap-1.5">
                                                            <i className="ri ri-webhook-line fs-6"></i>
                                                            <span>Instant Payment Confirmation Webhook Setup</span>
                                                        </span>
                                                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-0.5" style={{ fontSize: '11px' }}>
                                                            Auto-Confirmation Active
                                                        </span>
                                                    </div>
                                                    <p className="small text-muted mb-2" style={{ fontSize: '12px' }}>
                                                        When a user pays via the Razorpay payment link sent on WhatsApp, Razorpay calls this Webhook URL to immediately mark the invoice as <strong>Paid</strong>, record payment details, update the CRM lead status, and send an instant WhatsApp confirmation receipt.
                                                    </p>

                                                    <div className="row g-2 align-items-center mb-2">
                                                        <div className="col-12 col-md-7">
                                                            <label className="small fw-semibold text-dark mb-1" style={{ fontSize: '11px' }}>Webhook URL (Paste into Razorpay Dashboard):</label>
                                                            <div className="input-group input-group-sm">
                                                                <input 
                                                                    type="text" 
                                                                    readOnly 
                                                                    className="form-control bg-light font-monospace text-primary fw-semibold"
                                                                    value={`${(typeof window !== 'undefined' ? window.location.origin : 'https://sundarbandeltasafari.com').replace(':3000', ':3002').replace(':3001', ':3002')}/webhook/razorpay`}
                                                                />
                                                                <button 
                                                                    className="btn btn-outline-primary"
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const url = `${window.location.origin.replace(':3000', ':3002').replace(':3001', ':3002')}/webhook/razorpay`;
                                                                        navigator.clipboard.writeText(url);
                                                                        showMessage('info', 'Webhook URL copied to clipboard!');
                                                                    }}
                                                                >
                                                                    <i className="ri ri-file-copy-line"></i> Copy URL
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="col-12 col-md-5">
                                                            <label className="small fw-semibold text-dark mb-1" style={{ fontSize: '11px' }}>Secret (Paste into Razorpay Dashboard):</label>
                                                            <div className="input-group input-group-sm">
                                                                <input 
                                                                    type="text" 
                                                                    readOnly 
                                                                    className="form-control bg-light font-monospace"
                                                                    value={formData.razorpay_webhook_secret || 'R2aj8d4H3KwkKjkNO12FQ7B2'}
                                                                />
                                                                <button 
                                                                    className="btn btn-outline-secondary"
                                                                    type="button"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(formData.razorpay_webhook_secret || 'R2aj8d4H3KwkKjkNO12FQ7B2');
                                                                        showMessage('info', 'Webhook Secret copied to clipboard!');
                                                                    }}
                                                                >
                                                                    <i className="ri ri-file-copy-line"></i> Copy
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center gap-3 pt-1 flex-wrap" style={{ fontSize: '11.5px' }}>
                                                        <span className="text-dark fw-bold">Active Events to Select in Razorpay:</span>
                                                        <span className="badge bg-light text-dark border">
                                                            <i className="ri ri-checkbox-circle-fill text-success me-1"></i>
                                                            payment_link.paid (Invoice Payment)
                                                        </span>
                                                        <span className="badge bg-light text-dark border">
                                                            <i className="ri ri-checkbox-circle-fill text-success me-1"></i>
                                                            payment.captured (Payments)
                                                        </span>
                                                        <span className="badge bg-light text-dark border">
                                                            <i className="ri ri-checkbox-circle-fill text-success me-1"></i>
                                                            order.paid (Orders)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* WhatsApp Templates List */}
                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <label className="form-label small fw-bold text-dark mb-0">
                                                        Available WhatsApp Message Templates ({templates.length})
                                                    </label>
                                                    <small className="text-muted">Click a template to preview live rendering</small>
                                                </div>

                                                {loadingTemplates ? (
                                                    <div className="text-center py-4">
                                                        <span className="spinner-border spinner-border-sm text-primary"></span>
                                                        <span className="small text-muted ms-2">Loading templates...</span>
                                                    </div>
                                                ) : templates.length === 0 ? (
                                                    <div className="p-4 bg-light rounded-4 text-center border">
                                                        <i className="ri ri-chat-settings-line fs-1 text-muted"></i>
                                                        <p className="text-muted small my-2">No custom WhatsApp templates found.</p>
                                                        <button
                                                            type="button"
                                                            onClick={handleOpenCreateTemplate}
                                                            className="btn btn-sm btn-primary rounded-pill px-3"
                                                        >
                                                            Create Default Template
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-column gap-2.5">
                                                        {templates.map((tmpl) => (
                                                            <div
                                                                key={tmpl.id}
                                                                onClick={() => setSelectedTemplateForPreview(tmpl)}
                                                                className={`p-3 rounded-4 border transition-all cursor-pointer ${selectedTemplateForPreview?.id === tmpl.id ? 'border-success bg-white shadow-sm' : 'bg-light'}`}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <div className="d-flex justify-content-between align-items-start gap-2 mb-1.5">
                                                                    <div>
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <strong className="text-dark small">{tmpl.name}</strong>
                                                                            {tmpl.is_default === 1 && (
                                                                                <span className="badge bg-success text-white rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                                                                                    🌟 Default Template
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <small className="text-muted d-block">{tmpl.title || tmpl.category}</small>
                                                                    </div>
                                                                    <div className="d-flex gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handleOpenEditTemplate(tmpl); }}
                                                                            className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-0.5"
                                                                            title="Edit template"
                                                                        >
                                                                            <i className="ri ri-edit-line"></i> Edit
                                                                        </button>
                                                                        {templates.length > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tmpl.id); }}
                                                                                className="btn btn-xs btn-outline-danger rounded-pill px-2 py-0.5"
                                                                                title="Delete template"
                                                                            >
                                                                                <i className="ri ri-delete-bin-line"></i>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className="text-muted small mb-0 text-truncate font-monospace" style={{ fontSize: '11px', maxHeight: '40px' }}>
                                                                    {tmpl.template_text?.substring(0, 140)}...
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="card-footer bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                                    <span className="text-muted small">
                                        Changes apply to all new customer invoices and automated WhatsApp links.
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    >
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Saving Settings...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-save-3-line"></i>
                                                <span>Save All Settings</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Dynamic Live Preview (PDF or WhatsApp Preview) */}
                    <div className="col-12 col-xl-5">
                        {activeTab === 'whatsapp' ? (
                            /* Live WhatsApp Message Preview */
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top" style={{ top: '85px' }}>
                                <div className="card-header bg-success text-white py-3 px-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#075E54' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="avatar avatar-sm rounded-circle bg-white text-success d-flex align-items-center justify-content-center fw-bold">
                                            DS
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold text-white small">Delta Safari Official WhatsApp</h6>
                                            <small className="text-white-50" style={{ fontSize: '11px' }}>Customer Delivery Live Preview</small>
                                        </div>
                                    </div>
                                    <span className="badge bg-white text-success rounded-pill px-2 py-0.5 small">
                                        Template Preview
                                    </span>
                                </div>

                                <div className="card-body p-3" style={{ backgroundColor: '#ECE5DD', minHeight: '480px', maxHeight: '720px', overflowY: 'auto' }}>
                                    {/* WhatsApp Chat Bubble */}
                                    <div className="p-3 bg-white rounded-3 shadow-xs mb-3 border-0" style={{ borderTopLeftRadius: '0px', maxWidth: '100%' }}>
                                        <div className="text-dark small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '13px' }}>
                                            {getRenderedSampleText(previewTemplate?.template_text || '')}
                                        </div>
                                        <div className="text-end mt-2">
                                            <small className="text-muted" style={{ fontSize: '10px' }}>
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                                            </small>
                                        </div>
                                    </div>

                                    {/* Action Buttons inside chat */}
                                    <div className="p-2.5 bg-white rounded-3 shadow-xs border text-center mb-2">
                                        <div className="fw-bold text-primary small d-flex align-items-center justify-content-center gap-1">
                                            <i className="ri ri-secure-payment-fill text-success"></i>
                                            <span>Secure Razorpay Payment Gateway</span>
                                        </div>
                                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                                            Links are generated with 256-bit encryption &amp; auto-reconciliation.
                                        </small>
                                    </div>
                                </div>

                                <div className="card-footer bg-white p-2.5 border-top d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Active: <strong>{previewTemplate?.name || 'Default Template'}</strong>
                                    </small>
                                    <button
                                        type="button"
                                        onClick={handleOpenCreateTemplate}
                                        className="btn btn-xs btn-outline-success rounded-pill px-3"
                                    >
                                        + New Template
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Live PDF Invoice Preview */
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top" style={{ top: '85px' }}>
                                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-1.5 text-dark">
                                        <i className="ri ri-eye-line text-success"></i>
                                        <span>Live PDF Format Preview</span>
                                    </h6>
                                    <span className="badge bg-label-primary rounded-pill small">Matches Invoice-30018.pdf</span>
                                </div>
                                <div className="card-body p-2 bg-light overflow-auto" style={{ maxHeight: '720px' }}>
                                    <div className="shadow-xs rounded-3 overflow-hidden border">
                                        <InvoicePrintTemplate invoice={sampleInvoice} config={formData} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Template Creator & Editor Modal */}
            {templateModalOpen && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-success text-white py-3 px-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#075E54' }}>
                                <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-whatsapp-fill"></i>
                                    <span>{editingTemplate ? 'Edit WhatsApp Message Template' : 'Create New WhatsApp Invoice Template'}</span>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setTemplateModalOpen(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <form onSubmit={handleSaveTemplate}>
                                <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-7">
                                            <label className="form-label small fw-bold">Template Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="e.g. Official Invoice with Razorpay Payment Link"
                                                value={templateForm.name}
                                                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-12 col-md-5">
                                            <label className="form-label small fw-semibold">Category / Title</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="e.g. Booking Confirmation"
                                                value={templateForm.title}
                                                onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Placeholders Toolbar */}
                                    <div className="mb-2 p-2.5 bg-light rounded-3 border">
                                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                                            <label className="form-label small fw-bold text-dark mb-0">
                                                <i className="ri ri-code-s-slash-line text-primary me-1"></i>
                                                Click Placeholders to Insert Variable:
                                            </label>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>Auto-replaces with live invoice data</small>
                                        </div>
                                        <div className="d-flex flex-wrap gap-1.5">
                                            {[
                                                { label: 'Customer Name', val: '{{customer_name}}' },
                                                { label: 'Package Name', val: '{{package_name}}' },
                                                { label: 'Invoice No', val: '{{invoice_no}}' },
                                                { label: 'Booking/Travel Date', val: '{{departure_date}}' },
                                                { label: 'Total Pax', val: '{{pax}}' },
                                                { label: 'Rooms/Stay', val: '{{rooms}}' },
                                                { label: 'Pickup Point', val: '{{pickup_drop}}' },
                                                { label: 'Total Amount', val: '{{total_amount}}' },
                                                { label: 'Advance Paid', val: '{{advance_amount}}' },
                                                { label: 'Due Balance', val: '{{due_amount}}' },
                                                { label: '💳 Razorpay Link', val: '{{payment_link}}' },
                                                { label: 'Company Name', val: '{{company_name}}' },
                                                { label: 'Website', val: '{{website}}' },
                                                { label: 'Support Phone', val: '{{contact_number}}' }
                                            ].map((ph, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleInsertPlaceholder(ph.val)}
                                                    className="btn btn-xs btn-outline-primary bg-white rounded-pill px-2 py-0.5 shadow-2xs font-monospace"
                                                    style={{ fontSize: '11px' }}
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
                                            rows="10"
                                            placeholder="Write your template text with *bold*, _italics_, and {{placeholders}}..."
                                            value={templateForm.template_text}
                                            onChange={(e) => setTemplateForm({ ...templateForm, template_text: e.target.value })}
                                            required
                                            style={{ fontSize: '12.5px', lineHeight: '1.5' }}
                                        ></textarea>
                                        <small className="text-muted d-block mt-1">
                                            Tip: Use <code>*text*</code> for bold, <code>_text_</code> for italics. Always include <code>&#123;&#123;payment_link&#125;&#125;</code> so the customer receives their Razorpay link!
                                        </small>
                                    </div>

                                    {/* Set As Default Checkbox */}
                                    <div className="form-check form-switch p-2 bg-light rounded-3 border">
                                        <input
                                            className="form-check-input ms-0 me-2"
                                            type="checkbox"
                                            id="templateDefaultSwitch"
                                            checked={Number(templateForm.is_default) === 1}
                                            onChange={(e) => setTemplateForm({ ...templateForm, is_default: e.target.checked ? 1 : 0 })}
                                        />
                                        <label className="form-check-label small fw-bold text-dark" htmlFor="templateDefaultSwitch">
                                            Set as Default WhatsApp Template for all automated and manual invoice deliveries
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary rounded-pill px-3"
                                        onClick={() => setTemplateModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingTemplate}
                                        className="btn btn-success rounded-pill px-4 d-inline-flex align-items-center gap-1.5 shadow-xs"
                                        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                                    >
                                        {savingTemplate ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Saving Template...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-check-line"></i>
                                                <span>{editingTemplate ? 'Update Template' : 'Create Template'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
