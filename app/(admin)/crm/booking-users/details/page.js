"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getBookingUserDetailsUrl, getInvoiceConfigUrl } from "@/app/routes/whatsappRoutes";
import { axiosGet } from "@/libs/axiosHelper";
import { printInvoiceDocument } from "@/libs/printHelper";
import LoadingComponent from "@/components/common/LoadingComponent";
import InvoicePrintTemplate from "@/components/admin/invoice/InvoicePrintTemplate";

function BookingUserDetailsContent() {
    const token = useSelector((state) => state?.adminAuth?.token);
    const router = useRouter();
    const searchParams = useSearchParams();

    const paramKey = searchParams.get("key") || "";
    const paramPhone = searchParams.get("phone") || "";
    const paramEmail = searchParams.get("email") || "";

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    // Invoice View / Print Modal
    const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState(null);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [invoiceConfig, setInvoiceConfig] = useState(null);

    // Bookings filter within this user (All, Invoices, Web Reservations, Converted Leads)
    const [sourceFilter, setSourceFilter] = useState("all");

    // Fetch Invoice Config for print template
    useEffect(() => {
        if (!token) return;
        axiosGet(getInvoiceConfigUrl, token)
            .then((res) => {
                const cfg = res?.data || res?.config || res;
                if (cfg && typeof cfg === "object") {
                    setInvoiceConfig(cfg);
                }
            })
            .catch(() => {});
    }, [token]);

    // Fetch User Details
    const fetchUserDetails = async () => {
        if (!token) return;
        if (!paramKey && !paramPhone && !paramEmail) {
            setErrorMsg("Missing user identifier in request parameters.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMsg("");
        try {
            const queryParams = new URLSearchParams();
            if (paramKey) queryParams.set("key", paramKey);
            if (paramPhone) queryParams.set("phone", paramPhone);
            if (paramEmail) queryParams.set("email", paramEmail);

            const url = `${getBookingUserDetailsUrl}?${queryParams.toString()}`;
            const res = await axiosGet(url, token);
            const payload = res?.data || res;

            if (payload?.status && payload?.data) {
                setUserData(payload.data);
            } else if (payload?.customer_name || payload?.key) {
                setUserData(payload);
            } else {
                setErrorMsg(res?.msg || payload?.msg || "Customer booking details could not be found.");
            }
        } catch (err) {
            console.error("Error fetching booking user details:", err);
            setErrorMsg("Failed to load user booking details. Please verify the URL parameters.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDetails();
    }, [token, paramKey, paramPhone, paramEmail]);

    const formatCurrency = (val) => {
        const num = parseFloat(val) || 0;
        return `₹${num.toLocaleString("en-IN")}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        } catch (e) {
            return dateStr;
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "paid") {
            return (
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1">
                    <i className="ri ri-checkbox-circle-fill me-1"></i>Paid
                </span>
            );
        }
        if (s === "partial") {
            return (
                <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2.5 py-1">
                    <i className="ri ri-pie-chart-2-fill me-1"></i>Partial
                </span>
            );
        }
        if (s === "pending") {
            return (
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2.5 py-1">
                    <i className="ri ri-time-fill me-1"></i>Pending
                </span>
            );
        }
        return (
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1">
                <i className="ri ri-close-circle-fill me-1"></i>Unpaid
            </span>
        );
    };

    const handlePrintInvoice = (inv) => {
        setSelectedInvoiceToPrint(inv);
        setPrintModalOpen(true);
    };

    const handleDirectPrintPopup = (inv) => {
        printInvoiceDocument(inv, invoiceConfig);
    };

    const filteredBookings = useMemo(() => {
        if (!userData?.booking_history) return [];
        if (sourceFilter === "all") return userData.booking_history;
        return userData.booking_history.filter((b) => b.source === sourceFilter);
    }, [userData, sourceFilter]);

    if (loading) {
        return (
            <div className="container-fluid py-5 text-center">
                <LoadingComponent />
                <p className="text-muted mt-3 fs-6">Loading user profile, booking history &amp; payment records...</p>
            </div>
        );
    }

    if (errorMsg || !userData) {
        return (
            <div className="container-fluid py-5">
                <div className="card shadow-sm border-0 rounded-4 text-center py-5 px-3 mx-auto" style={{ maxWidth: "600px" }}>
                    <div
                        className="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{ width: "68px", height: "68px", fontSize: "28px" }}
                    >
                        <i className="ri ri-user-unfollow-line"></i>
                    </div>
                    <h4 className="fw-bold mb-2">User Not Found</h4>
                    <p className="text-muted small mb-4">
                        {errorMsg || "We couldn't retrieve the details for this booking user. The record may have been deleted or the link is invalid."}
                    </p>
                    <div>
                        <Link href="/crm/booking-users" className="btn btn-primary rounded-pill px-4">
                            <i className="ri ri-arrow-left-line me-1.5"></i>
                            Back to Booking Users
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const cleanPhone = userData.normalized_phone || (userData.customer_phone || "").replace(/\D/g, "");
    const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}` : null;
    const hasDue = userData.total_due > 0;

    return (
        <div className="container-fluid py-4 px-3 px-md-4">
            {/* Top Navigation & Breadcrumb */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-1 small">
                            <li className="breadcrumb-item">
                                <Link href="/crm/booking-users" className="text-decoration-none">
                                    <i className="ri ri-user-star-line me-1"></i>
                                    Booking Users
                                </Link>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                Customer Details
                            </li>
                        </ol>
                    </nav>
                    <h3 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <i className="ri ri-profile-line text-primary"></i>
                        <span>Customer Profile &amp; Booking Details</span>
                    </h3>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Link
                        href="/crm/booking-users"
                        className="btn btn-outline-secondary rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 shadow-xs"
                    >
                        <i className="ri ri-arrow-left-line"></i>
                        <span>Back to List</span>
                    </Link>

                    <button
                        type="button"
                        onClick={fetchUserDetails}
                        className="btn btn-light border rounded-pill px-3 py-1.5 d-flex align-items-center gap-1 shadow-xs"
                        title="Refresh details"
                    >
                        <i className="ri ri-refresh-line"></i>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* ========================================================= */}
            {/* USER ALL DETAILS - PROFILE & FINANCIAL SNAPSHOT            */}
            {/* ========================================================= */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                <div className="card-body p-4">
                    <div className="row g-4 align-items-center">
                        {/* Customer Identity Avatar & Info */}
                        <div className="col-12 col-lg-5 border-lg-end pe-lg-4">
                            <div className="d-flex align-items-start gap-3">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow flex-shrink-0"
                                    style={{
                                        width: "64px",
                                        height: "64px",
                                        background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)",
                                        fontSize: "24px"
                                    }}
                                >
                                    {userData.customer_name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="fw-bold text-dark mb-0">{userData.customer_name}</h4>
                                        {hasDue ? (
                                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-0.5 small">
                                                <i className="ri ri-error-warning-line me-1"></i>Balance Due
                                            </span>
                                        ) : (
                                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 small">
                                                <i className="ri ri-checkbox-circle-line me-1"></i>Fully Settled
                                            </span>
                                        )}
                                    </div>

                                    <div className="d-flex flex-column gap-1 text-muted small mt-2">
                                        {userData.customer_phone ? (
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="ri ri-phone-line text-primary"></i>
                                                <a href={`tel:${userData.customer_phone}`} className="text-dark text-decoration-none fw-medium">
                                                    {userData.customer_phone}
                                                </a>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-link p-0 text-muted"
                                                    title="Copy phone"
                                                    onClick={() => {
                                                        navigator.clipboard?.writeText(userData.customer_phone);
                                                        toast.success("Phone copied!");
                                                    }}
                                                >
                                                    <i className="ri ri-file-copy-line"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-muted">
                                                <i className="ri ri-phone-line me-1"></i>No phone registered
                                            </div>
                                        )}

                                        {userData.customer_email && (
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="ri ri-mail-line text-primary"></i>
                                                <a href={`mailto:${userData.customer_email}`} className="text-muted text-decoration-none">
                                                    {userData.customer_email}
                                                </a>
                                            </div>
                                        )}

                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri ri-map-pin-line text-primary"></i>
                                            <span>{userData.customer_address || "West Bengal, India"}</span>
                                        </div>

                                        {userData.last_booking_date && (
                                            <div className="d-flex align-items-center gap-2 text-secondary">
                                                <i className="ri ri-calendar-check-line text-primary"></i>
                                                <span>Most Recent Booking: {formatDate(userData.last_booking_date)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer 4 KPI Metric Cards */}
                        <div className="col-12 col-lg-7">
                            <div className="row g-3">
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 bg-light rounded-4 text-center h-100 border">
                                        <div className="text-muted small text-uppercase fw-medium">Bookings</div>
                                        <h4 className="fw-bold text-primary mb-0 mt-1">{userData.total_bookings || 0}</h4>
                                        <small className="text-muted">Packages</small>
                                    </div>
                                </div>

                                <div className="col-6 col-sm-3">
                                    <div className="p-3 bg-light rounded-4 text-center h-100 border">
                                        <div className="text-muted small text-uppercase fw-medium">Total Billed</div>
                                        <h4 className="fw-bold text-dark mb-0 mt-1">{formatCurrency(userData.total_spent)}</h4>
                                        <small className="text-muted">Total Gross</small>
                                    </div>
                                </div>

                                <div className="col-6 col-sm-3">
                                    <div className="p-3 bg-light rounded-4 text-center h-100 border">
                                        <div className="text-muted small text-uppercase fw-medium">Total Paid</div>
                                        <h4 className="fw-bold text-success mb-0 mt-1">{formatCurrency(userData.total_paid)}</h4>
                                        <small className="text-success">Received</small>
                                    </div>
                                </div>

                                <div className="col-6 col-sm-3">
                                    <div className="p-3 bg-light rounded-4 text-center h-100 border">
                                        <div className="text-muted small text-uppercase fw-medium">Remaining Due</div>
                                        <h4 className={`fw-bold mb-0 mt-1 ${hasDue ? "text-danger" : "text-success"}`}>
                                            {formatCurrency(userData.total_due)}
                                        </h4>
                                        <small className={hasDue ? "text-danger" : "text-success"}>
                                            {hasDue ? "To Collect" : "Cleared"}
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Packages Explored Badges */}
                            {userData.packages && userData.packages.length > 0 && (
                                <div className="mt-3 d-flex flex-wrap align-items-center gap-1.5">
                                    <span className="small text-muted fw-semibold me-1">Packages:</span>
                                    {userData.packages.map((pkg, pIdx) => (
                                        <span key={pIdx} className="badge bg-body border text-dark px-2.5 py-1 rounded-pill shadow-2xs">
                                            <i className="ri ri-compass-3-line text-primary me-1"></i>
                                            {pkg}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* HIS ALL BOOKING - HEADER & FILTERS                         */}
            {/* ========================================================= */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                    <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <i className="ri ri-ticket-2-line text-primary"></i>
                        <span>Customer Bookings</span>
                    </h4>
                    <span className="badge bg-primary rounded-pill px-2.5 py-1">
                        {filteredBookings.length} {filteredBookings.length === 1 ? "Booking" : "Bookings"}
                    </span>
                </div>

                <div className="d-flex align-items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setSourceFilter("all")}
                        className={`btn btn-sm rounded-pill px-3 py-1 ${sourceFilter === "all" ? "btn-primary" : "btn-light border"}`}
                    >
                        All ({userData.booking_history?.length || 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSourceFilter("INVOICE")}
                        className={`btn btn-sm rounded-pill px-3 py-1 ${sourceFilter === "INVOICE" ? "btn-primary" : "btn-light border"}`}
                    >
                        Invoices ({userData.booking_history?.filter((b) => b.source === "INVOICE").length || 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSourceFilter("RESERVATION")}
                        className={`btn btn-sm rounded-pill px-3 py-1 ${sourceFilter === "RESERVATION" ? "btn-primary" : "btn-light border"}`}
                    >
                        Web Bookings ({userData.booking_history?.filter((b) => b.source === "RESERVATION").length || 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSourceFilter("CONVERTED_LEAD")}
                        className={`btn btn-sm rounded-pill px-3 py-1 ${sourceFilter === "CONVERTED_LEAD" ? "btn-primary" : "btn-light border"}`}
                    >
                        CRM Leads ({userData.booking_history?.filter((b) => b.source === "CONVERTED_LEAD").length || 0})
                    </button>
                </div>
            </div>

            {/* Booking History List */}
            {filteredBookings.length === 0 ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-body">
                    <div
                        className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{ width: "64px", height: "64px" }}
                    >
                        <i className="ri ri-inbox-line text-muted fs-3"></i>
                    </div>
                    <h5 className="fw-bold mb-1">No Bookings Found</h5>
                    <p className="text-muted small mb-0">No booking records match the selected filter.</p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-4">
                    {filteredBookings.map((booking, bIdx) => {
                        const isInv = booking.source === "INVOICE";
                        const isRes = booking.source === "RESERVATION";
                        const isLead = booking.source === "CONVERTED_LEAD";
                        const payments = booking.payments || [];
                        const bookingDue = parseFloat(booking.due_amount) || 0;

                        return (
                            <div key={booking.id || bIdx} className="card shadow-sm border-0 rounded-4 overflow-hidden bg-body">
                                {/* Booking Card Header */}
                                <div className="card-header bg-light bg-opacity-75 py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom">
                                    <div className="d-flex align-items-center gap-2.5 flex-wrap">
                                        <span
                                            className={`badge bg-${booking.source_badge || "primary"} rounded-pill px-3 py-1.5 text-uppercase fw-semibold`}
                                            style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                                        >
                                            {booking.source_label || "Booking"}
                                        </span>
                                        <span className="fw-bold text-dark fs-6">
                                            Reference: <span className="text-primary">{booking.reference_no}</span>
                                        </span>
                                        <span className="text-muted small">
                                            <i className="ri ri-time-line me-1"></i>
                                            Booked on {formatDateTime(booking.created_at)}
                                        </span>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                        {getStatusBadge(booking.payment_status)}

                                        {/* Invoice Actions */}
                                        {booking.invoice_data && (
                                            <div className="btn-group btn-group-sm">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrintInvoice(booking.invoice_data)}
                                                    className="btn btn-outline-primary py-1 px-2.5"
                                                    title="View &amp; Print Invoice Preview"
                                                >
                                                    <i className="ri ri-file-text-line me-1"></i>View Invoice
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDirectPrintPopup(booking.invoice_data)}
                                                    className="btn btn-primary py-1 px-2.5"
                                                    title="Direct Print or Save PDF"
                                                >
                                                    <i className="ri ri-printer-line me-1"></i>Print PDF
                                                </button>
                                            </div>
                                        )}

                                        {booking.razorpay_payment_url && (
                                            <a
                                                href={booking.razorpay_payment_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-sm btn-outline-success rounded-pill px-2.5 py-1"
                                                title="Open Razorpay Payment Link"
                                            >
                                                <i className="ri ri-external-link-line me-1"></i>Pay Link
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Booking Card Body */}
                                <div className="card-body p-4">
                                    <div className="row g-4">
                                        {/* Package & Travel Specifications */}
                                        <div className="col-12 col-lg-7">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <div
                                                    className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                                    style={{ width: "36px", height: "36px" }}
                                                >
                                                    <i className="ri ri-map-pin-2-line fs-5"></i>
                                                </div>
                                                <h5 className="fw-bold text-dark mb-0">{booking.package_name}</h5>
                                            </div>

                                            <div className="row g-2 mt-2">
                                                <div className="col-6 col-sm-4">
                                                    <div className="p-2.5 bg-light rounded-3">
                                                        <span className="text-muted small d-block">Travel Schedule</span>
                                                        <span className="fw-semibold text-dark small">
                                                            <i className="ri ri-calendar-event-line me-1 text-primary"></i>
                                                            {booking.travel_date}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="col-6 col-sm-4">
                                                    <div className="p-2.5 bg-light rounded-3">
                                                        <span className="text-muted small d-block">Travelers (Pax)</span>
                                                        <span className="fw-semibold text-dark small">
                                                            <i className="ri ri-group-line me-1 text-primary"></i>
                                                            {booking.pax} Person(s)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="col-6 col-sm-4">
                                                    <div className="p-2.5 bg-light rounded-3">
                                                        <span className="text-muted small d-block">Room Required</span>
                                                        <span className="fw-semibold text-dark small">
                                                            <i className="ri ri-hotel-bed-line me-1 text-primary"></i>
                                                            {booking.rooms || "Standard AC"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="col-6 col-sm-4">
                                                    <div className="p-2.5 bg-light rounded-3">
                                                        <span className="text-muted small d-block">Food Preference</span>
                                                        <span className="fw-semibold text-dark small">
                                                            <i className="ri ri-restaurant-line me-1 text-primary"></i>
                                                            {booking.food_preference || "Non Veg"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="col-6 col-sm-4">
                                                    <div className="p-2.5 bg-light rounded-3">
                                                        <span className="text-muted small d-block">Pickup &amp; Drop</span>
                                                        <span className="fw-semibold text-dark small">
                                                            <i className="ri ri-e-bike-2-line me-1 text-primary"></i>
                                                            {booking.pickup_drop || "Canning"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="col-6 col-sm-4">
                                                    <div className="p-2.5 bg-light rounded-3">
                                                        <span className="text-muted small d-block">Verified Agent / Creator</span>
                                                        <span className="fw-semibold text-dark small text-truncate d-block">
                                                            <i className="ri ri-user-follow-line me-1 text-primary"></i>
                                                            {booking.verified_by || booking.invoice_data?.created_by_name || "DeltaSafari System"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Itemized invoice table if present */}
                                            {booking.invoice_data?.items && booking.invoice_data.items.length > 0 && (
                                                <div className="mt-3">
                                                    <div className="small text-muted fw-semibold mb-1">Billed Items Breakdown:</div>
                                                    <div className="table-responsive border rounded-3 overflow-hidden">
                                                        <table className="table table-sm table-hover align-middle mb-0 small">
                                                            <thead className="table-light text-muted">
                                                                <tr>
                                                                    <th style={{ width: "40px" }}>#</th>
                                                                    <th>Item Description</th>
                                                                    <th className="text-center" style={{ width: "80px" }}>Pax / Qty</th>
                                                                    <th className="text-end" style={{ width: "100px" }}>Rate</th>
                                                                    <th className="text-end" style={{ width: "110px" }}>Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {booking.invoice_data.items.map((item, itmIdx) => (
                                                                    <tr key={itmIdx}>
                                                                        <td className="text-muted">{itmIdx + 1}</td>
                                                                        <td className="fw-medium text-dark">{item.description}</td>
                                                                        <td className="text-center text-muted">{item.person || 1}</td>
                                                                        <td className="text-end text-muted">{formatCurrency(item.rate)}</td>
                                                                        <td className="text-end fw-semibold text-dark">{formatCurrency(item.amount)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Financial Summary Box */}
                                        <div className="col-12 col-lg-5">
                                            <div className="p-3 bg-light rounded-4 border h-100 d-flex flex-column justify-content-between">
                                                <div>
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <span className="fw-bold text-dark small text-uppercase">Financial Breakdown</span>
                                                        {getStatusBadge(booking.payment_status)}
                                                    </div>

                                                    <div className="d-flex justify-content-between py-1.5 border-bottom small">
                                                        <span className="text-muted">Total Package Cost:</span>
                                                        <span className="fw-bold text-dark">{formatCurrency(booking.total_amount)}</span>
                                                    </div>

                                                    {booking.invoice_data?.discount_amount > 0 && (
                                                        <div className="d-flex justify-content-between py-1.5 border-bottom small text-success">
                                                            <span>Special Discount:</span>
                                                            <span className="fw-semibold">- {formatCurrency(booking.invoice_data.discount_amount)}</span>
                                                        </div>
                                                    )}

                                                    {booking.invoice_data?.gst_amount > 0 && (
                                                        <div className="d-flex justify-content-between py-1.5 border-bottom small text-muted">
                                                            <span>GST ({booking.invoice_data.gst_percent || 0}%):</span>
                                                            <span>+ {formatCurrency(booking.invoice_data.gst_amount)}</span>
                                                        </div>
                                                    )}

                                                    <div className="d-flex justify-content-between py-1.5 border-bottom small">
                                                        <span className="text-muted">Total Paid / Advance:</span>
                                                        <span className="fw-bold text-success">{formatCurrency(booking.paid_amount)}</span>
                                                    </div>

                                                    <div className="d-flex justify-content-between py-2 small">
                                                        <span className="fw-bold text-dark">Outstanding Balance Due:</span>
                                                        <span className={`fw-bold fs-6 ${bookingDue > 0 ? "text-danger" : "text-success"}`}>
                                                            {bookingDue > 0 ? formatCurrency(bookingDue) : "₹0 (Fully Settled)"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {booking.payment_note && (
                                                    <div className="mt-3 p-2 bg-white rounded-3 border small">
                                                        <strong className="text-muted d-block">Booking Notes:</strong>
                                                        <span className="text-dark">{booking.payment_note}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ========================================================= */}
                                    {/* UNDER EVERY BOOKING: ALL PAYMENTS SHOW HERE              */}
                                    {/* ========================================================= */}
                                    <div className="mt-4 pt-3 border-top">
                                        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                                            <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                                <i className="ri ri-money-rupee-circle-fill text-success fs-5"></i>
                                                <span>Payments for this Booking ({payments.length})</span>
                                            </h6>
                                            <span className="text-muted small">
                                                Total Settled: <strong className="text-success">{formatCurrency(booking.paid_amount)}</strong>
                                                {bookingDue > 0 && (
                                                    <>
                                                        {" "}
                                                        | Due: <strong className="text-danger">{formatCurrency(bookingDue)}</strong>
                                                    </>
                                                )}
                                            </span>
                                        </div>

                                        {payments.length === 0 ? (
                                            <div className="p-3 bg-light rounded-3 text-center border">
                                                <i className="ri ri-information-line text-muted me-1"></i>
                                                <span className="text-muted small">
                                                    No payment transactions recorded for this booking yet.
                                                </span>
                                                {bookingDue > 0 && (
                                                    <span className="ms-2 fw-semibold text-danger small">
                                                        (Pending collection: {formatCurrency(bookingDue)})
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="table-responsive border rounded-3 overflow-hidden">
                                                <table className="table table-hover align-middle mb-0">
                                                    <thead className="table-light text-muted small text-uppercase">
                                                        <tr>
                                                            <th style={{ width: "40px" }} className="text-center">#</th>
                                                            <th style={{ minWidth: "160px" }}>Payment Type</th>
                                                            <th style={{ minWidth: "120px" }}>Method</th>
                                                            <th style={{ minWidth: "120px" }} className="text-end">Amount Paid</th>
                                                            <th style={{ minWidth: "110px" }} className="text-center">Status</th>
                                                            <th style={{ minWidth: "150px" }}>Date &amp; Time</th>
                                                            <th style={{ minWidth: "160px" }}>Recorded / Verified By</th>
                                                            <th style={{ minWidth: "160px" }}>Notes / Transaction</th>
                                                            <th style={{ minWidth: "100px" }} className="text-center">Receipt</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {payments.map((pay, pIdx) => {
                                                            const payAmount = parseFloat(pay.amount) || 0;
                                                            return (
                                                                <tr key={pay.id || pIdx}>
                                                                    <td className="text-center text-muted fw-medium">{pIdx + 1}</td>
                                                                    <td>
                                                                        <div className="fw-semibold text-dark">
                                                                            <i className="ri ri-checkbox-circle-fill text-success me-1"></i>
                                                                            {pay.payment_type || "Payment Transaction"}
                                                                        </div>
                                                                        {pay.transaction_id && (
                                                                            <small className="text-muted d-block font-monospace">
                                                                                Txn: {pay.transaction_id}
                                                                            </small>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill">
                                                                            {pay.payment_method || "Direct / Gateway"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <span className="fw-bold text-success fs-6">
                                                                            + {formatCurrency(payAmount)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {getStatusBadge(pay.payment_status || "paid")}
                                                                    </td>
                                                                    <td>
                                                                        <div className="small text-dark fw-medium">
                                                                            {formatDateTime(pay.created_at)}
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="small text-dark">
                                                                            {pay.recorded_by || pay.verified_by || "System Admin"}
                                                                        </div>
                                                                        {pay.verified_at && (
                                                                            <small className="text-muted d-block">
                                                                                Verified: {formatDate(pay.verified_at)}
                                                                            </small>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <div className="small text-muted" style={{ maxWidth: "220px" }}>
                                                                            {pay.payment_note || (pay.razorpay_payment_link_id ? `Razorpay Link (${pay.razorpay_payment_link_id})` : "Standard settlement")}
                                                                        </div>
                                                                        {pay.razorpay_payment_url && (
                                                                            <a
                                                                                href={pay.razorpay_payment_url}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="small text-primary text-decoration-none d-block mt-0.5"
                                                                            >
                                                                                <i className="ri ri-link-m me-0.5"></i>Open Payment Link
                                                                            </a>
                                                                        )}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {pay.proof_file ? (
                                                                            <a
                                                                                href={pay.proof_file}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-0.5"
                                                                                title="View Proof File"
                                                                            >
                                                                                <i className="ri ri-attachment-line me-0.5"></i>Proof
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-muted small">-</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========================================================= */}
            {/* INVOICE VIEW / PRINT PREVIEW MODAL                        */}
            {/* ========================================================= */}
            {printModalOpen && selectedInvoiceToPrint && (
                <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-dark text-white py-3 px-4 border-0">
                                <div>
                                    <h5 className="modal-title fw-bold mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-printer-line text-primary"></i>
                                        <span>Invoice #{selectedInvoiceToPrint.invoice_no}</span>
                                    </h5>
                                    <small className="text-muted">
                                        Print Preview for {selectedInvoiceToPrint.customer_name} ({selectedInvoiceToPrint.customer_phone})
                                    </small>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => printInvoiceDocument(selectedInvoiceToPrint, invoiceConfig)}
                                        className="btn btn-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
                                    >
                                        <i className="ri ri-printer-fill"></i>
                                        <span>Print / Save PDF</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => {
                                            setSelectedInvoiceToPrint(null);
                                            setPrintModalOpen(false);
                                        }}
                                        aria-label="Close"
                                    ></button>
                                </div>
                            </div>
                            <div className="modal-body p-4 bg-light text-center">
                                <div
                                    className="d-inline-block text-start bg-white shadow rounded p-4"
                                    style={{ maxWidth: "820px", width: "100%" }}
                                >
                                    <InvoicePrintTemplate
                                        invoice={selectedInvoiceToPrint}
                                        config={invoiceConfig}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer bg-light py-2 px-4 border-0 d-flex justify-content-between">
                                <span className="text-muted small">
                                    Status: {selectedInvoiceToPrint.payment_status?.toUpperCase() || "PENDING"} | Due: {formatCurrency(selectedInvoiceToPrint.total_due_amount)}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-secondary rounded-pill px-4"
                                    onClick={() => {
                                        setSelectedInvoiceToPrint(null);
                                        setPrintModalOpen(false);
                                    }}
                                >
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BookingUserDetailsPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><LoadingComponent /></div>}>
            <BookingUserDetailsContent />
        </Suspense>
    );
}
