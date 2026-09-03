'use client'

import { toggleSidebar } from "@/services/reducers/themeSlices";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

function NavbarAdmin() {
    const dispatch = useDispatch();
    const router = useRouter();
    const user = useSelector((state) => state?.adminAuth?.user);

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filterType, setFilterType] = useState('all'); // 'all', 'notice', 'task'
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const socketRef = useRef(null);

    function setTheme(theme) {
        if (typeof document !== 'undefined' && document.getElementsByTagName('html')?.length > 0) {
            document.getElementsByTagName('html')[0].setAttribute("data-bs-theme", theme);
        }
    }

    // 1. Load Stored Notifications from LocalStorage
    useEffect(() => {
        if (!user?.id) return;
        try {
            const stored = localStorage.getItem(`admin_notifications_${user.id}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setNotifications(parsed);
                    setUnreadCount(parsed.filter(n => !n.read).length);
                }
            }
        } catch (e) {
            console.error('Error loading stored notifications:', e);
        }
    }, [user?.id]);

    // Save Notifications to LocalStorage
    const saveNotifications = (newNotifs) => {
        setNotifications(newNotifs);
        setUnreadCount(newNotifs.filter(n => !n.read).length);
        if (user?.id) {
            try {
                localStorage.setItem(`admin_notifications_${user.id}`, JSON.stringify(newNotifs.slice(0, 50)));
            } catch (e) {
                console.error('Error saving notifications:', e);
            }
        }
    };

    // 2. Real-Time Socket.io Connection for Notice & Task Notifications
    useEffect(() => {
        if (!user?.id) return;

        const socketHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const cleanHost = socketHost.endsWith('/') ? socketHost.slice(0, -1) : socketHost;

        const newSocket = io(cleanHost, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            newSocket.emit('register_user', {
                id: user.id,
                name: `${user.first_name || 'Admin'} ${user.last_name || ''}`.trim()
            });
        });

        // Sound chime helper via Web Audio API
        const playNotificationSound = () => {
            try {
                if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
                    gain.gain.setValueAtTime(0.25, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.4);
                }
            } catch (e) {}
        };

        // 📢 Notice Notification Handler (Received by ALL admin users)
        newSocket.on('notice_notification', (data) => {
            const newNotif = {
                id: `notice_${data.id}_${Date.now()}`,
                type: 'notice',
                title: data.title || 'Official Notice',
                category: data.category || 'General',
                author: data.created_by_name || 'Super Admin',
                created_at: data.created_at || new Date().toISOString(),
                read: false,
                link: '/crm/notices'
            };

            setNotifications((prev) => {
                const updated = [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 50);
                if (user?.id) {
                    try {
                        localStorage.setItem(`admin_notifications_${user.id}`, JSON.stringify(updated));
                    } catch (e) {}
                }
                return updated;
            });
            setUnreadCount((prev) => prev + 1);

            // Play notification chime
            playNotificationSound();

            // Native browser desktop notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification(`Delta Safari CRM: New Official Notice`, {
                        body: `"${data.title}" by ${data.created_by_name || 'Super Admin'}`,
                        icon: '/assets/img/favicon/favicon.ico'
                    });
                } catch (nErr) {}
            }

            // Toast Alert
            toast.info(
                <div style={{ cursor: 'pointer' }} onClick={() => router.push('/crm/notices')}>
                    <strong className="d-block" style={{ fontSize: '13px' }}>📢 New Notice Published</strong>
                    <span style={{ fontSize: '12px' }}>{data.title}</span>
                    <small className="d-block text-muted mt-1">By {data.created_by_name || 'Super Admin'} • Click to view</small>
                </div>,
                { autoClose: 6000 }
            );

            // Dispatch event for real-time sidebar notice count update
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('notice_count_change', {
                    detail: { delta: 1 }
                }));
            }
        });

        // 🔄 Real-time Notice Count Update Handler
        newSocket.on('notice_count_updated', (data) => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('notice_count_change', {
                    detail: data
                }));
            }
        });

        // 📋 Task Notification Handler (Received ONLY by the assigned admin user)
        newSocket.on('task_notification', (data) => {
            const newNotif = {
                id: `task_${data.id}_${Date.now()}`,
                type: 'task',
                title: data.title || 'New Task Assigned',
                priority: data.priority || 'medium',
                assigned_by: data.assigned_by_name || 'Super Admin',
                lead_name: data.lead_name || null,
                created_at: data.created_at || new Date().toISOString(),
                read: false,
                link: '/crm/tasks'
            };

            setNotifications((prev) => {
                const updated = [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 50);
                if (user?.id) {
                    try {
                        localStorage.setItem(`admin_notifications_${user.id}`, JSON.stringify(updated));
                    } catch (e) {}
                }
                return updated;
            });
            setUnreadCount((prev) => prev + 1);

            // Play notification chime
            playNotificationSound();

            // Native browser desktop notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification(`Delta Safari CRM: New Task Assigned`, {
                        body: `"${data.title}" assigned to you by ${data.assigned_by_name || 'Admin'}. Priority: ${data.priority?.toUpperCase()}`,
                        icon: '/assets/img/favicon/favicon.ico'
                    });
                } catch (nErr) {}
            }

            // Toast Alert
            toast.warn(
                <div style={{ cursor: 'pointer' }} onClick={() => router.push('/crm/tasks')}>
                    <strong className="d-block" style={{ fontSize: '13px' }}>📋 New Task Assigned to You</strong>
                    <span style={{ fontSize: '12px' }}>{data.title}</span>
                    <small className="d-block text-muted mt-1">Assigned by {data.assigned_by_name || 'Admin'} • Priority: {data.priority?.toUpperCase()} • Click to view</small>
                </div>,
                { autoClose: 7000 }
            );

            // Dispatch event for real-time sidebar task count update
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('task_count_change', {
                    detail: { count: data.active_task_count }
                }));
            }
        });

        // 🔄 Real-time Task Count Update Handler
        newSocket.on('task_count_updated', (data) => {
            if (typeof window !== 'undefined' && data?.count !== undefined) {
                window.dispatchEvent(new CustomEvent('task_count_change', {
                    detail: { count: data.count }
                }));
            }
        });

        // 💬 Chat Notification Handler
        newSocket.on('chat_notification', (data) => {
            const isOnChatPage = typeof window !== 'undefined' && window.location.pathname === '/crm/chat';

            const newNotif = {
                id: `chat_${data.id || Date.now()}`,
                type: 'chat',
                title: `💬 Message from ${data.sender_name || 'Team Member'}`,
                category: 'Team Chat',
                author: data.sender_name || 'Team Member',
                created_at: data.created_at || new Date().toISOString(),
                read: false,
                link: '/crm/chat'
            };

            setNotifications((prev) => {
                const updated = [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 50);
                if (user?.id) {
                    try {
                        localStorage.setItem(`admin_notifications_${user.id}`, JSON.stringify(updated));
                    } catch (e) {}
                }
                return updated;
            });
            setUnreadCount((prev) => prev + 1);

            if (!isOnChatPage) {
                // Play notification chime
                playNotificationSound();

                // Native browser desktop notification
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        new Notification(`Delta Safari CRM: ${data.sender_name || 'Team Member'}`, {
                            body: data.message || 'New team chat message',
                            icon: '/assets/img/favicon/favicon.ico'
                        });
                    } catch (nErr) {}
                }

                // Toast Alert
                toast.info(
                    <div style={{ cursor: 'pointer' }} onClick={() => router.push('/crm/chat')}>
                        <strong className="d-block" style={{ fontSize: '13px' }}>💬 {data.sender_name || 'Team Member'}</strong>
                        <span style={{ fontSize: '12px' }} className="text-truncate d-block">{data.message}</span>
                        <small className="d-block text-muted mt-1">Click to open Team Chat</small>
                    </div>,
                    { autoClose: 5000 }
                );
            }

            // Dispatch event for real-time sidebar chat count update
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('chat_count_change', {
                    detail: { delta: 1 }
                }));
            }
        });

        // 🔄 Real-time Chat Count Update Handler
        newSocket.on('chat_count_updated', (data) => {
            if (typeof window !== 'undefined' && data?.unread_count !== undefined) {
                window.dispatchEvent(new CustomEvent('chat_count_change', {
                    detail: { count: data.unread_count }
                }));
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user?.id, router]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Listen for task_read event to automatically mark task notifications as read
    useEffect(() => {
        const handleTaskRead = (e) => {
            const taskId = e.detail?.taskId;
            if (taskId) {
                setNotifications(prev => {
                    let hadUnread = false;
                    const updated = prev.map(n => {
                        if (n.type === 'task' && (n.id?.includes(`task_${taskId}`) || n.link?.includes(taskId))) {
                            if (!n.read) hadUnread = true;
                            return { ...n, read: true };
                        }
                        return n;
                    });
                    if (user?.id) {
                        try {
                            localStorage.setItem(`admin_notifications_${user.id}`, JSON.stringify(updated));
                        } catch (err) {}
                    }
                    if (hadUnread) {
                        setUnreadCount(c => Math.max(0, c - 1));
                    }
                    return updated;
                });
            }
        };
        window.addEventListener('task_read', handleTaskRead);
        return () => window.removeEventListener('task_read', handleTaskRead);
    }, [user?.id]);

    const markAllAsRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        saveNotifications(updated);
    };

    const clearAllNotifications = () => {
        saveNotifications([]);
    };

    const handleNotificationClick = (notif) => {
        const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
        saveNotifications(updated);
        setDropdownOpen(false);
        if (notif.link) {
            router.push(notif.link);
        }
    };

    const formatNotifTime = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            const now = new Date();
            const diffMs = now - d;
            const diffMin = Math.floor(diffMs / 60000);
            const diffHour = Math.floor(diffMin / 60);

            if (diffMin < 1) return 'Just now';
            if (diffMin < 60) return `${diffMin}m ago`;
            if (diffHour < 24) return `${diffHour}h ago`;
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        } catch (e) {
            return '';
        }
    };

    const displayedNotifications = notifications.filter(n => {
        if (filterType === 'notice') return n.type === 'notice';
        if (filterType === 'task') return n.type === 'task';
        return true;
    });

    return (
        <>
            <nav
                className="layout-navbar container-xxl navbar-detached navbar navbar-expand-xl align-items-center bg-navbar-theme"
                id="layout-navbar"
            >
                <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
                    <a className="nav-item nav-link px-0 me-xl-6" onClick={() => { dispatch(toggleSidebar()) }}>
                        <i className="icon-base ri ri-menu-line icon-22px"></i>
                    </a>
                </div>

                <div className="navbar-nav-right d-flex align-items-center justify-content-end" id="navbar-collapse">
                    <div className="navbar-nav align-items-center">
                        <div className="nav-item navbar-search-wrapper mb-0">
                            <a className="nav-item nav-link search-toggler px-0" href="javascript:void(0);">
                                <span className="d-inline-block text-body-secondary fw-normal" id="autocomplete"></span>
                            </a>
                        </div>
                    </div>

                    <ul className="navbar-nav flex-row align-items-center ms-md-auto gap-2">
                        {/* ========================================================================= */}
                        {/* REAL-TIME NOTICE & TASK NOTIFICATIONS BELL DROPDOWN                       */}
                        {/* ========================================================================= */}
                        <li className="nav-item dropdown position-relative" ref={dropdownRef}>
                            <button
                                type="button"
                                className="btn btn-icon btn-text-secondary rounded-pill position-relative d-flex align-items-center justify-content-center"
                                style={{ width: '40px', height: '40px' }}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                title="Notifications"
                            >
                                <i className="icon-base ri ri-notification-3-line icon-22px"></i>
                                {unreadCount > 0 && (
                                    <span
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white"
                                        style={{ fontSize: '9px', padding: '3px 5px', transform: 'translate(-30%, 15%)' }}
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div
                                    className="dropdown-menu dropdown-menu-end show shadow-lg border-0 rounded-4 mt-2 p-0 overflow-hidden"
                                    style={{
                                        width: '360px',
                                        maxWidth: '90vw',
                                        zIndex: 1060,
                                        position: 'absolute',
                                        right: 0,
                                        top: '100%'
                                    }}
                                >
                                    {/* Dropdown Header */}
                                    <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-2">
                                            <h6 className="fw-bold text-dark mb-0 fs-6">Notifications</h6>
                                            {unreadCount > 0 && (
                                                <span className="badge bg-primary rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                                                    {unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center gap-1.5">
                                            {unreadCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={markAllAsRead}
                                                    className="btn btn-link btn-xs text-primary p-0 text-decoration-none fw-semibold"
                                                    style={{ fontSize: '11.5px' }}
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={clearAllNotifications}
                                                    className="btn btn-link btn-xs text-muted p-0 ms-2 text-decoration-none"
                                                    style={{ fontSize: '11px' }}
                                                    title="Clear All"
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Filter Tabs */}
                                    <div className="d-flex border-bottom bg-light px-3 py-1.5 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setFilterType('all')}
                                            className={`btn btn-xs rounded-pill px-2.5 py-0.5 text-xs fw-semibold ${
                                                filterType === 'all' ? 'btn-primary' : 'btn-light text-muted'
                                            }`}
                                            style={filterType === 'all' ? { backgroundColor: '#0066cc', borderColor: '#0066cc' } : {}}
                                        >
                                            All ({notifications.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFilterType('notice')}
                                            className={`btn btn-xs rounded-pill px-2.5 py-0.5 text-xs fw-semibold ${
                                                filterType === 'notice' ? 'btn-primary' : 'btn-light text-muted'
                                            }`}
                                            style={filterType === 'notice' ? { backgroundColor: '#0066cc', borderColor: '#0066cc' } : {}}
                                        >
                                            📢 Notices
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFilterType('task')}
                                            className={`btn btn-xs rounded-pill px-2.5 py-0.5 text-xs fw-semibold ${
                                                filterType === 'task' ? 'btn-primary' : 'btn-light text-muted'
                                            }`}
                                            style={filterType === 'task' ? { backgroundColor: '#0066cc', borderColor: '#0066cc' } : {}}
                                        >
                                            📋 Tasks
                                        </button>
                                    </div>

                                    {/* Notification List Scrollable */}
                                    <div className="overflow-auto p-2 d-flex flex-column gap-1" style={{ maxHeight: '340px' }}>
                                        {displayedNotifications.length === 0 ? (
                                            <div className="text-center py-4 text-muted">
                                                <i className="ri ri-notification-off-line fs-2 d-block opacity-40 mb-1"></i>
                                                <small className="d-block">No notifications yet</small>
                                            </div>
                                        ) : (
                                            displayedNotifications.map((notif) => {
                                                const isNotice = notif.type === 'notice';
                                                return (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className={`p-2.5 rounded-3 d-flex align-items-start gap-2.5 cursor-pointer transition-all ${
                                                            !notif.read ? 'bg-primary bg-opacity-10 border border-primary border-opacity-20' : 'bg-white hover-bg-light border'
                                                        }`}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {/* Type Icon */}
                                                        <div
                                                            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5 ${
                                                                isNotice ? 'bg-info bg-opacity-15 text-info' : 'bg-warning bg-opacity-20 text-warning-emphasis'
                                                            }`}
                                                            style={{ width: '34px', height: '34px' }}
                                                        >
                                                            <i className={`fs-5 ${isNotice ? 'ri-notification-badge-line' : 'ri-kanban-view-2'}`}></i>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <div className="d-flex justify-content-between align-items-center mb-0.5">
                                                                <span
                                                                    className={`badge py-0 px-1.5 rounded-pill ${
                                                                        isNotice ? 'bg-info text-white' : 'bg-warning text-dark'
                                                                    }`}
                                                                    style={{ fontSize: '9px' }}
                                                                >
                                                                    {isNotice ? '📢 Notice (All)' : '📋 Task (Assigned)'}
                                                                </span>
                                                                <small className="text-muted text-xs" style={{ fontSize: '10px' }}>
                                                                    {formatNotifTime(notif.created_at)}
                                                                </small>
                                                            </div>
                                                            <h6 className="fw-bold text-dark mb-0.5 small text-truncate" style={{ fontSize: '12.5px' }}>
                                                                {notif.title}
                                                            </h6>
                                                            <p className="text-muted mb-0 text-xs text-truncate" style={{ fontSize: '11px' }}>
                                                                {isNotice ? `By ${notif.author || 'Super Admin'}` : `Assigned by ${notif.assigned_by || 'Admin'}`}
                                                            </p>
                                                        </div>

                                                        {/* Unread indicator */}
                                                        {!notif.read && (
                                                            <span
                                                                className="rounded-circle bg-primary flex-shrink-0 mt-1"
                                                                style={{ width: '8px', height: '8px' }}
                                                            ></span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Footer Quick Links */}
                                    <div className="p-2 bg-light border-top d-flex justify-content-between gap-1">
                                        <button
                                            type="button"
                                            onClick={() => { setDropdownOpen(false); router.push('/crm/notices'); }}
                                            className="btn btn-outline-info btn-xs w-50 rounded-pill"
                                        >
                                            📢 Notice Board
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setDropdownOpen(false); router.push('/crm/tasks'); }}
                                            className="btn btn-outline-warning btn-xs w-50 rounded-pill"
                                        >
                                            📋 Task Kanban
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>

                        {/* Theme Toggle Dropdown */}
                        <li className="nav-item dropdown me-sm-2 me-xl-0">
                            <a
                                className="nav-link dropdown-toggle hide-arrow btn btn-icon btn-text-secondary rounded-pill"
                                id="nav-theme"
                                href="javascript:void(0);"
                                data-bs-toggle="dropdown"
                            >
                                <i className="icon-base ri ri-sun-line icon-22px theme-icon-active"></i>
                                <span className="d-none ms-2" id="nav-theme-text">Toggle theme</span>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="nav-theme-text">
                                <li>
                                    <button
                                        type="button"
                                        className="dropdown-item align-items-center active"
                                        data-bs-theme-value="light"
                                        aria-pressed="false"
                                        onClick={() => { setTheme("light") }}
                                    >
                                        <span><i className="icon-base ri ri-sun-line icon-22px me-3" data-icon="sun-line"></i>Light</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="dropdown-item align-items-center"
                                        data-bs-theme-value="dark"
                                        aria-pressed="true"
                                        onClick={() => { setTheme("dark") }}
                                    >
                                        <span><i className="icon-base ri ri-moon-clear-line icon-22px me-3" data-icon="moon-clear-line"></i>Dark</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="dropdown-item align-items-center"
                                        data-bs-theme-value="system"
                                        aria-pressed="false"
                                        onClick={() => { setTheme("system") }}
                                    >
                                        <span><i className="icon-base ri ri-computer-line icon-22px me-3" data-icon="computer-line"></i>System</span>
                                    </button>
                                </li>
                            </ul>
                        </li>

                        {/* User Profile Dropdown */}
                        <li className="nav-item navbar-dropdown dropdown-user dropdown">
                            <a className="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown">
                                <div className="avatar avatar-online">
                                    <img
                                        src={user?.profile_picture ? (user.profile_picture.startsWith('data:') || user.profile_picture.startsWith('http') ? user.profile_picture : process.env.NEXT_PUBLIC_SERVER_URL + user.profile_picture) : "/assets/img/avatars/1.png"}
                                        alt="avatar"
                                        className="rounded-circle"
                                        style={{ width: "38px", height: "38px", objectFit: "cover" }}
                                    />
                                </div>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end mt-3 py-2">
                                <li>
                                    <Link className="dropdown-item" href={user?.id ? `/adminusers/view?id=${user.id}` : '#'}>
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-2">
                                                <div className="avatar avatar-online">
                                                    <img
                                                        src={user?.profile_picture ? (user.profile_picture.startsWith('data:') || user.profile_picture.startsWith('http') ? user.profile_picture : process.env.NEXT_PUBLIC_SERVER_URL + user.profile_picture) : "/assets/img/avatars/1.png"}
                                                        alt="alt"
                                                        className="w-px-40 h-auto rounded-circle"
                                                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-0 small">{user?.first_name ? `${user.first_name} ${user?.last_name || ''}` : 'Admin User'}</h6>
                                                <small className="text-body-secondary">
                                                    {
                                                        user?.admin == 1 ?
                                                            'Super Admin'
                                                            :
                                                            user?.admin == 2 ?
                                                                'Admin User'
                                                                :
                                                                'Unauthorised User'
                                                    }
                                                </small>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <div className="dropdown-divider"></div>
                                </li>
                                <li>
                                    <Link className="dropdown-item" href={user?.id ? `/adminusers/view?id=${user.id}` : '/adminusers'}>
                                        <i className="icon-base ri ri-user-3-line icon-22px me-3"></i>
                                        <span className="align-middle">My Profile</span>
                                    </Link>
                                </li>
                                {user?.admin === 1 && (
                                    <li>
                                        <Link className="dropdown-item" href="/generalsettings">
                                            <i className="icon-base ri ri-settings-4-line icon-22px me-3"></i>
                                            <span className="align-middle">Settings</span>
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <div className="dropdown-divider"></div>
                                </li>
                                <li>
                                    <div className="d-grid px-4 pt-2 pb-1">
                                        <Link className="btn btn-sm btn-danger d-flex justify-content-center align-items-center" href="/logout">
                                            <small className="align-middle">Logout</small>
                                            <i className="icon-base ri ri-logout-box-r-line ms-2 icon-16px"></i>
                                        </Link>
                                    </div>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </nav>
        </>
    );
}

export default NavbarAdmin;