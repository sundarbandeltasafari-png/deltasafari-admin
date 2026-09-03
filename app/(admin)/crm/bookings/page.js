"use client"

import { Suspense, useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useSelector } from "react-redux"
import { 
    getAllBookingsUrl, 
    getCombinedBookingsUrl, 
    updateBookingUrl 
} from "@/app/routes/serviceRoutes"
import { getFollowupsListUrl } from "@/app/routes/whatsappRoutes"
import { axiosGet, axiosPost } from "@/libs/axiosHelper"
import { showMessage } from "@/libs/commonHelper"
import LoadingComponent from "@/components/common/LoadingComponent"
import NotFound from "@/components/common/NotFound"
import { 
    unifyBookings, 
    normalizeDateStr, 
    formatDisplayDate 
} from "@/libs/bookingHelper"

function CrmBookingsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlDate = searchParams?.get('date') || '';

    const [bookingsData, setBookingsData] = useState({
        all: [],
        reservations: [],
        convertedLeads: [],
        stats: {
            totalCombinedCount: 0,
            totalReservationsCount: 0,
            totalConvertedLeadsCount: 0,
            totalCombinedRevenue: 0,
            totalReservationsRevenue: 0,
            totalConvertedLeadsRevenue: 0
        }
    });

    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [sourceFilter, setSourceFilter] = useState("ALL"); // 'ALL', 'RESERVATIONS', 'LEADS'
    const [dateFilter, setDateFilter] = useState(urlDate);
    const [dateTypeFilter, setDateTypeFilter] = useState("travel"); // 'travel', 'booking', 'any'
    const [statusFilter, setStatusFilter] = useState("All");
    const [paymentFilter, setPaymentFilter] = useState("All");

    // Modals
    const [selectedBooking, setSelectedBooking] = useState(null); // Reservation details modal
    const [selectedLead, setSelectedLead] = useState(null);       // Manual Lead details modal
    const [invoiceBooking, setInvoiceBooking] = useState(null);   // Printable Invoice modal
    const [confirmModalData, setConfirmModalData] = useState(null); // Confirm pending reservation modal
    const [processingBookingId, setProcessingBookingId] = useState(null);

    const token = useSelector((state) => state.adminAuth?.token);

    // Sync URL date parameter when changed externally
    useEffect(() => {
        if (urlDate) {
            setDateFilter(urlDate);
        }
    }, [urlDate]);

    // Fetch all bookings: both online reservations and manual converted leads
    const fetchAllBookings = async () => {
        if (!token) return;
        setLoading(true);

        try {
            // 1. Try unified combined bookings API
            let combinedRes = null;
            try {
                combinedRes = await axiosGet(getCombinedBookingsUrl, token);
            } catch (cErr) {
                console.warn("getCombinedBookings API not ready, falling back to parallel fetch:", cErr?.message);
            }

            if (combinedRes?.status && (combinedRes.reservations || combinedRes.converted_leads)) {
                const unified = unifyBookings(combinedRes.reservations || [], combinedRes.converted_leads || []);
                setBookingsData(unified);
                setLoading(false);
                return;
            }

            // 2. Fallback: Fetch reservations and converted leads in parallel
            const [resResult, leadResult] = await Promise.allSettled([
                axiosGet(getAllBookingsUrl, token),
                axiosGet(`${getFollowupsListUrl}?is_converted=true&limit=1000`, token)
            ]);

            const rawReservations = resResult.status === 'fulfilled' && Array.isArray(resResult.value?.bookings)
                ? resResult.value.bookings
                : [];

            const rawLeads = leadResult.status === 'fulfilled' && Array.isArray(leadResult.value?.followups)
                ? leadResult.value.followups.filter(f => f.is_converted == 1)
                : [];

            const unified = unifyBookings(rawReservations, rawLeads);
            setBookingsData(unified);
        } catch (err) {
            console.error("Failed to load bookings from server:", err);
            setBookingsData(unifyBookings([], []));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchAllBookings();
        }
    }, [token]);

    // Helper for safe travel date formatting
    const safeFormatDate = (dateString) => {
        if (!dateString) return "N/A";
        return formatDisplayDate(dateString);
    };

    // Filter unified bookings
    const filteredBookings = useMemo(() => {
        if (!bookingsData?.all) return [];

        return bookingsData.all.filter((item) => {
            // 1. Source Filter (All / Reservations / Manual Leads)
            if (sourceFilter === 'RESERVATIONS' && item.source_type !== 'RESERVATION') return false;
            if (sourceFilter === 'LEADS' && item.source_type !== 'MANUAL_LEAD') return false;

            // 2. Date Filter
            if (dateFilter) {
                const targetDate = dateFilter.trim();
                const travelDate = item.travel_date || '';
                const bookingDate = item.booking_date || '';
                const effectiveDate = item.effective_date || '';

                if (dateTypeFilter === 'travel') {
                    if (travelDate !== targetDate && effectiveDate !== targetDate) return false;
                } else if (dateTypeFilter === 'booking') {
                    if (bookingDate !== targetDate) return false;
                } else {
                    if (travelDate !== targetDate && bookingDate !== targetDate && effectiveDate !== targetDate) return false;
                }
            }

            // 3. Search Term
            if (searchTerm.trim()) {
                const query = searchTerm.toLowerCase();
                const name = (item.customer_name || '').toLowerCase();
                const phone = (item.customer_phone || '').toLowerCase();
                const email = (item.customer_email || '').toLowerCase();
                const pkg = (item.package_title || '').toLowerCase();
                const dest = (item.travel_destination || '').toLowerCase();
                const dispId = String(item.display_id || '').toLowerCase();
                const inv = (item.invoice_number || '').toLowerCase();
                const notes = (item.notes || '').toLowerCase();
                const agent = (item.agent_name || '').toLowerCase();

                const matchesSearch = 
                    name.includes(query) ||
                    phone.includes(query) ||
                    email.includes(query) ||
                    pkg.includes(query) ||
                    dest.includes(query) ||
                    dispId.includes(query) ||
                    inv.includes(query) ||
                    notes.includes(query) ||
                    agent.includes(query);

                if (!matchesSearch) return false;
            }

            // 4. Status Filter
            if (statusFilter !== 'All') {
                if (statusFilter === '2' && !item.is_confirmed) return false;
                if (statusFilter === '1' && String(item.booking_status) !== '1') return false;
                if (statusFilter === '0' && String(item.booking_status) !== '0') return false;
            }

            // 5. Payment Filter
            if (paymentFilter !== 'All') {
                if (paymentFilter === 'PAID' && !item.is_paid) return false;
                if (paymentFilter === 'PENDING' && item.is_paid) return false;
            }

            return true;
        });
    }, [bookingsData, sourceFilter, dateFilter, dateTypeFilter, searchTerm, statusFilter, paymentFilter]);

    // Calculate dynamic totals for the current filtered list
    const filteredTotalRevenue = useMemo(() => {
        return filteredBookings.reduce((sum, b) => sum + (b.total_cost || 0), 0);
    }, [filteredBookings]);

    // Render status badge
    const getBookingStatusBadge = (item) => {
        if (item.source_type === 'MANUAL_LEAD') {
            return (
                <span className="badge rounded-pill bg-success d-inline-flex align-items-center gap-1 px-3 py-1.5 shadow-2xs">
                    <i className="ri ri-checkbox-circle-fill"></i> Converted &amp; Won
                </span>
            );
        }

        const statusStr = String(item.booking_status);
        if (statusStr === '2') {
            return (
                <span className="badge rounded-pill bg-success d-inline-flex align-items-center gap-1 px-3 py-1.5 shadow-2xs">
                    <i className="ri ri-checkbox-circle-fill"></i> Confirmed &amp; Booked
                </span>
            );
        } else if (statusStr === '1') {
            return (
                <span className="badge rounded-pill bg-warning text-dark d-inline-flex align-items-center gap-1 px-3 py-1.5 shadow-2xs">
                    <i className="ri ri-time-fill"></i> Pending Review
                </span>
            );
        } else {
            return (
                <span className="badge rounded-pill bg-danger d-inline-flex align-items-center gap-1 px-3 py-1.5 shadow-2xs">
                    <i className="ri ri-close-circle-fill"></i> Cancelled
                </span>
            );
        }
    };

    // Render payment badge
    const getPaymentBadge = (item) => {
        if (item.is_paid) {
            return (
                <div className="d-flex flex-column">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 fw-bold rounded-pill px-2.5 py-1">
                        <i className="ri ri-check-double-line me-1"></i> {item.source_type === 'MANUAL_LEAD' ? 'PAID (Agreed Deal)' : 'PAID (Razorpay)'}
                    </span>
                    {item.raw?.razorpay_payment_id && (
                        <small className="text-muted font-monospace mt-1" style={{ fontSize: '10px' }} title={item.raw.razorpay_payment_id}>
                            {item.raw.razorpay_payment_id.slice(0, 14)}...
                        </small>
                    )}
                </div>
            );
        } else {
            const isEnquiry = item.raw?.booking_type === 'ENQUIRY_FORM' || item.raw?.payment_method === 'INQUIRY';
            return (
                <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 rounded-pill px-2.5 py-1">
                    <i className="ri ri-time-line me-1"></i> {isEnquiry ? 'Enquiry (Pending)' : 'Unpaid / Pending'}
                </span>
            );
        }
    };

    const getParsedList = (listStr) => {
        if (!listStr) return [];
        try {
            return typeof listStr === 'string' ? JSON.parse(listStr) : listStr;
        } catch (e) {
            return [];
        }
    };

    // Handle Mark as Booked Execution for pending reservation
    const handleConfirmMarkAsBooked = async () => {
        if (!confirmModalData) return;
        const b = confirmModalData;
        const targetId = b.bookings_id || b.id || b.booking_id;
        setProcessingBookingId(targetId);

        try {
            const payload = {
                id: targetId,
                booking_status: 2,
                payment_status: 'PAID',
                action: 'mark_booked'
            };
            const res = await axiosPost(updateBookingUrl, payload, token);
            if (res.status) {
                showMessage("success", "Booking marked as Booked & Payment Settled! Commission credited to wallet.");
                setConfirmModalData(null);
                if (selectedBooking && (selectedBooking.id === targetId || selectedBooking.bookings_id === targetId || selectedBooking.booking_id === targetId)) {
                    setSelectedBooking(null);
                }
                fetchAllBookings();
            } else {
                showMessage("error", res.msg || "Failed to update booking status.");
            }
        } catch (err) {
            showMessage("error", err.message || "Failed to communicate with server.");
        } finally {
            setProcessingBookingId(null);
        }
    };

    // Clear date filter
    const handleClearDateFilter = () => {
        setDateFilter('');
        router.replace('/crm/bookings');
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y" style={{ zIndex: selectedBooking || selectedLead || confirmModalData || invoiceBooking ? 5555 : 1 }}>
            
            {/* 1. Page Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-ticket-2-fill text-primary fs-3"></i>
                        <span>CRM Bookings &amp; Won Deals</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Unified CRM booking registry combining online Razorpay reservations, B2B agent bookings, and WhatsApp converted leads.
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <Link href="/crm/calendar" className="btn btn-outline-danger d-flex align-items-center gap-2 rounded-pill px-3 shadow-xs">
                        <i className="ri ri-calendar-event-line"></i> Booking Calendar
                    </Link>
                    <Link href="/crm/converted" className="btn btn-outline-success d-flex align-items-center gap-2 rounded-pill px-3 shadow-xs">
                        <i className="ri ri-trophy-line"></i> Converted Leads
                    </Link>
                    <Link href="/crm/followups" className="btn btn-outline-warning d-flex align-items-center gap-2 rounded-pill px-3 shadow-xs">
                        <i className="ri ri-calendar-check-line"></i> Follow-ups
                    </Link>
                    <button 
                        type="button" 
                        className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm" 
                        onClick={fetchAllBookings}
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri ri-refresh-line"></i> Refresh
                    </button>
                </div>
            </div>

            {/* 2. Top KPI Cards */}
            <div className="row g-3 mb-4">
                {/* Total Combined */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-primary">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Total Bookings</span>
                                <h3 className="fw-bold text-dark mb-0">{bookingsData.stats.totalCombinedCount || 0}</h3>
                                <small className="text-primary fw-semibold mt-1 d-block">
                                    ₹{bookingsData.stats.totalCombinedRevenue.toLocaleString('en-IN')} Total
                                </small>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 rounded-circle p-3 text-primary">
                                <i className="ri ri-ticket-2-fill fs-3"></i>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Package Reservations */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-info">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Package Reservations</span>
                                <h3 className="fw-bold text-info mb-0">{bookingsData.stats.totalReservationsCount || 0}</h3>
                                <small className="text-muted mt-1 d-block">
                                    ₹{bookingsData.stats.totalReservationsRevenue.toLocaleString('en-IN')} (Online / B2B)
                                </small>
                            </div>
                            <span className="badge bg-info bg-opacity-10 rounded-circle p-3 text-info">
                                <i className="ri ri-global-line fs-3"></i>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Manual CRM Converted Leads */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-success">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Manual Converted Leads</span>
                                <h3 className="fw-bold text-success mb-0">{bookingsData.stats.totalConvertedLeadsCount || 0}</h3>
                                <small className="text-success fw-semibold mt-1 d-block">
                                    ₹{bookingsData.stats.totalConvertedLeadsRevenue.toLocaleString('en-IN')} Won Deals
                                </small>
                            </div>
                            <span className="badge bg-success bg-opacity-10 rounded-circle p-3 text-success">
                                <i className="ri ri-trophy-fill fs-3"></i>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Current Active Filter Results */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-light h-100 border">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Current Filter View</span>
                                <h3 className="fw-bold text-dark mb-0">{filteredBookings.length}</h3>
                                <small className="text-secondary mt-1 d-block">
                                    ₹{filteredTotalRevenue.toLocaleString('en-IN')} in View
                                </small>
                            </div>
                            <span className="badge bg-secondary bg-opacity-10 rounded-circle p-3 text-secondary">
                                <i className="ri ri-filter-3-line fs-3"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Active Date Filter Notice Banner */}
            {dateFilter && (
                <div className="alert alert-primary d-flex align-items-center justify-content-between rounded-4 p-3 mb-4 shadow-sm border-0 flex-wrap gap-2" style={{ backgroundColor: '#eff6ff' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                            <i className="ri ri-calendar-check-fill fs-4"></i>
                        </div>
                        <div>
                            <strong className="d-block text-dark fs-6">
                                📅 Filtered by Day: {formatDisplayDate(dateFilter, true)}
                            </strong>
                            <span className="small text-muted">
                                Showing <strong>{filteredBookings.length}</strong> booking(s) scheduled on this day ({dateFilter}) from calendar navigation.
                            </span>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <Link href="/crm/calendar" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
                            <i className="ri ri-arrow-left-line me-1"></i> Return to Calendar
                        </Link>
                        <button
                            type="button"
                            className="btn btn-sm btn-primary rounded-pill px-3 shadow-xs"
                            onClick={handleClearDateFilter}
                        >
                            <i className="ri ri-close-circle-line me-1"></i> Clear Date (Show All)
                        </button>
                    </div>
                </div>
            )}

            {/* 4. Main Card with Search, Source Tabs & Filters */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                
                {/* Source Navigation Tabs */}
                <div className="card-header border-bottom bg-white p-3 px-4 pb-0">
                    <ul className="nav nav-tabs card-header-tabs border-bottom-0 gap-2">
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link rounded-top-3 px-4 py-2.5 fw-bold d-flex align-items-center gap-2 border-0 ${sourceFilter === 'ALL' ? 'active bg-primary text-white shadow-xs' : 'text-muted'}`}
                                onClick={() => setSourceFilter('ALL')}
                            >
                                <i className="ri ri-apps-2-fill"></i>
                                <span>All Bookings ({bookingsData.stats.totalCombinedCount || 0})</span>
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link rounded-top-3 px-4 py-2.5 fw-bold d-flex align-items-center gap-2 border-0 ${sourceFilter === 'RESERVATIONS' ? 'active bg-primary text-white shadow-xs' : 'text-muted'}`}
                                onClick={() => setSourceFilter('RESERVATIONS')}
                            >
                                <i className="ri ri-global-line"></i>
                                <span>Package Reservations ({bookingsData.stats.totalReservationsCount || 0})</span>
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link rounded-top-3 px-4 py-2.5 fw-bold d-flex align-items-center gap-2 border-0 ${sourceFilter === 'LEADS' ? 'active bg-primary text-white shadow-xs' : 'text-muted'}`}
                                onClick={() => setSourceFilter('LEADS')}
                            >
                                <i className="ri ri-trophy-fill text-warning"></i>
                                <span>Manual Lead Conversions ({bookingsData.stats.totalConvertedLeadsCount || 0})</span>
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Filter Toolbar */}
                <div className="card-body p-4 bg-light border-bottom">
                    <div className="row g-3">
                        {/* Search Input */}
                        <div className="col-12 col-md-4">
                            <label className="form-label text-muted small fw-bold text-uppercase">Search Booking or Lead</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0">
                                    <i className="ri ri-search-line text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-white border-start-0 ps-0"
                                    placeholder="Search by client, phone, email, package, ID, invoice..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary bg-white border-start-0" 
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <i className="ri ri-close-line"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Date Filter Picker */}
                        <div className="col-12 col-sm-6 col-md-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label text-muted small fw-bold text-uppercase mb-0">Specific Date</label>
                                {dateFilter && (
                                    <button
                                        type="button"
                                        onClick={() => setDateFilter('')}
                                        className="btn btn-link p-0 text-danger text-decoration-none small"
                                        style={{ fontSize: '11px' }}
                                    >
                                        Clear Date
                                    </button>
                                )}
                            </div>
                            <div className="input-group">
                                <input
                                    type="date"
                                    className="form-control bg-white"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
                                    className="btn btn-outline-secondary btn-sm bg-white"
                                    title="Set to Today"
                                >
                                    Today
                                </button>
                            </div>
                        </div>

                        {/* Date Type Matcher */}
                        <div className="col-6 col-sm-6 col-md-2">
                            <label className="form-label text-muted small fw-bold text-uppercase">Date Type</label>
                            <select
                                className="form-select bg-white"
                                value={dateTypeFilter}
                                onChange={(e) => setDateTypeFilter(e.target.value)}
                            >
                                <option value="travel">Travel / Tour Date</option>
                                <option value="booking">Booking / Won Date</option>
                                <option value="any">Any Date Match</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="col-6 col-sm-6 col-md-1.5" style={{ flex: '1' }}>
                            <label className="form-label text-muted small fw-bold text-uppercase">Status</label>
                            <select
                                className="form-select bg-white"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="2">Confirmed &amp; Won</option>
                                <option value="1">Pending Review</option>
                                <option value="0">Cancelled</option>
                            </select>
                        </div>

                        {/* Payment Filter */}
                        <div className="col-6 col-sm-6 col-md-1.5" style={{ flex: '1' }}>
                            <label className="form-label text-muted small fw-bold text-uppercase">Payment</label>
                            <select
                                className="form-select bg-white"
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                            >
                                <option value="All">All Payments</option>
                                <option value="PAID">Paid / Settled</option>
                                <option value="PENDING">Pending / Enquiry</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="table-responsive text-nowrap">
                    {loading ? (
                        <div className="p-5 text-center">
                            <LoadingComponent />
                            <p className="text-muted mt-2">Loading reservations &amp; manual converted leads...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="p-5 text-center">
                            <NotFound />
                            <p className="text-muted mt-2">No bookings matching your criteria found.</p>
                            {dateFilter && (
                                <button
                                    type="button"
                                    onClick={handleClearDateFilter}
                                    className="btn btn-sm btn-primary rounded-pill px-4 mt-2"
                                >
                                    Clear Date Filter ({dateFilter})
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Booking / Lead Ref</th>
                                    <th>Client / Contact</th>
                                    <th>Booking Channel &amp; Source</th>
                                    <th>Tour Package</th>
                                    <th>Safari Travel Date</th>
                                    <th>Total Cost</th>
                                    <th>Payment Status</th>
                                    <th>Booking Status</th>
                                    <th className="pe-4 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((item) => {
                                    const isLead = item.source_type === 'MANUAL_LEAD';
                                    const travelersList = getParsedList(item.raw?.travelers);

                                    return (
                                        <tr key={item.unique_id} style={{ backgroundColor: isLead ? 'rgba(16, 185, 129, 0.02)' : 'inherit' }}>
                                            {/* 1. Booking / Lead Ref */}
                                            <td className="ps-4">
                                                <div className="d-flex flex-column">
                                                    <span className={`fw-bold ${isLead ? 'text-success' : 'text-primary'}`}>
                                                        {item.display_id}
                                                    </span>
                                                    {item.invoice_number ? (
                                                        <span className="badge bg-light text-secondary border font-monospace mt-1" style={{ fontSize: '10px' }}>
                                                            {item.invoice_number}
                                                        </span>
                                                    ) : isLead ? (
                                                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill font-monospace mt-1" style={{ fontSize: '10px' }}>
                                                            CRM Deal
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>

                                            {/* 2. Client / Contact */}
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-dark">{item.customer_name}</span>
                                                    {item.customer_phone && item.customer_phone !== 'N/A' && (
                                                        <a
                                                            href={`https://wa.me/${item.customer_phone.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-decoration-none small text-success font-monospace d-inline-flex align-items-center gap-1 mt-0.5"
                                                            title="Chat on WhatsApp"
                                                        >
                                                            <i className="ri ri-whatsapp-fill"></i>
                                                            <span>+{item.customer_phone}</span>
                                                        </a>
                                                    )}
                                                    {item.customer_email && (
                                                        <span className="text-muted" style={{ fontSize: '11px' }}>
                                                            <i className="ri ri-mail-line me-1"></i>{item.customer_email}
                                                        </span>
                                                    )}
                                                    <div className="d-flex align-items-center gap-1.5 mt-1 flex-wrap">
                                                        <span className="badge bg-light text-secondary border" style={{ fontSize: '10px' }}>
                                                            <i className="ri ri-user-line me-1"></i>{item.total_travelers} Travelers
                                                        </span>
                                                        {isLead && item.total_rooms > 0 && (
                                                            <span className="badge bg-light text-secondary border" style={{ fontSize: '10px' }}>
                                                                <i className="ri ri-hotel-bed-line me-1"></i>{item.total_rooms} Room(s)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 3. Booking Channel & Source */}
                                            <td>
                                                {isLead ? (
                                                    <div className="d-flex flex-column">
                                                        <span className="badge bg-success text-white rounded-pill px-2.5 py-1 fw-bold mb-1 shadow-2xs d-inline-flex align-items-center gap-1">
                                                            <i className="ri ri-chat-check-fill"></i> Manual Lead Won
                                                        </span>
                                                        <span className="small text-muted font-monospace" style={{ fontSize: '11px' }}>
                                                            By: {item.converted_by_name || 'Admin'}
                                                        </span>
                                                    </div>
                                                ) : item.is_agent ? (
                                                    <div className="d-flex flex-column">
                                                        <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 fw-bold rounded-pill px-2.5 py-1 mb-1 d-inline-flex align-items-center gap-1">
                                                            <i className="ri ri-shield-user-fill"></i> Agent B2B
                                                        </span>
                                                        <span className="small fw-semibold text-dark">
                                                            {item.agent_name || 'Registered Agent'}
                                                        </span>
                                                    </div>
                                                ) : item.source_label === 'Online Razorpay' ? (
                                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-1 fw-bold d-inline-flex align-items-center gap-1">
                                                        <i className="ri ri-flashlight-fill text-warning"></i> Online Razorpay
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-light text-muted border rounded-pill px-2.5 py-1">
                                                        <i className="ri ri-file-text-line me-1"></i> Booking Form
                                                    </span>
                                                )}
                                            </td>

                                            {/* 4. Tour Package & Destination */}
                                            <td>
                                                <div className="d-flex flex-column" style={{ maxWidth: '220px' }}>
                                                    <span className="fw-semibold text-dark text-truncate" title={item.package_title}>
                                                        {item.package_title}
                                                    </span>
                                                    <small className="text-muted">
                                                        <i className="ri ri-map-pin-2-line text-danger me-1"></i>
                                                        {item.travel_destination}
                                                    </small>
                                                </div>
                                            </td>

                                            {/* 5. Safari Travel Date */}
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-dark d-flex align-items-center gap-1">
                                                        <i className="ri ri-calendar-check-fill text-primary"></i>
                                                        <span>{safeFormatDate(item.travel_date)}</span>
                                                    </span>
                                                    {item.booking_date && (
                                                        <small className="text-muted font-monospace mt-0.5" style={{ fontSize: '10.5px' }}>
                                                            {isLead ? 'Converted:' : 'Booked:'} {safeFormatDate(item.booking_date)}
                                                        </small>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 6. Total Amount */}
                                            <td>
                                                <span className="fw-bold text-dark fs-6">₹{item.total_cost.toLocaleString('en-IN')}</span>
                                            </td>

                                            {/* 7. Payment Status */}
                                            <td>
                                                {getPaymentBadge(item)}
                                            </td>

                                            {/* 8. Booking Status */}
                                            <td>
                                                {getBookingStatusBadge(item)}
                                            </td>

                                            {/* 9. Actions */}
                                            <td className="pe-4 text-end">
                                                <div className="d-flex align-items-center justify-content-end gap-1.5 flex-wrap">
                                                    {isLead ? (
                                                        <>
                                                            {/* Invoice for Lead */}
                                                            <Link
                                                                href={`/crm/invoices?create_for_lead=${item.contact_id || item.booking_id}`}
                                                                className="btn btn-sm btn-outline-dark rounded-pill px-2.5 py-1"
                                                                title="Create Customer Tax Invoice for this lead"
                                                            >
                                                                <i className="ri ri-file-list-3-line"></i> Invoice
                                                            </Link>

                                                            {/* Lead Details Modal */}
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-success rounded-pill px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                                                                onClick={() => setSelectedLead(item)}
                                                                title="View Converted Lead Details"
                                                            >
                                                                <i className="ri ri-eye-line"></i> Details
                                                            </button>

                                                            {/* Open WhatsApp Chat */}
                                                            <Link
                                                                href={`/crm/whatsapp?phone=${item.customer_phone.replace(/[^0-9]/g, '')}`}
                                                                className="btn btn-sm btn-success rounded-circle p-1.5 d-inline-flex align-items-center justify-content-center shadow-2xs"
                                                                style={{ width: '30px', height: '30px' }}
                                                                title="Chat with Customer on WhatsApp"
                                                            >
                                                                <i className="ri ri-whatsapp-line"></i>
                                                            </Link>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* View / Print Official Invoice */}
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-dark rounded-pill px-2.5 py-1"
                                                                onClick={() => setInvoiceBooking(item.raw)}
                                                                title="Print / View Invoice"
                                                            >
                                                                <i className="ri ri-printer-line"></i> Invoice
                                                            </button>

                                                            {/* Mark as Booked Button for pending reservation */}
                                                            {Number(item.booking_status) === 1 && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-success rounded-pill px-2.5 py-1 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                                                                    onClick={() => setConfirmModalData(item.raw)}
                                                                    title="Confirm & Mark as Booked"
                                                                >
                                                                    <i className="ri ri-check-line"></i> Confirm
                                                                </button>
                                                            )}

                                                            {/* Full Details Modal */}
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1"
                                                                onClick={() => setSelectedBooking(item.raw)}
                                                                title="View Full Details"
                                                            >
                                                                <i className="ri ri-eye-line"></i> Details
                                                            </button>
                                                        </>
                                                    )}
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

            {/* 5. MODAL: View Full Reservation Details */}
            {selectedBooking && (
                <>
                    <div 
                        className="modal-backdrop fade show" 
                        style={{ zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setSelectedBooking(null)}
                    ></div>

                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1060, overflowY: 'auto' }}>
                        <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                
                                <div className="modal-header border-bottom bg-dark text-white p-4 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                            <i className="ri ri-receipt-line text-warning"></i> Reservation #{selectedBooking.bookings_id || selectedBooking.id}
                                        </h5>
                                        <p className="text-light text-opacity-75 small mb-0 mt-1">Full reservation dossier &amp; client itinerary breakdown</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        onClick={() => setSelectedBooking(null)}
                                    ></button>
                                </div>

                                <div className="modal-body p-4 bg-light">
                                    <div className="row g-4">
                                        
                                        {/* Left Side */}
                                        <div className="col-lg-6">
                                            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                                                <h6 className="fw-bold text-primary text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="ri ri-user-line fs-5"></i> Primary Client Information
                                                </h6>
                                                <div className="row g-3">
                                                    <div className="col-sm-6">
                                                        <small className="text-muted d-block">Client Name</small>
                                                        <span className="fw-bold text-dark fs-6">{selectedBooking.customer_name || 'N/A'}</span>
                                                    </div>
                                                    <div className="col-sm-6">
                                                        <small className="text-muted d-block">Contact Phone</small>
                                                        <span className="fw-semibold text-dark">{selectedBooking.customer_phone || 'N/A'}</span>
                                                    </div>
                                                    <div className="col-sm-12">
                                                        <small className="text-muted d-block">Email Address</small>
                                                        <span className="text-dark">{selectedBooking.customer_email || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                                                <h6 className="fw-bold text-success text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="ri ri-bank-card-line fs-5"></i> Payment &amp; Gateway Details
                                                </h6>
                                                <div className="row g-3">
                                                    <div className="col-sm-6">
                                                        <small className="text-muted d-block">Payment Method</small>
                                                        <span className="fw-bold text-dark">{selectedBooking.payment_method || 'RAZORPAY'}</span>
                                                    </div>
                                                    <div className="col-sm-6">
                                                        <small className="text-muted d-block">Payment Status</small>
                                                        <span className="badge bg-success bg-opacity-10 text-success fw-bold rounded-pill px-2.5 py-1">
                                                            {String(selectedBooking.payment_status).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    {selectedBooking.razorpay_payment_id && (
                                                        <div className="col-sm-12">
                                                            <small className="text-muted d-block">Razorpay Payment ID</small>
                                                            <span className="font-monospace fw-bold text-success">{selectedBooking.razorpay_payment_id}</span>
                                                        </div>
                                                    )}
                                                    {selectedBooking.invoice_number && (
                                                        <div className="col-sm-12">
                                                            <small className="text-muted d-block">Official Invoice Number</small>
                                                            <span className="badge bg-light text-primary border font-monospace fs-6 px-3 py-1.5">{selectedBooking.invoice_number}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Travelers */}
                                            <div className="bg-white p-4 rounded-4 shadow-sm border">
                                                <h6 className="fw-bold text-dark text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="ri ri-group-line text-primary fs-5"></i> Registered Travelers ({selectedBooking.total_travelers || 1})
                                                </h6>
                                                <div className="table-responsive">
                                                    <table className="table table-bordered table-sm align-middle mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Traveler Name</th>
                                                                <th>Age</th>
                                                                <th>Gender</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {getParsedList(selectedBooking.travelers).length > 0 ? (
                                                                getParsedList(selectedBooking.travelers).map((t, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="fw-bold">{idx + 1}</td>
                                                                        <td className="fw-semibold">{t.name || 'Traveler'}</td>
                                                                        <td>{t.age || '—'} yrs</td>
                                                                        <td>
                                                                            <span className="badge bg-light text-dark border">
                                                                                {t.gender || 'Not specified'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="4" className="text-center text-muted small py-3">
                                                                        {selectedBooking.customer_name} (Primary Traveler)
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side */}
                                        <div className="col-lg-6">
                                            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                                                <h6 className="fw-bold text-primary text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="ri ri-compass-3-line fs-5"></i> Tour Package Details
                                                </h6>
                                                <h5 className="fw-bold text-dark mb-2">{selectedBooking.title || 'Safari Package'}</h5>
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-1.5 rounded-pill">
                                                        {selectedBooking.duration_nights || 0}N / {selectedBooking.duration_days || 0}D
                                                    </span>
                                                    <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill">
                                                        Departure: {safeFormatDate(selectedBooking.departure_date)}
                                                    </span>
                                                </div>
                                                {selectedBooking.customer_comment && (
                                                    <div className="alert alert-warning border-0 small mb-0 rounded-3">
                                                        <strong>Special Instructions:</strong> {selectedBooking.customer_comment}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                                                <h6 className="fw-bold text-dark text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="ri ri-wallet-3-line text-success fs-5"></i> Financials &amp; Settlement
                                                </h6>
                                                <div className="d-flex justify-content-between py-2 border-bottom">
                                                    <span className="text-muted">Total Travelers:</span>
                                                    <span className="fw-bold">{selectedBooking.total_travelers || 1} Person(s)</span>
                                                </div>
                                                <div className="d-flex justify-content-between py-2 border-bottom">
                                                    <span className="text-muted">Total Booking Amount:</span>
                                                    <span className="fw-bold text-primary fs-5">₹{Number(selectedBooking.total_cost || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                                {Number(selectedBooking.commission_amount) > 0 && (
                                                    <div className="d-flex justify-content-between py-2.5 bg-success bg-opacity-10 rounded-3 px-3 mt-3 border border-success border-opacity-25">
                                                        <span className="fw-bold text-success">
                                                            <i className="ri ri-gift-line me-1"></i> Agent Payout Commission:
                                                        </span>
                                                        <span className="fw-bold text-success fs-5">
                                                            ₹{Number(selectedBooking.commission_amount).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div className="modal-footer border-top bg-white p-4 d-flex justify-content-between">
                                    <div className="d-flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-dark rounded-pill px-4" 
                                            onClick={() => setInvoiceBooking(selectedBooking)}
                                        >
                                            <i className="ri ri-printer-line me-1"></i> View / Print Invoice
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-light rounded-pill px-4" 
                                            onClick={() => setSelectedBooking(null)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                    {Number(selectedBooking.booking_status) === 1 && (
                                        <button 
                                            type="button" 
                                            className="btn btn-success rounded-pill px-5 py-2.5 fw-bold shadow d-flex align-items-center gap-2"
                                            onClick={() => setConfirmModalData(selectedBooking)}
                                        >
                                            <i className="ri ri-check-line fs-5"></i> Confirm &amp; Mark as Booked
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 6. MODAL: View Manual Converted Lead Details */}
            {selectedLead && (
                <>
                    <div 
                        className="modal-backdrop fade show" 
                        style={{ zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setSelectedLead(null)}
                    ></div>

                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1060, overflowY: 'auto' }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                
                                <div className="modal-header bg-success text-white p-4 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                            <i className="ri ri-trophy-fill text-warning"></i> Manual Lead Conversion: {selectedLead.display_id}
                                        </h5>
                                        <p className="text-white-50 small mb-0 mt-1">Closed &amp; won deal converted directly from CRM WhatsApp follow-up pipeline</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        onClick={() => setSelectedLead(null)}
                                    ></button>
                                </div>

                                <div className="modal-body p-4 bg-light">
                                    <div className="row g-3">
                                        {/* Client Info */}
                                        <div className="col-12 col-md-6">
                                            <div className="bg-white p-3.5 rounded-4 shadow-sm border h-100">
                                                <h6 className="fw-bold text-success text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="ri ri-user-star-line fs-5"></i> Client Contact Information
                                                </h6>
                                                <div className="mb-2">
                                                    <small className="text-muted d-block">Client Name</small>
                                                    <span className="fw-bold text-dark fs-6">{selectedLead.customer_name}</span>
                                                </div>
                                                <div className="mb-2">
                                                    <small className="text-muted d-block">WhatsApp / Phone</small>
                                                    <a
                                                        href={`https://wa.me/${selectedLead.customer_phone.replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="fw-bold text-success text-decoration-none font-monospace d-inline-flex align-items-center gap-1"
                                                    >
                                                        <i className="ri ri-whatsapp-fill"></i> +{selectedLead.customer_phone}
                                                    </a>
                                                </div>
                                                {selectedLead.customer_email && (
                                                    <div className="mb-2">
                                                        <small className="text-muted d-block">Email</small>
                                                        <span className="text-dark">{selectedLead.customer_email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tour Package & Travel Info */}
                                        <div className="col-12 col-md-6">
                                            <div className="bg-white p-3.5 rounded-4 shadow-sm border h-100">
                                                <h6 className="fw-bold text-primary text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="ri ri-compass-3-line fs-5"></i> Package &amp; Safari Itinerary
                                                </h6>
                                                <div className="mb-2">
                                                    <small className="text-muted d-block">Booked Package</small>
                                                    <span className="fw-bold text-dark">{selectedLead.package_title}</span>
                                                </div>
                                                <div className="mb-2">
                                                    <small className="text-muted d-block">Destination</small>
                                                    <span className="text-dark">{selectedLead.travel_destination}</span>
                                                </div>
                                                <div className="d-flex gap-3">
                                                    <div>
                                                        <small className="text-muted d-block">Travel Date</small>
                                                        <span className="fw-bold text-primary">{safeFormatDate(selectedLead.travel_date)}</span>
                                                    </div>
                                                    <div>
                                                        <small className="text-muted d-block">Members</small>
                                                        <span className="fw-bold text-dark">{selectedLead.total_travelers} Persons</span>
                                                    </div>
                                                    <div>
                                                        <small className="text-muted d-block">Rooms</small>
                                                        <span className="fw-bold text-dark">{selectedLead.total_rooms} Room(s)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financials & Staff Note */}
                                        <div className="col-12">
                                            <div className="bg-white p-3.5 rounded-4 shadow-sm border">
                                                <h6 className="fw-bold text-dark text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="ri ri-wallet-3-line text-success fs-5"></i> Financials &amp; Conversion Dossier
                                                </h6>
                                                <div className="row g-3">
                                                    <div className="col-12 col-md-4">
                                                        <div className="p-3 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-25">
                                                            <small className="text-success text-uppercase fw-bold d-block mb-1">Agreed Won Value</small>
                                                            <h4 className="fw-bold text-success mb-0">₹{selectedLead.total_cost.toLocaleString('en-IN')}</h4>
                                                        </div>
                                                    </div>
                                                    <div className="col-12 col-md-4">
                                                        <small className="text-muted d-block">Converted Date</small>
                                                        <span className="fw-semibold text-dark">{safeFormatDate(selectedLead.booking_date)}</span>
                                                        <small className="text-muted d-block mt-2">Converted By Staff</small>
                                                        <span className="badge bg-light text-dark border px-2.5 py-1">{selectedLead.converted_by_name || 'Delta Admin'}</span>
                                                    </div>
                                                    <div className="col-12 col-md-4">
                                                        <small className="text-muted d-block">Conversion Notes / Remarks</small>
                                                        <p className="text-dark small mb-0 mt-1">
                                                            {selectedLead.notes || <span className="text-muted fst-italic">No conversion remarks provided.</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer border-top bg-white p-3.5 d-flex justify-content-between">
                                    <button 
                                        type="button" 
                                        className="btn btn-light rounded-pill px-4" 
                                        onClick={() => setSelectedLead(null)}
                                    >
                                        Close
                                    </button>
                                    <div className="d-flex gap-2">
                                        <Link
                                            href={`/crm/invoices?create_for_lead=${selectedLead.contact_id || selectedLead.booking_id}`}
                                            className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold"
                                        >
                                            <i className="ri ri-file-list-3-line me-1"></i> Create Customer Invoice
                                        </Link>
                                        <Link
                                            href={`/crm/whatsapp?phone=${selectedLead.customer_phone.replace(/[^0-9]/g, '')}`}
                                            className="btn btn-success rounded-pill px-4 shadow-sm fw-bold"
                                        >
                                            <i className="ri ri-whatsapp-line me-1"></i> WhatsApp Chat
                                        </Link>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 7. MODAL: Official Printable Tax Invoice */}
            {invoiceBooking && (
                <>
                    <div 
                        className="modal-backdrop fade show" 
                        style={{ zIndex: 1070, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(5px)' }}
                        onClick={() => setInvoiceBooking(null)}
                    ></div>

                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1080, overflowY: 'auto' }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
                                
                                <div className="modal-header border-bottom bg-light p-3 d-flex justify-content-between align-items-center">
                                    <span className="fw-bold text-dark">
                                        <i className="ri ri-file-text-line text-primary me-2"></i> Official Booking Tax Invoice
                                    </span>
                                    <div className="d-flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-primary rounded-pill px-3 fw-bold" 
                                            onClick={() => window.print()}
                                        >
                                            <i className="ri ri-printer-fill me-1"></i> Print Invoice
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-close" 
                                            onClick={() => setInvoiceBooking(null)}
                                        ></button>
                                    </div>
                                </div>

                                <div className="modal-body p-5 bg-white printable-invoice-area" id="printable-invoice">
                                    {/* Brand Header */}
                                    <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
                                        <div>
                                            <h3 className="fw-extrabold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>
                                                Delta <span className="text-primary">Safari</span>
                                            </h3>
                                            <p className="text-muted small mb-0">Official Tourism &amp; Tour Operator</p>
                                            <p className="text-muted small mb-0">Kolkata, West Bengal, India</p>
                                            <p className="text-muted small mb-0">Email: support@deltasafari.com | Tel: +91 98765 43210</p>
                                        </div>
                                        <div className="text-end">
                                            <span className="badge bg-primary fs-6 px-3 py-1.5 rounded-pill mb-2">TAX INVOICE</span>
                                            <h5 className="fw-bold text-dark mb-0">
                                                {invoiceBooking.invoice_number || `DS-INV-${new Date().getFullYear()}-${String(invoiceBooking.bookings_id || invoiceBooking.id).padStart(5, '0')}`}
                                            </h5>
                                            <small className="text-muted d-block">Booking ID: #{invoiceBooking.bookings_id || invoiceBooking.id}</small>
                                            <small className="text-muted d-block">Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</small>
                                        </div>
                                    </div>

                                    {/* Client & Travel Details */}
                                    <div className="row mb-4">
                                        <div className="col-6">
                                            <p className="text-muted small fw-bold text-uppercase mb-1">Billed To / Guest Details:</p>
                                            <h6 className="fw-bold text-dark mb-1">{invoiceBooking.customer_name}</h6>
                                            <p className="text-muted small mb-0">Phone: {invoiceBooking.customer_phone || 'N/A'}</p>
                                            {invoiceBooking.customer_email && (
                                                <p className="text-muted small mb-0">Email: {invoiceBooking.customer_email}</p>
                                            )}
                                        </div>
                                        <div className="col-6 text-end">
                                            <p className="text-muted small fw-bold text-uppercase mb-1">Travel Particulars:</p>
                                            <p className="text-dark fw-bold mb-1">{invoiceBooking.title || 'Safari Package'}</p>
                                            <p className="text-muted small mb-0">Departure Date: {safeFormatDate(invoiceBooking.departure_date)}</p>
                                            <p className="text-muted small mb-0">Total Guests: {invoiceBooking.total_travelers || 1} Person(s)</p>
                                        </div>
                                    </div>

                                    {/* Line Items */}
                                    <table className="table table-bordered mb-4">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Description</th>
                                                <th className="text-center" style={{ width: '100px' }}>Pax</th>
                                                <th className="text-end" style={{ width: '140px' }}>Rate (₹)</th>
                                                <th className="text-end" style={{ width: '150px' }}>Total (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <strong>{invoiceBooking.title || 'Safari Package Tour'}</strong>
                                                    <small className="text-muted d-block">{invoiceBooking.duration_nights || 0} Nights / {invoiceBooking.duration_days || 0} Days Safari Expedition</small>
                                                </td>
                                                <td className="text-center">{invoiceBooking.total_travelers || 1}</td>
                                                <td className="text-end">
                                                    ₹{Number(invoiceBooking.actual_price || invoiceBooking.base_price || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="text-end fw-bold">
                                                    ₹{Number(invoiceBooking.total_cost || 0).toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th colSpan="3" className="text-end">Grand Total:</th>
                                                <th className="text-end text-primary fs-5">
                                                    ₹{Number(invoiceBooking.total_cost || 0).toLocaleString('en-IN')}
                                                </th>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <p className="text-muted text-center small mb-0" style={{ fontSize: '11px' }}>
                                        This is a computer-generated invoice and requires no physical signature. Delta Safari • All rights reserved.
                                    </p>
                                </div>

                                <div className="modal-footer bg-light p-3">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary rounded-pill px-4" 
                                        onClick={() => setInvoiceBooking(null)}
                                    >
                                        Close
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 8. MODAL: Confirm & Settle Booking */}
            {confirmModalData && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '24px',
                            maxWidth: '520px',
                            width: '100%',
                            padding: '35px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                            textAlign: 'center'
                        }}
                    >
                        <div
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                backgroundColor: '#fef3c7',
                                color: '#d97706',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                marginBottom: '20px'
                            }}
                        >
                            <i className="ri ri-alert-fill"></i>
                        </div>

                        <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>
                            Confirm Booking &amp; Settlement
                        </h4>

                        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
                            Are all payments for Booking <strong>#{confirmModalData.bookings_id || confirmModalData.id}</strong> of <strong>₹{Number(confirmModalData.total_cost || 0).toLocaleString('en-IN')}</strong> fully received and verified?
                        </p>

                        <div className="d-flex flex-column gap-2">
                            <button
                                type="button"
                                className="btn btn-success w-100 py-3 rounded-pill fw-bold shadow fs-6 d-flex align-items-center justify-content-center gap-2"
                                onClick={handleConfirmMarkAsBooked}
                                disabled={processingBookingId !== null}
                            >
                                {processingBookingId ? (
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                ) : (
                                    <>
                                        <i className="ri ri-check-double-line"></i> Yes, Mark as Booked &amp; Confirmed
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                className="btn btn-light w-100 py-2.5 rounded-pill fw-semibold text-muted"
                                onClick={() => setConfirmModalData(null)}
                                disabled={processingBookingId !== null}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default function CrmBookingsPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><LoadingComponent /></div>}>
            <CrmBookingsPageContent />
        </Suspense>
    );
}
