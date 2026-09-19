'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    getFollowupsListUrl, 
    getFollowupStatsUrl, 
    reopenLeadUrl,
    getFollowupLogsUrl,
    getInvoiceConfigUrl,
    deleteWhatsAppContactUrl
} from '@/app/routes/whatsappRoutes';
import { axiosGet, axiosPost, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';
import InvoicePrintTemplate from '@/components/admin/invoice/InvoicePrintTemplate';
import LeadInvoicesModal from '@/components/admin/invoice/LeadInvoicesModal';
import { printInvoiceDocument } from '@/libs/printHelper';

export default function ConvertedLeadsPage() {
    const router = useRouter();
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);
    const isSuperAdmin = Number(user?.admin) === 1 || Number(user?.admin) === 2;

    const [loading, setLoading] = useState(true);
    const [convertedLeads, setConvertedLeads] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ converted_leads: 0, total_followups: 0 });

    // Delete Lead Confirmation Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState(null);
    const [deletingLead, setDeletingLead] = useState(false);

    const handleOpenDeleteModal = (item) => {
        if (!item) return;
        setLeadToDelete(item);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        const contactId = leadToDelete?.contact_id || leadToDelete?.id;
        if (!contactId) {
            setDeleteModalOpen(false);
            setLeadToDelete(null);
            return;
        }

        setDeletingLead(true);
        try {
            const res = await axiosDelete(`${deleteWhatsAppContactUrl}${contactId}`, token);
            if (res?.status) {
                showMessage('success', res.msg || 'Lead deleted successfully.');
                setDeleteModalOpen(false);
                setLeadToDelete(null);
                setConvertedLeads(prev => prev.filter(l => (l.contact_id || l.id) !== contactId));
                setTotalCount(prev => Math.max(0, prev - 1));
                setStats(prev => ({
                    ...prev,
                    converted_leads: Math.max(0, (prev.converted_leads || 1) - 1)
                }));
            } else {
                showMessage('error', res?.msg || 'Failed to delete lead.');
            }
        } catch (err) {
            console.error('Error deleting lead:', err);
            showMessage('error', 'An error occurred while deleting the lead.');
        } finally {
            setDeletingLead(false);
        }
    };

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Reopen & Logs Modals
    const [reopeningLeadId, setReopeningLeadId] = useState(null);
    const [logsModalOpen, setLogsModalOpen] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [selectedContactLogs, setSelectedContactLogs] = useState([]);
    const [selectedContactInfo, setSelectedContactInfo] = useState(null);
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    // Lead Invoices & Payment Timings Modal State
    const [leadInvoicesModalOpen, setLeadInvoicesModalOpen] = useState(false);
    const [selectedLeadForInvoices, setSelectedLeadForInvoices] = useState(null);

    // View / Print Modal State
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState(null);
    const [invoiceConfig, setInvoiceConfig] = useState(null);

    // Click outside to close actions dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.converted-actions-dropdown')) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Fetch Converted Leads
    const fetchConvertedLeads = async (page = 1) => {
        if (!token) return;
        setLoading(true);

        try {
            const queryParams = [
                `page=${page}`,
                `limit=25`,
                `is_converted=true`,
                `date_filter_type=converted_at`
            ];

            if (searchTerm.trim()) queryParams.push(`search=${encodeURIComponent(searchTerm.trim())}`);
            if (fromDate) queryParams.push(`from_date=${encodeURIComponent(fromDate)}`);
            if (toDate) queryParams.push(`to_date=${encodeURIComponent(toDate)}`);

            const url = `${getFollowupsListUrl}?${queryParams.join('&')}`;
            const res = await axiosGet(url, token);

            if (res?.status && Array.isArray(res.followups)) {
                // Strictly converted leads
                const list = res.followups.filter(f => f.is_converted == 1);
                setConvertedLeads(list);
                setTotalCount(res.total || list.length);
                setTotalPages(res.totalPages || 1);
                setCurrentPage(res.page || 1);
            } else {
                setConvertedLeads([]);
                setTotalCount(0);
            }
        } catch (err) {
            console.error('Error fetching converted leads:', err);
            setConvertedLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!token) return;
        try {
            const res = await axiosGet(getFollowupStatsUrl, token);
            if (res?.status && res?.stats) {
                setStats(res.stats);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchInvoiceConfig = async () => {
        if (!token) return;
        try {
            const res = await axiosGet(getInvoiceConfigUrl, token);
            if (res?.status && res?.data) {
                setInvoiceConfig(res.data);
            }
        } catch (e) {
            console.error('Error fetching invoice config:', e);
        }
    };

    const handleOpenLeadInvoices = (contactId, phone = '', customerName = '') => {
        setSelectedLeadForInvoices({ contactId, phone, customerName });
        setLeadInvoicesModalOpen(true);
    };

    useEffect(() => {
        if (token) {
            fetchConvertedLeads(1);
            fetchStats();
            fetchInvoiceConfig();
        }
    }, [token, user]);

    // Handle Search/Filter Submit
    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        setCurrentPage(1);
        fetchConvertedLeads(1);
    };

    const handleResetFilter = () => {
        setSearchTerm('');
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
        setTimeout(() => {
            fetchConvertedLeads(1);
        }, 50);
    };

    // Re-open Lead
    const handleReopenLead = async (item) => {
        const contactId = item.contact_id || item.id;
        const leadName = item.lead_name || item.name || 'this lead';
        if (!window.confirm(`Are you sure you want to reopen "${leadName}" and return it to the active follow-up pipeline?`)) {
            return;
        }

        setReopeningLeadId(contactId);
        try {
            const res = await axiosPost(reopenLeadUrl, { contact_id: contactId }, token);
            if (res?.status) {
                showMessage('success', 'Lead re-opened successfully and returned to active follow-ups.');
                fetchConvertedLeads(currentPage);
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to reopen lead.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error reopening lead.');
        } finally {
            setReopeningLeadId(null);
        }
    };

    // Open Logs Modal
    const handleOpenLogsModal = async (item) => {
        setSelectedContactInfo(item);
        setLogsModalOpen(true);
        setLoadingLogs(true);
        setSelectedContactLogs([]);

        try {
            const contactId = item.contact_id || item.id;
            const res = await axiosGet(`${getFollowupLogsUrl}${contactId}`, token);
            if (res?.status && Array.isArray(res.logs)) {
                setSelectedContactLogs(res.logs);
            }
        } catch (err) {
            console.error('Error loading logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not specified';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return String(dateStr);
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return String(dateStr);
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header Banner */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-trophy-fill text-warning fs-3"></i>
                        <span>🎉 Converted Leads (Closed &amp; Won Deals)</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        View all leads that were successfully marked as converted from follow-ups. These leads are archived from the daily follow-up queue.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Link href="/crm/followups" className="btn btn-outline-primary rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-xs">
                        <i className="ri ri-calendar-check-line"></i>
                        <span>Active Follow-ups</span>
                    </Link>
                    <Link href="/crm/marketing" className="btn btn-primary rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-sm" style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}>
                        <i className="ri ri-megaphone-line"></i>
                        <span>WhatsApp Marketing</span>
                    </Link>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-success bg-opacity-10 border-start border-4 border-success">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-success small fw-bold text-uppercase d-block mb-1">Total Won Bookings</span>
                                <h3 className="fw-bold text-success mb-0">{stats.converted_leads || totalCount}</h3>
                            </div>
                            <span className="badge bg-success rounded-circle p-3 text-white">
                                <i className="ri ri-trophy-fill fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Active Pipeline Leads</span>
                                <h3 className="fw-bold text-dark mb-0">{stats.total_followups || 0}</h3>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 rounded-circle p-3 text-primary">
                                <i className="ri ri-time-fill fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3.5">
                    <form onSubmit={handleFilterSubmit} className="row g-3 align-items-end">
                        <div className="col-12 col-md-4">
                            <label className="form-label small text-muted fw-semibold">Search Customer / Phone / Package</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="ri ri-search-line text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-light border-start-0 ps-0"
                                    placeholder="Search name, phone, destination, package..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="col-6 col-md-3">
                            <label className="form-label small text-muted fw-semibold">Converted From Date</label>
                            <input
                                type="date"
                                className="form-control bg-light rounded-3"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        <div className="col-6 col-md-3">
                            <label className="form-label small text-muted fw-semibold">Converted To Date</label>
                            <input
                                type="date"
                                className="form-control bg-light rounded-3"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-2 d-flex gap-2">
                            <button type="submit" className="btn btn-primary rounded-pill px-4 flex-grow-1 shadow-sm" style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}>
                                Filter
                            </button>
                            <button type="button" onClick={handleResetFilter} className="btn btn-outline-secondary rounded-pill px-3">
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Converted Leads Table */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <h5 className="mb-0 fw-bold text-success d-flex align-items-center gap-2">
                        <i className="ri ri-trophy-line fs-4 text-warning"></i>
                        <span>Won Deals &amp; Bookings ({totalCount})</span>
                    </h5>
                    <span className="badge bg-success text-white rounded-pill px-3 py-1 small">
                        Archived from daily follow-ups
                    </span>
                </div>

                <div className="table-responsive text-nowrap" style={{ minHeight: '380px' }}>
                    {loading ? (
                        <div className="p-5 text-center">
                            <LoadingComponent />
                            <p className="text-muted small mt-2">Loading converted leads...</p>
                        </div>
                    ) : convertedLeads.length === 0 ? (
                        <div className="p-5 text-center">
                            <NotFound />
                            <p className="text-muted mt-3">
                                No converted leads found matching your criteria. When you mark leads as Converted from the Follow-ups list, they will appear here.
                            </p>
                            <Link href="/crm/followups" className="btn btn-primary btn-sm rounded-pill px-4 mt-2">
                                Go to Follow-ups
                            </Link>
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Customer &amp; Contact</th>
                                    <th>Booked Package &amp; Deal Rate</th>
                                    <th>Invoices &amp; Payments</th>
                                    <th>Travel Destination &amp; Date</th>
                                    <th>Converted Date &amp; Staff</th>
                                    <th>Conversion Remarks</th>
                                    <th className="text-center pe-4" style={{ width: '80px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {convertedLeads.map((item) => (
                                    <tr key={item.followup_id} className="bg-success bg-opacity-10 border-bottom">
                                        {/* Customer Name & Contact */}
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center gap-2.5">
                                                <div 
                                                    className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                                    style={{ backgroundColor: '#16a34a', width: '38px', height: '38px', fontSize: '13px' }}
                                                >
                                                    {(item.lead_name || 'WA').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="fw-bold text-dark d-block mb-0.5 d-flex align-items-center gap-1">
                                                        <span>{item.lead_name || 'WhatsApp Customer'}</span>
                                                        <span className="badge bg-success text-white rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                                                            Won Deal
                                                        </span>
                                                    </span>
                                                    <a
                                                        href={`https://wa.me/${item.phone || item.wa_id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-decoration-none small text-success font-monospace d-inline-flex align-items-center gap-1"
                                                    >
                                                        <i className="ri ri-whatsapp-fill"></i>
                                                        <span>+{item.phone || item.wa_id}</span>
                                                    </a>
                                                    {item.email && (
                                                        <small className="text-muted d-block font-monospace" style={{ fontSize: '11px' }}>
                                                            {item.email}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Booked Package & Rate */}
                                        <td>
                                            <div>
                                                <span className="badge bg-success text-white px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1 fw-semibold mb-1">
                                                    <i className="ri ri-suitcase-fill"></i> {item.package_name || 'Safari Package'}
                                                </span>
                                                {(item.converted_amount || item.package_rate) && (
                                                    <span className="fw-bold text-dark d-block fs-6">
                                                        ₹{item.converted_amount || item.package_rate}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Invoices & Payments */}
                                        <td>
                                            <div>
                                                {Number(item.total_invoices_count) > 0 ? (
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenLeadInvoices(item.contact_id || item.id, item.phone || item.wa_id, item.lead_name || item.name)}
                                                            className="badge bg-primary text-white border-0 rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-2xs mb-1 cursor-pointer"
                                                            title="Click to view all invoices and payment history"
                                                        >
                                                            <i className="ri ri-file-list-3-line"></i>
                                                            <span>{item.total_invoices_count} Invoice{item.total_invoices_count > 1 ? 's' : ''}</span>
                                                        </button>
                                                        <div className="small">
                                                            <span className="text-success fw-bold font-monospace d-block" style={{ fontSize: '11.5px' }}>
                                                                Paid: ₹{Number(item.total_invoices_paid_amount || 0).toLocaleString('en-IN')}
                                                            </span>
                                                            {Number(item.total_invoices_due_amount) > 0 ? (
                                                                <span className="text-danger fw-semibold font-monospace d-block" style={{ fontSize: '10.5px' }}>
                                                                    Due: ₹{Number(item.total_invoices_due_amount).toLocaleString('en-IN')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-success small d-block" style={{ fontSize: '10px' }}>
                                                                    <i className="ri ri-checkbox-circle-fill me-0.5"></i>All Cleared
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.latest_payment_timing && (
                                                            <small className="text-muted d-block mt-0.5" style={{ fontSize: '10px' }} title="Latest Payment Timing">
                                                                <i className="ri ri-time-line text-success me-0.5"></i>{formatDateTime(item.latest_payment_timing)}
                                                            </small>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill px-2 py-0.5 small mb-1 d-inline-block">
                                                            No Invoices
                                                        </span>
                                                        <Link
                                                            href={`/crm/invoices?create_for_lead=${item.contact_id || item.id}`}
                                                            className="btn btn-xs btn-outline-primary rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1 text-decoration-none d-block mt-0.5"
                                                            style={{ fontSize: '11px', width: 'fit-content' }}
                                                        >
                                                            <i className="ri ri-add-line"></i>
                                                            <span>Create Invoice</span>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Travel Destination & Details */}
                                        <td>
                                            <div>
                                                <span className="fw-semibold text-dark d-block small">
                                                    <i className="ri ri-map-pin-2-line text-danger me-1"></i>
                                                    {item.travel_destination || 'Sundarban Safari'}
                                                </span>
                                                <small className="text-muted d-block mt-0.5">
                                                    <i className="ri ri-calendar-line me-1"></i>
                                                    Travel: <strong>{formatDate(item.travel_date)}</strong>
                                                </small>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <span className="badge bg-light text-dark border px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                        <i className="ri ri-group-line me-1"></i>{item.number_of_persons || 1} Persons
                                                    </span>
                                                    <span className="badge bg-light text-dark border px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                        <i className="ri ri-hotel-bed-line me-1"></i>{item.total_rooms || 1} Rooms
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Converted Date & Staff */}
                                        <td>
                                            <div>
                                                <span className="fw-semibold text-dark d-block small font-monospace">
                                                    <i className="ri ri-calendar-check-line text-success me-1"></i>
                                                    {formatDateTime(item.converted_at || item.updated_at)}
                                                </span>
                                                <small className="text-muted d-block mt-1">
                                                    By: <span className="badge bg-label-primary rounded-pill">{item.converted_by_name || item.assigned_user_name || 'Admin'}</span>
                                                </small>
                                            </div>
                                        </td>

                                        {/* Remarks */}
                                        <td style={{ maxWidth: '240px' }}>
                                            <div 
                                                className="text-dark small text-truncate" 
                                                style={{ maxWidth: '230px' }}
                                                title={item.conversion_note || item.extra_note || ''}
                                            >
                                                {item.conversion_note || item.extra_note || <span className="fst-italic text-muted opacity-75">No conversion notes</span>}
                                            </div>
                                        </td>

                                        {/* Actions Dropdown & Delete Button */}
                                        <td className="text-center pe-4" style={{ position: 'relative' }}>
                                            <div className="d-inline-flex align-items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-label-danger rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
                                                    style={{ width: '34px', height: '34px' }}
                                                    title="Delete Lead"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdownId(null);
                                                        handleOpenDeleteModal(item);
                                                    }}
                                                >
                                                    <i className="ri ri-delete-bin-line fs-6"></i>
                                                </button>
                                                <div className="dropdown converted-actions-dropdown d-inline-block position-relative">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdownId(activeDropdownId === item.followup_id ? null : item.followup_id);
                                                        }}
                                                        className={`btn btn-sm ${activeDropdownId === item.followup_id ? 'btn-primary text-white shadow-sm' : 'btn-light border'} rounded-circle p-0 d-inline-flex align-items-center justify-content-center`}
                                                        style={{ width: '34px', height: '34px', transition: 'all 0.2s ease' }}
                                                        title="More Actions"
                                                        aria-expanded={activeDropdownId === item.followup_id}
                                                    >
                                                        <i className="ri ri-more-2-fill fs-5"></i>
                                                    </button>

                                                    {activeDropdownId === item.followup_id && (
                                                        <ul
                                                            className="dropdown-menu dropdown-menu-end show border-0 shadow-lg rounded-3 py-2 position-absolute"
                                                            style={{
                                                                right: 0,
                                                                top: '100%',
                                                                marginTop: '6px',
                                                                zIndex: 1050,
                                                                minWidth: '245px',
                                                                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
                                                                border: '1px solid rgba(0,0,0,0.08)'
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {/* Invoices Portfolio or Create Invoice */}
                                                            {Number(item.total_invoices_count) > 0 ? (
                                                                <>
                                                                    <li>
                                                                        <button
                                                                            type="button"
                                                                            className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                            onClick={() => {
                                                                                setActiveDropdownId(null);
                                                                                handleOpenLeadInvoices(item.contact_id || item.id, item.phone || item.wa_id, item.lead_name || item.name);
                                                                            }}
                                                                        >
                                                                            <span className="badge bg-primary bg-opacity-10 text-primary p-1.5 rounded-2">
                                                                                <i className="ri ri-file-list-3-line fs-6"></i>
                                                                            </span>
                                                                            <div>
                                                                                <div className="fw-semibold small text-dark">View Invoices ({item.total_invoices_count})</div>
                                                                                <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Paid history &amp; exact timings</small>
                                                                            </div>
                                                                        </button>
                                                                    </li>
                                                                    <li>
                                                                        <Link
                                                                            href={`/crm/invoices?create_for_lead=${item.contact_id || item.id}`}
                                                                            className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                            onClick={() => setActiveDropdownId(null)}
                                                                        >
                                                                            <span className="badge bg-success bg-opacity-10 text-success p-1.5 rounded-2">
                                                                                <i className="ri ri-add-circle-line fs-6"></i>
                                                                            </span>
                                                                            <div>
                                                                                <div className="fw-semibold small text-dark">Create Another Invoice</div>
                                                                                <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Auto-minus already paid</small>
                                                                            </div>
                                                                        </Link>
                                                                    </li>
                                                                </>
                                                            ) : (
                                                                <li>
                                                                    <Link
                                                                        href={`/crm/invoices?create_for_lead=${item.contact_id || item.id}`}
                                                                        className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                        onClick={() => setActiveDropdownId(null)}
                                                                    >
                                                                        <span className="badge bg-primary bg-opacity-10 text-primary p-1.5 rounded-2">
                                                                            <i className="ri ri-file-list-3-line fs-6"></i>
                                                                        </span>
                                                                        <div>
                                                                            <div className="fw-semibold small text-dark">Create Invoice</div>
                                                                            <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Generate billing &amp; pay link</small>
                                                                        </div>
                                                                    </Link>
                                                                </li>
                                                            )}

                                                            {/* 2. Timeline Logs */}
                                                            <li>
                                                                <button
                                                                    type="button"
                                                                    className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                    onClick={() => {
                                                                        setActiveDropdownId(null);
                                                                        handleOpenLogsModal(item);
                                                                    }}
                                                                >
                                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary p-1.5 rounded-2">
                                                                        <i className="ri ri-history-line fs-6"></i>
                                                                    </span>
                                                                    <div>
                                                                        <div className="fw-semibold small text-dark">Follow-up Logs</div>
                                                                        <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>{item.total_followup_logs || 1} history log{(item.total_followup_logs || 1) > 1 ? 's' : ''}</small>
                                                                    </div>
                                                                </button>
                                                            </li>

                                                            {/* 3. Re-open Lead */}
                                                            <li>
                                                                <button
                                                                    type="button"
                                                                    disabled={reopeningLeadId === (item.contact_id || item.id)}
                                                                    className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start text-warning-emphasis"
                                                                    onClick={() => {
                                                                        setActiveDropdownId(null);
                                                                        handleReopenLead(item);
                                                                    }}
                                                                >
                                                                    <span className="badge bg-warning bg-opacity-15 text-warning-emphasis p-1.5 rounded-2">
                                                                        <i className="ri ri-restart-line fs-6"></i>
                                                                    </span>
                                                                    <div>
                                                                        <div className="fw-semibold small text-dark">Re-open Lead</div>
                                                                        <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Move back to active follow-ups</small>
                                                                    </div>
                                                                </button>
                                                            </li>

                                                            {/* 4. WhatsApp Chat */}
                                                            <li><hr className="dropdown-divider my-1" /></li>
                                                            <li>
                                                                <Link
                                                                    href={`/crm/whatsapp?phone=${item.phone || item.wa_id || ''}`}
                                                                    className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                    onClick={() => setActiveDropdownId(null)}
                                                                >
                                                                    <span className="badge bg-success bg-opacity-10 text-success p-1.5 rounded-2">
                                                                        <i className="ri ri-whatsapp-fill fs-6"></i>
                                                                    </span>
                                                                    <div>
                                                                        <div className="fw-semibold small text-dark">WhatsApp Chat</div>
                                                                        <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Open direct CRM chat</small>
                                                                    </div>
                                                                </Link>
                                                            </li>

                                                            {/* 5. Delete Lead */}
                                                            <li><hr className="dropdown-divider my-1" /></li>
                                                            <li>
                                                                <button
                                                                    type="button"
                                                                    className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start text-danger"
                                                                    onClick={() => {
                                                                        setActiveDropdownId(null);
                                                                        handleOpenDeleteModal(item);
                                                                    }}
                                                                >
                                                                    <span className="badge bg-danger bg-opacity-10 text-danger p-1.5 rounded-2">
                                                                        <i className="ri ri-delete-bin-line fs-6"></i>
                                                                    </span>
                                                                    <div>
                                                                        <div className="fw-semibold small text-danger">Delete Lead</div>
                                                                        <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Permanently remove lead</small>
                                                                    </div>
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </div>
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
                            Page {currentPage} of {totalPages} ({totalCount} total won deals)
                        </span>
                        <div className="d-flex gap-1">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => {
                                    const prev = currentPage - 1;
                                    setCurrentPage(prev);
                                    fetchConvertedLeads(prev);
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
                                    fetchConvertedLeads(next);
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Audit Logs Modal */}
            {logsModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                                <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-history-fill text-primary"></i>
                                    <span>Follow-up &amp; Conversion Audit History</span>
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setLogsModalOpen(false)} aria-label="Close"></button>
                            </div>

                            <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                                {loadingLogs ? (
                                    <div className="p-5 text-center">
                                        <LoadingComponent />
                                        <p className="text-muted small mt-2">Loading audit timeline...</p>
                                    </div>
                                ) : selectedContactLogs.length === 0 ? (
                                    <div className="p-4 text-center">
                                        <NotFound />
                                        <p className="text-muted mt-2">No activity history recorded yet.</p>
                                    </div>
                                ) : (
                                    <div className="timeline-activity">
                                        <ul className="list-group list-group-flush">
                                            {selectedContactLogs.map((log) => (
                                                <li key={log.id} className="list-group-item px-0 py-3 border-bottom">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="badge bg-success rounded-pill px-2.5 py-1">
                                                            {log.lead_type?.toUpperCase()}
                                                        </span>
                                                        <small className="text-muted">{formatDateTime(log.created_at)}</small>
                                                    </div>
                                                    <p className="text-dark mb-1 small">{log.note || 'Status updated'}</p>
                                                    {log.package_name && (
                                                        <small className="text-muted d-block">
                                                            Package: <strong>{log.package_name}</strong> {log.package_rate && `(₹${log.package_rate})`}
                                                        </small>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light py-2.5 px-4">
                                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4" onClick={() => setLogsModalOpen(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lead Invoices & Payment Timings Modal */}
            <LeadInvoicesModal
                isOpen={leadInvoicesModalOpen}
                onClose={() => setLeadInvoicesModalOpen(false)}
                contactId={selectedLeadForInvoices?.contactId}
                phone={selectedLeadForInvoices?.phone}
                customerName={selectedLeadForInvoices?.customerName}
                token={token}
                onCreateNewInvoice={(cId) => {
                    router.push(`/crm/invoices?create_for_lead=${cId}`);
                }}
                onViewInvoicePrint={(inv) => {
                    setSelectedInvoiceToPrint(inv);
                    setPrintModalOpen(true);
                }}
            />

            {/* View / Print Invoice Modal */}
            {printModalOpen && selectedInvoiceToPrint && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1065 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-printer-fill text-primary"></i>
                                        <span>Official Safari Invoice — {selectedInvoiceToPrint.invoice_no}</span>
                                    </h5>
                                    <small className="text-muted">
                                        Official billing receipt formatted 1:1 with Delta Safari standard
                                    </small>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setPrintModalOpen(false)} aria-label="Close"></button>
                            </div>
                            <div className="modal-body p-3 bg-secondary bg-opacity-10" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                <div id="converted-invoice-printable-wrapper" className="d-flex justify-content-center">
                                    <InvoicePrintTemplate 
                                        invoice={selectedInvoiceToPrint} 
                                        config={invoiceConfig} 
                                    />
                                </div>
                            </div>
                            <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between">
                                <button type="button" className="btn btn-outline-secondary rounded-pill px-3" onClick={() => setPrintModalOpen(false)}>
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => printInvoiceDocument('converted-invoice-printable-wrapper')} 
                                    className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                    style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                >
                                    <i className="ri ri-printer-line"></i>
                                    <span>Print / Save PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Lead Confirmation Modal */}
            {deleteModalOpen && leadToDelete && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1070 }}
                >
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-danger text-white py-3 px-4 d-flex align-items-center justify-content-between">
                                <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-delete-bin-fill fs-5"></i>
                                    <span>Delete Converted Lead</span>
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => { setDeleteModalOpen(false); setLeadToDelete(null); }}
                                    disabled={deletingLead}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <div 
                                    className="rounded-circle bg-danger bg-opacity-10 text-danger d-inline-flex align-items-center justify-content-center mb-3"
                                    style={{ width: '64px', height: '64px', fontSize: '30px' }}
                                >
                                    <i className="ri ri-alert-fill"></i>
                                </div>
                                <h6 className="fw-bold text-dark mb-2">
                                    Are you sure you want to permanently delete this lead?
                                </h6>
                                <div className="card bg-light border-0 rounded-3 p-3 text-start my-3" style={{ fontSize: '13px' }}>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">Lead Name:</span>
                                        <strong className="text-dark">{leadToDelete.lead_name || leadToDelete.name || `Lead #${leadToDelete.id}`}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">WhatsApp Phone:</span>
                                        <strong className="text-success font-monospace">+{leadToDelete.phone || leadToDelete.wa_id}</strong>
                                    </div>
                                    {leadToDelete.package_name && (
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="text-muted">Package:</span>
                                            <span className="text-dark fw-semibold">{leadToDelete.package_name}</span>
                                        </div>
                                    )}
                                    {leadToDelete.converted_deal_value && (
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="text-muted">Deal Value:</span>
                                            <strong className="text-success">₹{Number(leadToDelete.converted_deal_value).toLocaleString('en-IN')}</strong>
                                        </div>
                                    )}
                                    {leadToDelete.assigned_user_name && (
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">Assigned Admin:</span>
                                            <span className="text-primary fw-semibold">{leadToDelete.assigned_user_name}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="alert alert-warning border-0 rounded-3 text-start p-2 d-flex gap-2 align-items-start mb-0" style={{ fontSize: '12px' }}>
                                    <i className="ri ri-information-fill text-warning fs-6 mt-0.5 flex-shrink-0"></i>
                                    <span>
                                        This action will permanently delete this lead from the CRM, including follow-up history, conversation logs, and associated tasks. <strong>This action cannot be undone.</strong>
                                    </span>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-top py-2.5 px-4 d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-light rounded-pill px-4"
                                    onClick={() => { setDeleteModalOpen(false); setLeadToDelete(null); }}
                                    disabled={deletingLead}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger rounded-pill px-4 d-inline-flex align-items-center gap-1.5 shadow-sm fw-semibold"
                                    onClick={handleConfirmDelete}
                                    disabled={deletingLead}
                                >
                                    {deletingLead ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri ri-delete-bin-line"></i>
                                            <span>Yes, Delete Lead</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
