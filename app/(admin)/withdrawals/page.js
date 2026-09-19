"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
    getAllWithdrawalRequestsUrl, 
    processWithdrawalRequestUrl, 
    releaseWalletPayoutUrl, 
    updateUserBankDetailsUrl 
} from '../../routes/userRoutes';
import LoadingComponent from '../../../components/common/LoadingComponent';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { formatDate } from '@/libs/timeHelper';
import NotFound from '@/components/common/NotFound';
import { toast } from 'react-toastify';

export default function WithdrawalsAdminPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'users'
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'
    const [searchTerm, setSearchTerm] = useState('');

    const [data, setData] = useState({
        stats: {
            pending_count: 0,
            pending_amount: 0,
            completed_count: 0,
            completed_amount: 0,
            rejected_count: 0,
            total_wallet_liabilities: 0,
            users_with_balance: 0,
            users_with_bank_count: 0
        },
        requests: [],
        usersWithBank: []
    });

    // Modals State
    const [approveModal, setApproveModal] = useState({ open: false, request: null, transactionRef: '', remarks: '', processing: false });
    const [rejectModal, setRejectModal] = useState({ open: false, request: null, remarks: '', processing: false });
    const [payoutModal, setPayoutModal] = useState({ open: false, user: null, amount: '', method: 'Bank Transfer', transactionRef: '', remarks: '', processing: false });
    const [bankModal, setBankModal] = useState({ open: false, user: null, bank_name: '', account_number: '', ifsc_code: '', account_holder: '', upi_id: '', processing: false });

    const token = useSelector((state) => state.adminAuth?.token);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = () => {
        setLoading(true);
        axiosGet(getAllWithdrawalRequestsUrl, token)
            .then((res) => {
                setLoading(false);
                if (res?.status) {
                    setData({
                        stats: res.stats || {},
                        requests: res.requests || [],
                        usersWithBank: res.usersWithBank || []
                    });
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error loading withdrawal data:", err);
                toast.error("Failed to load withdrawal data.");
            });
    };

    // Filtered Requests
    const filteredRequests = (data.requests || []).filter(req => {
        if (statusFilter !== 'ALL') {
            const s = (req.status || 'PENDING').toUpperCase();
            if (statusFilter === 'COMPLETED' && s !== 'COMPLETED' && s !== 'APPROVED') return false;
            if (statusFilter === 'PENDING' && s !== 'PENDING') return false;
            if (statusFilter === 'REJECTED' && s !== 'REJECTED') return false;
        }
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase().trim();
        const userName = `${req.first_name || ''} ${req.last_name || ''}`.toLowerCase();
        const email = (req.email || '').toLowerCase();
        const phone = (req.phone || '').toLowerCase();
        const acc = (req.account_number || '').toLowerCase();
        const upi = (req.upi_id || '').toLowerCase();
        const ref = (req.transaction_ref || '').toLowerCase();
        const reqId = String(req.id || '');
        return userName.includes(term) || email.includes(term) || phone.includes(term) || acc.includes(term) || upi.includes(term) || ref.includes(term) || reqId.includes(term);
    });

    // Filtered Users with Bank
    const filteredUsers = (data.usersWithBank || []).filter(u => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase().trim();
        const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const bank = (u.bank_name || '').toLowerCase();
        const acc = (u.account_number || '').toLowerCase();
        const ifsc = (u.ifsc_code || '').toLowerCase();
        const upi = (u.upi_id || '').toLowerCase();
        return name.includes(term) || email.includes(term) || phone.includes(term) || bank.includes(term) || acc.includes(term) || ifsc.includes(term) || upi.includes(term);
    });

    // 1. Handle Approve Withdrawal Request
    const submitApprove = async () => {
        if (!approveModal.request) return;
        setApproveModal(prev => ({ ...prev, processing: true }));

        try {
            const payload = {
                request_id: approveModal.request.id,
                action: 'APPROVE',
                transaction_ref: approveModal.transactionRef.trim(),
                admin_remarks: approveModal.remarks.trim() || 'Approved by Admin'
            };
            const res = await axiosPost(processWithdrawalRequestUrl, payload, token);
            setApproveModal({ open: false, request: null, transactionRef: '', remarks: '', processing: false });

            if (res?.status) {
                toast.success(res.msg || 'Withdrawal request approved successfully!');
                fetchData();
            } else {
                toast.error(res?.msg || 'Failed to approve request.');
            }
        } catch (err) {
            setApproveModal(prev => ({ ...prev, processing: false }));
            toast.error(err?.response?.data?.msg || err.message || 'Error processing approval.');
        }
    };

    // 2. Handle Reject Withdrawal Request (with automatic wallet refund)
    const submitReject = async () => {
        if (!rejectModal.request) return;
        if (!rejectModal.remarks.trim()) {
            toast.error('Please enter a reason for rejection.');
            return;
        }
        setRejectModal(prev => ({ ...prev, processing: true }));

        try {
            const payload = {
                request_id: rejectModal.request.id,
                action: 'REJECT',
                admin_remarks: rejectModal.remarks.trim()
            };
            const res = await axiosPost(processWithdrawalRequestUrl, payload, token);
            setRejectModal({ open: false, request: null, remarks: '', processing: false });

            if (res?.status) {
                toast.success(res.msg || 'Withdrawal request rejected and funds refunded to user.');
                fetchData();
            } else {
                toast.error(res?.msg || 'Failed to reject request.');
            }
        } catch (err) {
            setRejectModal(prev => ({ ...prev, processing: false }));
            toast.error(err?.response?.data?.msg || err.message || 'Error processing rejection.');
        }
    };

    // 3. Handle Direct Withdraw Money / Payout
    const openDirectPayoutModal = (user) => {
        setPayoutModal({
            open: true,
            user,
            amount: Number(user.wallet_balance || 0) > 0 ? Number(user.wallet_balance) : '',
            method: user.account_number ? 'Bank Transfer' : (user.upi_id ? 'UPI' : 'Bank Transfer'),
            transactionRef: '',
            remarks: 'Admin direct wallet payout',
            processing: false
        });
    };

    const submitDirectPayout = async () => {
        if (!payoutModal.user) return;
        const amt = parseFloat(payoutModal.amount);
        const maxBalance = parseFloat(payoutModal.user.wallet_balance || 0);

        if (!amt || amt <= 0) {
            toast.error('Please enter a valid payout amount.');
            return;
        }
        if (amt > maxBalance) {
            toast.error(`Amount exceeds user's wallet balance (₹${maxBalance.toLocaleString('en-IN')}).`);
            return;
        }

        setPayoutModal(prev => ({ ...prev, processing: true }));

        try {
            const payload = {
                user_id: payoutModal.user.id,
                amount: amt,
                payment_method: payoutModal.method,
                transaction_ref: payoutModal.transactionRef.trim(),
                admin_remarks: payoutModal.remarks.trim(),
                bank_name: payoutModal.user.bank_name,
                account_number: payoutModal.user.account_number,
                ifsc_code: payoutModal.user.ifsc_code,
                upi_id: payoutModal.user.upi_id
            };
            const res = await axiosPost(releaseWalletPayoutUrl, payload, token);
            setPayoutModal({ open: false, user: null, amount: '', method: 'Bank Transfer', transactionRef: '', remarks: '', processing: false });

            if (res?.status) {
                toast.success(res.msg || 'Payout released and debited from wallet successfully!');
                fetchData();
            } else {
                toast.error(res?.msg || 'Failed to release payout.');
            }
        } catch (err) {
            setPayoutModal(prev => ({ ...prev, processing: false }));
            toast.error(err?.response?.data?.msg || err.message || 'Error executing direct payout.');
        }
    };

    // 4. Handle Edit User Bank Details
    const openEditBankModal = (user) => {
        setBankModal({
            open: true,
            user,
            account_holder: user.account_holder || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            bank_name: user.bank_name || '',
            account_number: user.account_number || '',
            ifsc_code: user.ifsc_code || '',
            upi_id: user.upi_id || '',
            processing: false
        });
    };

    const submitBankDetails = async () => {
        if (!bankModal.user) return;
        setBankModal(prev => ({ ...prev, processing: true }));

        try {
            const payload = {
                user_id: bankModal.user.id,
                account_holder: bankModal.account_holder.trim(),
                bank_name: bankModal.bank_name.trim(),
                account_number: bankModal.account_number.trim(),
                ifsc_code: bankModal.ifsc_code.trim().toUpperCase(),
                upi_id: bankModal.upi_id.trim()
            };
            const res = await axiosPost(updateUserBankDetailsUrl, payload, token);
            setBankModal({ open: false, user: null, bank_name: '', account_number: '', ifsc_code: '', account_holder: '', upi_id: '', processing: false });

            if (res?.status) {
                toast.success(res.msg || 'Bank details saved successfully!');
                fetchData();
            } else {
                toast.error(res?.msg || 'Failed to update bank details.');
            }
        } catch (err) {
            setBankModal(prev => ({ ...prev, processing: false }));
            toast.error(err?.response?.data?.msg || err.message || 'Error saving bank details.');
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-2">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <i className="ri ri-bank-card-line text-primary fs-3"></i>
                        <span>User Bank Accounts &amp; Withdrawals</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Manage customer &amp; agent Indian bank accounts, review pending withdrawal requests, and execute direct payouts.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button onClick={fetchData} className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-xs">
                        <i className="ri ri-refresh-line me-1"></i> Refresh
                    </button>
                    <Link href="/referrals" className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-xs">
                        <i className="ri ri-gift-line me-1"></i> View Referrals
                    </Link>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-xs h-100" style={{ borderLeft: '4px solid #ff9f43' }}>
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Pending Requests</span>
                                <h3 className="fw-bold mb-0 text-warning">{data.stats?.pending_count || 0}</h3>
                                <small className="fw-bold text-dark">₹{(data.stats?.pending_amount || 0).toLocaleString('en-IN')}</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-warning rounded-circle d-flex align-items-center justify-content-center">
                                <i className="ri ri-time-line fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-xs h-100" style={{ borderLeft: '4px solid #28c76f' }}>
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Completed Payouts</span>
                                <h3 className="fw-bold mb-0 text-success">{data.stats?.completed_count || 0}</h3>
                                <small className="fw-bold text-dark">₹{(data.stats?.completed_amount || 0).toLocaleString('en-IN')} released</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-success rounded-circle d-flex align-items-center justify-content-center">
                                <i className="ri ri-checkbox-circle-line fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-xs h-100" style={{ borderLeft: '4px solid #7367f0' }}>
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Wallet Liabilities</span>
                                <h3 className="fw-bold mb-0 text-primary">₹{(data.stats?.total_wallet_liabilities || 0).toLocaleString('en-IN')}</h3>
                                <small className="text-muted">Across {data.stats?.users_with_balance || 0} user wallets</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-primary rounded-circle d-flex align-items-center justify-content-center">
                                <i className="ri ri-wallet-3-line fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-xs h-100" style={{ borderLeft: '4px solid #00cfe8' }}>
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Bank Accounts</span>
                                <h3 className="fw-bold mb-0 text-info">{data.stats?.users_with_bank_count || 0}</h3>
                                <small className="text-muted">Users with saved Bank/UPI</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-info rounded-circle d-flex align-items-center justify-content-center">
                                <i className="ri ri-bank-line fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tabs Container */}
            <div className="card border-0 shadow-xs">
                <div className="card-header border-bottom py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <ul className="nav nav-tabs card-header-tabs m-0 border-0" role="tablist">
                        <li className="nav-item">
                            <button 
                                className={`nav-link fw-semibold ${activeTab === 'requests' ? 'active' : ''}`}
                                onClick={() => setActiveTab('requests')}
                            >
                                <i className="ri ri-arrow-up-down-line me-1.5"></i>
                                Withdrawal Requests ({data.requests?.length || 0})
                                {data.stats?.pending_count > 0 && (
                                    <span className="badge rounded-pill bg-warning text-dark ms-2" style={{ fontSize: '10px' }}>
                                        {data.stats?.pending_count} Pending
                                    </span>
                                )}
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link fw-semibold ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <i className="ri ri-user-settings-line me-1.5"></i>
                                User Bank Accounts &amp; Direct Payout ({data.usersWithBank?.length || 0})
                            </button>
                        </li>
                    </ul>

                    {/* Controls & Search */}
                    <div className="d-flex flex-wrap align-items-center gap-2">
                        {activeTab === 'requests' && (
                            <div className="btn-group btn-group-sm" role="group">
                                {['ALL', 'PENDING', 'COMPLETED', 'REJECTED'].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => setStatusFilter(s)}
                                    >
                                        {s === 'COMPLETED' ? 'Approved' : s.charAt(0) + s.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="position-relative" style={{ minWidth: '240px' }}>
                            <i className="ri ri-search-line position-absolute ms-3 top-50 translate-middle-y text-muted"></i>
                            <input
                                type="text"
                                className="form-control form-control-sm ps-5 rounded-pill"
                                placeholder="Search by name, A/C, UTR..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button 
                                    className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y me-2 text-muted p-0"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <i className="ri ri-close-circle-fill"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-5 text-center">
                            <LoadingComponent />
                        </div>
                    ) : activeTab === 'requests' ? (
                        /* TAB 1: WITHDRAWAL REQUESTS TABLE */
                        filteredRequests.length === 0 ? (
                            <div className="p-5 text-center">
                                <NotFound height={120} width={120} classes={"col-12"} />
                                <h6 className="fw-bold text-dark mt-3">No Withdrawal Requests Found</h6>
                                <p className="text-muted small">
                                    {searchTerm || statusFilter !== 'ALL'
                                        ? 'No records match the current filter or search criteria.'
                                        : 'No traveler or agent has submitted any withdrawal requests yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-uppercase small">
                                        <tr>
                                            <th>Req ID / Date</th>
                                            <th>User Details</th>
                                            <th>Amount (₹)</th>
                                            <th>Bank / UPI Payout Details</th>
                                            <th>Status</th>
                                            <th>UTR / Ref</th>
                                            <th>Remarks</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.map((req) => {
                                            const isPending = !req.status || req.status === 'PENDING';
                                            const isApproved = req.status === 'COMPLETED' || req.status === 'APPROVED';
                                            const isRejected = req.status === 'REJECTED';

                                            return (
                                                <tr key={req.id}>
                                                    <td>
                                                        <span className="fw-bold text-primary font-monospace">#{req.id}</span>
                                                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                                                            {formatDate(req.created_at)}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar avatar-sm me-2.5">
                                                                <span className="avatar-initial rounded-circle bg-label-primary text-primary fw-bold">
                                                                    {(req.first_name?.[0] || 'U').toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold text-heading">
                                                                    {req.first_name} {req.last_name || ''}
                                                                </div>
                                                                <small className="text-muted d-block">{req.email || req.phone}</small>
                                                                <small className="text-muted" style={{ fontSize: '11px' }}>
                                                                    Wallet: ₹{Number(req.user_current_wallet_balance || 0).toLocaleString('en-IN')}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="fw-bold fs-6 text-dark">
                                                            ₹{Number(req.amount).toLocaleString('en-IN')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {req.upi_id ? (
                                                            <div>
                                                                <span className="badge bg-label-info mb-1 font-monospace">
                                                                    <i className="ri ri-qr-code-line me-1"></i>UPI: {req.upi_id}
                                                                </span>
                                                                {req.account_holder && (
                                                                    <small className="text-muted d-block">Name: {req.account_holder}</small>
                                                                )}
                                                            </div>
                                                        ) : req.account_number ? (
                                                            <div>
                                                                <div className="fw-semibold text-dark small">{req.bank_name || 'Bank Transfer'}</div>
                                                                <small className="text-muted d-block font-monospace">A/C: {req.account_number}</small>
                                                                <small className="text-muted font-monospace">IFSC: {req.ifsc_code || '—'}</small>
                                                                {req.account_holder && <small className="text-muted d-block">Name: {req.account_holder}</small>}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted small">No Bank Details Saved</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`badge rounded-pill px-2.5 py-1 ${isApproved ? 'bg-success text-white' : isRejected ? 'bg-danger text-white' : 'bg-warning text-dark'}`} style={{ fontSize: '11px' }}>
                                                            {isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="small text-muted font-monospace">
                                                            {req.transaction_ref || '—'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted" style={{ maxWidth: '160px', display: 'inline-block' }}>
                                                            {req.admin_remarks || '—'}
                                                        </small>
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-1">
                                                            {isPending ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-xs btn-success rounded-pill px-2.5"
                                                                        onClick={() => setApproveModal({ open: true, request: req, transactionRef: '', remarks: '', processing: false })}
                                                                        title="Approve and mark payout completed"
                                                                    >
                                                                        <i className="ri ri-check-line me-1"></i> Approve
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-xs btn-outline-danger rounded-pill px-2"
                                                                        onClick={() => setRejectModal({ open: true, request: req, remarks: '', processing: false })}
                                                                        title="Reject request and refund wallet"
                                                                    >
                                                                        <i className="ri ri-close-line me-1"></i> Reject
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <Link
                                                                    href={`/users/view?id=${req.user_id}`}
                                                                    className="btn btn-xs btn-outline-secondary rounded-pill px-2"
                                                                    title="View User"
                                                                >
                                                                    <i className="ri ri-eye-line"></i>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        /* TAB 2: USER BANK ACCOUNTS & DIRECT PAYOUT */
                        filteredUsers.length === 0 ? (
                            <div className="p-5 text-center">
                                <NotFound height={120} width={120} classes={"col-12"} />
                                <h6 className="fw-bold text-dark mt-3">No User Bank Accounts Found</h6>
                                <p className="text-muted small">
                                    {searchTerm ? 'No user accounts match your search.' : 'No users have added bank details or hold a wallet balance yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-uppercase small">
                                        <tr>
                                            <th>#</th>
                                            <th>User Name &amp; Contact</th>
                                            <th>Available Wallet Balance</th>
                                            <th>Bank Account Details</th>
                                            <th>UPI ID</th>
                                            <th>Previously Paid</th>
                                            <th className="text-end">Withdraw &amp; Bank Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u, idx) => (
                                            <tr key={u.id}>
                                                <td className="text-muted small">{idx + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-sm me-2.5">
                                                            <span className="avatar-initial rounded-circle bg-label-info text-info fw-bold">
                                                                {(u.first_name?.[0] || 'U').toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-heading">
                                                                {u.first_name} {u.last_name || ''}
                                                            </div>
                                                            <small className="text-muted d-block">{u.email || u.phone}</small>
                                                            <span className={`badge rounded-pill ${u.user_type == 3 ? 'bg-label-info' : u.user_type == 2 ? 'bg-label-warning' : 'bg-label-secondary'}`} style={{ fontSize: '10px' }}>
                                                                {u.user_type == 3 ? 'Agent' : u.user_type == 2 ? 'Corporate' : 'Customer'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1.5">
                                                        <i className="ri ri-wallet-line text-primary"></i>
                                                        <span className={`fw-bold fs-6 ${Number(u.wallet_balance) > 0 ? 'text-success' : 'text-muted'}`}>
                                                            ₹{Number(u.wallet_balance || 0).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {u.account_number ? (
                                                        <div>
                                                            <div className="fw-semibold text-dark small">{u.bank_name || 'Bank Transfer'}</div>
                                                            <small className="text-muted d-block font-monospace">A/C: {u.account_number}</small>
                                                            <small className="text-muted font-monospace">IFSC: {u.ifsc_code || '—'}</small>
                                                            {u.account_holder && <small className="text-muted d-block">Holder: {u.account_holder}</small>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small fst-italic">No Account Saved</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {u.upi_id ? (
                                                        <span className="badge bg-label-info font-monospace px-2 py-1">
                                                            <i className="ri ri-qr-code-line me-1"></i>{u.upi_id}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted small">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-dark small">
                                                        ₹{Number(u.total_withdrawn_amount || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <div className="d-flex justify-content-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm rounded-pill px-3 fw-semibold ${Number(u.wallet_balance) > 0 ? 'btn-primary' : 'btn-outline-secondary disabled'}`}
                                                            disabled={Number(u.wallet_balance) <= 0}
                                                            onClick={() => openDirectPayoutModal(u)}
                                                            title={Number(u.wallet_balance) > 0 ? 'Initiate wallet payout withdrawal' : 'Wallet balance is ₹0'}
                                                        >
                                                            <i className="ri ri-arrow-up-from-line me-1"></i> Withdraw Money
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary rounded-pill px-2.5"
                                                            onClick={() => openEditBankModal(u)}
                                                            title="Edit Indian Bank / UPI Details"
                                                        >
                                                            <i className="ri ri-edit-line me-1"></i> Bank Details
                                                        </button>
                                                        <Link
                                                            href={`/users/view?id=${u.id}`}
                                                            className="btn btn-sm btn-icon btn-outline-secondary rounded-pill"
                                                            title="View User Profile"
                                                        >
                                                            <i className="ri ri-eye-line"></i>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* ============================================================== */}
            {/* 1. APPROVE WITHDRAWAL MODAL                                    */}
            {/* ============================================================== */}
            {approveModal.open && approveModal.request && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-success text-white py-3">
                                <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-checkbox-circle-line fs-4"></i>
                                    <span>Approve Withdrawal Payout</span>
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setApproveModal({ open: false, request: null, transactionRef: '', remarks: '', processing: false })}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="bg-light p-3 rounded mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted small">User:</span>
                                        <span className="fw-bold text-dark">{approveModal.request.first_name} {approveModal.request.last_name || ''}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted small">Payout Amount:</span>
                                        <span className="fw-bold text-success fs-5">₹{Number(approveModal.request.amount).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small">Destination:</span>
                                        <span className="fw-semibold text-dark">
                                            {approveModal.request.upi_id ? `UPI: ${approveModal.request.upi_id}` : `${approveModal.request.bank_name || 'Bank'} (${approveModal.request.account_number})`}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark">Bank Transaction Ref / UTR / IMPS Number <span className="text-muted">(Recommended)</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. UTR-2026-987654321"
                                        value={approveModal.transactionRef}
                                        onChange={(e) => setApproveModal(prev => ({ ...prev, transactionRef: e.target.value }))}
                                    />
                                    <small className="text-muted">Will be visible to the user as proof of payment transfer.</small>
                                </div>

                                <div className="mb-2">
                                    <label className="form-label small fw-bold text-dark">Admin Remarks (Optional)</label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        placeholder="e.g. Payout processed via HDFC Corporate Netbanking"
                                        value={approveModal.remarks}
                                        onChange={(e) => setApproveModal(prev => ({ ...prev, remarks: e.target.value }))}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill px-3"
                                    onClick={() => setApproveModal({ open: false, request: null, transactionRef: '', remarks: '', processing: false })}
                                    disabled={approveModal.processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success rounded-pill px-4 fw-semibold"
                                    onClick={submitApprove}
                                    disabled={approveModal.processing}
                                >
                                    {approveModal.processing ? 'Processing...' : 'Confirm & Complete Payout'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 2. REJECT WITHDRAWAL MODAL                                     */}
            {/* ============================================================== */}
            {rejectModal.open && rejectModal.request && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-danger text-white py-3">
                                <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-error-warning-line fs-4"></i>
                                    <span>Reject Withdrawal Request</span>
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setRejectModal({ open: false, request: null, remarks: '', processing: false })}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                                    <i className="ri ri-shield-check-line fs-5 mt-0.5"></i>
                                    <div className="small">
                                        <strong>Automatic Refund Guarantee:</strong> Rejecting this request will immediately refund the full <strong>₹{Number(rejectModal.request.amount).toLocaleString('en-IN')}</strong> back into the user's wallet balance.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark">Reason for Rejection <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="e.g. Account number / IFSC mismatch, bank branch unreachable, or invalid UPI handle."
                                        value={rejectModal.remarks}
                                        onChange={(e) => setRejectModal(prev => ({ ...prev, remarks: e.target.value }))}
                                        required
                                    ></textarea>
                                    <small className="text-muted">This explanation will be logged and communicated to the customer.</small>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill px-3"
                                    onClick={() => setRejectModal({ open: false, request: null, remarks: '', processing: false })}
                                    disabled={rejectModal.processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger rounded-pill px-4 fw-semibold"
                                    onClick={submitReject}
                                    disabled={rejectModal.processing}
                                >
                                    {rejectModal.processing ? 'Refunding...' : 'Confirm Rejection & Refund'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 3. DIRECT WITHDRAW MONEY / PAYOUT MODAL                        */}
            {/* ============================================================== */}
            {payoutModal.open && payoutModal.user && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-primary text-white py-3">
                                <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-arrow-up-from-line fs-4"></i>
                                    <span>Withdraw Money / Direct Payout</span>
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setPayoutModal({ open: false, user: null, amount: '', method: 'Bank Transfer', transactionRef: '', remarks: '', processing: false })}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="card bg-label-primary border-0 p-3 mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small text-muted">Beneficiary:</span>
                                        <span className="fw-bold text-dark">{payoutModal.user.first_name} {payoutModal.user.last_name || ''}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small text-muted">Available Wallet Balance:</span>
                                        <span className="fw-bold text-primary fs-5">₹{Number(payoutModal.user.wallet_balance || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    {payoutModal.user.account_number && (
                                        <div className="d-flex justify-content-between small text-muted">
                                            <span>Bank A/C:</span>
                                            <span className="font-monospace">{payoutModal.user.bank_name || 'Bank'} ({payoutModal.user.account_number})</span>
                                        </div>
                                    )}
                                    {payoutModal.user.upi_id && (
                                        <div className="d-flex justify-content-between small text-muted">
                                            <span>UPI ID:</span>
                                            <span className="font-monospace">{payoutModal.user.upi_id}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark">Payout Amount (₹) <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text fw-bold">₹</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Enter amount to withdraw"
                                            min="1"
                                            max={payoutModal.user.wallet_balance}
                                            value={payoutModal.amount}
                                            onChange={(e) => setPayoutModal(prev => ({ ...prev, amount: e.target.value }))}
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => setPayoutModal(prev => ({ ...prev, amount: payoutModal.user.wallet_balance }))}
                                        >
                                            Max
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark">Payment Method</label>
                                    <select
                                        className="form-select"
                                        value={payoutModal.method}
                                        onChange={(e) => setPayoutModal(prev => ({ ...prev, method: e.target.value }))}
                                    >
                                        <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                                        <option value="IMPS">Instant IMPS</option>
                                        <option value="UPI">UPI Transfer</option>
                                        <option value="Cash / Cheque">Cash / Cheque</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark">Transaction Ref / UTR</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. UTR-2026-XXXXX"
                                        value={payoutModal.transactionRef}
                                        onChange={(e) => setPayoutModal(prev => ({ ...prev, transactionRef: e.target.value }))}
                                    />
                                </div>

                                <div className="mb-2">
                                    <label className="form-label small fw-bold text-dark">Admin Notes</label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        placeholder="e.g. Processed upon user request via telephone support."
                                        value={payoutModal.remarks}
                                        onChange={(e) => setPayoutModal(prev => ({ ...prev, remarks: e.target.value }))}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill px-3"
                                    onClick={() => setPayoutModal({ open: false, user: null, amount: '', method: 'Bank Transfer', transactionRef: '', remarks: '', processing: false })}
                                    disabled={payoutModal.processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary rounded-pill px-4 fw-semibold"
                                    onClick={submitDirectPayout}
                                    disabled={payoutModal.processing}
                                >
                                    {payoutModal.processing ? 'Debiting & Releasing...' : 'Confirm Payout & Debit Wallet'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 4. EDIT USER BANK DETAILS MODAL                                */}
            {/* ============================================================== */}
            {bankModal.open && bankModal.user && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-dark text-white py-3">
                                <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                    <i className="ri ri-bank-line fs-4"></i>
                                    <span>Edit User Bank &amp; UPI Details</span>
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setBankModal({ open: false, user: null, bank_name: '', account_number: '', ifsc_code: '', account_holder: '', upi_id: '', processing: false })}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <small className="text-muted d-block">Updating Bank details for:</small>
                                    <span className="fw-bold text-dark">{bankModal.user.first_name} {bankModal.user.last_name || ''} ({bankModal.user.email || bankModal.user.phone})</span>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark">Account Holder Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Full name as registered in bank"
                                        value={bankModal.account_holder}
                                        onChange={(e) => setBankModal(prev => ({ ...prev, account_holder: e.target.value }))}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark">Bank Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. State Bank of India, HDFC Bank, ICICI Bank"
                                        value={bankModal.bank_name}
                                        onChange={(e) => setBankModal(prev => ({ ...prev, bank_name: e.target.value }))}
                                    />
                                </div>

                                <div className="row g-2 mb-3">
                                    <div className="col-md-7">
                                        <label className="form-label small fw-bold text-dark">Bank Account Number</label>
                                        <input
                                            type="text"
                                            className="form-control font-monospace"
                                            placeholder="e.g. 50100456789012"
                                            value={bankModal.account_number}
                                            onChange={(e) => setBankModal(prev => ({ ...prev, account_number: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-5">
                                        <label className="form-label small fw-bold text-dark">IFSC Code</label>
                                        <input
                                            type="text"
                                            className="form-control font-monospace text-uppercase"
                                            placeholder="e.g. SBIN0001234"
                                            value={bankModal.ifsc_code}
                                            onChange={(e) => setBankModal(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                                        />
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <label className="form-label small fw-bold text-dark">UPI ID (VPA)</label>
                                    <div className="input-group">
                                        <span className="input-group-text"><i className="ri ri-qr-code-line"></i></span>
                                        <input
                                            type="text"
                                            className="form-control font-monospace"
                                            placeholder="e.g. customer@okhdfcbank"
                                            value={bankModal.upi_id}
                                            onChange={(e) => setBankModal(prev => ({ ...prev, upi_id: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill px-3"
                                    onClick={() => setBankModal({ open: false, user: null, bank_name: '', account_number: '', ifsc_code: '', account_holder: '', upi_id: '', processing: false })}
                                    disabled={bankModal.processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary rounded-pill px-4 fw-semibold"
                                    onClick={submitBankDetails}
                                    disabled={bankModal.processing}
                                >
                                    {bankModal.processing ? 'Saving...' : 'Save Bank Details'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
