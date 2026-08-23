'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { getInvoiceConfigUrl, updateInvoiceConfigUrl } from '@/app/routes/whatsappRoutes';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import InvoicePrintTemplate from '@/components/admin/invoice/InvoicePrintTemplate';

export default function InvoiceConfigPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('company'); // 'company', 'bank', 'terms', 'preview'

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
        next_invoice_number: 30019
    });

    // Sample preview invoice object
    const sampleInvoice = {
        invoice_no: `${formData.invoice_prefix || 'INV-00'}${formData.next_invoice_number || 30018}`,
        invoice_date: new Date().toISOString().split('T')[0],
        customer_name: 'Kaushik Bhattacharjee',
        customer_address: 'West Bengal',
        customer_phone: '8777810327',
        pickup_drop: 'Canning',
        number_of_pax: 5,
        room_required: '1 AC',
        food_preference: 'Non Veg',
        departure_date_text: '26/09/2026 to 28/09/2026',
        items: [
            { sn: 1, description: '2N 3D Sundarban Hilsa Festivle Special(5 Sharing)', rate: 2700, person: 5, amount: 13500 },
            { sn: 2, description: 'AC Charges', rate: 1000, person: '', amount: 1000 }
        ],
        subtotal: 14500,
        gst_percent: formData.default_gst_percent || 5,
        gst_amount: 0,
        discount_amount: 0,
        advance_note: '700/pax',
        advance_received: 2500,
        total_due_amount: 12000
    };

    const fetchConfig = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosGet(getInvoiceConfigUrl, token);
            if (res?.status && res.data) {
                setFormData({
                    ...formData,
                    ...res.data
                });
            }
        } catch (err) {
            console.error('Error fetching invoice config:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchConfig();
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

    if (user && Number(user.admin) !== 1) {
        return (
            <div className="container-xxl flex-grow-1 container-p-y text-center py-5">
                <div className="card p-5 border-0 shadow-sm rounded-4 mx-auto bg-white" style={{ maxWidth: '500px' }}>
                    <div className="avatar avatar-xl rounded-circle bg-label-danger mx-auto mb-3 d-flex align-items-center justify-content-center">
                        <i className="ri ri-lock-2-fill fs-2 text-danger"></i>
                    </div>
                    <h4 className="fw-bold mb-2 text-dark">Access Restricted</h4>
                    <p className="text-muted small mb-4">
                        Invoice and Billing Configuration is restricted to Super Administrators. Regular staff accounts cannot modify invoice template settings.
                    </p>
                    <Link href="/crm/invoices" className="btn btn-primary rounded-pill px-4">
                        Back to Invoices
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header Banner */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-settings-4-fill text-primary fs-3"></i>
                        <span>Invoice Format &amp; Billing Configuration</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Customize company branding, registrations, bank account details, and terms matching the <code>Invoice-30018.pdf</code> format.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Link href="/crm/invoices/preview" target="_blank" className="btn btn-outline-info rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-xs">
                        <i className="ri ri-file-paper-2-line"></i>
                        <span>📄 View Full Dummy Invoice</span>
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
                    <p className="text-muted small mt-2">Loading invoice settings...</p>
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
                                                    <small className="text-muted" style={{ fontSize: '11px' }}>e.g. <code>INV-00</code> produces <code>INV-0030019</code></small>
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
                                </div>

                                <div className="card-footer bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                                    <span className="text-muted small">
                                        Changes apply to all new and printed customer invoices.
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
                                                <span>Save Invoice Format</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Live Interactive Preview */}
                    <div className="col-12 col-xl-5">
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
                    </div>
                </div>
            )}
        </div>
    );
}
