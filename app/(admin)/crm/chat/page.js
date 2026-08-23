'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
    getChatUsersUrl,
    getChatConversationsUrl,
    createDirectChatUrl,
    getChatMessagesUrl,
    sendChatMessageUrl,
    markChatReadUrl,
    uploadChatFileUrl
} from '@/app/routes/whatsappRoutes';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';

export default function AdminTeamChatPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const currentUser = useSelector((state) => state.adminAuth?.user);

    // State
    const [socket, setSocket] = useState(null);
    const [onlineUserIds, setOnlineUserIds] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [adminUsersDirectory, setAdminUsersDirectory] = useState([]);

    // Input & Attachments State
    const [messageText, setMessageText] = useState('');
    const [uploadingFile, setUploadingFile] = useState(false);
    const [selectedFilePreview, setSelectedFilePreview] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [typingUsers, setTypingUsers] = useState({}); // { [convId]: Set of user names }

    // Search & Modals
    const [searchTerm, setSearchTerm] = useState('');
    const [newChatModalOpen, setNewChatModalOpen] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [membersSearchTerm, setMembersSearchTerm] = useState('');
    const [mobileView, setMobileView] = useState('list'); // 'list' (shows members/sidebar) or 'chat' (shows active message pane)
    const [imagePreviewModalUrl, setImagePreviewModalUrl] = useState(null);

    // Refs
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const socketRef = useRef(null);
    const activeConversationRef = useRef(null);

    // Keep activeConversationRef synchronized
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    // Common Emojis Bar
    const quickEmojis = ['👍', '👋', '🐅', '🔥', '❤️', '👏', '🎉', '🚀', '✅', '⏳', '📞', '🏨', '📍', '📄', '😊', '🙏'];

    // 1. Initialize Socket.io Connection
    useEffect(() => {
        if (!token || !currentUser?.id) return;

        // Get base socket URL from environment or current host
        const socketHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const cleanHost = socketHost.endsWith('/') ? socketHost.slice(0, -1) : socketHost;

        const newSocket = io(cleanHost, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[Socket] Connected to chat server:', newSocket.id);
            newSocket.emit('register_user', {
                id: currentUser.id,
                name: `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
            });

            // Re-join active conversation room if one is already selected
            if (activeConversationRef.current) {
                newSocket.emit('join_conversation', {
                    conversation_id: activeConversationRef.current.id,
                    user_id: currentUser.id
                });
            }
        });

        // Online Users Broadcast
        newSocket.on('online_users', (onlineIds) => {
            setOnlineUserIds(onlineIds || []);
        });

        // Receive Live Message
        newSocket.on('receive_message', (msg) => {
            const currentActive = activeConversationRef.current;
            if (currentActive && Number(msg.conversation_id) === Number(currentActive.id)) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
            }
        });

        // Conversation Updated (sidebar preview update)
        newSocket.on('conversation_updated', (data) => {
            const currentActive = activeConversationRef.current;
            setConversations((prev) => {
                const existingIdx = prev.findIndex((c) => Number(c.id) === Number(data.conversation_id));
                if (existingIdx !== -1) {
                    const updated = [...prev];
                    const target = { ...updated[existingIdx] };
                    target.last_message = data.last_message;
                    target.last_message_at = data.last_message_at;
                    target.last_sender_first_name = data.sender_first_name;

                    // Increment unread count if we are not actively viewing this conversation
                    if (!currentActive || Number(currentActive.id) !== Number(data.conversation_id)) {
                        if (Number(data.last_sender_id) !== Number(currentUser.id)) {
                            target.unread_count = (parseInt(target.unread_count || 0) + 1);
                        }
                    }

                    // Move to top of conversations list
                    updated.splice(existingIdx, 1);
                    return [target, ...updated];
                }
                return prev;
            });
        });

        // Live Typing Indicators
        newSocket.on('user_typing', ({ conversation_id, user_id, user_name }) => {
            if (Number(user_id) === Number(currentUser.id)) return;
            setTypingUsers((prev) => {
                const currentSet = new Set(prev[conversation_id] || []);
                currentSet.add(user_name || 'Someone');
                return { ...prev, [conversation_id]: Array.from(currentSet) };
            });
        });

        newSocket.on('user_stopped_typing', ({ conversation_id, user_id }) => {
            setTypingUsers((prev) => {
                return { ...prev, [conversation_id]: [] };
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, [token, currentUser]);

    // Scroll to bottom helper
    const scrollToBottom = (smooth = true) => {
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
            }
        }, 100);
    };

    // 2. Fetch Conversations & Users Directory
    const loadConversations = async (autoSelectFirst = false) => {
        if (!token) return;
        try {
            setLoadingConversations(true);
            const res = await axiosGet(getChatConversationsUrl, token);
            if (res?.status && Array.isArray(res.conversations)) {
                setConversations(res.conversations);
                if (autoSelectFirst && res.conversations.length > 0 && !activeConversation) {
                    handleSelectConversation(res.conversations[0]);
                }
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoadingConversations(false);
        }
    };

    const loadUsersDirectory = async () => {
        if (!token) return;
        try {
            const res = await axiosGet(getChatUsersUrl, token);
            if (res?.status && Array.isArray(res.users)) {
                setAdminUsersDirectory(res.users);
            }
        } catch (err) {
            console.error('Error fetching users directory:', err);
        }
    };

    useEffect(() => {
        if (token) {
            loadConversations(true);
            loadUsersDirectory();
        }
    }, [token]);

    // 3. Select Conversation & Load Messages (Supports Direct Chat Auto-Creation)
    const handleSelectConversation = async (conv) => {
        if (!conv) return;

        // Switch to active chat pane on mobile devices
        setMobileView('chat');

        // Leave previous room if any
        if (activeConversationRef.current && socketRef.current) {
            socketRef.current.emit('leave_conversation', { conversation_id: activeConversationRef.current.id });
        }

        let targetConv = { ...conv };

        // If conversation doesn't exist yet for this admin user, auto-create it
        if ((!targetConv.id || targetConv.id === 0) && targetConv.other_user_id) {
            try {
                const createRes = await axiosPost(createDirectChatUrl, { target_user_id: targetConv.other_user_id }, token);
                if (createRes?.status && createRes.conversation_id) {
                    targetConv.id = createRes.conversation_id;
                    setConversations((prev) =>
                        prev.map((c) => (c.other_user_id === targetConv.other_user_id ? { ...c, id: createRes.conversation_id } : c))
                    );
                }
            } catch (err) {
                console.error('Error auto-creating direct conversation:', err);
            }
        }

        setActiveConversation(targetConv);
        activeConversationRef.current = targetConv;
        setLoadingMessages(true);
        setSelectedFilePreview(null);
        setMessageText('');

        // Join new room via socket
        if (socketRef.current && targetConv.id) {
            socketRef.current.emit('join_conversation', {
                conversation_id: targetConv.id,
                user_id: currentUser?.id
            });
        }

        // Clear unread count locally
        setConversations((prev) =>
            prev.map((c) => (c.id === targetConv.id ? { ...c, unread_count: 0 } : c))
        );

        if (targetConv.id) {
            try {
                const res = await axiosGet(`${getChatMessagesUrl}${targetConv.id}/messages`, token);
                if (res?.status && Array.isArray(res.messages)) {
                    setMessages(res.messages);
                    scrollToBottom(false);
                }
            } catch (err) {
                console.error('Error loading messages:', err);
            } finally {
                setLoadingMessages(false);
            }
        } else {
            setMessages([]);
            setLoadingMessages(false);
        }
    };

    // 4. Start Direct Chat with User from Directory
    const handleStartDirectChat = async (targetUserId) => {
        try {
            const res = await axiosPost(createDirectChatUrl, { target_user_id: targetUserId }, token);
            if (res?.status && res.conversation_id) {
                setNewChatModalOpen(false);
                // Reload conversations list and select this conversation
                const convRes = await axiosGet(getChatConversationsUrl, token);
                if (convRes?.status && Array.isArray(convRes.conversations)) {
                    setConversations(convRes.conversations);
                    const targetConv = convRes.conversations.find((c) => c.id === res.conversation_id);
                    if (targetConv) {
                        handleSelectConversation(targetConv);
                    }
                }
            }
        } catch (err) {
            console.error('Error starting direct chat:', err);
            showMessage('error', 'Failed to start direct conversation.');
        }
    };

    // 5. Send Message (Socket + REST Fallback)
    const updateSidebarLastMessage = (msg) => {
        if (!activeConversation) return;
        setConversations((prev) => {
            const existingIdx = prev.findIndex((c) => Number(c.id) === Number(activeConversation.id));
            if (existingIdx !== -1) {
                const updated = [...prev];
                const target = { ...updated[existingIdx] };
                target.last_message = msg.message_type === 'image' ? '📷 Image attachment' : (msg.message_type === 'file' ? `📎 ${msg.file_name}` : (msg.message || ''));
                target.last_message_at = msg.created_at || new Date().toISOString();
                target.last_sender_first_name = currentUser?.first_name || 'Me';
                updated.splice(existingIdx, 1);
                return [target, ...updated];
            }
            return prev;
        });
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!activeConversation || (!messageText.trim() && !selectedFilePreview)) return;

        const payload = {
            conversation_id: activeConversation.id,
            sender_id: currentUser?.id,
            message: messageText.trim() || null,
            message_type: selectedFilePreview ? (selectedFilePreview.file_type?.startsWith('image/') ? 'image' : 'file') : 'text',
            file_url: selectedFilePreview?.file_url || null,
            file_name: selectedFilePreview?.file_name || null,
            file_size: selectedFilePreview?.file_size || null,
            file_type: selectedFilePreview?.file_type || null
        };

        // Clear local input & file preview immediately for responsive feel
        setMessageText('');
        setSelectedFilePreview(null);
        setShowEmojiPicker(false);

        // Stop typing indicator
        if (socketRef.current) {
            socketRef.current.emit('typing_stop', {
                conversation_id: activeConversation.id,
                user_id: currentUser?.id
            });
        }

        // Try sending via Socket.io first
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('send_message', payload, (response) => {
                if (response?.status && response.message) {
                    setMessages((prev) => {
                        if (prev.some((m) => Number(m.id) === Number(response.message.id))) return prev;
                        return [...prev, response.message];
                    });
                    updateSidebarLastMessage(response.message);
                    scrollToBottom();
                } else if (!response?.status) {
                    console.warn('[Socket] Message failed via socket, fallback to REST...');
                    sendViaRest(payload);
                }
            });
        } else {
            // REST Fallback
            sendViaRest(payload);
        }
    };

    const sendViaRest = async (payload) => {
        try {
            const res = await axiosPost(`${sendChatMessageUrl}${activeConversation.id}/messages`, payload, token);
            if (res?.status && res.message) {
                setMessages((prev) => {
                    if (prev.some((m) => Number(m.id) === Number(res.message.id))) return prev;
                    return [...prev, res.message];
                });
                updateSidebarLastMessage(res.message);
                scrollToBottom();
            }
        } catch (err) {
            console.error('Error sending message via REST:', err);
            showMessage('error', 'Message delivery failed. Please check your connection.');
        }
    };

    // 6. Handle Typing events
    const handleTextChange = (e) => {
        const val = e.target.value;
        setMessageText(val);

        if (!activeConversation || !socketRef.current) return;

        // Emit typing start
        socketRef.current.emit('typing_start', {
            conversation_id: activeConversation.id,
            user_id: currentUser?.id,
            user_name: currentUser?.first_name || 'Admin'
        });

        // Reset debounce timer
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (socketRef.current && activeConversation) {
                socketRef.current.emit('typing_stop', {
                    conversation_id: activeConversation.id,
                    user_id: currentUser?.id
                });
            }
        }, 2000);
    };

    // 7. File Upload Handler
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 50MB file size limit
        if (file.size > 50 * 1024 * 1024) {
            showMessage('error', 'File size exceeds 50MB limit.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploadingFile(true);
        try {
            const res = await axios.post(uploadChatFileUrl, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data?.status && res.data?.file_url) {
                setSelectedFilePreview({
                    file_url: res.data.file_url,
                    file_name: res.data.file_name,
                    file_size: res.data.file_size,
                    file_type: res.data.file_type
                });
                showMessage('success', 'File attached. Press send to deliver.');
            } else {
                showMessage('error', res.data?.msg || 'File upload failed.');
            }
        } catch (err) {
            console.error('File upload error:', err);
            showMessage('error', err.response?.data?.msg || err.message || 'File upload error.');
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 8. Add Quick Emoji to Message
    const handleAddEmoji = (emoji) => {
        setMessageText((prev) => prev + emoji);
    };

    // 9. Filtered Conversations List (Delta Safari Team Hub + All Admin Users)
    const displayedConversations = useMemo(() => {
        if (!searchTerm.trim()) return conversations;
        const searchLower = searchTerm.toLowerCase();
        return conversations.filter((c) => {
            const titleMatch = (c.title || '').toLowerCase().includes(searchLower);
            const userNameMatch = `${c.other_user_first_name || ''} ${c.other_user_last_name || ''}`.toLowerCase().includes(searchLower);
            const messageMatch = (c.last_message || '').toLowerCase().includes(searchLower);
            const emailMatch = (c.other_user_email || '').toLowerCase().includes(searchLower);
            const phoneMatch = (c.other_user_phone || '').toLowerCase().includes(searchLower);
            return titleMatch || userNameMatch || messageMatch || emailMatch || phoneMatch;
        });
    }, [conversations, searchTerm]);

    // Filtered Team Members for Directory Modal
    const filteredDirectoryMembers = useMemo(() => {
        if (!membersSearchTerm.trim()) return adminUsersDirectory;
        const searchLower = membersSearchTerm.toLowerCase();
        return adminUsersDirectory.filter((u) => {
            const nameMatch = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(searchLower);
            const emailMatch = (u.email || '').toLowerCase().includes(searchLower);
            const phoneMatch = (u.phone || '').toLowerCase().includes(searchLower);
            const roleMatch = (u.admin === 1 ? 'super admin' : 'staff admin staff').includes(searchLower);
            return nameMatch || emailMatch || phoneMatch || roleMatch;
        });
    }, [adminUsersDirectory, membersSearchTerm]);

    // Active typing names for current chat
    const currentTypingNames = useMemo(() => {
        if (!activeConversation) return [];
        return typingUsers[activeConversation.id] || [];
    }, [typingUsers, activeConversation]);

    // Format message timestamp
    const formatMessageTime = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (e) {
            return '';
        }
    };

    const formatMessageDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (d.toDateString() === today.toDateString()) return 'Today';
            if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    // Group messages by date
    const groupedMessages = useMemo(() => {
        const groups = {};
        messages
            .filter((m) => m.message_type !== 'system')
            .forEach((msg) => {
                const dateKey = formatMessageDate(msg.created_at);
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(msg);
            });
        return groups;
    }, [messages]);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    const cleanBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

    return (
        <div className="container-xxl flex-grow-1 container-p-y overflow-hidden" style={{ height: 'calc(100vh - 120px)', minHeight: '650px', maxWidth: '100%' }}>
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white d-flex flex-column" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                <div className="row g-0 flex-grow-1 h-100 overflow-hidden" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                    {/* ========================================================================= */}
                    {/* LEFT SIDEBAR: CONVERSATIONS LIST & ADMIN DIRECTORY                        */}
                    {/* ========================================================================= */}
                    <div
                        className={`col-12 col-md-5 col-lg-4 col-xl-3 border-end flex-column h-100 bg-light-subtle overflow-hidden ${
                            mobileView === 'chat' ? 'd-none d-md-flex' : 'd-flex'
                        }`}
                        style={{ overflowX: 'hidden' }}
                    >
                        {/* Sidebar Header: Current User & New Chat / Members Button */}
                        <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2.5">
                                <div className="position-relative">
                                    <div
                                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-6 shadow-2xs"
                                        style={{ width: '40px', height: '40px', backgroundColor: '#0066cc' }}
                                    >
                                        {currentUser?.first_name ? currentUser.first_name.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <span
                                        className="position-absolute bottom-0 end-0 rounded-circle border border-2 border-white bg-success"
                                        style={{ width: '12px', height: '12px' }}
                                        title="Online"
                                    ></span>
                                </div>
                                <div className="text-truncate" style={{ maxWidth: '130px' }}>
                                    <h6 className="fw-bold text-dark mb-0 text-truncate small">
                                        {currentUser?.first_name} {currentUser?.last_name}
                                    </h6>
                                    <span className="badge bg-primary bg-opacity-10 text-primary py-0 px-1.5" style={{ fontSize: '10px' }}>
                                        {currentUser?.admin === 1 ? 'Super Admin' : 'Admin Staff'}
                                    </span>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setShowMembersModal(true)}
                                    className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '34px', height: '34px' }}
                                    title="View All Team Members Directory"
                                >
                                    <i className="ri ri-team-line fs-5"></i>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewChatModalOpen(true)}
                                    className="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                    style={{ width: '34px', height: '34px', backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    title="Start New Direct Chat"
                                >
                                    <i className="ri ri-chat-new-line fs-5"></i>
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="p-2.5 bg-white border-bottom">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light border-end-0"><i className="ri ri-search-line text-muted"></i></span>
                                <input
                                    type="text"
                                    className="form-control form-control-sm bg-light border-start-0"
                                    placeholder="Search chats, colleagues..."
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

                        {/* Conversations List Scrollable */}
                        <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2" style={{ maxHeight: 'calc(100vh - 230px)' }}>
                            {loadingConversations ? (
                                <div className="text-center py-5 text-muted">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                    <small className="d-block mt-2">Loading chats...</small>
                                </div>
                            ) : displayedConversations.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ri ri-chat-smile-2-line fs-1 d-block mb-1 opacity-50"></i>
                                    <small className="d-block">No conversations found</small>
                                    <button
                                        type="button"
                                        onClick={() => setNewChatModalOpen(true)}
                                        className="btn btn-outline-primary btn-xs rounded-pill mt-2"
                                    >
                                        + Start Chatting
                                    </button>
                                </div>
                            ) : (
                                displayedConversations.map((conv, idx) => {
                                    const isSelected = activeConversation?.id === conv.id || (activeConversation?.other_user_id && activeConversation.other_user_id === conv.other_user_id);
                                    const isGroup = conv.type === 'group' || conv.is_team_hub === 1;
                                    const isOtherOnline = !isGroup && conv.other_user_id && onlineUserIds.includes(conv.other_user_id);
                                    const displayName = isGroup
                                        ? conv.title || 'Delta Safari Team Hub'
                                        : `${conv.other_user_first_name || 'Admin'} ${conv.other_user_last_name || ''}`.trim();

                                    const isFirstDirect = !isGroup && (idx === 0 || displayedConversations[idx - 1]?.type === 'group' || displayedConversations[idx - 1]?.is_team_hub === 1);

                                    return (
                                        <React.Fragment key={conv.id || `user_${conv.other_user_id}`}>
                                            {isFirstDirect && (
                                                <div className="pt-3 pb-1.5 px-2 mt-1 mb-0.5">
                                                    <span className="text-xs fw-bold text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>
                                                        👥 Team Members &amp; Admins
                                                    </span>
                                                </div>
                                            )}

                                            <div
                                                onClick={() => handleSelectConversation(conv)}
                                                className={`p-3 rounded-3 cursor-pointer transition-all d-flex align-items-center gap-3 position-relative mb-1 shadow-2xs ${
                                                    isSelected ? 'bg-primary text-white shadow-sm' : 'bg-white hover-bg-light'
                                                }`}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: isSelected ? '1.5px solid #0066cc' : '1px solid #e2e8f0',
                                                    backgroundColor: isSelected ? '#0066cc' : isGroup ? '#fcfaf5' : '#ffffff',
                                                    transition: 'all 0.2s ease-in-out',
                                                    padding: '12px 14px'
                                                }}
                                            >
                                                {/* Avatar */}
                                                <div className="position-relative flex-shrink-0">
                                                    {isGroup ? (
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden shadow-2xs p-1"
                                                            style={{
                                                                width: '42px',
                                                                height: '42px',
                                                                backgroundColor: '#ffffff',
                                                                border: isSelected ? '2px solid #ffffff' : '1.5px solid #e2e8f0'
                                                            }}
                                                        >
                                                            <img
                                                                src="/images/logo_DS.png"
                                                                alt="Delta Safari Favicon"
                                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-2xs ${
                                                                isSelected ? 'bg-white text-primary' : conv.other_user_role === 1 ? 'bg-warning bg-opacity-20 text-warning-emphasis' : 'bg-info bg-opacity-10 text-info'
                                                            }`}
                                                            style={{ width: '42px', height: '42px', fontSize: '15px' }}
                                                        >
                                                            {conv.other_user_first_name ? conv.other_user_first_name.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                    )}

                                                    {/* Online Status Dot */}
                                                    {!isGroup && (
                                                        <span
                                                            className={`position-absolute bottom-0 end-0 rounded-circle border border-2 ${
                                                                isSelected ? 'border-primary' : 'border-white'
                                                            } ${isOtherOnline ? 'bg-success' : 'bg-secondary'}`}
                                                            style={{ width: '12px', height: '12px' }}
                                                            title={isOtherOnline ? 'Active Online' : 'Offline'}
                                                        ></span>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <div className="d-flex align-items-center gap-1.5 overflow-hidden text-truncate">
                                                            <h6
                                                                className={`fw-bold mb-0 text-truncate small ${
                                                                    isSelected ? 'text-white' : 'text-dark'
                                                                }`}
                                                                style={{ fontSize: '13.5px', lineHeight: 1.2 }}
                                                            >
                                                                {displayName}
                                                            </h6>
                                                            {!isGroup && (
                                                                <span
                                                                    className={`badge py-0.5 px-1.5 text-xs rounded-pill ${
                                                                        isSelected
                                                                            ? 'bg-white text-primary'
                                                                            : conv.other_user_role === 1
                                                                            ? 'bg-warning bg-opacity-25 text-dark'
                                                                            : 'bg-light text-muted border'
                                                                    }`}
                                                                    style={{ fontSize: '9.5px' }}
                                                                >
                                                                    {conv.other_user_role === 1 ? 'Super Admin' : 'Staff'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <small
                                                            className={`text-xs flex-shrink-0 ms-1 ${
                                                                isSelected ? 'text-white opacity-75' : 'text-muted'
                                                            }`}
                                                            style={{ fontSize: '10.5px' }}
                                                        >
                                                            {formatMessageTime(conv.last_message_at)}
                                                        </small>
                                                    </div>

                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <p
                                                            className={`text-truncate mb-0 text-xs ${
                                                                isSelected ? 'text-white opacity-90' : 'text-muted'
                                                            }`}
                                                            style={{ fontSize: '12px', maxWidth: '170px', lineHeight: 1.3 }}
                                                        >
                                                            {conv.last_sender_first_name ? `${conv.last_sender_first_name}: ` : ''}
                                                            {conv.last_message || (isGroup ? 'Official group channel' : 'Click to send message')}
                                                        </p>

                                                        {/* Unread Badge */}
                                                        {parseInt(conv.unread_count || 0) > 0 && (
                                                            <span
                                                                className={`badge rounded-pill ${
                                                                    isSelected ? 'bg-white text-primary' : 'bg-danger text-white'
                                                                }`}
                                                                style={{ fontSize: '10.5px', padding: '3px 7px' }}
                                                            >
                                                                {conv.unread_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* RIGHT MAIN CHAT AREA                                                      */}
                    {/* ========================================================================= */}
                    <div
                        className={`col-12 col-md-7 col-lg-8 col-xl-9 flex-column h-100 bg-white overflow-hidden ${
                            mobileView === 'list' ? 'd-none d-md-flex' : 'd-flex'
                        }`}
                        style={{ overflowX: 'hidden' }}
                    >
                        {activeConversation ? (
                            <>
                                {/* 1. Active Chat Header */}
                                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white shadow-2xs">
                                    <div className="d-flex align-items-center gap-2 gap-sm-3 text-truncate me-2">
                                        {/* Mobile Back to Members Button */}
                                        <button
                                            type="button"
                                            onClick={() => setMobileView('list')}
                                            className="btn btn-outline-secondary btn-sm d-md-none rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
                                            style={{ width: '36px', height: '36px' }}
                                            title="Back to All Members / Chats"
                                        >
                                            <i className="ri ri-arrow-left-line fs-5"></i>
                                        </button>

                                        <div className="position-relative flex-shrink-0">
                                            {activeConversation.type === 'group' ? (
                                                <div
                                                    className="rounded-circle bg-white border d-flex align-items-center justify-content-center overflow-hidden shadow-2xs p-1"
                                                    style={{ width: '44px', height: '44px' }}
                                                >
                                                    <img
                                                        src="/images/logo_DS.png"
                                                        alt="Delta Safari Favicon"
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-2xs"
                                                    style={{ width: '42px', height: '42px', fontSize: '16px', backgroundColor: '#0066cc' }}
                                                >
                                                    {activeConversation.other_user_first_name
                                                        ? activeConversation.other_user_first_name.charAt(0).toUpperCase()
                                                        : 'U'}
                                                </div>
                                            )}
                                            {activeConversation.type !== 'group' && (
                                                <span
                                                    className={`position-absolute bottom-0 end-0 rounded-circle border border-2 border-white ${
                                                        onlineUserIds.includes(activeConversation.other_user_id)
                                                            ? 'bg-success'
                                                            : 'bg-secondary'
                                                    }`}
                                                    style={{ width: '12px', height: '12px' }}
                                                ></span>
                                            )}
                                        </div>

                                        <div className="text-truncate">
                                            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1.5 text-truncate">
                                                <span className="text-truncate">
                                                    {activeConversation.type === 'group'
                                                        ? activeConversation.title || 'Delta Safari Team Hub'
                                                        : `${activeConversation.other_user_first_name || 'Admin'} ${activeConversation.other_user_last_name || ''}`}
                                                </span>
                                                {activeConversation.type === 'group' ? (
                                                    <span className="badge bg-warning bg-opacity-25 text-dark rounded-pill px-2 py-0.5 small d-none d-sm-inline">
                                                        Team Hub
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-light text-muted border py-0 px-1.5 small d-none d-sm-inline">
                                                        {activeConversation.other_user_role === 1 ? 'Super Admin' : 'Staff'}
                                                    </span>
                                                )}
                                            </h6>

                                            {/* Status / Typing / Participants */}
                                            <small className="text-xs text-muted d-block text-truncate">
                                                {currentTypingNames.length > 0 ? (
                                                    <span className="text-primary fw-bold d-inline-flex align-items-center gap-1">
                                                        <span className="spinner-grow spinner-grow-sm" style={{ width: '8px', height: '8px' }}></span>
                                                        {currentTypingNames.join(', ')} is typing...
                                                    </span>
                                                ) : activeConversation.type === 'group' ? (
                                                    <span className="text-muted">
                                                        👥 {adminUsersDirectory.length + 1} team members • Real-time Socket.io
                                                    </span>
                                                ) : onlineUserIds.includes(activeConversation.other_user_id) ? (
                                                    <span className="text-success fw-semibold">🟢 Active Online</span>
                                                ) : (
                                                    <span className="text-muted">⚪ Offline</span>
                                                )}
                                            </small>
                                        </div>
                                    </div>

                                    {/* Action items */}
                                    <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setShowMembersModal(true)}
                                            className="btn btn-outline-primary btn-sm rounded-pill px-2.5 px-sm-3 py-1 d-inline-flex align-items-center gap-1 shadow-2xs"
                                            title="View All Team Members"
                                        >
                                            <i className="ri ri-team-line fs-6"></i>
                                            <span className="small fw-semibold d-none d-sm-inline">Members</span>
                                            <span className="badge bg-primary text-white rounded-pill ms-0.5" style={{ fontSize: '10px' }}>
                                                {adminUsersDirectory.length + 1}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectConversation(activeConversation)}
                                            className="btn btn-light btn-sm rounded-circle p-2 text-muted"
                                            title="Refresh Messages"
                                        >
                                            <i className="ri ri-refresh-line"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Messages Feed Scrollable */}
                                <div
                                    className="flex-grow-1 p-3.5 overflow-auto d-flex flex-column gap-3"
                                    style={{
                                        backgroundColor: '#f8fafc',
                                        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
                                        backgroundSize: '20px 20px',
                                        overflowX: 'hidden'
                                    }}
                                >
                                    {loadingMessages ? (
                                        <div className="m-auto text-center py-5">
                                            <LoadingComponent />
                                            <small className="text-muted mt-2 d-block">Loading conversation history...</small>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="m-auto text-center py-5 text-muted">
                                            <i className="ri ri-chat-voice-line fs-1 d-block text-primary opacity-50 mb-2"></i>
                                            <h6 className="fw-bold text-dark">Start the conversation!</h6>
                                            <p className="small text-muted mb-0" style={{ maxWidth: '320px' }}>
                                                Send a message, quick emoji, or document to collaborate in real-time.
                                            </p>
                                        </div>
                                    ) : (
                                        Object.entries(groupedMessages).map(([dateLabel, dateMsgs]) => (
                                            <div key={dateLabel} className="d-flex flex-column gap-2.5">
                                                {/* Date Separator Pill */}
                                                <div className="text-center my-1">
                                                    <span
                                                        className="badge bg-white text-dark border shadow-2xs rounded-pill px-3 py-1 text-xs fw-semibold"
                                                        style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                                                    >
                                                        {dateLabel}
                                                    </span>
                                                </div>

                                                {/* Messages */}
                                                {dateMsgs.map((msg) => {
                                                    if (msg.message_type === 'system') return null;
                                                    const isMe = msg.sender_id === currentUser?.id;

                                                    return (
                                                        <div
                                                            key={msg.id}
                                                            className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}
                                                        >
                                                            {/* Other User Avatar */}
                                                            {!isMe && (
                                                                <div
                                                                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold me-2 flex-shrink-0 align-self-end shadow-2xs"
                                                                    style={{ width: '28px', height: '28px', fontSize: '11px', backgroundColor: '#0066cc' }}
                                                                    title={`${msg.sender_first_name} ${msg.sender_last_name}`}
                                                                >
                                                                    {msg.sender_first_name ? msg.sender_first_name.charAt(0).toUpperCase() : 'U'}
                                                                </div>
                                                            )}

                                                            {/* Bubble Container */}
                                                            <div
                                                                className="position-relative"
                                                                style={{ maxWidth: '75%', minWidth: '120px' }}
                                                            >
                                                                {/* Sender Name for group chats */}
                                                                {!isMe && activeConversation.type === 'group' && (
                                                                    <small className="text-xs fw-bold text-primary mb-1 d-block" style={{ fontSize: '11px' }}>
                                                                        {msg.sender_first_name} {msg.sender_last_name}
                                                                        {msg.sender_role === 1 && (
                                                                            <span className="badge bg-warning bg-opacity-25 text-dark ms-1" style={{ fontSize: '9px' }}>
                                                                                Super Admin
                                                                            </span>
                                                                        )}
                                                                    </small>
                                                                )}

                                                                {/* Message Body Card */}
                                                                <div
                                                                    className={`rounded-4 p-3 shadow-2xs ${
                                                                        isMe
                                                                            ? 'text-white'
                                                                            : 'bg-white text-dark border'
                                                                    }`}
                                                                    style={{
                                                                        backgroundColor: isMe ? '#0066cc' : '#ffffff',
                                                                        borderBottomRightRadius: isMe ? '4px' : '16px',
                                                                        borderBottomLeftRadius: !isMe ? '4px' : '16px'
                                                                    }}
                                                                >
                                                                    {/* 1. Image Type */}
                                                                    {msg.message_type === 'image' && msg.file_url && (
                                                                        <div className="mb-2 overflow-hidden rounded-3">
                                                                            <img
                                                                                src={msg.file_url.startsWith('http') ? msg.file_url : `${cleanBaseUrl}${msg.file_url}`}
                                                                                alt={msg.file_name || 'Attached Image'}
                                                                                className="img-fluid rounded-3 cursor-pointer hover-opacity transition-all"
                                                                                style={{ maxHeight: '250px', objectFit: 'cover', width: '100%' }}
                                                                                onClick={() => setImagePreviewModalUrl(msg.file_url.startsWith('http') ? msg.file_url : `${cleanBaseUrl}${msg.file_url}`)}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* 2. File / Document Type */}
                                                                    {msg.message_type === 'file' && msg.file_url && (
                                                                        <div
                                                                            className={`p-2.5 rounded-3 mb-2 d-flex align-items-center justify-content-between gap-2 ${
                                                                                isMe ? 'bg-white bg-opacity-15 text-white' : 'bg-light text-dark'
                                                                            }`}
                                                                        >
                                                                            <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                                                <i className="ri ri-file-text-fill fs-3 text-warning"></i>
                                                                                <div className="text-truncate">
                                                                                    <span className="fw-semibold d-block text-truncate small">
                                                                                        {msg.file_name || 'Document File'}
                                                                                    </span>
                                                                                    <small className="opacity-75 text-xs">
                                                                                        {msg.file_size || 'Attached file'}
                                                                                    </small>
                                                                                </div>
                                                                            </div>
                                                                            <a
                                                                                href={msg.file_url.startsWith('http') ? msg.file_url : `${cleanBaseUrl}${msg.file_url}`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                download
                                                                                className={`btn btn-sm rounded-circle p-1.5 flex-shrink-0 ${
                                                                                    isMe ? 'btn-light text-primary' : 'btn-primary text-white'
                                                                                }`}
                                                                                title="Download File"
                                                                            >
                                                                                <i className="ri ri-download-2-line"></i>
                                                                            </a>
                                                                        </div>
                                                                    )}

                                                                    {/* 3. Text Message Content */}
                                                                    {msg.message && (
                                                                        <p
                                                                            className="mb-0"
                                                                            style={{
                                                                                whiteSpace: 'pre-wrap',
                                                                                wordBreak: 'break-word',
                                                                                lineHeight: '1.5',
                                                                                fontSize: '13.5px'
                                                                            }}
                                                                        >
                                                                            {msg.message}
                                                                        </p>
                                                                    )}

                                                                    {/* Message Timestamp & Check */}
                                                                    <div
                                                                        className={`d-flex align-items-center justify-content-end gap-1 mt-1 pt-0.5 text-xs ${
                                                                            isMe ? 'text-white opacity-75' : 'text-muted'
                                                                        }`}
                                                                        style={{ fontSize: '10px' }}
                                                                    >
                                                                        <span>{formatMessageTime(msg.created_at)}</span>
                                                                        {isMe && (
                                                                            <i className="ri ri-check-double-line" title="Delivered"></i>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* 3. File Preview Banner (if attached before sending) */}
                                {selectedFilePreview && (
                                    <div className="p-2.5 bg-light border-top d-flex justify-content-between align-items-center px-4">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri ri-attachment-2 text-primary fs-4"></i>
                                            <div>
                                                <span className="fw-bold text-dark small d-block">
                                                    Attached: {selectedFilePreview.file_name}
                                                </span>
                                                <small className="text-muted text-xs">
                                                    {selectedFilePreview.file_size} • Ready to send
                                                </small>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFilePreview(null)}
                                            className="btn btn-sm btn-icon btn-light rounded-circle"
                                            title="Remove Attachment"
                                        >
                                            <i className="ri ri-close-line text-danger"></i>
                                        </button>
                                    </div>
                                )}

                                {/* 4. Quick Emojis Bar (expandable) */}
                                <div className="px-3 py-1.5 bg-white border-top d-flex align-items-center gap-1.5 overflow-x-auto">
                                    <span className="text-xs text-muted me-1">Quick:</span>
                                    {quickEmojis.map((em) => (
                                        <button
                                            key={em}
                                            type="button"
                                            onClick={() => handleAddEmoji(em)}
                                            className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center"
                                            style={{ width: '28px', height: '28px', fontSize: '14px' }}
                                        >
                                            {em}
                                        </button>
                                    ))}
                                </div>

                                {/* 5. Bottom Message Composer */}
                                <div className="p-3 bg-white border-top">
                                    <form onSubmit={handleSendMessage} className="d-flex align-items-center gap-2">
                                        {/* File Attachment Button */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingFile}
                                            className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center text-muted"
                                            style={{ width: '40px', height: '40px' }}
                                            title="Attach File / Image / PDF"
                                        >
                                            {uploadingFile ? (
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                            ) : (
                                                <i className="ri ri-attachment-2 fs-5"></i>
                                            )}
                                        </button>

                                        {/* Text Input */}
                                        <input
                                            type="text"
                                            className="form-control rounded-pill bg-light border-0 px-3.5 py-2 text-dark"
                                            placeholder={`Message ${
                                                activeConversation.type === 'group'
                                                    ? 'Delta Safari Team Hub...'
                                                    : `${activeConversation.other_user_first_name || 'colleague'}...`
                                            }`}
                                            value={messageText}
                                            onChange={handleTextChange}
                                            style={{ fontSize: '13.5px' }}
                                        />

                                        {/* Send Button */}
                                        <button
                                            type="submit"
                                            disabled={!messageText.trim() && !selectedFilePreview}
                                            className="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                backgroundColor: '#0066cc',
                                                borderColor: '#0066cc'
                                            }}
                                            title="Send Message"
                                        >
                                            <i className="ri ri-send-plane-2-fill fs-5"></i>
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="m-auto text-center p-5 text-muted">
                                <div
                                    className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center mb-3"
                                    style={{ width: '80px', height: '80px' }}
                                >
                                    <i className="ri ri-chat-smile-2-fill fs-1"></i>
                                </div>
                                <h5 className="fw-bold text-dark mb-1">Delta Safari Real-Time Team Chat</h5>
                                <p className="text-muted small mb-4" style={{ maxWidth: '380px' }}>
                                    Select a direct chat or the official Delta Safari Team Hub from the sidebar to start collaborating.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setNewChatModalOpen(true)}
                                    className="btn btn-primary rounded-pill px-4"
                                    style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                >
                                    <i className="ri ri-chat-new-line me-1"></i> Start New Conversation
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* NEW DIRECT CHAT USER PICKER MODAL                                         */}
            {/* ========================================================================= */}
            {newChatModalOpen && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-md">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-chat-new-line text-primary"></i>
                                    <span>Start Direct Chat with Team Member</span>
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setNewChatModalOpen(false)} aria-label="Close"></button>
                            </div>

                            <div className="modal-body p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <div className="d-flex flex-column gap-2">
                                    {adminUsersDirectory.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            No other active admin users found.
                                        </div>
                                    ) : (
                                        adminUsersDirectory.map((u) => {
                                            const isOnline = onlineUserIds.includes(u.id);
                                            return (
                                                <div
                                                    key={u.id}
                                                    onClick={() => handleStartDirectChat(u.id)}
                                                    className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center cursor-pointer hover-bg-white border transition-all"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="position-relative">
                                                            <div
                                                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                                                style={{ width: '38px', height: '38px', backgroundColor: '#0066cc' }}
                                                            >
                                                                {u.first_name ? u.first_name.charAt(0).toUpperCase() : 'U'}
                                                            </div>
                                                            <span
                                                                className={`position-absolute bottom-0 end-0 rounded-circle border border-2 border-white ${
                                                                    isOnline ? 'bg-success' : 'bg-secondary'
                                                                }`}
                                                                style={{ width: '10px', height: '10px' }}
                                                            ></span>
                                                        </div>

                                                        <div>
                                                            <h6 className="fw-bold text-dark mb-0 small">
                                                                {u.first_name} {u.last_name}
                                                            </h6>
                                                            <small className="text-muted text-xs d-block">
                                                                {u.email || u.phone}
                                                            </small>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-light text-secondary border">
                                                            {u.admin === 1 ? 'Super Admin' : 'Staff'}
                                                        </span>
                                                        <span className="btn btn-outline-primary btn-xs rounded-pill px-2.5">
                                                            Chat
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TEAM MEMBERS DIRECTORY MODAL (MOBILE & DESKTOP)                           */}
            {/* ========================================================================= */}
            {showMembersModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1055 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <div
                                        className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                                        style={{ width: '38px', height: '38px' }}
                                    >
                                        <i className="ri ri-team-fill fs-5"></i>
                                    </div>
                                    <div>
                                        <h5 className="modal-title fw-bold text-dark mb-0">Delta Safari Team Members</h5>
                                        <small className="text-muted text-xs">
                                            {adminUsersDirectory.length + 1} registered admins &amp; staff members
                                        </small>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowMembersModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <div className="p-3 bg-light border-bottom">
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-white border-end-0">
                                        <i className="ri ri-search-line text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm border-start-0"
                                        placeholder="Search members by name, role, email, phone..."
                                        value={membersSearchTerm}
                                        onChange={(e) => setMembersSearchTerm(e.target.value)}
                                    />
                                    {membersSearchTerm && (
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => setMembersSearchTerm('')}
                                        >
                                            <i className="ri ri-close-line"></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="modal-body p-3 p-md-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                                <div className="d-flex flex-column gap-2.5">
                                    {/* Current User Card */}
                                    <div className="p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-25 d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="position-relative">
                                                <div
                                                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                                    style={{ width: '44px', height: '44px', backgroundColor: '#0066cc' }}
                                                >
                                                    {currentUser?.first_name ? currentUser.first_name.charAt(0).toUpperCase() : 'A'}
                                                </div>
                                                <span
                                                    className="position-absolute bottom-0 end-0 rounded-circle border border-2 border-white bg-success"
                                                    style={{ width: '12px', height: '12px' }}
                                                    title="Active Online (You)"
                                                ></span>
                                            </div>
                                            <div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <h6 className="fw-bold text-dark mb-0">
                                                        {currentUser?.first_name} {currentUser?.last_name} (You)
                                                    </h6>
                                                    <span className="badge bg-primary text-white rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                                                        {currentUser?.admin === 1 ? 'Super Admin' : 'Staff'}
                                                    </span>
                                                </div>
                                                <small className="text-muted d-block text-xs mt-0.5">
                                                    {currentUser?.email || 'Logged in account'} {currentUser?.phone ? `• 📞 ${currentUser.phone}` : ''}
                                                </small>
                                            </div>
                                        </div>
                                        <span className="badge bg-success bg-opacity-25 text-success-emphasis rounded-pill px-2.5 py-1">
                                            🟢 You (Active)
                                        </span>
                                    </div>

                                    {/* All Other Admin Users */}
                                    {filteredDirectoryMembers.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            No team members matched your search.
                                        </div>
                                    ) : (
                                        filteredDirectoryMembers.map((member) => {
                                            const isOnline = onlineUserIds.includes(member.id);
                                            return (
                                                <div
                                                    key={member.id}
                                                    className="p-3 bg-white rounded-3 border d-flex justify-content-between align-items-center hover-bg-light shadow-2xs"
                                                >
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="position-relative">
                                                            <div
                                                                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                                                                    member.admin === 1
                                                                        ? 'bg-warning bg-opacity-25 text-warning-emphasis'
                                                                        : 'bg-info bg-opacity-15 text-info-emphasis'
                                                                }`}
                                                                style={{ width: '44px', height: '44px', fontSize: '16px' }}
                                                            >
                                                                {member.first_name ? member.first_name.charAt(0).toUpperCase() : 'U'}
                                                            </div>
                                                            <span
                                                                className={`position-absolute bottom-0 end-0 rounded-circle border border-2 border-white ${
                                                                    isOnline ? 'bg-success' : 'bg-secondary'
                                                                }`}
                                                                style={{ width: '12px', height: '12px' }}
                                                                title={isOnline ? 'Active Online' : 'Offline'}
                                                            ></span>
                                                        </div>

                                                        <div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <h6 className="fw-bold text-dark mb-0">
                                                                    {member.first_name} {member.last_name}
                                                                </h6>
                                                                <span
                                                                    className={`badge py-0.5 px-2 text-xs rounded-pill ${
                                                                        member.admin === 1
                                                                            ? 'bg-warning bg-opacity-25 text-dark'
                                                                            : 'bg-light text-muted border'
                                                                    }`}
                                                                    style={{ fontSize: '10px' }}
                                                                >
                                                                    {member.admin === 1 ? 'Super Admin' : 'Staff'}
                                                                </span>
                                                            </div>
                                                            <div className="d-flex flex-wrap align-items-center gap-2 text-xs text-muted mt-0.5">
                                                                {member.email && <span>📧 {member.email}</span>}
                                                                {member.phone && <span>📞 {member.phone}</span>}
                                                                <span className={isOnline ? 'text-success fw-semibold' : 'text-muted'}>
                                                                    {isOnline ? '• 🟢 Online' : '• ⚪ Offline'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowMembersModal(false);
                                                            handleStartDirectChat(member.id);
                                                        }}
                                                        className="btn btn-outline-primary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-2xs"
                                                    >
                                                        <i className="ri ri-chat-3-line"></i>
                                                        <span className="small fw-semibold">Message</span>
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* FULL IMAGE PREVIEW MODAL                                                  */}
            {/* ========================================================================= */}
            {imagePreviewModalUrl && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
                    onClick={() => setImagePreviewModalUrl(null)}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content border-0 bg-transparent text-center position-relative">
                            <button
                                type="button"
                                className="btn btn-light btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow"
                                onClick={() => setImagePreviewModalUrl(null)}
                            >
                                <i className="ri ri-close-line fs-5"></i>
                            </button>
                            <img
                                src={imagePreviewModalUrl}
                                alt="Attachment Preview"
                                className="img-fluid rounded-4 shadow-lg mx-auto"
                                style={{ maxHeight: '80vh', objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
