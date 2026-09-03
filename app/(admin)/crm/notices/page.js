'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
    getNoticesListUrl,
    createNoticeUrl,
    getSingleNoticeUrl,
    updateNoticeUrl,
    togglePinNoticeUrl,
    deleteNoticeUrl,
    getNoticeStatsUrl
} from '@/app/routes/whatsappRoutes';
import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/libs/axiosHelper';
import axios from 'axios';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';

export default function NoticeBoardPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);

    // State
    const [loading, setLoading] = useState(true);
    const [notices, setNotices] = useState([]);
    const [stats, setStats] = useState({
        total_notices: 0,
        pinned_count: 0,
        urgent_alerts_count: 0,
        important_count: 0,
        unread_count: 0
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [unreadOnly, setUnreadOnly] = useState(false);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [submittingNotice, setSubmittingNotice] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState(null);

    // Create / Edit Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editNoticeId, setEditNoticeId] = useState(null);
    const [noticeForm, setNoticeForm] = useState({
        title: '',
        content: '',
        notice_type: 'general',
        category: 'Safari Guidelines',
        is_pinned: false,
        is_active: true,
        expires_at: '',
        attachment_url: ''
    });

    // Categories
    const categories = [
        'Safari Guidelines',
        'Booking Policy',
        'Peak Season Protocol',
        'Office Announcement',
        'Emergency Advisory',
        'System Update',
        'General'
    ];

    // Fetch Stats
    const fetchStats = async () => {
        if (!token) return;
        try {
            const res = await axiosGet(getNoticeStatsUrl, token);
            if (res?.status && res.stats) {
                setStats(res.stats);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('notice_count_change', {
                        detail: { count: res.stats.unread_count || 0 }
                    }));
                }
            }
        } catch (err) {
            console.error('Error fetching notice stats:', err);
        }
    };

    // Fetch Notices List
    const fetchNotices = async () => {
        if (!token) return;
        setLoading(true);
        try {
            let queryParams = [];
            if (searchTerm) queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
            if (filterType) queryParams.push(`notice_type=${encodeURIComponent(filterType)}`);
            if (filterCategory) queryParams.push(`category=${encodeURIComponent(filterCategory)}`);

            const url = `${getNoticesListUrl}${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
            const res = await axiosGet(url, token);
            if (res?.status && Array.isArray(res.notices)) {
                setNotices(res.notices);
            }
        } catch (err) {
            console.error('Error loading notices:', err);
            showMessage('error', 'Failed to load notices.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchStats();
            fetchNotices();
        }
    }, [token]);

    // Refetch when search/filter changes
    useEffect(() => {
        if (token) {
            const timer = setTimeout(() => {
                fetchNotices();
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, filterType, filterCategory]);

    // Open Create Modal (Super Admin)
    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setEditNoticeId(null);
        setNoticeForm({
            title: '',
            content: '',
            notice_type: 'announcement',
            category: 'Safari Guidelines',
            is_pinned: false,
            is_active: true,
            expires_at: '',
            attachment_url: ''
        });
        setCreateModalOpen(true);
    };

    // Open Edit Modal (Super Admin)
    const handleOpenEditModal = (notice) => {
        setIsEditing(true);
        setEditNoticeId(notice.id);
        setNoticeForm({
            title: notice.title || '',
            content: notice.content || '',
            notice_type: notice.notice_type || 'general',
            category: notice.category || 'General',
            is_pinned: !!notice.is_pinned,
            is_active: notice.is_active !== undefined ? !!notice.is_active : true,
            expires_at: notice.expires_at ? notice.expires_at.split('T')[0] : '',
            attachment_url: notice.attachment_url || ''
        });
        if (detailModalOpen) setDetailModalOpen(false);
        setCreateModalOpen(true);
    };

    // Save Notice (Create or Update)
    const handleSaveNotice = async (e) => {
        e.preventDefault();
        if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
            showMessage('error', 'Title and content are required.');
            return;
        }

        setSubmittingNotice(true);
        try {
            if (isEditing && editNoticeId) {
                const res = await axiosPut(`${updateNoticeUrl}${editNoticeId}`, noticeForm, token);
                if (res?.status) {
                    showMessage('success', 'Notice updated successfully!');
                    setCreateModalOpen(false);
                    fetchNotices();
                    fetchStats();
                } else {
                    showMessage('error', res?.msg || 'Failed to update notice.');
                }
            } else {
                const res = await axiosPost(createNoticeUrl, noticeForm, token);
                if (res?.status) {
                    showMessage('success', '📢 Notice published successfully to all admin users!');
                    setCreateModalOpen(false);
                    fetchNotices();
                    fetchStats();
                } else {
                    showMessage('error', res?.msg || 'Failed to publish notice.');
                }
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error saving notice.');
        } finally {
            setSubmittingNotice(false);
        }
    };

    // Toggle Pin Status (Super Admin)
    const handleTogglePin = async (noticeId, currentPinned) => {
        try {
            const res = await axios.patch(
                `${togglePinNoticeUrl}${noticeId}/pin`,
                { is_pinned: !currentPinned },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.data?.status) {
                showMessage('success', !currentPinned ? '📌 Notice pinned to the top!' : 'Notice unpinned.');
                fetchNotices();
                fetchStats();
            } else {
                showMessage('error', res.data?.msg || 'Failed to toggle pin status.');
            }
        } catch (err) {
            console.error('Error toggling pin:', err);
            showMessage('error', 'Failed to toggle pin.');
        }
    };

    // Delete Notice (Super Admin)
    const handleDeleteNotice = async (noticeId, title) => {
        if (!window.confirm(`Are you sure you want to delete notice "${title}"?`)) return;

        try {
            const res = await axiosDelete(`${deleteNoticeUrl}${noticeId}`, token);
            if (res?.status) {
                showMessage('success', 'Notice deleted.');
                if (detailModalOpen && selectedNotice?.id === noticeId) setDetailModalOpen(false);
                fetchNotices();
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to delete notice.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error deleting notice.');
        }
    };

    // Open Notice Detail & Mark as Read
    const handleOpenDetailModal = async (notice) => {
        setSelectedNotice(notice);
        setDetailModalOpen(true);

        // Optimistically mark as read in local state
        setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, is_read: 1 } : n));

        try {
            const res = await axiosGet(`${getSingleNoticeUrl}${notice.id}`, token);
            if (res?.status && res.notice) {
                setSelectedNotice(res.notice);
                fetchStats();
            }
        } catch (err) {
            console.error('Error fetching notice details:', err);
        }
    };

    // Notice Type UI Badge Helper
    const renderNoticeTypeBadge = (type) => {
        switch (type) {
            case 'alert':
                return <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"><i className="ri ri-alarm-warning-fill"></i> Urgent Alert</span>;
            case 'important':
                return <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"><i className="ri ri-error-warning-fill"></i> Important</span>;
            case 'announcement':
                return <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"><i className="ri ri-megaphone-fill"></i> Announcement</span>;
            case 'operational':
                return <span className="badge bg-info text-white rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"><i className="ri ri-settings-3-fill"></i> Operational</span>;
            default:
                return <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"><i className="ri ri-information-fill"></i> General Notice</span>;
        }
    };

    // Filtered notices (with unread only check)
    const displayedNotices = useMemo(() => {
        if (!unreadOnly) return notices;
        return notices.filter(n => !n.is_read);
    }, [notices, unreadOnly]);

    // Separate Pinned and Regular
    const pinnedNotices = useMemo(() => {
        return displayedNotices.filter(n => n.is_pinned);
    }, [displayedNotices]);

    const regularNotices = useMemo(() => {
        return displayedNotices.filter(n => !n.is_pinned);
    }, [displayedNotices]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* 1. Header Banner & Actions */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-notification-badge-fill text-info fs-3"></i>
                        <span>Admin Notice &amp; Announcement Board</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Official safari guidelines, policy advisories, seasonal peak protocols, and operational notices broadcast to all admin users.
                    </p>
                </div>

                {user?.admin === 1 && (
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri ri-add-circle-fill"></i>
                        <span>+ Publish New Notice</span>
                    </button>
                )}
            </div>

            {/* 2. Top KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-info">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Active Notices</span>
                                <h4 className="fw-bold text-dark mb-0">{stats.total_notices}</h4>
                            </div>
                            <span className="badge bg-info bg-opacity-10 rounded-circle p-3 text-info">
                                <i className="ri ri-notification-3-line fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-warning">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">📌 Pinned Notices</span>
                                <h4 className="fw-bold text-warning mb-0">{stats.pinned_count}</h4>
                            </div>
                            <span className="badge bg-warning bg-opacity-10 rounded-circle p-3 text-warning">
                                <i className="ri ri-pushpin-2-fill fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-danger">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">🔴 Urgent Alerts</span>
                                <h4 className="fw-bold text-danger mb-0">{stats.urgent_alerts_count}</h4>
                            </div>
                            <span className="badge bg-danger bg-opacity-10 rounded-circle p-3 text-danger">
                                <i className="ri ri-alarm-warning-line fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-primary">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">🔔 Unread by You</span>
                                <h4 className="fw-bold text-primary mb-0">{stats.unread_count}</h4>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 rounded-circle p-3 text-primary">
                                <i className="ri ri-mail-unread-line fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Filter & Search Toolbar */}
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
                <div className="row g-2 align-items-center">
                    {/* Search */}
                    <div className="col-12 col-md-4">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-end-0"><i className="ri ri-search-line text-muted"></i></span>
                            <input
                                type="text"
                                className="form-control form-control-sm bg-light border-start-0"
                                placeholder="Search notices by keyword, title, category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchTerm('')}>
                                    <i className="ri ri-close-line"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Type */}
                    <div className="col-6 col-md-3">
                        <select
                            className="form-select form-select-sm"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">🎯 All Notice Types</option>
                            <option value="alert">🔴 Urgent Alert</option>
                            <option value="important">🟡 Important</option>
                            <option value="announcement">📢 Announcement</option>
                            <option value="operational">🔵 Operational Update</option>
                            <option value="general">⚪ General Notice</option>
                        </select>
                    </div>

                    {/* Filter Category */}
                    <div className="col-6 col-md-3">
                        <select
                            className="form-select form-select-sm"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">📂 All Categories</option>
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Unread Only Toggle */}
                    <div className="col-12 col-md-2 d-flex justify-content-md-end">
                        <button
                            type="button"
                            onClick={() => setUnreadOnly(!unreadOnly)}
                            className={`btn btn-sm rounded-pill px-3 w-100 w-md-auto d-inline-flex align-items-center justify-content-center gap-1 ${unreadOnly ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                            <i className="ri ri-mail-unread-line"></i>
                            <span>Unread Only</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. MAIN NOTICES CONTENT */}
            {loading ? (
                <div className="p-5 text-center bg-white rounded-4 shadow-sm">
                    <LoadingComponent />
                    <p className="text-muted small mt-2">Loading notice board...</p>
                </div>
            ) : displayedNotices.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                    <NotFound title="No Notices Found" message="There are currently no active announcements matching your filters." />
                </div>
            ) : (
                <div className="d-flex flex-column gap-4">
                    {/* PINNED NOTICES SECTION */}
                    {pinnedNotices.length > 0 && (
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <i className="ri ri-pushpin-2-fill text-warning fs-5"></i>
                                <h6 className="fw-bold mb-0 text-dark text-uppercase letter-spacing-1">
                                    Pinned Announcements ({pinnedNotices.length})
                                </h6>
                            </div>

                            <div className="row g-4">
                                {pinnedNotices.map((notice) => (
                                    <div key={notice.id} className="col-12 col-lg-6">
                                        <div
                                            className="card border-0 shadow-sm rounded-4 h-100 bg-white position-relative overflow-hidden transition-all"
                                            style={{
                                                padding: '24px 28px',
                                                borderLeft: `6px solid ${notice.notice_type === 'alert' ? '#dc2626' : notice.notice_type === 'important' ? '#f59e0b' : '#0066cc'}`,
                                                backgroundColor: '#fffdf5'
                                            }}
                                        >
                                            {/* Top Ribbon Badge */}
                                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                    <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-2xs font-monospace small">
                                                        <i className="ri ri-pushpin-fill"></i> PINNED
                                                    </span>
                                                    {renderNoticeTypeBadge(notice.notice_type)}
                                                    <span className="badge text-muted border small">
                                                        {notice.category}
                                                    </span>
                                                </div>

                                                <div className="d-flex align-items-center gap-1.5">
                                                    {!notice.is_read && (
                                                        <span className="badge bg-primary rounded-pill px-2.5 py-1 small fw-bold">
                                                            NEW UNREAD
                                                        </span>
                                                    )}
                                                    {user?.admin === 1 && (
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleTogglePin(notice.id, true)}
                                                                className="btn btn-light btn-sm text-warning p-1.5"
                                                                title="Unpin Notice"
                                                            >
                                                                <i className="ri ri-pushpin-line"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditModal(notice)}
                                                                className="btn btn-light btn-sm text-primary p-1.5"
                                                                title="Edit Notice"
                                                            >
                                                                <i className="ri ri-edit-line"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteNotice(notice.id, notice.title)}
                                                                className="btn btn-light btn-sm text-danger p-1.5"
                                                                title="Delete Notice"
                                                            >
                                                                <i className="ri ri-delete-bin-line"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Notice Title */}
                                            <h5
                                                className="fw-bold text-dark mb-2.5 cursor-pointer hover-text-primary"
                                                onClick={() => handleOpenDetailModal(notice)}
                                                style={{ fontSize: '17.5px', lineHeight: '1.4' }}
                                            >
                                                {notice.title}
                                            </h5>

                                            {/* Excerpt */}
                                            <p className="text-muted mb-4 text-truncate-3" style={{ fontSize: '13px', lineHeight: '1.7', color: '#475569' }}>
                                                {notice.content}
                                            </p>

                                            {/* Footer metadata */}
                                            <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-auto flex-wrap gap-2">
                                                <div className="d-flex align-items-center gap-2 text-muted small" style={{ fontSize: '12px' }}>
                                                    <i className="ri ri-user-line text-primary"></i>
                                                    <span>By <strong>{notice.author_first_name} {notice.author_last_name}</strong></span>
                                                    <span>•</span>
                                                    <i className="ri ri-calendar-line"></i>
                                                    <span>{formatDate(notice.created_at)}</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDetailModal(notice)}
                                                    className="btn btn-outline-primary btn-sm rounded-pill px-3.5 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-2xs fw-semibold"
                                                >
                                                    <span>Read Full Notice</span>
                                                    <i className="ri ri-arrow-right-line"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* REGULAR NOTICES SECTION */}
                    <div>
                        {pinnedNotices.length > 0 && (
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <i className="ri ri-file-list-3-line text-primary fs-5"></i>
                                <h6 className="fw-bold mb-0 text-dark text-uppercase letter-spacing-1">
                                    All Announcements ({regularNotices.length})
                                </h6>
                            </div>
                        )}

                        <div className="row g-4">
                            {regularNotices.map((notice) => (
                                <div key={notice.id} className="col-12 col-lg-6">
                                    <div
                                        className="card border-0 shadow-sm rounded-4 h-100 bg-white position-relative transition-all"
                                        style={{
                                            padding: '24px 28px',
                                            borderLeft: `6px solid ${notice.notice_type === 'alert' ? '#dc2626' : notice.notice_type === 'important' ? '#f59e0b' : notice.notice_type === 'operational' ? '#0284c7' : '#94a3b8'}`
                                        }}
                                    >
                                        {/* Header Row */}
                                        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                {renderNoticeTypeBadge(notice.notice_type)}
                                                <span className="badge text-muted border small">
                                                    {notice.category}
                                                </span>
                                            </div>

                                            <div className="d-flex align-items-center gap-1.5">
                                                {!notice.is_read && (
                                                    <span className="badge bg-primary rounded-pill px-2.5 py-1 small fw-bold">
                                                        NEW
                                                    </span>
                                                )}
                                                {user?.admin === 1 && (
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePin(notice.id, false)}
                                                            className="btn btn-light btn-sm text-muted p-1.5"
                                                            title="Pin Notice to Top"
                                                        >
                                                            <i className="ri ri-pushpin-line"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditModal(notice)}
                                                            className="btn btn-light btn-sm text-primary p-1.5"
                                                            title="Edit Notice"
                                                        >
                                                            <i className="ri ri-edit-line"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteNotice(notice.id, notice.title)}
                                                            className="btn btn-light btn-sm text-danger p-1.5"
                                                            title="Delete Notice"
                                                        >
                                                            <i className="ri ri-delete-bin-line"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notice Title */}
                                        <h5
                                            className="fw-bold text-dark mb-2.5 cursor-pointer hover-text-primary"
                                            onClick={() => handleOpenDetailModal(notice)}
                                            style={{ fontSize: '17.5px', lineHeight: '1.4' }}
                                        >
                                            {notice.title}
                                        </h5>

                                        {/* Excerpt */}
                                        <p className="text-muted mb-4 text-truncate-3" style={{ fontSize: '13px', lineHeight: '1.7', color: '#475569' }}>
                                            {notice.content}
                                        </p>

                                        {/* Footer metadata */}
                                        <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-auto flex-wrap gap-2">
                                            <div className="d-flex align-items-center gap-2 text-muted small" style={{ fontSize: '12px' }}>
                                                <i className="ri ri-user-line text-primary"></i>
                                                <span>By <strong>{notice.author_first_name} {notice.author_last_name}</strong></span>
                                                <span>•</span>
                                                <i className="ri ri-calendar-line"></i>
                                                <span>{formatDate(notice.created_at)}</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleOpenDetailModal(notice)}
                                                className="btn btn-outline-primary btn-sm rounded-pill px-3.5 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-2xs fw-semibold"
                                            >
                                                <span>Read Notice</span>
                                                <i className="ri ri-arrow-right-line"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 5. PUBLISH / EDIT NOTICE MODAL (Super Admin) */}
            {createModalOpen && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <form onSubmit={handleSaveNotice}>
                                <div className="modal-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                    <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className={`ri ${isEditing ? 'ri-edit-line text-warning' : 'ri-megaphone-fill text-primary'}`}></i>
                                        <span>{isEditing ? 'Edit Official Notice' : 'Publish Official Team Notice'}</span>
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setCreateModalOpen(false)} aria-label="Close"></button>
                                </div>

                                <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                                    <div className="row g-3">
                                        {/* Notice Title */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Notice Title <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="e.g. Mandatory Guidelines for Sundarban Tiger Reserve Permits during Puja Surge"
                                                value={noticeForm.title}
                                                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                                                required
                                            />
                                        </div>

                                        {/* Notice Type & Category */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Notice Urgency / Type <span className="text-danger">*</span></label>
                                            <select
                                                className="form-select rounded-3"
                                                value={noticeForm.notice_type}
                                                onChange={(e) => setNoticeForm({ ...noticeForm, notice_type: e.target.value })}
                                            >
                                                <option value="alert">🔴 Urgent Alert</option>
                                                <option value="important">🟡 Important Protocol</option>
                                                <option value="announcement">📢 Team Announcement</option>
                                                <option value="operational">🔵 Operational Update</option>
                                                <option value="general">⚪ General Info</option>
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
                                            <select
                                                className="form-select rounded-3"
                                                value={noticeForm.category}
                                                onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                                            >
                                                {categories.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Pinned & Expiration */}
                                        <div className="col-12 col-md-6">
                                            <div className="form-check form-switch pt-3">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="pinNoticeSwitch"
                                                    checked={noticeForm.is_pinned}
                                                    onChange={(e) => setNoticeForm({ ...noticeForm, is_pinned: e.target.checked })}
                                                />
                                                <label className="form-check-label fw-semibold" htmlFor="pinNoticeSwitch">
                                                    📌 Pin this notice to the top of the Notice Board
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Expiry Date (Optional)</label>
                                            <input
                                                type="date"
                                                className="form-control rounded-3"
                                                value={noticeForm.expires_at}
                                                onChange={(e) => setNoticeForm({ ...noticeForm, expires_at: e.target.value })}
                                            />
                                            <small className="text-muted text-xs">Notice will automatically archive after this date.</small>
                                        </div>

                                        {/* Optional Attachment Link */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Document / External Reference Link (Optional)</label>
                                            <input
                                                type="url"
                                                className="form-control rounded-3"
                                                placeholder="https://drive.google.com/... or document URL"
                                                value={noticeForm.attachment_url}
                                                onChange={(e) => setNoticeForm({ ...noticeForm, attachment_url: e.target.value })}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Notice Content &amp; Instructions <span className="text-danger">*</span></label>
                                            <textarea
                                                className="form-control rounded-3"
                                                rows="6"
                                                placeholder="Write detailed announcements, guidelines, instructions, or policy steps for all admin staff..."
                                                value={noticeForm.content}
                                                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-3 px-4 d-flex justify-content-between">
                                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setCreateModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingNotice}
                                        className="btn btn-primary rounded-pill px-5 d-inline-flex align-items-center gap-2 shadow-sm"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    >
                                        {submittingNotice ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Publishing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-send-plane-fill"></i>
                                                <span>{isEditing ? 'Save Changes' : 'Publish Notice to All Staff'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. FULL NOTICE DETAIL MODAL (All Admin Users) */}
            {detailModalOpen && selectedNotice && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Header */}
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    {selectedNotice.is_pinned && (
                                        <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 small font-monospace">
                                            <i className="ri ri-pushpin-fill"></i> PINNED
                                        </span>
                                    )}
                                    {renderNoticeTypeBadge(selectedNotice.notice_type)}
                                    <span className="badge bg-light text-secondary border">
                                        {selectedNotice.category}
                                    </span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    {user?.admin === 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEditModal(selectedNotice)}
                                            className="btn btn-outline-warning btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1"
                                        >
                                            <i className="ri ri-edit-line"></i>
                                            <span>Edit</span>
                                        </button>
                                    )}
                                    <button type="button" className="btn-close" onClick={() => setDetailModalOpen(false)} aria-label="Close"></button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                <h4 className="fw-bold text-dark mb-3" style={{ lineHeight: '1.4' }}>
                                    {selectedNotice.title}
                                </h4>

                                {/* Author Metadata Card */}
                                <div className="p-3 bg-light rounded-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div
                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-6"
                                            style={{ width: '36px', height: '36px' }}
                                        >
                                            {selectedNotice.author_first_name ? selectedNotice.author_first_name.charAt(0) : 'A'}
                                        </div>
                                        <div>
                                            <div className="fw-bold text-dark small">
                                                {selectedNotice.author_first_name} {selectedNotice.author_last_name}
                                                <span className="badge bg-primary bg-opacity-10 text-primary ms-1.5 small">
                                                    {selectedNotice.author_role === 1 ? 'Super Admin' : 'Admin'}
                                                </span>
                                            </div>
                                            <small className="text-muted">
                                                Published on {formatDate(selectedNotice.created_at)}
                                                {selectedNotice.expires_at && ` • Valid until ${formatDate(selectedNotice.expires_at)}`}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2 text-muted small">
                                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1">
                                            <i className="ri ri-check-double-line me-1"></i> Acknowledged
                                        </span>
                                    </div>
                                </div>

                                {/* Full Notice Content */}
                                <div className="p-4 bg-white border rounded-4 text-dark mb-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '14.5px' }}>
                                    {selectedNotice.content}
                                </div>

                                {/* Attachment if available */}
                                {selectedNotice.attachment_url && (
                                    <div className="p-3 bg-info bg-opacity-10 border border-info border-opacity-25 rounded-3 d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri ri-attachment-2 text-info fs-4"></i>
                                            <div>
                                                <span className="fw-bold text-dark d-block small">Reference Document / Attachment</span>
                                                <small className="text-muted text-truncate">{selectedNotice.attachment_url}</small>
                                            </div>
                                        </div>
                                        <a
                                            href={selectedNotice.attachment_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-info btn-sm rounded-pill px-3 text-white"
                                        >
                                            <i className="ri ri-external-link-line me-1"></i> Open Link
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between">
                                {user?.admin === 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteNotice(selectedNotice.id, selectedNotice.title)}
                                        className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                    >
                                        <i className="ri ri-delete-bin-line me-1"></i> Delete Notice
                                    </button>
                                )}
                                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4 ms-auto" onClick={() => setDetailModalOpen(false)}>
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
