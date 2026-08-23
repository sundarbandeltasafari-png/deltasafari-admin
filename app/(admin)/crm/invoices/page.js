'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { 
    getInvoicesListUrl, 
    createInvoiceUrl, 
    deleteInvoiceUrl, 
    getInvoiceConfigUrl, 
    getNextInvoiceNumberUrl,
    getBillingStatsUrl,
    getFollowupsListUrl
} from '@/app/routes/whatsappRoutes';
import { axiosGet, axiosPost, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';
import InvoicePrintTemplate from '@/components/admin/invoice/InvoicePrintTemplate';
import { printInvoiceDocument } from '@/libs/printHelper';

export default function InvoicesPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);

    // List & Stats State
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({
        total_invoices: 0,
        total_billed_amount: 0,
        total_collected_amount: 0,
        total_due_amount: 0,
        paid_invoices: 0,
        partial_invoices: 0,
        unpaid_invoices: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Global Config State
    const [invoiceConfig, setInvoiceConfig] = useState(null);

    // Converted Leads (for auto-filling invoice)
    const [convertedLeads, setConvertedLeads] = useState([]);
    const [loadingConverted, setLoadingConverted] = useState(false);

    // Create Invoice Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createMode, setCreateMode] = useState('converted'); // 'converted' or 'custom'
    const [selectedConvertedLeadId, setSelectedConvertedLeadId] = useState('');
    const [submittingInvoice, setSubmittingInvoice] = useState(false);

    const [invoiceForm, setInvoiceForm] = useState({
        invoice_no: '',
        invoice_date: new Date().toISOString().split('T')[0],
        contact_id: null,
        customer_name: '',
        customer_address: 'West Bengal',
        customer_phone: '',
        customer_email: '',
        pickup_drop: 'Canning',
        number_of_pax: 1,
        room_required: '1 AC',
        food_preference: 'Non Veg',
        departure_date_text: '',
        items: [
            { sn: 1, description: '2N 3D Sundarban Hilsa Festivle Special(5 Sharing)', rate: 2700, person: 5, amount: 13500 },
            { sn: 2, description: 'AC Charges', rate: 1000, person: '', amount: 1000 }
        ],
        subtotal: 14500,
        gst_percent: 0,
        gst_amount: 0,
        discount_amount: 0,
        advance_note: '700/pax',
        advance_received: 2500,
        total_due_amount: 12000,
        payment_status: 'partial',
        bank_details_text: '',
        terms_text: ''
    });

    // View / Print Modal State
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState(null);

    // Fetch Invoices
    const fetchInvoices = async (page = 1) => {
        if (!token) return;
        setLoading(true);
        try {
            const queryParams = [
                `page=${page}`,
                `limit=20`
            ];
            if (searchTerm.trim()) queryParams.push(`search=${encodeURIComponent(searchTerm.trim())}`);
            if (paymentStatusFilter) queryParams.push(`payment_status=${encodeURIComponent(paymentStatusFilter)}`);
            if (fromDate) queryParams.push(`from_date=${encodeURIComponent(fromDate)}`);
            if (toDate) queryParams.push(`to_date=${encodeURIComponent(toDate)}`);

            const url = `${getInvoicesListUrl}?${queryParams.join('&')}`;
            const res = await axiosGet(url, token);

            if (res?.status && Array.isArray(res.invoices)) {
                setInvoices(res.invoices);
                setTotalCount(res.total || 0);
                setTotalPages(res.totalPages || 1);
                setCurrentPage(res.page || 1);
            } else {
                setInvoices([]);
                setTotalCount(0);
            }
        } catch (err) {
            console.error('Error fetching invoices:', err);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Stats & Config
    const fetchStatsAndConfig = async () => {
        if (!token) return;
        try {
            const [statsRes, configRes] = await Promise.all([
                axiosGet(getBillingStatsUrl, token),
                axiosGet(getInvoiceConfigUrl, token)
            ]);

            if (statsRes?.status && statsRes?.stats) {
                setStats(statsRes.stats);
            }
            if (configRes?.status && configRes?.data) {
                setInvoiceConfig(configRes.data);
            }
        } catch (err) {
            console.error('Error fetching stats & config:', err);
        }
    };

    // Fetch Converted Leads for Dropdown Selection
    const fetchConvertedLeads = async () => {
        if (!token) return;
        setLoadingConverted(true);
        try {
            const res = await axiosGet(`${getFollowupsListUrl}?is_converted=true&limit=100`, token);
            if (res?.status && Array.isArray(res.followups)) {
                setConvertedLeads(res.followups.filter(f => f.is_converted == 1));
            }
        } catch (err) {
            console.error('Error loading converted leads:', err);
        } finally {
            setLoadingConverted(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchInvoices(1);
            fetchStatsAndConfig();
            fetchConvertedLeads();
        }
    }, [token]);

    // Handle Search / Filter Submit
    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        setCurrentPage(1);
        fetchInvoices(1);
    };

    const handleResetFilter = () => {
        setSearchTerm('');
        setPaymentStatusFilter('');
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
        setTimeout(() => {
            fetchInvoices(1);
        }, 50);
    };

    // Auto-calculate Totals when items, GST, discount, or advance changes
    const recalculateTotals = (items, gstPercent, discount, advance) => {
        const itemSum = items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);
        const gstP = parseFloat(gstPercent) || 0;
        const gstVal = gstP > 0 ? (itemSum * (gstP / 100)) : 0;
        const discVal = parseFloat(discount) || 0;
        const advVal = parseFloat(advance) || 0;
        const totalDue = Math.max(0, itemSum + gstVal - discVal - advVal);

        let status = 'partial';
        if (totalDue <= 0 && advVal > 0) status = 'paid';
        else if (advVal <= 0) status = 'unpaid';

        return {
            subtotal: itemSum,
            gst_amount: gstVal,
            total_due_amount: totalDue,
            payment_status: status
        };
    };

    // Open Create Modal
    const handleOpenCreateModal = async () => {
        try {
            const numRes = await axiosGet(getNextInvoiceNumberUrl, token);
            const nextNo = numRes?.data?.invoice_no || `INV-00${Date.now().toString().slice(-5)}`;

            const initialItems = [
                { sn: 1, description: '2N 3D Sundarban Safari Special Package', rate: 2700, person: 5, amount: 13500 }
            ];
            const calcs = recalculateTotals(initialItems, 0, 0, 2500);

            setInvoiceForm({
                invoice_no: nextNo,
                invoice_date: new Date().toISOString().split('T')[0],
                contact_id: null,
                customer_name: '',
                customer_address: 'West Bengal',
                customer_phone: '',
                customer_email: '',
                pickup_drop: 'Canning',
                number_of_pax: 5,
                room_required: '1 AC',
                food_preference: 'Non Veg',
                departure_date_text: '',
                items: initialItems,
                subtotal: calcs.subtotal,
                gst_percent: 0,
                gst_amount: calcs.gst_amount,
                discount_amount: 0,
                advance_note: '700/pax',
                advance_received: 2500,
                total_due_amount: calcs.total_due_amount,
                payment_status: calcs.payment_status,
                bank_details_text: invoiceConfig?.account_number 
                    ? `${invoiceConfig.bank_name || 'STATE BANK OF INDIA'} ; A/C Holder : ${invoiceConfig.account_holder || 'SANDIP HALDER'}\nA/C NO : ${invoiceConfig.account_number} ; IFSC : ${invoiceConfig.ifsc_code}`
                    : '',
                terms_text: invoiceConfig?.terms_conditions || ''
            });

            setSelectedConvertedLeadId('');
            setCreateMode('converted');
            setCreateModalOpen(true);
        } catch (e) {
            console.error(e);
            setCreateModalOpen(true);
        }
    };

    // When admin selects a converted lead from the dropdown
    const handleSelectConvertedLead = (leadId) => {
        setSelectedConvertedLeadId(leadId);
        if (!leadId) return;

        const lead = convertedLeads.find(l => String(l.contact_id || l.id) === String(leadId));
        if (!lead) return;

        const leadPax = parseInt(lead.number_of_persons) || 1;
        const ratePerPerson = lead.package_rate ? parseFloat(lead.package_rate) : (lead.converted_amount ? parseFloat(lead.converted_amount) / leadPax : 2700);
        const pkgTitle = lead.package_name || 'Sundarban Safari Package';
        const totalAmount = lead.converted_amount ? parseFloat(lead.converted_amount) : (ratePerPerson * leadPax);
        const advanceAmt = totalAmount > 2000 ? 2500 : 500;

        const departureStr = lead.travel_date ? `${new Date(lead.travel_date).toLocaleDateString('en-GB')}` : '';

        const newItems = [
            {
                sn: 1,
                description: pkgTitle,
                rate: ratePerPerson,
                person: leadPax,
                amount: totalAmount
            }
        ];

        const calcs = recalculateTotals(newItems, 0, 0, advanceAmt);

        setInvoiceForm(prev => ({
            ...prev,
            contact_id: lead.contact_id || lead.id,
            customer_name: lead.lead_name || lead.name || '',
            customer_phone: lead.phone || lead.wa_id || '',
            customer_email: lead.email || '',
            customer_address: 'West Bengal',
            pickup_drop: lead.travel_destination || 'Canning',
            number_of_pax: leadPax,
            room_required: `${lead.total_rooms || 1} AC`,
            food_preference: 'Non Veg',
            departure_date_text: departureStr,
            items: newItems,
            subtotal: calcs.subtotal,
            gst_percent: 0,
            gst_amount: calcs.gst_amount,
            discount_amount: 0,
            advance_note: `${Math.round(advanceAmt / leadPax)}/pax`,
            advance_received: advanceAmt,
            total_due_amount: calcs.total_due_amount,
            payment_status: calcs.payment_status
        }));
    };

    // Dynamic Item Rows Add / Edit / Remove
    const handleItemChange = (index, field, value) => {
        const updated = [...invoiceForm.items];
        updated[index][field] = value;

        if (field === 'rate' || field === 'person') {
            const r = parseFloat(updated[index].rate) || 0;
            const p = parseFloat(updated[index].person) || 1;
            updated[index].amount = r * p;
        }

        const calcs = recalculateTotals(updated, invoiceForm.gst_percent, invoiceForm.discount_amount, invoiceForm.advance_received);
        setInvoiceForm(prev => ({
            ...prev,
            items: updated,
            subtotal: calcs.subtotal,
            gst_amount: calcs.gst_amount,
            total_due_amount: calcs.total_due_amount,
            payment_status: calcs.payment_status
        }));
    };

    const handleAddItemRow = () => {
        const nextSn = invoiceForm.items.length + 1;
        const newRow = { sn: nextSn, description: 'AC / Boat / Extra Charges', rate: 1000, person: '', amount: 1000 };
        const updated = [...invoiceForm.items, newRow];
        const calcs = recalculateTotals(updated, invoiceForm.gst_percent, invoiceForm.discount_amount, invoiceForm.advance_received);
        setInvoiceForm(prev => ({
            ...prev,
            items: updated,
            subtotal: calcs.subtotal,
            gst_amount: calcs.gst_amount,
            total_due_amount: calcs.total_due_amount,
            payment_status: calcs.payment_status
        }));
    };

    const handleRemoveItemRow = (index) => {
        if (invoiceForm.items.length <= 1) {
            showMessage('warning', 'Invoice must have at least 1 line item.');
            return;
        }
        const updated = invoiceForm.items.filter((_, idx) => idx !== index).map((it, idx) => ({ ...it, sn: idx + 1 }));
        const calcs = recalculateTotals(updated, invoiceForm.gst_percent, invoiceForm.discount_amount, invoiceForm.advance_received);
        setInvoiceForm(prev => ({
            ...prev,
            items: updated,
            subtotal: calcs.subtotal,
            gst_amount: calcs.gst_amount,
            total_due_amount: calcs.total_due_amount,
            payment_status: calcs.payment_status
        }));
    };

    // Financial Inputs Change
    const handleFinancialChange = (field, val) => {
        const updatedForm = { ...invoiceForm, [field]: val };
        const calcs = recalculateTotals(
            updatedForm.items,
            field === 'gst_percent' ? val : updatedForm.gst_percent,
            field === 'discount_amount' ? val : updatedForm.discount_amount,
            field === 'advance_received' ? val : updatedForm.advance_received
        );
        setInvoiceForm({
            ...updatedForm,
            subtotal: calcs.subtotal,
            gst_amount: calcs.gst_amount,
            total_due_amount: calcs.total_due_amount,
            payment_status: calcs.payment_status
        });
    };

    // Save Invoice Submit
    const handleSaveInvoice = async (e) => {
        e.preventDefault();
        if (!invoiceForm.customer_name.trim()) {
            showMessage('error', 'Customer name is required.');
            return;
        }
        if (!invoiceForm.customer_phone.trim()) {
            showMessage('error', 'Customer phone is required.');
            return;
        }

        setSubmittingInvoice(true);
        try {
            const res = await axiosPost(createInvoiceUrl, invoiceForm, token);
            if (res?.status) {
                showMessage('success', '🎉 Invoice generated and saved successfully!');
                setCreateModalOpen(false);
                fetchInvoices(1);
                fetchStatsAndConfig();

                // Open print preview immediately
                setSelectedInvoiceToPrint(invoiceForm);
                setPrintModalOpen(true);
            } else {
                showMessage('error', res?.msg || 'Failed to create invoice.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error creating invoice.');
        } finally {
            setSubmittingInvoice(false);
        }
    };

    // Delete Invoice
    const handleDeleteInvoice = async (id, invNo) => {
        if (!window.confirm(`Are you sure you want to delete Invoice ${invNo}?`)) {
            return;
        }
        try {
            const res = await axiosDelete(`${deleteInvoiceUrl}${id}`, token);
            if (res?.status) {
                showMessage('success', `Invoice ${invNo} deleted.`);
                fetchInvoices(currentPage);
                fetchStatsAndConfig();
            } else {
                showMessage('error', res?.msg || 'Failed to delete invoice.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error deleting invoice.');
        }
    };

    // Format currency
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    // Open Dummy Sample Invoice Modal
    const handleOpenDummyInvoiceModal = () => {
        const dummyInvoice = {
            invoice_no: 'INV-0030018',
            invoice_date: '2026-08-20',
            customer_name: 'Kaushik Bhattacharjee',
            customer_address: 'West Bengal',
            customer_phone: '8777810327',
            customer_email: 'sundarban.deltasafari@gmail.com',
            pickup_drop: 'Canning',
            number_of_pax: 5,
            room_required: '1 AC',
            food_preference: 'Non Veg',
            departure_date_text: '26/09/2026 to 28/09/2026',
            items: [
                {
                    sn: 1,
                    description: '2N 3D Sundarban Hilsa Festivle Special(5 Sharing)',
                    rate: 2700,
                    person: 5,
                    amount: 13500
                },
                {
                    sn: 2,
                    description: 'AC Charges',
                    rate: 1000,
                    person: '',
                    amount: 1000
                }
            ],
            subtotal: 14500,
            gst_percent: 5,
            gst_amount: 0,
            discount_amount: 0,
            advance_note: '700/pax',
            advance_received: 2500,
            total_due_amount: 12000,
            payment_status: 'partial'
        };
        setSelectedInvoiceToPrint(dummyInvoice);
        setPrintModalOpen(true);
    };

    if (user && user.admin !== 1) {
        return (
            <div className="container-xxl flex-grow-1 container-p-y text-center py-5">
                <div className="card p-5 border-0 shadow-sm rounded-4 mx-auto bg-white" style={{ maxWidth: '500px' }}>
                    <div className="avatar avatar-xl rounded-circle bg-label-danger mx-auto mb-3 d-flex align-items-center justify-content-center">
                        <i className="ri ri-lock-2-fill fs-2 text-danger"></i>
                    </div>
                    <h4 className="fw-bold mb-2 text-dark">Access Restricted</h4>
                    <p className="text-muted small mb-4">
                        Billing and Invoice Generation is restricted to Super Administrators. Regular staff accounts cannot view or create customer invoices.
                    </p>
                    <Link href="/crm/whatsapp" className="btn btn-primary rounded-pill px-4">
                        Back to WhatsApp CRM
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* 1. Header Banner */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-bill-fill text-primary fs-3"></i>
                        <span>Billing &amp; Customer Invoices</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Create and issue official PDF invoices for converted leads or custom tourists matching the <code>Invoice-30018.pdf</code> design.
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleOpenDummyInvoiceModal}
                        className="btn btn-outline-info rounded-pill px-3.5 d-inline-flex align-items-center gap-1.5 shadow-xs"
                    >
                        <i className="ri ri-file-paper-2-line text-info"></i>
                        <span>📄 View Dummy Invoice</span>
                    </button>
                    <Link
                        href="/crm/invoices/preview"
                        target="_blank"
                        className="btn btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-xs"
                        title="Open full page dummy invoice preview in a new tab"
                    >
                        <i className="ri ri-external-link-line"></i>
                        <span>Full Page</span>
                    </Link>
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri ri-add-circle-fill"></i>
                        <span>+ Create Invoice</span>
                    </button>
                    <Link href="/crm/invoices/config" className="btn btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-xs">
                        <i className="ri ri-settings-4-line"></i>
                        <span>Settings</span>
                    </Link>
                </div>
            </div>

            {/* 2. Top KPI Cards */}
            <div className="row g-3 mb-4">
                {/* Total Billed */}
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-primary">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Total Invoices</span>
                                <h3 className="fw-bold text-dark mb-0">{stats.total_invoices || totalCount}</h3>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 rounded-circle p-3 text-primary">
                                <i className="ri ri-file-text-fill fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Total Billed Amount */}
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-info">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Total Billed</span>
                                <h3 className="fw-bold text-info mb-0">{formatCurrency(stats.total_billed_amount)}</h3>
                            </div>
                            <span className="badge bg-info bg-opacity-10 rounded-circle p-3 text-info">
                                <i className="ri ri-wallet-3-fill fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Total Advance Collected */}
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-success">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Advance Collected</span>
                                <h3 className="fw-bold text-success mb-0">{formatCurrency(stats.total_collected_amount)}</h3>
                            </div>
                            <span className="badge bg-success bg-opacity-10 rounded-circle p-3 text-success">
                                <i className="ri ri-checkbox-circle-fill fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Total Outstanding Due */}
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-danger">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Due Outstanding</span>
                                <h3 className="fw-bold text-danger mb-0">{formatCurrency(stats.total_due_amount)}</h3>
                            </div>
                            <span className="badge bg-danger bg-opacity-10 rounded-circle p-3 text-danger">
                                <i className="ri ri-error-warning-fill fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Filter Toolbar */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3.5">
                    <form onSubmit={handleFilterSubmit} className="row g-3 align-items-end">
                        <div className="col-12 col-md-4">
                            <label className="form-label small text-muted fw-semibold">Search Invoice No / Customer / Phone</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="ri ri-search-line text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-light border-start-0 ps-0"
                                    placeholder="INV-0030018, Kaushik, 8777..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="col-6 col-md-2">
                            <label className="form-label small text-muted fw-semibold">Payment Status</label>
                            <select
                                className="form-select bg-light rounded-3"
                                value={paymentStatusFilter}
                                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="paid">Paid in Full</option>
                                <option value="partial">Partial / Advance Paid</option>
                                <option value="unpaid">Unpaid / Full Due</option>
                            </select>
                        </div>

                        <div className="col-6 col-md-2">
                            <label className="form-label small text-muted fw-semibold">From Date</label>
                            <input
                                type="date"
                                className="form-control bg-light rounded-3"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        <div className="col-6 col-md-2">
                            <label className="form-label small text-muted fw-semibold">To Date</label>
                            <input
                                type="date"
                                min={fromDate || ''}
                                className="form-control bg-light rounded-3"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>

                        <div className="col-6 col-md-2 d-flex gap-2">
                            <button type="submit" className="btn btn-primary rounded-pill px-3 flex-grow-1 shadow-sm" style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}>
                                Filter
                            </button>
                            <button type="button" onClick={handleResetFilter} className="btn btn-outline-secondary rounded-pill px-3">
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 4. Invoices Table */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-file-list-3-fill text-primary"></i>
                        <span>Issued Invoices ({totalCount})</span>
                    </h5>
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="btn btn-sm btn-primary rounded-pill px-3"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        + Create Invoice
                    </button>
                </div>

                <div className="table-responsive text-nowrap">
                    {loading ? (
                        <div className="p-5 text-center">
                            <LoadingComponent />
                            <p className="text-muted small mt-2">Loading customer invoices...</p>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="p-5 text-center">
                            <NotFound />
                            <p className="text-muted mt-3">
                                No invoices found matching your filters. Create your first customer invoice by clicking the button below.
                            </p>
                            <button 
                                type="button" 
                                onClick={handleOpenCreateModal}
                                className="btn btn-primary btn-sm rounded-pill px-4 mt-2"
                                style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                            >
                                + Create Invoice
                            </button>
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Invoice No &amp; Date</th>
                                    <th>Customer &amp; Phone</th>
                                    <th>Pax &amp; Room</th>
                                    <th>Travel Departure</th>
                                    <th>Billed Amount</th>
                                    <th>Advance Paid</th>
                                    <th>Due Amount</th>
                                    <th>Status</th>
                                    <th className="text-center pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        {/* Invoice No & Date */}
                                        <td className="ps-4">
                                            <span className="fw-bold font-monospace text-primary d-block">
                                                {inv.invoice_no}
                                            </span>
                                            <small className="text-muted font-monospace">
                                                {formatDate(inv.invoice_date)}
                                            </small>
                                        </td>

                                        {/* Customer */}
                                        <td>
                                            <div>
                                                <strong className="text-dark d-block">{inv.customer_name}</strong>
                                                <a
                                                    href={`https://wa.me/${inv.customer_phone}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="small text-success font-monospace d-inline-flex align-items-center gap-1 text-decoration-none"
                                                >
                                                    <i className="ri ri-whatsapp-fill"></i>
                                                    <span>+{inv.customer_phone}</span>
                                                </a>
                                            </div>
                                        </td>

                                        {/* Pax & Room */}
                                        <td>
                                            <span className="badge bg-light text-dark border rounded-pill px-2 py-0.5 small me-1">
                                                {inv.number_of_pax} Pax
                                            </span>
                                            <span className="badge bg-light text-dark border rounded-pill px-2 py-0.5 small">
                                                {inv.room_required || '1 AC'}
                                            </span>
                                        </td>

                                        {/* Departure */}
                                        <td>
                                            <div className="small text-dark fw-semibold">
                                                {inv.departure_date_text || '—'}
                                            </div>
                                            <small className="text-muted">{inv.pickup_drop || 'Canning'}</small>
                                        </td>

                                        {/* Billed */}
                                        <td>
                                            <strong className="text-dark">
                                                ₹{inv.subtotal}
                                            </strong>
                                        </td>

                                        {/* Advance */}
                                        <td>
                                            <span className="text-success fw-semibold">
                                                ₹{inv.advance_received}
                                            </span>
                                        </td>

                                        {/* Due Amount */}
                                        <td>
                                            <strong className={`fs-6 ${parseFloat(inv.total_due_amount) > 0 ? 'text-danger' : 'text-success'}`}>
                                                ₹{inv.total_due_amount}
                                            </strong>
                                        </td>

                                        {/* Status */}
                                        <td>
                                            {inv.payment_status === 'paid' ? (
                                                <span className="badge bg-success rounded-pill px-2.5 py-1">
                                                    Paid in Full
                                                </span>
                                            ) : inv.payment_status === 'partial' ? (
                                                <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1">
                                                    Advance Paid
                                                </span>
                                            ) : (
                                                <span className="badge bg-danger rounded-pill px-2.5 py-1">
                                                    Unpaid / Due
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="text-center pe-4">
                                            <div className="d-inline-flex align-items-center gap-1.5">
                                                {/* Print & View */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedInvoiceToPrint(inv);
                                                        setPrintModalOpen(true);
                                                    }}
                                                    className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"
                                                    title="View & Print Invoice (PDF)"
                                                >
                                                    <i className="ri ri-printer-fill"></i>
                                                    <span>View / Print</span>
                                                </button>

                                                {/* Share WhatsApp */}
                                                <a
                                                    href={`https://wa.me/${inv.customer_phone}?text=${encodeURIComponent(
                                                        `Hello ${inv.customer_name},\n\nHere is your official Safari Booking Invoice *${inv.invoice_no}* from *DELTA SAFARI*.\n\n` +
                                                        `*Total Amount:* ₹${inv.subtotal}\n` +
                                                        `*Advance Received:* ₹${inv.advance_received}\n` +
                                                        `*Total Due Balance:* ₹${inv.total_due_amount}\n` +
                                                        `*Departure Date:* ${inv.departure_date_text || 'As scheduled'}\n\n` +
                                                        `Thank you for booking with Delta Safari!\nVisit: sundarbandeltasafari.com`
                                                    )}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn btn-sm btn-outline-success rounded-circle p-1.5 d-inline-flex align-items-center justify-content-center"
                                                    title="Send Invoice Summary via WhatsApp"
                                                    style={{ width: '32px', height: '32px' }}
                                                >
                                                    <i className="ri ri-whatsapp-fill"></i>
                                                </a>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteInvoice(inv.id, inv.invoice_no)}
                                                    className="btn btn-sm btn-outline-danger rounded-circle p-1.5"
                                                    title="Delete Invoice"
                                                    style={{ width: '32px', height: '32px' }}
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="card-footer bg-transparent border-top py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <span className="text-muted small">
                            Page {currentPage} of {totalPages} ({totalCount} total invoices)
                        </span>
                        <div className="d-flex gap-1">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => {
                                    const prev = currentPage - 1;
                                    setCurrentPage(prev);
                                    fetchInvoices(prev);
                                }}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                disabled={currentPage >= totalPages || loading}
                                onClick={() => {
                                    const next = currentPage + 1;
                                    setCurrentPage(next);
                                    fetchInvoices(next);
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 5. CREATE INVOICE MODAL (From Converted Lead OR Custom) */}
            {createModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#0066cc' }}>
                                <div>
                                    <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-file-add-fill"></i>
                                        <span>Create Customer Safari Invoice</span>
                                    </h5>
                                    <small className="text-white-50">
                                        Generate an official invoice according to a converted lead or create a custom billing document.
                                    </small>
                                </div>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setCreateModalOpen(false)} aria-label="Close"></button>
                            </div>

                            <form onSubmit={handleSaveInvoice}>
                                <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                                    {/* Mode Selector */}
                                    <div className="p-3 bg-light rounded-4 mb-4 border">
                                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                                            <span className="fw-bold text-dark small text-uppercase">
                                                Step 1: Choose Creation Source
                                            </span>
                                            <div className="btn-group" role="group">
                                                <button
                                                    type="button"
                                                    onClick={() => { setCreateMode('converted'); }}
                                                    className={`btn btn-sm rounded-pill px-3 ${createMode === 'converted' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                >
                                                    <i className="ri ri-trophy-fill me-1 text-warning"></i> From Converted Lead
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setCreateMode('custom'); }}
                                                    className={`btn btn-sm rounded-pill px-3 ${createMode === 'custom' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                >
                                                    <i className="ri ri-edit-2-line me-1"></i> Custom Invoice
                                                </button>
                                            </div>
                                        </div>

                                        {createMode === 'converted' && (
                                            <div>
                                                <label className="form-label small fw-bold text-dark">
                                                    Select Converted Lead (Won Deals) <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select rounded-3"
                                                    value={selectedConvertedLeadId}
                                                    onChange={(e) => handleSelectConvertedLead(e.target.value)}
                                                >
                                                    <option value="">-- Choose a Converted Lead from CRM --</option>
                                                    {convertedLeads.map((c) => (
                                                        <option key={c.contact_id || c.id} value={c.contact_id || c.id}>
                                                            🎉 {c.lead_name || c.name} (+{c.phone || c.wa_id}) — {c.package_name || 'Safari'} (₹{c.converted_amount || c.package_rate || 0})
                                                        </option>
                                                    ))}
                                                </select>
                                                <small className="text-muted d-block mt-1">
                                                    Selecting a converted lead automatically fills in customer name, phone, package rate, pax, and travel dates.
                                                </small>
                                            </div>
                                        )}
                                    </div>

                                    {/* Invoice Number & Date */}
                                    <div className="row g-3 mb-4">
                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-bold">Invoice Number</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3 font-monospace fw-bold"
                                                value={invoiceForm.invoice_no}
                                                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_no: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-bold">Invoice Date</label>
                                            <input
                                                type="date"
                                                className="form-control rounded-3"
                                                value={invoiceForm.invoice_date}
                                                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-bold">Departure Date Range (e.g. 26/09 to 28/09)</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="26/09/2026 to 28/09/2026"
                                                value={invoiceForm.departure_date_text}
                                                onChange={(e) => setInvoiceForm({ ...invoiceForm, departure_date_text: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Customer & Guest Information (Matching Boxed layout) */}
                                    <div className="row g-4 mb-4">
                                        {/* Left: Invoice To */}
                                        <div className="col-12 col-md-6">
                                            <div className="card border p-3 rounded-4 bg-white h-100 shadow-2xs">
                                                <h6 className="fw-bold text-dark mb-2 pb-1 border-bottom d-flex align-items-center gap-1.5">
                                                    <i className="ri ri-user-3-line text-primary"></i>
                                                    <span>Invoice To (Customer Info)</span>
                                                </h6>
                                                <div className="mb-2">
                                                    <label className="form-label small fw-semibold">Customer Full Name <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        placeholder="Kaushik Bhattacharjee"
                                                        value={invoiceForm.customer_name}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label small fw-semibold">Customer Address / State</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        placeholder="West Bengal"
                                                        value={invoiceForm.customer_address}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_address: e.target.value })}
                                                    />
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label small fw-semibold">Mobile Number <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3 font-monospace"
                                                        placeholder="8777810327"
                                                        value={invoiceForm.customer_phone}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_phone: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="form-label small fw-semibold">Pickup / Drop Location</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        placeholder="Canning"
                                                        value={invoiceForm.pickup_drop}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, pickup_drop: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Guest Details */}
                                        <div className="col-12 col-md-6">
                                            <div className="card border p-3 rounded-4 bg-white h-100 shadow-2xs">
                                                <h6 className="fw-bold text-dark mb-2 pb-1 border-bottom d-flex align-items-center gap-1.5">
                                                    <i className="ri ri-hotel-bed-line text-primary"></i>
                                                    <span>Guest &amp; Stay Details</span>
                                                </h6>
                                                <div className="mb-2">
                                                    <label className="form-label small fw-semibold">Number of Pax (Persons)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="form-control rounded-3"
                                                        value={invoiceForm.number_of_pax}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, number_of_pax: parseInt(e.target.value) || 1 })}
                                                    />
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label small fw-semibold">Room Required</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        placeholder="1 AC, 2 Non-AC"
                                                        value={invoiceForm.room_required}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, room_required: e.target.value })}
                                                    />
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label small fw-semibold">Food Preference</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        placeholder="Non Veg, Veg, Jain"
                                                        value={invoiceForm.food_preference}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, food_preference: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="form-label small fw-semibold">Customer Email (Optional)</label>
                                                    <input
                                                        type="email"
                                                        className="form-control rounded-3 font-monospace"
                                                        placeholder="customer@example.com"
                                                        value={invoiceForm.customer_email}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Line Items Table */}
                                    <div className="card border rounded-4 overflow-hidden mb-4 shadow-2xs">
                                        <div className="card-header bg-light border-bottom py-2.5 px-3 d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-1.5">
                                                <i className="ri ri-list-check text-primary"></i>
                                                <span>Invoice Line Items</span>
                                            </h6>
                                            <button
                                                type="button"
                                                onClick={handleAddItemRow}
                                                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1"
                                            >
                                                + Add Line Item
                                            </button>
                                        </div>

                                        <div className="table-responsive">
                                            <table className="table table-bordered align-middle mb-0">
                                                <thead className="table-light text-center small fw-bold">
                                                    <tr>
                                                        <th style={{ width: '60px' }}>S.N</th>
                                                        <th>Package Description</th>
                                                        <th style={{ width: '130px' }}>Rate (₹)</th>
                                                        <th style={{ width: '110px' }}>Person</th>
                                                        <th style={{ width: '140px' }}>Amount (₹)</th>
                                                        <th style={{ width: '50px' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoiceForm.items.map((it, idx) => (
                                                        <tr key={idx}>
                                                            <td className="text-center font-monospace">{idx + 1}</td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm rounded-2"
                                                                    placeholder="e.g. 2N 3D Sundarban Safari Special Package"
                                                                    value={it.description}
                                                                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                                    required
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="form-control form-control-sm rounded-2 text-center"
                                                                    placeholder="2700"
                                                                    value={it.rate}
                                                                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="form-control form-control-sm rounded-2 text-center"
                                                                    placeholder="5"
                                                                    value={it.person}
                                                                    onChange={(e) => handleItemChange(idx, 'person', e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="form-control form-control-sm rounded-2 text-end fw-bold"
                                                                    placeholder="13500"
                                                                    value={it.amount}
                                                                    onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveItemRow(idx)}
                                                                    className="btn btn-sm btn-link text-danger p-0"
                                                                    title="Remove item"
                                                                >
                                                                    <i className="ri ri-close-circle-fill fs-5"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Calculations & Summary Section */}
                                    <div className="row justify-content-end mb-4">
                                        <div className="col-12 col-md-6 col-lg-5">
                                            <div className="card border rounded-4 p-3 bg-light shadow-2xs">
                                                {/* Subtotal */}
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="fw-semibold text-dark">Total Item Amount:</span>
                                                    <strong className="fs-6 text-dark">₹{invoiceForm.subtotal}</strong>
                                                </div>

                                                {/* GST */}
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="small text-muted">Add GST (%):</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="28"
                                                            className="form-control form-control-sm rounded-2 text-center p-1"
                                                            style={{ width: '60px' }}
                                                            value={invoiceForm.gst_percent}
                                                            onChange={(e) => handleFinancialChange('gst_percent', e.target.value)}
                                                        />
                                                    </div>
                                                    <span className="small font-monospace">₹{invoiceForm.gst_amount}</span>
                                                </div>

                                                {/* Discount */}
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="small text-muted">Less Discount (₹):</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="form-control form-control-sm rounded-2 text-end p-1"
                                                        style={{ width: '100px' }}
                                                        value={invoiceForm.discount_amount}
                                                        onChange={(e) => handleFinancialChange('discount_amount', e.target.value)}
                                                    />
                                                </div>

                                                {/* Advance Received */}
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <div>
                                                        <span className="small text-muted d-block">Advance Received (-):</span>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm rounded-2 p-1"
                                                            style={{ width: '110px', fontSize: '11px' }}
                                                            placeholder="e.g. 700/pax"
                                                            value={invoiceForm.advance_note}
                                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, advance_note: e.target.value })}
                                                        />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="form-control form-control-sm rounded-2 text-end p-1 text-success fw-bold"
                                                        style={{ width: '100px' }}
                                                        value={invoiceForm.advance_received}
                                                        onChange={(e) => handleFinancialChange('advance_received', e.target.value)}
                                                    />
                                                </div>

                                                {/* Total Due Amount */}
                                                <div className="d-flex justify-content-between align-items-center pt-2 border-top border-2 border-dark">
                                                    <strong className="fs-6 text-dark">Total Due Amount:</strong>
                                                    <strong className="fs-5 text-danger font-monospace">
                                                        ₹{invoiceForm.total_due_amount}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bank Details & Terms & Conditions Preview */}
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Bank Account Details (Printed on Invoice)</label>
                                            <textarea
                                                className="form-control rounded-3 font-monospace small"
                                                rows="3"
                                                value={invoiceForm.bank_details_text}
                                                onChange={(e) => setInvoiceForm({ ...invoiceForm, bank_details_text: e.target.value })}
                                            ></textarea>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Terms &amp; Conditions (Printed on Invoice)</label>
                                            <textarea
                                                className="form-control rounded-3 fst-italic small"
                                                rows="3"
                                                value={invoiceForm.terms_text}
                                                onChange={(e) => setInvoiceForm({ ...invoiceForm, terms_text: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setCreateModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingInvoice}
                                        className="btn btn-primary rounded-pill px-5 d-inline-flex align-items-center gap-2 shadow-sm"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    >
                                        {submittingInvoice ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Generating Invoice...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-printer-fill"></i>
                                                <span>Generate &amp; Save Invoice</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. PRINT & VIEW MODAL (Exact Matching Invoice-30018.pdf) */}
            {printModalOpen && selectedInvoiceToPrint && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-file-paper-2-fill text-primary"></i>
                                        <span>Invoice {selectedInvoiceToPrint.invoice_no}</span>
                                    </h5>
                                    <small className="text-muted">Print, save as PDF, or share with tourist</small>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => printInvoiceDocument({ invoice: selectedInvoiceToPrint, config: invoiceConfig })}
                                        className="btn btn-primary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    >
                                        <i className="ri ri-printer-fill"></i>
                                        <span>Print / Save PDF</span>
                                    </button>
                                    <button type="button" className="btn-close" onClick={() => setPrintModalOpen(false)} aria-label="Close"></button>
                                </div>
                            </div>

                            {/* Modal Body - Printable Document */}
                            <div className="modal-body p-3 bg-secondary bg-opacity-10" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                <div className="shadow-sm rounded-3 overflow-hidden bg-white mx-auto border" style={{ maxWidth: '820px' }}>
                                    <InvoicePrintTemplate 
                                        invoice={selectedInvoiceToPrint} 
                                        config={invoiceConfig} 
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between">
                                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4" onClick={() => setPrintModalOpen(false)}>
                                    Close
                                </button>
                                <div className="d-flex gap-2">
                                    <a
                                        href={`https://wa.me/${selectedInvoiceToPrint.customer_phone}?text=${encodeURIComponent(
                                            `Hello ${selectedInvoiceToPrint.customer_name},\n\nHere is your official Safari Booking Invoice *${selectedInvoiceToPrint.invoice_no}* from *DELTA SAFARI*.\n\n` +
                                            `*Total Amount:* ₹${selectedInvoiceToPrint.subtotal}\n` +
                                            `*Advance Received:* ₹${selectedInvoiceToPrint.advance_received}\n` +
                                            `*Total Due Balance:* ₹${selectedInvoiceToPrint.total_due_amount}\n` +
                                            `*Departure Date:* ${selectedInvoiceToPrint.departure_date_text || 'As scheduled'}\n\n` +
                                            `Thank you for booking with Delta Safari!\nVisit: sundarbandeltasafari.com`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-success btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                    >
                                        <i className="ri ri-whatsapp-fill"></i>
                                        <span>Send on WhatsApp</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => printInvoiceDocument({ invoice: selectedInvoiceToPrint, config: invoiceConfig })}
                                        className="btn btn-primary btn-sm rounded-pill px-4 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    >
                                        <i className="ri ri-printer-fill"></i>
                                        <span>Print Invoice</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
