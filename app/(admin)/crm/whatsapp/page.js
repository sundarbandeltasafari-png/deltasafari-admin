'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { 
    getWhatsAppContactsUrl, 
    getWhatsAppMessagesUrl, 
    sendWhatsAppMessageUrl, 
    getWhatsAppStatsUrl, 
    getWhatsAppConfigStatusUrl,
    getLeadManagersUrl,
    assignLeadUrl,
    saveLeadFollowupUrl,
    convertLeadUrl,
    getSingleLeadFollowupUrl
} from '@/app/routes/whatsappRoutes';
import { getAllPackageUrl } from '@/app/routes/packageRoutes';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';

export default function WhatsAppLeadsPage() {
    const user = useSelector((state) => state?.adminAuth?.user);
    const token = useSelector((state) => state?.adminAuth?.token);
    const isSuperAdmin = user?.admin === 1;

    const [loading, setLoading] = useState(true);
    const [contacts, setContacts] = useState([]);
    const [stats, setStats] = useState({
        total_contacts: 0,
        total_messages: 0,
        total_inbound: 0,
        total_outbound: 0,
        today_messages: 0
    });
    const [configStatus, setConfigStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');
    const [managers, setManagers] = useState([]);
    const [packageSuggestions, setPackageSuggestions] = useState([]);

    // Follow-up Modal State
    const [followupModalOpen, setFollowupModalOpen] = useState(false);
    const [savingFollowup, setSavingFollowup] = useState(false);
    const [followupFormData, setFollowupFormData] = useState({
        contact_id: null,
        lead_name: '',
        phone: '',
        email: '',
        lead_type: 'warm',
        travel_date: '',
        travel_destination: '',
        number_of_persons: 1,
        total_rooms: 1,
        package_name: '',
        package_rate: '',
        next_followup_date: '',
        extra_note: ''
    });

    // Convert Lead Modal State
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [convertingLead, setConvertingLead] = useState(false);
    const [convertFormData, setConvertFormData] = useState({
        contact_id: null,
        lead_name: '',
        phone: '',
        email: '',
        package_name: '',
        converted_amount: '',
        travel_date: '',
        conversion_note: ''
    });

    // Chat Drawer / Modal State
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [reassigningChatContact, setReassigningChatContact] = useState(false);

    // Setup Guide Modal State
    const [showGuideModal, setShowGuideModal] = useState(false);

    const messagesEndRef = useRef(null);

    // Auto-scroll chat to bottom
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial Load
    useEffect(() => {
        fetchContacts();
        fetchStats();
        fetchPackages();
        if (isSuperAdmin) {
            fetchConfigStatus();
            fetchLeadManagers();
        }
    }, [token, user]);

    const fetchPackages = async () => {
        if (!token) return;
        try {
            const res = await axiosGet(getAllPackageUrl, token);
            if (res?.status && Array.isArray(res.packages)) {
                setPackageSuggestions(res.packages);
            }
        } catch (err) {
            console.error('Error fetching packages:', err);
        }
    };

    const fetchLeadManagers = async () => {
        if (!token || !isSuperAdmin) return;
        try {
            const res = await axiosGet(getLeadManagersUrl, token);
            if (res?.status) {
                setManagers(res.managers || []);
            }
        } catch (err) {
            console.error('Error fetching lead managers:', err);
        }
    };

    const fetchContacts = async (searchVal = searchTerm, assignVal = filterAssignee) => {
        setLoading(true);
        try {
            let url = `${getWhatsAppContactsUrl}?search=${encodeURIComponent(searchVal || '')}`;
            if (assignVal) {
                url += `&assigned_to=${encodeURIComponent(assignVal)}`;
            }
            const res = await axiosGet(url, token);
            if (res?.status && Array.isArray(res.data)) {
                setContacts(res.data);
            } else {
                setContacts([]);
            }
        } catch (err) {
            console.error("Error loading WhatsApp contacts:", err);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axiosGet(getWhatsAppStatsUrl, token);
            if (res?.status && res?.stats) {
                setStats(res.stats);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const fetchConfigStatus = async () => {
        try {
            const res = await axiosGet(getWhatsAppConfigStatusUrl, token);
            if (res?.status) {
                setConfigStatus(res);
            }
        } catch (err) {
            console.error("Error fetching config status:", err);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchContacts(searchTerm, filterAssignee);
    };

    const handleOpenChat = async (contact) => {
        setActiveContact(contact);
        setMessages([]);
        setChatLoading(true);
        setReplyText('');

        try {
            const res = await axiosGet(`${getWhatsAppMessagesUrl}${contact.id}`, token);
            if (res?.status && Array.isArray(res.messages)) {
                setMessages(res.messages);
                if (res.contact) {
                    setActiveContact(res.contact);
                }
            } else if (res?.status === false && res?.msg) {
                showMessage('error', res.msg);
                setActiveContact(null);
            }
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.message || 'Error opening chat';
            showMessage('error', errMsg);
            setActiveContact(null);
        } finally {
            setChatLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!replyText || !replyText.trim() || !activeContact) return;

        setSendingReply(true);
        const textToSend = replyText.trim();
        setReplyText('');

        try {
            const res = await axiosPost(sendWhatsAppMessageUrl, {
                contact_id: activeContact.id,
                phone_number: activeContact.wa_id,
                message_text: textToSend
            }, token);

            if (res?.status) {
                if (res.message) {
                    setMessages(prev => [...prev, res.message]);
                } else {
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        contact_id: activeContact.id,
                        sender_type: 'business',
                        message_text: textToSend,
                        created_at: new Date().toISOString()
                    }]);
                }

                showMessage('success', res.msg || 'Message sent');
                fetchContacts(searchTerm, filterAssignee);
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to send message');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error sending message');
        } finally {
            setSendingReply(false);
        }
    };

    const handleReassignActiveChatLead = async (newUserId) => {
        if (!activeContact) return;
        setReassigningChatContact(true);
        try {
            const res = await axiosPost(assignLeadUrl, {
                contact_id: activeContact.id,
                user_id: newUserId || null
            }, token);

            if (res?.status) {
                const assignedManager = managers.find(m => String(m.user_id) === String(newUserId));
                showMessage('success', newUserId ? `Lead assigned to ${assignedManager?.name || 'Admin User'}.` : 'Lead unassigned.');
                setActiveContact(prev => ({
                    ...prev,
                    assigned_to: newUserId ? Number(newUserId) : null,
                    assigned_user_name: assignedManager?.name || null
                }));
                fetchContacts(searchTerm, filterAssignee);
            } else {
                showMessage('error', res?.msg || 'Failed to reassign lead');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error reassigning lead');
        } finally {
            setReassigningChatContact(false);
        }
    };

    const handleOpenFollowupModal = async (contact) => {
        const formatDateVal = (d) => {
            if (!d) return '';
            try { return new Date(d).toISOString().split('T')[0]; } catch (e) { return ''; }
        };

        setFollowupFormData({
            contact_id: contact.id,
            lead_name: contact.name || '',
            phone: contact.wa_id || '',
            email: '',
            lead_type: 'warm',
            travel_date: '',
            travel_destination: 'Sundarban',
            number_of_persons: 2,
            total_rooms: 1,
            package_name: '',
            package_rate: '',
            next_followup_date: '',
            extra_note: ''
        });
        setFollowupModalOpen(true);

        try {
            const res = await axiosGet(`${getSingleLeadFollowupUrl}${contact.id}`, token);
            if (res?.status && res?.data?.followup) {
                const f = res.data.followup;
                setFollowupFormData({
                    contact_id: contact.id,
                    lead_name: f.lead_name || contact.name || '',
                    phone: f.phone || contact.wa_id || '',
                    email: f.email || '',
                    lead_type: f.lead_type || 'warm',
                    travel_date: formatDateVal(f.travel_date),
                    travel_destination: f.travel_destination || 'Sundarban',
                    number_of_persons: f.number_of_persons || 2,
                    total_rooms: f.total_rooms || 1,
                    package_name: f.package_name || '',
                    package_rate: f.package_rate || '',
                    next_followup_date: formatDateVal(f.next_followup_date),
                    extra_note: ''
                });
            }
        } catch (e) {}
    };

    const handleSaveFollowup = async (e) => {
        e.preventDefault();
        if (!followupFormData.contact_id) return;
        setSavingFollowup(true);
        try {
            const res = await axiosPost(saveLeadFollowupUrl, followupFormData, token);
            if (res?.status) {
                showMessage('success', 'Lead follow-up recorded successfully.');
                setFollowupModalOpen(false);
                fetchContacts(searchTerm, filterAssignee);
            } else {
                showMessage('error', res?.msg || 'Failed to save follow-up');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error saving follow-up');
        } finally {
            setSavingFollowup(false);
        }
    };

    const handleOpenConvertModal = (item) => {
        const formatDateVal = (d) => {
            if (!d) return '';
            try { return new Date(d).toISOString().split('T')[0]; } catch (e) { return ''; }
        };

        setConvertFormData({
            contact_id: item.contact_id || item.id,
            lead_name: item.lead_name || item.name || '',
            phone: item.phone || item.wa_id || '',
            email: item.email || '',
            package_name: item.package_name || '',
            converted_amount: item.package_rate || item.converted_amount || '',
            travel_date: formatDateVal(item.travel_date),
            conversion_note: ''
        });
        setConvertModalOpen(true);
    };

    const handleConfirmConvert = async (e) => {
        e.preventDefault();
        if (!convertFormData.contact_id) {
            showMessage('error', 'Contact ID is missing.');
            return;
        }

        setConvertingLead(true);
        try {
            const res = await axiosPost(convertLeadUrl, convertFormData, token);
            if (res?.status) {
                showMessage('success', '🎉 Lead marked as Converted successfully! Moved to Converted Leads section.');
                setConvertModalOpen(false);
                fetchContacts(searchTerm, filterAssignee);
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to convert lead.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error converting lead.');
        } finally {
            setConvertingLead(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Just now';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return String(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
        } catch (e) {
            return String(timestamp);
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

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* 1. Header Banner */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-whatsapp-fill text-success fs-3"></i>
                        <span>WhatsApp CRM &amp; Leads</span>
                        {!isSuperAdmin && (
                            <span className="badge bg-label-info rounded-pill px-3 py-1 ms-2 small">
                                <i className="ri ri-user-star-line me-1"></i> My Assigned Leads
                            </span>
                        )}
                    </h4>
                    <p className="text-muted mb-0 small">
                        {isSuperAdmin 
                            ? 'Manage all incoming WhatsApp leads, assign leads to staff, and chat directly in real-time.' 
                            : 'View and respond to leads assigned specifically to your account.'}
                    </p>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Link
                        href="/crm/followups"
                        className="btn btn-outline-warning btn-sm rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm text-dark fw-semibold"
                    >
                        <i className="ri ri-calendar-check-fill text-warning"></i>
                        <span>Lead Follow-ups &amp; Pipeline</span>
                    </Link>

                    {isSuperAdmin && (
                        <>
                            <Link
                                href="/crm/assign-leads"
                                className="btn btn-outline-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
                            >
                                <i className="ri ri-user-shared-line"></i>
                                <span>Lead Distribution &amp; Auto-Assign</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => setShowGuideModal(true)}
                                className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-1.5"
                            >
                                <i className="ri ri-settings-5-line"></i>
                                <span>Webhook Setup</span>
                            </button>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => { fetchContacts(searchTerm, filterAssignee); fetchStats(); showMessage('success', 'Refreshed WhatsApp leads'); }}
                        className="btn btn-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1.5"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri ri-refresh-line"></i>
                        <span>Refresh Leads</span>
                    </button>
                </div>
            </div>

            {/* 2. Top Summary KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100 rounded-3">
                        <div className="card-body p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small text-uppercase fw-semibold">{isSuperAdmin ? 'Total Leads' : 'My Assigned Leads'}</span>
                                <h3 className="fw-bold mb-0 text-dark mt-1">{stats.total_contacts || contacts.length}</h3>
                                <small className="text-success d-inline-flex align-items-center gap-1 mt-1">
                                    <i className="ri ri-user-follow-line"></i> Active Customers
                                </small>
                            </div>
                            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#eff6ff', color: '#0066cc', width: '52px', height: '52px' }}>
                                <i className="ri ri-contacts-book-2-line fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100 rounded-3">
                        <div className="card-body p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small text-uppercase fw-semibold">Total Messages</span>
                                <h3 className="fw-bold mb-0 text-dark mt-1">{stats.total_messages || 0}</h3>
                                <small className="text-primary d-inline-flex align-items-center gap-1 mt-1">
                                    <i className="ri ri-message-3-line"></i> Inbound &amp; Outbound
                                </small>
                            </div>
                            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', width: '52px', height: '52px' }}>
                                <i className="ri ri-chat-3-line fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100 rounded-3">
                        <div className="card-body p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small text-uppercase fw-semibold">Customer Queries</span>
                                <h3 className="fw-bold mb-0 text-dark mt-1">{stats.total_inbound || 0}</h3>
                                <small className="text-info d-inline-flex align-items-center gap-1 mt-1">
                                    <i className="ri ri-inbox-archive-line"></i> Incoming Inquiries
                                </small>
                            </div>
                            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', width: '52px', height: '52px' }}>
                                <i className="ri ri-question-answer-line fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100 rounded-3">
                        <div className="card-body p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small text-uppercase fw-semibold">Distribution Status</span>
                                <div className="mt-1">
                                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1">
                                        <i className="ri ri-checkbox-circle-line me-1"></i> Round-Robin Active
                                    </span>
                                </div>
                                <small className="text-muted d-block mt-1">
                                    {isSuperAdmin ? 'Auto-Assigns to Active Staff' : 'Private Lead Access Protected'}
                                </small>
                            </div>
                            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fef3c7', color: '#d97706', width: '52px', height: '52px' }}>
                                <i className="ri ri-shield-check-line fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Filter & Search Toolbar */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-body p-3">
                    <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
                        <div className={isSuperAdmin ? "col-md-5" : "col-md-9"}>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0 text-muted rounded-start-pill ps-3">
                                    <i className="ri ri-search-line"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 rounded-end-pill py-2"
                                    placeholder="Search customer name or message snippet..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {isSuperAdmin && (
                            <div className="col-md-4">
                                <select 
                                    className="form-select rounded-pill py-2"
                                    value={filterAssignee}
                                    onChange={(e) => {
                                        setFilterAssignee(e.target.value);
                                        fetchContacts(searchTerm, e.target.value);
                                    }}
                                >
                                    <option value="">All Leads (Super Admin View)</option>
                                    <option value="unassigned">Unassigned Leads Only</option>
                                    {managers.map(m => (
                                        <option key={m.user_id} value={m.user_id}>Assigned to {m.name} ({m.email})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={isSuperAdmin ? "col-md-3 d-flex gap-2" : "col-md-3 d-flex gap-2"}>
                            <button
                                type="submit"
                                className="btn btn-primary rounded-pill flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1.5"
                                style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                            >
                                <i className="ri ri-filter-3-line"></i>
                                <span>Filter</span>
                            </button>
                            {(searchTerm || filterAssignee) && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchTerm(''); setFilterAssignee(''); fetchContacts('', ''); }}
                                    className="btn btn-light rounded-pill px-3"
                                    title="Clear Filter"
                                >
                                    <i className="ri ri-close-line"></i>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* 4. Leads Table */}
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-list-check-2 text-primary"></i>
                        <span>WhatsApp Leads ({contacts.length})</span>
                    </h5>
                    <span className="badge bg-light text-muted rounded-pill px-3 py-1 small">
                        {isSuperAdmin ? 'Full Access & Distribution Console' : 'Protected Staff Lead View'}
                    </span>
                </div>

                <div className="table-responsive text-nowrap">
                    {loading ? (
                        <div className="p-5 text-center">
                            <LoadingComponent />
                            <p className="text-muted small mt-2">Loading WhatsApp leads...</p>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="p-5 text-center">
                            <NotFound />
                            <p className="text-muted mt-3">
                                {isSuperAdmin 
                                    ? 'No WhatsApp leads found matching your criteria.' 
                                    : 'No leads are currently assigned to your account. New leads will appear here as they are distributed to you.'}
                            </p>
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '50px' }} className="ps-3">#</th>
                                    <th>Contact Name</th>
                                    <th>WhatsApp Phone</th>
                                    {isSuperAdmin && <th>Assigned Admin</th>}
                                    <th>Last Message</th>
                                    <th>Last Activity</th>
                                    <th className="text-center">Messages</th>
                                    <th className="text-center pe-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((contact, idx) => {
                                    const avatarBg = getAvatarColor(contact.name || contact.wa_id);
                                    const initials = (contact.name || 'WA')
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .substring(0, 2);

                                    return (
                                        <tr key={contact.id || idx}>
                                            <td className="text-muted small ps-3">{idx + 1}</td>
                                            
                                            {/* Name with Avatar */}
                                            <td>
                                                <div className="d-flex align-items-center gap-2.5">
                                                    <div 
                                                        className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                                        style={{ width: '38px', height: '38px', backgroundColor: avatarBg, fontSize: '13px' }}
                                                    >
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <span className="fw-semibold text-dark d-block" style={{ fontSize: '14px' }}>
                                                            {contact.name || `Lead #${contact.id}`}
                                                        </span>
                                                        <small className="text-muted" style={{ fontSize: '11px' }}>
                                                            ID #{contact.id}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* WhatsApp Phone Number */}
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <a 
                                                        href={`https://wa.me/${contact.wa_id}`} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-decoration-none fw-medium text-dark d-inline-flex align-items-center gap-1.5 font-monospace"
                                                        title="Open in WhatsApp"
                                                    >
                                                        <i className="ri ri-whatsapp-fill text-success fs-5"></i>
                                                        <span>+{contact.wa_id}</span>
                                                    </a>
                                                </div>
                                            </td>

                                            {/* Assigned Admin (Super Admin only) */}
                                            {isSuperAdmin && (
                                                <td>
                                                    {contact.assigned_to ? (
                                                        <div>
                                                            <span className="badge bg-label-primary px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 fw-semibold">
                                                                <i className="ri ri-user-follow-line text-primary"></i>
                                                                <span>{contact.assigned_user_name || `Admin #${contact.assigned_to}`}</span>
                                                            </span>
                                                            {contact.assigned_user_email && (
                                                                <span className="text-muted d-block mt-0.5" style={{ fontSize: '11.5px' }}>
                                                                    {contact.assigned_user_email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="badge bg-label-warning px-3 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 fw-semibold">
                                                            <i className="ri ri-question-line text-warning"></i>
                                                            <span>Unassigned</span>
                                                        </span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Last Message Snippet */}
                                            <td style={{ maxWidth: '280px' }}>
                                                <div className="d-flex align-items-center gap-1.5 mb-1">
                                                    {contact.last_sender_type === 'business' ? (
                                                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                                                            You
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                                                            Customer
                                                        </span>
                                                    )}
                                                </div>
                                                <div 
                                                    className="text-muted text-truncate" 
                                                    style={{ fontSize: '13px', maxWidth: '260px' }}
                                                    title={contact.last_message || 'No messages yet'}
                                                >
                                                    {contact.last_message || <span className="fst-italic text-muted opacity-75">No message history</span>}
                                                </div>
                                            </td>

                                            {/* Last Activity Time */}
                                            <td>
                                                <span className="text-muted small d-inline-flex align-items-center gap-1">
                                                    <i className="ri ri-time-line text-secondary"></i>
                                                    {formatTimestamp(contact.last_message_time || contact.updated_at || contact.created_at)}
                                                </span>
                                            </td>

                                            {/* Total Message Count */}
                                            <td className="text-center">
                                                <span className="badge rounded-pill bg-light text-dark border px-2.5 py-1">
                                                    {contact.total_messages || 1} msg
                                                </span>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="text-center pe-3">
                                                <div className="d-inline-flex align-items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenConvertModal(contact)}
                                                        className="btn btn-sm btn-outline-success rounded-pill px-2.5 d-inline-flex align-items-center gap-1 shadow-xs fw-semibold"
                                                        title="Mark Lead as Converted (Won Deal)"
                                                    >
                                                        <i className="ri ri-checkbox-circle-fill text-success"></i>
                                                        <span>Convert</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenFollowupModal(contact)}
                                                        className="btn btn-sm btn-outline-warning rounded-pill px-2.5 d-inline-flex align-items-center gap-1 shadow-xs text-dark fw-semibold"
                                                        title="Add or Update Follow-up"
                                                    >
                                                        <i className="ri ri-calendar-check-line text-warning"></i>
                                                        <span>Follow-up</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenChat(contact)}
                                                        className="btn btn-sm btn-primary rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                                    >
                                                        <i className="ri ri-chat-1-line"></i>
                                                        <span>Chat</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* 5. WhatsApp Real-Time Conversation Modal */}
            {activeContact && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '780px' }}>
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ height: '85vh', maxHeight: '720px', display: 'flex', flexDirection: 'column' }}>
                            
                            {/* Modal Header (Contact Profile Bar) */}
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-3">
                                    <div 
                                        className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                        style={{ width: '42px', height: '42px', backgroundColor: getAvatarColor(activeContact.name), fontSize: '15px' }}
                                    >
                                        {(activeContact.name || 'WA').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2 flex-wrap">
                                            <span>{activeContact.name || `Lead #${activeContact.id}`}</span>
                                            {activeContact.wa_id && (
                                                <a 
                                                    href={`https://wa.me/${activeContact.wa_id}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="badge rounded-pill text-decoration-none"
                                                    style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '11px' }}
                                                    title="Open in WhatsApp"
                                                >
                                                    <i className="ri ri-external-link-line me-1"></i> +{activeContact.wa_id}
                                                </a>
                                            )}
                                        </h5>
                                        <small className="text-success d-inline-flex align-items-center gap-1">
                                            <span className="rounded-circle bg-success d-inline-block" style={{ width: '7px', height: '7px' }}></span>
                                            WhatsApp Lead Thread
                                            {activeContact.assigned_user_name && (
                                                <span className="text-muted ms-1">
                                                    • Assigned to {activeContact.assigned_user_name} {activeContact.assigned_user_email ? `(${activeContact.assigned_user_email})` : ''}
                                                </span>
                                            )}
                                        </small>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenFollowupModal(activeContact)}
                                        className="btn btn-warning btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-sm text-dark fw-semibold"
                                        title="Record Follow-up for this lead"
                                    >
                                        <i className="ri ri-calendar-check-fill"></i>
                                        <span>Follow-up</span>
                                    </button>

                                    {isSuperAdmin && managers.length > 0 && (
                                        <select 
                                            className="form-select form-select-sm rounded-pill"
                                            value={activeContact.assigned_to || ''}
                                            disabled={reassigningChatContact}
                                            onChange={(e) => handleReassignActiveChatLead(e.target.value)}
                                            style={{ width: '200px' }}
                                        >
                                            <option value="">-- Unassign Lead --</option>
                                            {managers.map(m => (
                                                <option key={m.user_id} value={m.user_id}>Assign: {m.name} ({m.email})</option>
                                            ))}
                                        </select>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleOpenChat(activeContact)}
                                        className="btn btn-light btn-sm rounded-circle p-2"
                                        title="Refresh conversation"
                                    >
                                        <i className="ri ri-refresh-line"></i>
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setActiveContact(null)}
                                        aria-label="Close"
                                    ></button>
                                </div>
                            </div>

                            {/* Modal Body: Scrollable Message Thread */}
                            <div 
                                className="modal-body p-4 flex-grow-1 overflow-y-auto"
                                style={{ backgroundColor: '#f0f2f5', backgroundImage: 'radial-gradient(#cbd5e1 0.75px, transparent 0.75px)', backgroundSize: '16px 16px' }}
                            >
                                {chatLoading ? (
                                    <div className="p-5 text-center">
                                        <LoadingComponent />
                                        <p className="text-muted small mt-2">Loading conversation history...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="p-5 text-center bg-white rounded-3 shadow-xs my-4 border">
                                        <i className="ri ri-chat-smile-2-line text-muted display-4"></i>
                                        <h6 className="mt-2 text-dark">No messages in this conversation yet.</h6>
                                        <p className="text-muted small mb-0">Use the reply box below to send an outbound message to this customer.</p>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {messages.map((msg, mIdx) => {
                                            const isBusiness = msg.sender_type === 'business';

                                            return (
                                                <div 
                                                    key={msg.id || mIdx}
                                                    className={`d-flex ${isBusiness ? 'justify-content-end' : 'justify-content-start'}`}
                                                >
                                                    <div 
                                                        className="rounded-3 shadow-xs p-3 position-relative"
                                                        style={{
                                                            maxWidth: '75%',
                                                            minWidth: '180px',
                                                            backgroundColor: isBusiness ? '#d9fdd3' : '#ffffff',
                                                            border: isBusiness ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                                            color: '#0f172a'
                                                        }}
                                                    >
                                                        {/* Header inside bubble */}
                                                        <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                                            <span 
                                                                className="fw-bold" 
                                                                style={{ fontSize: '11px', color: isBusiness ? '#15803d' : '#0066cc' }}
                                                            >
                                                                {isBusiness ? 'Delta Safari (Support)' : (activeContact.name || 'Customer')}
                                                            </span>
                                                            <span className="text-muted" style={{ fontSize: '10px' }}>
                                                                {formatTimestamp(msg.created_at)}
                                                            </span>
                                                        </div>

                                                        {/* Message Body */}
                                                        <div style={{ fontSize: '13.5px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                            {msg.message_text}
                                                        </div>

                                                        {/* Footer timestamp & checkmarks */}
                                                        <div className="d-flex justify-content-end align-items-center gap-1 mt-1">
                                                            {isBusiness && (
                                                                <i className="ri ri-check-double-line text-primary" style={{ fontSize: '12px', color: '#0066cc' }}></i>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer: Reply Input Box */}
                            <div className="modal-footer bg-white border-top p-3">
                                <form onSubmit={handleSendMessage} className="w-100 d-flex align-items-center gap-2 m-0">
                                    <textarea
                                        rows="1"
                                        className="form-control rounded-3 border bg-light"
                                        placeholder={`Reply to ${activeContact.name || 'Customer'}... (Press Enter to send)`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        disabled={sendingReply}
                                        style={{ resize: 'none', minHeight: '44px', maxHeight: '100px' }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sendingReply || !replyText.trim()}
                                        className="btn btn-primary rounded-circle p-2.5 d-flex align-items-center justify-content-center shadow-sm"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc', width: '44px', height: '44px', minWidth: '44px' }}
                                        title="Send WhatsApp Message"
                                    >
                                        {sendingReply ? (
                                            <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                                        ) : (
                                            <i className="ri ri-send-plane-2-fill text-white fs-5"></i>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Meta Webhook & Cloud API Setup Modal (Super Admin only) */}
            {showGuideModal && isSuperAdmin && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-light border-bottom py-3 px-4">
                                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                                    <i className="ri ri-meta-line text-primary"></i>
                                    <span>Meta WhatsApp Cloud API Configuration</span>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowGuideModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="alert alert-info rounded-3 mb-4 d-flex align-items-start gap-3">
                                    <i className="ri ri-information-line fs-4 mt-0.5 flex-shrink-0"></i>
                                    <div>
                                        <h6 className="alert-heading fw-bold mb-1">How WhatsApp Business Cloud API CRM Works</h6>
                                        <p className="mb-0 small">
                                            Delta Safari receives real-time customer WhatsApp messages via Meta Webhooks. Incoming leads are automatically assigned to active staff members via Round-Robin distribution, while Super Admins maintain full visibility.
                                        </p>
                                    </div>
                                </div>

                                <div className="card bg-light border-0 rounded-3 mb-3 p-3">
                                    <h6 className="fw-bold text-dark mb-2">Meta Developer App Webhook Details:</h6>
                                    <div className="mb-2">
                                        <small className="text-muted d-block">Callback URL:</small>
                                        <code className="text-primary fw-bold">https://deltasafari.com/webhook/whatsapp</code>
                                    </div>
                                    <div className="mb-2">
                                        <small className="text-muted d-block">Verify Token:</small>
                                        <code className="text-dark fw-bold">{configStatus?.verify_token || 'deltasafari_wa_verify_2026'}</code>
                                    </div>
                                    <div>
                                        <small className="text-muted d-block">Webhook Fields to Subscribe:</small>
                                        <span className="badge bg-primary text-white me-1">messages</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer bg-light border-top p-3">
                                <button
                                    type="button"
                                    className="btn btn-secondary rounded-pill px-4"
                                    onClick={() => setShowGuideModal(false)}
                                >
                                    Close Guide
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. Add / Update Follow-up Modal */}
            {followupModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1080 }}
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
                                    onClick={() => setFollowupModalOpen(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <form onSubmit={handleSaveFollowup}>
                                <div className="modal-body p-4">
                                    {/* Lead Classification (Cold, Warm, Hot) */}
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
                                                    id="wa_type_cold" 
                                                    value="cold"
                                                    checked={followupFormData.lead_type === 'cold'}
                                                    onChange={(e) => setFollowupFormData({ ...followupFormData, lead_type: e.target.value })}
                                                />
                                                <label 
                                                    className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 ${followupFormData.lead_type === 'cold' ? 'btn-info text-white shadow-sm' : 'btn-outline-secondary'}`}
                                                    htmlFor="wa_type_cold"
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
                                                    id="wa_type_warm" 
                                                    value="warm"
                                                    checked={followupFormData.lead_type === 'warm'}
                                                    onChange={(e) => setFollowupFormData({ ...followupFormData, lead_type: e.target.value })}
                                                />
                                                <label 
                                                    className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 ${followupFormData.lead_type === 'warm' ? 'btn-warning text-dark shadow-sm' : 'btn-outline-secondary'}`}
                                                    htmlFor="wa_type_warm"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="ri ri-sun-fill fs-4 text-warning"></i>
                                                    <span className="fw-bold">Warm Lead</span>
                                                    <small style={{ fontSize: '11px' }}>Interested</small>
                                                </label>
                                            </div>

                                            {/* Hot */}
                                            <div className="col-4">
                                                <input 
                                                    type="radio" 
                                                    className="btn-check" 
                                                    name="lead_type" 
                                                    id="wa_type_hot" 
                                                    value="hot"
                                                    checked={followupFormData.lead_type === 'hot'}
                                                    onChange={(e) => setFollowupFormData({ ...followupFormData, lead_type: e.target.value })}
                                                />
                                                <label 
                                                    className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 ${followupFormData.lead_type === 'hot' ? 'btn-danger text-white shadow-sm' : 'btn-outline-secondary'}`}
                                                    htmlFor="wa_type_hot"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="ri ri-fire-fill fs-4"></i>
                                                    <span className="fw-bold">Hot Lead 🔥</span>
                                                    <small style={{ fontSize: '11px' }}>Ready to book</small>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Basic Info */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Lead / Customer Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control rounded-3"
                                                placeholder="e.g. Amitav Roy"
                                                value={followupFormData.lead_name}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, lead_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Contact WhatsApp Number</label>
                                            <input 
                                                type="text" 
                                                className="form-control rounded-3 font-monospace"
                                                placeholder="e.g. 919830999888"
                                                value={followupFormData.phone}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Email Address (Optional)</label>
                                            <input 
                                                type="email" 
                                                className="form-control rounded-3"
                                                placeholder="e.g. client@example.com"
                                                value={followupFormData.email}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Travel Destination</label>
                                            <input 
                                                type="text" 
                                                className="form-control rounded-3"
                                                placeholder="e.g. Sundarban Safari, Gosaba"
                                                value={followupFormData.travel_destination}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, travel_destination: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Travel Parameters */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold">Estimated Travel Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control rounded-3"
                                                value={followupFormData.travel_date}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, travel_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-semibold">Number of Persons</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="form-control rounded-3"
                                                value={followupFormData.number_of_persons}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, number_of_persons: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-semibold">Total Rooms Required</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="form-control rounded-3"
                                                value={followupFormData.total_rooms}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, total_rooms: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Package Information */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold d-flex align-items-center gap-1">
                                                <i className="ri ri-suitcase-line text-primary"></i>
                                                <span>Package Name</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                list="wa_followup_package_options"
                                                className="form-control rounded-3"
                                                placeholder="e.g. 2D1N Sundarban Safari, Luxury Boat Tour"
                                                value={followupFormData.package_name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const matched = packageSuggestions.find(p => (p.name === val || p.title === val));
                                                    if (matched && matched.price && !followupFormData.package_rate) {
                                                        setFollowupFormData({ ...followupFormData, package_name: val, package_rate: String(matched.price) });
                                                    } else {
                                                        setFollowupFormData({ ...followupFormData, package_name: val });
                                                    }
                                                }}
                                            />
                                            <datalist id="wa_followup_package_options">
                                                {packageSuggestions.map((pkg) => (
                                                    <option key={pkg.id} value={pkg.name || pkg.title}>
                                                        {pkg.price ? `₹${pkg.price}` : ''}
                                                    </option>
                                                ))}
                                            </datalist>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold d-flex align-items-center gap-1">
                                                <i className="ri ri-money-rupee-circle-line text-success"></i>
                                                <span>Package Rate</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control rounded-3"
                                                placeholder="e.g. 4500, 6000/person, or ₹15,000"
                                                value={followupFormData.package_rate}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, package_rate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Next Follow-up Date & Extra Note */}
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold text-danger">
                                                Next Follow-up Date <span className="text-danger">*</span>
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control rounded-3 border-primary"
                                                value={followupFormData.next_followup_date}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, next_followup_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Follow-up Note / Client Remarks</label>
                                            <textarea 
                                                className="form-control rounded-3"
                                                rows="3"
                                                placeholder="Write details discussed, package requirements, pricing quotes, client preference, or callback reminders..."
                                                value={followupFormData.extra_note}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, extra_note: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const item = { ...followupFormData };
                                            setFollowupModalOpen(false);
                                            handleOpenConvertModal(item);
                                        }}
                                        className="btn btn-outline-success rounded-pill px-3 d-inline-flex align-items-center gap-1.5"
                                        title="Mark as Converted"
                                    >
                                        <i className="ri ri-checkbox-circle-fill"></i>
                                        <span>🎉 Mark Converted</span>
                                    </button>
                                    <div className="d-flex align-items-center gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary rounded-pill px-4" 
                                            onClick={() => setFollowupModalOpen(false)}
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
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Convert Lead Modal (Mark as Converted / Won Deal) */}
            {convertModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="modal-header bg-success text-white py-3 px-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-trophy-fill fs-4 text-warning"></i>
                                        <span>Mark Lead as Converted (Won Deal)</span>
                                    </h5>
                                    <small className="text-white-50">
                                        Confirm closed booking and move from active follow-up queue to Converted section.
                                    </small>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setConvertModalOpen(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <form onSubmit={handleConfirmConvert}>
                                <div className="modal-body p-4">
                                    {/* Customer Overview Card */}
                                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25 rounded-3 p-3 mb-4">
                                        <div className="row g-2 align-items-center">
                                            <div className="col-12 col-md-6">
                                                <span className="text-muted small text-uppercase fw-semibold d-block">Lead Name</span>
                                                <span className="fw-bold text-dark fs-6">{convertFormData.lead_name || 'WhatsApp Customer'}</span>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <span className="text-muted small text-uppercase fw-semibold d-block">WhatsApp Contact</span>
                                                <span className="fw-bold text-success font-monospace">+{convertFormData.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Package & Deal Rate */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                                                <i className="ri ri-suitcase-line text-primary"></i>
                                                <span>Booked Package Name</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                list="wa_convert_package_options"
                                                className="form-control rounded-3"
                                                placeholder="e.g. 2D1N Sundarban Safari, Luxury Boat Tour"
                                                value={convertFormData.package_name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const matched = packageSuggestions.find(p => (p.name === val || p.title === val));
                                                    if (matched && matched.price && !convertFormData.converted_amount) {
                                                        setConvertFormData({ ...convertFormData, package_name: val, converted_amount: String(matched.price) });
                                                    } else {
                                                        setConvertFormData({ ...convertFormData, package_name: val });
                                                    }
                                                }}
                                            />
                                            <datalist id="wa_convert_package_options">
                                                {packageSuggestions.map((pkg) => (
                                                    <option key={pkg.id} value={pkg.name || pkg.title}>
                                                        {pkg.price ? `₹${pkg.price}` : ''}
                                                    </option>
                                                ))}
                                            </datalist>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                                                <i className="ri ri-money-rupee-circle-line text-success"></i>
                                                <span>Final Agreed Booking Amount / Rate</span>
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light fw-bold">₹</span>
                                                <input 
                                                    type="text" 
                                                    className="form-control rounded-end-3"
                                                    placeholder="e.g. 15000 or 4500/pax"
                                                    value={convertFormData.converted_amount}
                                                    onChange={(e) => setConvertFormData({ ...convertFormData, converted_amount: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confirmed Travel Date */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                                                <i className="ri ri-calendar-check-line text-primary"></i>
                                                <span>Confirmed / Estimated Travel Date</span>
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control rounded-3"
                                                value={convertFormData.travel_date}
                                                onChange={(e) => setConvertFormData({ ...convertFormData, travel_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <div className="alert alert-success d-flex align-items-center gap-2 mb-0 py-2.5 px-3 rounded-3" style={{ fontSize: '12.5px' }}>
                                                <i className="ri ri-checkbox-circle-fill fs-5 text-success"></i>
                                                <div>
                                                    <strong>Status Change:</strong> Lead will move to <strong>Converted Leads</strong> and be removed from the active follow-up queue.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Conversion Remarks / Booking Notes */}
                                    <div className="mb-2">
                                        <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                                            <i className="ri ri-file-text-line text-secondary"></i>
                                            <span>Conversion Remarks &amp; Booking Details</span>
                                        </label>
                                        <textarea
                                            className="form-control rounded-3"
                                            rows="3"
                                            placeholder="e.g. Booking confirmed! Advance payment of ₹5,000 received via UPI. Booked AC Cottage for 4 pax. Client requested pickup at Canning station."
                                            value={convertFormData.conversion_note}
                                            onChange={(e) => setConvertFormData({ ...convertFormData, conversion_note: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary rounded-pill px-4" 
                                        onClick={() => setConvertModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={convertingLead}
                                        className="btn btn-success rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
                                    >
                                        {convertingLead ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Marking Converted...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-checkbox-circle-fill"></i>
                                                <span>🎉 Confirm &amp; Mark as Converted</span>
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
