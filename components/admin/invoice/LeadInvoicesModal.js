'use client';

import React, { useState, useEffect } from 'react';
import { getInvoicesByContactUrl } from '@/app/routes/whatsappRoutes';
import { axiosGet } from '@/libs/axiosHelper';
import LoadingComponent from '@/components/common/LoadingComponent';

export default function LeadInvoicesModal({
    isOpen,
    onClose,
    contactId,
    phone,
    customerName,
    token,
    onCreateNewInvoice,
    onViewInvoicePrint
}) {
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [summary, setSummary] = useState(null);

    const formatDateTime = (dt) => {
        if (!dt) return '—';
        try {
            const d = new Date(dt);
            if (isNaN(d.getTime())) return String(dt);
            return d.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return String(dt);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return String(dateStr);
        }
    };

    const fetchLeadInvoices = async () => {
        if (!token || (!contactId && !phone)) return;
        setLoading(true);
        try {
            const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';
            const cId = contactId || 0;
            const res = await axiosGet(`${getInvoicesByContactUrl}${cId}${query}`, token);
            if (res?.status && Array.isArray(res.invoices)) {
                setInvoices(res.invoices);
                setSummary(res.summary || null);
            } else {
                setInvoices([]);
                setSummary(null);
            }
        } catch (err) {
            console.error('Error fetching lead invoices portfolio:', err);
            setInvoices([]);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLeadInvoices();
        } else {
            setInvoices([]);
            setSummary(null);
        }
    }, [isOpen, contactId, phone, token]);

    if (!isOpen) return null;

    return (
        <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
        >
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    {/* Modal Header */}
                    <div className="modal-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between">
                        <div>
                            <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                <i className="ri ri-file-list-3-line text-warning"></i>
                                <span>Guest Billing Portfolio &amp; Payment Timings</span>
                            </h5>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="text-white-50 small">
                                    Customer: <strong className="text-white">{customerName || 'Valued Guest'}</strong>
                                </span>
                                {phone && (
                                    <span className="badge bg-secondary bg-opacity-50 text-white rounded-pill px-2 py-0.5 small font-monospace">
                                        <i className="ri ri-whatsapp-line me-1 text-success"></i>+{phone}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={onClose} 
                            aria-label="Close"
                        ></button>
                    </div>

                    {/* Modal Body */}
                    <div className="modal-body p-4" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
                        {loading ? (
                            <div className="py-5 text-center">
                                <LoadingComponent />
                                <p className="text-muted small mt-2">Loading guest invoices &amp; payment timeline...</p>
                            </div>
                        ) : (
                            <>
                                {/* Financial Stats Summary Bar */}
                                <div className="row g-3 mb-4">
                                    <div className="col-6 col-md-3">
                                        <div className="card border p-3 rounded-4 bg-light h-100 shadow-2xs">
                                            <span className="small text-muted fw-semibold d-block mb-1">
                                                <i className="ri ri-file-paper-2-line me-1 text-primary"></i> Total Invoices
                                            </span>
                                            <h4 className="fw-bold text-dark mb-0 font-monospace">
                                                {summary?.total_invoices_count || invoices.length || 0}
                                            </h4>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>Generated for this deal</small>
                                        </div>
                                    </div>

                                    <div className="col-6 col-md-3">
                                        <div className="card border p-3 rounded-4 bg-light h-100 shadow-2xs">
                                            <span className="small text-muted fw-semibold d-block mb-1">
                                                <i className="ri ri-wallet-3-line me-1 text-info"></i> Total Billed Value
                                            </span>
                                            <h4 className="fw-bold text-dark mb-0 font-monospace">
                                                ₹{Number(summary?.total_billed || invoices.reduce((acc, i) => acc + (parseFloat(i.subtotal) || 0), 0)).toLocaleString('en-IN')}
                                            </h4>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>Safari trip packages</small>
                                        </div>
                                    </div>

                                    <div className="col-6 col-md-3">
                                        <div className="card border p-3 rounded-4 bg-success bg-opacity-10 border-success border-opacity-25 h-100 shadow-2xs">
                                            <span className="small text-success fw-bold d-block mb-1">
                                                <i className="ri ri-checkbox-circle-fill me-1"></i> Total Paid So Far
                                            </span>
                                            <h4 className="fw-bold text-success mb-0 font-monospace">
                                                ₹{Number(summary?.total_paid_so_far || 0).toLocaleString('en-IN')}
                                            </h4>
                                            <small className="text-success fw-semibold" style={{ fontSize: '11px' }}>Confirmed &amp; settled</small>
                                        </div>
                                    </div>

                                    <div className="col-6 col-md-3">
                                        <div className="card border p-3 rounded-4 bg-warning bg-opacity-10 border-warning border-opacity-25 h-100 shadow-2xs">
                                            <span className="small text-warning-emphasis fw-bold d-block mb-1">
                                                <i className="ri ri-time-line me-1"></i> Outstanding Due
                                            </span>
                                            <h4 className="fw-bold text-danger mb-0 font-monospace">
                                                ₹{Number(summary?.total_remaining_due || 0).toLocaleString('en-IN')}
                                            </h4>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>To be collected</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Invoices Table */}
                                <div className="card border rounded-4 overflow-hidden shadow-2xs">
                                    <div className="card-header bg-light border-bottom py-2.5 px-3 d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-1.5">
                                            <i className="ri ri-bill-line text-primary"></i>
                                            <span>All Invoices &amp; Verified Payment Timings</span>
                                        </h6>
                                        <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 small">
                                            {invoices.length} Invoice{invoices.length > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {invoices.length === 0 ? (
                                        <div className="p-4 text-center">
                                            <p className="text-muted mb-2">No invoices created for this lead yet.</p>
                                            {onCreateNewInvoice && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onClose();
                                                        onCreateNewInvoice(contactId);
                                                    }}
                                                    className="btn btn-sm btn-primary rounded-pill px-3"
                                                >
                                                    + Create First Invoice
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="table-light text-muted small fw-bold">
                                                    <tr>
                                                        <th className="ps-3">Invoice #</th>
                                                        <th>Date</th>
                                                        <th>Package &amp; Pax</th>
                                                        <th>Billed Amount</th>
                                                        <th>Minus: Prev Paid</th>
                                                        <th>Paid Amount</th>
                                                        <th>Exact Payment Timing</th>
                                                        <th>Status</th>
                                                        <th className="text-center pe-3">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoices.map((inv) => (
                                                        <tr key={inv.id} className="border-bottom">
                                                            {/* Invoice # */}
                                                            <td className="ps-3">
                                                                <span className="fw-bold font-monospace text-primary d-block">
                                                                    {inv.invoice_no}
                                                                </span>
                                                            </td>

                                                            {/* Date */}
                                                            <td>
                                                                <span className="small text-muted font-monospace">
                                                                    {formatDate(inv.invoice_date)}
                                                                </span>
                                                            </td>

                                                            {/* Package & Pax */}
                                                            <td>
                                                                <div className="fw-semibold text-dark small text-truncate" style={{ maxWidth: '180px' }}>
                                                                    {inv.package_name || 'Safari Package'}
                                                                </div>
                                                                <small className="text-muted">
                                                                    {inv.number_of_pax || 1} Pax • {inv.room_required || '1 Room'}
                                                                </small>
                                                            </td>

                                                            {/* Billed */}
                                                            <td>
                                                                <strong className="text-dark d-block">
                                                                    ₹{Number(inv.subtotal || 0).toLocaleString('en-IN')}
                                                                </strong>
                                                                {Number(inv.discount_amount) > 0 && (
                                                                    <small className="text-danger d-block font-monospace" style={{ fontSize: '10.5px' }}>
                                                                        Disc: -₹{Number(inv.discount_amount).toLocaleString('en-IN')}
                                                                    </small>
                                                                )}
                                                            </td>

                                                            {/* Minus Prev Paid */}
                                                            <td>
                                                                {Number(inv.previously_paid_amount) > 0 ? (
                                                                    <div>
                                                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-0.5 fw-bold font-monospace">
                                                                            -₹{Number(inv.previously_paid_amount).toLocaleString('en-IN')}
                                                                        </span>
                                                                        {inv.previous_payments_note && (
                                                                            <small className="text-muted d-block mt-0.5 text-truncate" style={{ maxWidth: '140px', fontSize: '10px' }} title={inv.previous_payments_note}>
                                                                                {inv.previous_payments_note}
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted small">—</span>
                                                                )}
                                                            </td>

                                                            {/* Paid Amount */}
                                                            <td>
                                                                <strong className="text-success font-monospace fs-6">
                                                                    ₹{Number(inv.amount_paid || 0).toLocaleString('en-IN')}
                                                                </strong>
                                                                {Number(inv.total_due_amount) > 0 && (
                                                                    <small className="text-danger d-block font-monospace" style={{ fontSize: '10.5px' }}>
                                                                        Due: ₹{Number(inv.total_due_amount).toLocaleString('en-IN')}
                                                                    </small>
                                                                )}
                                                            </td>

                                                            {/* Payment Timing */}
                                                            <td>
                                                                {inv.paid_timing ? (
                                                                    <div>
                                                                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1">
                                                                            <i className="ri ri-time-line"></i>
                                                                            <span>{formatDateTime(inv.paid_timing)}</span>
                                                                        </span>
                                                                        {inv.payment_method && (
                                                                            <small className="text-muted d-block mt-0.5" style={{ fontSize: '10.5px' }}>
                                                                                <i className="ri ri-bank-card-line me-1"></i>{inv.payment_method}
                                                                            </small>
                                                                        )}
                                                                        {inv.payment_proof_file && (
                                                                            <a
                                                                                href={inv.payment_proof_file}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="badge bg-light text-primary border text-decoration-none mt-1 d-inline-flex align-items-center gap-0.5"
                                                                                style={{ fontSize: '10px' }}
                                                                            >
                                                                                <i className="ri ri-attachment-line"></i> Receipt
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted small fst-italic">Payment Not Verified</span>
                                                                )}
                                                            </td>

                                                            {/* Status */}
                                                            <td>
                                                                {inv.payment_status === 'paid' ? (
                                                                    <span className="badge bg-success rounded-pill px-2.5 py-1">
                                                                        <i className="ri ri-checkbox-circle-fill me-1"></i>Paid Full
                                                                    </span>
                                                                ) : inv.payment_status === 'partial' ? (
                                                                    <span className="badge bg-info text-white rounded-pill px-2.5 py-1">
                                                                        <i className="ri ri-checkbox-circle-fill me-1"></i>Advance Paid
                                                                    </span>
                                                                ) : inv.payment_status === 'advance_pending' ? (
                                                                    <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1">
                                                                        <i className="ri ri-time-fill me-1"></i>Advance Pending
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-danger rounded-pill px-2.5 py-1">
                                                                        <i className="ri ri-close-circle-fill me-1"></i>Unpaid
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="text-center pe-3">
                                                                {onViewInvoicePrint && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onViewInvoicePrint(inv)}
                                                                        className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"
                                                                        title="View &amp; Print Official PDF"
                                                                    >
                                                                        <i className="ri ri-printer-fill"></i>
                                                                        <span>Print</span>
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between align-items-center">
                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-pill px-4"
                            onClick={onClose}
                        >
                            Close
                        </button>
                        {onCreateNewInvoice && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onCreateNewInvoice(contactId);
                                }}
                                className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                            >
                                <i className="ri ri-add-line fs-5"></i>
                                <span>Create Another Invoice for this Lead</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
