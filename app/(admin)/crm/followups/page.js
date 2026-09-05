'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
    getFollowupsListUrl, 
    getFollowupStatsUrl, 
    saveLeadFollowupUrl, 
    convertLeadUrl,
    reopenLeadUrl,
    getFollowupLogsUrl, 
    getLeadManagersUrl,
    deleteWhatsAppContactUrl
} from '@/app/routes/whatsappRoutes';
import { getAllPackageUrl } from '@/app/routes/packageRoutes';
import { axiosGet, axiosPost, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';

export default function LeadFollowupsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTabParam = searchParams?.get('tab');

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
        cold_leads: 0,
        converted_leads: 0
    });
    const [managers, setManagers] = useState([]);
    const [packageSuggestions, setPackageSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(initialTabParam === 'converted' ? 'converted' : 'all'); // 'all', 'today', 'hot', 'warm', 'cold', 'converted'
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dateFilterType, setDateFilterType] = useState('next_followup'); // 'next_followup', 'travel_date', 'last_followup', 'converted_at'
    const [filterAssignee, setFilterAssignee] = useState('');
    const [sortBy, setSortBy] = useState('followup_date_asc'); // 'followup_date_asc', 'followup_date_desc', 'priority', 'last_followup', 'travel_date', 'newest'
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modals State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [logsModalOpen, setLogsModalOpen] = useState(false);
    const [savingFollowup, setSavingFollowup] = useState(false);
    const [convertingLead, setConvertingLead] = useState(false);
    const [reopeningLeadId, setReopeningLeadId] = useState(null);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [selectedContactLogs, setSelectedContactLogs] = useState([]);
    const [selectedContactInfo, setSelectedContactInfo] = useState(null);
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    // Delete Lead Confirmation Modal State (Admin Only)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState(null);
    const [deletingLead, setDeletingLead] = useState(false);

    const handleOpenDeleteModal = (item) => {
        if (!isSuperAdmin) {
            showMessage('error', 'Only administrators have permission to delete leads.');
            return;
        }
        setLeadToDelete(item);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        const contactId = leadToDelete?.contact_id || leadToDelete?.id;
        if (!isSuperAdmin || !contactId) {
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
                fetchFollowups(currentPage, activeTab);
                fetchStats();
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

    // Click outside to close actions dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.followup-actions-dropdown')) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Follow-up Form State
    const [formData, setFormData] = useState({
        contact_id: null,
        lead_name: '',
        phone: '',
        email: '',
        lead_type: 'warm',
        travel_date: '',
        booking_days: 1,
        travel_destination: '',
        adults: 2,
        children: 0,
        infants: 0,
        number_of_persons: 2,
        total_rooms: 1,
        rooms: [{ id: 1, room_number: 1, type: 'non_ac', extra_charge: 0, bed_type: 'Double Bed', bed_charge: 0 }],
        package_name: '',
        custom_package_name: '',
        package_rate: '',
        next_followup_date: '',
        extra_note: ''
    });

    // Convert Lead Form State
    const [convertFormData, setConvertFormData] = useState({
        contact_id: null,
        lead_name: '',
        phone: '',
        email: '',
        package_name: '',
        custom_package_name: '',
        booking_days: 1,
        adults: 2,
        children: 0,
        infants: 0,
        total_rooms: 1,
        rooms: [{ id: 1, room_number: 1, type: 'non_ac', extra_charge: 0, bed_type: 'Double Bed', bed_charge: 0 }],
        bed_type: 'Double Bed',
        bed_charge: 0,
        extra_discount: 0,
        converted_amount: '',
        travel_date: '',
        conversion_note: ''
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

    // Helper to find matched package from package suggestions by title or name (case-insensitive & trimmed)
    const findMatchedPackage = (pkgList, pkgName) => {
        if (!pkgName || !String(pkgName).trim()) return null;
        const cleanTarget = String(pkgName).trim().toLowerCase();
        return (pkgList || []).find(p => {
            const pTitle = String(p.title || p.name || '').trim().toLowerCase();
            const pName = String(p.name || p.title || '').trim().toLowerCase();
            return pTitle === cleanTarget || pName === cleanTarget;
        }) || null;
    };

    // Fetch Package Suggestions
    const fetchPackages = async () => {
        if (!token) return;
        try {
            const res = await axiosGet(getAllPackageUrl, token);
            if (res?.status && Array.isArray(res.packages)) {
                const cleaned = res.packages.map(p => {
                    const cleanTitle = String(p.title || p.name || '').trim();
                    return {
                        ...p,
                        title: cleanTitle,
                        name: cleanTitle
                    };
                });
                setPackageSuggestions(cleaned);
            }
        } catch (err) {
            console.error('Error loading package suggestions:', err);
        }
    };

    // Fetch Follow-ups List
    const fetchFollowups = async (page = 1, currentTab = activeTab, currentSort = sortBy) => {
        if (!token) return;
        setLoading(true);
        try {
            let queryParams = [
                `page=${page}`,
                `limit=25`,
                `search=${encodeURIComponent(searchTerm || '')}`,
                `date_filter_type=${encodeURIComponent(dateFilterType)}`
            ];

            if (currentSort) {
                queryParams.push(`sort_by=${encodeURIComponent(currentSort)}`);
            }

            if (currentTab === 'converted') {
                queryParams.push(`is_converted=true`);
            } else {
                queryParams.push(`is_converted=false`);
                if (currentTab === 'today') {
                    queryParams.push(`is_today_only=true`);
                } else if (['hot', 'warm', 'cold'].includes(currentTab)) {
                    queryParams.push(`lead_type=${currentTab}`);
                }
            }

            if (fromDate) queryParams.push(`from_date=${encodeURIComponent(fromDate)}`);
            if (toDate) queryParams.push(`to_date=${encodeURIComponent(toDate)}`);
            if (filterAssignee) queryParams.push(`assigned_to=${encodeURIComponent(filterAssignee)}`);

            const url = `${getFollowupsListUrl}?${queryParams.join('&')}`;
            const res = await axiosGet(url, token);

            if (res?.status && Array.isArray(res.followups)) {
                // Double safety filter: strictly exclude converted leads from active tabs
                const filtered = currentTab === 'converted' 
                    ? res.followups.filter(f => f.is_converted == 1)
                    : res.followups.filter(f => f.is_converted != 1);

                // Client-side sort guarantee for follow-up date
                let sortedList = [...filtered];
                if (currentSort === 'followup_date_asc') {
                    sortedList.sort((a, b) => {
                        if (!a.next_followup_date) return 1;
                        if (!b.next_followup_date) return -1;
                        return new Date(a.next_followup_date).getTime() - new Date(b.next_followup_date).getTime();
                    });
                } else if (currentSort === 'followup_date_desc') {
                    sortedList.sort((a, b) => {
                        if (!a.next_followup_date) return 1;
                        if (!b.next_followup_date) return -1;
                        return new Date(b.next_followup_date).getTime() - new Date(a.next_followup_date).getTime();
                    });
                }

                setFollowups(sortedList);
                setTotalPages(res.totalPages || 1);
                setTotalItems(res.total || filtered.length);
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
            fetchFollowups(1, activeTab, sortBy);
            fetchPackages();
            if (isSuperAdmin) {
                fetchLeadManagers();
            }
        }
    }, [token, user]);

    // Automatically sync and link package once package suggestions load
    useEffect(() => {
        if (!packageSuggestions || packageSuggestions.length === 0) return;
        setFormData(prev => {
            const currentPkg = prev.package_name === '__custom__' ? prev.custom_package_name : prev.package_name;
            if (!currentPkg) return prev;
            const matched = findMatchedPackage(packageSuggestions, currentPkg);
            if (matched && prev.package_name !== matched.title) {
                return {
                    ...prev,
                    package_name: matched.title,
                    custom_package_name: ''
                };
            }
            return prev;
        });
        setConvertFormData(prev => {
            const currentPkg = prev.package_name === '__custom__' ? prev.custom_package_name : prev.package_name;
            if (!currentPkg) return prev;
            const matched = findMatchedPackage(packageSuggestions, currentPkg);
            if (matched && prev.package_name !== matched.title) {
                return {
                    ...prev,
                    package_name: matched.title,
                    custom_package_name: ''
                };
            }
            return prev;
        });
    }, [packageSuggestions]);

    // Handle Filter Submit
    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        setCurrentPage(1);
        fetchFollowups(1, activeTab, sortBy);
    };

    // Handle Quick Tab Change
    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setCurrentPage(1);
        // Default appropriate date filter type if switching
        if (tabName === 'converted' && dateFilterType === 'next_followup') {
            setDateFilterType('converted_at');
        } else if (tabName !== 'converted' && dateFilterType === 'converted_at') {
            setDateFilterType('next_followup');
        }
        fetchFollowups(1, tabName, sortBy);
    };

    // Handle Reset Filter
    const handleResetFilter = () => {
        setSearchTerm('');
        setFromDate('');
        setToDate('');
        setDateFilterType('next_followup');
        setFilterAssignee('');
        setSortBy('followup_date_asc');
        setActiveTab('all');
        setCurrentPage(1);
        setTimeout(() => {
            fetchFollowups(1, 'all', 'followup_date_asc');
        }, 50);
    };

    // Toggle Follow-up Date Sort
    const handleToggleFollowupDateSort = () => {
        const nextSort = sortBy === 'followup_date_asc' ? 'followup_date_desc' : 'followup_date_asc';
        setSortBy(nextSort);
        setCurrentPage(1);
        fetchFollowups(1, activeTab, nextSort);
    };

    // Helper to build default rooms array based on count
    const createInitialRooms = (count = 1) => {
        const roomCount = Math.max(1, parseInt(count, 10) || 1);
        const arr = [];
        for (let i = 1; i <= roomCount; i++) {
            arr.push({ id: i, room_number: i, type: 'non_ac', extra_charge: 0, bed_type: 'Double Bed', bed_charge: 0 });
        }
        return arr;
    };

    // Helper to parse existing room details or fallback
    const parseItemRooms = (item) => {
        const loadedRoomsCount = Math.max(1, parseInt(item.total_rooms, 10) || 1);
        let rawRooms = item.rooms || item.room_details;
        if (typeof rawRooms === 'string') {
            try { rawRooms = JSON.parse(rawRooms); } catch (e) { rawRooms = null; }
        }

        let loadedRooms = [];
        if (Array.isArray(rawRooms) && rawRooms.length > 0) {
            loadedRooms = rawRooms.map((r, i) => ({
                id: r.id || i + 1,
                room_number: r.room_number || i + 1,
                type: r.type === 'ac' ? 'ac' : 'non_ac',
                extra_charge: Number(r.extra_charge) || 0,
                bed_type: r.bed_type || 'Double Bed',
                bed_charge: Number(r.bed_charge) || 0
            }));
        } else {
            const effectivePkgName = (item.package_name || '').trim();
            const matched = findMatchedPackage(packageSuggestions, effectivePkgName);
            const unitPrice = matched ? Number(matched.actual_price || matched.base_price || matched.price || 0) : 0;
            const baseTotal = unitPrice > 0 ? (unitPrice * (parseInt(item.number_of_persons, 10) || 1)) : 0;
            const currentRate = Number(item.package_rate) || 0;
            const diff = (unitPrice > 0 && currentRate > baseTotal) ? (currentRate - baseTotal) : 0;
            const noteText = `${item.extra_note || ''} ${item.conversion_note || ''}`;
            const mentionsAc = /\bAC\b/i.test(noteText) && !/\bNon-AC\b/i.test(noteText);

            if (diff > 0 || mentionsAc) {
                loadedRooms = Array.from({ length: loadedRoomsCount }, (_, i) => ({
                    id: i + 1,
                    room_number: i + 1,
                    type: i === 0 ? 'ac' : 'non_ac',
                    extra_charge: i === 0 ? (diff > 0 ? diff : 0) : 0,
                    bed_type: 'Double Bed',
                    bed_charge: 0
                }));
            } else {
                loadedRooms = createInitialRooms(loadedRoomsCount);
            }
        }
        return loadedRooms;
    };

    // Helper to calculate total convert amount based on package price, adults, children, extra discount, rooms, and booking nights
    // Nightly Base Rate + Nightly Room Charges multiplied by bookingDays (nights)
    const calculateConvertAutoAmount = (packageName, adultsCount, childrenCount, discountVal, roomsList = [], bookingDaysCount = 1) => {
        const adults = Math.max(0, parseInt(adultsCount, 10) || 0);
        const children = Math.max(0, parseInt(childrenCount, 10) || 0);
        const billablePersons = adults + children;
        const days = Math.max(1, parseInt(bookingDaysCount, 10) || 1);

        const matched = findMatchedPackage(packageSuggestions, packageName);
        const unitPrice = matched ? Number(matched.actual_price || matched.base_price || matched.price || 0) : 0;
        const standardNights = matched ? (Math.max(1, parseInt(matched.duration_nights, 10) || (parseInt(matched.duration_days, 10) ? Math.max(1, parseInt(matched.duration_days, 10) - 1) : 1))) : 1;

        const nightlyBaseRate = standardNights > 0 ? (unitPrice / standardNights) : unitPrice;
        const baseTotal = nightlyBaseRate > 0 ? Math.round(nightlyBaseRate * days * billablePersons) : 0;
        
        // Extra room charges (AC and Extra Bed) are entered as total calculated prices (flat total, not multiplied by nights)
        const acExtraTotal = (roomsList || []).reduce((sum, r) => {
            return sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0);
        }, 0);

        const bedExtraTotal = (roomsList || []).reduce((sum, r) => {
            return sum + (Number(r.bed_charge) || 0);
        }, 0);

        const discount = Math.max(0, Number(discountVal) || 0);
        const finalTotal = (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) ? Math.max(0, baseTotal + acExtraTotal + bedExtraTotal - discount) : 0;

        return {
            unitPrice,
            standardDays: standardNights,
            standardNights,
            days,
            nights: days,
            billablePersons,
            baseTotal,
            acExtraTotal,
            bedExtraTotal,
            discount,
            finalTotal
        };
    };

    // Open Convert Lead Modal
    const handleOpenConvertModal = (item) => {
        const formatDateVal = (d) => {
            if (!d) return '';
            try {
                return new Date(d).toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        };

        const rawPkgName = (item.package_name || '').trim();
        const matchedPkg = findMatchedPackage(packageSuggestions, rawPkgName);
        const selectedPkgVal = matchedPkg ? matchedPkg.title : (rawPkgName || '');
        const customPkgVal = matchedPkg ? '' : (rawPkgName || '');

        const initialBookingDays = Math.max(1, parseInt(item.booking_days, 10) || (matchedPkg ? (parseInt(matchedPkg.duration_nights, 10) || (parseInt(matchedPkg.duration_days, 10) ? Math.max(1, parseInt(matchedPkg.duration_days, 10) - 1) : 1)) : 1));
        const loadedRooms = parseItemRooms(item);
        const initialAdults = item.adults !== undefined && item.adults !== null ? Number(item.adults) : Math.max(1, parseInt(item.number_of_persons, 10) || 2);
        const initialChildren = item.children !== undefined && item.children !== null ? Number(item.children) : 0;
        const initialInfants = item.infants !== undefined && item.infants !== null ? Number(item.infants) : 0;
        const initialDiscount = 0;

        const effectivePkg = selectedPkgVal === '__custom__' ? customPkgVal : selectedPkgVal;
        const { finalTotal, unitPrice, acExtraTotal, bedExtraTotal } = calculateConvertAutoAmount(effectivePkg, initialAdults, initialChildren, initialDiscount, loadedRooms, initialBookingDays);

        let initialAmount = item.package_rate || item.converted_amount || '';
        if (!initialAmount && (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0)) {
            initialAmount = String(finalTotal);
        }

        setConvertFormData({
            contact_id: item.contact_id || item.id,
            lead_name: item.lead_name || item.name || '',
            phone: item.phone || item.wa_id || '',
            email: item.email || '',
            package_name: selectedPkgVal,
            custom_package_name: customPkgVal,
            booking_days: initialBookingDays,
            adults: initialAdults,
            children: initialChildren,
            infants: initialInfants,
            total_rooms: loadedRooms.length,
            rooms: loadedRooms,
            bed_type: loadedRooms[0]?.bed_type || 'Double Bed',
            bed_charge: loadedRooms[0]?.bed_charge || 0,
            extra_discount: initialDiscount,
            converted_amount: initialAmount,
            travel_date: formatDateVal(item.travel_date),
            conversion_note: ''
        });
        setConvertModalOpen(true);
    };

    const handleConvertPackageChange = (val) => {
        const matched = findMatchedPackage(packageSuggestions, val);
        const defaultDays = matched ? (Math.max(1, parseInt(matched.duration_nights, 10) || (parseInt(matched.duration_days, 10) ? Math.max(1, parseInt(matched.duration_days, 10) - 1) : 1))) : (convertFormData.booking_days || 1);
        const effectivePkg = val === '__custom__' ? convertFormData.custom_package_name : val;
        const { finalTotal, unitPrice, acExtraTotal, bedExtraTotal } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, convertFormData.extra_discount, convertFormData.rooms, defaultDays);
        setConvertFormData(prev => ({
            ...prev,
            package_name: val,
            booking_days: defaultDays,
            custom_package_name: val === '__custom__' ? prev.custom_package_name : '',
            converted_amount: (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertBookingDaysChange = (val) => {
        const days = Math.max(1, parseInt(val, 10) || 1);
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice, acExtraTotal, bedExtraTotal } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, convertFormData.extra_discount, convertFormData.rooms, days);
        setConvertFormData(prev => ({
            ...prev,
            booking_days: days,
            converted_amount: (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertAdultsChange = (val) => {
        const adults = Math.max(0, parseInt(val, 10) || 0);
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice, acExtraTotal, bedExtraTotal } = calculateConvertAutoAmount(effectivePkg, adults, convertFormData.children, convertFormData.extra_discount, convertFormData.rooms, convertFormData.booking_days);
        setConvertFormData(prev => ({
            ...prev,
            adults: val,
            converted_amount: (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertChildrenChange = (val) => {
        const children = Math.max(0, parseInt(val, 10) || 0);
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice, acExtraTotal, bedExtraTotal } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, children, convertFormData.extra_discount, convertFormData.rooms, convertFormData.booking_days);
        setConvertFormData(prev => ({
            ...prev,
            children: val,
            converted_amount: (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) ? String(finalTotal) : prev.converted_amount
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
        const { finalTotal, unitPrice, acExtraTotal, bedExtraTotal } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, discount, convertFormData.rooms, convertFormData.booking_days);
        setConvertFormData(prev => ({
            ...prev,
            extra_discount: val,
            converted_amount: (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertAddRoom = () => {
        const nextRooms = [...(convertFormData.rooms || [])];
        nextRooms.push({ id: Date.now(), room_number: nextRooms.length + 1, type: 'non_ac', extra_charge: 0, bed_type: 'Double Bed', bed_charge: 0 });
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice, acExtraTotal, bedExtraTotal } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, convertFormData.extra_discount, nextRooms, convertFormData.booking_days);
        setConvertFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            converted_amount: (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertRemoveRoom = (idx) => {
        if ((convertFormData.rooms || []).length <= 1) return;
        const nextRooms = convertFormData.rooms.filter((_, i) => i !== idx).map((r, i) => ({ ...r, room_number: i + 1 }));
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice, acExtraTotal, bedExtraTotal } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, convertFormData.extra_discount, nextRooms, convertFormData.booking_days);
        setConvertFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            converted_amount: (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) ? String(finalTotal) : prev.converted_amount
        }));
    };

    const handleConvertRoomChange = (idx, changes) => {
        const nextRooms = convertFormData.rooms.map((r, i) => i === idx ? { ...r, ...changes } : r);
        const effectivePkg = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
        const { finalTotal, unitPrice, acExtraTotal, bedExtraTotal } = calculateConvertAutoAmount(effectivePkg, convertFormData.adults, convertFormData.children, convertFormData.extra_discount, nextRooms, convertFormData.booking_days);
        setConvertFormData(prev => {
            let nextAmount = prev.converted_amount;
            if (unitPrice > 0) {
                nextAmount = String(finalTotal);
            } else if (prev.converted_amount && !isNaN(Number(prev.converted_amount))) {
                const prevAcTotal = (prev.rooms || []).reduce((sum, r) => sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0);
                const prevBedTotal = (prev.rooms || []).reduce((sum, r) => sum + (Number(r.bed_charge) || 0), 0);
                const delta = (acExtraTotal - prevAcTotal) + (bedExtraTotal - prevBedTotal);
                nextAmount = String(Math.max(0, Number(prev.converted_amount) + delta));
            }
            return {
                ...prev,
                total_rooms: nextRooms.length,
                rooms: nextRooms,
                bed_type: idx === 0 && changes.bed_type !== undefined ? changes.bed_type : prev.bed_type,
                bed_charge: idx === 0 && changes.bed_charge !== undefined ? changes.bed_charge : prev.bed_charge,
                converted_amount: nextAmount
            };
        });
    };

    const handleConvertBedTypeChange = (newBedType) => {
        handleConvertRoomChange(0, { bed_type: newBedType });
    };

    const handleConvertBedChargeChange = (newBedChargeVal) => {
        handleConvertRoomChange(0, { bed_charge: Math.max(0, Number(newBedChargeVal) || 0) });
    };

    // Confirm Convert Lead
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

        const bookingDays = Math.max(1, parseInt(convertFormData.booking_days, 10) || 1);
        const roomsArr = convertFormData.rooms || [];
        const roomsDesc = roomsArr.length > 0
            ? roomsArr.map((r, i) => `Room #${i+1}: ${r.type === 'ac' ? `AC (+₹${r.extra_charge || 0})` : 'Non-AC'}, Bed: ${r.bed_type || 'Double Bed'}${Number(r.bed_charge) > 0 ? ` (+₹${r.bed_charge})` : ''}`).join(', ')
            : '1 Room';

        const bookingDetailsSummary = `Package: ${finalPackageName || 'Standard Package'} (${bookingDays} ${bookingDays === 1 ? 'Night' : 'Nights'}) | Rooms: ${roomsArr.length} (${roomsDesc}) | Total Members: ${totalPax} Pax (${convertFormData.adults || 0} Adults, ${convertFormData.children || 0} Children, ${convertFormData.infants || 0} Infants)${Number(convertFormData.extra_discount) > 0 ? ` | Discount: ₹${convertFormData.extra_discount}` : ''}`;

        const finalNote = convertFormData.conversion_note 
            ? `${convertFormData.conversion_note.trim()}\n[${bookingDetailsSummary}]`
            : `[${bookingDetailsSummary}]`;

        const payload = {
            contact_id: convertFormData.contact_id,
            package_name: finalPackageName,
            booking_days: bookingDays,
            converted_amount: convertFormData.converted_amount,
            travel_date: convertFormData.travel_date,
            conversion_note: finalNote,
            adults: convertFormData.adults,
            children: convertFormData.children,
            infants: convertFormData.infants,
            number_of_persons: totalPax,
            total_rooms: roomsArr.length || convertFormData.total_rooms || 1,
            rooms: roomsArr,
            room_details: roomsArr,
            extra_discount: convertFormData.extra_discount
        };

        try {
            const res = await axiosPost(convertLeadUrl, payload, token);
            if (res?.status) {
                showMessage('success', '🎉 Lead marked as Converted successfully! Moved to Converted Leads section.');
                setConvertModalOpen(false);
                fetchFollowups(currentPage, activeTab);
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

    // Reopen Lead (Unmark Converted)
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
                fetchFollowups(currentPage, activeTab);
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

    // Helper to calculate total package rate based on package price, adults, children, AC extra charges, and booking nights
    // Nightly Base Rate + Nightly Room Charges multiplied by bookingDays (nights)
    const calculateAutoRate = (packageName, adultsCount, childrenCount, roomsList, bookingDaysCount = 1) => {
        const adults = Math.max(0, parseInt(adultsCount, 10) || 0);
        const children = Math.max(0, parseInt(childrenCount, 10) || 0);
        const billablePersons = adults + children;
        const days = Math.max(1, parseInt(bookingDaysCount, 10) || 1);

        const matched = findMatchedPackage(packageSuggestions, packageName);
        const unitPrice = matched ? Number(matched.actual_price || matched.base_price || matched.price || 0) : 0;
        const standardNights = matched ? (Math.max(1, parseInt(matched.duration_nights, 10) || (parseInt(matched.duration_days, 10) ? Math.max(1, parseInt(matched.duration_days, 10) - 1) : 1))) : 1;

        const nightlyBaseRate = standardNights > 0 ? (unitPrice / standardNights) : unitPrice;
        const baseTotal = nightlyBaseRate > 0 ? Math.round(nightlyBaseRate * days * billablePersons) : 0;
        
        // Extra room charges (AC and Extra Bed) are entered as total calculated prices (flat total, not multiplied by nights)
        const acExtraTotal = (roomsList || []).reduce((sum, r) => {
            return sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0);
        }, 0);

        const bedExtraTotal = (roomsList || []).reduce((sum, r) => {
            return sum + (Number(r.bed_charge) || 0);
        }, 0);

        const totalRate = (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) ? (baseTotal + acExtraTotal + bedExtraTotal) : 0;
        return {
            unitPrice,
            standardDays: standardNights,
            standardNights,
            days,
            nights: days,
            billablePersons,
            baseTotal,
            acExtraTotal,
            bedExtraTotal,
            totalRate
        };
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

        const loadedRooms = parseItemRooms(item);
        const rawPkgName = (item.package_name || '').trim();
        const matchedPkg = findMatchedPackage(packageSuggestions, rawPkgName);
        const selectedPkgVal = matchedPkg ? matchedPkg.title : (rawPkgName || '');
        const customPkgVal = matchedPkg ? '' : (rawPkgName || '');

        const loadedBookingDays = Math.max(1, parseInt(item.booking_days, 10) || (matchedPkg ? (parseInt(matchedPkg.duration_nights, 10) || (parseInt(matchedPkg.duration_days, 10) ? Math.max(1, parseInt(matchedPkg.duration_days, 10) - 1) : 1)) : 1));
        const loadedAdults = item.adults !== undefined && item.adults !== null ? Number(item.adults) : Math.max(1, parseInt(item.number_of_persons, 10) || 2);
        const loadedChildren = item.children !== undefined && item.children !== null ? Number(item.children) : 0;
        const loadedInfants = item.infants !== undefined && item.infants !== null ? Number(item.infants) : 0;
        const totalPax = loadedAdults + loadedChildren + loadedInfants;

        setFormData({
            contact_id: item.contact_id || item.id,
            lead_name: item.lead_name || item.name || '',
            phone: item.phone || item.wa_id || '',
            email: item.email || '',
            lead_type: item.lead_type || 'warm',
            travel_date: formatDateVal(item.travel_date),
            booking_days: loadedBookingDays,
            travel_destination: item.travel_destination || 'Sundarban',
            adults: loadedAdults,
            children: loadedChildren,
            infants: loadedInfants,
            number_of_persons: totalPax,
            total_rooms: loadedRooms.length,
            rooms: loadedRooms,
            package_name: selectedPkgVal,
            custom_package_name: customPkgVal,
            package_rate: item.package_rate || '',
            next_followup_date: formatDateVal(item.next_followup_date),
            extra_note: ''
        });
        setEditModalOpen(true);
    };

    const handlePackageChange = (val) => {
        const matched = findMatchedPackage(packageSuggestions, val);
        const defaultDays = matched ? (Math.max(1, parseInt(matched.duration_nights, 10) || (parseInt(matched.duration_days, 10) ? Math.max(1, parseInt(matched.duration_days, 10) - 1) : 1))) : (formData.booking_days || 1);
        const { totalRate, unitPrice } = calculateAutoRate(val, formData.adults, formData.children, formData.rooms, defaultDays);
        setFormData(prev => ({
            ...prev,
            package_name: val,
            booking_days: defaultDays,
            custom_package_name: val === '__custom__' ? prev.custom_package_name : '',
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleBookingDaysChange = (val) => {
        const days = Math.max(1, parseInt(val, 10) || 1);
        const effectivePkg = formData.package_name === '__custom__' ? formData.custom_package_name : formData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, formData.adults, formData.children, formData.rooms, days);
        setFormData(prev => ({
            ...prev,
            booking_days: days,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleAdultsChange = (val) => {
        const adults = Math.max(0, parseInt(val, 10) || 0);
        const children = Math.max(0, parseInt(formData.children, 10) || 0);
        const infants = Math.max(0, parseInt(formData.infants, 10) || 0);
        const effectivePkg = formData.package_name === '__custom__' ? formData.custom_package_name : formData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, adults, children, formData.rooms, formData.booking_days);
        setFormData(prev => ({
            ...prev,
            adults: val,
            number_of_persons: adults + children + infants,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleChildrenChange = (val) => {
        const adults = Math.max(0, parseInt(formData.adults, 10) || 0);
        const children = Math.max(0, parseInt(val, 10) || 0);
        const infants = Math.max(0, parseInt(formData.infants, 10) || 0);
        const effectivePkg = formData.package_name === '__custom__' ? formData.custom_package_name : formData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, adults, children, formData.rooms, formData.booking_days);
        setFormData(prev => ({
            ...prev,
            children: val,
            number_of_persons: adults + children + infants,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleInfantsChange = (val) => {
        const adults = Math.max(0, parseInt(formData.adults, 10) || 0);
        const children = Math.max(0, parseInt(formData.children, 10) || 0);
        const infants = Math.max(0, parseInt(val, 10) || 0);
        setFormData(prev => ({
            ...prev,
            infants: val,
            number_of_persons: adults + children + infants
        }));
    };

    const handlePersonsChange = (val) => {
        handleAdultsChange(val);
    };

    const handleAddRoom = () => {
        const nextRooms = [...(formData.rooms || [])];
        nextRooms.push({ id: Date.now(), room_number: nextRooms.length + 1, type: 'non_ac', extra_charge: 0, bed_type: 'Double Bed', bed_charge: 0 });
        const effectivePkg = formData.package_name === '__custom__' ? formData.custom_package_name : formData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, formData.adults, formData.children, nextRooms, formData.booking_days);
        setFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleRemoveRoom = (idx) => {
        if ((formData.rooms || []).length <= 1) return;
        const nextRooms = formData.rooms.filter((_, i) => i !== idx).map((r, i) => ({ ...r, room_number: i + 1 }));
        const effectivePkg = formData.package_name === '__custom__' ? formData.custom_package_name : formData.package_name;
        const { totalRate, unitPrice } = calculateAutoRate(effectivePkg, formData.adults, formData.children, nextRooms, formData.booking_days);
        setFormData(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            package_rate: unitPrice > 0 ? String(totalRate) : prev.package_rate
        }));
    };

    const handleRoomChange = (idx, changes) => {
        const nextRooms = formData.rooms.map((r, i) => i === idx ? { ...r, ...changes } : r);
        const effectivePkg = formData.package_name === '__custom__' ? formData.custom_package_name : formData.package_name;
        const { totalRate, unitPrice, acExtraTotal, bedExtraTotal } = calculateAutoRate(effectivePkg, formData.adults, formData.children, nextRooms, formData.booking_days);
        setFormData(prev => {
            let nextRate = prev.package_rate;
            if (unitPrice > 0) {
                nextRate = String(totalRate);
            } else if (prev.package_rate && !isNaN(Number(prev.package_rate))) {
                const prevAcTotal = (prev.rooms || []).reduce((sum, r) => sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0);
                const prevBedTotal = (prev.rooms || []).reduce((sum, r) => sum + (Number(r.bed_charge) || 0), 0);
                const delta = (acExtraTotal - prevAcTotal) + (bedExtraTotal - prevBedTotal);
                nextRate = String(Math.max(0, Number(prev.package_rate) + delta));
            }
            return {
                ...prev,
                total_rooms: nextRooms.length,
                rooms: nextRooms,
                package_rate: nextRate
            };
        });
    };

    // Submit Follow-up Form
    const handleSaveFollowup = async (e) => {
        e.preventDefault();
        if (!formData.contact_id) {
            showMessage('error', 'Contact ID is missing.');
            return;
        }

        setSavingFollowup(true);

        const finalPackageName = formData.package_name === '__custom__'
            ? (formData.custom_package_name || 'Custom Package')
            : formData.package_name;

        const totalPax = (parseInt(formData.adults, 10) || 0) + (parseInt(formData.children, 10) || 0) + (parseInt(formData.infants, 10) || 0);

        const payload = {
            ...formData,
            package_name: finalPackageName,
            booking_days: formData.booking_days || 1,
            adults: formData.adults,
            children: formData.children,
            infants: formData.infants,
            number_of_persons: totalPax,
            total_rooms: (formData.rooms || []).length || formData.total_rooms || 1,
            rooms: formData.rooms,
            room_details: formData.rooms
        };

        try {
            const res = await axiosPost(saveLeadFollowupUrl, payload, token);
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
                {/* Total Active Followups */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm h-100 rounded-3 cursor-pointer ${activeTab === 'all' ? 'border-primary border-2' : ''}`}
                        onClick={() => handleTabChange('all')}
                        style={{ transition: 'transform 0.15s ease' }}
                    >
                        <div className="card-body p-3">
                            <span className="text-muted small text-uppercase fw-semibold d-block">Active Pipeline</span>
                            <h3 className="fw-bold mb-0 text-dark mt-1">{stats.total_followups}</h3>
                            <small className="text-primary d-inline-flex align-items-center gap-1 mt-1">
                                <i className="ri ri-list-check"></i> In Follow-up
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

                {/* Converted Won Leads Highlight Card */}
                <div className="col-6 col-md-4 col-xl-2">
                    <div 
                        className={`card border-0 shadow-sm h-100 rounded-3 cursor-pointer ${activeTab === 'converted' ? 'bg-success text-white' : ''}`}
                        onClick={() => handleTabChange('converted')}
                        style={{ 
                            backgroundColor: activeTab === 'converted' ? '#16a34a' : '#f0fdf4',
                            borderColor: '#86efac',
                            transition: 'transform 0.15s ease'
                        }}
                    >
                        <div className="card-body p-3">
                            <span className={`small text-uppercase fw-semibold d-block ${activeTab === 'converted' ? 'text-white' : 'text-success'}`}>
                                🎉 Converted Leads
                            </span>
                            <h3 className={`fw-bold mb-0 mt-1 ${activeTab === 'converted' ? 'text-white' : 'text-success'}`}>
                                {stats.converted_leads || 0}
                            </h3>
                            <small className={`d-inline-flex align-items-center gap-1 mt-1 ${activeTab === 'converted' ? 'text-white-50' : 'text-success'}`}>
                                <i className="ri ri-checkbox-circle-fill"></i> Won Deals
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Comprehensive Filter Toolbar */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
                <div className="card-body p-3 p-md-4">
                    {/* Quick Filter Pill Buttons & Quick Sort */}
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap border-bottom pb-3">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="small text-muted fw-semibold me-1">Quick Filters:</span>
                            
                            <button
                                type="button"
                                onClick={() => handleTabChange('all')}
                                className={`btn btn-sm rounded-pill px-3 ${activeTab === 'all' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                            >
                                All Active Leads ({stats.total_followups})
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

                            <button
                                type="button"
                                onClick={() => handleTabChange('converted')}
                                className={`btn btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 ${activeTab === 'converted' ? 'btn-success text-white shadow-sm' : 'btn-outline-success'}`}
                            >
                                <i className="ri ri-checkbox-circle-fill"></i>
                                <span>🎉 Converted Leads ({stats.converted_leads || 0})</span>
                            </button>
                        </div>

                        {/* Quick Sort Toggle Button */}
                        <div className="d-flex align-items-center gap-2">
                            <span className="small text-muted fw-semibold d-none d-lg-inline">Sort:</span>
                            <div className="btn-group btn-group-sm rounded-pill p-0.5 bg-light border" role="group">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSortBy('followup_date_asc');
                                        setCurrentPage(1);
                                        fetchFollowups(1, activeTab, 'followup_date_asc');
                                    }}
                                    className={`btn btn-xs rounded-pill px-2.5 py-1 ${sortBy === 'followup_date_asc' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                    style={sortBy === 'followup_date_asc' ? { backgroundColor: '#0066cc', borderColor: '#0066cc', fontSize: '11px' } : { fontSize: '11px' }}
                                    title="Sort by Next Follow-up Date: Earliest First"
                                >
                                    <i className="ri ri-sort-asc me-1"></i> Follow-up Date (Earliest)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSortBy('followup_date_desc');
                                        setCurrentPage(1);
                                        fetchFollowups(1, activeTab, 'followup_date_desc');
                                    }}
                                    className={`btn btn-xs rounded-pill px-2.5 py-1 ${sortBy === 'followup_date_desc' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                    style={sortBy === 'followup_date_desc' ? { backgroundColor: '#0066cc', borderColor: '#0066cc', fontSize: '11px' } : { fontSize: '11px' }}
                                    title="Sort by Next Follow-up Date: Latest First"
                                >
                                    <i className="ri ri-sort-desc me-1"></i> Follow-up Date (Latest)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Filter Form */}
                    <form onSubmit={handleFilterSubmit} className="row g-3 align-items-end">
                        {/* Search Term */}
                        <div className="col-12 col-md-3 col-lg-3">
                            <label className="form-label small text-muted fw-semibold">Search Lead Name / Phone</label>
                            <div className="input-group">
                                <span className="input-group-text bg-transparent border-end-0">
                                    <i className="ri ri-search-line text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control rounded-end-pill border-start-0 ps-0"
                                    placeholder="Name, Phone, Destination, Package..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Sort by Follow-up Date Filter Option */}
                        <div className="col-6 col-md-3 col-lg-2">
                            <label className="form-label small text-muted fw-semibold d-flex align-items-center gap-1">
                                <i className="ri ri-sort-desc text-primary"></i>
                                <span>Sort By</span>
                            </label>
                            <select 
                                className="form-select rounded-pill"
                                value={sortBy}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSortBy(val);
                                    setCurrentPage(1);
                                    fetchFollowups(1, activeTab, val);
                                }}
                            >
                                <option value="followup_date_asc">📅 Follow-up Date (Earliest First)</option>
                                <option value="followup_date_desc">📅 Follow-up Date (Latest First)</option>
                                <option value="priority">⚡ Smart Priority (Today &amp; Overdue)</option>
                                <option value="last_followup">🕒 Last Contacted Date</option>
                                <option value="travel_date">✈️ Travel Date</option>
                                <option value="newest">🆕 Newly Created First</option>
                            </select>
                        </div>

                        {/* Date Filter Type */}
                        <div className="col-6 col-md-2 col-lg-2">
                            <label className="form-label small text-muted fw-semibold">Date Type</label>
                            <select 
                                className="form-select rounded-pill"
                                value={dateFilterType}
                                onChange={(e) => setDateFilterType(e.target.value)}
                            >
                                {activeTab === 'converted' && (
                                    <option value="converted_at">Date Converted</option>
                                )}
                                <option value="next_followup">Next Follow-up Date</option>
                                <option value="travel_date">Travel Date</option>
                                <option value="last_followup">Last Contacted Date</option>
                            </select>
                        </div>

                        {/* From Date */}
                        <div className="col-6 col-md-2 col-lg-2">
                            <label className="form-label small text-muted fw-semibold">From Date</label>
                            <input
                                type="date"
                                className="form-control rounded-pill"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        {/* To Date */}
                        <div className="col-6 col-md-2 col-lg-2">
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
                            <div className="col-6 col-md-2 col-lg-2">
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
                        <div className="col-12 col-md-auto d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary rounded-pill px-3 d-inline-flex align-items-center justify-content-center gap-1"
                                style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                title="Apply Filters"
                            >
                                <i className="ri ri-filter-3-line"></i>
                                <span className="small">Filter</span>
                            </button>
                            {(searchTerm || fromDate || toDate || filterAssignee || activeTab !== 'all' || sortBy !== 'followup_date_asc') && (
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
                        {activeTab === 'converted' ? (
                            <h5 className="mb-0 fw-bold text-success d-flex align-items-center gap-2">
                                <i className="ri ri-trophy-line fs-4 text-warning"></i>
                                <span>🎉 Converted Leads (Closed / Won Deals)</span>
                                <span className="badge bg-label-success rounded-pill px-2.5 py-0.5 small">{totalItems} Won Deals</span>
                            </h5>
                        ) : (
                            <h5 className="mb-0 fw-bold text-heading d-flex align-items-center gap-2">
                                <i className="ri ri-calendar-check-line text-primary"></i>
                                <span>Active Follow-up Pipeline</span>
                                <span className="badge bg-label-secondary rounded-pill px-2.5 py-0.5 small">{totalItems} leads</span>
                            </h5>
                        )}
                    </div>
                </div>

                <div className="table-responsive" style={{ minHeight: '380px' }}>
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
                            <h5 className="fw-semibold mb-1">
                                {activeTab === 'converted' ? 'No converted leads yet' : 'No follow-ups found'}
                            </h5>
                            <p className="text-muted small mb-3">
                                {activeTab === 'converted' 
                                    ? 'Leads marked as Converted will appear here. Convert hot leads into won bookings.'
                                    : activeTab === 'today' 
                                        ? 'No follow-up calls or messages are scheduled for today.' 
                                        : 'No leads match your selected filters. Start by adding a follow-up to any WhatsApp lead.'}
                            </p>
                            <Link href="/crm/whatsapp" className="btn btn-primary btn-sm rounded-pill px-4">
                                View WhatsApp Leads
                            </Link>
                        </div>
                    ) : activeTab === 'converted' ? (
                        /* Converted Leads Table View */
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Customer &amp; Contact</th>
                                    <th>Won Package &amp; Final Deal</th>
                                    <th>Travel Destination &amp; Details</th>
                                    <th>Converted Date &amp; Staff</th>
                                    <th>Conversion Remarks</th>
                                    <th className="text-center pe-4" style={{ width: '80px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {followups.filter(item => item.is_converted == 1).map((item) => (
                                    <tr key={item.followup_id} className="bg-success bg-opacity-10 border-bottom">
                                        {/* Customer Name & Contact */}
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center gap-2.5">
                                                <div 
                                                    className="avatar avatar-md rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                                    style={{ backgroundColor: '#16a34a', fontSize: '13px', width: '38px', height: '38px' }}
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

                                        {/* Travel Destination & Details */}
                                        <td>
                                            <div>
                                                <span className="fw-semibold text-dark d-block small">
                                                    <i className="ri ri-map-pin-2-line text-danger me-1"></i>
                                                    {item.travel_destination || 'Sundarban'}
                                                </span>
                                                <small className="text-muted d-block mt-0.5">
                                                    <i className="ri ri-calendar-line me-1"></i>
                                                    Travel: <strong>{formatDate(item.travel_date)}</strong>{item.booking_days ? ` (${item.booking_days} ${item.booking_days == 1 ? 'Night' : 'Nights'})` : ''}
                                                </small>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <span className="badge bg-light text-dark border px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                        <i className="ri-moon-line me-1"></i>{item.booking_days || 1} {Number(item.booking_days) === 1 ? 'Night' : 'Nights'}
                                                    </span>
                                                    <span className="badge bg-light text-dark border px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                        <i className="ri ri-group-line me-1"></i>{item.number_of_persons || 1} Persons
                                                    </span>
                                                    <span className="badge bg-light text-dark border px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                        <i className="ri ri-hotel-bed-line me-1"></i>{item.total_rooms || 1} Rooms
                                                    </span>
                                                    {Array.isArray(item.rooms) && item.rooms.filter(r => r.type === 'ac').length > 0 && (
                                                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                            <i className="ri ri-windy-fill me-1"></i>{item.rooms.filter(r => r.type === 'ac').length} AC
                                                        </span>
                                                    )}
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
                                                className="text-dark small" 
                                                style={{ maxWidth: '230px', whiteSpace: 'pre-wrap' }}
                                                title={item.conversion_note || item.extra_note || ''}
                                            >
                                                {item.conversion_note || item.extra_note || <span className="fst-italic text-muted opacity-75">No conversion notes</span>}
                                            </div>
                                        </td>

                                        {/* Actions Dropdown (3 dots) */}
                                        <td className="text-center pe-4" style={{ position: 'relative' }}>
                                            <div className="dropdown followup-actions-dropdown d-inline-block position-relative">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdownId(activeDropdownId === `conv_${item.followup_id}` ? null : `conv_${item.followup_id}`);
                                                    }}
                                                    className={`btn btn-sm ${activeDropdownId === `conv_${item.followup_id}` ? 'btn-primary text-white shadow-sm' : 'btn-light border'} rounded-circle p-0 d-inline-flex align-items-center justify-content-center`}
                                                    style={{ width: '34px', height: '34px', transition: 'all 0.2s ease' }}
                                                    title="More Actions"
                                                    aria-expanded={activeDropdownId === `conv_${item.followup_id}`}
                                                >
                                                    <i className="ri ri-more-2-fill fs-5"></i>
                                                </button>

                                                {activeDropdownId === `conv_${item.followup_id}` && (
                                                    <ul
                                                        className="dropdown-menu dropdown-menu-end show border-0 shadow-lg rounded-3 py-2 position-absolute"
                                                        style={{
                                                            right: 0,
                                                            top: '100%',
                                                            marginTop: '6px',
                                                            zIndex: 1050,
                                                            minWidth: '235px',
                                                            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
                                                            border: '1px solid rgba(0,0,0,0.08)'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {/* 1. Create Invoice */}
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
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Generate invoice &amp; pay link</small>
                                                                </div>
                                                            </Link>
                                                        </li>

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
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Move back to active pipeline</small>
                                                                </div>
                                                            </button>
                                                        </li>

                                                        {/* 4. WhatsApp Chat */}
                                                        <li><hr className="dropdown-divider my-1" /></li>
                                                        <li>
                                                            <Link
                                                                href={item.phone ? `/crm/whatsapp?phone=${item.phone}` : '/crm/whatsapp'}
                                                                className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                onClick={() => setActiveDropdownId(null)}
                                                            >
                                                                <span className="badge bg-success bg-opacity-10 text-success p-1.5 rounded-2">
                                                                    <i className="ri ri-whatsapp-fill fs-6"></i>
                                                                </span>
                                                                <div>
                                                                    <div className="fw-semibold small text-dark">WhatsApp Chat</div>
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Direct message lead</small>
                                                                </div>
                                                            </Link>
                                                        </li>
                                                        {isSuperAdmin && (
                                                            <>
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
                                                                            <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Permanently remove lead &amp; history</small>
                                                                        </div>
                                                                    </button>
                                                                </li>
                                                            </>
                                                        )}
                                                    </ul>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* Active Follow-up Leads Table View */
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Lead &amp; Contact</th>
                                    <th>Status / Type</th>
                                    <th>Travel Details</th>
                                    <th 
                                        className="cursor-pointer user-select-none text-nowrap"
                                        onClick={handleToggleFollowupDateSort}
                                        title="Click to toggle sorting by Follow-up Date (Earliest / Latest)"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-inline-flex align-items-center gap-1">
                                            <span>Next Follow-up</span>
                                            {sortBy === 'followup_date_asc' ? (
                                                <span className="badge bg-primary text-white rounded-pill px-1.5 py-0.5 ms-1" style={{ fontSize: '10px' }}>
                                                    <i className="ri ri-arrow-up-line"></i> Earliest
                                                </span>
                                            ) : sortBy === 'followup_date_desc' ? (
                                                <span className="badge bg-primary text-white rounded-pill px-1.5 py-0.5 ms-1" style={{ fontSize: '10px' }}>
                                                    <i className="ri ri-arrow-down-line"></i> Latest
                                                </span>
                                            ) : (
                                                <i className="ri ri-arrow-up-down-line text-muted opacity-50 ms-1" style={{ fontSize: '12px' }}></i>
                                            )}
                                        </div>
                                    </th>
                                    <th>Latest Note</th>
                                    {isSuperAdmin && <th>Assigned Admin</th>}
                                    <th className="text-center pe-4" style={{ width: '80px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {followups.filter(item => item.is_converted != 1).map((item) => (
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
                                                    {formatDate(item.travel_date)}{item.booking_days ? ` (${item.booking_days} ${item.booking_days == 1 ? 'Night' : 'Nights'})` : ''}
                                                </small>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <span className="badge bg-light text-dark border px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                        <i className="ri-moon-line me-1"></i>{item.booking_days || 1} {Number(item.booking_days) === 1 ? 'Night' : 'Nights'}
                                                    </span>
                                                    <span className="badge bg-light text-dark border px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                        <i className="ri ri-group-line me-1"></i>{item.number_of_persons || 1} Persons
                                                    </span>
                                                    <span className="badge bg-light text-dark border px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                        <i className="ri ri-hotel-bed-line me-1"></i>{item.total_rooms || 1} Rooms
                                                    </span>
                                                    {Array.isArray(item.rooms) && item.rooms.filter(r => r.type === 'ac').length > 0 && (
                                                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0.5 rounded-pill" style={{ fontSize: '10.5px' }}>
                                                            <i className="ri ri-windy-fill me-1"></i>{item.rooms.filter(r => r.type === 'ac').length} AC
                                                        </span>
                                                    )}
                                                </div>
                                                {item.package_name && (
                                                    <div className="mt-1">
                                                        <span className="badge bg-label-primary text-primary border px-2 py-0.5 rounded-pill d-inline-flex align-items-center gap-1" style={{ fontSize: '10.5px' }}>
                                                            <i className="ri ri-suitcase-line"></i> {item.package_name}
                                                            {item.package_rate && <strong className="text-dark ms-1">• ₹{item.package_rate}</strong>}
                                                        </span>
                                                    </div>
                                                )}
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

                                        {/* Actions Dropdown (3 dots) */}
                                        <td className="text-center pe-4" style={{ position: 'relative' }}>
                                            <div className="dropdown followup-actions-dropdown d-inline-block position-relative">
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
                                                            minWidth: '235px',
                                                            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
                                                            border: '1px solid rgba(0,0,0,0.08)'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {/* 1. Convert Lead or Create Invoice */}
                                                        {item.is_converted == 1 ? (
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
                                                                        <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Generate invoice &amp; pay link</small>
                                                                    </div>
                                                                </Link>
                                                            </li>
                                                        ) : (
                                                            <li>
                                                                <button
                                                                    type="button"
                                                                    className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                    onClick={() => {
                                                                        setActiveDropdownId(null);
                                                                        handleOpenConvertModal(item);
                                                                    }}
                                                                >
                                                                    <span className="badge bg-success bg-opacity-10 text-success p-1.5 rounded-2">
                                                                        <i className="ri ri-checkbox-circle-fill fs-6"></i>
                                                                    </span>
                                                                    <div>
                                                                        <div className="fw-semibold small text-dark">Convert Lead</div>
                                                                        <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Mark won deal &amp; rate</small>
                                                                    </div>
                                                                </button>
                                                            </li>
                                                        )}

                                                        {/* 2. Update Follow-up */}
                                                        <li>
                                                            <button
                                                                type="button"
                                                                className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                onClick={() => {
                                                                    setActiveDropdownId(null);
                                                                    handleOpenEditModal(item);
                                                                }}
                                                            >
                                                                <span className="badge bg-primary bg-opacity-10 text-primary p-1.5 rounded-2">
                                                                    <i className="ri ri-edit-box-line fs-6"></i>
                                                                </span>
                                                                <div>
                                                                    <div className="fw-semibold small text-dark">Update Follow-up</div>
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Record call note &amp; date</small>
                                                                </div>
                                                            </button>
                                                        </li>

                                                        {/* 3. Timeline Logs */}
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
                                                                    <div className="fw-semibold small text-dark">Timeline Logs</div>
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>{item.total_followup_logs || 1} history log{(item.total_followup_logs || 1) > 1 ? 's' : ''}</small>
                                                                </div>
                                                            </button>
                                                        </li>

                                                        {/* 4. WhatsApp Chat */}
                                                        <li><hr className="dropdown-divider my-1" /></li>
                                                        <li>
                                                            <Link
                                                                href={item.phone ? `/crm/whatsapp?phone=${item.phone}` : '/crm/whatsapp'}
                                                                className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                onClick={() => setActiveDropdownId(null)}
                                                            >
                                                                <span className="badge bg-success bg-opacity-10 text-success p-1.5 rounded-2">
                                                                    <i className="ri ri-whatsapp-fill fs-6"></i>
                                                                </span>
                                                                <div>
                                                                    <div className="fw-semibold small text-dark">WhatsApp Chat</div>
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Direct message lead</small>
                                                                </div>
                                                            </Link>
                                                        </li>
                                                        {isSuperAdmin && (
                                                            <>
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
                                                                            <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Permanently remove lead &amp; history</small>
                                                                        </div>
                                                                    </button>
                                                                </li>
                                                            </>
                                                        )}
                                                    </ul>
                                                )}
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

            {/* 5. Convert Lead Modal (Mark as Converted / Won Deal) */}
            {convertModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
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
                                            <div className="col-12 col-md-5">
                                                <label className="form-label small fw-bold text-dark d-flex align-items-center justify-content-between">
                                                    <span className="d-flex align-items-center gap-1">
                                                        <i className="ri ri-suitcase-line text-primary"></i>
                                                        <span>Booked Tour Package</span>
                                                    </span>
                                                    {(() => {
                                                        const pkgVal = convertFormData.package_name === '__custom__' ? convertFormData.custom_package_name : convertFormData.package_name;
                                                        const matched = findMatchedPackage(packageSuggestions, pkgVal);
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
                                                        const pkgName = pkg.title || pkg.name;
                                                        const priceVal = Number(pkg.actual_price || pkg.base_price || pkg.price || 0);
                                                        return (
                                                            <option key={pkg.id || pkgName} value={pkgName}>
                                                                {pkgName} {priceVal > 0 ? `(₹${priceVal.toLocaleString('en-IN')}/person)` : ''}
                                                            </option>
                                                        );
                                                    })}
                                                    {convertFormData.package_name && convertFormData.package_name !== '__custom__' && !packageSuggestions.some(p => (p.title || p.name) === convertFormData.package_name) && (
                                                        <option value={convertFormData.package_name}>{convertFormData.package_name}</option>
                                                    )}
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

                                            <div className="col-12 col-md-4">
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

                                            <div className="col-12 col-md-3">
                                                <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                    <span className="d-flex align-items-center gap-1">
                                                        <i className="ri-moon-line text-primary"></i>
                                                        <span>Booking Nights</span>
                                                    </span>
                                                    <small className="text-primary fw-bold">{convertFormData.booking_days || 1} {Number(convertFormData.booking_days) === 1 ? 'Night' : 'Nights'}</small>
                                                </label>
                                                <div className="input-group">
                                                    <button 
                                                        type="button"
                                                        className="btn btn-outline-secondary px-2.5 d-flex align-items-center justify-content-center"
                                                        onClick={() => handleConvertBookingDaysChange(Math.max(1, (parseInt(convertFormData.booking_days, 10) || 1) - 1))}
                                                        disabled={Number(convertFormData.booking_days) <= 1}
                                                        title="Decrease nights (minimum 1)"
                                                    >
                                                        <i className="ri-subtract-line fw-bold"></i>
                                                    </button>
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        max="90"
                                                        className="form-control text-center fw-bold"
                                                        placeholder="1"
                                                        value={convertFormData.booking_days}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            handleConvertBookingDaysChange(val === '' ? 1 : Math.max(1, parseInt(val, 10) || 1));
                                                        }}
                                                    />
                                                    <button 
                                                        type="button"
                                                        className="btn btn-outline-secondary px-2.5 d-flex align-items-center justify-content-center"
                                                        onClick={() => handleConvertBookingDaysChange((parseInt(convertFormData.booking_days, 10) || 1) + 1)}
                                                        title="Increase nights"
                                                    >
                                                        <i className="ri-add-line fw-bold"></i>
                                                    </button>
                                                </div>
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
                                        <div className="d-flex flex-column gap-2.5 mt-2">
                                            {(convertFormData.rooms || []).map((room, rIdx) => (
                                                <div 
                                                    key={room.id || rIdx} 
                                                    className="p-3 rounded-3 border bg-light shadow-2xs"
                                                >
                                                    {/* Room Header */}
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="badge bg-secondary bg-opacity-10 text-dark rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '12px' }}>
                                                                <i className="ri ri-door-open-line me-1 text-primary"></i> Room #{rIdx + 1}
                                                            </span>
                                                            <span className="text-muted small" style={{ fontSize: '11px' }}>
                                                                {room.type === 'ac' ? `AC (+₹${room.extra_charge || 0})` : 'Non-AC'} • {room.bed_type || 'Double Bed'}{Number(room.bed_charge) > 0 ? ` (+₹${room.bed_charge})` : ''}
                                                            </span>
                                                        </div>
                                                        {(convertFormData.rooms || []).length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleConvertRemoveRoom(rIdx)}
                                                                className="btn btn-outline-danger btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                                                                style={{ width: '26px', height: '26px' }}
                                                                title="Remove room"
                                                            >
                                                                <i className="ri ri-delete-bin-line" style={{ fontSize: '13px' }}></i>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Row 1: AC / Non-AC & AC Extra Charges */}
                                                    <div className="row g-2 align-items-center mb-2">
                                                        <div className="col-12 col-md-5">
                                                            <div className="btn-group btn-group-sm rounded-pill p-0.5 bg-white border w-100" role="group">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleConvertRoomChange(rIdx, { type: 'non_ac', extra_charge: 0 })}
                                                                    className={`btn btn-sm rounded-pill px-2.5 py-1 flex-fill ${room.type === 'non_ac' ? 'btn-secondary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                                    style={{ fontSize: '11.5px' }}
                                                                >
                                                                    <i className="ri ri-temp-cold-line me-1"></i> Non-AC
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleConvertRoomChange(rIdx, { type: 'ac', extra_charge: room.extra_charge !== undefined ? room.extra_charge : 0 })}
                                                                    className={`btn btn-sm rounded-pill px-2.5 py-1 flex-fill ${room.type === 'ac' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                                    style={{ fontSize: '11.5px' }}
                                                                >
                                                                    <i className="ri ri-windy-fill me-1"></i> AC Room
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="col-12 col-md-7">
                                                            {room.type === 'ac' ? (
                                                                <div className="d-flex align-items-center gap-1.5">
                                                                    <label className="small fw-semibold text-primary mb-0 text-nowrap" style={{ fontSize: '11px' }}>
                                                                        AC Charge:
                                                                    </label>
                                                                    <div className="input-group input-group-sm">
                                                                        <span className="input-group-text bg-white border-end-0 text-muted fw-bold">₹</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            className="form-control border-start-0"
                                                                            placeholder="0"
                                                                            value={room.extra_charge !== undefined ? room.extra_charge : 0}
                                                                            onChange={(e) => handleConvertRoomChange(rIdx, { extra_charge: Number(e.target.value) || 0 })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="small text-muted fst-italic ps-1" style={{ fontSize: '11px' }}>
                                                                    Standard Non-AC (₹0 extra)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Bed Selection & Bed Charges */}
                                                    <div className="row g-2 align-items-center pt-2 border-top">
                                                        <div className="col-12 col-md-6">
                                                            <div className="d-flex align-items-center gap-1.5">
                                                                <label className="small fw-semibold text-dark mb-0 text-nowrap d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                                                                    <i className="ri ri-hotel-bed-line text-info"></i> Bed:
                                                                </label>
                                                                <select
                                                                    className="form-select form-select-sm rounded-2 bg-white"
                                                                    value={room.bed_type || 'Double Bed'}
                                                                    onChange={(e) => handleConvertRoomChange(rIdx, { bed_type: e.target.value })}
                                                                    style={{ fontSize: '11.5px' }}
                                                                >
                                                                    <option value="Double Bed">Double Bed (1 Queen/King)</option>
                                                                    <option value="Twin Beds">Twin Beds (2 Singles)</option>
                                                                    <option value="Triple Bed">Triple Bed (1 Double + 1 Single)</option>
                                                                    <option value="Family Suite">Family Suite (2 Double Beds)</option>
                                                                    <option value="King Bed + Extra Mattress">King Bed + Extra Mattress</option>
                                                                    <option value="Extra Bed / Mattress">Extra Bed / Mattress</option>
                                                                    <option value="Single Bed">Single Bed</option>
                                                                    <option value="Custom Bedding">Custom Bedding</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="col-12 col-md-6">
                                                            <div className="d-flex align-items-center gap-1.5">
                                                                <label className="small fw-semibold text-info mb-0 text-nowrap" style={{ fontSize: '11px' }}>
                                                                    Bed Charge:
                                                                </label>
                                                                <div className="input-group input-group-sm">
                                                                    <span className="input-group-text bg-white border-end-0 text-muted fw-bold">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="form-control border-start-0"
                                                                        placeholder="0"
                                                                        value={room.bed_charge !== undefined ? room.bed_charge : 0}
                                                                        onChange={(e) => handleConvertRoomChange(rIdx, { bed_charge: Number(e.target.value) || 0 })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Summary Row */}
                                        <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top flex-wrap gap-2" style={{ fontSize: '12px' }}>
                                            <span className="text-muted">
                                                Configured: <strong>{(convertFormData.rooms || []).length} Rooms</strong> ({(convertFormData.rooms || []).filter(r => r.type === 'ac').length} AC, {(convertFormData.rooms || []).filter(r => r.type === 'non_ac').length} Non-AC)
                                            </span>
                                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                {(convertFormData.rooms || []).some(r => r.type === 'ac' && Number(r.extra_charge) > 0) && (
                                                    <span className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 rounded-pill">
                                                        Total AC Extra: +₹{(convertFormData.rooms || []).reduce((acc, r) => acc + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0)}
                                                    </span>
                                                )}
                                                {(convertFormData.rooms || []).some(r => Number(r.bed_charge) > 0) && (
                                                    <span className="badge bg-info bg-opacity-10 text-info px-2.5 py-1 rounded-pill">
                                                        Total Bed Extra: +₹{(convertFormData.rooms || []).reduce((acc, r) => acc + (Number(r.bed_charge) || 0), 0)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Extra Discount */}
                                    <div className="card bg-white border rounded-3 p-3 mb-3">
                                        <div className="row g-3 align-items-center">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-bold text-dark d-flex align-items-center justify-content-between">
                                                    <span className="d-flex align-items-center gap-1">
                                                        <i className="ri ri-coupon-3-line text-danger"></i>
                                                        <span>Extra Discount (₹)</span>
                                                    </span>
                                                    <small className="text-muted">Subtracted from package price</small>
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
                                            <div className="col-12 col-md-6">
                                                <div className="small text-muted pt-md-3">
                                                    <i className="ri ri-information-line text-primary me-1"></i>
                                                    Special negotiated discount. Bed types and charges are configured per room in Room Configuration above.
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
                                                    const { unitPrice, billablePersons, baseTotal, acExtraTotal, bedExtraTotal, discount, days } = calculateConvertAutoAmount(
                                                        effectivePkg,
                                                        convertFormData.adults,
                                                        convertFormData.children,
                                                        convertFormData.extra_discount,
                                                        convertFormData.rooms,
                                                        convertFormData.booking_days
                                                    );
                                                    return (
                                                        <div className="small text-muted">
                                                            {unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0 ? (
                                                                <>
                                                                    <div><strong>Auto-Calculation ({days} {days === 1 ? 'Night' : 'Nights'}):</strong> ₹{baseTotal.toLocaleString('en-IN')} ({billablePersons} pax){acExtraTotal > 0 ? ` + ₹${acExtraTotal.toLocaleString('en-IN')} AC` : ''}{bedExtraTotal > 0 ? ` + ₹${bedExtraTotal.toLocaleString('en-IN')} Bed` : ''}{discount > 0 ? ` - ₹${discount.toLocaleString('en-IN')} disc` : ''}</div>
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
                                            <strong>Status Change:</strong> Lead will move to <strong>Converted Leads</strong> and be removed from the daily follow-up queue.
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
                                            placeholder="e.g. Booking confirmed! Advance payment of ₹5,000 received via GPay. Booked AC Cottage for 4 pax. Client requested pickup at Canning station."
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

            {/* 6. Add / Update Follow-up Modal */}
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

                                    {/* 3. Travel Date & Total Booking Nights */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-7">
                                            <label className="form-label small fw-semibold">Estimated Travel Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control rounded-3"
                                                value={formData.travel_date}
                                                onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12 col-md-5">
                                            <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                <span className="d-flex align-items-center gap-1">
                                                    <i className="ri-moon-line text-primary"></i>
                                                    <span>Total Booking Nights</span>
                                                </span>
                                                <small className="text-primary fw-bold">{formData.booking_days || 1} {Number(formData.booking_days) === 1 ? 'Night' : 'Nights'}</small>
                                            </label>
                                            <div className="input-group">
                                                <button 
                                                    type="button"
                                                    className="btn btn-outline-secondary px-2.5 d-flex align-items-center justify-content-center"
                                                    onClick={() => handleBookingDaysChange(Math.max(1, (parseInt(formData.booking_days, 10) || 1) - 1))}
                                                    disabled={Number(formData.booking_days) <= 1}
                                                    title="Decrease nights (minimum 1)"
                                                >
                                                    <i className="ri-subtract-line fw-bold"></i>
                                                </button>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    max="90"
                                                    className="form-control text-center fw-bold"
                                                    placeholder="1"
                                                    value={formData.booking_days}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        handleBookingDaysChange(val === '' ? 1 : Math.max(1, parseInt(val, 10) || 1));
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    className="btn btn-outline-secondary px-2.5 d-flex align-items-center justify-content-center"
                                                    onClick={() => handleBookingDaysChange((parseInt(formData.booking_days, 10) || 1) + 1)}
                                                    title="Increase nights"
                                                >
                                                    <i className="ri-add-line fw-bold"></i>
                                                </button>
                                            </div>
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
                                                Total: {(parseInt(formData.adults, 10) || 0) + (parseInt(formData.children, 10) || 0) + (parseInt(formData.infants, 10) || 0)} Pax
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
                                                    value={formData.adults}
                                                    onChange={(e) => handleAdultsChange(e.target.value)}
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
                                                    value={formData.children}
                                                    onChange={(e) => handleChildrenChange(e.target.value)}
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
                                                    value={formData.infants}
                                                    onChange={(e) => handleInfantsChange(e.target.value)}
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
                                                    <span>Room Configuration ({formData.rooms?.length || 1} {(formData.rooms?.length || 1) === 1 ? 'Room' : 'Rooms'})</span>
                                                </label>
                                                <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                                                    Configure rooms one by one. Choose AC to specify extra charges.
                                                </small>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddRoom}
                                                className="btn btn-outline-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1 py-1 px-3 shadow-xs"
                                            >
                                                <i className="ri ri-add-line"></i>
                                                <span>+ Add Room</span>
                                            </button>
                                        </div>

                                        {/* Rooms List */}
                                        <div className="d-flex flex-column gap-2 mt-2">
                                            {(formData.rooms || []).map((room, rIdx) => (
                                                <div 
                                                    key={room.id || rIdx} 
                                                    className="p-3 rounded-3 border bg-light d-flex flex-column gap-2"
                                                >
                                                    {/* Room Header */}
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="badge bg-secondary bg-opacity-10 text-dark rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '12px' }}>
                                                                <i className="ri ri-door-open-line me-1 text-primary"></i> Room #{rIdx + 1}
                                                            </span>
                                                            <span className="badge bg-white text-muted border px-2 py-0.5 rounded-pill" style={{ fontSize: '11px' }}>
                                                                {room.type === 'ac' ? `AC (+₹${room.extra_charge || 0})` : 'Non-AC'} • {room.bed_type || 'Double Bed'}{Number(room.bed_charge) > 0 ? ` (+₹${room.bed_charge})` : ''}
                                                            </span>
                                                        </div>
                                                        {(formData.rooms || []).length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveRoom(rIdx)}
                                                                className="btn btn-outline-danger btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                                                                style={{ width: '26px', height: '26px' }}
                                                                title="Remove room"
                                                            >
                                                                <i className="ri ri-delete-bin-line" style={{ fontSize: '13px' }}></i>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Row 1: AC / Non-AC & AC Extra Charges */}
                                                    <div className="row g-2 align-items-center mb-2">
                                                        <div className="col-12 col-md-5">
                                                            <div className="btn-group btn-group-sm rounded-pill p-0.5 bg-white border w-100" role="group">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRoomChange(rIdx, { type: 'non_ac', extra_charge: 0 })}
                                                                    className={`btn btn-sm rounded-pill px-2.5 py-1 flex-fill ${room.type === 'non_ac' ? 'btn-secondary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                                    style={{ fontSize: '11.5px' }}
                                                                >
                                                                    <i className="ri ri-temp-cold-line me-1"></i> Non-AC
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRoomChange(rIdx, { type: 'ac', extra_charge: room.extra_charge !== undefined ? room.extra_charge : 0 })}
                                                                    className={`btn btn-sm rounded-pill px-2.5 py-1 flex-fill ${room.type === 'ac' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-muted border-0'}`}
                                                                    style={{ fontSize: '11.5px' }}
                                                                >
                                                                    <i className="ri ri-windy-fill me-1"></i> AC Room
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="col-12 col-md-7">
                                                            {room.type === 'ac' ? (
                                                                <div className="d-flex align-items-center gap-1.5">
                                                                    <label className="small fw-semibold text-primary mb-0 text-nowrap" style={{ fontSize: '11px' }}>
                                                                        AC Charge:
                                                                    </label>
                                                                    <div className="input-group input-group-sm">
                                                                        <span className="input-group-text bg-white border-end-0 text-muted fw-bold">₹</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            className="form-control border-start-0"
                                                                            placeholder="0"
                                                                            value={room.extra_charge !== undefined ? room.extra_charge : 0}
                                                                            onChange={(e) => handleRoomChange(rIdx, { extra_charge: Number(e.target.value) || 0 })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="small text-muted fst-italic ps-1" style={{ fontSize: '11px' }}>
                                                                    Standard Non-AC (₹0 extra)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Bed Selection & Bed Charges */}
                                                    <div className="row g-2 align-items-center pt-2 border-top">
                                                        <div className="col-12 col-md-6">
                                                            <div className="d-flex align-items-center gap-1.5">
                                                                <label className="small fw-semibold text-dark mb-0 text-nowrap d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                                                                    <i className="ri ri-hotel-bed-line text-info"></i> Bed:
                                                                </label>
                                                                <select
                                                                    className="form-select form-select-sm rounded-2 bg-white"
                                                                    value={room.bed_type || 'Double Bed'}
                                                                    onChange={(e) => handleRoomChange(rIdx, { bed_type: e.target.value })}
                                                                    style={{ fontSize: '11.5px' }}
                                                                >
                                                                    <option value="Double Bed">Double Bed (1 Queen/King)</option>
                                                                    <option value="Twin Beds">Twin Beds (2 Singles)</option>
                                                                    <option value="Triple Bed">Triple Bed (1 Double + 1 Single)</option>
                                                                    <option value="Family Suite">Family Suite (2 Double Beds)</option>
                                                                    <option value="King Bed + Extra Mattress">King Bed + Extra Mattress</option>
                                                                    <option value="Extra Bed / Mattress">Extra Bed / Mattress</option>
                                                                    <option value="Single Bed">Single Bed</option>
                                                                    <option value="Custom Bedding">Custom Bedding</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="col-12 col-md-6">
                                                            <div className="d-flex align-items-center gap-1.5">
                                                                <label className="small fw-semibold text-info mb-0 text-nowrap" style={{ fontSize: '11px' }}>
                                                                    Bed Charge:
                                                                </label>
                                                                <div className="input-group input-group-sm">
                                                                    <span className="input-group-text bg-white border-end-0 text-muted fw-bold">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="form-control border-start-0"
                                                                        placeholder="0"
                                                                        value={room.bed_charge !== undefined ? room.bed_charge : 0}
                                                                        onChange={(e) => handleRoomChange(rIdx, { bed_charge: Number(e.target.value) || 0 })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Summary Row */}
                                        <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top flex-wrap gap-2" style={{ fontSize: '12px' }}>
                                            <span className="text-muted">
                                                Configured: <strong>{(formData.rooms || []).length} Rooms</strong> ({(formData.rooms || []).filter(r => r.type === 'ac').length} AC, {(formData.rooms || []).filter(r => r.type === 'non_ac').length} Non-AC)
                                            </span>
                                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                {(formData.rooms || []).some(r => r.type === 'ac' && Number(r.extra_charge) > 0) && (
                                                    <span className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 rounded-pill">
                                                        Total AC Extra: +₹{(formData.rooms || []).reduce((acc, r) => acc + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0)}
                                                    </span>
                                                )}
                                                {(formData.rooms || []).some(r => Number(r.bed_charge) > 0) && (
                                                    <span className="badge bg-info bg-opacity-10 text-info px-2.5 py-1 rounded-pill">
                                                        Total Bed Extra: +₹{(formData.rooms || []).reduce((acc, r) => acc + (Number(r.bed_charge) || 0), 0)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Package Dropdown & Auto-calculated Rate */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                                                <span className="d-flex align-items-center gap-1">
                                                    <i className="ri ri-suitcase-line text-primary"></i>
                                                    <span>Select Tour Package</span>
                                                </span>
                                                {(() => {
                                                    const pkgVal = formData.package_name === '__custom__' ? formData.custom_package_name : formData.package_name;
                                                    const matched = findMatchedPackage(packageSuggestions, pkgVal);
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
                                                value={formData.package_name}
                                                onChange={(e) => handlePackageChange(e.target.value)}
                                            >
                                                <option value="">-- Choose from available packages --</option>
                                                {packageSuggestions.map((pkg) => {
                                                    const pkgName = pkg.title || pkg.name;
                                                    const priceVal = Number(pkg.actual_price || pkg.base_price || pkg.price || 0);
                                                    return (
                                                        <option key={pkg.id || pkgName} value={pkgName}>
                                                            {pkgName} {priceVal > 0 ? `(₹${priceVal.toLocaleString('en-IN')}/person)` : ''}
                                                        </option>
                                                    );
                                                })}
                                                {formData.package_name && formData.package_name !== '__custom__' && !packageSuggestions.some(p => (p.title || p.name) === formData.package_name) && (
                                                    <option value={formData.package_name}>{formData.package_name}</option>
                                                )}
                                                <option value="__custom__">➕ Custom / Other Package...</option>
                                            </select>

                                            {formData.package_name === '__custom__' && (
                                                <input
                                                    type="text"
                                                    className="form-control rounded-3 mt-2"
                                                    placeholder="Enter custom package name..."
                                                    value={formData.custom_package_name || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData(prev => ({ ...prev, custom_package_name: val }));
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
                                                    const { unitPrice, billablePersons, baseTotal, acExtraTotal, bedExtraTotal, days } = calculateAutoRate(
                                                        formData.package_name === '__custom__' ? formData.custom_package_name : formData.package_name,
                                                        formData.adults,
                                                        formData.children,
                                                        formData.rooms,
                                                        formData.booking_days
                                                    );
                                                    if (unitPrice > 0 || acExtraTotal > 0 || bedExtraTotal > 0) {
                                                        return (
                                                            <small className="text-muted" style={{ fontSize: '11px' }}>
                                                                ({days}N: ₹{baseTotal} [{billablePersons} pax]{acExtraTotal > 0 ? ` + ₹${acExtraTotal} AC` : ''}{bedExtraTotal > 0 ? ` + ₹${bedExtraTotal} Bed` : ''})
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
                                                    value={formData.package_rate}
                                                    onChange={(e) => setFormData({ ...formData, package_rate: e.target.value })}
                                                />
                                            </div>
                                            <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                                Auto-calculated from package price, person count, and AC rooms. You can adjust manually.
                                            </small>
                                        </div>
                                    </div>

                                    {/* 5. Next Follow-up Date & Extra Note */}
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
                                                                    Travel Date: <strong>{formatDate(log.travel_date)}</strong>{log.booking_days ? ` (${log.booking_days} ${log.booking_days == 1 ? 'Night' : 'Nights'})` : ''}
                                                                </span>
                                                            )}
                                                            {log.package_name && (
                                                                <span>
                                                                    <i className="ri ri-suitcase-line text-warning me-1"></i>
                                                                    Pkg: <strong>{log.package_name}</strong>
                                                                    {log.package_rate && <span className="ms-1">(₹{log.package_rate})</span>}
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

            {/* 4. Delete Lead Confirmation Modal (Admin Only) */}
            {deleteModalOpen && isSuperAdmin && leadToDelete && (
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
                                    <span>Delete CRM Lead</span>
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
                                    {leadToDelete.assigned_user_name && (
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">Assigned Admin:</span>
                                            <span className="text-primary fw-semibold">{leadToDelete.assigned_user_name}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="alert alert-warning border-0 rounded-3 text-start p-2.5 d-flex gap-2 align-items-start mb-0" style={{ fontSize: '12px' }}>
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
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
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
