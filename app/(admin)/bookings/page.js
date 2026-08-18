"use client"

import { getAllBookingsUrl, updateBookingUrl } from "@/app/routes/serviceRoutes"
import { axiosGet, axiosPost } from "@/libs/axiosHelper"
import { useEffect, useState, useMemo } from "react"
import { useSelector } from "react-redux"
import LoadingComponent from "@/components/common/LoadingComponent"
import NotFound from "@/components/common/NotFound"
import { showMessage } from "@/libs/commonHelper"

function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [invoiceBooking, setInvoiceBooking] = useState(null);
    const [confirmModalData, setConfirmModalData] = useState(null);
    const [processingBookingId, setProcessingBookingId] = useState(null);

    const token = useSelector((state) => state.adminAuth?.token);

    const fetchBookings = () => {
        setLoading(true);
        axiosGet(getAllBookingsUrl, token)
            .then((res) => {
                if (res?.bookings && Array.isArray(res.bookings)) {
                    setBookings(res.bookings);
                } else {
                    setBookings([]);
                }
            })
            .catch((err) => {
                console.error("Failed to load bookings from server:", err);
                setBookings([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchBookings();
    }, [token]);

    const safeFormatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const dateObj = new Date(dateString);
            if (isNaN(dateObj.getTime())) return dateString;
            return new Intl.DateTimeFormat('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }).format(dateObj);
        } catch (e) {
            return dateString;
        }
    };

    const filteredBookings = useMemo(() => {
        if (!bookings) return [];
        return bookings.filter((booking) => {
            const customerName = (booking.customer_name || "").toLowerCase();
            const email = (booking.customer_email || "").toLowerCase();
            const phone = (booking.customer_phone || "").toLowerCase();
            const pkgTitle = (booking.title || "").toLowerCase();
            const bookingId = String(booking.bookings_id || booking.id || "").toLowerCase();
            const invoiceNum = (booking.invoice_number || "").toLowerCase();
            const paymentId = (booking.razorpay_payment_id || "").toLowerCase();
            const agentName = `${booking.agent_first_name || ''} ${booking.agent_last_name || ''}`.toLowerCase();
            const query = searchTerm.toLowerCase();

            const matchesSearch = 
                customerName.includes(query) ||
                email.includes(query) ||
                phone.includes(query) ||
                pkgTitle.includes(query) ||
                bookingId.includes(query) ||
                invoiceNum.includes(query) ||
                paymentId.includes(query) ||
                agentName.includes(query);

            const matchesStatus = 
                statusFilter === "All" || 
                String(booking.booking_status) === statusFilter;

            const isPaid = String(booking.payment_status).toUpperCase() === 'PAID' || String(booking.payment_status) === '1';
            const matchesPayment = 
                paymentFilter === "All" ||
                (paymentFilter === "PAID" && isPaid) ||
                (paymentFilter === "PENDING" && !isPaid);

            return matchesSearch && matchesStatus && matchesPayment;
        });
    }, [bookings, searchTerm, statusFilter, paymentFilter]);

    // Render status badge
    const getBookingStatusBadge = (status) => {
        const statusStr = String(status);
        if (statusStr === '2') {
            return (
                <span className="badge rounded-pill bg-success d-inline-flex align-items-center gap-1 px-3 py-1.5 shadow-sm">
                    <i className="bi bi-check-circle-fill"></i> Confirmed & Booked
                </span>
            );
        } else if (statusStr === '1') {
            return (
                <span className="badge rounded-pill bg-warning text-dark d-inline-flex align-items-center gap-1 px-3 py-1.5 shadow-sm">
                    <i className="bi bi-hourglass-split"></i> Pending Review
                </span>
            );
        } else {
            return (
                <span className="badge rounded-pill bg-danger d-inline-flex align-items-center gap-1 px-3 py-1.5 shadow-sm">
                    <i className="bi bi-x-circle-fill"></i> Cancelled
                </span>
            );
        }
    };

    // Render payment badge
    const getPaymentBadge = (booking) => {
        const isPaid = String(booking.payment_status).toUpperCase() === 'PAID' || String(booking.payment_status) === '1';
        if (isPaid) {
            return (
                <div className="d-flex flex-column">
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold rounded-pill px-2.5 py-1">
                        <i className="bi bi-check2-circle me-1"></i> PAID (Razorpay)
                    </span>
                    {booking.razorpay_payment_id && (
                        <small className="text-muted font-monospace mt-1" style={{ fontSize: '10px' }} title={booking.razorpay_payment_id}>
                            {booking.razorpay_payment_id.slice(0, 14)}...
                        </small>
                    )}
                </div>
            );
        } else {
            const isEnquiry = booking.booking_type === 'ENQUIRY_FORM' || booking.payment_method === 'INQUIRY';
            return (
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-1">
                    <i className="bi bi-clock-history me-1"></i> {isEnquiry ? 'Enquiry (Pending)' : 'Unpaid'}
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

    // Handle Mark as Booked Execution
    const handleConfirmMarkAsBooked = async () => {
        if (!confirmModalData) return;
        const b = confirmModalData;
        setProcessingBookingId(b.bookings_id || b.id);

        try {
            const payload = {
                id: b.bookings_id || b.id,
                booking_status: 2,
                payment_status: 'PAID',
                action: 'mark_booked'
            };
            const res = await axiosPost(updateBookingUrl, payload, token);
            if (res.status) {
                showMessage("Booking marked as Booked & Payment Settled! Commission credited to wallet.", "success");
                setConfirmModalData(null);
                if (selectedBooking && (selectedBooking.id === b.id || selectedBooking.bookings_id === b.bookings_id)) {
                    setSelectedBooking(null);
                }
                fetchBookings();
            } else {
                showMessage(res.msg || "Failed to update booking status.", "error");
            }
        } catch (err) {
            showMessage(err.message || "Failed to communicate with server.", "error");
        } finally {
            setProcessingBookingId(null);
        }
    };

    return (
        <div className={"container-xxl flex-grow-1 container-p-y"} style={{ zIndex: selectedBooking || confirmModalData || invoiceBooking ? 5555 : 1 }}>
            
            {/* Page Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark">Package Bookings & Razorpay Reservations</h4>
                    <p className="text-muted small mb-0">Manage direct Razorpay payments, booking form enquiries, client itineraries, and tax invoices</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm" onClick={fetchBookings}>
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                
                {/* Search and Filters */}
                <div className="card-header border-bottom bg-white p-4">
                    <h5 className="card-title mb-0 fw-bold text-dark">Search & Filter Reservations</h5>
                    <div className="row g-3 mt-2">
                        {/* Search Input */}
                        <div className="col-md-6 col-sm-12">
                            <label className="form-label text-muted small fw-bold text-uppercase">Search Booking</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Search by ID, client name, email, phone, invoice, payment ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="col-md-3 col-sm-6">
                            <label className="form-label text-muted small fw-bold text-uppercase">Booking Status</label>
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Booking Statuses</option>
                                <option value="1">Pending Review / Inquiry</option>
                                <option value="2">Confirmed & Booked</option>
                                <option value="0">Cancelled</option>
                            </select>
                        </div>

                        {/* Payment Filter */}
                        <div className="col-md-3 col-sm-6">
                            <label className="form-label text-muted small fw-bold text-uppercase">Payment Status</label>
                            <select
                                className="form-select"
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                            >
                                <option value="All">All Payments</option>
                                <option value="PAID">Paid (Razorpay)</option>
                                <option value="PENDING">Pending / Inquiry</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="table-responsive text-nowrap">
                    {loading ? (
                        <div className="p-5 text-center">
                            <LoadingComponent />
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="p-5 text-center">
                            <NotFound />
                            <p className="text-muted mt-2">No bookings matching your criteria found.</p>
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Booking / Invoice</th>
                                    <th>Client / Contact</th>
                                    <th>Channel / Type</th>
                                    <th>Tour Package</th>
                                    <th>Travel Date</th>
                                    <th>Total Cost</th>
                                    <th>Payment Status</th>
                                    <th>Booking Status</th>
                                    <th className="pe-4 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking) => {
                                    const totalCost = Number(booking.total_cost) || 0;
                                    const isAgentBooking = booking.user_type === 3 || booking.agent_first_name;
                                    const travelersList = getParsedList(booking.travelers);
                                    const isDirectRazorpay = booking.booking_type === 'DIRECT_RAZORPAY' || booking.payment_method === 'RAZORPAY' || booking.razorpay_payment_id;

                                    return (
                                        <tr key={booking.bookings_id || booking.id}>
                                            <td className="ps-4">
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-primary">#{booking.bookings_id || booking.id}</span>
                                                    {booking.invoice_number && (
                                                        <span className="badge bg-light text-secondary border font-monospace mt-1" style={{ fontSize: '10px' }}>
                                                            {booking.invoice_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-dark">{booking.customer_name || 'N/A'}</span>
                                                    <span className="text-muted small">
                                                        <i className="bi bi-telephone me-1"></i> {booking.customer_phone || 'N/A'}
                                                    </span>
                                                    {booking.customer_email && (
                                                        <span className="text-muted" style={{ fontSize: '11px' }}>
                                                            <i className="bi bi-envelope me-1"></i> {booking.customer_email}
                                                        </span>
                                                    )}
                                                    <span className="badge bg-light text-secondary border mt-1 w-auto d-inline-block">
                                                        <i className="bi bi-people-fill me-1"></i> {booking.total_travelers || travelersList.length || 1} Travelers
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                {isAgentBooking ? (
                                                    <div className="d-flex flex-column">
                                                        <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold rounded-pill px-2.5 py-1 mb-1">
                                                            <i className="bi bi-shield-check me-1"></i> Agent B2B
                                                        </span>
                                                        <span className="small fw-semibold text-dark">
                                                            {booking.agent_first_name} {booking.agent_last_name}
                                                        </span>
                                                    </div>
                                                ) : isDirectRazorpay ? (
                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fw-bold">
                                                        <i className="bi bi-lightning-charge-fill me-1"></i> Direct Razorpay
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-light text-muted border rounded-pill px-2.5 py-1">
                                                        <i className="bi bi-file-earmark-text me-1"></i> Booking Form
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column" style={{ maxWidth: '220px' }}>
                                                    <span className="fw-semibold text-dark text-truncate">{booking.title || 'Safari Package'}</span>
                                                    <span className="text-muted small">
                                                        {booking.duration_nights || 0}N / {booking.duration_days || 0}D
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="fw-medium text-dark">
                                                    <i className="bi bi-calendar-event me-1 text-primary"></i> {safeFormatDate(booking.departure_date)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="fw-bold text-dark fs-6">₹{totalCost.toLocaleString('en-IN')}</span>
                                            </td>
                                            <td>
                                                {getPaymentBadge(booking)}
                                            </td>
                                            <td>
                                                {getBookingStatusBadge(booking.booking_status)}
                                            </td>
                                            <td className="pe-4 text-end">
                                                <div className="d-flex align-items-center justify-content-end gap-1.5">
                                                    {/* View Invoice Button */}
                                                    <button
                                                        className="btn btn-sm btn-outline-dark rounded-pill px-2.5 py-1.5"
                                                        onClick={() => setInvoiceBooking(booking)}
                                                        title="Print / View Invoice"
                                                    >
                                                        <i className="bi bi-receipt"></i> Invoice
                                                    </button>

                                                    {/* Mark as Booked Button for pending */}
                                                    {Number(booking.booking_status) === 1 && (
                                                        <button
                                                            className="btn btn-sm btn-success rounded-pill px-2.5 py-1.5 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                                                            onClick={() => setConfirmModalData(booking)}
                                                            title="Confirm & Mark as Booked"
                                                        >
                                                            <i className="bi bi-check2-circle"></i> Confirm
                                                        </button>
                                                    )}

                                                    {/* Full Details Modal */}
                                                    <button
                                                        className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1.5"
                                                        onClick={() => setSelectedBooking(booking)}
                                                        title="View Full Details"
                                                    >
                                                        <i className="bi bi-eye"></i> Details
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

            {/* View Full Booking Details Modal */}
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
                                
                                {/* Header */}
                                <div className="modal-header border-bottom bg-dark text-white p-4 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                            <i className="bi bi-receipt-cutoff text-warning"></i> Booking Order #{selectedBooking.bookings_id || selectedBooking.id}
                                        </h5>
                                        <p className="text-light text-opacity-75 small mb-0 mt-1">Full reservation dossier & client itinerary breakdown</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        onClick={() => setSelectedBooking(null)}
                                    ></button>
                                </div>

                                {/* Body */}
                                <div className="modal-body p-4 bg-light">
                                    <div className="row g-4">
                                        
                                        {/* Left Side: Client & Agent Dossier */}
                                        <div className="col-lg-6">
                                            {/* Client Card */}
                                            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                                                <h6 className="fw-bold text-primary text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="bi bi-person-circle fs-5"></i> Primary Client Information
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

                                            {/* Payment Gateway & Razorpay Dossier */}
                                            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                                                <h6 className="fw-bold text-success text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="bi bi-credit-card-2-front-fill fs-5"></i> Payment & Gateway Details
                                                </h6>
                                                <div className="row g-3">
                                                    <div className="col-sm-6">
                                                        <small className="text-muted d-block">Payment Method</small>
                                                        <span className="fw-bold text-dark">{selectedBooking.payment_method || 'RAZORPAY'}</span>
                                                    </div>
                                                    <div className="col-sm-6">
                                                        <small className="text-muted d-block">Payment Status</small>
                                                        {getPaymentBadge(selectedBooking)}
                                                    </div>
                                                    {selectedBooking.razorpay_payment_id && (
                                                        <div className="col-sm-12">
                                                            <small className="text-muted d-block">Razorpay Payment ID</small>
                                                            <span className="font-monospace fw-bold text-success">{selectedBooking.razorpay_payment_id}</span>
                                                        </div>
                                                    )}
                                                    {selectedBooking.razorpay_order_id && (
                                                        <div className="col-sm-12">
                                                            <small className="text-muted d-block">Razorpay Order ID</small>
                                                            <span className="font-monospace text-dark">{selectedBooking.razorpay_order_id}</span>
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

                                            {/* Multiple Travelers List */}
                                            <div className="bg-white p-4 rounded-4 shadow-sm border">
                                                <h6 className="fw-bold text-dark text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="bi bi-people-fill text-primary fs-5"></i> Registered Travelers ({selectedBooking.total_travelers || 1})
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

                                        {/* Right Side: Tour Package & Pricing Breakdown */}
                                        <div className="col-lg-6">
                                            {/* Tour Package Dossier */}
                                            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                                                <h6 className="fw-bold text-primary text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="bi bi-compass-fill fs-5"></i> Tour Package Details
                                                </h6>
                                                <h5 className="fw-bold text-dark mb-2">{selectedBooking.title || 'Safari Package'}</h5>
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 rounded-pill">
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

                                            {/* Financials & Settlement */}
                                            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                                                <h6 className="fw-bold text-dark text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                                                    <i className="bi bi-wallet2 text-success fs-5"></i> Financials & Settlement
                                                </h6>
                                                <div className="d-flex justify-content-between py-2 border-bottom">
                                                    <span className="text-muted">Total Travelers:</span>
                                                    <span className="fw-bold">{selectedBooking.total_travelers || 1} Person(s)</span>
                                                </div>
                                                <div className="d-flex justify-content-between py-2 border-bottom">
                                                    <span className="text-muted">Rate / Traveler:</span>
                                                    <span className="fw-semibold">₹{Number(selectedBooking.actual_price || selectedBooking.base_price || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="d-flex justify-content-between py-2 border-bottom">
                                                    <span className="fw-bold text-dark">Total Booking Amount:</span>
                                                    <span className="fw-bold text-primary fs-5">₹{Number(selectedBooking.total_cost || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                                {Number(selectedBooking.commission_amount) > 0 && (
                                                    <div className="d-flex justify-content-between py-2.5 bg-success-subtle rounded-3 px-3 mt-3 border border-success-subtle">
                                                        <span className="fw-bold text-success">
                                                            <i className="bi bi-gift-fill me-1"></i> Agent Payout Commission:
                                                        </span>
                                                        <span className="fw-bold text-success fs-5">
                                                            ₹{Number(selectedBooking.commission_amount).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="mt-3 d-flex align-items-center justify-content-between">
                                                    <span className="small text-muted">Booking Status:</span>
                                                    {getBookingStatusBadge(selectedBooking.booking_status)}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="modal-footer border-top bg-white p-4 d-flex justify-content-between">
                                    <div className="d-flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-dark rounded-pill px-4" 
                                            onClick={() => setInvoiceBooking(selectedBooking)}
                                        >
                                            <i className="bi bi-printer me-1"></i> View / Print Invoice
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
                                            <i className="bi bi-check2-circle fs-5"></i> Confirm & Mark as Booked
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* View & Print Printable Official Invoice Modal */}
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
                                        <i className="bi bi-receipt text-primary me-2"></i> Official Booking Tax Invoice
                                    </span>
                                    <div className="d-flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                                            onClick={() => window.print()}
                                        >
                                            <i className="bi bi-printer-fill me-1"></i> Print Invoice
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
                                            <p className="text-muted small mb-0">Official Tourism & Tour Operator</p>
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

                                    {/* Billed To and Booking Info Grid */}
                                    <div className="row g-4 mb-4">
                                        <div className="col-sm-6">
                                            <h6 className="text-muted text-uppercase fw-bold small mb-2">Billed To (Guest)</h6>
                                            <h5 className="fw-bold text-dark mb-1">{invoiceBooking.customer_name || 'Guest Traveler'}</h5>
                                            <p className="text-secondary small mb-0"><i className="bi bi-telephone me-1"></i> {invoiceBooking.customer_phone || 'N/A'}</p>
                                            <p className="text-secondary small mb-0"><i className="bi bi-envelope me-1"></i> {invoiceBooking.customer_email || 'N/A'}</p>
                                        </div>
                                        <div className="col-sm-6 text-sm-end">
                                            <h6 className="text-muted text-uppercase fw-bold small mb-2">Tour Details</h6>
                                            <h6 className="fw-bold text-dark mb-1">{invoiceBooking.title || 'Safari Package'}</h6>
                                            <p className="text-secondary small mb-0">Departure Date: <strong>{safeFormatDate(invoiceBooking.departure_date)}</strong></p>
                                            <p className="text-secondary small mb-0">Duration: <strong>{invoiceBooking.duration_nights || 0}N / {invoiceBooking.duration_days || 0}D</strong></p>
                                        </div>
                                    </div>

                                    {/* Invoice Table */}
                                    <div className="table-responsive mb-4">
                                        <table className="table table-bordered align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Item & Description</th>
                                                    <th className="text-center">Travelers</th>
                                                    <th className="text-end">Rate / Person</th>
                                                    <th className="text-end">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <strong className="text-dark">{invoiceBooking.title || 'Safari Package'}</strong>
                                                        <div className="text-muted small">Inclusive of AC Stays, River Cruise, Forest Permits, Local Naturalist & Gourmet Meals</div>
                                                    </td>
                                                    <td className="text-center fw-bold">{invoiceBooking.total_travelers || 1}</td>
                                                    <td className="text-end">₹{Number(invoiceBooking.actual_price || (invoiceBooking.total_cost / Math.max(1, invoiceBooking.total_travelers || 1))).toLocaleString('en-IN')}</td>
                                                    <td className="text-end fw-bold">₹{Number(invoiceBooking.total_cost || 0).toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="3" className="text-end text-muted small">Taxes & GST (Included):</td>
                                                    <td className="text-end text-muted small">₹0.00</td>
                                                </tr>
                                                <tr className="table-light">
                                                    <td colSpan="3" className="text-end fw-extrabold fs-6 text-dark">Total Amount:</td>
                                                    <td className="text-end fw-extrabold fs-5 text-primary">₹{Number(invoiceBooking.total_cost || 0).toLocaleString('en-IN')}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Payment Method Block */}
                                    <div className="p-3 rounded-3 bg-light border mb-4">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '11px' }}>Payment Status</small>
                                                <strong className={String(invoiceBooking.payment_status).toUpperCase() === 'PAID' ? 'text-success fs-6' : 'text-warning fs-6'}>
                                                    {String(invoiceBooking.payment_status).toUpperCase() === 'PAID' ? '✓ PAID & SETTLED' : '⏳ PENDING'}
                                                </strong>
                                            </div>
                                            {invoiceBooking.razorpay_payment_id && (
                                                <div className="text-end">
                                                    <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '11px' }}>Razorpay Payment ID</small>
                                                    <span className="font-monospace fw-bold text-dark">{invoiceBooking.razorpay_payment_id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

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

            {/* Warning Confirmation Modal: Mark as Booked & Settle Commission */}
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
                            <i className="bi bi-exclamation-triangle-fill"></i>
                        </div>

                        <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>
                            Confirm Booking & Settlement
                        </h4>

                        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
                            Are all payments for Booking <strong>#{confirmModalData.bookings_id || confirmModalData.id}</strong> of <strong>₹{Number(confirmModalData.total_cost || 0).toLocaleString('en-IN')}</strong> fully received and verified?
                        </p>

                        {Number(confirmModalData.commission_amount) > 0 && (
                            <div className="p-3 rounded-4 bg-success-subtle border border-success-subtle mb-4 text-start">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <i className="bi bi-wallet-fill text-success fs-5"></i>
                                    <strong className="text-success">Automatic Wallet Credit:</strong>
                                </div>
                                <p className="mb-0 small text-success-emphasis">
                                    Upon confirmation, the Agent Commission of <strong>₹{Number(confirmModalData.commission_amount).toLocaleString('en-IN')}</strong> will be credited to the agent's wallet.
                                </p>
                            </div>
                        )}

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
                                        <i className="bi bi-check2-circle"></i> Yes, Mark as Booked & Confirmed
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

export default BookingsPage;