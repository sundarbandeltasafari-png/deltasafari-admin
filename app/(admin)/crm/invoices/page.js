'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    getInvoicesListUrl, 
    createInvoiceUrl, 
    deleteInvoiceUrl, 
    getInvoiceConfigUrl, 
    getNextInvoiceNumberUrl,
    getBillingStatsUrl,
    getFollowupsListUrl,
    getSingleLeadFollowupUrl,
    getWhatsAppInvoiceTemplatesUrl,
    sendInvoiceWhatsAppUrl,
    generateInvoicePaymentLinkUrl,
    syncInvoicePaymentUrl,
    updateInvoicePaymentStatusUrl,
    getInvoicePaymentsHistoryUrl,
    uploadInvoiceProofUrl
} from '@/app/routes/whatsappRoutes';
import { getAllPackageUrl } from '@/app/routes/packageRoutes';
import { axiosGet, axiosPost, axiosDelete } from '@/libs/axiosHelper';
import axios from 'axios';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';
import InvoicePrintTemplate from '@/components/admin/invoice/InvoicePrintTemplate';
import { printInvoiceDocument } from '@/libs/printHelper';

export default function InvoicesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const createForLeadParam = searchParams.get('create_for_lead') || searchParams.get('lead_id');

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

    // Package Suggestions (for Package dropdown with price auto calculation)
    const [packageSuggestions, setPackageSuggestions] = useState([]);

    // WhatsApp Templates State
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Direct WhatsApp Dispatch Modal State
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [selectedInvoiceForWhatsApp, setSelectedInvoiceForWhatsApp] = useState(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [customWhatsAppMessage, setCustomWhatsAppMessage] = useState('');
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

    // Copy Info Feedback State
    const [copiedInvoiceId, setCopiedInvoiceId] = useState(null);

    // Row Dropdown Action Menu State
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.invoice-actions-dropdown')) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Manual Payment Status & Verification Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
    const [submittingPaymentStatus, setSubmittingPaymentStatus] = useState(false);
    const [proofUploading, setProofUploading] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        payment_status: 'paid',
        payment_method: 'UPI',
        amount_paid: '',
        payment_note: '',
        proof_file: '',
        proof_file_name: ''
    });

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
        package_name: '',
        custom_package_name: '',
        package_price: 2700,
        adults: 2,
        children: 0,
        infants: 0,
        customer_name: '',
        customer_address: 'West Bengal',
        customer_phone: '',
        customer_email: '',
        pickup_drop: 'Canning',
        number_of_pax: 2,
        total_rooms: 1,
        rooms: [{ id: 1, room_number: 1, type: 'non_ac', extra_charge: 0 }],
        room_required: '1 Room (1 Non-AC)',
        food_preference: 'Non Veg',
        departure_date_text: '',
        items: [
            { sn: 1, description: '2N 3D Sundarban Safari Special Package (2 Pax)', rate: 2700, person: 2, amount: 5400 }
        ],
        subtotal: 5400,
        gst_percent: 0,
        gst_amount: 0,
        discount_amount: 0,
        advance_note: '700/pax',
        advance_received: 2000,
        total_due_amount: 3400,
        payment_status: 'pending',
        bank_details_text: '',
        terms_text: '',
        send_whatsapp: true,
        template_id: ''
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

    // Fetch Package Suggestions
    const fetchPackageSuggestions = async () => {
        if (!token) return [];
        try {
            const res = await axiosGet(getAllPackageUrl, token);
            let pkgs = [];
            if (res?.status && Array.isArray(res.packages)) {
                pkgs = res.packages;
            } else if (Array.isArray(res?.data)) {
                pkgs = res.data;
            }
            setPackageSuggestions(pkgs);
            return pkgs;
        } catch (e) {
            console.error('Error loading package suggestions:', e);
            return [];
        }
    };

    // Fetch Converted Leads for Dropdown Selection
    const fetchConvertedLeads = async () => {
        if (!token) return [];
        setLoadingConverted(true);
        try {
            const res = await axiosGet(`${getFollowupsListUrl}?is_converted=true&limit=100`, token);
            let leads = [];
            if (res?.status && Array.isArray(res.followups)) {
                leads = res.followups.filter(f => f.is_converted == 1);
                setConvertedLeads(leads);
            }
            return leads;
        } catch (err) {
            console.error('Error loading converted leads:', err);
            return [];
        } finally {
            setLoadingConverted(false);
        }
    };

    // Fetch WhatsApp Templates
    const fetchTemplates = async () => {
        if (!token) return;
        setLoadingTemplates(true);
        try {
            const res = await axiosGet(getWhatsAppInvoiceTemplatesUrl, token);
            if (res?.status && Array.isArray(res.data)) {
                setTemplates(res.data);
                const def = res.data.find(t => t.is_default === 1) || res.data[0];
                if (def) {
                    setInvoiceForm(prev => ({ ...prev, template_id: def.id }));
                }
            }
        } catch (e) {
            console.error('Error loading WhatsApp templates:', e);
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchInvoices(1);
            fetchStatsAndConfig();
            fetchConvertedLeads();
            fetchPackageSuggestions();
            fetchTemplates();
        }
    }, [token]);

    // Template Variable Replacement Helper for Live WhatsApp Preview & Dispatch
    const renderMessageForInvoice = (templateText, inv) => {
        if (!templateText || !inv) return '';
        let t = templateText;
        const dueVal = Number(inv.total_due_amount) || 0;
        const advVal = Number(inv.advance_received) || 0;
        const subVal = Number(inv.subtotal) || 0;
        const pLink = inv.razorpay_payment_url || `https://sundarbandeltasafari.com/pay?invoice=${encodeURIComponent(inv.invoice_no || '')}&amount=${dueVal > 0 ? dueVal : subVal}`;

        const map = {
            '{{customer_name}}': inv.customer_name || 'Valued Guest',
            '{{customer_phone}}': inv.customer_phone || '',
            '{{invoice_no}}': inv.invoice_no || '',
            '{{invoice_date}}': inv.invoice_date || '',
            '{{package_name}}': inv.package_name || (inv.items && inv.items[0]?.description) || 'Sundarban Safari Package',
            '{{pax}}': `${inv.number_of_pax || 1} Person(s)`,
            '{{rooms}}': inv.room_required || '1 Room',
            '{{departure_date}}': inv.departure_date_text || 'As scheduled',
            '{{booking_date}}': inv.departure_date_text || inv.invoice_date || 'As scheduled',
            '{{pickup_drop}}': inv.pickup_drop || 'Canning',
            '{{total_amount}}': Number(inv.subtotal || 0).toLocaleString('en-IN'),
            '{{advance_amount}}': Number(inv.advance_received || 0).toLocaleString('en-IN'),
            '{{due_amount}}': Number(inv.total_due_amount || 0).toLocaleString('en-IN'),
            '{{advance_note}}': inv.advance_note || '',
            '{{payment_link}}': pLink,
            '{{company_name}}': invoiceConfig?.company_name || 'DELTA SAFARI',
            '{{tagline}}': invoiceConfig?.tagline || 'WHERE EXPECTATIONS MEET REALITY',
            '{{website}}': invoiceConfig?.website || 'sundarbandeltasafari.com',
            '{{contact_number}}': invoiceConfig?.mobile_numbers || '+91 7029533240'
        };

        for (const [k, v] of Object.entries(map)) {
            t = t.split(k).join(v);
        }
        return t;
    };

    // Open WhatsApp Dispatch Modal
    const handleOpenWhatsAppModal = (inv) => {
        setSelectedInvoiceForWhatsApp(inv);
        const def = templates.find(t => t.id === invoiceConfig?.default_whatsapp_template_id) || templates.find(t => t.is_default === 1) || templates[0];
        const initialTemplateId = def?.id || '';
        setSelectedTemplateId(initialTemplateId);
        const rendered = renderMessageForInvoice(def?.template_text || '', inv);
        setCustomWhatsAppMessage(rendered);
        setWhatsappModalOpen(true);
    };

    const handleTemplateSelectInModal = (tmplId) => {
        setSelectedTemplateId(tmplId);
        const tmpl = templates.find(t => String(t.id) === String(tmplId));
        if (tmpl && selectedInvoiceForWhatsApp) {
            setCustomWhatsAppMessage(renderMessageForInvoice(tmpl.template_text, selectedInvoiceForWhatsApp));
        }
    };

    const handleSendWhatsAppMessage = async () => {
        if (!selectedInvoiceForWhatsApp) return;
        setSendingWhatsApp(true);
        try {
            const res = await axiosPost(`${sendInvoiceWhatsAppUrl}${selectedInvoiceForWhatsApp.id}/send-whatsapp`, {
                template_id: selectedTemplateId,
                custom_message: customWhatsAppMessage
            }, token);

            if (res?.status) {
                showMessage('success', '🚀 WhatsApp message with Razorpay Payment Link sent successfully!');
                setWhatsappModalOpen(false);
                fetchInvoices(currentPage);
            } else {
                showMessage('error', res?.msg || 'Failed to send WhatsApp message.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error sending WhatsApp message.');
        } finally {
            setSendingWhatsApp(false);
        }
    };

    const [syncingPaymentId, setSyncingPaymentId] = useState(null);

    const handleSyncPaymentStatus = async (invoice) => {
        if (!invoice?.id) return;
        setSyncingPaymentId(invoice.id);
        try {
            const res = await axiosPost(`${syncInvoicePaymentUrl}${invoice.id}/sync-payment`, {}, token);
            if (res?.status) {
                if (res.settled) {
                    showMessage('success', res.msg || '🎉 Payment verified! Invoice is now auto-settled.');
                    fetchInvoices(currentPage);
                    fetchStats();
                } else {
                    showMessage('info', res.msg || `Razorpay Status: ${res.payment_link_status}`);
                }
            } else {
                showMessage('error', res?.msg || 'Failed to check Razorpay payment link status.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error syncing payment status.');
        } finally {
            setSyncingPaymentId(null);
        }
    };

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

        let status = 'pending';
        if (totalDue <= 0 && itemSum > 0) status = 'paid';
        else if (advVal > 0) status = 'partial';
        else status = 'pending';

        return {
            subtotal: itemSum,
            gst_amount: gstVal,
            total_due_amount: totalDue,
            payment_status: status
        };
    };

    // Sync line items, room summary, and totals
    const syncInvoiceItemsAndTotals = ({
        packageName,
        customPackageName,
        packagePrice,
        adults,
        children,
        infants,
        rooms,
        customItems = null,
        gstPercent = 0,
        discountAmount = 0,
        advanceReceived = 0,
        packagesList = packageSuggestions
    }) => {
        const adultsCount = Math.max(0, parseInt(adults, 10) || 0);
        const childrenCount = Math.max(0, parseInt(children, 10) || 0);
        const infantsCount = Math.max(0, parseInt(infants, 10) || 0);
        const totalPax = adultsCount + childrenCount + infantsCount;
        const billablePax = adultsCount + childrenCount; // Infants are FREE (₹0)

        // Find package title and rate
        let pkgTitle = packageName === '__custom__' 
            ? (customPackageName || 'Custom Safari Tour Package') 
            : (packageName || '2N 3D Sundarban Safari Special Package');
        let pkgRate = Number(packagePrice) || 2700;

        if (packageName && packageName !== '__custom__' && Array.isArray(packagesList) && packagesList.length > 0) {
            const matched = packagesList.find(p => (p.name === packageName || p.title === packageName));
            if (matched) {
                pkgRate = Number(matched.actual_price || matched.base_price || matched.price || pkgRate);
                pkgTitle = matched.name || matched.title || pkgTitle;
            }
        }

        // Room breakdown & AC extra charges
        const roomsList = rooms || [];
        const acRoomsCount = roomsList.filter(r => r.type === 'ac').length;
        const nonAcRoomsCount = roomsList.filter(r => r.type === 'non_ac').length;
        const totalAcExtraCharge = roomsList.reduce((sum, r) => sum + (r.type === 'ac' ? (Number(r.extra_charge) || 0) : 0), 0);

        let roomSummaryText = '';
        if (roomsList.length > 0) {
            const parts = [];
            if (acRoomsCount > 0) parts.push(`${acRoomsCount} AC`);
            if (nonAcRoomsCount > 0) parts.push(`${nonAcRoomsCount} Non-AC`);
            roomSummaryText = `${roomsList.length} Room(s) (${parts.join(', ') || 'Standard'})`;
        } else {
            roomSummaryText = '1 Room';
        }

        // Build items
        let items = [];
        if (Array.isArray(customItems) && customItems.length > 0) {
            items = customItems;
        } else {
            const effectiveBillPax = Math.max(1, billablePax);
            const packageAmount = pkgRate * effectiveBillPax;
            // Main Package item
            items.push({
                sn: 1,
                description: `${pkgTitle} (${effectiveBillPax} Pax Sharing)${infantsCount > 0 ? ` + ${infantsCount} Infant(s) [Free]` : ''}`,
                rate: pkgRate,
                person: effectiveBillPax,
                amount: packageAmount
            });

            // AC Charges item if applicable
            if (totalAcExtraCharge > 0) {
                items.push({
                    sn: 2,
                    description: `AC Room Surcharge (${acRoomsCount} AC Room${acRoomsCount > 1 ? 's' : ''})`,
                    rate: totalAcExtraCharge,
                    person: '',
                    amount: totalAcExtraCharge
                });
            }
        }

        const calcs = recalculateTotals(items, gstPercent, discountAmount, advanceReceived);

        return {
            items,
            totalPax: Math.max(1, totalPax),
            billablePax,
            roomSummaryText,
            packageRate: pkgRate,
            subtotal: calcs.subtotal,
            gst_amount: calcs.gst_amount,
            total_due_amount: calcs.total_due_amount,
            payment_status: calcs.payment_status
        };
    };

    // Passenger change handlers
    const handleInvoiceAdultsChange = (val) => {
        const adults = Math.max(0, parseInt(val, 10) || 0);
        const sync = syncInvoiceItemsAndTotals({
            packageName: invoiceForm.package_name,
            customPackageName: invoiceForm.custom_package_name,
            packagePrice: invoiceForm.package_price,
            adults: adults,
            children: invoiceForm.children,
            infants: invoiceForm.infants,
            rooms: invoiceForm.rooms,
            gstPercent: invoiceForm.gst_percent,
            discountAmount: invoiceForm.discount_amount,
            advanceReceived: invoiceForm.advance_received
        });

        setInvoiceForm(prev => ({
            ...prev,
            adults: val,
            number_of_pax: sync.totalPax,
            items: sync.items,
            subtotal: sync.subtotal,
            gst_amount: sync.gst_amount,
            total_due_amount: sync.total_due_amount,
            payment_status: sync.payment_status
        }));
    };

    const handleInvoiceChildrenChange = (val) => {
        const children = Math.max(0, parseInt(val, 10) || 0);
        const sync = syncInvoiceItemsAndTotals({
            packageName: invoiceForm.package_name,
            customPackageName: invoiceForm.custom_package_name,
            packagePrice: invoiceForm.package_price,
            adults: invoiceForm.adults,
            children: children,
            infants: invoiceForm.infants,
            rooms: invoiceForm.rooms,
            gstPercent: invoiceForm.gst_percent,
            discountAmount: invoiceForm.discount_amount,
            advanceReceived: invoiceForm.advance_received
        });

        setInvoiceForm(prev => ({
            ...prev,
            children: val,
            number_of_pax: sync.totalPax,
            items: sync.items,
            subtotal: sync.subtotal,
            gst_amount: sync.gst_amount,
            total_due_amount: sync.total_due_amount,
            payment_status: sync.payment_status
        }));
    };

    const handleInvoiceInfantsChange = (val) => {
        const infants = Math.max(0, parseInt(val, 10) || 0);
        const sync = syncInvoiceItemsAndTotals({
            packageName: invoiceForm.package_name,
            customPackageName: invoiceForm.custom_package_name,
            packagePrice: invoiceForm.package_price,
            adults: invoiceForm.adults,
            children: invoiceForm.children,
            infants: infants,
            rooms: invoiceForm.rooms,
            gstPercent: invoiceForm.gst_percent,
            discountAmount: invoiceForm.discount_amount,
            advanceReceived: invoiceForm.advance_received
        });

        setInvoiceForm(prev => ({
            ...prev,
            infants: val,
            number_of_pax: sync.totalPax,
            items: sync.items,
            subtotal: sync.subtotal,
            gst_amount: sync.gst_amount,
            total_due_amount: sync.total_due_amount,
            payment_status: sync.payment_status
        }));
    };

    const handleInvoicePackageChange = (val) => {
        let matchedPrice = 2700;
        if (val !== '__custom__') {
            const matched = (packageSuggestions || []).find(p => (p.name === val || p.title === val));
            if (matched) {
                matchedPrice = Number(matched.actual_price || matched.base_price || matched.price || 2700);
            }
        }

        const sync = syncInvoiceItemsAndTotals({
            packageName: val,
            customPackageName: val === '__custom__' ? invoiceForm.custom_package_name : '',
            packagePrice: matchedPrice,
            adults: invoiceForm.adults,
            children: invoiceForm.children,
            infants: invoiceForm.infants,
            rooms: invoiceForm.rooms,
            gstPercent: invoiceForm.gst_percent,
            discountAmount: invoiceForm.discount_amount,
            advanceReceived: invoiceForm.advance_received
        });

        setInvoiceForm(prev => ({
            ...prev,
            package_name: val,
            custom_package_name: val === '__custom__' ? prev.custom_package_name : '',
            package_price: matchedPrice,
            items: sync.items,
            subtotal: sync.subtotal,
            gst_amount: sync.gst_amount,
            total_due_amount: sync.total_due_amount,
            payment_status: sync.payment_status
        }));
    };

    const handleInvoiceCustomPackageNameChange = (val) => {
        const sync = syncInvoiceItemsAndTotals({
            packageName: '__custom__',
            customPackageName: val,
            packagePrice: invoiceForm.package_price,
            adults: invoiceForm.adults,
            children: invoiceForm.children,
            infants: invoiceForm.infants,
            rooms: invoiceForm.rooms,
            gstPercent: invoiceForm.gst_percent,
            discountAmount: invoiceForm.discount_amount,
            advanceReceived: invoiceForm.advance_received
        });

        setInvoiceForm(prev => ({
            ...prev,
            custom_package_name: val,
            items: sync.items,
            subtotal: sync.subtotal,
            gst_amount: sync.gst_amount,
            total_due_amount: sync.total_due_amount,
            payment_status: sync.payment_status
        }));
    };

    const handleInvoiceCustomPackagePriceChange = (val) => {
        const price = Math.max(0, Number(val) || 0);
        const sync = syncInvoiceItemsAndTotals({
            packageName: '__custom__',
            customPackageName: invoiceForm.custom_package_name,
            packagePrice: price,
            adults: invoiceForm.adults,
            children: invoiceForm.children,
            infants: invoiceForm.infants,
            rooms: invoiceForm.rooms,
            gstPercent: invoiceForm.gst_percent,
            discountAmount: invoiceForm.discount_amount,
            advanceReceived: invoiceForm.advance_received
        });

        setInvoiceForm(prev => ({
            ...prev,
            package_price: val,
            items: sync.items,
            subtotal: sync.subtotal,
            gst_amount: sync.gst_amount,
            total_due_amount: sync.total_due_amount,
            payment_status: sync.payment_status
        }));
    };

    // Room Builder Handlers
    const handleInvoiceAddRoom = () => {
        const nextRooms = [...(invoiceForm.rooms || [])];
        nextRooms.push({ id: Date.now(), room_number: nextRooms.length + 1, type: 'non_ac', extra_charge: 0 });

        const sync = syncInvoiceItemsAndTotals({
            packageName: invoiceForm.package_name,
            customPackageName: invoiceForm.custom_package_name,
            packagePrice: invoiceForm.package_price,
            adults: invoiceForm.adults,
            children: invoiceForm.children,
            infants: invoiceForm.infants,
            rooms: nextRooms,
            gstPercent: invoiceForm.gst_percent,
            discountAmount: invoiceForm.discount_amount,
            advanceReceived: invoiceForm.advance_received
        });

        setInvoiceForm(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            room_required: sync.roomSummaryText,
            items: sync.items,
            subtotal: sync.subtotal,
            gst_amount: sync.gst_amount,
            total_due_amount: sync.total_due_amount,
            payment_status: sync.payment_status
        }));
    };

    const handleInvoiceRemoveRoom = (idx) => {
        if ((invoiceForm.rooms || []).length <= 1) return;
        const nextRooms = invoiceForm.rooms.filter((_, i) => i !== idx).map((r, i) => ({ ...r, room_number: i + 1 }));

        const sync = syncInvoiceItemsAndTotals({
            packageName: invoiceForm.package_name,
            customPackageName: invoiceForm.custom_package_name,
            packagePrice: invoiceForm.package_price,
            adults: invoiceForm.adults,
            children: invoiceForm.children,
            infants: invoiceForm.infants,
            rooms: nextRooms,
            gstPercent: invoiceForm.gst_percent,
            discountAmount: invoiceForm.discount_amount,
            advanceReceived: invoiceForm.advance_received
        });

        setInvoiceForm(prev => ({
            ...prev,
            total_rooms: nextRooms.length,
            rooms: nextRooms,
            room_required: sync.roomSummaryText,
            items: sync.items,
            subtotal: sync.subtotal,
            gst_amount: sync.gst_amount,
            total_due_amount: sync.total_due_amount,
            payment_status: sync.payment_status
        }));
    };

    const handleInvoiceRoomChange = (idx, changes) => {
        const nextRooms = invoiceForm.rooms.map((r, i) => i === idx ? { ...r, ...changes } : r);

        const sync = syncInvoiceItemsAndTotals({
            packageName: invoiceForm.package_name,
            customPackageName: invoiceForm.custom_package_name,
            packagePrice: invoiceForm.package_price,
            adults: invoiceForm.adults,
            children: invoiceForm.children,
            infants: invoiceForm.infants,
            rooms: nextRooms,
            gstPercent: invoiceForm.gst_percent,
            discountAmount: invoiceForm.discount_amount,
            advanceReceived: invoiceForm.advance_received
        });

        setInvoiceForm(prev => ({
            ...prev,
            rooms: nextRooms,
            room_required: sync.roomSummaryText,
            items: sync.items,
            subtotal: sync.subtotal,
            gst_amount: sync.gst_amount,
            total_due_amount: sync.total_due_amount,
            payment_status: sync.payment_status
        }));
    };

    // Helper to generate a full invoice form state from a converted lead
    const createInvoiceFormFromLead = (lead, packagesList = packageSuggestions, nextNo = '', config = invoiceConfig) => {
        const leadPax = Math.max(1, parseInt(lead.number_of_persons, 10) || 1);

        // Extract adults, children, infants from lead note if available
        let adultsCount = leadPax;
        let childrenCount = 0;
        let infantsCount = 0;
        const note = `${lead.conversion_note || ''} ${lead.extra_note || ''}`.trim();
        const adultsMatch = note.match(/(\d+)\s*Adults?/i);
        const childrenMatch = note.match(/(\d+)\s*Child(ren)?/i);
        const infantsMatch = note.match(/(\d+)\s*Infants?/i);
        if (adultsMatch) adultsCount = parseInt(adultsMatch[1], 10);
        if (childrenMatch) childrenCount = parseInt(childrenMatch[1], 10);
        if (infantsMatch) infantsCount = parseInt(infantsMatch[1], 10);

        const billablePax = Math.max(1, adultsCount + childrenCount);

        // Package Matching
        const leadPkgName = (lead.package_name || '').trim();
        const matchedPkg = Array.isArray(packagesList) 
            ? packagesList.find(p => (
                (p.name && leadPkgName && p.name.toLowerCase() === leadPkgName.toLowerCase()) ||
                (p.title && leadPkgName && p.title.toLowerCase() === leadPkgName.toLowerCase())
              ))
            : null;

        let selectedPackageName = '';
        let customPackageName = '';
        let pkgRate = 2700;

        if (matchedPkg) {
            selectedPackageName = matchedPkg.name || matchedPkg.title;
            customPackageName = '';
            pkgRate = Number(matchedPkg.actual_price || matchedPkg.base_price || matchedPkg.price || 2700);
        } else if (leadPkgName) {
            selectedPackageName = '__custom__';
            customPackageName = leadPkgName;
            const rawRate = lead.package_rate 
                ? parseFloat(lead.package_rate) 
                : (lead.converted_amount ? (parseFloat(lead.converted_amount) / billablePax) : 2700);
            pkgRate = Math.round(rawRate) || 2700;
        } else {
            selectedPackageName = packagesList?.length > 0 ? (packagesList[0].name || packagesList[0].title) : '2N 3D Sundarban Safari Special Package';
            customPackageName = '';
            pkgRate = packagesList?.length > 0 ? Number(packagesList[0].actual_price || packagesList[0].base_price || 2700) : 2700;
        }

        // Total Amount & Advance Calculation
        const totalAmount = lead.converted_amount 
            ? parseFloat(lead.converted_amount) 
            : (lead.package_rate ? parseFloat(lead.package_rate) * billablePax : pkgRate * billablePax);
        const advanceAmt = totalAmount > 2000 ? Math.min(2500, Math.round(totalAmount * 0.3)) : 500;
        const departureStr = lead.travel_date ? `${new Date(lead.travel_date).toLocaleDateString('en-GB')}` : '';

        // Room Configuration & AC Detection
        const totalRoomsCount = Math.max(1, parseInt(lead.total_rooms, 10) || 1);
        let rawLeadRooms = lead.rooms || lead.room_details;
        if (typeof rawLeadRooms === 'string') {
            try { rawLeadRooms = JSON.parse(rawLeadRooms); } catch (e) { rawLeadRooms = null; }
        }

        let initialRooms = [];
        if (Array.isArray(rawLeadRooms) && rawLeadRooms.length > 0) {
            initialRooms = rawLeadRooms.map((r, i) => ({
                id: Date.now() + i,
                room_number: r.room_number || i + 1,
                type: r.type === 'ac' ? 'ac' : 'non_ac',
                extra_charge: Number(r.extra_charge) || 0
            }));
        } else {
            const acMatch = note.match(/(\d+)\s*AC/i);
            let acCount = 0;
            if (acMatch) {
                acCount = Math.min(totalRoomsCount, parseInt(acMatch[1], 10));
            } else if (/\bAC\b/i.test(note) && !/\bNon-AC\b/i.test(note)) {
                acCount = totalRoomsCount;
            }

            initialRooms = Array.from({ length: totalRoomsCount }, (_, i) => ({
                id: Date.now() + i,
                room_number: i + 1,
                type: i < acCount ? 'ac' : 'non_ac',
                extra_charge: 0
            }));
        }

        const sync = syncInvoiceItemsAndTotals({
            packageName: selectedPackageName,
            customPackageName: customPackageName,
            packagePrice: pkgRate,
            adults: adultsCount,
            children: childrenCount,
            infants: infantsCount,
            rooms: initialRooms,
            advanceReceived: advanceAmt,
            packagesList: packagesList
        });

        const bankText = config?.account_number 
            ? `${config.bank_name || 'STATE BANK OF INDIA'} ; A/C Holder : ${config.account_holder || 'SANDIP HALDER'}\nA/C NO : ${config.account_number} ; IFSC : ${config.ifsc_code}`
            : '';
        const termsText = config?.terms_conditions || '';

        return {
            formData: {
                invoice_no: nextNo,
                invoice_date: new Date().toISOString().split('T')[0],
                contact_id: lead.contact_id || lead.id,
                package_name: selectedPackageName,
                custom_package_name: customPackageName,
                package_price: pkgRate,
                adults: adultsCount,
                children: childrenCount,
                infants: infantsCount,
                customer_name: lead.lead_name || lead.name || '',
                customer_address: 'West Bengal',
                customer_phone: lead.phone || lead.wa_id || '',
                customer_email: lead.email || '',
                pickup_drop: lead.travel_destination || 'Canning',
                number_of_pax: sync.totalPax,
                total_rooms: totalRoomsCount,
                rooms: initialRooms,
                room_required: sync.roomSummaryText,
                food_preference: 'Non Veg',
                departure_date_text: departureStr,
                items: sync.items,
                subtotal: sync.subtotal,
                gst_percent: 0,
                gst_amount: sync.gst_amount,
                discount_amount: 0,
                advance_note: `${Math.round(advanceAmt / Math.max(1, sync.billablePax))}/pax`,
                advance_received: advanceAmt,
                total_due_amount: sync.total_due_amount,
                payment_status: sync.payment_status,
                bank_details_text: bankText,
                terms_text: termsText,
                send_whatsapp: true,
                template_id: ''
            },
            selectedLeadId: String(lead.contact_id || lead.id)
        };
    };

    // Open Create Modal (optionally for a specific converted lead)
    const handleOpenCreateModal = async (targetLeadId = null) => {
        try {
            let currentPkgs = packageSuggestions;
            if (!currentPkgs || currentPkgs.length === 0) {
                currentPkgs = await fetchPackageSuggestions();
            }

            let currentConv = convertedLeads;
            if (!currentConv || currentConv.length === 0) {
                currentConv = await fetchConvertedLeads();
            }

            const numRes = await axiosGet(getNextInvoiceNumberUrl, token);
            const now = new Date();
            const yr = now.getFullYear();
            const mo = String(now.getMonth() + 1).padStart(2, '0');
            const rnd = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
            const nextNo = numRes?.data?.invoice_no || `INV-${yr}-${mo}-${rnd}`;

            let leadToUse = null;
            if (targetLeadId) {
                leadToUse = (currentConv || []).find(l => String(l.contact_id || l.id) === String(targetLeadId));
                if (!leadToUse) {
                    try {
                        const singleRes = await axiosGet(`${getSingleLeadFollowupUrl}${targetLeadId}`, token);
                        if (singleRes?.status && singleRes.data) {
                            const contact = singleRes.data.contact || {};
                            const followup = singleRes.data.followup || {};
                            leadToUse = {
                                ...followup,
                                ...contact,
                                contact_id: contact.id || followup.contact_id || targetLeadId,
                                lead_name: followup.lead_name || contact.name || 'WhatsApp Customer',
                                phone: followup.phone || contact.wa_id || '',
                                is_converted: 1
                            };
                            setConvertedLeads(prev => {
                                if (prev.some(l => String(l.contact_id || l.id) === String(targetLeadId))) return prev;
                                return [leadToUse, ...prev];
                            });
                        }
                    } catch (e) {
                        console.error('Error fetching target lead details:', e);
                    }
                }
            }

            if (leadToUse) {
                const { formData, selectedLeadId } = createInvoiceFormFromLead(leadToUse, currentPkgs, nextNo, invoiceConfig);
                setInvoiceForm(formData);
                setSelectedConvertedLeadId(selectedLeadId);
                setCreateMode('converted');
                setCreateModalOpen(true);
            } else {
                const defaultRooms = [{ id: 1, room_number: 1, type: 'non_ac', extra_charge: 0 }];
                const firstPackage = currentPkgs?.length > 0 ? (currentPkgs[0].name || currentPkgs[0].title) : '2N 3D Sundarban Safari Special Package';
                const firstPkgPrice = currentPkgs?.length > 0 ? Number(currentPkgs[0].actual_price || currentPkgs[0].base_price || 2700) : 2700;

                const sync = syncInvoiceItemsAndTotals({
                    packageName: firstPackage,
                    customPackageName: '',
                    packagePrice: firstPkgPrice,
                    adults: 2,
                    children: 0,
                    infants: 0,
                    rooms: defaultRooms,
                    advanceReceived: 2000,
                    packagesList: currentPkgs
                });

                setInvoiceForm({
                    invoice_no: nextNo,
                    invoice_date: new Date().toISOString().split('T')[0],
                    contact_id: null,
                    package_name: firstPackage,
                    custom_package_name: '',
                    package_price: firstPkgPrice,
                    adults: 2,
                    children: 0,
                    infants: 0,
                    customer_name: '',
                    customer_address: 'West Bengal',
                    customer_phone: '',
                    customer_email: '',
                    pickup_drop: 'Canning',
                    number_of_pax: 2,
                    total_rooms: 1,
                    rooms: defaultRooms,
                    room_required: sync.roomSummaryText,
                    food_preference: 'Non Veg',
                    departure_date_text: '',
                    items: sync.items,
                    subtotal: sync.subtotal,
                    gst_percent: 0,
                    gst_amount: sync.gst_amount,
                    discount_amount: 0,
                    advance_note: '700/pax',
                    advance_received: 2000,
                    total_due_amount: sync.total_due_amount,
                    payment_status: sync.payment_status,
                    bank_details_text: invoiceConfig?.account_number 
                        ? `${invoiceConfig.bank_name || 'STATE BANK OF INDIA'} ; A/C Holder : ${invoiceConfig.account_holder || 'SANDIP HALDER'}\nA/C NO : ${invoiceConfig.account_number} ; IFSC : ${invoiceConfig.ifsc_code}`
                        : '',
                    terms_text: invoiceConfig?.terms_conditions || '',
                    send_whatsapp: true,
                    template_id: ''
                });

                setSelectedConvertedLeadId('');
                setCreateMode('converted');
                setCreateModalOpen(true);
            }
        } catch (e) {
            console.error(e);
            setCreateModalOpen(true);
        }
    };

    // Auto-open create invoice modal when URL param create_for_lead is present
    useEffect(() => {
        if (createForLeadParam && token) {
            handleOpenCreateModal(createForLeadParam);
        }
    }, [createForLeadParam, token]);

    // When admin selects a converted lead from the dropdown
    const handleSelectConvertedLead = (leadId) => {
        setSelectedConvertedLeadId(leadId);
        if (!leadId) return;

        const lead = convertedLeads.find(l => String(l.contact_id || l.id) === String(leadId));
        if (!lead) return;

        const { formData, selectedLeadId } = createInvoiceFormFromLead(
            lead,
            packageSuggestions,
            invoiceForm.invoice_no,
            invoiceConfig
        );

        setInvoiceForm(prev => ({
            ...prev,
            ...formData,
            invoice_no: prev.invoice_no || formData.invoice_no,
            invoice_date: prev.invoice_date || formData.invoice_date,
            template_id: prev.template_id || formData.template_id
        }));
        setSelectedConvertedLeadId(selectedLeadId);
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
                showMessage('success', res?.msg || '🎉 Invoice generated with Razorpay Payment Link!');
                setCreateModalOpen(false);
                fetchInvoices(1);
                fetchStatsAndConfig();

                // Open print preview immediately
                const finalCreatedInvoice = {
                    ...invoiceForm,
                    id: res.data?.id,
                    razorpay_payment_url: res.data?.payment_url || invoiceForm.razorpay_payment_url,
                    razorpay_payment_link_id: res.data?.payment_link_id
                };
                setSelectedInvoiceToPrint(finalCreatedInvoice);
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

    // Delete Invoice (Super Admin Only)
    const handleDeleteInvoice = async (id, invNo) => {
        if (Number(user?.admin) !== 1) {
            showMessage('error', 'Access denied: Only administrators can delete invoices. Employees are not permitted to delete invoices.');
            return;
        }
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

    // Copy Payment Link with Package Booking Details
    const handleCopyPaymentAndBookingDetails = (inv) => {
        const pkgTitle = inv.package_name || (inv.items && inv.items[0]?.description) || 'Sundarban Safari Tour Package';
        const totalAmount = parseFloat(inv.subtotal || 0) + parseFloat(inv.gst_amount || 0) - parseFloat(inv.discount_amount || 0);
        const advanceAmount = parseFloat(inv.advance_received || 0);
        const dueAmount = parseFloat(inv.total_due_amount || 0);
        const advancePayable = advanceAmount > 0 ? advanceAmount : Math.min(totalAmount, (inv.number_of_pax || 1) * 1000);

        const payUrl = inv.razorpay_payment_url || 'https://rzp.io/rzp/deltasafari';
        const bankDetails = inv.bank_details_text || (invoiceConfig?.account_number 
            ? `${invoiceConfig.bank_name || 'STATE BANK OF INDIA'} ; A/C Holder : ${invoiceConfig.account_holder || 'SANDIP HALDER'}\nA/C NO : ${invoiceConfig.account_number} ; IFSC : ${invoiceConfig.ifsc_code}`
            : 'Bank: STATE BANK OF INDIA\nA/C Holder: SANDIP HALDER\nA/C No: 34193984830\nIFSC: SBIN0011367\nUPI: 7029533240@ybl');

        const copyText = `🌿 *DELTA SAFARI - TOUR BOOKING & PAYMENT DETAILS* 🌿

Dear *${inv.customer_name || 'Traveler'}*,
Greetings from Delta Safari! Here are your tour package booking and payment details:

📄 *Invoice No:* #${inv.invoice_no}
📅 *Invoice Date:* ${inv.invoice_date || new Date().toISOString().split('T')[0]}
🏝️ *Package:* ${pkgTitle}
🗓️ *Travel Date:* ${inv.departure_date_text || 'As scheduled'}
👥 *Travelers:* ${inv.number_of_pax || 1} Pax
🏨 *Room(s):* ${inv.room_required || 'Standard'}
🍽️ *Food Preference:* ${inv.food_preference || 'Non Veg'}
📍 *Pickup & Drop:* ${inv.pickup_drop || 'Canning'}

💰 *FINANCIAL BREAKDOWN:*
• Total Package Amount: ₹${totalAmount.toLocaleString('en-IN')}
• GST (${inv.gst_percent || 0}%): ₹${(parseFloat(inv.gst_amount) || 0).toLocaleString('en-IN')}
• Discount: ₹${(parseFloat(inv.discount_amount) || 0).toLocaleString('en-IN')}
• *Advance Payable / Paid:* ₹${advancePayable.toLocaleString('en-IN')} ${inv.advance_note ? `(${inv.advance_note})` : ''}
• *Balance Due on Tour:* ₹${dueAmount.toLocaleString('en-IN')}

💳 *SECURE ONLINE PAYMENT LINK (UPI / Cards / NetBanking):*
👉 ${payUrl}

🏦 *DIRECT BANK / UPI TRANSFER:*
${bankDetails}

ℹ️ *Please share screenshot / transaction reference after payment.*
📞 *Helpline / WhatsApp:* +91 7029533240 / +91 6297603562
🌐 *Website:* sundarbandeltasafari.com
_Thank you for choosing Delta Safari!_`;

        navigator.clipboard.writeText(copyText).then(() => {
            setCopiedInvoiceId(inv.id);
            showMessage('success', `Payment link & booking details for #${inv.invoice_no} copied to clipboard!`);
            setTimeout(() => setCopiedInvoiceId(null), 3000);
        }).catch(() => {
            showMessage('error', 'Failed to copy to clipboard.');
        });
    };

    // Open Manual Payment Status Modal
    const handleOpenPaymentModal = async (inv) => {
        setSelectedInvoiceForPayment(inv);
        const due = parseFloat(inv.total_due_amount) || 0;
        const adv = parseFloat(inv.advance_received) || 0;
        
        let initialStatus = inv.payment_status || 'pending';
        if (!initialStatus || initialStatus === 'pending') {
            initialStatus = due <= 0 ? 'paid' : (adv > 0 ? 'partial' : 'pending');
        }

        setPaymentForm({
            payment_status: initialStatus,
            payment_method: inv.payment_method || 'UPI',
            amount_paid: due > 0 ? due : (adv > 0 ? adv : ''),
            payment_note: inv.payment_note || '',
            proof_file: inv.payment_proof_file || '',
            proof_file_name: inv.payment_proof_file ? 'Uploaded Receipt' : ''
        });
        setPaymentModalOpen(true);

        // Fetch past payment history
        if (token && inv.id) {
            setLoadingPaymentHistory(true);
            try {
                const res = await axiosGet(`${getInvoicePaymentsHistoryUrl}${inv.id}/payments`, token);
                const list = res?.payments || res?.data?.payments;
                if ((res?.status || res?.data?.status) && Array.isArray(list)) {
                    setPaymentHistory(list);
                } else {
                    setPaymentHistory([]);
                }
            } catch (e) {
                setPaymentHistory([]);
            } finally {
                setLoadingPaymentHistory(false);
            }
        }
    };

    const handleClosePaymentModal = () => {
        setSelectedInvoiceForPayment(null);
        setPaymentModalOpen(false);
        setPaymentHistory([]);
    };

    // Handle Proof File Upload
    const handleProofFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProofUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post(uploadInvoiceProofUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.data?.status && res.data?.file_url) {
                setPaymentForm(prev => ({
                    ...prev,
                    proof_file: res.data.file_url,
                    proof_file_name: res.data.file_name || file.name
                }));
                showMessage('success', 'Payment proof file uploaded successfully!');
            } else {
                showMessage('error', res.data?.msg || 'Failed to upload proof file.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error uploading proof file.');
        } finally {
            setProofUploading(false);
        }
    };

    // Submit Manual Payment Status Change
    const handleSavePaymentStatus = async (e) => {
        e.preventDefault();
        if (!selectedInvoiceForPayment) return;

        setSubmittingPaymentStatus(true);
        try {
            const url = `${updateInvoicePaymentStatusUrl}${selectedInvoiceForPayment.id}/payment-status`;
            const payload = {
                payment_status: paymentForm.payment_status,
                payment_method: paymentForm.payment_method,
                payment_note: paymentForm.payment_note,
                proof_file: paymentForm.proof_file || null,
                amount_paid: paymentForm.amount_paid !== '' && !isNaN(paymentForm.amount_paid) ? parseFloat(paymentForm.amount_paid) : null
            };

            const res = await axiosPost(url, payload, token);
            if (res?.status || res?.data?.status) {
                showMessage('success', res?.msg || res?.data?.msg || `Payment status updated to ${paymentForm.payment_status.toUpperCase()}!`);
                handleClosePaymentModal();
                fetchInvoices(currentPage);
                fetchStatsAndConfig();
            } else {
                const errorMsg = res?.msg || res?.data?.msg || (res instanceof Error ? res.message : 'Failed to update payment status.');
                showMessage('error', errorMsg);
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error saving payment status.');
        } finally {
            setSubmittingPaymentStatus(false);
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
            gst_percent: 0,
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
                    {Number(user?.admin) === 1 && (
                        <Link href="/crm/invoices/config" className="btn btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-xs">
                            <i className="ri ri-settings-4-line"></i>
                            <span>Settings</span>
                        </Link>
                    )}
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
                                <option value="pending">Pending Verification</option>
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

                <div className="table-responsive text-nowrap" style={{ minHeight: '380px' }}>
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
                                    <th className="text-center pe-4" style={{ width: '80px' }}>Action</th>
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
                                            <div className="d-flex flex-column align-items-start gap-1">
                                                {inv.payment_status === 'paid' ? (
                                                    <span className="badge bg-success rounded-pill px-2.5 py-1">
                                                        <i className="ri ri-checkbox-circle-fill me-1"></i>Paid in Full
                                                    </span>
                                                ) : inv.payment_status === 'partial' ? (
                                                    <span className="badge bg-info text-white rounded-pill px-2.5 py-1">
                                                        <i className="ri ri-pie-chart-2-fill me-1"></i>Advance Paid
                                                    </span>
                                                ) : inv.payment_status === 'pending' ? (
                                                    <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1">
                                                        <i className="ri ri-time-fill me-1"></i>Pending Verification
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-danger rounded-pill px-2.5 py-1">
                                                        <i className="ri ri-close-circle-fill me-1"></i>Unpaid / Due
                                                    </span>
                                                )}
                                                {inv.payment_method && (
                                                    <small className="text-muted fw-semibold" style={{ fontSize: '10.5px' }}>
                                                        <i className="ri ri-bank-card-line me-0.5"></i>{inv.payment_method}
                                                    </small>
                                                )}
                                                {inv.payment_proof_file && (
                                                    <a
                                                        href={inv.payment_proof_file}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="badge bg-light text-primary border text-decoration-none"
                                                        style={{ fontSize: '10px' }}
                                                        title="View Uploaded Payment Proof Receipt"
                                                    >
                                                        <i className="ri ri-attachment-line me-0.5"></i>Receipt
                                                    </a>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions Dropdown (3 dots) */}
                                        <td className="text-center pe-4" style={{ position: 'relative' }}>
                                            <div className="dropdown invoice-actions-dropdown d-inline-block position-relative">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdownId(activeDropdownId === inv.id ? null : inv.id);
                                                    }}
                                                    className={`btn btn-sm ${activeDropdownId === inv.id ? 'btn-primary text-white shadow-sm' : 'btn-light border'} rounded-circle p-0 d-inline-flex align-items-center justify-content-center`}
                                                    style={{ width: '34px', height: '34px', transition: 'all 0.2s ease' }}
                                                    title="More Actions"
                                                    aria-expanded={activeDropdownId === inv.id}
                                                >
                                                    <i className="ri ri-more-2-fill fs-5"></i>
                                                </button>

                                                {activeDropdownId === inv.id && (
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
                                                        {/* 1. View & Print */}
                                                        <li>
                                                            <button
                                                                type="button"
                                                                className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                onClick={() => {
                                                                    setActiveDropdownId(null);
                                                                    setSelectedInvoiceToPrint(inv);
                                                                    setPrintModalOpen(true);
                                                                }}
                                                            >
                                                                <span className="badge bg-primary bg-opacity-10 text-primary p-1.5 rounded-2">
                                                                    <i className="ri ri-printer-fill fs-6"></i>
                                                                </span>
                                                                <div>
                                                                    <div className="fw-semibold small text-dark">View / Print Invoice</div>
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Official printable PDF</small>
                                                                </div>
                                                            </button>
                                                        </li>

                                                        {/* 2. Copy Payment & Tour Info */}
                                                        <li>
                                                            <button
                                                                type="button"
                                                                className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                onClick={() => {
                                                                    handleCopyPaymentAndBookingDetails(inv);
                                                                }}
                                                            >
                                                                <span className="badge bg-info bg-opacity-10 text-info p-1.5 rounded-2">
                                                                    <i className={copiedInvoiceId === inv.id ? "ri ri-check-line text-success fs-6" : "ri ri-file-copy-line fs-6"}></i>
                                                                </span>
                                                                <div>
                                                                    <div className="fw-semibold small text-dark">
                                                                        {copiedInvoiceId === inv.id ? 'Copied Details!' : 'Copy Pay Info'}
                                                                    </div>
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Package details + Pay Link</small>
                                                                </div>
                                                            </button>
                                                        </li>

                                                        {/* 3. Update Payment Status */}
                                                        <li>
                                                            <button
                                                                type="button"
                                                                className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                onClick={() => {
                                                                    setActiveDropdownId(null);
                                                                    handleOpenPaymentModal(inv);
                                                                }}
                                                            >
                                                                <span className="badge bg-warning bg-opacity-15 text-dark p-1.5 rounded-2">
                                                                    <i className="ri ri-wallet-3-line fs-6"></i>
                                                                </span>
                                                                <div>
                                                                    <div className="fw-semibold small text-dark">Status / Pay</div>
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Update status, medium &amp; proof</small>
                                                                </div>
                                                            </button>
                                                        </li>

                                                        {/* 4. Auto-Settle Razorpay */}
                                                        {inv.payment_status !== 'paid' && inv.razorpay_payment_link_id && (
                                                            <li>
                                                                <button
                                                                    type="button"
                                                                    disabled={syncingPaymentId === inv.id}
                                                                    className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                    onClick={() => {
                                                                        setActiveDropdownId(null);
                                                                        handleSyncPaymentStatus(inv);
                                                                    }}
                                                                >
                                                                    <span className="badge bg-warning bg-opacity-15 text-warning-emphasis p-1.5 rounded-2">
                                                                        <i className={`ri ${syncingPaymentId === inv.id ? 'ri-loader-4-line ri-spin' : 'ri-refresh-line'} fs-6`}></i>
                                                                    </span>
                                                                    <div>
                                                                        <div className="fw-semibold small text-dark">Auto-Settle Razorpay</div>
                                                                        <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Check payment link status</small>
                                                                    </div>
                                                                </button>
                                                            </li>
                                                        )}

                                                        {/* 5. Send WhatsApp */}
                                                        <li>
                                                            <button
                                                                type="button"
                                                                className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-start"
                                                                onClick={() => {
                                                                    setActiveDropdownId(null);
                                                                    handleOpenWhatsAppModal(inv);
                                                                }}
                                                            >
                                                                <span className="badge bg-success bg-opacity-10 text-success p-1.5 rounded-2">
                                                                    <i className="ri ri-whatsapp-fill fs-6"></i>
                                                                </span>
                                                                <div>
                                                                    <div className="fw-semibold small text-dark">Send WhatsApp</div>
                                                                    <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Dispatch invoice &amp; link</small>
                                                                </div>
                                                            </button>
                                                        </li>

                                                        {/* 6. Delete Invoice (Super Admin only - Employees cannot delete) */}
                                                        {Number(user?.admin) === 1 && (
                                                            <>
                                                                <li><hr className="dropdown-divider my-1" /></li>
                                                                <li>
                                                                    <button
                                                                        type="button"
                                                                        className="dropdown-item d-flex align-items-center gap-2.5 py-2 px-3 text-danger text-start"
                                                                        onClick={() => {
                                                                            setActiveDropdownId(null);
                                                                            handleDeleteInvoice(inv.id, inv.invoice_no);
                                                                        }}
                                                                    >
                                                                        <span className="badge bg-danger bg-opacity-10 text-danger p-1.5 rounded-2">
                                                                            <i className="ri ri-delete-bin-line fs-6"></i>
                                                                        </span>
                                                                        <div>
                                                                            <div className="fw-semibold small text-danger">Delete Invoice</div>
                                                                            <small className="text-muted d-block" style={{ fontSize: '10.5px' }}>Super Admin only</small>
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
                                                    value={selectedConvertedLeadId ? String(selectedConvertedLeadId) : ''}
                                                    onChange={(e) => handleSelectConvertedLead(e.target.value)}
                                                >
                                                    <option value="">-- Choose a Converted Lead from CRM --</option>
                                                    {convertedLeads.map((c) => (
                                                        <option key={c.contact_id || c.id} value={String(c.contact_id || c.id)}>
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

                                        {/* Right: Stay, Package & Guest Details */}
                                        <div className="col-12 col-md-6">
                                            <div className="card border p-3 rounded-4 bg-white h-100 shadow-2xs">
                                                <h6 className="fw-bold text-dark mb-2 pb-1 border-bottom d-flex align-items-center gap-1.5">
                                                    <i className="ri ri-hotel-bed-line text-primary"></i>
                                                    <span>Package, Guests &amp; Room Details</span>
                                                </h6>

                                                {/* Package Selection Dropdown */}
                                                <div className="mb-2.5">
                                                    <label className="form-label small fw-semibold">
                                                        Tour Package <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select rounded-3"
                                                        value={invoiceForm.package_name}
                                                        onChange={(e) => handleInvoicePackageChange(e.target.value)}
                                                    >
                                                        <option value="">-- Choose Safari Tour Package --</option>
                                                        {packageSuggestions.map((pkg) => (
                                                            <option key={pkg.id || pkg._id || pkg.name} value={pkg.name || pkg.title}>
                                                                📦 {pkg.name || pkg.title} (₹{pkg.actual_price || pkg.base_price || pkg.price || 2700}/pax)
                                                            </option>
                                                        ))}
                                                        <option value="__custom__">➕ Custom Package (Manual Entry)</option>
                                                    </select>
                                                </div>

                                                {invoiceForm.package_name === '__custom__' && (
                                                    <div className="row g-2 mb-2.5 p-2 bg-light rounded-3 border">
                                                        <div className="col-7">
                                                            <label className="form-label small fw-semibold">Custom Package Name</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm rounded-2"
                                                                placeholder="e.g. VIP Wildlife Safari"
                                                                value={invoiceForm.custom_package_name}
                                                                onChange={(e) => handleInvoiceCustomPackageNameChange(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-5">
                                                            <label className="form-label small fw-semibold">Price / Pax (₹)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="form-control form-control-sm rounded-2 font-monospace"
                                                                placeholder="2700"
                                                                value={invoiceForm.package_price}
                                                                onChange={(e) => handleInvoiceCustomPackagePriceChange(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Member Breakdown: Adults, Children, Infants */}
                                                <div className="mb-3 p-2.5 bg-light rounded-3 border">
                                                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                                                        <label className="form-label small fw-bold text-dark mb-0">
                                                            <i className="ri ri-group-line text-primary me-1"></i>
                                                            Passenger Breakdown
                                                        </label>
                                                        <span className="badge bg-primary text-white rounded-pill px-2 py-0.5" style={{ fontSize: '11px' }}>
                                                            Total: {invoiceForm.number_of_pax} Pax
                                                        </span>
                                                    </div>
                                                    <div className="row g-2">
                                                        <div className="col-4">
                                                            <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: '11px' }}>
                                                                Adults (12+ yrs)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="form-control form-control-sm rounded-2 text-center fw-bold"
                                                                value={invoiceForm.adults}
                                                                onChange={(e) => handleInvoiceAdultsChange(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-4">
                                                            <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: '11px' }}>
                                                                Children (5-11 yrs)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="form-control form-control-sm rounded-2 text-center fw-bold"
                                                                value={invoiceForm.children}
                                                                onChange={(e) => handleInvoiceChildrenChange(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-4">
                                                            <label className="form-label small fw-semibold text-success mb-1 d-flex align-items-center justify-content-between" style={{ fontSize: '11px' }}>
                                                                <span>Infants (&lt;5 yrs)</span>
                                                                <span className="badge bg-success text-white px-1 py-0" style={{ fontSize: '9px' }}>FREE</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="form-control form-control-sm rounded-2 text-center fw-bold border-success"
                                                                value={invoiceForm.infants}
                                                                onChange={(e) => handleInvoiceInfantsChange(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center mt-1.5">
                                                        <small className="text-success fw-semibold" style={{ fontSize: '11px' }}>
                                                            <i className="ri ri-checkbox-circle-fill me-1"></i>
                                                            Infants are ₹0 (free &amp; excluded from billing calculation)
                                                        </small>
                                                        <small className="text-muted" style={{ fontSize: '11px' }}>
                                                            Billable: {Math.max(1, (parseInt(invoiceForm.adults, 10) || 0) + (parseInt(invoiceForm.children, 10) || 0))} Pax
                                                        </small>
                                                    </div>
                                                </div>

                                                {/* Step-by-Step Rooms Configuration (One by One) */}
                                                <div className="mb-3 p-2.5 bg-light rounded-3 border">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <label className="form-label small fw-bold text-dark mb-0">
                                                            <i className="ri ri-hotel-bed-line text-primary me-1"></i>
                                                            Rooms Configuration ({invoiceForm.rooms?.length || 1})
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={handleInvoiceAddRoom}
                                                            className="btn btn-xs btn-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-xs"
                                                            style={{ fontSize: '11px', backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                                        >
                                                            <i className="ri ri-add-line"></i>
                                                            <span>+ Add Room</span>
                                                        </button>
                                                    </div>

                                                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        {(invoiceForm.rooms || []).map((rm, rIdx) => (
                                                            <div key={rm.id || rIdx} className="p-2 bg-white rounded-3 border shadow-2xs">
                                                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                                    <span className="badge bg-dark text-white rounded-pill px-2 py-0.5" style={{ fontSize: '11px' }}>
                                                                        Room #{rIdx + 1}
                                                                    </span>

                                                                    {/* AC / Non-AC Tab Selector */}
                                                                    <div className="btn-group btn-group-sm" role="group">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleInvoiceRoomChange(rIdx, { type: 'non_ac', extra_charge: 0 })}
                                                                            className={`btn btn-xs rounded-start-pill px-2.5 ${rm.type === 'non_ac' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
                                                                            style={{ fontSize: '11px' }}
                                                                        >
                                                                            Non-AC
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleInvoiceRoomChange(rIdx, { type: 'ac', extra_charge: rm.extra_charge || 0 })}
                                                                            className={`btn btn-xs rounded-end-pill px-2.5 ${rm.type === 'ac' ? 'btn-primary text-white' : 'btn-outline-primary'}`}
                                                                            style={{ fontSize: '11px', backgroundColor: rm.type === 'ac' ? '#0066cc' : '', borderColor: '#0066cc' }}
                                                                        >
                                                                            ❄️ AC Room
                                                                        </button>
                                                                    </div>

                                                                    {/* Remove Room Button */}
                                                                    {(invoiceForm.rooms || []).length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleInvoiceRemoveRoom(rIdx)}
                                                                            className="btn btn-xs btn-outline-danger rounded-circle p-1"
                                                                            title="Remove this room"
                                                                            style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        >
                                                                            <i className="ri ri-delete-bin-line" style={{ fontSize: '12px' }}></i>
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Extra AC Charge Input when AC is chosen */}
                                                                {rm.type === 'ac' && (
                                                                    <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between gap-2">
                                                                        <label className="form-label small text-muted mb-0 fw-semibold" style={{ fontSize: '11px' }}>
                                                                            <i className="ri ri-money-dollar-circle-line text-success me-1"></i>
                                                                            Extra AC Charge (₹):
                                                                        </label>
                                                                        <div className="input-group input-group-sm" style={{ maxWidth: '140px' }}>
                                                                            <span className="input-group-text bg-light border-end-0 py-0 px-2 small">₹</span>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                className="form-control form-control-sm text-end fw-bold font-monospace"
                                                                                placeholder="0"
                                                                                value={rm.extra_charge}
                                                                                onChange={(e) => handleInvoiceRoomChange(rIdx, { extra_charge: e.target.value })}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <small className="text-muted d-block mt-1.5" style={{ fontSize: '11px' }}>
                                                        Summary: <strong className="text-dark">{invoiceForm.room_required}</strong>
                                                    </small>
                                                </div>

                                                {/* Customer Email & Food Preference */}
                                                <div className="row g-2">
                                                    <div className="col-6">
                                                        <label className="form-label small fw-semibold">Food Preference</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm rounded-3"
                                                            placeholder="Non Veg, Veg, Jain"
                                                            value={invoiceForm.food_preference}
                                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, food_preference: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-6">
                                                        <label className="form-label small fw-semibold">Customer Email</label>
                                                        <input
                                                            type="email"
                                                            className="form-control form-control-sm rounded-3 font-monospace"
                                                            placeholder="customer@email.com"
                                                            value={invoiceForm.customer_email}
                                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_email: e.target.value })}
                                                        />
                                                    </div>
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

                                    {/* WhatsApp & Razorpay Automation Option */}
                                    <div className="card border p-3 rounded-4 bg-light mb-4 shadow-2xs">
                                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-1 border-bottom">
                                            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                                                <i className="ri ri-whatsapp-fill text-success fs-5"></i>
                                                <span>WhatsApp Delivery &amp; Razorpay Payment Link</span>
                                            </h6>
                                            <span className="badge bg-success text-white rounded-pill px-2.5 py-0.5" style={{ fontSize: '11px' }}>
                                                Instant Automation
                                            </span>
                                        </div>

                                        <div className="form-check form-switch mb-2.5">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="sendWhatsAppCheckbox"
                                                checked={invoiceForm.send_whatsapp}
                                                onChange={(e) => setInvoiceForm({ ...invoiceForm, send_whatsapp: e.target.checked })}
                                            />
                                            <label className="form-check-label small fw-bold text-dark" htmlFor="sendWhatsAppCheckbox">
                                                Deliver official invoice details &amp; Razorpay payment link to customer's WhatsApp immediately
                                            </label>
                                        </div>

                                        {invoiceForm.send_whatsapp && (
                                            <div className="row g-2">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small fw-semibold">Choose WhatsApp Template</label>
                                                    <select
                                                        className="form-select form-select-sm rounded-3"
                                                        value={invoiceForm.template_id}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, template_id: e.target.value })}
                                                    >
                                                        {templates.map((tmpl) => (
                                                            <option key={tmpl.id} value={tmpl.id}>
                                                                💬 {tmpl.name} {tmpl.is_default === 1 ? '(Default)' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-12 col-md-6 d-flex align-items-end">
                                                    <small className="text-muted" style={{ fontSize: '11px' }}>
                                                        <i className="ri ri-information-line me-1 text-primary"></i>
                                                        Replaces <code>&#123;&#123;package_name&#125;&#125;</code>, <code>&#123;&#123;departure_date&#125;&#125;</code>, <code>&#123;&#123;total_amount&#125;&#125;</code>, and generates an encrypted <code>&#123;&#123;payment_link&#125;&#125;</code>.
                                                    </small>
                                                </div>
                                            </div>
                                        )}
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
                                                <span>Generating Invoice &amp; Payment Link...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-printer-fill"></i>
                                                <span>Generate &amp; Deliver Invoice</span>
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
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPrintModalOpen(false);
                                            handleOpenWhatsAppModal(selectedInvoiceToPrint);
                                        }}
                                        className="btn btn-success btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                                    >
                                        <i className="ri ri-whatsapp-fill"></i>
                                        <span>Send WhatsApp with Payment Link</span>
                                    </button>
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

            {/* 7. WHATSAPP DISPATCH & PAYMENT LINK MODAL */}
            {whatsappModalOpen && selectedInvoiceForWhatsApp && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1070 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="modal-header text-white py-3 px-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#075E54' }}>
                                <div>
                                    <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-whatsapp-fill"></i>
                                        <span>Deliver WhatsApp Invoice &amp; Razorpay Link</span>
                                    </h5>
                                    <small className="text-white-50">
                                        To: <strong>{selectedInvoiceForWhatsApp.customer_name}</strong> (+{selectedInvoiceForWhatsApp.customer_phone})
                                    </small>
                                </div>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setWhatsappModalOpen(false)} aria-label="Close"></button>
                            </div>

                            <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                                {/* Template Selector */}
                                <div className="mb-3 p-3 bg-light rounded-4 border">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="form-label small fw-bold text-dark mb-0">
                                            Select WhatsApp Template:
                                        </label>
                                        <Link href="/crm/invoices/config" className="small text-primary fw-semibold" target="_blank">
                                            Manage Templates <i className="ri ri-external-link-line"></i>
                                        </Link>
                                    </div>
                                    <select
                                        className="form-select rounded-3"
                                        value={selectedTemplateId}
                                        onChange={(e) => handleTemplateSelectInModal(e.target.value)}
                                    >
                                        {templates.map((tmpl) => (
                                            <option key={tmpl.id} value={tmpl.id}>
                                                💬 {tmpl.name} ({tmpl.title || tmpl.category})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Message Content Editor */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark">
                                        Personalized Message Text (Includes Package details, Dates, Due Amount &amp; Razorpay link):
                                    </label>
                                    <textarea
                                        className="form-control rounded-3 font-monospace p-3"
                                        rows="10"
                                        value={customWhatsAppMessage}
                                        onChange={(e) => setCustomWhatsAppMessage(e.target.value)}
                                        style={{ fontSize: '13px', lineHeight: '1.5' }}
                                    ></textarea>
                                </div>

                                {/* Razorpay Link Pill */}
                                <div className="p-3 rounded-4 bg-light border d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="ri ri-secure-payment-fill text-success fs-4"></i>
                                        <div>
                                            <span className="fw-bold text-dark small d-block">Razorpay Secure Payment Link</span>
                                            <small className="text-muted font-monospace">
                                                {selectedInvoiceForWhatsApp.razorpay_payment_url || 'Auto-generated dynamic URL'}
                                            </small>
                                        </div>
                                    </div>
                                    {selectedInvoiceForWhatsApp.razorpay_payment_url && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedInvoiceForWhatsApp.razorpay_payment_url);
                                                showMessage('success', 'Payment Link copied to clipboard!');
                                            }}
                                            className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1"
                                        >
                                            <i className="ri ri-file-copy-line me-1"></i> Copy Link
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between align-items-center">
                                <button type="button" className="btn btn-outline-secondary rounded-pill px-3" onClick={() => setWhatsappModalOpen(false)}>
                                    Cancel
                                </button>
                                <div className="d-flex gap-2">
                                    <a
                                        href={`https://wa.me/${selectedInvoiceForWhatsApp.customer_phone}?text=${encodeURIComponent(customWhatsAppMessage)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-outline-success rounded-pill px-3 d-inline-flex align-items-center gap-1.5"
                                    >
                                        <i className="ri ri-external-link-line"></i>
                                        <span>Open in WhatsApp Web</span>
                                    </a>
                                    <button
                                        type="button"
                                        disabled={sendingWhatsApp}
                                        onClick={handleSendWhatsAppMessage}
                                        className="btn btn-success rounded-pill px-4 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                                    >
                                        {sendingWhatsApp ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Sending Message...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-send-plane-fill"></i>
                                                <span>🚀 Deliver WhatsApp Now</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 8. MANUAL PAYMENT STATUS & VERIFICATION MODAL             */}
            {/* ========================================================= */}
            {paymentModalOpen && selectedInvoiceForPayment && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Header */}
                            <div className="modal-header bg-dark text-white py-3 px-4 border-0">
                                <div>
                                    <h5 className="modal-title fw-bold mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-wallet-3-line text-warning"></i>
                                        <span>Update Payment Status &amp; Verification</span>
                                    </h5>
                                    <small className="text-muted">
                                        Invoice #{selectedInvoiceForPayment.invoice_no} &bull; Client: {selectedInvoiceForPayment.customer_name} ({selectedInvoiceForPayment.customer_phone})
                                    </small>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={handleClosePaymentModal}
                                    aria-label="Close"
                                ></button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSavePaymentStatus}>
                                <div className="modal-body p-4">
                                    {/* Financial Overview Card */}
                                    <div className="card bg-light border-0 rounded-3 p-3 mb-4">
                                        <div className="row g-2 text-center text-md-start">
                                            <div className="col-6 col-md-3">
                                                <span className="text-muted small">Total Package Cost:</span>
                                                <div className="fw-bold fs-6">
                                                    {formatCurrency(
                                                        (parseFloat(selectedInvoiceForPayment.subtotal) || 0) +
                                                        (parseFloat(selectedInvoiceForPayment.gst_amount) || 0) -
                                                        (parseFloat(selectedInvoiceForPayment.discount_amount) || 0)
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <span className="text-muted small">Advance Received:</span>
                                                <div className="fw-bold text-success fs-6">
                                                    {formatCurrency(selectedInvoiceForPayment.advance_received)}
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <span className="text-muted small">Current Balance Due:</span>
                                                <div className="fw-bold text-danger fs-6">
                                                    {formatCurrency(selectedInvoiceForPayment.total_due_amount)}
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <span className="text-muted small">Current Status:</span>
                                                <div>
                                                    {selectedInvoiceForPayment.payment_status === 'paid' ? (
                                                        <span className="badge bg-success rounded-pill px-2 py-0.5">Paid in Full</span>
                                                    ) : selectedInvoiceForPayment.payment_status === 'partial' ? (
                                                        <span className="badge bg-info text-white rounded-pill px-2 py-0.5">Advance Paid</span>
                                                    ) : selectedInvoiceForPayment.payment_status === 'pending' ? (
                                                        <span className="badge bg-warning text-dark rounded-pill px-2 py-0.5">Pending</span>
                                                    ) : (
                                                        <span className="badge bg-danger rounded-pill px-2 py-0.5">Unpaid</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Status Selection */}
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-dark">
                                            Target Payment Status <span className="text-danger">*</span>
                                        </label>
                                        <div className="row g-2">
                                            {[
                                                { key: 'paid', label: 'Paid in Full (Settled)', desc: 'Mark entire balance due as paid', color: 'success' },
                                                { key: 'partial', label: 'Partial Payment', desc: 'Advance received, balance remaining', color: 'info' },
                                                { key: 'pending', label: 'Pending Verification', desc: 'Initial invoice status awaiting verification', color: 'warning' },
                                                { key: 'unpaid', label: 'Unpaid / Due', desc: 'Payment not yet received', color: 'danger' }
                                            ].map(st => (
                                                <div key={st.key} className="col-12 col-sm-6">
                                                    <div
                                                        onClick={() => {
                                                            setPaymentForm(prev => ({
                                                                ...prev,
                                                                payment_status: st.key,
                                                                amount_paid: st.key === 'paid' 
                                                                    ? (parseFloat(selectedInvoiceForPayment.total_due_amount) || '')
                                                                    : prev.amount_paid
                                                            }));
                                                        }}
                                                        className={`p-2.5 rounded-3 border cursor-pointer transition-all ${
                                                            paymentForm.payment_status === st.key
                                                                ? `border-${st.color} bg-${st.color} bg-opacity-10 shadow-xs`
                                                                : 'border-secondary-subtle bg-white hover-light'
                                                        }`}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="d-flex align-items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name="target_status"
                                                                checked={paymentForm.payment_status === st.key}
                                                                onChange={() => {}}
                                                                className="form-check-input mt-0"
                                                            />
                                                            <div>
                                                                <div className="fw-semibold small text-dark">{st.label}</div>
                                                                <small className="text-muted" style={{ fontSize: '11px' }}>{st.desc}</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        {/* Amount Paid Now */}
                                        <div className="col-12 col-sm-6">
                                            <label className="form-label small fw-semibold text-dark">
                                                Amount Received / Collected (₹)
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light">₹</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="e.g. 5000"
                                                    value={paymentForm.amount_paid}
                                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount_paid: e.target.value }))}
                                                />
                                            </div>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>
                                                {paymentForm.payment_status === 'paid' ? 'Full balance due will be cleared' : 'Amount to add to collected advance'}
                                            </small>
                                        </div>

                                        {/* Payment Medium / Method */}
                                        <div className="col-12 col-sm-6">
                                            <label className="form-label small fw-semibold text-dark">
                                                Medium of Payment <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                value={paymentForm.payment_method}
                                                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                                                required
                                            >
                                                <option value="UPI">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                                                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                                                <option value="Cash">Cash Handover</option>
                                                <option value="Cheque">Cheque / Demand Draft</option>
                                                <option value="Card / POS">Card / POS Swipe</option>
                                                <option value="Razorpay">Razorpay Online Link</option>
                                                <option value="Other">Other / Offline</option>
                                            </select>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>Channel used by client to transfer funds</small>
                                        </div>
                                    </div>

                                    {/* Payment Note / Transaction ID */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-dark">
                                            Payment Note / Transaction Reference / UTR Number
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. UTR #423019284912, SBI transfer received by employee"
                                            value={paymentForm.payment_note}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_note: e.target.value }))}
                                        />
                                    </div>

                                    {/* File Upload (Receipt, screenshot, bank transfer slip, PDF) */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-dark">
                                            Payment Proof Attachment (Screenshot / Bank Slip / PDF)
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="image/*,.pdf"
                                                onChange={handleProofFileUpload}
                                                disabled={proofUploading}
                                            />
                                            {proofUploading && (
                                                <span className="input-group-text bg-light text-primary">
                                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                                    Uploading...
                                                </span>
                                            )}
                                        </div>
                                        {paymentForm.proof_file && (
                                            <div className="mt-1.5 d-flex align-items-center gap-2">
                                                <span className="badge bg-success-subtle text-success border border-success-subtle">
                                                    <i className="ri ri-check-line me-1"></i>
                                                    Proof Attached: {paymentForm.proof_file_name || 'File Attached'}
                                                </span>
                                                <a
                                                    href={paymentForm.proof_file}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="small text-primary text-decoration-underline"
                                                >
                                                    View Attachment
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Audit / Previous Payment History */}
                                    {paymentHistory && paymentHistory.length > 0 && (
                                        <div className="mt-4 pt-3 border-top">
                                            <h6 className="fw-bold small text-muted text-uppercase mb-2 d-flex align-items-center gap-1">
                                                <i className="ri ri-history-line text-primary"></i>
                                                <span>Payment Audit Trail ({paymentHistory.length})</span>
                                            </h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '11.5px' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Date &amp; Time</th>
                                                            <th>Status</th>
                                                            <th>Medium</th>
                                                            <th>Amount</th>
                                                            <th>Note</th>
                                                            <th>Recorded By</th>
                                                            <th>Proof</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paymentHistory.map((ph, phIdx) => (
                                                            <tr key={ph.id || phIdx}>
                                                                <td>{formatDate(ph.created_at)}</td>
                                                                <td>
                                                                    <span className={`badge ${ph.payment_status === 'paid' ? 'bg-success' : ph.payment_status === 'partial' ? 'bg-info' : ph.payment_status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'} rounded-pill px-2 py-0.5`}>
                                                                        {ph.payment_status?.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                                <td className="fw-semibold">{ph.payment_method || '—'}</td>
                                                                <td className="text-success fw-bold">{formatCurrency(ph.amount)}</td>
                                                                <td className="text-truncate" style={{ maxWidth: '140px' }}>{ph.payment_note || '—'}</td>
                                                                <td>{ph.recorded_by_name || 'System'}</td>
                                                                <td>
                                                                    {ph.proof_file ? (
                                                                        <a href={ph.proof_file} target="_blank" rel="noreferrer" className="text-primary fw-bold">
                                                                            <i className="ri ri-attachment-line"></i> View
                                                                        </a>
                                                                    ) : (
                                                                        '—'
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary rounded-pill px-3"
                                        onClick={handleClosePaymentModal}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingPaymentStatus || proofUploading}
                                        className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    >
                                        {submittingPaymentStatus ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Updating Status...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-checkbox-circle-fill"></i>
                                                <span>Save &amp; Update Status</span>
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
