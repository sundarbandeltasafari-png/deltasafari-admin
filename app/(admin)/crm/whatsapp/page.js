'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    getWhatsAppContactsUrl, 
    createManualLeadUrl,
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
    const router = useRouter();
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

    // Create Manual Lead Modal State
    const [manualLeadModalOpen, setManualLeadModalOpen] = useState(false);
    const [savingManualLead, setSavingManualLead] = useState(false);
    const [manualLeadFormData, setManualLeadFormData] = useState({
        name: '',
        phone: '',
        email: '',
        assigned_to: '',
        lead_type: 'warm',
        travel_destination: 'Sundarban Safari',
        travel_date: '',
        adults: 2,
        children: 0,
        infants: 0,
        number_of_persons: 2,
        total_rooms: 1,
        rooms: [{ id: 1, room_number: 1, type: 'non_ac', extra_charge: 0 }],
        package_name: '',
        custom_package_name: '',
        package_rate: '',
        next_followup_date: '',
        extra_note: '',
        initial_message: '',
        send_message_now: false
    });

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
        adults: 2,
        children: 0,
        infants: 0,
        number_of_persons: 2,
        total_rooms: 1,
        rooms: [{ id: 1, room_number: 1, type: 'non_ac', extra_charge: 0 }],
        package_name: '',
        custom_package_name: '',
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
        custom_package_name: '',
        adults: 2,
        children: 0,
        infants: 0,
        total_rooms: 1,
        rooms: [{ id: 1, room_number: 1, type: 'non_ac', extra_charge: 0 }],
        bed_type: 'Double Bed',
        extra_discount: 0,
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

    // Helper to calculate total package rate based on package price, adults, children, and AC extra charges
    const calculateAutoRate = (packageName, adultsCount = 2, childrenCount = 0, roomsList = []) => {
        let adults = 0;
        let children = 0;
        let rooms = roomsList;

        if (Array.isArray(childrenCount)) {
            adults = Math.max(1, parseInt(adultsCount, 10) || 1);
            children = 0;
            rooms = childrenCount;
        } else {
            adults = Math.max(0, parseInt(adultsCount, 10) || 0);
            children = Math.max(0, parseInt(childrenCount, 10) || 0);
        }

        const billablePersons = adults + children;
        const matched = (packageSuggestions || []).find(p => (p.name === packageName || p.title === packageName));
        const unitPrice = matched ? Number(matched.actual_price || matched.base_price || matched.price || 0) : 0;
        const baseTotal = unitPrice > 0 ? (unitPrice * billablePersons) : 0;
        
        const acExtraTotal = (rooms || []).reduce((sum, r) => {
            return sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0);
        }, 0);

        const totalRate = (unitPrice > 0 || acExtraTotal > 0) ? (baseTotal + acExtraTotal) : 0;
        return {
            unitPrice,
            billablePersons,
            baseTotal,
            acExtraTotal,
            totalRate
        };
    };

    // Helper to build default rooms array based on count
    const createInitialRooms = (count = 1) => {
        const roomCount = Math.max(1, parseInt(count, 10) || 1);
        const arr = [];
        for (let i = 1; i <= roomCount; i++) {
            arr.push({ id: i, room_number: i, type: 'non_ac', extra_charge: 0 });
        }
        return arr;
    };

    // --- Follow-up Modal Handlers ---
    const handleOpenFollowupModal = async (contact) => {
        const formatDateVal = (d) => {
            if (!d) return '';
            try { return new Date(d).toISOString().split('T')[0]; } catch (e) { return ''; }
        };

        const initialRooms = [{ id: 1, room_number: 1, type: 'non_ac', extra_charge: 0 }];
        setFollowupFormData({
            contact_id: contact.id,
            lead_name: contact.name || '',
            phone: contact.wa_id || '',
            email: '',
            lead_type: 'warm',
            travel_date: '',
            travel_destination: 'Sundarban',
            adults: 2,
            children: 0,
            infants: 0,
            number_of_persons: 2,
            total_rooms: 1,
            rooms: initialRooms,
            package_name: '',
            custom_package_name: '',
            package_rate: '',
            next_followup_date: '',
            extra_note: ''
        });
        setFollowupModalOpen(true);

        try {
            const res = await axiosGet(`${getSingleLeadFollowupUrl}${contact.id}`, token);
            if (res?.status && res?.data?.followup) {
                const f = res.data.followup;
                const loadedRoomsCount = Math.max(1, parseInt(f.total_rooms, 10) || 1);
                
                // Parse existing room details or fallback
                let rawRooms = f.rooms || f.room_details;
                if (typeof rawRooms === 'string') {
                    try { rawRooms = JSON.parse(rawRooms); } catch (e) { rawRooms = null; }
                }

                let loadedRooms = [];
                if (Array.isArray(rawRooms) && rawRooms.length > 0) {
                    loadedRooms = rawRooms.map((r, i) => ({
                        id: r.id || i + 1,
                        room_number: r.room_number || i + 1,
                        type: r.type === 'ac' ? 'ac' : 'non_ac',
                        extra_charge: Number(r.extra_charge) || 0
                    }));
                } else {
                    // Smart fallback for existing records without saved room_details
                    const effectivePkgName = f.package_name || '';
                    const matched = (packageSuggestions || []).find(p => (p.name === effectivePkgName || p.title === effectivePkgName));
                    const unitPrice = matched ? Number(matched.actual_price || matched.base_price || matched.price || 0) : 0;
                    const baseTotal = unitPrice > 0 ? (unitPrice * (parseInt(f.number_of_persons, 10) || 1)) : 0;
                    const currentRate = Number(f.package_rate) || 0;
                    const diff = (unitPrice > 0 && currentRate > baseTotal) ? (currentRate - baseTotal) : 0;
                    const noteText = `${f.extra_note || ''} ${f.conversion_note || ''}`;
                    const mentionsAc = /\bAC\b/i.test(noteText) && !/\bNon-AC\b/i.test(noteText);

                    if (diff > 0 || mentionsAc) {
                        loadedRooms = Array.from({ length: loadedRoomsCount }, (_, i) => ({
                            id: i + 1,
                            room_number: i + 1,
                            type: i === 0 ? 'ac' : 'non_ac',
                            extra_charge: i === 0 ? (diff > 0 ? diff : 0) : 0
                        }));
                    } else {
                        loadedRooms = createInitialRooms(loadedRoomsCount);
                    }
                }

                const isExistingPkgInList = (packageSuggestions || []).some(p => (p.name === f.package_name || p.title === f.package_name));

                const loadedAdults = f.adults !== null && f.adults !== undefined ? Math.max(1, parseInt(f.adults, 10) || 1) : Math.max(1, parseInt(f.number_of_persons, 10) || 2);
                const loadedChildren = Math.max(0, parseInt(f.children, 10) || 0);
                const loadedInfants = Math.max(0, parseInt(f.infants, 10) || 0);
                const totalPax = loadedAdults + loadedChildren + loadedInfants;

                setFollowupFormData({
                    contact_id: contact.id,
                    lead_name: f.lead_name || contact.name || '',
                    phone: f.phone || contact.wa_id || '',
                    email: f.email || '',
                    lead_type: f.lead_type || 'warm',
                    travel_date: formatDateVal(f.travel_date),
                    travel_destination: f.travel_destination || 'Sundarban',
                    adults: loadedAdults,
                    children: loadedChildren,
                    infants: loadedInfants,
                    number_of_persons: totalPax,
                    total_rooms: loadedRooms.length || loadedRoomsCount,
                    rooms: loadedRooms,
                    package_name: isExistingPkgInList ? (f.package_name || '') : (f.package_name ? '__custom__' : ''),
                    custom_package_name: isExistingPkgInList ? '' : (f.package_name || ''),
                    package_rate: f.package_rate || '',
                    next_followup_date: formatDateVal(f.next_followup_date),
                    extra_note: f.extra_note || ''
                });
            }
        } catch (e) {}
    };

    const handleFollowupPackageChange = (val) => {
        const { totalRate, unitPrice } = calculateAutoRate(val, followupFormData.adults, followupFormData.children, followupFormData.rooms);
        setFollowupFormData(prev => ({
            ...prev,
            package_name: val,
            custom_package_name: val === '__custom__' ? prev.custom_package_name : '',
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleFollowupAdultsChange = (val) => {
        const adults = Math.max(0, parseInt(val, 10) || 0);
        const effectivePkg = followupFormData.package_name === '__custom__' ? followupFormData.custom_package_name : followupFormData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, adults, followupFormData.children, followupFormData.rooms);
        const totalPax = adults + (parseInt(followupFormData.children, 10) || 0) + (parseInt(followupFormData.infants, 10) || 0);
        setFollowupFormData(prev => ({
            ...prev,
            adults: val,
            number_of_persons: totalPax,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleFollowupChildrenChange = (val) => {
        const children = Math.max(0, parseInt(val, 10) || 0);
        const effectivePkg = followupFormData.package_name === '__custom__' ? followupFormData.custom_package_name : followupFormData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, followupFormData.adults, children, followupFormData.rooms);
        const totalPax = (parseInt(followupFormData.adults, 10) || 0) + children + (parseInt(followupFormData.infants, 10) || 0);
        setFollowupFormData(prev => ({
            ...prev,
            children: val,
            number_of_persons: totalPax,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleFollowupInfantsChange = (val) => {
        const infants = Math.max(0, parseInt(val, 10) || 0);
        const totalPax = (parseInt(followupFormData.adults, 10) || 0) + (parseInt(followupFormData.children, 10) || 0) + infants;
        setFollowupFormData(prev => ({
            ...prev,
            infants: val,
            number_of_persons: totalPax
        }));
    };

    const handleFollowupAddRoom = () => {
        const nextRooms = [...(followupFormData.rooms || [])];
        nextRooms.push({ id: Date.now(), room_number: nextRooms.length + 1, type: 'non_ac', extra_charge: 0 });
        const effectivePkg = followupFormData.package_name === '__custom__' ? followupFormData.custom_package_name : followupFormData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, followupFormData.adults, followupFormData.children, nextRooms);
        setFollowupFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleFollowupRemoveRoom = (idx) => {
        if ((followupFormData.rooms || []).length <= 1) return;
        const nextRooms = followupFormData.rooms.filter((_, i) => i !== idx).map((r, i) => ({ ...r, room_number: i + 1 }));
        const effectivePkg = followupFormData.package_name === '__custom__' ? followupFormData.custom_package_name : followupFormData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, followupFormData.adults, followupFormData.children, nextRooms);
        setFollowupFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleFollowupRoomChange = (idx, changes) => {
        const nextRooms = followupFormData.rooms.map((r, i) => i === idx ? { ...r, ...changes } : r);
        const effectivePkg = followupFormData.package_name === '__custom__' ? followupFormData.custom_package_name : followupFormData.package_name;
        const { totalRate, unitPrice, acExtraTotal } = calculateAutoRate(effectivePkg, followupFormData.adults, followupFormData.children, nextRooms);
        setFollowupFormData(prev => {
            let nextRate = prev.package_rate;
            if (unitPrice > 0) {
                nextRate = String(totalRate);
            } else if (prev.package_rate && !isNaN(Number(prev.package_rate))) {
                const prevAcTotal = (prev.rooms || []).reduce((sum, r) => sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0);
                nextRate = String(Math.max(0, Number(prev.package_rate) + (acExtraTotal - prevAcTotal)));
            }
            return {
                ...prev,
                total_rooms: nextRooms.length,
                rooms: nextRooms,
                package_rate: nextRate
            };
        });
    };

    const handleSaveFollowup = async (e) => {
        e.preventDefault();
        if (!followupFormData.contact_id) return;
        setSavingFollowup(true);

        const finalPackageName = followupFormData.package_name === '__custom__'
            ? (followupFormData.custom_package_name || 'Custom Package')
            : followupFormData.package_name;

        const totalPax = (parseInt(followupFormData.adults, 10) || 0) + (parseInt(followupFormData.children, 10) || 0) + (parseInt(followupFormData.infants, 10) || 0);

        const payload = {
            ...followupFormData,
            package_name: finalPackageName,
            adults: followupFormData.adults,
            children: followupFormData.children,
            infants: followupFormData.infants,
            number_of_persons: totalPax || 1,
            total_rooms: (followupFormData.rooms || []).length || followupFormData.total_rooms || 1,
            rooms: followupFormData.rooms,
            room_details: followupFormData.rooms
        };

        try {
            const res = await axiosPost(saveLeadFollowupUrl, payload, token);
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

    // --- Manual Lead Modal Handlers ---
    const handleOpenManualLeadModal = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const initialRooms = [{ id: 1, room_number: 1, type: 'non_ac', extra_charge: 0 }];
        setManualLeadFormData({
            name: '',
            phone: '',
            email: '',
            assigned_to: isSuperAdmin ? 'auto' : (user?.id || ''),
            lead_type: 'warm',
            travel_destination: 'Sundarban Safari',
            travel_date: '',
            adults: 2,
            children: 0,
            infants: 0,
            number_of_persons: 2,
            total_rooms: 1,
            rooms: initialRooms,
            package_name: '',
            custom_package_name: '',
            package_rate: '',
            next_followup_date: todayStr,
            extra_note: '',
            initial_message: '',
            send_message_now: false
        });
        setManualLeadModalOpen(true);
    };

    const handleManualLeadPackageChange = (val) => {
        const { totalRate, unitPrice } = calculateAutoRate(val, manualLeadFormData.adults, manualLeadFormData.children, manualLeadFormData.rooms);
        setManualLeadFormData(prev => ({
            ...prev,
            package_name: val,
            custom_package_name: val === '__custom__' ? prev.custom_package_name : '',
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleManualLeadAdultsChange = (val) => {
        const adults = Math.max(0, parseInt(val, 10) || 0);
        const effectivePkg = manualLeadFormData.package_name === '__custom__' ? manualLeadFormData.custom_package_name : manualLeadFormData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, adults, manualLeadFormData.children, manualLeadFormData.rooms);
        const totalPax = adults + (parseInt(manualLeadFormData.children, 10) || 0) + (parseInt(manualLeadFormData.infants, 10) || 0);
        setManualLeadFormData(prev => ({
            ...prev,
            adults: val,
            number_of_persons: totalPax,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleManualLeadChildrenChange = (val) => {
        const children = Math.max(0, parseInt(val, 10) || 0);
        const effectivePkg = manualLeadFormData.package_name === '__custom__' ? manualLeadFormData.custom_package_name : manualLeadFormData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, manualLeadFormData.adults, children, manualLeadFormData.rooms);
        const totalPax = (parseInt(manualLeadFormData.adults, 10) || 0) + children + (parseInt(manualLeadFormData.infants, 10) || 0);
        setManualLeadFormData(prev => ({
            ...prev,
            children: val,
            number_of_persons: totalPax,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleManualLeadInfantsChange = (val) => {
        const infants = Math.max(0, parseInt(val, 10) || 0);
        const totalPax = (parseInt(manualLeadFormData.adults, 10) || 0) + (parseInt(manualLeadFormData.children, 10) || 0) + infants;
        setManualLeadFormData(prev => ({
            ...prev,
            infants: val,
            number_of_persons: totalPax
        }));
    };

    const handleManualLeadAddRoom = () => {
        const nextRooms = [...(manualLeadFormData.rooms || [])];
        nextRooms.push({ id: Date.now(), room_number: nextRooms.length + 1, type: 'non_ac', extra_charge: 0 });
        const effectivePkg = manualLeadFormData.package_name === '__custom__' ? manualLeadFormData.custom_package_name : manualLeadFormData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, manualLeadFormData.adults, manualLeadFormData.children, nextRooms);
        setManualLeadFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleManualLeadRemoveRoom = (idx) => {
        if ((manualLeadFormData.rooms || []).length <= 1) return;
        const nextRooms = manualLeadFormData.rooms.filter((_, i) => i !== idx).map((r, i) => ({ ...r, room_number: i + 1 }));
        const effectivePkg = manualLeadFormData.package_name === '__custom__' ? manualLeadFormData.custom_package_name : manualLeadFormData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, manualLeadFormData.adults, manualLeadFormData.children, nextRooms);
        setManualLeadFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleManualLeadRoomChange = (idx, changes) => {
        const nextRooms = manualLeadFormData.rooms.map((r, i) => i === idx ? { ...r, ...changes } : r);
        const effectivePkg = manualLeadFormData.package_name === '__custom__' ? manualLeadFormData.custom_package_name : manualLeadFormData.package_name;
        const { totalRate, unitPrice, acExtraTotal } = calculateAutoRate(effectivePkg, manualLeadFormData.adults, manualLeadFormData.children, nextRooms);
        setManualLeadFormData(prev => {
            let nextRate = prev.package_rate;
            if (unitPrice > 0) {
                nextRate = String(totalRate);
            } else if (prev.package_rate && !isNaN(Number(prev.package_rate))) {
                const prevAcTotal = (prev.rooms || []).reduce((sum, r) => sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0);
                nextRate = String(Math.max(0, Number(prev.package_rate) + (acExtraTotal - prevAcTotal)));
            }
            return {
                ...prev,
                total_rooms: nextRooms.length,
                rooms: nextRooms,
                package_rate: nextRate
            };
        });
    };

    const handleSaveManualLead = async (e) => {
        e.preventDefault();
        if (!manualLeadFormData.phone || !manualLeadFormData.phone.trim()) {
            showMessage('error', 'WhatsApp phone number is required.');
            return;
        }

        setSavingManualLead(true);

        const finalPackageName = manualLeadFormData.package_name === '__custom__'
            ? (manualLeadFormData.custom_package_name || 'Custom Package')
            : manualLeadFormData.package_name;

        const totalPax = (parseInt(manualLeadFormData.adults, 10) || 0) + (parseInt(manualLeadFormData.children, 10) || 0) + (parseInt(manualLeadFormData.infants, 10) || 0);

        const payload = {
            ...manualLeadFormData,
            package_name: finalPackageName,
            adults: manualLeadFormData.adults,
            children: manualLeadFormData.children,
            infants: manualLeadFormData.infants,
            number_of_persons: totalPax || 1,
            total_rooms: (manualLeadFormData.rooms || []).length || manualLeadFormData.total_rooms || 1,
            rooms: manualLeadFormData.rooms,
            room_details: manualLeadFormData.rooms
        };

        try {
            const res = await axiosPost(createManualLeadUrl, payload, token);
            if (res?.status) {
                showMessage('success', res.msg || '🎉 Manual WhatsApp Lead created successfully!');
                setManualLeadModalOpen(false);
                fetchContacts(searchTerm, filterAssignee);
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to create lead');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error creating manual lead');
        } finally {
            setSavingManualLead(false);
        }
    };

    // --- Convert Modal Handlers & Helpers ---
    // Helper to calculate total convert amount based on package price, adults, children, extra discount, and AC room extra charges
    // NOTE: Infants are free (₹0) and NOT included in price calculation as requested
    const calculateConvertAutoAmount = (packageName, adultsCount, childrenCount, discountVal, roomsList = []) => {
        const adults = Math.max(0, parseInt(adultsCount, 10) || 0);
        const children = Math.max(0, parseInt(childrenCount, 10) || 0);
        const billablePersons = adults + children;

        const matched = (packageSuggestions || []).find(p => (p.name === packageName || p.title === packageName));
        const unitPrice = matched ? Number(matched.actual_price || matched.base_price || matched.price || 0) : 0;
        const baseTotal = unitPrice > 0 ? (unitPrice * billablePersons) : 0;

        const acExtraTotal = (roomsList || []).reduce((sum, r) => {
            return sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0);
        }, 0);

        const discount = Math.max(0, Number(discountVal) || 0);
        const finalTotal = (unitPrice > 0 || acExtraTotal > 0) ? Math.max(0, baseTotal + acExtraTotal - discount) : 0;

        return {
            unitPrice,
            billablePersons,
            baseTotal,
            acExtraTotal,
            discount,
            finalTotal
        };
    };

    const handleOpenConvertModal = async (item) => {
        const formatDateVal = (d) => {
            if (!d) return '';
            try { return new Date(d).toISOString().split('T')[0]; } catch (e) { return ''; }
        };

        const contactId = item.contact_id || item.id;
        let existingPkgName = item.package_name || '';
        let existingAdults = item.adults;
        let existingChildren = item.children;
        let existingInfants = item.infants;
        let existingPersons = item.number_of_persons || 2;
        let existingRooms = item.rooms || item.room_details;
        let existingTotalRooms = item.total_rooms || 1;
        let existingRate = item.package_rate || item.converted_amount || '';
        let existingTravelDate = formatDateVal(item.travel_date);

        // If contact doesn't have package details on top level, attempt to fetch from single followup
        if ((!existingPkgName || !existingRooms) && contactId) {
            try {
                const res = await axiosGet(`${getSingleLeadFollowupUrl}${contactId}`, token);
                if (res?.status && res?.data?.followup) {
                    const f = res.data.followup;
                    existingPkgName = f.package_name || existingPkgName;
                    existingAdults = f.adults ?? existingAdults;
                    existingChildren = f.children ?? existingChildren;
                    existingInfants = f.infants ?? existingInfants;
                    existingPersons = f.number_of_persons || existingPersons;
                    existingRooms = f.rooms || f.room_details || existingRooms;
                    existingTotalRooms = f.total_rooms || existingTotalRooms;
                    existingRate = f.package_rate || existingRate;
                    existingTravelDate = formatDateVal(f.travel_date) || existingTravelDate;
                }
            } catch (e) {}
        }

        // Parse existing rooms
        let rawRooms = existingRooms;
        if (typeof rawRooms === 'string') {
            try { rawRooms = JSON.parse(rawRooms); } catch (e) { rawRooms = null; }
        }

        let loadedRooms = [];
        if (Array.isArray(rawRooms) && rawRooms.length > 0) {
            loadedRooms = rawRooms.map((r, i) => ({
                id: r.id || i + 1,
                room_number: r.room_number || i + 1,
                type: r.type === 'ac' ? 'ac' : 'non_ac',
                extra_charge: Number(r.extra_charge) || 0
            }));
        } else {
            const count = Math.max(1, parseInt(existingTotalRooms, 10) || 1);
            loadedRooms = createInitialRooms(count);
        }

        const isExistingPkgInList = (packageSuggestions || []).some(p => (p.name === existingPkgName || p.title === existingPkgName));
        const selectedPkgVal = isExistingPkgInList ? existingPkgName : (existingPkgName ? '__custom__' : '');
        const customPkgVal = isExistingPkgInList ? '' : existingPkgName;

        const initialAdults = existingAdults !== null && existingAdults !== undefined ? Math.max(1, parseInt(existingAdults, 10) || 1) : Math.max(1, parseInt(existingPersons, 10) || 2);
        const initialChildren = Math.max(0, parseInt(existingChildren, 10) || 0);
        const initialInfants = Math.max(0, parseInt(existingInfants, 10) || 0);
        const initialDiscount = 0;

        const effectivePkg = selectedPkgVal === '__custom__' ? customPkgVal : selectedPkgVal;
        const { finalTotal, unitPrice } = calculateConvertAutoAmount(effectivePkg, initialAdults, initialChildren, initialDiscount, loadedRooms);

        let initialAmount = existingRate || '';
        if (!initialAmount && unitPrice > 0) {
            initialAmount = String(finalTotal);
        }

        setConvertFormData({
            contact_id: contactId,
            lead_name: item.lead_name || item.name || '',
            phone: item.phone || item.wa_id || '',
            email: item.email || '',
            package_name: selectedPkgVal,
            custom_package_name: customPkgVal,
            adults: initialAdults,
            children: initialChildren,
            infants: initialInfants,
            total_rooms: loadedRooms.length,
            rooms: loadedRooms,
            bed_type: 'Double Bed',
            extra_discount: initialDiscount,
            converted_amount: initialAmount,
            travel_date: existingTravelDate,
            conversion_note: ''
        });
        setConvertModalOpen(true);
    };

    const handleConvertPackageChange = (val) => {
        const effectivePkg = val === '__custom__' ? convertFormData.custom_package_name : val;
        const { finalTotal, unitPrice } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, convertFormData.extra_discount, convertFormData.rooms);
        setConvertFormData(prev => ({
            ...prev,
            package_name: val,
            custom_package_name: val === '__custom__' ? prev.custom_package_name : '',
            converted_amount: unitPrice > 0 ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertAdultsChange = (val) => {
        const adults = Math.max(0, parseInt(val, 10) || 0);
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice } = calculateConvertAutoAmount(effectivePkg, adults, convertFormData.children, convertFormData.extra_discount, convertFormData.rooms);
        setConvertFormData(prev => ({
            ...prev,
            adults: val,
            converted_amount: unitPrice > 0 ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertChildrenChange = (val) => {
        const children = Math.max(0, parseInt(val, 10) || 0);
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, children, convertFormData.extra_discount, convertFormData.rooms);
        setConvertFormData(prev => ({
            ...prev,
            children: val,
            converted_amount: unitPrice > 0 ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertInfantsChange = (val) => {
        // Infants are 0 in price calculation (FREE)
        setConvertFormData(prev => ({
            ...prev,
            infants: val
        }));
    };

    const handleConvertDiscountChange = (val) => {
        const discount = Math.max(0, Number(val) || 0);
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, discount, convertFormData.rooms);
        setConvertFormData(prev => ({
            ...prev,
            extra_discount: val,
            converted_amount: unitPrice > 0 ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertAddRoom = () => {
        const nextRooms = [...(convertFormData.rooms || [])];
        nextRooms.push({ id: Date.now(), room_number: nextRooms.length + 1, type: 'non_ac', extra_charge: 0 });
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, convertFormData.extra_discount, nextRooms);
        setConvertFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            converted_amount: unitPrice > 0 ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertRemoveRoom = (idx) => {
        if ((convertFormData.rooms || []).length <= 1) return;
        const nextRooms = convertFormData.rooms.filter((_, i) => i !== idx).map((r, i) => ({ ...r, room_number: i + 1 }));
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, convertFormData.extra_discount, nextRooms);
        setConvertFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            converted_amount: unitPrice > 0 ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertRoomChange = (idx, changes) => {
        const nextRooms = convertFormData.rooms.map((r, i) => i === idx ? { ...r, ...changes } : r);
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice, acExtraTotal } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, convertFormData.extra_discount, nextRooms);
        setConvertFormData(prev => {
            let nextAmount = prev.converted_amount;
            if (unitPrice > 0) {
                nextAmount = String(finalTotal);
            } else if (prev.converted_amount && !isNaN(Number(prev.converted_amount))) {
                const prevAcTotal = (prev.rooms || []).reduce((sum, r) => sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0);
                nextAmount = String(Math.max(0, Number(prev.converted_amount) + (acExtraTotal - prevAcTotal)));
            }
            return {
                ...prev,
                total_rooms: nextRooms.length,
                rooms: nextRooms,
                converted_amount: nextAmount
            };
        });
    };

    const handleConfirmConvert = async (e, redirectToInvoice = false) => {
        if (e) e.preventDefault();
        if (!convertFormData.contact_id) {
            showMessage('error', 'Contact ID is missing.');
            return;
        }

        setConvertingLead(true);

        const finalPackageName = convertFormData.package_name === '__custom__'
            ? (convertFormData.custom_package_name || 'Custom Package')
            : convertFormData.package_name;

        const totalPax = (parseInt(convertFormData.adults, 10) || 0) + (parseInt(convertFormData.children, 10) || 0) + (parseInt(convertFormData.infants, 10) || 0);

        const roomsCount = (convertFormData.rooms || []).length;
        const acRoomsCount = (convertFormData.rooms || []).filter(r => r.type === 'ac').length;
        const nonAcRoomsCount = (convertFormData.rooms || []).filter(r => r.type === 'non_ac').length;
        const acDetails = (convertFormData.rooms || []).filter(r => r.type === 'ac').map(r => `Room #${r.room_number} (+₹${r.extra_charge || 0})`).join(', ');

        const roomsSummary = `${roomsCount} Rooms (${acRoomsCount} AC${acDetails ? ` [${acDetails}]` : ''}, ${nonAcRoomsCount} Non-AC)`;

        const bookingDetailsSummary = `Package: ${finalPackageName || 'Standard Package'} | Rooms: ${roomsSummary} | Total Members: ${totalPax} Pax (${convertFormData.adults || 0} Adults, ${convertFormData.children || 0} Children, ${convertFormData.infants || 0} Infants) | Bed Type: ${convertFormData.bed_type || 'Double Bed'}${Number(convertFormData.extra_discount) > 0 ? ` | Discount: ₹${convertFormData.extra_discount}` : ''}`;

        const finalNote = convertFormData.conversion_note 
            ? `${convertFormData.conversion_note.trim()}\n[${bookingDetailsSummary}]`
            : `[${bookingDetailsSummary}]`;

        const payload = {
            contact_id: convertFormData.contact_id,
            package_name: finalPackageName,
            converted_amount: convertFormData.converted_amount,
            travel_date: convertFormData.travel_date,
            adults: convertFormData.adults,
            children: convertFormData.children,
            infants: convertFormData.infants,
            number_of_persons: totalPax || 1,
            total_rooms: roomsCount || 1,
            rooms: convertFormData.rooms,
            room_details: convertFormData.rooms,
            conversion_note: finalNote
        };

        try {
            const res = await axiosPost(convertLeadUrl, payload, token);
            if (res?.status) {
                showMessage('success', '🎉 Lead marked as Converted successfully! Moved to Converted Leads section.');
                setConvertModalOpen(false);
                fetchContacts(searchTerm, filterAssignee);
                fetchStats();

                if (redirectToInvoice) {
                    router.push(`/crm/invoices?create_for_lead=${convertFormData.contact_id}`);
                }
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
                    <button
                        type="button"
                        onClick={handleOpenManualLeadModal}
                        className="btn btn-success btn-sm rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm fw-semibold"
                        title="Create a new WhatsApp lead manually"
                    >
                        <i className="ri ri-user-add-fill"></i>
                        <span>+ Create Manual Lead</span>
                    </button>

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
                            <p className="text-muted mt-3 mb-3">
                                {isSuperAdmin 
                                    ? 'No WhatsApp leads found matching your criteria.' 
                                    : 'No leads are currently assigned to your account. New leads will appear here as they are distributed to you.'}
                            </p>
                            <button
                                type="button"
                                onClick={handleOpenManualLeadModal}
                                className="btn btn-success rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
                            >
                                <i className="ri ri-user-add-line"></i>
                                <span>+ Create Manual Lead</span>
                            </button>
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

                                    {/* Travel Date */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Estimated Travel Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control rounded-3"
                                                value={followupFormData.travel_date}
                                                onChange={(e) => setFollowupFormData({ ...followupFormData, travel_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Passenger / Member Breakdown (Adults, Children, Infants) */}
                                    <div className="card bg-white border rounded-3 p-3 mb-3">
                                        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                            <label className="form-label small fw-bold text-dark mb-0 d-flex align-items-center gap-1">
                                                <i className="ri ri-group-line text-primary"></i>
                                                <span>Travelers Breakdown</span>
                                            </label>
                                            <span className="badge bg-label-primary rounded-pill px-2.5 py-1" style={{ fontSize: '11.5px' }}>
                                                Total: {(parseInt(followupFormData.adults, 10) || 0) + (parseInt(followupFormData.children, 10) || 0) + (parseInt(followupFormData.infants, 10) || 0)} Pax
                                            </span>
                                        </div>

                                        <div className="row g-3">
                                            {/* Adults */}
                                            <div className="col-12 col-md-4">
                                                <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                    <span>Adults (12+ yrs)</span>
                                                    <small className="text-muted">Full rate</small>
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    className="form-control rounded-3"
                                                    value={followupFormData.adults}
                                                    onChange={(e) => handleFollowupAdultsChange(e.target.value)}
                                                />
                                            </div>

                                            {/* Children */}
                                            <div className="col-6 col-md-4">
                                                <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                    <span>Children (5-11 yrs)</span>
                                                    <small className="text-muted">Standard rate</small>
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    className="form-control rounded-3"
                                                    value={followupFormData.children}
                                                    onChange={(e) => handleFollowupChildrenChange(e.target.value)}
                                                />
                                            </div>

                                            {/* Infants */}
                                            <div className="col-6 col-md-4">
                                                <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                    <span>Infants (0-4 yrs)</span>
                                                    <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize: '10px' }}>FREE (₹0)</span>
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    className="form-control rounded-3"
                                                    value={followupFormData.infants}
                                                    onChange={(e) => handleFollowupInfantsChange(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <small className="text-muted d-block mt-2" style={{ fontSize: '11px' }}>
                                            <i className="ri ri-information-line me-1 text-info"></i>
                                            Infants count is saved for permits &amp; seating, but <strong>NOT calculated</strong> into billing rate.
                                        </small>
                                    </div>

                                    {/* Room Option (Create rooms one by one with AC/Non-AC tab & extra charge) */}
                                    <div className="card bg-white border rounded-3 p-3 mb-3">
                                        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                            <div>
                                                <label className="form-label small fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                                                    <i className="ri ri-hotel-bed-line text-primary"></i>
                                                    <span>Room Configuration ({followupFormData.rooms?.length || 1} {(followupFormData.rooms?.length || 1) === 1 ? 'Room' : 'Rooms'})</span>
                                                </label>
                                                <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                                                    Configure rooms one by one. Choose AC to specify extra charges.
                                                </small>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleFollowupAddRoom}
                                                className="btn btn-outline-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1 py-1 px-3 shadow-xs"
                                            >
                                                <i className="ri ri-add-line"></i>
                                                <span>+ Add Room</span>
                                            </button>
                                        </div>

                                        {/* Rooms List */}
                                        <div className="d-flex flex-column gap-2 mt-2">
                                            {(followupFormData.rooms || []).map((room, rIdx) => (
                                                <div 
                                                    key={room.id || rIdx} 
                                                    className="p-2.5 rounded-3 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2"
                                                >
                                                    {/* Room Label */}
                                                    <div className="d-flex align-items-center gap-2" style={{ minWidth: '95px' }}>
                                                        <span className="badge bg-secondary bg-opacity-10 text-dark rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '12px' }}>
                                                            <i className="ri ri-door-open-line me-1 text-primary"></i> Room #{rIdx + 1}
                                                        </span>
                                                    </div>

                                                    {/* AC / Non-AC Tab Toggles */}
                                                    <div className="btn-group btn-group-sm rounded-pill p-0.5 bg-white border" role="group">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFollowupRoomChange(rIdx, { type: 'non_ac', extra_charge: 0 })}
                                                            className={`btn btn-sm rounded-pill px-3 py-1 ${room.type === 'non_ac' ? 'btn-secondary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                            style={{ fontSize: '12px' }}
                                                        >
                                                            <i className="ri ri-temp-cold-line me-1"></i> Non-AC
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFollowupRoomChange(rIdx, { type: 'ac', extra_charge: room.extra_charge !== undefined ? room.extra_charge : 0 })}
                                                            className={`btn btn-sm rounded-pill px-3 py-1 ${room.type === 'ac' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                            style={{ fontSize: '12px' }}
                                                        >
                                                            <i className="ri ri-windy-fill me-1"></i> AC Room
                                                        </button>
                                                    </div>

                                                    {/* Extra AC Charge Input (Opens when AC selected) */}
                                                    {room.type === 'ac' && (
                                                        <div className="d-flex align-items-center gap-1.5 ms-md-2">
                                                            <label className="small fw-semibold text-primary mb-0 text-nowrap" style={{ fontSize: '11.5px' }}>
                                                                Extra AC Charge:
                                                            </label>
                                                            <div className="input-group input-group-sm" style={{ width: '130px' }}>
                                                                <span className="input-group-text bg-white border-end-0 text-muted fw-bold">₹</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="form-control border-start-0"
                                                                    placeholder="0"
                                                                    value={room.extra_charge}
                                                                    onChange={(e) => handleFollowupRoomChange(rIdx, { extra_charge: Number(e.target.value) || 0 })}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Delete Room Button */}
                                                    {(followupFormData.rooms || []).length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFollowupRemoveRoom(rIdx)}
                                                            className="btn btn-outline-danger btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                                                            style={{ width: '28px', height: '28px' }}
                                                            title="Remove room"
                                                        >
                                                            <i className="ri ri-delete-bin-line"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Summary Row */}
                                        <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top flex-wrap gap-2" style={{ fontSize: '12px' }}>
                                            <span className="text-muted">
                                                Configured: <strong>{(followupFormData.rooms || []).length} Rooms</strong> ({(followupFormData.rooms || []).filter(r => r.type === 'ac').length} AC, {(followupFormData.rooms || []).filter(r => r.type === 'non_ac').length} Non-AC)
                                            </span>
                                            {(followupFormData.rooms || []).some(r => r.type === 'ac') && (
                                                <span className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 rounded-pill">
                                                    Total AC Extra: +₹{(followupFormData.rooms || []).reduce((acc, r) => acc + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Package Dropdown & Auto-calculated Rate */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                <span className="d-flex align-items-center gap-1">
                                                    <i className="ri ri-suitcase-line text-primary"></i>
                                                    <span>Select Tour Package</span>
                                                </span>
                                                {(() => {
                                                    const matched = packageSuggestions.find(p => (p.name === followupFormData.package_name || p.title === followupFormData.package_name));
                                                    if (matched) {
                                                        const pPrice = Number(matched.actual_price || matched.base_price || matched.price || 0);
                                                        return pPrice > 0 ? (
                                                            <span className="badge bg-label-success rounded-pill px-2 py-0.5" style={{ fontSize: '10.5px' }}>
                                                                ₹{pPrice.toLocaleString('en-IN')}/person
                                                            </span>
                                                        ) : null;
                                                    }
                                                    return null;
                                                })()}
                                            </label>
                                            <select
                                                className="form-select rounded-3"
                                                value={followupFormData.package_name}
                                                onChange={(e) => handleFollowupPackageChange(e.target.value)}
                                            >
                                                <option value="">-- Choose from available packages --</option>
                                                {packageSuggestions.map((pkg) => {
                                                    const pkgName = pkg.name || pkg.title;
                                                    const priceVal = Number(pkg.actual_price || pkg.base_price || pkg.price || 0);
                                                    return (
                                                        <option key={pkg.id || pkgName} value={pkgName}>
                                                            {pkgName} {priceVal > 0 ? `(₹${priceVal.toLocaleString('en-IN')}/person)` : ''}
                                                        </option>
                                                    );
                                                })}
                                                <option value="__custom__">➕ Custom / Other Package...</option>
                                            </select>

                                            {followupFormData.package_name === '__custom__' && (
                                                <input
                                                    type="text"
                                                    className="form-control rounded-3 mt-2"
                                                    placeholder="Enter custom package name..."
                                                    value={followupFormData.custom_package_name || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFollowupFormData(prev => ({ ...prev, custom_package_name: val }));
                                                    }}
                                                    autoFocus
                                                />
                                            )}
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                <span className="d-flex align-items-center gap-1">
                                                    <i className="ri ri-money-rupee-circle-line text-success"></i>
                                                    <span>Calculated Package Rate (Total)</span>
                                                </span>
                                                {(() => {
                                                    const { unitPrice, billablePersons, acExtraTotal } = calculateAutoRate(
                                                        followupFormData.package_name === '__custom__' ? followupFormData.custom_package_name : followupFormData.package_name,
                                                        followupFormData.adults,
                                                        followupFormData.children,
                                                        followupFormData.rooms
                                                    );
                                                    if (unitPrice > 0 || acExtraTotal > 0) {
                                                        return (
                                                            <small className="text-muted" style={{ fontSize: '11px' }}>
                                                                (₹{unitPrice} × {billablePersons} billable pax{acExtraTotal > 0 ? ` + ₹${acExtraTotal} AC` : ''})
                                                            </small>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light fw-bold text-success">₹</span>
                                                <input 
                                                    type="text" 
                                                    className="form-control rounded-end-3 fw-bold text-dark font-monospace"
                                                    placeholder="e.g. 4500, 12000"
                                                    value={followupFormData.package_rate}
                                                    onChange={(e) => setFollowupFormData({ ...followupFormData, package_rate: e.target.value })}
                                                />
                                            </div>
                                            <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                                Auto-calculated from package price, person count, and AC rooms. You can adjust manually.
                                            </small>
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

                                    {/* 1. Booked Package Dropdown (Auto-selected from lead generation) */}
                                    <div className="card bg-white border rounded-3 p-3 mb-3">
                                        <div className="row g-3 align-items-center">
                                            <div className="col-12 col-md-7">
                                                <label className="form-label small fw-bold text-dark d-flex align-items-center justify-content-between">
                                                    <span className="d-flex align-items-center gap-1">
                                                        <i className="ri ri-suitcase-line text-primary"></i>
                                                        <span>Booked Tour Package</span>
                                                    </span>
                                                    {(() => {
                                                        const matched = packageSuggestions.find(p => (p.name === convertFormData.package_name || p.title === convertFormData.package_name));
                                                        if (matched) {
                                                            const pPrice = Number(matched.actual_price || matched.base_price || matched.price || 0);
                                                            return pPrice > 0 ? (
                                                                <span className="badge bg-label-success rounded-pill px-2 py-0.5" style={{ fontSize: '11px' }}>
                                                                    ₹{pPrice.toLocaleString('en-IN')}/person
                                                                </span>
                                                            ) : null;
                                                        }
                                                        return null;
                                                    })()}
                                                </label>
                                                <select
                                                    className="form-select rounded-3"
                                                    value={convertFormData.package_name}
                                                    onChange={(e) => handleConvertPackageChange(e.target.value)}
                                                >
                                                    <option value="">-- Select Booked Package --</option>
                                                    {packageSuggestions.map((pkg) => {
                                                        const pkgName = pkg.name || pkg.title;
                                                        const priceVal = Number(pkg.actual_price || pkg.base_price || pkg.price || 0);
                                                        return (
                                                            <option key={pkg.id || pkgName} value={pkgName}>
                                                                {pkgName} {priceVal > 0 ? `(₹${priceVal.toLocaleString('en-IN')}/person)` : ''}
                                                            </option>
                                                        );
                                                    })}
                                                    <option value="__custom__">➕ Custom / Other Package...</option>
                                                </select>

                                                {convertFormData.package_name === '__custom__' && (
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3 mt-2"
                                                        placeholder="Enter custom package name..."
                                                        value={convertFormData.custom_package_name || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setConvertFormData(prev => ({ ...prev, custom_package_name: val }));
                                                        }}
                                                        autoFocus
                                                    />
                                                )}
                                            </div>

                                            <div className="col-12 col-md-5">
                                                <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                                                    <i className="ri ri-calendar-check-line text-primary"></i>
                                                    <span>Confirmed Travel Date</span>
                                                </label>
                                                <input 
                                                    type="date" 
                                                    className="form-control rounded-3"
                                                    value={convertFormData.travel_date}
                                                    onChange={(e) => setConvertFormData({ ...convertFormData, travel_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Passenger / Member Breakdown (Adults, Children, Infants) */}
                                    <div className="card bg-white border rounded-3 p-3 mb-3">
                                        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                            <label className="form-label small fw-bold text-dark mb-0 d-flex align-items-center gap-1">
                                                <i className="ri ri-group-line text-primary"></i>
                                                <span>Total Members Breakdown</span>
                                            </label>
                                            <span className="badge bg-label-primary rounded-pill px-2.5 py-1" style={{ fontSize: '11.5px' }}>
                                                Total: {(parseInt(convertFormData.adults, 10) || 0) + (parseInt(convertFormData.children, 10) || 0) + (parseInt(convertFormData.infants, 10) || 0)} Pax
                                            </span>
                                        </div>

                                        <div className="row g-3">
                                            {/* Adults */}
                                            <div className="col-12 col-md-4">
                                                <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                    <span>Adults (12+ yrs)</span>
                                                    <small className="text-muted">Full price</small>
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    className="form-control rounded-3"
                                                    value={convertFormData.adults}
                                                    onChange={(e) => handleConvertAdultsChange(e.target.value)}
                                                />
                                            </div>

                                            {/* Children */}
                                            <div className="col-6 col-md-4">
                                                <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                    <span>Children (5-11 yrs)</span>
                                                    <small className="text-muted">Standard rate</small>
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    className="form-control rounded-3"
                                                    value={convertFormData.children}
                                                    onChange={(e) => handleConvertChildrenChange(e.target.value)}
                                                />
                                            </div>

                                            {/* Infants */}
                                            <div className="col-6 col-md-4">
                                                <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                    <span>Infants (0-4 yrs)</span>
                                                    <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize: '10px' }}>FREE (₹0)</span>
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    className="form-control rounded-3"
                                                    value={convertFormData.infants}
                                                    onChange={(e) => handleConvertInfantsChange(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <small className="text-muted d-block mt-2" style={{ fontSize: '11px' }}>
                                            <i className="ri ri-information-line me-1 text-info"></i>
                                            Infants count is recorded for safari permits &amp; boat seating, but <strong>NOT calculated</strong> into the billing price.
                                        </small>
                                    </div>

                                    {/* 3. Room Configuration (AC / Non-AC selected in Followup or Manual Lead) */}
                                    <div className="card bg-white border rounded-3 p-3 mb-3">
                                        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                            <div>
                                                <label className="form-label small fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                                                    <i className="ri ri-hotel-bed-line text-primary"></i>
                                                    <span>Room Configuration ({(convertFormData.rooms || []).length || 1} {((convertFormData.rooms || []).length || 1) === 1 ? 'Room' : 'Rooms'})</span>
                                                </label>
                                                <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                                                    Room option selected in follow-up / manual lead. You can modify AC/Non-AC or extra charge before converting.
                                                </small>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleConvertAddRoom}
                                                className="btn btn-outline-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1 py-1 px-3 shadow-xs"
                                            >
                                                <i className="ri ri-add-line"></i>
                                                <span>+ Add Room</span>
                                            </button>
                                        </div>

                                        {/* Rooms List */}
                                        <div className="d-flex flex-column gap-2 mt-2">
                                            {(convertFormData.rooms || []).map((room, rIdx) => (
                                                <div 
                                                    key={room.id || rIdx} 
                                                    className="p-2.5 rounded-3 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2"
                                                >
                                                    {/* Room Label */}
                                                    <div className="d-flex align-items-center gap-2" style={{ minWidth: '95px' }}>
                                                        <span className="badge bg-secondary bg-opacity-10 text-dark rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '12px' }}>
                                                            <i className="ri ri-door-open-line me-1 text-primary"></i> Room #{rIdx + 1}
                                                        </span>
                                                    </div>

                                                    {/* AC / Non-AC Tab Toggles */}
                                                    <div className="btn-group btn-group-sm rounded-pill p-0.5 bg-white border" role="group">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleConvertRoomChange(rIdx, { type: 'non_ac', extra_charge: 0 })}
                                                            className={`btn btn-sm rounded-pill px-3 py-1 ${room.type === 'non_ac' ? 'btn-secondary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                            style={{ fontSize: '12px' }}
                                                        >
                                                            <i className="ri ri-temp-cold-line me-1"></i> Non-AC
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleConvertRoomChange(rIdx, { type: 'ac', extra_charge: room.extra_charge !== undefined ? room.extra_charge : 0 })}
                                                            className={`btn btn-sm rounded-pill px-3 py-1 ${room.type === 'ac' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                            style={{ fontSize: '12px' }}
                                                        >
                                                            <i className="ri ri-windy-fill me-1"></i> AC Room
                                                        </button>
                                                    </div>

                                                    {/* Extra AC Charge Input (Opens when AC selected) */}
                                                    {room.type === 'ac' && (
                                                        <div className="d-flex align-items-center gap-1.5 ms-md-2">
                                                            <label className="small fw-semibold text-primary mb-0 text-nowrap" style={{ fontSize: '11.5px' }}>
                                                                Extra AC Charge:
                                                            </label>
                                                            <div className="input-group input-group-sm" style={{ width: '130px' }}>
                                                                <span className="input-group-text bg-white border-end-0 text-muted fw-bold">₹</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="form-control border-start-0"
                                                                    placeholder="0"
                                                                    value={room.extra_charge}
                                                                    onChange={(e) => handleConvertRoomChange(rIdx, { extra_charge: Number(e.target.value) || 0 })}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Delete Room Button */}
                                                    {(convertFormData.rooms || []).length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleConvertRemoveRoom(rIdx)}
                                                            className="btn btn-outline-danger btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                                                            style={{ width: '28px', height: '28px' }}
                                                            title="Remove room"
                                                        >
                                                            <i className="ri ri-delete-bin-line"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Summary Row */}
                                        <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top flex-wrap gap-2" style={{ fontSize: '12px' }}>
                                            <span className="text-muted">
                                                Configured: <strong>{(convertFormData.rooms || []).length} Rooms</strong> ({(convertFormData.rooms || []).filter(r => r.type === 'ac').length} AC, {(convertFormData.rooms || []).filter(r => r.type === 'non_ac').length} Non-AC)
                                            </span>
                                            {(convertFormData.rooms || []).some(r => r.type === 'ac') && (
                                                <span className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 rounded-pill">
                                                    Total AC Extra: +₹{(convertFormData.rooms || []).reduce((acc, r) => acc + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 4. Bed Type & Extra Discount */}
                                    <div className="card bg-white border rounded-3 p-3 mb-3">
                                        <div className="row g-3">
                                            {/* Bed Type */}
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                                                    <i className="ri ri-hotel-bed-line text-primary"></i>
                                                    <span>Bed Type / Room Preference</span>
                                                </label>
                                                <select
                                                    className="form-select rounded-3"
                                                    value={convertFormData.bed_type}
                                                    onChange={(e) => setConvertFormData({ ...convertFormData, bed_type: e.target.value })}
                                                >
                                                    <option value="Double Bed">Double Bed (1 Queen/King Bed)</option>
                                                    <option value="Twin Beds">Twin Beds (2 Separate Single Beds)</option>
                                                    <option value="Triple Bed">Triple Bed (1 Double + 1 Single)</option>
                                                    <option value="Family Suite">Family Suite (2 Double Beds)</option>
                                                    <option value="King Bed + Extra Mattress">King Bed + Extra Mattress</option>
                                                    <option value="Custom Bedding">Custom Bedding Arrangement</option>
                                                </select>
                                            </div>

                                            {/* Extra Discount */}
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-bold text-dark d-flex align-items-center justify-content-between">
                                                    <span className="d-flex align-items-center gap-1">
                                                        <i className="ri ri-coupon-3-line text-danger"></i>
                                                        <span>Extra Discount (₹)</span>
                                                    </span>
                                                    <small className="text-muted">Subtracted from total</small>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light text-danger fw-bold">₹</span>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        className="form-control rounded-end-3"
                                                        placeholder="0"
                                                        value={convertFormData.extra_discount}
                                                        onChange={(e) => handleConvertDiscountChange(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. Final Agreed Deal Rate */}
                                    <div className="card bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 p-3 mb-3">
                                        <div className="row g-3 align-items-center">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                                                    <span className="d-flex align-items-center gap-1">
                                                        <i className="ri ri-money-rupee-circle-fill text-success fs-5"></i>
                                                        <span className="fs-6">Final Agreed Booking Amount</span>
                                                    </span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-white text-success fw-bold">₹</span>
                                                    <input 
                                                        type="text" 
                                                        className="form-control rounded-end-3 fw-bold text-dark fs-5 font-monospace"
                                                        placeholder="e.g. 15000"
                                                        value={convertFormData.converted_amount}
                                                        onChange={(e) => setConvertFormData({ ...convertFormData, converted_amount: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                {(() => {
                                                    const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
                                                    const { unitPrice, billablePersons, acExtraTotal, discount } = calculateConvertAutoAmount(
                                                        effectivePkg,
                                                        convertFormData.adults,
                                                        convertFormData.children,
                                                        convertFormData.extra_discount,
                                                        convertFormData.rooms
                                                    );
                                                    return (
                                                        <div className="small text-muted">
                                                            {unitPrice > 0 || acExtraTotal > 0 ? (
                                                                <>
                                                                    <div><strong>Auto-Calculation:</strong> ₹{unitPrice.toLocaleString('en-IN')} × {billablePersons} billable pax {acExtraTotal > 0 ? `+ ₹${acExtraTotal.toLocaleString('en-IN')} AC ` : ''}{discount > 0 ? `- ₹${discount.toLocaleString('en-IN')} disc` : ''}</div>
                                                                    <div className="text-success" style={{ fontSize: '11px' }}>Infants: {convertFormData.infants || 0} pax (₹0 free of charge)</div>
                                                                </>
                                                            ) : (
                                                                <span>Enter the final closed quotation amount agreed with the client.</span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. Status Notice */}
                                    <div className="alert alert-success d-flex align-items-center gap-2 mb-3 py-2.5 px-3 rounded-3" style={{ fontSize: '12.5px' }}>
                                        <i className="ri ri-checkbox-circle-fill fs-5 text-success"></i>
                                        <div>
                                            <strong>Status Change:</strong> Lead will move to <strong>Converted Leads</strong> and be removed from the active follow-up queue.
                                        </div>
                                    </div>

                                    {/* 6. Conversion Remarks / Booking Notes */}
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

                                <div className="modal-footer bg-light py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary rounded-pill px-4" 
                                        onClick={() => setConvertModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <div className="d-flex align-items-center gap-2">
                                        <button 
                                            type="button" 
                                            disabled={convertingLead}
                                            onClick={(e) => handleConfirmConvert(e, true)}
                                            className="btn btn-primary rounded-pill px-3.5 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                            style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                            title="Convert lead and immediately generate customer invoice"
                                        >
                                            <i className="ri ri-file-list-3-line"></i>
                                            <span>Convert &amp; Create Invoice</span>
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
                                                    <span>🎉 Mark as Converted</span>
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
            {/* 8. Create Manual Lead Modal */}
            {manualLeadModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1090 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '820px' }}>
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="modal-header text-white py-3 px-4" style={{ backgroundColor: '#0066cc' }}>
                                <div>
                                    <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-user-add-line fs-4"></i>
                                        <span>Create Manual WhatsApp Lead</span>
                                    </h5>
                                    <small className="text-white-50">
                                        Add offline inquiries, phone calls, or walk-ins directly into WhatsApp CRM and follow-up pipeline.
                                    </small>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setManualLeadModalOpen(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <form onSubmit={handleSaveManualLead}>
                                <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                                    {/* Section 1: Lead Classification / Temperature */}
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
                                                    name="manual_lead_type" 
                                                    id="man_lead_cold" 
                                                    value="cold"
                                                    checked={manualLeadFormData.lead_type === 'cold'}
                                                    onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, lead_type: e.target.value })}
                                                />
                                                <label 
                                                    className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 ${manualLeadFormData.lead_type === 'cold' ? 'btn-info text-white shadow-sm' : 'btn-outline-secondary'}`}
                                                    htmlFor="man_lead_cold"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="ri ri-snowy-fill fs-4"></i>
                                                    <span className="fw-bold">Cold Lead</span>
                                                    <small style={{ fontSize: '11px' }}>Low priority / Exploring</small>
                                                </label>
                                            </div>

                                            {/* Warm */}
                                            <div className="col-4">
                                                <input 
                                                    type="radio" 
                                                    className="btn-check" 
                                                    name="manual_lead_type" 
                                                    id="man_lead_warm" 
                                                    value="warm"
                                                    checked={manualLeadFormData.lead_type === 'warm'}
                                                    onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, lead_type: e.target.value })}
                                                />
                                                <label 
                                                    className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 ${manualLeadFormData.lead_type === 'warm' ? 'btn-warning text-dark shadow-sm' : 'btn-outline-secondary'}`}
                                                    htmlFor="man_lead_warm"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="ri ri-sun-fill fs-4 text-warning"></i>
                                                    <span className="fw-bold">Warm Lead</span>
                                                    <small style={{ fontSize: '11px' }}>Interested / Planning</small>
                                                </label>
                                            </div>

                                            {/* Hot */}
                                            <div className="col-4">
                                                <input 
                                                    type="radio" 
                                                    className="btn-check" 
                                                    name="manual_lead_type" 
                                                    id="man_lead_hot" 
                                                    value="hot"
                                                    checked={manualLeadFormData.lead_type === 'hot'}
                                                    onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, lead_type: e.target.value })}
                                                />
                                                <label 
                                                    className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 ${manualLeadFormData.lead_type === 'hot' ? 'btn-danger text-white shadow-sm' : 'btn-outline-secondary'}`}
                                                    htmlFor="man_lead_hot"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="ri ri-fire-fill fs-4"></i>
                                                    <span className="fw-bold">Hot Lead 🔥</span>
                                                    <small style={{ fontSize: '11px' }}>Ready to Book</small>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Contact Information */}
                                    <div className="card bg-light border-0 rounded-3 p-3 mb-3">
                                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                                            <i className="ri ri-user-line text-primary"></i>
                                            <span>Customer Contact Information</span>
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-semibold">
                                                    Customer / Lead Name <span className="text-danger">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control rounded-3"
                                                    placeholder="e.g. Amitav Roy"
                                                    value={manualLeadFormData.name}
                                                    onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-semibold">
                                                    WhatsApp Phone Number <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-white border-end-0 text-success">
                                                        <i className="ri ri-whatsapp-fill"></i>
                                                    </span>
                                                    <input 
                                                        type="text" 
                                                        className="form-control border-start-0 rounded-end-3 font-monospace"
                                                        placeholder="e.g. 9830123456 or 919830123456"
                                                        value={manualLeadFormData.phone}
                                                        onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, phone: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <small className="text-muted" style={{ fontSize: '11px' }}>
                                                    Enter 10-digit number (91 auto-added) or include country code.
                                                </small>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-semibold">Email Address (Optional)</label>
                                                <input 
                                                    type="email" 
                                                    className="form-control rounded-3"
                                                    placeholder="e.g. client@example.com"
                                                    value={manualLeadFormData.email}
                                                    onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, email: e.target.value })}
                                                />
                                            </div>

                                            {/* Lead Assignment */}
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-semibold d-flex align-items-center gap-1">
                                                    <i className="ri ri-user-shared-line text-primary"></i>
                                                    <span>Assign Lead To</span>
                                                </label>
                                                {isSuperAdmin ? (
                                                    <select 
                                                        className="form-select rounded-3"
                                                        value={manualLeadFormData.assigned_to}
                                                        onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, assigned_to: e.target.value })}
                                                    >
                                                        <option value="auto">⚡ Auto-Assign (Round-Robin Pool)</option>
                                                        <option value="unassigned">-- Leave Unassigned --</option>
                                                        {managers.map(m => (
                                                            <option key={m.user_id} value={m.user_id}>
                                                                {m.name} ({m.email})
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="form-control bg-white rounded-3 d-flex align-items-center gap-2">
                                                        <span className="badge bg-label-info rounded-pill px-2.5 py-1">
                                                            <i className="ri ri-user-star-line me-1"></i> Assigned to You
                                                        </span>
                                                        <small className="text-muted">({user?.name || user?.email || 'My Account'})</small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Tour & Travel Requirements */}
                                    <div className="card bg-light border-0 rounded-3 p-3 mb-3">
                                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                                            <i className="ri ri-map-pin-line text-danger"></i>
                                            <span>Tour &amp; Travel Requirements</span>
                                        </h6>
                                        <div className="row g-3 mb-3">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-semibold">Destination</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control rounded-3"
                                                    placeholder="e.g. Sundarban Safari, Day Tour"
                                                    value={manualLeadFormData.travel_destination}
                                                    onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, travel_destination: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-semibold">Estimated Travel Date</label>
                                                <input 
                                                    type="date" 
                                                    className="form-control rounded-3"
                                                    value={manualLeadFormData.travel_date}
                                                    onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, travel_date: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Passenger / Member Breakdown (Adults, Children, Infants) */}
                                        <div className="card bg-white border rounded-3 p-3 mb-3">
                                            <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                                <label className="form-label small fw-bold text-dark mb-0 d-flex align-items-center gap-1">
                                                    <i className="ri ri-group-line text-primary"></i>
                                                    <span>Travelers Breakdown</span>
                                                </label>
                                                <span className="badge bg-label-primary rounded-pill px-2.5 py-1" style={{ fontSize: '11.5px' }}>
                                                    Total: {(parseInt(manualLeadFormData.adults, 10) || 0) + (parseInt(manualLeadFormData.children, 10) || 0) + (parseInt(manualLeadFormData.infants, 10) || 0)} Pax
                                                </span>
                                            </div>

                                            <div className="row g-3">
                                                {/* Adults */}
                                                <div className="col-12 col-md-4">
                                                    <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                        <span>Adults (12+ yrs)</span>
                                                        <small className="text-muted">Full rate</small>
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        className="form-control rounded-3"
                                                        value={manualLeadFormData.adults}
                                                        onChange={(e) => handleManualLeadAdultsChange(e.target.value)}
                                                    />
                                                </div>

                                                {/* Children */}
                                                <div className="col-6 col-md-4">
                                                    <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                        <span>Children (5-11 yrs)</span>
                                                        <small className="text-muted">Standard rate</small>
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        className="form-control rounded-3"
                                                        value={manualLeadFormData.children}
                                                        onChange={(e) => handleManualLeadChildrenChange(e.target.value)}
                                                    />
                                                </div>

                                                {/* Infants */}
                                                <div className="col-6 col-md-4">
                                                    <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                        <span>Infants (0-4 yrs)</span>
                                                        <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize: '10px' }}>FREE (₹0)</span>
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        className="form-control rounded-3"
                                                        value={manualLeadFormData.infants}
                                                        onChange={(e) => handleManualLeadInfantsChange(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <small className="text-muted d-block mt-2" style={{ fontSize: '11px' }}>
                                                <i className="ri ri-information-line me-1 text-info"></i>
                                                Infants count is saved for permits &amp; seating, but <strong>NOT calculated</strong> into billing rate.
                                            </small>
                                        </div>

                                        {/* Room Option (Create rooms one by one with AC/Non-AC tab & extra charge) */}
                                        <div className="card bg-white border rounded-3 p-3 mb-3">
                                            <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                                <div>
                                                    <label className="form-label small fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                                                        <i className="ri ri-hotel-bed-line text-primary"></i>
                                                        <span>Room Configuration ({(manualLeadFormData.rooms || []).length || 1} {((manualLeadFormData.rooms || []).length || 1) === 1 ? 'Room' : 'Rooms'})</span>
                                                    </label>
                                                    <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                                                        Configure rooms one by one. Choose AC to specify extra charges.
                                                    </small>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleManualLeadAddRoom}
                                                    className="btn btn-outline-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1 py-1 px-3 shadow-xs"
                                                >
                                                    <i className="ri ri-add-line"></i>
                                                    <span>+ Add Room</span>
                                                </button>
                                            </div>

                                            {/* Rooms List */}
                                            <div className="d-flex flex-column gap-2 mt-2">
                                                {(manualLeadFormData.rooms || []).map((room, rIdx) => (
                                                    <div 
                                                        key={room.id || rIdx} 
                                                        className="p-2.5 rounded-3 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2"
                                                    >
                                                        {/* Room Label */}
                                                        <div className="d-flex align-items-center gap-2" style={{ minWidth: '95px' }}>
                                                            <span className="badge bg-secondary bg-opacity-10 text-dark rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '12px' }}>
                                                                <i className="ri ri-door-open-line me-1 text-primary"></i> Room #{rIdx + 1}
                                                            </span>
                                                        </div>

                                                        {/* AC / Non-AC Tab Toggles */}
                                                        <div className="btn-group btn-group-sm rounded-pill p-0.5 bg-white border" role="group">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleManualLeadRoomChange(rIdx, { type: 'non_ac', extra_charge: 0 })}
                                                                className={`btn btn-sm rounded-pill px-3 py-1 ${room.type === 'non_ac' ? 'btn-secondary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                                style={{ fontSize: '12px' }}
                                                            >
                                                                <i className="ri ri-temp-cold-line me-1"></i> Non-AC
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleManualLeadRoomChange(rIdx, { type: 'ac', extra_charge: room.extra_charge !== undefined ? room.extra_charge : 0 })}
                                                                className={`btn btn-sm rounded-pill px-3 py-1 ${room.type === 'ac' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                                style={{ fontSize: '12px' }}
                                                            >
                                                                <i className="ri ri-windy-fill me-1"></i> AC Room
                                                            </button>
                                                        </div>

                                                        {/* Extra AC Charge Input (Opens when AC selected) */}
                                                        {room.type === 'ac' && (
                                                            <div className="d-flex align-items-center gap-1.5 ms-md-2">
                                                                <label className="small fw-semibold text-primary mb-0 text-nowrap" style={{ fontSize: '11.5px' }}>
                                                                    Extra AC Charge:
                                                                </label>
                                                                <div className="input-group input-group-sm" style={{ width: '130px' }}>
                                                                    <span className="input-group-text bg-white border-end-0 text-muted fw-bold">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="form-control border-start-0"
                                                                        placeholder="0"
                                                                        value={room.extra_charge}
                                                                        onChange={(e) => handleManualLeadRoomChange(rIdx, { extra_charge: Number(e.target.value) || 0 })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Delete Room Button */}
                                                        {(manualLeadFormData.rooms || []).length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleManualLeadRemoveRoom(rIdx)}
                                                                className="btn btn-outline-danger btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                                                                style={{ width: '28px', height: '28px' }}
                                                                title="Remove room"
                                                            >
                                                                <i className="ri ri-delete-bin-line"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Summary Row */}
                                            <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top flex-wrap gap-2" style={{ fontSize: '12px' }}>
                                                <span className="text-muted">
                                                    Configured: <strong>{(manualLeadFormData.rooms || []).length} Rooms</strong> ({(manualLeadFormData.rooms || []).filter(r => r.type === 'ac').length} AC, {(manualLeadFormData.rooms || []).filter(r => r.type === 'non_ac').length} Non-AC)
                                                </span>
                                                {(manualLeadFormData.rooms || []).some(r => r.type === 'ac') && (
                                                    <span className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 rounded-pill">
                                                        Total AC Extra: +₹{(manualLeadFormData.rooms || []).reduce((acc, r) => acc + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Package Dropdown & Auto-calculated Rate */}
                                        <div className="row g-3">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                    <span className="d-flex align-items-center gap-1">
                                                        <i className="ri ri-suitcase-line text-primary"></i>
                                                        <span>Select Tour Package</span>
                                                    </span>
                                                    {(() => {
                                                        const matched = packageSuggestions.find(p => (p.name === manualLeadFormData.package_name || p.title === manualLeadFormData.package_name));
                                                        if (matched) {
                                                            const pPrice = Number(matched.actual_price || matched.base_price || matched.price || 0);
                                                            return pPrice > 0 ? (
                                                                <span className="badge bg-label-success rounded-pill px-2 py-0.5" style={{ fontSize: '10.5px' }}>
                                                                    ₹{pPrice.toLocaleString('en-IN')}/person
                                                                </span>
                                                            ) : null;
                                                        }
                                                        return null;
                                                    })()}
                                                </label>
                                                <select
                                                    className="form-select rounded-3"
                                                    value={manualLeadFormData.package_name}
                                                    onChange={(e) => handleManualLeadPackageChange(e.target.value)}
                                                >
                                                    <option value="">-- Choose from available packages --</option>
                                                    {packageSuggestions.map((pkg) => {
                                                        const pkgName = pkg.name || pkg.title;
                                                        const priceVal = Number(pkg.actual_price || pkg.base_price || pkg.price || 0);
                                                        return (
                                                            <option key={pkg.id || pkgName} value={pkgName}>
                                                                {pkgName} {priceVal > 0 ? `(₹${priceVal.toLocaleString('en-IN')}/person)` : ''}
                                                            </option>
                                                        );
                                                    })}
                                                    <option value="__custom__">➕ Custom / Other Package...</option>
                                                </select>

                                                {manualLeadFormData.package_name === '__custom__' && (
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3 mt-2"
                                                        placeholder="Enter custom package name..."
                                                        value={manualLeadFormData.custom_package_name || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setManualLeadFormData(prev => ({ ...prev, custom_package_name: val }));
                                                        }}
                                                        autoFocus
                                                    />
                                                )}
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                    <span className="d-flex align-items-center gap-1">
                                                        <i className="ri ri-money-rupee-circle-line text-success"></i>
                                                        <span>Calculated Package Rate (Total)</span>
                                                    </span>
                                                    {(() => {
                                                        const { unitPrice, billablePersons, acExtraTotal } = calculateAutoRate(
                                                            manualLeadFormData.package_name === '__custom__' ? manualLeadFormData.custom_package_name : manualLeadFormData.package_name,
                                                            manualLeadFormData.adults,
                                                            manualLeadFormData.children,
                                                            manualLeadFormData.rooms
                                                        );
                                                        if (unitPrice > 0 || acExtraTotal > 0) {
                                                            return (
                                                                <small className="text-muted" style={{ fontSize: '11px' }}>
                                                                    (₹{unitPrice} × {billablePersons} billable pax{acExtraTotal > 0 ? ` + ₹${acExtraTotal} AC` : ''})
                                                                </small>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light fw-bold text-success">₹</span>
                                                    <input 
                                                        type="text" 
                                                        className="form-control rounded-end-3 fw-bold text-dark font-monospace"
                                                        placeholder="e.g. 4500, 12000"
                                                        value={manualLeadFormData.package_rate}
                                                        onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, package_rate: e.target.value })}
                                                    />
                                                </div>
                                                <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                                    Auto-calculated from package price, person count, and AC rooms. You can adjust manually.
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Follow-up & Remarks */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold text-danger">
                                                Next Follow-up Date <span className="text-danger">*</span>
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control rounded-3 border-primary"
                                                value={manualLeadFormData.next_followup_date}
                                                onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, next_followup_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Internal Remarks / Conversation Notes</label>
                                            <textarea 
                                                className="form-control rounded-3"
                                                rows="2"
                                                placeholder="Write details of phone conversation, customer budget, specific requests..."
                                                value={manualLeadFormData.extra_note}
                                                onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, extra_note: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Section 5: Optional WhatsApp Initial Message */}
                                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25 rounded-3 p-3">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <label className="form-label small fw-bold text-success mb-0 d-flex align-items-center gap-1.5">
                                                <i className="ri ri-whatsapp-line fs-5"></i>
                                                <span>Optional WhatsApp Welcome Message</span>
                                            </label>
                                            <div className="form-check form-switch mb-0">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    id="wa_send_now_switch"
                                                    checked={manualLeadFormData.send_message_now}
                                                    onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, send_message_now: e.target.checked })}
                                                />
                                                <label className="form-check-label small fw-semibold text-dark" htmlFor="wa_send_now_switch">
                                                    Send to WhatsApp now
                                                </label>
                                            </div>
                                        </div>
                                        <textarea 
                                            className="form-control rounded-3 bg-white"
                                            rows="2"
                                            placeholder="e.g. Hello! Thank you for contacting Delta Safari Sundarban. We have received your inquiry and our travel specialist is here to assist you."
                                            value={manualLeadFormData.initial_message}
                                            onChange={(e) => setManualLeadFormData({ ...manualLeadFormData, initial_message: e.target.value })}
                                        ></textarea>
                                        {manualLeadFormData.send_message_now && (
                                            <small className="text-success d-inline-flex align-items-center gap-1 mt-1.5" style={{ fontSize: '11.5px' }}>
                                                <i className="ri ri-send-plane-fill"></i> This message will be sent immediately to the customer via WhatsApp Cloud API.
                                            </small>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary rounded-pill px-4" 
                                        onClick={() => setManualLeadModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={savingManualLead}
                                        className="btn btn-success rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm fw-semibold"
                                    >
                                        {savingManualLead ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Creating Lead...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-user-add-fill"></i>
                                                <span>Create &amp; Save Lead</span>
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
