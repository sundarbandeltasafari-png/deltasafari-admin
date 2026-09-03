"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getBookingUsersUrl } from "@/app/routes/whatsappRoutes";
import { getInvoiceConfigUrl } from "@/app/routes/whatsappRoutes";
import { axiosGet } from "@/libs/axiosHelper";
import { printInvoiceDocument } from "@/libs/printHelper";
import LoadingComponent from "@/components/common/LoadingComponent";
import InvoicePrintTemplate from "@/components/admin/invoice/InvoicePrintTemplate";

export default function BookingUsersPage() {
    const token = useSelector((state) => state?.adminAuth?.token);
    const user = useSelector((state) => state?.adminAuth?.user);

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        total_users: 0,
        total_bookings: 0,
        total_spent: 0,
        total_paid: 0,
        total_due: 0,
        fully_paid_users: 0,
        users_with_due: 0
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("all"); // 'all', 'paid', 'due', 'pending'

    // Selected User for Booking History Modal
    const [selectedUser, setSelectedUser] = useState(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    // Invoice View / Print Modal
    const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState(null);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [invoiceConfig, setInvoiceConfig] = useState(null);

    // Fetch Invoice Config for print template
    useEffect(() => {
        if (!token) return;
        axiosGet(getInvoiceConfigUrl, token)
            .then((res) => {
                const cfg = res?.data || res?.config || res;
                if (cfg && typeof cfg === 'object') {
                    setInvoiceConfig(cfg);
                }
            })
            .catch(() => {});
    }, [token]);

    // Fetch Booking Users
    const fetchBookingUsers = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (searchTerm.trim()) queryParams.set("search", searchTerm.trim());
            if (paymentFilter !== "all") queryParams.set("payment_status", paymentFilter);

            const url = `${getBookingUsersUrl}?${queryParams.toString()}`;
            const res = await axiosGet(url, token);
            const payload = res?.data || res;
            if (res?.status || payload?.status || payload?.users) {
                setUsers(payload.users || res?.users || []);
                if (payload.stats || res?.stats) {
                    setStats(payload.stats || res?.stats);
                }
            } else {
                setUsers([]);
            }
        } catch (err) {
            console.error("Error fetching booking users:", err);
            toast.error("Failed to load booking users data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingUsers();
    }, [token, paymentFilter]);

    // Handle Search with debounce or Enter
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchBookingUsers();
    };

    const handleOpenHistoryModal = (client) => {
        setSelectedUser(client);
        setHistoryModalOpen(true);
    };

    const handleCloseHistoryModal = () => {
        setSelectedUser(null);
        setHistoryModalOpen(false);
    };

    const handlePrintInvoice = (inv) => {
        setSelectedInvoiceToPrint(inv);
        setPrintModalOpen(true);
    };

    const handleDirectPrintPopup = (inv) => {
        printInvoiceDocument(inv, invoiceConfig);
    };

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
                    <i className="ri ri-time-fill me-1"></i>Pending Verification
                </span>
            );
        }
        return (
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1">
                <i className="ri ri-close-circle-fill me-1"></i>Unpaid
            </span>
        );
    };

    return (
        <div className="container-fluid py-4 px-3 px-md-4">
            {/* Top Header Card */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                    <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <i className="ri ri-user-star-line text-primary"></i>
                        <span>Booking Users</span>
                    </h3>
                    <p className="text-muted small mb-0">
                        All customers and clients with their verified booking history, invoices, package details, and payment records across DeltaSafari.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchBookingUsers}
                        className="btn btn-outline-secondary rounded-pill px-3 py-1.5 d-flex align-items-center gap-1 shadow-xs"
                        title="Refresh Users List"
                    >
                        <i className="ri ri-refresh-line"></i>
                        <span>Refresh</span>
                    </button>
                    <Link
                        href="/crm/invoices"
                        className="btn btn-primary rounded-pill px-3 py-1.5 d-flex align-items-center gap-1 shadow-sm"
                    >
                        <i className="ri ri-bill-line"></i>
                        <span>Manage Invoices</span>
                    </Link>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="row g-3 mb-4">
                {/* Total Unique Booking Users */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card shadow-sm border-0 rounded-4 h-100 p-3 bg-body">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-medium text-uppercase">Total Booking Users</span>
                                <h4 className="fw-bold mb-0 mt-1 text-primary">{stats.total_users || 0}</h4>
                                <small className="text-muted mt-1 d-block">{stats.total_bookings || 0} total bookings registered</small>
                            </div>
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary"
                                style={{ width: "48px", height: "48px", fontSize: "22px" }}
                            >
                                <i className="ri ri-user-shared-line"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Revenue Billed */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card shadow-sm border-0 rounded-4 h-100 p-3 bg-body">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-medium text-uppercase">Total Billed Volume</span>
                                <h4 className="fw-bold mb-0 mt-1 text-dark">{formatCurrency(stats.total_spent)}</h4>
                                <small className="text-success mt-1 d-block">
                                    <i className="ri ri-checkbox-circle-line me-1"></i>
                                    {stats.fully_paid_users || 0} clients fully settled
                                </small>
                            </div>
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center bg-success-subtle text-success"
                                style={{ width: "48px", height: "48px", fontSize: "22px" }}
                            >
                                <i className="ri ri-money-rupee-circle-line"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Advance / Collected */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card shadow-sm border-0 rounded-4 h-100 p-3 bg-body">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-medium text-uppercase">Total Collected</span>
                                <h4 className="fw-bold mb-0 mt-1 text-success">{formatCurrency(stats.total_paid)}</h4>
                                <small className="text-muted mt-1 d-block">Paid via UPI / Bank / Razorpay</small>
                            </div>
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center bg-info-subtle text-info"
                                style={{ width: "48px", height: "48px", fontSize: "22px" }}
                            >
                                <i className="ri ri-wallet-3-line"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Balance Due */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card shadow-sm border-0 rounded-4 h-100 p-3 bg-body">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-medium text-uppercase">Outstanding Due</span>
                                <h4 className="fw-bold mb-0 mt-1 text-danger">{formatCurrency(stats.total_due)}</h4>
                                <small className="text-danger mt-1 d-block">
                                    <i className="ri ri-error-warning-line me-1"></i>
                                    {stats.users_with_due || 0} clients with balance due
                                </small>
                            </div>
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center bg-danger-subtle text-danger"
                                style={{ width: "48px", height: "48px", fontSize: "22px" }}
                            >
                                <i className="ri ri-hand-coin-line"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
                <div className="card-body p-3">
                    <div className="row g-3 align-items-center">
                        {/* Search Bar */}
                        <div className="col-12 col-md-6 col-lg-7">
                            <form onSubmit={handleSearchSubmit} className="input-group">
                                <span className="input-group-text bg-light border-0">
                                    <i className="ri ri-search-line text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-light border-0 py-2"
                                    placeholder="Search by name, phone number, email, or package name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary px-3">
                                    Search
                                </button>
                                {searchTerm && (
                                    <button
                                        type="button"
                                        className="btn btn-light"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setTimeout(fetchBookingUsers, 50);
                                        }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* Status Filter Buttons */}
                        <div className="col-12 col-md-6 col-lg-5">
                            <div className="d-flex flex-wrap align-items-center justify-content-md-end gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setPaymentFilter("all")}
                                    className={`btn btn-sm rounded-pill px-3 py-1.5 ${paymentFilter === "all" ? "btn-primary" : "btn-light border"}`}
                                >
                                    All Users
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentFilter("paid")}
                                    className={`btn btn-sm rounded-pill px-3 py-1.5 ${paymentFilter === "paid" ? "btn-success text-white" : "btn-light border text-success"}`}
                                >
                                    Fully Paid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentFilter("due")}
                                    className={`btn btn-sm rounded-pill px-3 py-1.5 ${paymentFilter === "due" ? "btn-danger text-white" : "btn-light border text-danger"}`}
                                >
                                    Has Due
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentFilter("pending")}
                                    className={`btn btn-sm rounded-pill px-3 py-1.5 ${paymentFilter === "pending" ? "btn-warning text-dark" : "btn-light border text-warning"}`}
                                >
                                    Pending
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table Card */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="card-header bg-body py-3 px-4 d-flex align-items-center justify-content-between border-bottom">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                        <i className="ri ri-group-line text-primary"></i>
                        <span>Client List ({users.length})</span>
                    </h5>
                    <span className="badge bg-light text-dark border px-2.5 py-1">
                        Sorted by Most Recent Booking
                    </span>
                </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-5 text-center">
                            <LoadingComponent />
                            <p className="text-muted mt-2">Loading booking users &amp; travel histories...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-5 px-3">
                            <div
                                className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3"
                                style={{ width: "64px", height: "64px" }}
                            >
                                <i className="ri ri-user-unfollow-line text-muted fs-3"></i>
                            </div>
                            <h6 className="fw-bold mb-1">No Booking Users Found</h6>
                            <p className="text-muted small mb-3">
                                {searchTerm
                                    ? "No users matched your search criteria. Try a different term or phone number."
                                    : "No packages have been booked or invoiced yet."}
                            </p>
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setPaymentFilter("all");
                                    }}
                                    className="btn btn-outline-primary rounded-pill btn-sm px-3"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light text-muted small text-uppercase">
                                    <tr>
                                        <th style={{ width: "40px" }} className="text-center">#</th>
                                        <th style={{ minWidth: "200px" }}>Customer / Contact</th>
                                        <th style={{ minWidth: "120px" }}>Bookings</th>
                                        <th style={{ minWidth: "220px" }}>Packages Booked</th>
                                        <th style={{ minWidth: "140px" }} className="text-end">Total Billed</th>
                                        <th style={{ minWidth: "130px" }} className="text-end">Paid / Advance</th>
                                        <th style={{ minWidth: "130px" }} className="text-end">Balance Due</th>
                                        <th style={{ minWidth: "120px" }}>Last Booking</th>
                                        <th style={{ minWidth: "160px" }} className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((client, idx) => {
                                        const cleanPhone = client.normalized_phone || (client.customer_phone || "").replace(/\D/g, "");
                                        const whatsappUrl = cleanPhone
                                            ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}`
                                            : null;

                                        const hasDue = client.total_due > 0;

                                        return (
                                            <tr key={client.key || idx}>
                                                <td className="text-center text-muted fw-medium">{idx + 1}</td>

                                                {/* Customer Details */}
                                                <td>
                                                    <div className="d-flex align-items-center gap-2.5">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-2xs flex-shrink-0"
                                                            style={{
                                                                width: "38px",
                                                                height: "38px",
                                                                backgroundColor: "#0d6efd",
                                                                fontSize: "14px"
                                                            }}
                                                        >
                                                            {client.customer_name?.charAt(0)?.toUpperCase() || "U"}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark">{client.customer_name}</div>
                                                            <div className="d-flex align-items-center gap-2 small text-muted">
                                                                {client.customer_phone ? (
                                                                    <span>
                                                                        <i className="ri ri-phone-line me-0.5 text-muted"></i>
                                                                        {client.customer_phone}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">No phone</span>
                                                                )}
                                                                {whatsappUrl && (
                                                                    <a
                                                                        href={whatsappUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-success"
                                                                        title="Chat on WhatsApp"
                                                                    >
                                                                        <i className="ri ri-whatsapp-fill"></i>
                                                                    </a>
                                                                )}
                                                            </div>
                                                            {client.customer_email && (
                                                                <small className="text-muted d-block text-truncate" style={{ maxWidth: "200px" }}>
                                                                    {client.customer_email}
                                                                </small>
                                                            )}
                                                            {client.customer_address && client.customer_address !== "West Bengal" && (
                                                                <small className="badge bg-light text-secondary border px-1.5 py-0.5 mt-0.5">
                                                                    <i className="ri ri-map-pin-line me-0.5"></i>
                                                                    {client.customer_address}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Total Bookings Count */}
                                                <td>
                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fw-bold">
                                                        <i className="ri ri-ticket-line me-1"></i>
                                                        {client.total_bookings} {client.total_bookings === 1 ? "Booking" : "Bookings"}
                                                    </span>
                                                </td>

                                                {/* Packages Booked Badges */}
                                                <td>
                                                    <div className="d-flex flex-wrap gap-1" style={{ maxWidth: "260px" }}>
                                                        {(client.packages || []).slice(0, 2).map((pkg, pIdx) => (
                                                            <span
                                                                key={pIdx}
                                                                className="badge bg-light text-dark border px-2 py-1 text-truncate"
                                                                style={{ maxWidth: "200px" }}
                                                                title={pkg}
                                                            >
                                                                {pkg}
                                                            </span>
                                                        ))}
                                                        {(client.packages || []).length > 2 && (
                                                            <span className="badge bg-secondary-subtle text-secondary px-1.5 py-1">
                                                                +{(client.packages || []).length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Total Billed */}
                                                <td className="text-end fw-semibold text-dark">
                                                    {formatCurrency(client.total_spent)}
                                                </td>

                                                {/* Total Paid */}
                                                <td className="text-end fw-semibold text-success">
                                                    {formatCurrency(client.total_paid)}
                                                </td>

                                                {/* Balance Due */}
                                                <td className="text-end">
                                                    {hasDue ? (
                                                        <span className="fw-bold text-danger">
                                                            {formatCurrency(client.total_due)}
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5">
                                                            Settled
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Last Booking Date */}
                                                <td>
                                                    <div className="small fw-medium text-dark">{formatDate(client.last_booking_date)}</div>
                                                </td>

                                                {/* Actions */}
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenHistoryModal(client)}
                                                            className="btn btn-sm btn-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-2xs"
                                                            title="View Complete Booking History"
                                                            style={{ fontSize: "11.5px" }}
                                                        >
                                                            <i className="ri ri-history-line"></i>
                                                            <span>History ({client.booking_history?.length || 0})</span>
                                                        </button>

                                                        {whatsappUrl && (
                                                            <a
                                                                href={whatsappUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="btn btn-sm btn-success rounded-circle d-inline-flex align-items-center justify-content-center shadow-2xs"
                                                                style={{ width: "30px", height: "30px", backgroundColor: "#25D366", borderColor: "#25D366" }}
                                                                title="Send WhatsApp Message"
                                                            >
                                                                <i className="ri ri-whatsapp-line text-white"></i>
                                                            </a>
                                                        )}
                                                    </div>
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

            {/* ========================================================= */}
            {/* BOOKING HISTORY MODAL FOR SELECTED USER                   */}
            {/* ========================================================= */}
            {historyModalOpen && selectedUser && (
                <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            {/* Modal Header */}
                            <div className="modal-header bg-primary text-white py-3 px-4 border-0">
                                <div>
                                    <h5 className="modal-title fw-bold mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-history-line"></i>
                                        <span>Customer Booking History</span>
                                    </h5>
                                    <small className="opacity-90">
                                        Client: <strong>{selectedUser.customer_name}</strong> | Phone: {selectedUser.customer_phone || "N/A"} | Email: {selectedUser.customer_email || "N/A"}
                                    </small>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={handleCloseHistoryModal}
                                    aria-label="Close"
                                ></button>
                            </div>

                            {/* Client Snapshot Ribbon */}
                            <div className="bg-light p-3 border-bottom">
                                <div className="row g-2 text-center text-md-start">
                                    <div className="col-6 col-md-3">
                                        <span className="text-muted small">Total Bookings:</span>
                                        <div className="fw-bold text-dark">{selectedUser.total_bookings} Packages</div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <span className="text-muted small">Total Billed:</span>
                                        <div className="fw-bold text-dark">{formatCurrency(selectedUser.total_spent)}</div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <span className="text-muted small">Total Paid / Advance:</span>
                                        <div className="fw-bold text-success">{formatCurrency(selectedUser.total_paid)}</div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <span className="text-muted small">Outstanding Balance:</span>
                                        <div className={`fw-bold ${selectedUser.total_due > 0 ? "text-danger" : "text-success"}`}>
                                            {selectedUser.total_due > 0 ? formatCurrency(selectedUser.total_due) : "₹0 (Fully Settled)"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body: Chronological Booking History List */}
                            <div className="modal-body p-4">
                                {(!selectedUser.booking_history || selectedUser.booking_history.length === 0) ? (
                                    <p className="text-muted text-center py-4">No booking items recorded.</p>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {selectedUser.booking_history.map((item, hIdx) => {
                                            return (
                                                <div key={item.id || hIdx} className="card border rounded-3 p-3 shadow-2xs bg-body">
                                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-2.5 mb-2.5">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className={`badge bg-${item.source_badge || "primary"} rounded-pill px-2.5 py-1 text-uppercase`} style={{ fontSize: "11px" }}>
                                                                {item.source_label || "Booking"}
                                                            </span>
                                                            <span className="fw-bold text-dark">Ref: {item.reference_no}</span>
                                                            <span className="text-muted small">| Date: {formatDate(item.created_at)}</span>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            {getStatusBadge(item.payment_status)}
                                                            {item.invoice_data && (
                                                                <div className="btn-group btn-group-sm">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handlePrintInvoice(item.invoice_data)}
                                                                        className="btn btn-outline-primary py-0.5 px-2"
                                                                        title="View &amp; Print Invoice Modal"
                                                                    >
                                                                        <i className="ri ri-file-text-line me-1"></i>View
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDirectPrintPopup(item.invoice_data)}
                                                                        className="btn btn-primary py-0.5 px-2"
                                                                        title="Direct Print or Save PDF"
                                                                    >
                                                                        <i className="ri ri-printer-line me-1"></i>Print PDF
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="row g-2">
                                                        <div className="col-12 col-md-6">
                                                            <div className="fw-bold text-primary mb-1 d-flex align-items-center gap-1">
                                                                <i className="ri ri-map-2-line"></i>
                                                                <span>{item.package_name}</span>
                                                            </div>
                                                            <div className="small text-muted mb-0.5">
                                                                <strong>Travel Date:</strong> {item.travel_date}
                                                            </div>
                                                            <div className="small text-muted">
                                                                <strong>Travelers &amp; Rooms:</strong> {item.pax} Pax | {item.rooms} | {item.food_preference}
                                                            </div>
                                                        </div>

                                                        <div className="col-12 col-md-6">
                                                            <div className="p-2.5 bg-light rounded-2">
                                                                <div className="d-flex justify-content-between small mb-1">
                                                                    <span className="text-muted">Package Total:</span>
                                                                    <span className="fw-bold">{formatCurrency(item.total_amount)}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between small mb-1">
                                                                    <span className="text-muted">Paid / Advance:</span>
                                                                    <span className="fw-semibold text-success">{formatCurrency(item.paid_amount)}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between small">
                                                                    <span className="text-muted">Balance Due:</span>
                                                                    <span className={`fw-bold ${item.due_amount > 0 ? "text-danger" : "text-success"}`}>
                                                                        {formatCurrency(item.due_amount)}
                                                                    </span>
                                                                </div>

                                                                {(item.payment_method || item.payment_note || item.payment_proof_file) && (
                                                                    <div className="mt-2 pt-2 border-top small">
                                                                        {item.payment_method && (
                                                                            <span className="badge bg-secondary-subtle text-secondary me-1.5">
                                                                                Medium: {item.payment_method}
                                                                            </span>
                                                                        )}
                                                                        {item.payment_note && (
                                                                            <span className="text-muted me-2">Note: {item.payment_note}</span>
                                                                        )}
                                                                        {item.payment_proof_file && (
                                                                            <a
                                                                                href={item.payment_proof_file}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="badge bg-info text-white text-decoration-none"
                                                                            >
                                                                                <i className="ri ri-attachment-line me-0.5"></i>Proof Receipt
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light py-2 px-4 border-0">
                                <button
                                    type="button"
                                    className="btn btn-secondary rounded-pill px-4"
                                    onClick={handleCloseHistoryModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
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
