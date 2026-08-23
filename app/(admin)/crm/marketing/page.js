'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { 
    getMarketingAudienceLeadsUrl,
    createMarketingCampaignUrl,
    getMarketingCampaignsUrl,
    getMarketingCampaignDetailsUrl,
    getLeadManagersUrl
} from '@/app/routes/whatsappRoutes';
import { getAllPackageUrl } from '@/app/routes/packageRoutes';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';

export default function WhatsAppMarketingPage() {
    const user = useSelector((state) => state?.adminAuth?.user);
    const token = useSelector((state) => state?.adminAuth?.token);
    const isSuperAdmin = user?.admin === 1;

    // View Tabs: 'audience' (Leads & Campaign Creator) vs 'campaigns' (Campaign History & Scheduled)
    const [activeTab, setActiveTab] = useState('audience');

    // Audience Leads Data & Loading
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState({
        total_leads: 0,
        converted_leads: 0,
        non_converted_leads: 0,
        hot_leads: 0,
        warm_leads: 0,
        cold_leads: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(25);

    // Audience Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [conversionFilter, setConversionFilter] = useState('all'); // 'all', 'converted', 'non_converted'
    const [leadTypeFilter, setLeadTypeFilter] = useState(''); // 'hot', 'warm', 'cold', ''
    const [destinationFilter, setDestinationFilter] = useState('');
    const [dateFilterType, setDateFilterType] = useState('created_at'); // 'created_at', 'travel_date', 'next_followup', 'converted_at', 'last_followup'
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');

    // Auxiliary Data
    const [managers, setManagers] = useState([]);
    const [packageSuggestions, setPackageSuggestions] = useState([]);

    // Selection State
    const [selectedContactIds, setSelectedContactIds] = useState([]);
    const [selectAllFiltered, setSelectAllFiltered] = useState(false);

    // Campaign Modal State
    const [campaignModalOpen, setCampaignModalOpen] = useState(false);
    const [submittingCampaign, setSubmittingCampaign] = useState(false);
    const [campaignFormData, setCampaignFormData] = useState({
        campaign_name: '',
        message_text: 'Hello {{name}},\n\nDelta Safari has an exclusive offer for your upcoming Sundarban getaway! 🌿🐯\n\nBook your customized safari tour package with us and enjoy special seasonal perks & luxury stays.\n\nReply to this message to know more or book instantly!',
        media_url: '',
        media_type: 'image',
        cta_url: 'https://deltasafari.com/package',
        cta_text: 'Explore Packages',
        schedule_type: 'instant', // 'instant' or 'scheduled'
        scheduled_at: ''
    });

    // Campaign History & Logs State
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [campaignsPage, setCampaignsPage] = useState(1);
    const [campaignsTotalPages, setCampaignsTotalPages] = useState(1);
    const [campaignSearch, setCampaignSearch] = useState('');
    const [campaignStatusFilter, setCampaignStatusFilter] = useState('');

    // Campaign Details Modal
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedCampaignDetails, setSelectedCampaignDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Fetch Packages Suggestions & Managers
    useEffect(() => {
        if (!token) return;

        const loadAuxiliaryData = async () => {
            try {
                if (isSuperAdmin) {
                    const mgrRes = await axiosGet(getLeadManagersUrl, token);
                    if (mgrRes?.status && mgrRes?.data) {
                        setManagers(mgrRes.data);
                    }
                }

                const pkgRes = await axiosGet(getAllPackageUrl, token);
                if (pkgRes?.status && (pkgRes?.data || pkgRes?.data?.packages || Array.isArray(pkgRes))) {
                    const pkgs = pkgRes?.data?.packages || pkgRes?.data || pkgRes || [];
                    if (Array.isArray(pkgs)) {
                        setPackageSuggestions(pkgs);
                    }
                }
            } catch (err) {
                console.error("Error loading auxiliary data:", err);
            }
        };

        loadAuxiliaryData();
    }, [token, isSuperAdmin]);

    // Fetch Audience Leads
    const fetchAudienceLeads = async (pageToFetch = 1) => {
        if (!token) return;
        setLoadingLeads(true);

        try {
            const params = new URLSearchParams();
            params.append('page', pageToFetch);
            params.append('limit', limit);

            if (searchTerm.trim()) params.append('search', searchTerm.trim());
            if (conversionFilter && conversionFilter !== 'all') params.append('conversion_status', conversionFilter);
            if (leadTypeFilter) params.append('lead_type', leadTypeFilter);
            if (destinationFilter.trim()) params.append('destination', destinationFilter.trim());
            if (dateFilterType) params.append('date_filter_type', dateFilterType);
            if (fromDate) params.append('from_date', fromDate);
            if (toDate) params.append('to_date', toDate);
            if (isSuperAdmin && filterAssignee) params.append('assigned_to', filterAssignee);

            const res = await axiosGet(`${getMarketingAudienceLeadsUrl}?${params.toString()}`, token);

            if (res?.status && res?.data) {
                setLeads(res.data.leads || []);
                setCurrentPage(res.data.page || 1);
                setTotalPages(res.data.totalPages || 1);
                setTotalItems(res.data.total || 0);
                if (res.data.stats) {
                    setStats(res.data.stats);
                }
            } else {
                setLeads([]);
            }
        } catch (err) {
            console.error("Error fetching audience leads:", err);
            showMessage('error', err.response?.data?.msg || err.message || 'Failed to load marketing audience');
            setLeads([]);
        } finally {
            setLoadingLeads(false);
        }
    };

    // Debounced trigger for search and filters
    useEffect(() => {
        setCurrentPage(1);
        setSelectedContactIds([]);
        setSelectAllFiltered(false);
        const timer = setTimeout(() => {
            fetchAudienceLeads(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, conversionFilter, leadTypeFilter, destinationFilter, dateFilterType, fromDate, toDate, filterAssignee, token]);

    // Fetch Campaign History
    const fetchCampaigns = async (pageToFetch = 1) => {
        if (!token) return;
        setLoadingCampaigns(true);

        try {
            const params = new URLSearchParams();
            params.append('page', pageToFetch);
            params.append('limit', 20);
            if (campaignSearch.trim()) params.append('search', campaignSearch.trim());
            if (campaignStatusFilter && campaignStatusFilter !== 'all') params.append('status', campaignStatusFilter);

            const res = await axiosGet(`${getMarketingCampaignsUrl}?${params.toString()}`, token);
            if (res?.status && res?.data) {
                setCampaigns(res.data.campaigns || []);
                setCampaignsPage(res.data.page || 1);
                setCampaignsTotalPages(res.data.totalPages || 1);
            } else {
                setCampaigns([]);
            }
        } catch (err) {
            console.error("Error fetching campaigns:", err);
            setCampaigns([]);
        } finally {
            setLoadingCampaigns(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'campaigns') {
            fetchCampaigns(1);
        }
    }, [activeTab, campaignSearch, campaignStatusFilter, token]);

    // View Campaign Details
    const handleViewCampaignDetails = async (campaignId) => {
        if (!campaignId || !token) return;
        setDetailsModalOpen(true);
        setLoadingDetails(true);
        setSelectedCampaignDetails(null);

        try {
            const res = await axiosGet(`${getMarketingCampaignDetailsUrl}${campaignId}`, token);
            if (res?.status && res?.data) {
                setSelectedCampaignDetails(res.data);
            } else {
                showMessage('error', res?.msg || 'Could not fetch campaign details');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error fetching campaign details');
        } finally {
            setLoadingDetails(false);
        }
    };

    // Selection Handlers
    const isPageAllSelected = leads.length > 0 && leads.every(lead => selectedContactIds.includes(lead.contact_id));

    const handleToggleSelectPage = () => {
        if (isPageAllSelected) {
            // Deselect page leads
            const pageIds = leads.map(l => l.contact_id);
            setSelectedContactIds(prev => prev.filter(id => !pageIds.includes(id)));
            setSelectAllFiltered(false);
        } else {
            // Select page leads
            const pageIds = leads.map(l => l.contact_id);
            setSelectedContactIds(prev => Array.from(new Set([...prev, ...pageIds])));
        }
    };

    const handleToggleSelectOne = (contactId) => {
        setSelectedContactIds(prev => {
            if (prev.includes(contactId)) {
                setSelectAllFiltered(false);
                return prev.filter(id => id !== contactId);
            } else {
                return [...prev, contactId];
            }
        });
    };

    const handleClearSelection = () => {
        setSelectedContactIds([]);
        setSelectAllFiltered(false);
    };

    const handleSelectAllFilteredLeads = () => {
        setSelectAllFiltered(true);
    };

    // Open Campaign Modal
    const handleOpenCampaignModal = () => {
        if (selectedContactIds.length === 0 && !selectAllFiltered) {
            showMessage('warning', 'Please select at least one lead recipient to launch a campaign.');
            return;
        }

        // Set default campaign name with timestamp
        const now = new Date();
        const defaultName = `Campaign_${now.toLocaleDateString('en-GB').replace(/\//g, '')}_${now.getHours()}${now.getMinutes()}`;

        // Default scheduled time (1 hour from now)
        const defaultScheduleTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

        setCampaignFormData(prev => ({
            ...prev,
            campaign_name: prev.campaign_name || defaultName,
            scheduled_at: defaultScheduleTime
        }));

        setCampaignModalOpen(true);
    };

    // Insert tag helper in message text
    const handleInsertTag = (tag) => {
        setCampaignFormData(prev => ({
            ...prev,
            message_text: prev.message_text + ` ${tag}`
        }));
    };

    // Submit Campaign
    const handleConfirmLaunchCampaign = async (e) => {
        e.preventDefault();

        if (!campaignFormData.campaign_name.trim()) {
            showMessage('error', 'Campaign name is required.');
            return;
        }
        if (!campaignFormData.message_text.trim()) {
            showMessage('error', 'Message text is required.');
            return;
        }
        if (campaignFormData.schedule_type === 'scheduled' && !campaignFormData.scheduled_at) {
            showMessage('error', 'Please select date and time for scheduled campaign.');
            return;
        }

        setSubmittingCampaign(true);

        try {
            const filterParams = selectAllFiltered ? {
                search: searchTerm,
                conversion_status: conversionFilter,
                lead_type: leadTypeFilter,
                destination: destinationFilter,
                date_filter_type: dateFilterType,
                from_date: fromDate,
                to_date: toDate,
                assigned_to: filterAssignee
            } : {};

            const payload = {
                campaign_name: campaignFormData.campaign_name,
                message_text: campaignFormData.message_text,
                media_url: campaignFormData.media_url,
                media_type: campaignFormData.media_type,
                cta_url: campaignFormData.cta_url,
                cta_text: campaignFormData.cta_text,
                schedule_type: campaignFormData.schedule_type,
                scheduled_at: campaignFormData.schedule_type === 'scheduled' ? campaignFormData.scheduled_at : null,
                recipient_ids: selectAllFiltered ? [] : selectedContactIds,
                target_all_filtered: selectAllFiltered,
                filter_params: filterParams
            };

            const res = await axiosPost(createMarketingCampaignUrl, payload, token);

            if (res?.status) {
                showMessage('success', res?.msg || 'WhatsApp campaign processed successfully!');
                setCampaignModalOpen(false);
                handleClearSelection();
                fetchAudienceLeads(currentPage);
                if (activeTab === 'campaigns') {
                    fetchCampaigns(1);
                }
            } else {
                showMessage('error', res?.msg || 'Failed to launch campaign.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error executing campaign.');
        } finally {
            setSubmittingCampaign(false);
        }
    };

    // Helper functions
    const formatDateTime = (str) => {
        if (!str) return '—';
        try {
            const d = new Date(str);
            if (isNaN(d.getTime())) return String(str);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return String(str);
        }
    };

    const formatDateOnly = (str) => {
        if (!str) return '—';
        try {
            const d = new Date(str);
            if (isNaN(d.getTime())) return String(str);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return String(str);
        }
    };

    const getAvatarColor = (nameStr = '') => {
        const colors = ['#0066cc', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#3b82f6'];
        let hash = 0;
        for (let i = 0; i < nameStr.length; i++) {
            hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const effectiveSelectedCount = selectAllFiltered ? totalItems : selectedContactIds.length;

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* 1. Header Banner */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-megaphone-fill text-info fs-3"></i>
                        <span>WhatsApp Marketing &amp; Broadcast Campaigns</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Segment converted and pipeline leads, craft personalized promotional campaigns, and broadcast or schedule WhatsApp marketing messages.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        type="button"
                        onClick={handleOpenCampaignModal}
                        disabled={effectiveSelectedCount === 0}
                        className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri ri-send-plane-fill"></i>
                        <span>Create Campaign ({effectiveSelectedCount})</span>
                    </button>
                </div>
            </div>

            {/* 2. Top Metric KPI Summary Cards */}
            <div className="row g-3 mb-4">
                {/* Total Audience */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm rounded-4 h-100 p-3 ${conversionFilter === 'all' ? 'border-2 border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setConversionFilter('all'); setLeadTypeFilter(''); }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small fw-semibold">Total Audience</span>
                            <span className="badge bg-label-primary rounded-pill p-1.5">
                                <i className="ri ri-group-fill fs-5"></i>
                            </span>
                        </div>
                        <h4 className="fw-bold text-dark mb-0">{stats.total_leads}</h4>
                        <small className="text-muted" style={{ fontSize: '11.5px' }}>All WhatsApp contacts</small>
                    </div>
                </div>

                {/* Converted Leads (Won Deals) */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm rounded-4 h-100 p-3 ${conversionFilter === 'converted' ? 'border-2 border-success bg-success bg-opacity-10' : 'bg-white'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setConversionFilter('converted'); setLeadTypeFilter(''); }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-success small fw-bold">🎉 Converted</span>
                            <span className="badge bg-label-success rounded-pill p-1.5">
                                <i className="ri ri-trophy-fill fs-5"></i>
                            </span>
                        </div>
                        <h4 className="fw-bold text-success mb-0">{stats.converted_leads}</h4>
                        <small className="text-muted" style={{ fontSize: '11.5px' }}>Closed deals &amp; tourists</small>
                    </div>
                </div>

                {/* Non-Converted Active Pipeline */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm rounded-4 h-100 p-3 ${conversionFilter === 'non_converted' ? 'border-2 border-warning bg-warning bg-opacity-10' : 'bg-white'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setConversionFilter('non_converted'); setLeadTypeFilter(''); }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-warning small fw-bold">⏳ In Follow-up</span>
                            <span className="badge bg-label-warning rounded-pill p-1.5">
                                <i className="ri ri-time-fill fs-5"></i>
                            </span>
                        </div>
                        <h4 className="fw-bold text-warning mb-0">{stats.non_converted_leads}</h4>
                        <small className="text-muted" style={{ fontSize: '11.5px' }}>Active leads pipeline</small>
                    </div>
                </div>

                {/* Hot Leads */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm rounded-4 h-100 p-3 ${leadTypeFilter === 'hot' ? 'border-2 border-danger bg-danger bg-opacity-10' : 'bg-white'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setLeadTypeFilter('hot'); }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-danger small fw-bold">🔥 Hot Leads</span>
                            <span className="badge bg-label-danger rounded-pill p-1.5">
                                <i className="ri ri-fire-fill fs-5"></i>
                            </span>
                        </div>
                        <h4 className="fw-bold text-danger mb-0">{stats.hot_leads}</h4>
                        <small className="text-muted" style={{ fontSize: '11.5px' }}>Ready to book</small>
                    </div>
                </div>

                {/* Warm Leads */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm rounded-4 h-100 p-3 ${leadTypeFilter === 'warm' ? 'border-2 border-info bg-info bg-opacity-10' : 'bg-white'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setLeadTypeFilter('warm'); }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-info small fw-bold">☀️ Warm Leads</span>
                            <span className="badge bg-label-info rounded-pill p-1.5">
                                <i className="ri ri-sun-fill fs-5"></i>
                            </span>
                        </div>
                        <h4 className="fw-bold text-info mb-0">{stats.warm_leads}</h4>
                        <small className="text-muted" style={{ fontSize: '11.5px' }}>Interested prospects</small>
                    </div>
                </div>

                {/* Cold Leads */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm rounded-4 h-100 p-3 ${leadTypeFilter === 'cold' ? 'border-2 border-secondary bg-secondary bg-opacity-10' : 'bg-white'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setLeadTypeFilter('cold'); }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-secondary small fw-bold">❄️ Cold Leads</span>
                            <span className="badge bg-label-secondary rounded-pill p-1.5">
                                <i className="ri ri-temp-cold-fill fs-5"></i>
                            </span>
                        </div>
                        <h4 className="fw-bold text-secondary mb-0">{stats.cold_leads}</h4>
                        <small className="text-muted" style={{ fontSize: '11.5px' }}>General inquiries</small>
                    </div>
                </div>
            </div>

            {/* 3. Main Navigation Tabs */}
            <div className="nav-align-top mb-4">
                <ul className="nav nav-pills gap-2 border-0">
                    <li className="nav-item">
                        <button
                            type="button"
                            className={`nav-link rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 ${activeTab === 'audience' ? 'active shadow-sm' : 'bg-white text-muted'}`}
                            onClick={() => setActiveTab('audience')}
                        >
                            <i className="ri ri-user-shared-line"></i>
                            <span>1. Segment Audience &amp; Leads</span>
                            <span className="badge bg-light text-dark rounded-pill px-2 ms-1">{totalItems}</span>
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            type="button"
                            className={`nav-link rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 ${activeTab === 'campaigns' ? 'active shadow-sm' : 'bg-white text-muted'}`}
                            onClick={() => setActiveTab('campaigns')}
                        >
                            <i className="ri ri-history-line"></i>
                            <span>2. Campaign History &amp; Broadcasts</span>
                        </button>
                    </li>
                </ul>
            </div>

            {/* TAB 1: AUDIENCE & LEAD SEGMENTATION */}
            {activeTab === 'audience' && (
                <>
                    {/* 4. Advanced Filter Toolbar */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-3.5">
                            <div className="row g-3 align-items-center">
                                {/* Search Bar */}
                                <div className="col-12 col-lg-3">
                                    <div className="input-group input-group-merge">
                                        <span className="input-group-text bg-light border-end-0">
                                            <i className="ri ri-search-line text-muted"></i>
                                        </span>
                                        <input 
                                            type="text" 
                                            className="form-control bg-light border-start-0 ps-0" 
                                            placeholder="Search name, phone, package..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button 
                                                className="btn btn-sm btn-light border-0" 
                                                type="button"
                                                onClick={() => setSearchTerm('')}
                                            >
                                                <i className="ri ri-close-line"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Conversion Status (Extra Filter as requested) */}
                                <div className="col-12 col-sm-6 col-lg-2">
                                    <select
                                        className="form-select bg-light"
                                        value={conversionFilter}
                                        onChange={(e) => setConversionFilter(e.target.value)}
                                    >
                                        <option value="all">⭐ All Leads (Converted + Active)</option>
                                        <option value="converted">🎉 Converted Leads Only (Won)</option>
                                        <option value="non_converted">⏳ Non-Converted Only (In Follow-up)</option>
                                    </select>
                                </div>

                                {/* Lead Classification (Temperature) */}
                                <div className="col-12 col-sm-6 col-lg-2">
                                    <select
                                        className="form-select bg-light"
                                        value={leadTypeFilter}
                                        onChange={(e) => setLeadTypeFilter(e.target.value)}
                                    >
                                        <option value="">🔥 Temperature: All</option>
                                        <option value="hot">🔥 Hot Leads</option>
                                        <option value="warm">☀️ Warm Leads</option>
                                        <option value="cold">❄️ Cold Leads</option>
                                    </select>
                                </div>

                                {/* Date Filter Type */}
                                <div className="col-6 col-lg-2">
                                    <select 
                                        className="form-select bg-light"
                                        value={dateFilterType}
                                        onChange={(e) => setDateFilterType(e.target.value)}
                                    >
                                        <option value="created_at">Date: Lead Added</option>
                                        <option value="travel_date">Date: Travel Date</option>
                                        <option value="converted_at">Date: Converted Date</option>
                                        <option value="next_followup">Date: Next Follow-up</option>
                                    </select>
                                </div>

                                {/* From & To Date */}
                                <div className="col-6 col-lg-3">
                                    <div className="input-group">
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm bg-light" 
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            title="From Date"
                                        />
                                        <span className="input-group-text bg-light text-muted px-1.5" style={{ fontSize: '11px' }}>to</span>
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm bg-light" 
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            title="To Date"
                                        />
                                    </div>
                                </div>

                                {/* Super Admin Assignee Filter */}
                                {isSuperAdmin && (
                                    <div className="col-12 col-sm-6 col-lg-3">
                                        <select 
                                            className="form-select form-select-sm bg-light"
                                            value={filterAssignee}
                                            onChange={(e) => setFilterAssignee(e.target.value)}
                                        >
                                            <option value="">👤 Assigned Staff: All</option>
                                            <option value="unassigned">⚠️ Unassigned Leads</option>
                                            {managers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.first_name} {m.last_name || ''} ({m.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Destination Filter */}
                                <div className="col-12 col-sm-6 col-lg-3">
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm bg-light"
                                        placeholder="Filter by Travel Destination..."
                                        value={destinationFilter}
                                        onChange={(e) => setDestinationFilter(e.target.value)}
                                    />
                                </div>

                                {/* Reset Filter Button */}
                                <div className="col-auto ms-auto">
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setConversionFilter('all');
                                            setLeadTypeFilter('');
                                            setDestinationFilter('');
                                            setFromDate('');
                                            setToDate('');
                                            setFilterAssignee('');
                                        }}
                                    >
                                        <i className="ri ri-refresh-line me-1"></i> Reset Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Bulk Selection Banner (when leads are selected) */}
                    {effectiveSelectedCount > 0 && (
                        <div className="alert alert-primary bg-primary bg-opacity-10 border-primary border-opacity-25 rounded-4 p-3 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3 shadow-xs">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="badge bg-primary rounded-pill px-3 py-1.5 fw-bold fs-6">
                                    <i className="ri ri-checkbox-multiple-line me-1"></i>
                                    {effectiveSelectedCount} Leads Selected
                                </span>
                                {selectAllFiltered ? (
                                    <span className="small text-muted">
                                        All <strong>{totalItems}</strong> matching filtered leads across all pages will receive this campaign.
                                    </span>
                                ) : (
                                    <span className="small text-muted">
                                        {selectedContactIds.length} leads selected on this page.
                                        {totalItems > selectedContactIds.length && (
                                            <button 
                                                type="button" 
                                                onClick={handleSelectAllFilteredLeads}
                                                className="btn btn-link btn-sm text-primary fw-bold text-decoration-underline p-0 ms-2"
                                            >
                                                Select all {totalItems} matching filtered leads
                                            </button>
                                        )}
                                    </span>
                                )}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleClearSelection}
                                    className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                                >
                                    Clear Selection
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenCampaignModal}
                                    className="btn btn-primary btn-sm rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
                                    style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                >
                                    <i className="ri ri-send-plane-fill"></i>
                                    <span>Launch Campaign ({effectiveSelectedCount})</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 6. Audience Leads Table */}
                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                        <div className="table-responsive text-nowrap">
                            {loadingLeads ? (
                                <div className="p-5 text-center">
                                    <LoadingComponent />
                                    <p className="text-muted small mt-2">Loading marketing audience leads...</p>
                                </div>
                            ) : leads.length === 0 ? (
                                <div className="p-5 text-center">
                                    <NotFound />
                                    <p className="text-muted mt-3">No leads found matching your criteria.</p>
                                </div>
                            ) : (
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '40px' }} className="ps-3">
                                                <div className="form-check m-0">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={isPageAllSelected}
                                                        onChange={handleToggleSelectPage}
                                                        title="Select/Deselect all on this page"
                                                    />
                                                </div>
                                            </th>
                                            <th>Lead &amp; Contact Info</th>
                                            <th>Conversion Status</th>
                                            <th>Temperature</th>
                                            <th>Package &amp; Deal Rate</th>
                                            <th>Destination &amp; Date</th>
                                            {isSuperAdmin && <th>Assigned Staff</th>}
                                            <th className="pe-3 text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.map((item) => {
                                            const isSelected = selectAllFiltered || selectedContactIds.includes(item.contact_id);
                                            const avatarBg = getAvatarColor(item.name);
                                            const initials = (item.name || 'WA')
                                                .split(' ')
                                                .map(n => n[0])
                                                .join('')
                                                .toUpperCase()
                                                .substring(0, 2);

                                            return (
                                                <tr key={item.contact_id} className={isSelected ? 'table-primary bg-opacity-25' : ''}>
                                                    {/* Select Checkbox */}
                                                    <td className="ps-3">
                                                        <div className="form-check m-0">
                                                            <input 
                                                                className="form-check-input" 
                                                                type="checkbox" 
                                                                checked={isSelected}
                                                                onChange={() => handleToggleSelectOne(item.contact_id)}
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Contact Name & Phone */}
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2.5">
                                                            <div 
                                                                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                                                style={{ width: '36px', height: '36px', backgroundColor: avatarBg, fontSize: '12px' }}
                                                            >
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <span className="fw-semibold text-dark d-block">
                                                                    {item.name || 'WhatsApp Customer'}
                                                                </span>
                                                                <div className="d-flex align-items-center gap-2">
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
                                                                        <span className="small text-muted">
                                                                            • {item.email}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Conversion Status */}
                                                    <td>
                                                        {item.is_converted == 1 ? (
                                                            <div>
                                                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 fw-bold">
                                                                    <i className="ri ri-trophy-fill text-warning"></i>
                                                                    <span>🎉 Won Deal</span>
                                                                </span>
                                                                {item.converted_at && (
                                                                    <small className="text-muted d-block mt-0.5" style={{ fontSize: '11px' }}>
                                                                        {formatDateOnly(item.converted_at)}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="badge bg-secondary bg-opacity-10 text-secondary border rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1">
                                                                <i className="ri ri-time-line"></i>
                                                                <span>Active Follow-up</span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Temperature */}
                                                    <td>
                                                        {item.lead_type === 'hot' && (
                                                            <span className="badge bg-danger rounded-pill px-2.5 py-1">🔥 Hot</span>
                                                        )}
                                                        {item.lead_type === 'warm' && (
                                                            <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1">☀️ Warm</span>
                                                        )}
                                                        {item.lead_type === 'cold' && (
                                                            <span className="badge bg-info text-white rounded-pill px-2.5 py-1">❄️ Cold</span>
                                                        )}
                                                    </td>

                                                    {/* Package & Agreed Rate */}
                                                    <td>
                                                        {item.package_name ? (
                                                            <div>
                                                                <span className="fw-semibold text-dark d-block small text-truncate" style={{ maxWidth: '200px' }} title={item.package_name}>
                                                                    {item.package_name}
                                                                </span>
                                                                {(item.converted_amount || item.package_rate) && (
                                                                    <span className="badge bg-light text-dark border px-2 py-0.5 rounded-pill small">
                                                                        ₹{item.converted_amount || item.package_rate}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted small fst-italic">Custom Safari</span>
                                                        )}
                                                    </td>

                                                    {/* Destination & Travel Date */}
                                                    <td>
                                                        <span className="text-dark small d-block">
                                                            {item.travel_destination || 'Sundarban Safari'}
                                                        </span>
                                                        {item.travel_date ? (
                                                            <small className="text-muted" style={{ fontSize: '11px' }}>
                                                                <i className="ri ri-calendar-line me-1"></i>
                                                                {formatDateOnly(item.travel_date)} ({item.number_of_persons || 1} pax)
                                                            </small>
                                                        ) : (
                                                            <small className="text-muted" style={{ fontSize: '11px' }}>
                                                                Date TBD
                                                            </small>
                                                        )}
                                                    </td>

                                                    {/* Super Admin Assignee */}
                                                    {isSuperAdmin && (
                                                        <td>
                                                            {item.assigned_to ? (
                                                                <span className="badge bg-light text-dark border rounded-pill px-2 py-1 small">
                                                                    {item.assigned_user_name || `Admin #${item.assigned_to}`}
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 py-1 small">
                                                                    Unassigned
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}

                                                    {/* Single Action */}
                                                    <td className="pe-3 text-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedContactIds([item.contact_id]);
                                                                setSelectAllFiltered(false);
                                                                setCampaignModalOpen(true);
                                                            }}
                                                            className="btn btn-sm btn-outline-primary rounded-pill px-2.5 d-inline-flex align-items-center gap-1 shadow-xs"
                                                            title="Broadcast to this contact"
                                                        >
                                                            <i className="ri ri-send-plane-line"></i>
                                                            <span>Message</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
                                        disabled={currentPage <= 1 || loadingLeads}
                                        onClick={() => {
                                            const prev = currentPage - 1;
                                            setCurrentPage(prev);
                                            fetchAudienceLeads(prev);
                                        }}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                        disabled={currentPage >= totalPages || loadingLeads}
                                        onClick={() => {
                                            const next = currentPage + 1;
                                            setCurrentPage(next);
                                            fetchAudienceLeads(next);
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* TAB 2: CAMPAIGN HISTORY & SCHEDULED BROADCASTS */}
            {activeTab === 'campaigns' && (
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                <i className="ri ri-history-fill text-primary"></i>
                                <span>Campaign Broadcast History</span>
                            </h5>
                            <span className="badge bg-light text-dark rounded-pill px-2.5 py-1">
                                {campaigns.length} campaigns
                            </span>
                        </div>

                        {/* Search & Status Filter */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <input 
                                type="text"
                                className="form-control form-control-sm bg-light"
                                placeholder="Search campaign name..."
                                value={campaignSearch}
                                onChange={(e) => setCampaignSearch(e.target.value)}
                                style={{ width: '220px' }}
                            />
                            <select
                                className="form-select form-select-sm bg-light"
                                value={campaignStatusFilter}
                                onChange={(e) => setCampaignStatusFilter(e.target.value)}
                                style={{ width: '160px' }}
                            >
                                <option value="all">Status: All</option>
                                <option value="completed">Completed</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="processing">Processing</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive text-nowrap">
                        {loadingCampaigns ? (
                            <div className="p-5 text-center">
                                <LoadingComponent />
                                <p className="text-muted small mt-2">Loading campaigns history...</p>
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="p-5 text-center">
                                <NotFound />
                                <p className="text-muted mt-3">No campaigns found.</p>
                            </div>
                        ) : (
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-3" style={{ width: '40px' }}>#</th>
                                        <th>Campaign Name</th>
                                        <th>Status</th>
                                        <th>Target Recipients</th>
                                        <th>Sent / Failed</th>
                                        <th>Scheduled / Sent Time</th>
                                        <th>Created By</th>
                                        <th className="pe-3 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((c, idx) => (
                                        <tr key={c.id}>
                                            <td className="ps-3 text-muted small">{idx + 1}</td>
                                            <td>
                                                <span className="fw-bold text-dark d-block">
                                                    {c.campaign_name}
                                                </span>
                                                <small className="text-muted text-truncate d-block" style={{ maxWidth: '280px' }}>
                                                    {c.message_text}
                                                </small>
                                            </td>
                                            <td>
                                                {c.status === 'completed' && (
                                                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1">
                                                        <i className="ri ri-checkbox-circle-fill me-1"></i> Completed
                                                    </span>
                                                )}
                                                {c.status === 'scheduled' && (
                                                    <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2.5 py-1">
                                                        <i className="ri ri-calendar-event-fill me-1"></i> Scheduled
                                                    </span>
                                                )}
                                                {c.status === 'processing' && (
                                                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2.5 py-1">
                                                        <i className="ri ri-loader-4-line me-1 spin"></i> Sending...
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark border px-2.5 py-1 rounded-pill fw-semibold">
                                                    {c.total_recipients} leads
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-1.5 small">
                                                    <span className="text-success fw-bold">✓ {c.total_sent} sent</span>
                                                    {c.total_failed > 0 && (
                                                        <span className="text-danger fw-bold ms-1">✗ {c.total_failed} failed</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <small className="text-dark d-block">
                                                    {c.status === 'scheduled' ? (
                                                        <span className="text-warning fw-semibold">
                                                            <i className="ri ri-time-line me-1"></i>
                                                            {formatDateTime(c.scheduled_at)}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            <i className="ri ri-check-double-line text-success me-1"></i>
                                                            {formatDateTime(c.sent_at || c.created_at)}
                                                        </span>
                                                    )}
                                                </small>
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {c.created_by_name || `Admin #${c.created_by}`}
                                                </small>
                                            </td>
                                            <td className="pe-3 text-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewCampaignDetails(c.id)}
                                                    className="btn btn-sm btn-outline-info rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-xs"
                                                >
                                                    <i className="ri ri-eye-line"></i>
                                                    <span>Details</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Campaigns Pagination */}
                    {campaignsTotalPages > 1 && (
                        <div className="card-footer bg-transparent border-top py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <span className="text-muted small">
                                Page {campaignsPage} of {campaignsTotalPages}
                            </span>
                            <div className="d-flex gap-1">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                    disabled={campaignsPage <= 1 || loadingCampaigns}
                                    onClick={() => {
                                        const prev = campaignsPage - 1;
                                        setCampaignsPage(prev);
                                        fetchCampaigns(prev);
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                    disabled={campaignsPage >= campaignsTotalPages || loadingCampaigns}
                                    onClick={() => {
                                        const next = campaignsPage + 1;
                                        setCampaignsPage(next);
                                        fetchCampaigns(next);
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 7. CREATE / LAUNCH CAMPAIGN MODAL */}
            {campaignModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#0066cc' }}>
                                <div>
                                    <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-megaphone-fill text-warning"></i>
                                        <span>Create WhatsApp Marketing Campaign</span>
                                    </h5>
                                    <small className="text-white-50">
                                        Personalize marketing broadcast to selected leads and send immediately or schedule for later.
                                    </small>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setCampaignModalOpen(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <form onSubmit={handleConfirmLaunchCampaign}>
                                <div className="modal-body p-4">
                                    <div className="row g-4">
                                        {/* Left Side: Campaign Configuration Form */}
                                        <div className="col-12 col-lg-7">
                                            {/* Audience Summary Box */}
                                            <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25 rounded-3 p-3 mb-3">
                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                    <div>
                                                        <span className="text-muted small text-uppercase fw-semibold d-block">Target Audience</span>
                                                        <strong className="text-dark fs-6">
                                                            {effectiveSelectedCount} Selected Leads Recipients
                                                        </strong>
                                                    </div>
                                                    <span className="badge bg-primary text-white rounded-pill px-3 py-1.5">
                                                        {selectAllFiltered ? 'All Filtered Leads' : `${selectedContactIds.length} Picked Leads`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 1. Campaign Name */}
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold text-dark">
                                                    Campaign Name <span className="text-danger">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control rounded-3"
                                                    placeholder="e.g. Sundarban Monsoon Special 2026, Durga Puja Early Bird"
                                                    value={campaignFormData.campaign_name}
                                                    onChange={(e) => setCampaignFormData({ ...campaignFormData, campaign_name: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            {/* Personalization Tag Chips */}
                                            <div className="mb-2">
                                                <label className="form-label small fw-semibold text-muted d-block mb-1">
                                                    Insert Dynamic Personalization Tags:
                                                </label>
                                                <div className="d-flex gap-1.5 flex-wrap">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleInsertTag('{{name}}')}
                                                        className="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1"
                                                    >
                                                        + Customer Name <code>{'{{name}}'}</code>
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleInsertTag('{{phone}}')}
                                                        className="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1"
                                                    >
                                                        + Phone <code>{'{{phone}}'}</code>
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleInsertTag('{{destination}}')}
                                                        className="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1"
                                                    >
                                                        + Destination <code>{'{{destination}}'}</code>
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleInsertTag('{{package}}')}
                                                        className="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1"
                                                    >
                                                        + Package <code>{'{{package}}'}</code>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 2. Message Body */}
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold text-dark d-flex justify-content-between align-items-center">
                                                    <span>Message Content <span className="text-danger">*</span></span>
                                                    <span className="text-muted fw-normal" style={{ fontSize: '11px' }}>
                                                        {campaignFormData.message_text.length} characters
                                                    </span>
                                                </label>
                                                <textarea 
                                                    className="form-control rounded-3 font-monospace"
                                                    rows="5"
                                                    placeholder="Enter promotional message content..."
                                                    value={campaignFormData.message_text}
                                                    onChange={(e) => setCampaignFormData({ ...campaignFormData, message_text: e.target.value })}
                                                    required
                                                ></textarea>
                                            </div>

                                            {/* 3. Media & CTA Link Details */}
                                            <div className="row g-3 mb-3">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-semibold">Media / Image URL (Optional)</label>
                                                    <input 
                                                        type="url" 
                                                        className="form-control rounded-3"
                                                        placeholder="https://example.com/banner.jpg"
                                                        value={campaignFormData.media_url}
                                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, media_url: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-semibold">CTA Button Text (Optional)</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control rounded-3"
                                                        placeholder="e.g. View Packages / Book Now"
                                                        value={campaignFormData.cta_text}
                                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, cta_text: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-semibold">CTA Destination URL (Optional)</label>
                                                    <input 
                                                        type="url" 
                                                        className="form-control rounded-3"
                                                        placeholder="https://deltasafari.com/package"
                                                        value={campaignFormData.cta_url}
                                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, cta_url: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* 4. Scheduling Options */}
                                            <div className="card bg-light border-0 rounded-3 p-3">
                                                <label className="form-label small fw-bold text-dark mb-2">
                                                    Delivery / Schedule Options
                                                </label>
                                                <div className="row g-2">
                                                    <div className="col-6">
                                                        <div className="form-check custom-option custom-option-basic">
                                                            <label className="form-check-label custom-option-content p-2 rounded-3 border w-100 bg-white" style={{ cursor: 'pointer' }}>
                                                                <input 
                                                                    className="form-check-input me-2" 
                                                                    type="radio" 
                                                                    name="schedule_type" 
                                                                    value="instant"
                                                                    checked={campaignFormData.schedule_type === 'instant'}
                                                                    onChange={(e) => setCampaignFormData({ ...campaignFormData, schedule_type: e.target.value })}
                                                                />
                                                                <span className="fw-bold d-block small">🚀 Send Immediately</span>
                                                                <span className="text-muted" style={{ fontSize: '11px' }}>Broadcast now</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="form-check custom-option custom-option-basic">
                                                            <label className="form-check-label custom-option-content p-2 rounded-3 border w-100 bg-white" style={{ cursor: 'pointer' }}>
                                                                <input 
                                                                    className="form-check-input me-2" 
                                                                    type="radio" 
                                                                    name="schedule_type" 
                                                                    value="scheduled"
                                                                    checked={campaignFormData.schedule_type === 'scheduled'}
                                                                    onChange={(e) => setCampaignFormData({ ...campaignFormData, schedule_type: e.target.value })}
                                                                />
                                                                <span className="fw-bold d-block small">📅 Schedule for Later</span>
                                                                <span className="text-muted" style={{ fontSize: '11px' }}>Pick date &amp; time</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {campaignFormData.schedule_type === 'scheduled' && (
                                                    <div className="mt-3">
                                                        <label className="form-label small fw-bold text-danger">
                                                            Scheduled Broadcast Date &amp; Time <span className="text-danger">*</span>
                                                        </label>
                                                        <input 
                                                            type="datetime-local" 
                                                            className="form-control rounded-3 border-danger"
                                                            value={campaignFormData.scheduled_at}
                                                            onChange={(e) => setCampaignFormData({ ...campaignFormData, scheduled_at: e.target.value })}
                                                            required={campaignFormData.schedule_type === 'scheduled'}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Side: Live WhatsApp Message Mockup Preview */}
                                        <div className="col-12 col-lg-5">
                                            <div className="card border-0 rounded-4 overflow-hidden shadow-sm" style={{ backgroundColor: '#e5ddd5', minHeight: '440px' }}>
                                                {/* WhatsApp Chat Header */}
                                                <div className="p-3 d-flex align-items-center gap-2" style={{ backgroundColor: '#075e54', color: '#ffffff' }}>
                                                    <i className="ri ri-whatsapp-line fs-4"></i>
                                                    <div>
                                                        <strong className="d-block text-white" style={{ fontSize: '13.5px' }}>Delta Safari WhatsApp</strong>
                                                        <small className="text-white-50" style={{ fontSize: '11px' }}>Live Campaign Preview</small>
                                                    </div>
                                                </div>

                                                {/* Chat Bubble Canvas */}
                                                <div className="p-3 d-flex flex-column gap-2" style={{ backgroundImage: 'radial-gradient(#0000000a 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                                                    <div 
                                                        className="bg-white rounded-3 p-3 shadow-xs position-relative" 
                                                        style={{ maxWidth: '90%', borderTopLeftRadius: '0px', border: '1px solid #dcdcdc' }}
                                                    >
                                                        {/* Optional Media Preview */}
                                                        {campaignFormData.media_url && (
                                                            <div className="mb-2 rounded-2 overflow-hidden bg-light" style={{ maxHeight: '160px' }}>
                                                                <img 
                                                                    src={campaignFormData.media_url} 
                                                                    alt="Media Preview" 
                                                                    className="w-100 h-100 object-fit-cover"
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Personalized Message Preview Body */}
                                                        <div className="small text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                                            {campaignFormData.message_text
                                                                .replace(/\{\{\s*name\s*\}\}/gi, 'Rohan Sharma')
                                                                .replace(/\{\{\s*phone\s*\}\}/gi, '+91 98765 43210')
                                                                .replace(/\{\{\s*destination\s*\}\}/gi, 'Sundarban Safari')
                                                                .replace(/\{\{\s*package\s*\}\}/gi, '2D1N Luxury Package')}
                                                        </div>

                                                        {/* CTA Button Link Preview */}
                                                        {campaignFormData.cta_url && (
                                                            <div className="mt-2.5 pt-2 border-top">
                                                                <a 
                                                                    href={campaignFormData.cta_url} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="btn btn-sm btn-outline-success w-100 rounded-2 py-1 small fw-bold d-inline-flex align-items-center justify-content-center gap-1"
                                                                >
                                                                    <i className="ri ri-external-link-line"></i>
                                                                    <span>{campaignFormData.cta_text || 'Open Link'}</span>
                                                                </a>
                                                            </div>
                                                        )}

                                                        <div className="text-end mt-1">
                                                            <small className="text-muted" style={{ fontSize: '10px' }}>
                                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary rounded-pill px-4" 
                                        onClick={() => setCampaignModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submittingCampaign}
                                        className="btn btn-primary rounded-pill px-5 d-inline-flex align-items-center gap-2 shadow-sm"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    >
                                        {submittingCampaign ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Processing Campaign...</span>
                                            </>
                                        ) : campaignFormData.schedule_type === 'scheduled' ? (
                                            <>
                                                <i className="ri ri-calendar-check-line"></i>
                                                <span>Schedule Campaign ({effectiveSelectedCount})</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-send-plane-fill"></i>
                                                <span>🚀 Launch Campaign Now ({effectiveSelectedCount})</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 8. CAMPAIGN DETAILS & RECIPIENTS LOG MODAL */}
            {detailsModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                                <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-information-line text-primary"></i>
                                    <span>Campaign Delivery Report</span>
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setDetailsModalOpen(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {loadingDetails ? (
                                    <div className="p-5 text-center">
                                        <LoadingComponent />
                                        <p className="text-muted small mt-2">Loading campaign delivery report...</p>
                                    </div>
                                ) : !selectedCampaignDetails ? (
                                    <div className="p-4 text-center">
                                        <NotFound />
                                        <p className="text-muted mt-2">Campaign details could not be found.</p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Campaign Meta Overview */}
                                        <div className="card bg-light border-0 rounded-3 p-3 mb-4">
                                            <div className="row g-2">
                                                <div className="col-12 col-md-6">
                                                    <span className="text-muted small d-block">Campaign Name</span>
                                                    <strong className="text-dark fs-6">{selectedCampaignDetails.campaign?.campaign_name}</strong>
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <span className="text-muted small d-block">Status</span>
                                                    <span className="badge bg-success rounded-pill px-3 py-1">
                                                        {selectedCampaignDetails.campaign?.status}
                                                    </span>
                                                </div>
                                                <div className="col-12 mt-2">
                                                    <span className="text-muted small d-block">Message Broadcasted</span>
                                                    <div className="p-2.5 bg-white border rounded-2 small font-monospace mt-1">
                                                        {selectedCampaignDetails.campaign?.message_text}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recipients Log */}
                                        <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                                            <i className="ri ri-user-shared-line text-secondary"></i>
                                            <span>Target Lead Recipients ({selectedCampaignDetails.recipients?.length || 0})</span>
                                        </h6>

                                        <div className="table-responsive">
                                            <table className="table table-sm table-hover align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Recipient</th>
                                                        <th>Phone</th>
                                                        <th>Status</th>
                                                        <th>Sent Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedCampaignDetails.recipients?.map((r) => (
                                                        <tr key={r.id}>
                                                            <td className="fw-semibold text-dark">{r.recipient_name || 'Customer'}</td>
                                                            <td className="font-monospace small">+{r.phone}</td>
                                                            <td>
                                                                {r.status === 'sent' || r.status === 'delivered' ? (
                                                                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-0.5 small">
                                                                        Sent
                                                                    </span>
                                                                ) : r.status === 'failed' ? (
                                                                    <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2 py-0.5 small" title={r.error_message}>
                                                                        Failed
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 py-0.5 small">
                                                                        Pending
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-muted small">{formatDateTime(r.sent_at || r.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light py-2.5 px-4">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary btn-sm rounded-pill px-4" 
                                    onClick={() => setDetailsModalOpen(false)}
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
