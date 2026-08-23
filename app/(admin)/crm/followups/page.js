'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
    getFollowupsListUrl, 
    getFollowupStatsUrl, 
    saveLeadFollowupUrl, 
    getFollowupLogsUrl, 
    getLeadManagersUrl 
} from '@/app/routes/whatsappRoutes';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';

export default function LeadFollowupsPage() {
    const router = useRouter();
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);
    const isSuperAdmin = user?.admin === 1;

    // Follow-up List & Stats State
    const [followups, setFollowups] = useState([]);
    const [stats, setStats] = useState({
        total_followups: 0,
        today_followups: 0,
        overdue_followups: 0,
        upcoming_followups: 0,
        hot_leads: 0,
        warm_leads: 0,
        cold_leads: 0
    });
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'hot', 'warm', 'cold'
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dateFilterType, setDateFilterType] = useState('next_followup'); // 'next_followup', 'travel_date', 'last_followup'
    const [filterAssignee, setFilterAssignee] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modals State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [logsModalOpen, setLogsModalOpen] = useState(false);
    const [savingFollowup, setSavingFollowup] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [selectedContactLogs, setSelectedContactLogs] = useState([]);
    const [selectedContactInfo, setSelectedContactInfo] = useState(null);

    // Follow-up Form State
    const [formData, setFormData] = useState({
        contact_id: null,
        lead_name: '',
        phone: '',
        email: '',
        lead_type: 'warm',
        travel_date: '',
        travel_destination: '',
        number_of_persons: 1,
        total_rooms: 1,
        next_followup_date: '',
        extra_note: ''
    });

    // Fetch Follow-up Stats
    const fetchStats = async () => {
        if (!token) return;
        setLoadingStats(true);
        try {
            const res = await axiosGet(getFollowupStatsUrl, token);
            if (res?.status && res?.stats) {
                setStats(res.stats);
            }
        } catch (err) {
            console.error('Error fetching followup stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    // Fetch Lead Managers (Super Admin only)
    const fetchLeadManagers = async () => {
        if (!token || !isSuperAdmin) return;
        try {
            const res = await axiosGet(getLeadManagersUrl, token);
            if (res?.status && Array.isArray(res.managers)) {
                setManagers(res.managers);
            }
        } catch (err) {
            console.error('Error loading lead managers:', err);
        }
    };

    // Fetch Follow-ups List
    const fetchFollowups = async (page = 1, currentTab = activeTab) => {
        if (!token) return;
        setLoading(true);
        try {
            let queryParams = [
                `page=${page}`,
                `limit=25`,
                `search=${encodeURIComponent(searchTerm || '')}`,
                `date_filter_type=${encodeURIComponent(dateFilterType)}`
            ];

            if (currentTab === 'today') {
                queryParams.push(`is_today_only=true`);
            } else if (['hot', 'warm', 'cold'].includes(currentTab)) {
                queryParams.push(`lead_type=${currentTab}`);
            }

            if (fromDate) queryParams.push(`from_date=${encodeURIComponent(fromDate)}`);
            if (toDate) queryParams.push(`to_date=${encodeURIComponent(toDate)}`);
            if (filterAssignee) queryParams.push(`assigned_to=${encodeURIComponent(filterAssignee)}`);

            const url = `${getFollowupsListUrl}?${queryParams.join('&')}`;
            const res = await axiosGet(url, token);

            if (res?.status && Array.isArray(res.followups)) {
                setFollowups(res.followups);
                setTotalPages(res.totalPages || 1);
                setTotalItems(res.total || 0);
                setCurrentPage(res.page || 1);
            } else {
                setFollowups([]);
                setTotalPages(1);
                setTotalItems(0);
            }
        } catch (err) {
            console.error('Error fetching followups:', err);
            setFollowups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchStats();
            fetchFollowups(1, activeTab);
            if (isSuperAdmin) {
                fetchLeadManagers();
            }
        }
    }, [token, user]);

    // Handle Filter Submit
    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        setCurrentPage(1);
        fetchFollowups(1, activeTab);
    };

    // Handle Quick Tab Change
    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setCurrentPage(1);
        fetchFollowups(1, tabName);
    };

    // Handle Reset Filter
    const handleResetFilter = () => {
        setSearchTerm('');
        setFromDate('');
        setToDate('');
        setDateFilterType('next_followup');
        setFilterAssignee('');
        setActiveTab('all');
        setCurrentPage(1);
        setTimeout(() => {
            fetchFollowups(1, 'all');
        }, 50);
    };

    // Open Edit/Add Follow-up Modal
    const handleOpenEditModal = (item) => {
        const formatDateVal = (d) => {
            if (!d) return '';
            try {
                return new Date(d).toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        };

        setFormData({
            contact_id: item.contact_id || item.id,
            lead_name: item.lead_name || item.name || '',
            phone: item.phone || item.wa_id || '',
            email: item.email || '',
            lead_type: item.lead_type || 'warm',
            travel_date: formatDateVal(item.travel_date),
            travel_destination: item.travel_destination || 'Sundarban',
            number_of_persons: item.number_of_persons || 2,
            total_rooms: item.total_rooms || 1,
            next_followup_date: formatDateVal(item.next_followup_date),
            extra_note: ''
        });
        setEditModalOpen(true);
    };

    // Submit Follow-up Form
    const handleSaveFollowup = async (e) => {
        e.preventDefault();
        if (!formData.contact_id) {
            showMessage('error', 'Contact ID is missing.');
            return;
        }

        setSavingFollowup(true);
        try {
            const res = await axiosPost(saveLeadFollowupUrl, formData, token);
            if (res?.status) {
                showMessage('success', 'Follow-up details updated and log created successfully.');
                setEditModalOpen(false);
                fetchFollowups(currentPage, activeTab);
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to save follow-up');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error saving follow-up');
        } finally {
            setSavingFollowup(false);
        }
    };

    // Open Audit Logs History Modal
    const handleOpenLogsModal = async (item) => {
        const contactId = item.contact_id || item.id;
        setSelectedContactInfo(item);
        setLogsModalOpen(true);
        setLoadingLogs(true);
        try {
            const res = await axiosGet(`${getFollowupLogsUrl}${contactId}`, token);
            if (res?.status && Array.isArray(res.logs)) {
                setSelectedContactLogs(res.logs);
            } else {
                setSelectedContactLogs([]);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
            setSelectedContactLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    // Helper to format date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not set';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return String(dateStr);
        }
    };

    // Helper to format timestamp
    const formatDateTime = (ts) => {
        if (!ts) return 'Just now';
        try {
            const d = new Date(ts);
            if (isNaN(d.getTime())) return String(ts);
            return d.toLocaleString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        } catch (e) {
            return String(ts);
        }
    };

    // Calculate follow-up badge status
    const getFollowupDateBadge = (dateStr) => {
        if (!dateStr) {
            return <span className="badge bg-label-secondary">No date set</span>;
        }
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const targetDate = new Date(dateStr);
            targetDate.setHours(0, 0, 0, 0);

            const diffTime = targetDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return (
                    <span className="badge bg-danger text-white px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1 shadow-xs fw-bold">
                        <i className="ri ri-alarm-warning-line"></i> Today
                    </span>
                );
            } else if (diffDays === 1) {
                return (
                    <span className="badge bg-warning text-dark px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1 shadow-xs fw-semibold">
                        <i className="ri ri-time-line"></i> Tomorrow
                    </span>
                );
            } else if (diffDays < 0) {
                return (
                    <span className="badge bg-label-danger px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1 fw-semibold">
                        <i className="ri ri-error-warning-line"></i> Overdue ({Math.abs(diffDays)}d ago)
                    </span>
                );
            } else {
                return (
                    <span className="badge bg-label-primary px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1 fw-semibold">
                        <i className="ri ri-calendar-event-line"></i> In {diffDays} days
                    </span>
                );
            }
        } catch (e) {
            return <span className="badge bg-label-secondary">{formatDate(dateStr)}</span>;
        }
    };

    // Lead type temperature badge renderer
    const getLeadTypeBadge = (type = 'warm') => {
        const norm = String(type).toLowerCase();
        if (norm === 'hot') {
            return (
                <span className="badge bg-label-danger px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1 fw-bold">
                    <i className="ri ri-fire-fill text-danger"></i> HOT LEAD
                </span>
            );
        } else if (norm === 'cold') {
            return (
                <span className="badge bg-label-info px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1 fw-bold">
                    <i className="ri ri-snowy-fill text-info"></i> COLD LEAD
                </span>
            );
        } else {
            return (
                <span className="badge bg-label-warning px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1 fw-bold">
                    <i className="ri ri-sun-fill text-warning"></i> WARM LEAD
                </span>
            );
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* 1. Header Banner */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-calendar-check-fill text-warning fs-3"></i>
                        <span>Lead Follow-ups &amp; Pipeline</span>
                        {!isSuperAdmin && (
                            <span className="badge bg-label-primary rounded-pill px-3 py-1 ms-2 small">
                                <i className="ri ri-user-star-line me-1"></i> My Follow-ups
                            </span>
                        )}
                    </h4>
                    <p className="text-muted mb-0 small">
                        Track upcoming inquiries, classify leads as Cold/Warm/Hot, record travel parameters, and manage follow-up timeline schedules.
                    </p>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Link
                        href="/crm/whatsapp"
                        className="btn btn-outline-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
                    >
                        <i className="ri ri-whatsapp-line text-success"></i>
                        <span>WhatsApp Leads Inbox</span>
                    </Link>

                    {isSuperAdmin && (
                        <Link
                            href="/crm/assign-leads"
                            className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-1.5"
                        >
                            <i className="ri ri-user-shared-line"></i>
                            <span>Lead Distribution</span>
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => { fetchFollowups(currentPage, activeTab); fetchStats(); showMessage('success', 'Refreshed follow-up leads'); }}
                        className="btn btn-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1.5"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri ri-refresh-line"></i>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* 2. Top Summary KPI Cards */}
            <div className="row g-3 mb-4">
                {/* Total Followups */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm h-100 rounded-3 cursor-pointer ${activeTab === 'all' ? 'border-primary border-2' : ''}`}
                        onClick={() => handleTabChange('all')}
                        style={{ transition: 'transform 0.15s ease' }}
                    >
                        <div className="card-body p-3">
                            <span className="text-muted small text-uppercase fw-semibold d-block">Total Leads</span>
                            <h3 className="fw-bold mb-0 text-dark mt-1">{stats.total_followups}</h3>
                            <small className="text-primary d-inline-flex align-items-center gap-1 mt-1">
                                <i className="ri ri-list-check"></i> In Pipeline
                            </small>
                        </div>
                    </div>
                </div>

                {/* Today's Followups (Highlight) */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm h-100 rounded-3 cursor-pointer ${activeTab === 'today' ? 'bg-danger text-white' : ''}`}
                        onClick={() => handleTabChange('today')}
                        style={{ 
                            backgroundColor: activeTab === 'today' ? '#dc2626' : '#fef2f2', 
                            borderColor: '#fca5a5',
                            transition: 'transform 0.15s ease' 
                        }}
                    >
                        <div className="card-body p-3">
                            <span className={`small text-uppercase fw-semibold d-block ${activeTab === 'today' ? 'text-white' : 'text-danger'}`}>
                                Today's Follow-up
                            </span>
                            <h3 className={`fw-bold mb-0 mt-1 ${activeTab === 'today' ? 'text-white' : 'text-danger'}`}>
                                {stats.today_followups}
                            </h3>
                            <small className={`d-inline-flex align-items-center gap-1 mt-1 ${activeTab === 'today' ? 'text-white-50' : 'text-danger'}`}>
                                <i className="ri ri-alarm-warning-line"></i> Due Today
                            </small>
                        </div>
                    </div>
                </div>

                {/* Overdue Followups */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div className="card border-0 shadow-sm h-100 rounded-3" style={{ backgroundColor: '#fff7ed' }}>
                        <div className="card-body p-3">
                            <span className="text-muted small text-uppercase fw-semibold d-block">Overdue</span>
                            <h3 className="fw-bold mb-0 text-dark mt-1">{stats.overdue_followups}</h3>
                            <small className="text-warning d-inline-flex align-items-center gap-1 mt-1">
                                <i className="ri ri-time-line"></i> Past Scheduled Date
                            </small>
                        </div>
                    </div>
                </div>

                {/* Hot Leads */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm h-100 rounded-3 cursor-pointer ${activeTab === 'hot' ? 'border-danger border-2' : ''}`}
                        onClick={() => handleTabChange('hot')}
                    >
                        <div className="card-body p-3">
                            <span className="text-danger small text-uppercase fw-semibold d-block">🔥 Hot Leads</span>
                            <h3 className="fw-bold mb-0 text-dark mt-1">{stats.hot_leads}</h3>
                            <small className="text-danger d-inline-flex align-items-center gap-1 mt-1">
                                High Conversion
                            </small>
                        </div>
                    </div>
                </div>

                {/* Warm Leads */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm h-100 rounded-3 cursor-pointer ${activeTab === 'warm' ? 'border-warning border-2' : ''}`}
                        onClick={() => handleTabChange('warm')}
                    >
                        <div className="card-body p-3">
                            <span className="text-warning small text-uppercase fw-semibold d-block">☀️ Warm Leads</span>
                            <h3 className="fw-bold mb-0 text-dark mt-1">{stats.warm_leads}</h3>
                            <small className="text-warning d-inline-flex align-items-center gap-1 mt-1">
                                In Discussion
                            </small>
                        </div>
                    </div>
                </div>

                {/* Cold Leads */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm h-100 rounded-3 cursor-pointer ${activeTab === 'cold' ? 'border-info border-2' : ''}`}
                        onClick={() => handleTabChange('cold')}
                    >
                        <div className="card-body p-3">
                            <span className="text-info small text-uppercase fw-semibold d-block">❄️ Cold Leads</span>
                            <h3 className="fw-bold mb-0 text-dark mt-1">{stats.cold_leads}</h3>
                            <small className="text-info d-inline-flex align-items-center gap-1 mt-1">
                                Long Term Nurture
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Comprehensive Filter Toolbar */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
                <div className="card-body p-3 p-md-4">
                    {/* Quick Filter Pill Buttons */}
                    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap border-bottom pb-3">
                        <span className="small text-muted fw-semibold me-1">Quick Filters:</span>
                        
                        <button
                            type="button"
                            onClick={() => handleTabChange('all')}
                            className={`btn btn-sm rounded-pill px-3 ${activeTab === 'all' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                        >
                            All Leads ({stats.total_followups})
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('today')}
                            className={`btn btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 ${activeTab === 'today' ? 'btn-danger text-white shadow-sm' : 'btn-outline-danger'}`}
                        >
                            <i className="ri ri-alarm-warning-fill"></i>
                            <span>Today's Follow-up ({stats.today_followups})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('hot')}
                            className={`btn btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 ${activeTab === 'hot' ? 'btn-danger shadow-sm' : 'btn-outline-secondary'}`}
                        >
                            <span>🔥 Hot ({stats.hot_leads})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('warm')}
                            className={`btn btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 ${activeTab === 'warm' ? 'btn-warning text-dark shadow-sm' : 'btn-outline-secondary'}`}
                        >
                            <span>☀️ Warm ({stats.warm_leads})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('cold')}
                            className={`btn btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 ${activeTab === 'cold' ? 'btn-info text-white shadow-sm' : 'btn-outline-secondary'}`}
                        >
                            <span>❄️ Cold ({stats.cold_leads})</span>
                        </button>
                    </div>

                    {/* Detailed Filter Form */}
                    <form onSubmit={handleFilterSubmit} className="row g-3 align-items-end">
                        {/* Search Term */}
                        <div className="col-12 col-md-3">
                            <label className="form-label small text-muted fw-semibold">Search Lead Name / Phone</label>
                            <div className="input-group">
                                <span className="input-group-text bg-transparent border-end-0">
                                    <i className="ri ri-search-line text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control rounded-end-pill border-start-0 ps-0"
                                    placeholder="Name, Phone, Destination..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Date Filter Type */}
                        <div className="col-6 col-md-2">
                            <label className="form-label small text-muted fw-semibold">Date Type</label>
                            <select 
                                className="form-select rounded-pill"
                                value={dateFilterType}
                                onChange={(e) => setDateFilterType(e.target.value)}
                            >
                                <option value="next_followup">Next Follow-up</option>
                                <option value="travel_date">Travel Date</option>
                                <option value="last_followup">Last Contacted</option>
                            </select>
                        </div>

                        {/* From Date */}
                        <div className="col-6 col-md-2">
                            <label className="form-label small text-muted fw-semibold">From Date</label>
                            <input
                                type="date"
                                className="form-control rounded-pill"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        {/* To Date */}
                        <div className="col-6 col-md-2">
                            <label className="form-label small text-muted fw-semibold">To Date</label>
                            <input
                                type="date"
                                className="form-control rounded-pill"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>

                        {/* Super Admin Assignee Filter */}
                        {isSuperAdmin && (
                            <div className="col-6 col-md-2">
                                <label className="form-label small text-muted fw-semibold">Assigned Staff</label>
                                <select
                                    className="form-select rounded-pill"
                                    value={filterAssignee}
                                    onChange={(e) => setFilterAssignee(e.target.value)}
                                >
                                    <option value="">All Staff</option>
                                    {managers.map(m => (
                                        <option key={m.user_id} value={m.user_id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="col-12 col-md-1 d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary rounded-pill flex-grow-1 d-inline-flex align-items-center justify-content-center"
                                style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                title="Apply Filters"
                            >
                                <i className="ri ri-filter-3-line"></i>
                            </button>
                            {(searchTerm || fromDate || toDate || filterAssignee || activeTab !== 'all') && (
                                <button
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="btn btn-light rounded-pill px-2.5 text-danger"
                                    title="Reset All Filters"
                                >
                                    <i className="ri ri-close-line"></i>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* 4. Follow-up Leads Table */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="card-header bg-transparent border-bottom py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                        <h5 className="mb-0 fw-bold text-heading d-flex align-items-center gap-2">
                            <span>Follow-up Leads</span>
                            <span className="badge bg-label-secondary rounded-pill px-2.5 py-0.5 small">{totalItems} leads</span>
                        </h5>
                    </div>
                </div>

                <div className="table-responsive">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted mb-0">Loading follow-ups...</p>
                        </div>
                    ) : followups.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="avatar avatar-xl rounded-circle bg-label-warning mx-auto mb-3 d-flex align-items-center justify-content-center">
                                <i className="ri ri-calendar-close-line fs-2 text-warning"></i>
                            </div>
                            <h5 className="fw-semibold mb-1">No follow-ups found</h5>
                            <p className="text-muted small mb-3">
                                {activeTab === 'today' 
                                    ? 'No follow-up calls or messages are scheduled for today.' 
                                    : 'No leads match your selected filters. Start by adding a follow-up to any WhatsApp lead.'}
                            </p>
                            <Link href="/crm/whatsapp" className="btn btn-primary btn-sm rounded-pill px-4">
                                View WhatsApp Leads
                            </Link>
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Lead &amp; Contact</th>
                                    <th>Status / Type</th>
                                    <th>Travel Details</th>
                                    <th>Next Follow-up</th>
                                    <th>Latest Note</th>
                                    {isSuperAdmin && <th>Assigned Admin</th>}
                                    <th className="text-center pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {followups.map((item) => (
                                    <tr key={item.followup_id}>
                                        {/* Lead Name & Contact */}
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center gap-2.5">
                                                <div 
                                                    className="avatar avatar-md rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                                    style={{ backgroundColor: '#0066cc', fontSize: '13px', width: '38px', height: '38px' }}
                                                >
                                                    {(item.lead_name || 'WA').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="fw-bold text-dark d-block mb-0.5">
                                                        {item.lead_name || 'WhatsApp Lead'}
                                                    </span>
                                                    <a
                                                        href={`https://wa.me/${item.phone || item.wa_id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-decoration-none small text-success font-monospace d-inline-flex align-items-center gap-1"
                                                        title="Chat on WhatsApp"
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

                                        {/* Lead Temperature Type */}
                                        <td>
                                            {getLeadTypeBadge(item.lead_type)}
                                        </td>

                                        {/* Travel Information */}
                                        <td>
                                            <div>
                                                <span className="fw-semibold text-dark d-block small">
                                                    <i className="ri ri-map-pin-2-line text-danger me-1"></i>
                                                    {item.travel_destination || 'Sundarban'}
                                                </span>
                                                <small className="text-muted d-block mt-0.5">
                                                    <i className="ri ri-calendar-line me-1"></i>
                                                    {formatDate(item.travel_date)}
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

                                        {/* Next Follow-up Date */}
                                        <td>
                                            <div>
                                                {getFollowupDateBadge(item.next_followup_date)}
                                                <small className="text-muted d-block mt-1 font-monospace" style={{ fontSize: '11.5px' }}>
                                                    {formatDate(item.next_followup_date)}
                                                </small>
                                            </div>
                                        </td>

                                        {/* Extra Note / Latest Remarks */}
                                        <td style={{ maxWidth: '240px' }}>
                                            <div 
                                                className="text-muted small text-truncate" 
                                                style={{ maxWidth: '230px' }}
                                                title={item.extra_note || 'No notes added'}
                                            >
                                                {item.extra_note || <span className="fst-italic text-muted opacity-75">No remarks</span>}
                                            </div>
                                            <small className="text-muted d-block mt-1" style={{ fontSize: '10.5px' }}>
                                                Last updated: {formatDateTime(item.last_followup_at)}
                                            </small>
                                        </td>

                                        {/* Assigned Admin (Super Admin only) */}
                                        {isSuperAdmin && (
                                            <td>
                                                {item.assigned_to ? (
                                                    <div>
                                                        <span className="badge bg-label-primary px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1 fw-semibold">
                                                            <i className="ri ri-user-follow-line text-primary"></i>
                                                            <span>{item.assigned_user_name || `Admin #${item.assigned_to}`}</span>
                                                        </span>
                                                        {item.assigned_user_email && (
                                                            <span className="text-muted d-block mt-0.5 small" style={{ fontSize: '11px' }}>
                                                                {item.assigned_user_email}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-label-warning px-2.5 py-1 rounded-pill">Unassigned</span>
                                                )}
                                            </td>
                                        )}

                                        {/* Actions */}
                                        <td className="text-center pe-4">
                                            <div className="d-inline-flex align-items-center gap-1.5">
                                                {/* Update Follow-up Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditModal(item)}
                                                    className="btn btn-sm btn-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"
                                                    style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                                    title="Update Follow-up Details"
                                                >
                                                    <i className="ri ri-edit-box-line"></i>
                                                    <span>Follow-up</span>
                                                </button>

                                                {/* History Logs Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenLogsModal(item)}
                                                    className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"
                                                    title="View Follow-up Timeline Logs"
                                                >
                                                    <i className="ri ri-history-line"></i>
                                                    <span>Logs ({item.total_followup_logs || 1})</span>
                                                </button>

                                                {/* WhatsApp Chat Link */}
                                                <Link
                                                    href="/crm/whatsapp"
                                                    className="btn btn-sm btn-outline-success rounded-circle p-1.5 d-inline-flex align-items-center justify-content-center"
                                                    title="Go to WhatsApp Chat"
                                                    style={{ width: '32px', height: '32px' }}
                                                >
                                                    <i className="ri ri-chat-1-line"></i>
                                                </Link>
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
                            Page {currentPage} of {totalPages} ({totalItems} total leads)
                        </span>
                        <div className="d-flex gap-1">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => {
                                    const prev = currentPage - 1;
                                    setCurrentPage(prev);
                                    fetchFollowups(prev, activeTab);
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
                                    fetchFollowups(next, activeTab);
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 5. Add / Update Follow-up Modal */}
            {editModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-primary text-white py-3 px-4" style={{ backgroundColor: '#0066cc' }}>
                                <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-calendar-check-line"></i>
                                    <span>Update Follow-up &amp; Lead Details</span>
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setEditModalOpen(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <form onSubmit={handleSaveFollowup}>
                                <div className="modal-body p-4">
                                    {/* 1. Lead Classification (Cold, Warm, Hot) */}
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-uppercase text-muted d-block mb-2">
                                            Lead Classification / Temperature <span className="text-danger">*</span>
                                        </label>
                                        <div className="row g-2">
                                            {/* Cold */}
                                            <div className="col-4">
                                                <input 
                                                    type="radio" 
                                                    className="btn-check" 
                                                    name="lead_type" 
                                                    id="type_cold" 
                                                    value="cold"
                                                    checked={formData.lead_type === 'cold'}
                                                    onChange={(e) => setFormData({ ...formData, lead_type: e.target.value })}
                                                />
                                                <label 
                                                    className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 ${formData.lead_type === 'cold' ? 'btn-info text-white shadow-sm' : 'btn-outline-secondary'}`}
                                                    htmlFor="type_cold"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="ri ri-snowy-fill fs-4"></i>
                                                    <span className="fw-bold">Cold Lead</span>
                                                    <small style={{ fontSize: '11px' }}>Low priority</small>
                                                </label>
                                            </div>

                                            {/* Warm */}
                                            <div className="col-4">
                                                <input 
                                                    type="radio" 
                                                    className="btn-check" 
                                                    name="lead_type" 
                                                    id="type_warm" 
                                                    value="warm"
                                                    checked={formData.lead_type === 'warm'}
                                                    onChange={(e) => setFormData({ ...formData, lead_type: e.target.value })}
                                                />
                                                <label 
                                                    className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 ${formData.lead_type === 'warm' ? 'btn-warning text-dark shadow-sm' : 'btn-outline-secondary'}`}
                                                    htmlFor="type_warm"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="ri ri-sun-fill fs-4 text-warning"></i>
                                                    <span className="fw-bold">Warm Lead</span>
                                                    <small style={{ fontSize: '11px' }}>Interested inquiry</small>
                                                </label>
                                            </div>

                                            {/* Hot */}
                                            <div className="col-4">
                                                <input 
                                                    type="radio" 
                                                    className="btn-check" 
                                                    name="lead_type" 
                                                    id="type_hot" 
                                                    value="hot"
                                                    checked={formData.lead_type === 'hot'}
                                                    onChange={(e) => setFormData({ ...formData, lead_type: e.target.value })}
                                                />
                                                <label 
                                                    className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 ${formData.lead_type === 'hot' ? 'btn-danger text-white shadow-sm' : 'btn-outline-secondary'}`}
                                                    htmlFor="type_hot"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="ri ri-fire-fill fs-4"></i>
                                                    <span className="fw-bold">Hot Lead 🔥</span>
                                                    <small style={{ fontSize: '11px' }}>Ready to book</small>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Customer Basic Info */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Lead / Customer Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control rounded-3"
                                                placeholder="e.g. Amitav Roy"
                                                value={formData.lead_name}
                                                onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Contact WhatsApp Number</label>
                                            <input 
                                                type="text" 
                                                className="form-control rounded-3 font-monospace"
                                                placeholder="e.g. 919830999888"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Email Address (Optional)</label>
                                            <input 
                                                type="email" 
                                                className="form-control rounded-3"
                                                placeholder="e.g. client@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Travel Destination</label>
                                            <input 
                                                type="text" 
                                                className="form-control rounded-3"
                                                placeholder="e.g. Sundarban Safari, Gosaba, Sajnekhali"
                                                value={formData.travel_destination}
                                                onChange={(e) => setFormData({ ...formData, travel_destination: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* 3. Travel Parameters */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold">Estimated Travel Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control rounded-3"
                                                value={formData.travel_date}
                                                onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-semibold">Number of Persons</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="form-control rounded-3"
                                                value={formData.number_of_persons}
                                                onChange={(e) => setFormData({ ...formData, number_of_persons: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-semibold">Total Rooms Required</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="form-control rounded-3"
                                                value={formData.total_rooms}
                                                onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* 4. Next Follow-up Date & Extra Note */}
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold text-danger">
                                                Next Follow-up Date <span className="text-danger">*</span>
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control rounded-3 border-primary"
                                                value={formData.next_followup_date}
                                                onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
                                                required
                                            />
                                            <small className="text-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                                                Sets the date this lead appears under "Today's Follow-up"
                                            </small>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Follow-up Note / Client Remarks</label>
                                            <textarea 
                                                className="form-control rounded-3"
                                                rows="3"
                                                placeholder="Write details discussed, package requirements, pricing quotes, client preference, or callback reminders..."
                                                value={formData.extra_note}
                                                onChange={(e) => setFormData({ ...formData, extra_note: e.target.value })}
                                            ></textarea>
                                            <small className="text-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                                                An audit log will automatically record your note with date, time, and admin user credentials.
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-3 px-4">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary rounded-pill px-4" 
                                        onClick={() => setEditModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={savingFollowup}
                                        className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-1.5"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    >
                                        {savingFollowup ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-save-line"></i>
                                                <span>Save Follow-up &amp; Log</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Follow-up Timeline Audit Logs Modal */}
            {logsModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-history-fill text-primary"></i>
                                        <span>Follow-up Audit History</span>
                                    </h5>
                                    {selectedContactInfo && (
                                        <small className="text-muted">
                                            {selectedContactInfo.lead_name || 'Customer'} • +{selectedContactInfo.phone || selectedContactInfo.wa_id}
                                        </small>
                                    )}
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setLogsModalOpen(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <div className="modal-body p-4 overflow-auto" style={{ flexGrow: 1 }}>
                                {loadingLogs ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="mt-2 text-muted mb-0">Loading timeline logs...</p>
                                    </div>
                                ) : selectedContactLogs.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="ri ri-file-list-3-line fs-2 mb-2 d-block"></i>
                                        <p>No follow-up logs recorded yet for this lead.</p>
                                    </div>
                                ) : (
                                    <div className="timeline-wrapper">
                                        <ul className="timeline list-unstyled position-relative ps-4 mb-0" style={{ borderLeft: '2px solid #e2e8f0' }}>
                                            {selectedContactLogs.map((log, idx) => (
                                                <li key={log.id || idx} className="position-relative mb-4 pb-2">
                                                    {/* Bullet circle */}
                                                    <span 
                                                        className="position-absolute rounded-circle bg-white border border-primary d-flex align-items-center justify-content-center"
                                                        style={{ 
                                                            left: '-23px', 
                                                            top: '0px', 
                                                            width: '18px', 
                                                            height: '18px', 
                                                            borderWidth: '3px !important' 
                                                        }}
                                                    ></span>

                                                    <div className="card border shadow-xs rounded-3 p-3 bg-light bg-opacity-50">
                                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                <span className="fw-bold text-dark">
                                                                    <i className="ri ri-user-line text-secondary me-1"></i>
                                                                    {log.admin_name || `Admin #${log.admin_user_id}`}
                                                                </span>
                                                                {log.admin_email && (
                                                                    <small className="text-muted font-monospace" style={{ fontSize: '11.5px' }}>
                                                                        ({log.admin_email})
                                                                    </small>
                                                                )}
                                                            </div>
                                                            <div>
                                                                {getLeadTypeBadge(log.lead_type)}
                                                            </div>
                                                        </div>

                                                        {/* Note */}
                                                        <p className="mb-2 text-dark" style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px' }}>
                                                            {log.note || 'Updated lead follow-up details.'}
                                                        </p>

                                                        {/* Snapshot Details */}
                                                        <div className="d-flex align-items-center gap-3 flex-wrap text-muted small border-top pt-2 mt-2" style={{ fontSize: '12px' }}>
                                                            {log.next_followup_date && (
                                                                <span>
                                                                    <i className="ri ri-calendar-check-line text-primary me-1"></i>
                                                                    Next Follow-up: <strong>{formatDate(log.next_followup_date)}</strong>
                                                                </span>
                                                            )}
                                                            {log.travel_destination && (
                                                                <span>
                                                                    <i className="ri ri-map-pin-line text-danger me-1"></i>
                                                                    Dest: <strong>{log.travel_destination}</strong>
                                                                </span>
                                                            )}
                                                            {log.travel_date && (
                                                                <span>
                                                                    <i className="ri ri-flight-takeoff-line text-info me-1"></i>
                                                                    Travel Date: <strong>{formatDate(log.travel_date)}</strong>
                                                                </span>
                                                            )}
                                                            <span>
                                                                <i className="ri ri-group-line me-1"></i>
                                                                {log.number_of_persons || 1} Persons / {log.total_rooms || 1} Rooms
                                                            </span>
                                                        </div>

                                                        {/* Log Timestamp */}
                                                        <div className="text-end mt-1">
                                                            <small className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                                                                <i className="ri ri-time-line me-1"></i>
                                                                {formatDateTime(log.created_at)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light py-2.5 px-4">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary btn-sm rounded-pill px-4" 
                                    onClick={() => setLogsModalOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
