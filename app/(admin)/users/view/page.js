"use client"

import { getParticulerUsersUrl, releaseWalletPayoutUrl, processWithdrawalRequestUrl } from '@/app/routes/userRoutes';
import LoadingComponent from '@/components/common/LoadingComponent';
import UserCard from '@/components/users/UserCard';
import { showMessage } from '@/libs/commonHelper';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

function UserViewPage() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'corporate', 'bookings', 'enquiries', 'saved', 'wallet', 'referrals'
    const [searchFilter, setSearchFilter] = useState('');

    // Payout Modal State
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutSubmitting, setPayoutSubmitting] = useState(false);
    const [payoutForm, setPayoutForm] = useState({
        amount: '',
        payment_method: 'Bank Transfer',
        transaction_ref: '',
        admin_remarks: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        upi_id: ''
    });

    const token = useSelector((state) => state.adminAuth?.token);
    const searchParams = useSearchParams();
    const router = useRouter();
    const rawId = searchParams.get('id');

    // Decode ID if Base64 encoded or use raw
    const decodedId = useMemo(() => {
        if (!rawId) return '';
        try {
            const decoded = atob(rawId);
            if (decoded && !isNaN(Number(decoded))) {
                return decoded;
            }
        } catch (e) {}
        return rawId;
    }, [rawId]);

    const fetchUserDetails = async () => {
        if (!rawId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(`${getParticulerUsersUrl}?id=${encodeURIComponent(rawId)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status) {
                setUserData(response.data);
                // Pre-fill payout form with user bank/UPI info
                const u = response.data.user;
                if (u) {
                    setPayoutForm((prev) => ({
                        ...prev,
                        bank_name: u.bank_name || '',
                        account_number: u.account_number || '',
                        ifsc_code: u.ifsc_code || '',
                        upi_id: u.upi_id || ''
                    }));
                }
            } else {
                showMessage('Error', response.data?.msg || 'Unable to fetch user data');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            showMessage('Error', error.response ? error.response.data?.msg || error.response.data : error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDetails();
    }, [rawId, token]);

    const user = userData?.user;
    const stats = userData?.stats || {};
    const addresses = userData?.addresses || [];
    const socials = userData?.socials || [];
    const savedPackages = userData?.saved_packages || [];
    const bookings = userData?.bookings || [];
    const holidayEnquiries = userData?.holiday_enquiries || [];
    const corporateEnquiries = userData?.corporate_enquiries || [];
    const walletTransactions = userData?.wallet_transactions || [];
    const withdrawalRequests = userData?.withdrawal_requests || [];
    const referredUsers = userData?.referred_users || [];
    const referralTransactions = userData?.referral_transactions || [];

    const isCorporate = user?.user_type === 2 || user?.type === 2 || corporateEnquiries.length > 0;
    const isAgent = user?.user_type === 3 || user?.type === 3;
    const currentWalletBalance = parseFloat(user?.wallet_balance) || 0;

    // Handle Release Payout Submit
    const handleReleasePayoutSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(payoutForm.amount);
        if (isNaN(amt) || amt <= 0) {
            toast.error('Please enter a valid payout amount greater than ₹0.');
            return;
        }
        if (amt > currentWalletBalance) {
            toast.error(`Insufficient balance. Maximum available is ₹${currentWalletBalance.toLocaleString('en-IN')}`);
            return;
        }

        try {
            setPayoutSubmitting(true);
            const res = await axios.post(
                releaseWalletPayoutUrl,
                {
                    user_id: user.id,
                    amount: amt,
                    payment_method: payoutForm.payment_method,
                    transaction_ref: payoutForm.transaction_ref,
                    admin_remarks: payoutForm.admin_remarks,
                    bank_name: payoutForm.bank_name,
                    account_number: payoutForm.account_number,
                    ifsc_code: payoutForm.ifsc_code,
                    upi_id: payoutForm.upi_id
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (res.data?.status) {
                toast.success(res.data?.msg || 'Wallet payout released successfully!');
                setPayoutModalOpen(false);
                setPayoutForm((prev) => ({ ...prev, amount: '', transaction_ref: '', admin_remarks: '' }));
                fetchUserDetails();
            } else {
                toast.error(res.data?.msg || 'Failed to release payout.');
            }
        } catch (err) {
            console.error('Payout release error:', err);
            toast.error(err.response?.data?.msg || err.message || 'Error processing payout.');
        } finally {
            setPayoutSubmitting(false);
        }
    };

    // Handle Approve/Reject Withdrawal Request
    const handleProcessWithdrawalRequest = async (requestId, action) => {
        const confirmMsg = action === 'APPROVE'
            ? 'Are you sure you want to APPROVE and complete this withdrawal payout?'
            : 'Are you sure you want to REJECT this withdrawal request?';

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await axios.post(
                processWithdrawalRequestUrl,
                { request_id: requestId, action },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (res.data?.status) {
                toast.success(res.data?.msg || `Withdrawal ${action.toLowerCase()}d successfully.`);
                fetchUserDetails();
            } else {
                toast.error(res.data?.msg || 'Failed to process request.');
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message || 'Error processing withdrawal request.');
        }
    };

    // Filtered lists for table search
    const filteredBookings = bookings.filter((b) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
            (b.package_name || '').toLowerCase().includes(q) ||
            (b.id || '').toString().includes(q) ||
            (b.payment_method || '').toLowerCase().includes(q) ||
            (b.razorpay_payment_id || '').toLowerCase().includes(q)
        );
    });

    const filteredHolidayEnquiries = holidayEnquiries.filter((e) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
            (e.destination || '').toLowerCase().includes(q) ||
            (e.trip_type || '').toLowerCase().includes(q) ||
            (e.booking_ref || '').toLowerCase().includes(q) ||
            (e.city || '').toLowerCase().includes(q)
        );
    });

    const filteredCorporateEnquiries = corporateEnquiries.filter((c) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
            (c.company_name || '').toLowerCase().includes(q) ||
            (c.destination || '').toLowerCase().includes(q) ||
            (c.booking_reference || '').toLowerCase().includes(q) ||
            (c.city || '').toLowerCase().includes(q)
        );
    });

    const filteredSavedPackages = savedPackages.filter((p) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
            (p.package_name || '').toLowerCase().includes(q) ||
            (p.destination_name || '').toLowerCase().includes(q) ||
            (p.package_type_name || '').toLowerCase().includes(q)
        );
    });

    const filteredWalletTransactions = walletTransactions.filter((w) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
            (w.description || '').toLowerCase().includes(q) ||
            (w.source || '').toLowerCase().includes(q) ||
            (w.type || '').toLowerCase().includes(q) ||
            (w.booking_id || '').toString().includes(q)
        );
    });

    const filteredReferredUsers = referredUsers.filter((u) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
            `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q)
        );
    });

    const filteredReferralTransactions = referralTransactions.filter((r) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
            `${r.referred_first_name || ''} ${r.referred_last_name || ''}`.toLowerCase().includes(q) ||
            (r.package_name || '').toLowerCase().includes(q) ||
            (r.booking_id || '').toString().includes(q)
        );
    });

    const formatCurrency = (num) => {
        return '₹' + Number(num || 0).toLocaleString('en-IN');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="container-xxl py-5 text-center">
                <LoadingComponent />
                <p className="text-muted mt-3">Loading user profile &amp; activity...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container-xxl py-5">
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                    <i className="ri-user-unfollow-line fs-1 text-danger mb-3"></i>
                    <h5 className="fw-bold text-dark">User Not Found</h5>
                    <p className="text-muted mb-4">
                        The requested user profile (ID: {decodedId || rawId}) could not be located in the database.
                    </p>
                    <div>
                        <Link href="/users" className="btn btn-primary rounded-pill px-4">
                            <i className="ri-arrow-left-line me-1"></i> Back to All Users
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Top Breadcrumb & Page Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <Link href="/users" className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1">
                            <i className="ri-arrow-left-line me-1"></i> All Users
                        </Link>
                        <span className="text-muted">/</span>
                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2.5 py-1">
                            User #{user.id}
                        </span>
                        {isCorporate && (
                            <span className="badge bg-info bg-opacity-15 text-info-emphasis rounded-pill px-2.5 py-1">
                                🏢 Corporate User
                            </span>
                        )}
                        {isAgent && (
                            <span className="badge bg-warning bg-opacity-20 text-warning-emphasis rounded-pill px-2.5 py-1">
                                🤝 B2B Agent
                            </span>
                        )}
                    </div>
                    <h4 className="fw-bold text-dark mb-0">
                        {user.first_name} {user.last_name || ''}
                    </h4>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setPayoutForm((prev) => ({
                                ...prev,
                                amount: currentWalletBalance > 0 ? currentWalletBalance.toString() : '',
                                bank_name: user.bank_name || '',
                                account_number: user.account_number || '',
                                ifsc_code: user.ifsc_code || '',
                                upi_id: user.upi_id || ''
                            }));
                            setPayoutModalOpen(true);
                        }}
                        className="btn btn-success btn-sm rounded-pill px-3.5 d-inline-flex align-items-center gap-1.5 shadow-sm"
                        disabled={currentWalletBalance <= 0}
                        title={currentWalletBalance <= 0 ? 'No balance available to release' : 'Release wallet payout'}
                    >
                        <i className="ri-hand-coin-line fs-6"></i>
                        <span className="fw-semibold">Release Payout</span>
                    </button>
                    <Link
                        href={`/crm/whatsapp?phone=${user.phone || ''}`}
                        className="btn btn-outline-success btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5"
                    >
                        <i className="ri-whatsapp-line fs-6"></i>
                        <span>WhatsApp</span>
                    </Link>
                    <Link
                        href={`/crm/chat`}
                        className="btn btn-primary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri-chat-smile-2-line fs-6"></i>
                        <span>Team Chat</span>
                    </Link>
                </div>
            </div>

            <div className="row g-4">
                {/* ================================================================= */}
                {/* LEFT COLUMN: USER CARD & QUICK SUMMARY                             */}
                {/* ================================================================= */}
                <div className="col-12 col-lg-4 col-xl-4">
                    <UserCard user={user} stats={stats} addresses={addresses} />

                    {/* Wallet & Referral Quick Box */}
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                            <h6 className="fw-bold text-dark mb-0 small d-flex align-items-center gap-1.5">
                                <i className="ri-wallet-3-line text-success"></i>
                                <span>Wallet &amp; Earnings</span>
                            </h6>
                            <button
                                type="button"
                                onClick={() => setActiveTab('wallet')}
                                className="btn btn-link btn-xs text-primary p-0 text-decoration-none fw-semibold"
                            >
                                History
                            </button>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-3 bg-success bg-opacity-10 rounded-3 mb-3 border border-success border-opacity-20">
                            <div>
                                <small className="text-muted d-block text-xs">Current Wallet Balance</small>
                                <h4 className="fw-bold text-success mb-0">{formatCurrency(user.wallet_balance)}</h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setPayoutForm((prev) => ({
                                        ...prev,
                                        amount: currentWalletBalance > 0 ? currentWalletBalance.toString() : '',
                                        bank_name: user.bank_name || '',
                                        account_number: user.account_number || '',
                                        ifsc_code: user.ifsc_code || '',
                                        upi_id: user.upi_id || ''
                                    }));
                                    setPayoutModalOpen(true);
                                }}
                                className="btn btn-success btn-xs rounded-pill px-2.5 py-1 fw-semibold"
                                disabled={currentWalletBalance <= 0}
                            >
                                Payout
                            </button>
                        </div>
                        <ul className="list-unstyled d-flex flex-column gap-2 small mb-0">
                            <li className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Referral Code:</span>
                                <span className="badge bg-light text-primary border fw-semibold">
                                    {user.referral_code || user.referralcode || 'None'}
                                </span>
                            </li>
                            <li className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Direct Referrals:</span>
                                <span className="fw-bold text-dark">{referredUsers.length} Users</span>
                            </li>
                            <li className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Referral Earnings:</span>
                                <span className="fw-bold text-success">{formatCurrency(stats.total_referral_earnings)}</span>
                            </li>
                            {user.bank_name && (
                                <li className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">Bank:</span>
                                    <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '140px' }}>{user.bank_name}</span>
                                </li>
                            )}
                            {user.upi_id && (
                                <li className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">UPI ID:</span>
                                    <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '140px' }}>{user.upi_id}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* ================================================================= */}
                {/* RIGHT COLUMN: INTERACTIVE ACTIVITY TABS                           */}
                {/* ================================================================= */}
                <div className="col-12 col-lg-8 col-xl-8">
                    {/* Top Tab Pills */}
                    <div className="card border-0 shadow-sm rounded-4 p-2 bg-white mb-3">
                        <ul className="nav nav-pills nav-fill flex-nowrap overflow-auto gap-1">
                            <li className="nav-item">
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('overview'); setSearchFilter(''); }}
                                    className={`nav-link rounded-pill px-3 py-2 small fw-semibold text-nowrap d-flex align-items-center justify-content-center gap-1.5 ${
                                        activeTab === 'overview' ? 'active bg-primary text-white' : 'text-muted'
                                    }`}
                                    style={activeTab === 'overview' ? { backgroundColor: '#0066cc' } : {}}
                                >
                                    <i className="ri-dashboard-line"></i>
                                    <span>Overview</span>
                                </button>
                            </li>

                            {isCorporate && (
                                <li className="nav-item">
                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab('corporate'); setSearchFilter(''); }}
                                        className={`nav-link rounded-pill px-3 py-2 small fw-semibold text-nowrap d-flex align-items-center justify-content-center gap-1.5 ${
                                            activeTab === 'corporate' ? 'active bg-primary text-white' : 'text-muted'
                                        }`}
                                        style={activeTab === 'corporate' ? { backgroundColor: '#1e3c72' } : {}}
                                    >
                                        <i className="ri-building-line"></i>
                                        <span>Corporate</span>
                                        {corporateEnquiries.length > 0 && (
                                            <span className="badge bg-info text-dark rounded-pill ms-1" style={{ fontSize: '10px' }}>
                                                {corporateEnquiries.length}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            )}

                            <li className="nav-item">
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('bookings'); setSearchFilter(''); }}
                                    className={`nav-link rounded-pill px-3 py-2 small fw-semibold text-nowrap d-flex align-items-center justify-content-center gap-1.5 ${
                                        activeTab === 'bookings' ? 'active bg-primary text-white' : 'text-muted'
                                    }`}
                                    style={activeTab === 'bookings' ? { backgroundColor: '#0066cc' } : {}}
                                >
                                    <i className="ri-calendar-check-line"></i>
                                    <span>Bookings</span>
                                    <span className="badge bg-light text-dark rounded-pill ms-1" style={{ fontSize: '10px' }}>
                                        {bookings.length}
                                    </span>
                                </button>
                            </li>

                            <li className="nav-item">
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('enquiries'); setSearchFilter(''); }}
                                    className={`nav-link rounded-pill px-3 py-2 small fw-semibold text-nowrap d-flex align-items-center justify-content-center gap-1.5 ${
                                        activeTab === 'enquiries' ? 'active bg-primary text-white' : 'text-muted'
                                    }`}
                                    style={activeTab === 'enquiries' ? { backgroundColor: '#0066cc' } : {}}
                                >
                                    <i className="ri-customer-service-2-line"></i>
                                    <span>Enquiries</span>
                                    <span className="badge bg-light text-dark rounded-pill ms-1" style={{ fontSize: '10px' }}>
                                        {holidayEnquiries.length}
                                    </span>
                                </button>
                            </li>

                            <li className="nav-item">
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('saved'); setSearchFilter(''); }}
                                    className={`nav-link rounded-pill px-3 py-2 small fw-semibold text-nowrap d-flex align-items-center justify-content-center gap-1.5 ${
                                        activeTab === 'saved' ? 'active bg-primary text-white' : 'text-muted'
                                    }`}
                                    style={activeTab === 'saved' ? { backgroundColor: '#0066cc' } : {}}
                                >
                                    <i className="ri-heart-3-line"></i>
                                    <span>Saved</span>
                                    <span className="badge bg-light text-dark rounded-pill ms-1" style={{ fontSize: '10px' }}>
                                        {savedPackages.length}
                                    </span>
                                </button>
                            </li>

                            {/* WALLET HISTORY TAB */}
                            <li className="nav-item">
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('wallet'); setSearchFilter(''); }}
                                    className={`nav-link rounded-pill px-3 py-2 small fw-semibold text-nowrap d-flex align-items-center justify-content-center gap-1.5 ${
                                        activeTab === 'wallet' ? 'active bg-success text-white' : 'text-muted'
                                    }`}
                                    style={activeTab === 'wallet' ? { backgroundColor: '#198754' } : {}}
                                >
                                    <i className="ri-wallet-3-line"></i>
                                    <span>Wallet History</span>
                                    {walletTransactions.length > 0 && (
                                        <span className="badge bg-light text-dark rounded-pill ms-1" style={{ fontSize: '10px' }}>
                                            {walletTransactions.length}
                                        </span>
                                    )}
                                </button>
                            </li>

                            {/* REFERRAL HISTORY TAB */}
                            <li className="nav-item">
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('referrals'); setSearchFilter(''); }}
                                    className={`nav-link rounded-pill px-3 py-2 small fw-semibold text-nowrap d-flex align-items-center justify-content-center gap-1.5 ${
                                        activeTab === 'referrals' ? 'active bg-warning text-dark' : 'text-muted'
                                    }`}
                                    style={activeTab === 'referrals' ? { backgroundColor: '#ffc107', color: '#000' } : {}}
                                >
                                    <i className="ri-share-forward-line"></i>
                                    <span>Referrals</span>
                                    {referredUsers.length > 0 && (
                                        <span className="badge bg-dark text-white rounded-pill ms-1" style={{ fontSize: '10px' }}>
                                            {referredUsers.length}
                                        </span>
                                    )}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Tab 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="d-flex flex-column gap-3">
                            {/* Stats Highlights Banner */}
                            <div className="row g-3">
                                <div className="col-12 col-sm-6 col-md-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <small className="text-muted d-block text-xs">Total Bookings</small>
                                                <h4 className="fw-bold text-dark mb-0">{stats.total_bookings || 0}</h4>
                                                <small className="text-success fw-semibold">
                                                    Spent: {formatCurrency(stats.total_spent)}
                                                </small>
                                            </div>
                                            <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3">
                                                <i className="ri-briefcase-line fs-4"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 col-sm-6 col-md-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <small className="text-muted d-block text-xs">Package Queries</small>
                                                <h4 className="fw-bold text-dark mb-0">{stats.total_enquiries || 0}</h4>
                                                <small className="text-muted">Holiday &amp; Custom</small>
                                            </div>
                                            <div className="rounded-circle bg-warning bg-opacity-15 text-warning-emphasis p-3">
                                                <i className="ri-question-answer-line fs-4"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 col-sm-6 col-md-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <small className="text-muted d-block text-xs">Wallet Balance</small>
                                                <h4 className="fw-bold text-success mb-0">{formatCurrency(user.wallet_balance)}</h4>
                                                <small className="text-muted">Earned: {formatCurrency(stats.total_wallet_credits)}</small>
                                            </div>
                                            <div className="rounded-circle bg-success bg-opacity-10 text-success p-3">
                                                <i className="ri-wallet-3-line fs-4"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bio / About Box */}
                            {user.bio && (
                                <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white">
                                    <h6 className="fw-bold text-dark mb-2 small">About / Bio</h6>
                                    <p className="text-muted mb-0 small" style={{ lineHeight: '1.6' }}>
                                        {user.bio}
                                    </p>
                                </div>
                            )}

                            {/* Recent Bookings Quick Preview */}
                            <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold text-dark mb-0 small d-flex align-items-center gap-1.5">
                                        <i className="ri-history-line text-primary"></i>
                                        <span>Recent Booking Activity</span>
                                    </h6>
                                    {bookings.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('bookings')}
                                            className="btn btn-link btn-xs text-primary p-0 text-decoration-none fw-semibold"
                                        >
                                            View all ({bookings.length})
                                        </button>
                                    )}
                                </div>

                                {bookings.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <i className="ri-calendar-todo-line fs-2 opacity-40 d-block mb-1"></i>
                                        <small>No package bookings on record yet.</small>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {bookings.slice(0, 3).map((b) => (
                                            <div key={b.id} className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center border">
                                                <div>
                                                    <h6 className="fw-bold text-dark mb-0.5 small">{b.package_name || `Package #${b.package_id}`}</h6>
                                                    <small className="text-muted text-xs">
                                                        Departure: {formatDate(b.departure_date)} • Travelers: {b.total_travelers || 1}
                                                    </small>
                                                </div>
                                                <div className="text-end">
                                                    <h6 className="fw-bold text-success mb-0 small">{formatCurrency(b.total_cost)}</h6>
                                                    <span className={`badge rounded-pill px-2 py-0.5 ${b.booking_status === 2 ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '10px' }}>
                                                        {b.booking_status === 2 ? 'Confirmed' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 2: CORPORATE DETAILS */}
                    {activeTab === 'corporate' && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                                <div>
                                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri-building-4-line text-primary"></i>
                                        <span>Corporate Profile &amp; Lead Inquiries</span>
                                    </h5>
                                    <small className="text-muted">
                                        Corporate group packages, offsites, employee counts, and enterprise enquiries.
                                    </small>
                                </div>
                            </div>

                            {/* Corporate Enquiries List */}
                            {filteredCorporateEnquiries.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ri-building-line fs-1 d-block opacity-40 mb-2"></i>
                                    <h6 className="fw-bold text-dark">No Corporate Enquiries</h6>
                                    <p className="small text-muted mb-0">No enterprise inquiries have been logged for this user.</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {filteredCorporateEnquiries.map((corp) => (
                                        <div key={corp.id} className="p-3.5 bg-light rounded-4 border">
                                            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                                                <div>
                                                    <span className="badge bg-primary text-white rounded-pill px-2.5 py-0.5 mb-1" style={{ fontSize: '10.5px' }}>
                                                        {corp.booking_reference || `CORP-#${corp.id}`}
                                                    </span>
                                                    <h6 className="fw-bold text-dark mb-0">
                                                        {corp.company_name || user.first_name} • {corp.trip_type || 'Corporate Offsite'}
                                                    </h6>
                                                    <small className="text-muted">
                                                        Destination: <strong>{corp.destination}</strong> • City: {corp.departure_city || corp.city || 'Kolkata'}
                                                    </small>
                                                </div>
                                                <span className="badge bg-warning bg-opacity-25 text-dark rounded-pill px-2.5 py-1">
                                                    {corp.status || 'PENDING'}
                                                </span>
                                            </div>

                                            <div className="row g-2 pt-2 border-top mt-2 small text-muted">
                                                <div className="col-6 col-md-3">
                                                    <span>📅 Departure:</span> <strong className="text-dark d-block">{formatDate(corp.departure_date)}</strong>
                                                </div>
                                                <div className="col-6 col-md-3">
                                                    <span>👥 Group Size:</span> <strong className="text-dark d-block">{corp.total_employees || corp.adults_count || 'Flexible'} Employees</strong>
                                                </div>
                                                <div className="col-6 col-md-3">
                                                    <span>🏨 Stay:</span> <strong className="text-dark d-block">{corp.hotel_category || 'Resort'}</strong>
                                                </div>
                                                <div className="col-6 col-md-3">
                                                    <span>🚌 Transport:</span> <strong className="text-dark d-block">{corp.cab_type || 'AC Bus'}</strong>
                                                </div>
                                            </div>

                                            {corp.special_notes && (
                                                <div className="mt-2.5 p-2 bg-white rounded-3 border text-xs text-muted">
                                                    <strong>Requirements:</strong> {corp.special_notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: BOOKED PACKAGES */}
                    {activeTab === 'bookings' && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                <div>
                                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri-calendar-check-line text-success"></i>
                                        <span>Booked Packages &amp; Reservations</span>
                                    </h5>
                                    <small className="text-muted">All confirmed bookings and payment history for this customer.</small>
                                </div>
                                <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                                    <span className="input-group-text bg-light border-end-0"><i className="ri-search-line text-muted"></i></span>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm bg-light border-start-0"
                                        placeholder="Search bookings..."
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredBookings.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ri-calendar-close-line fs-1 d-block opacity-40 mb-2"></i>
                                    <h6 className="fw-bold text-dark">No Bookings Found</h6>
                                    <p className="small text-muted mb-0">No booking records matched your search filter.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light text-xs text-muted">
                                            <tr>
                                                <th>Package</th>
                                                <th>Departure Date</th>
                                                <th>Travelers</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Payment</th>
                                                <th className="text-end">Invoice</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBookings.map((b) => (
                                                <tr key={b.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2.5">
                                                            {b.package_image ? (
                                                                <img
                                                                    src={b.package_image.startsWith('http') ? b.package_image : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002'}${b.package_image}`}
                                                                    alt="pkg"
                                                                    className="rounded-3"
                                                                    style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold"
                                                                    style={{ width: '42px', height: '42px' }}
                                                                >
                                                                    <i className="ri-image-line fs-5"></i>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h6 className="fw-bold text-dark mb-0 small">
                                                                    {b.package_name || `Package #${b.package_id}`}
                                                                </h6>
                                                                <small className="text-muted text-xs">Booking ID: #{b.id}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="small text-dark fw-semibold">
                                                        {formatDate(b.departure_date)}
                                                    </td>
                                                    <td className="small">
                                                        <span className="badge bg-light text-dark border">
                                                            {b.total_travelers || 1} Travelers
                                                        </span>
                                                    </td>
                                                    <td className="small fw-bold text-success">
                                                        {formatCurrency(b.total_cost)}
                                                    </td>
                                                    <td>
                                                        <span className={`badge rounded-pill px-2 py-0.5 ${b.booking_status === 2 ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '10px' }}>
                                                            {b.booking_status === 2 ? 'Confirmed' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge rounded-pill px-2 py-0.5 ${b.payment_status === 1 ? 'bg-success text-white' : 'bg-secondary text-white'}`} style={{ fontSize: '10px' }}>
                                                            {b.payment_status === 1 ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <Link
                                                            href={`/crm/invoices?search=${encodeURIComponent(b.customer_name || user.first_name)}`}
                                                            className="btn btn-outline-primary btn-xs rounded-pill px-2.5"
                                                            title="View Invoice"
                                                        >
                                                            <i className="ri-file-text-line me-1"></i>
                                                            Invoice
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: HOLIDAY & CUSTOM ENQUIRIES */}
                    {activeTab === 'enquiries' && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                <div>
                                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri-customer-service-2-line text-warning"></i>
                                        <span>Custom Holiday &amp; Package Enquiries</span>
                                    </h5>
                                    <small className="text-muted">Custom package requests, personalized itineraries, and trip preferences.</small>
                                </div>
                                <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                                    <span className="input-group-text bg-light border-end-0"><i className="ri-search-line text-muted"></i></span>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm bg-light border-start-0"
                                        placeholder="Search enquiries..."
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredHolidayEnquiries.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ri-question-answer-line fs-1 d-block opacity-40 mb-2"></i>
                                    <h6 className="fw-bold text-dark">No Enquiries Found</h6>
                                    <p className="small text-muted mb-0">No holiday enquiries on record for this user.</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {filteredHolidayEnquiries.map((enq) => (
                                        <div key={enq.id} className="p-3.5 bg-light rounded-4 border">
                                            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                                                <div>
                                                    <span className="badge bg-warning bg-opacity-25 text-dark rounded-pill px-2.5 py-0.5 mb-1" style={{ fontSize: '10.5px' }}>
                                                        {enq.booking_ref || `ENQ-#${enq.id}`}
                                                    </span>
                                                    <h6 className="fw-bold text-dark mb-0">
                                                        {enq.destination || 'Custom Sundarban Holiday'} • {enq.trip_type || 'Family Holiday'}
                                                    </h6>
                                                    <small className="text-muted">
                                                        From: <strong>{enq.departure_city || enq.city || 'Kolkata'}</strong> • Created: {formatDate(enq.created_at)}
                                                    </small>
                                                </div>
                                                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2.5 py-1">
                                                    {enq.status || 'PENDING'}
                                                </span>
                                            </div>

                                            <div className="row g-2 pt-2 border-top mt-2 small text-muted">
                                                <div className="col-6 col-md-3">
                                                    <span>📅 Travel Date:</span> <strong className="text-dark d-block">{formatDate(enq.departure_date || enq.travel_date)}</strong>
                                                </div>
                                                <div className="col-6 col-md-3">
                                                    <span>👥 Travelers:</span> <strong className="text-dark d-block">{enq.adults_count || enq.adults || 2} Adults, {enq.children_count || enq.children || 0} Kids</strong>
                                                </div>
                                                <div className="col-6 col-md-3">
                                                    <span>🏨 Stay Category:</span> <strong className="text-dark d-block">{enq.hotel_category || 'Standard'}</strong>
                                                </div>
                                                <div className="col-6 col-md-3">
                                                    <span>🚗 Cab / Vehicle:</span> <strong className="text-dark d-block">{enq.cab_type || 'AC Sedan'}</strong>
                                                </div>
                                            </div>

                                            {enq.message && (
                                                <div className="mt-2.5 p-2 bg-white rounded-3 border text-xs text-muted">
                                                    <strong>Message:</strong> {enq.message}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 5: SAVED PACKAGES (WISHLIST) */}
                    {activeTab === 'saved' && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                <div>
                                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri-heart-3-line text-danger"></i>
                                        <span>Saved Packages (Wishlist)</span>
                                    </h5>
                                    <small className="text-muted">Packages bookmarked by this user for future trips.</small>
                                </div>
                                <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                                    <span className="input-group-text bg-light border-end-0"><i className="ri-search-line text-muted"></i></span>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm bg-light border-start-0"
                                        placeholder="Search saved..."
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredSavedPackages.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ri-heart-add-line fs-1 d-block opacity-40 mb-2"></i>
                                    <h6 className="fw-bold text-dark">No Saved Packages</h6>
                                    <p className="small text-muted mb-0">This user has not wishlisted any safari packages yet.</p>
                                </div>
                            ) : (
                                <div className="row g-3">
                                    {filteredSavedPackages.map((pkg) => (
                                        <div key={pkg.saved_id} className="col-12 col-md-6">
                                            <div className="card border rounded-4 overflow-hidden h-100 shadow-2xs hover-shadow transition-all">
                                                <div className="position-relative" style={{ height: '140px', backgroundColor: '#e2e8f0' }}>
                                                    {pkg.package_image ? (
                                                        <img
                                                            src={pkg.package_image.startsWith('http') ? pkg.package_image : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002'}${pkg.package_image}`}
                                                            alt={pkg.package_name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                                            <i className="ri-image-line fs-1 opacity-50"></i>
                                                        </div>
                                                    )}
                                                    <span className="position-absolute top-0 end-0 m-2 badge bg-danger text-white rounded-pill px-2 py-0.5 text-xs">
                                                        ❤️ Saved
                                                    </span>
                                                    {pkg.package_type_name && (
                                                        <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark bg-opacity-75 text-white rounded-pill px-2 py-0.5 text-xs">
                                                            {pkg.package_type_name}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                                                    <div>
                                                        <h6 className="fw-bold text-dark mb-1 small">{pkg.package_name || `Package #${pkg.package_id}`}</h6>
                                                        <small className="text-muted d-block mb-2">
                                                            📍 {pkg.destination_name || 'Sundarban'} • ⏱ {pkg.duration || 1}D / {pkg.duration_night || 0}N
                                                        </small>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                                        <div>
                                                            <span className="fw-bold text-success small">{formatCurrency(pkg.offer_price || pkg.price)}</span>
                                                            {pkg.offer_price && pkg.price && (
                                                                <small className="text-muted text-decoration-line-through ms-1" style={{ fontSize: '11px' }}>
                                                                    {formatCurrency(pkg.price)}
                                                                </small>
                                                            )}
                                                        </div>
                                                        <Link
                                                            href={`/packages/view?id=${pkg.package_id}`}
                                                            className="btn btn-outline-primary btn-xs rounded-pill px-2.5"
                                                        >
                                                            View Package
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 6: WALLET HISTORY */}
                    {activeTab === 'wallet' && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                <div>
                                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri-wallet-3-line text-success"></i>
                                        <span>Wallet Balance &amp; Transaction History</span>
                                    </h5>
                                    <small className="text-muted">Commission credits, refunds, referral rewards, and payout ledger.</small>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPayoutForm((prev) => ({
                                                ...prev,
                                                amount: currentWalletBalance > 0 ? currentWalletBalance.toString() : '',
                                                bank_name: user.bank_name || '',
                                                account_number: user.account_number || '',
                                                ifsc_code: user.ifsc_code || '',
                                                upi_id: user.upi_id || ''
                                            }));
                                            setPayoutModalOpen(true);
                                        }}
                                        className="btn btn-success btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                        disabled={currentWalletBalance <= 0}
                                    >
                                        <i className="ri-hand-coin-line"></i>
                                        <span>Release Payout</span>
                                    </button>
                                    <div className="input-group input-group-sm" style={{ maxWidth: '200px' }}>
                                        <span className="input-group-text bg-light border-end-0"><i className="ri-search-line text-muted"></i></span>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm bg-light border-start-0"
                                            placeholder="Search ledger..."
                                            value={searchFilter}
                                            onChange={(e) => setSearchFilter(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Summary KPI Row */}
                            <div className="row g-3 mb-4">
                                <div className="col-12 col-md-4">
                                    <div className="p-3 bg-success bg-opacity-10 rounded-4 border border-success border-opacity-25 d-flex justify-content-between align-items-center">
                                        <div>
                                            <small className="text-muted d-block text-xs">Available Wallet Balance</small>
                                            <h3 className="fw-bold text-success mb-0">{formatCurrency(user.wallet_balance)}</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPayoutForm((prev) => ({
                                                    ...prev,
                                                    amount: currentWalletBalance > 0 ? currentWalletBalance.toString() : '',
                                                    bank_name: user.bank_name || '',
                                                    account_number: user.account_number || '',
                                                    ifsc_code: user.ifsc_code || '',
                                                    upi_id: user.upi_id || ''
                                                }));
                                                setPayoutModalOpen(true);
                                            }}
                                            className="btn btn-success btn-sm rounded-pill px-3 shadow-2xs"
                                            disabled={currentWalletBalance <= 0}
                                        >
                                            Payout
                                        </button>
                                    </div>
                                </div>
                                <div className="col-6 col-md-4">
                                    <div className="p-3 bg-light rounded-4 border">
                                        <small className="text-muted d-block text-xs">Total Credits (Earned)</small>
                                        <h5 className="fw-bold text-success mb-0">+{formatCurrency(stats.total_wallet_credits)}</h5>
                                    </div>
                                </div>
                                <div className="col-6 col-md-4">
                                    <div className="p-3 bg-light rounded-4 border">
                                        <small className="text-muted d-block text-xs">Total Debits (Withdrawn)</small>
                                        <h5 className="fw-bold text-danger mb-0">-{formatCurrency(stats.total_wallet_debits)}</h5>
                                    </div>
                                </div>
                            </div>

                            {/* Withdrawal Requests Sub-section */}
                            {withdrawalRequests.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="fw-bold text-dark mb-2.5 small d-flex align-items-center gap-1.5">
                                        <i className="ri-bank-line text-primary"></i>
                                        <span>Payout &amp; Withdrawal Requests ({withdrawalRequests.length})</span>
                                    </h6>
                                    <div className="table-responsive bg-light rounded-3 p-2 border">
                                        <table className="table table-sm table-hover align-middle mb-0">
                                            <thead className="table-light text-xs text-muted">
                                                <tr>
                                                    <th>Request Date</th>
                                                    <th>Amount</th>
                                                    <th>Account / UPI</th>
                                                    <th>Status</th>
                                                    <th>Reference</th>
                                                    <th className="text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {withdrawalRequests.map((wr) => (
                                                    <tr key={wr.id}>
                                                        <td className="small text-muted">{formatDate(wr.created_at)}</td>
                                                        <td className="small fw-bold text-dark">{formatCurrency(wr.amount)}</td>
                                                        <td className="small text-muted">
                                                            {wr.upi_id ? `UPI: ${wr.upi_id}` : `${wr.bank_name || 'Bank'} (${wr.account_number || ''})`}
                                                        </td>
                                                        <td>
                                                            <span className={`badge rounded-pill px-2 py-0.5 ${wr.status === 'COMPLETED' || wr.status === 'APPROVED' ? 'bg-success text-white' : wr.status === 'REJECTED' ? 'bg-danger text-white' : 'bg-warning text-dark'}`} style={{ fontSize: '10px' }}>
                                                                {wr.status || 'PENDING'}
                                                            </span>
                                                        </td>
                                                        <td className="small text-muted">{wr.transaction_ref || '—'}</td>
                                                        <td className="text-end">
                                                            {(!wr.status || wr.status === 'PENDING') && (
                                                                <div className="d-flex justify-content-end gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleProcessWithdrawalRequest(wr.id, 'APPROVE')}
                                                                        className="btn btn-success btn-xs rounded-pill px-2"
                                                                        title="Approve & Release Funds"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleProcessWithdrawalRequest(wr.id, 'REJECT')}
                                                                        className="btn btn-outline-danger btn-xs rounded-pill px-2"
                                                                        title="Reject Request"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Wallet Transactions Table */}
                            <h6 className="fw-bold text-dark mb-2.5 small d-flex align-items-center gap-1.5">
                                <i className="ri-history-line text-secondary"></i>
                                <span>Complete Transaction Ledger ({walletTransactions.length})</span>
                            </h6>

                            {filteredWalletTransactions.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ri-file-list-3-line fs-1 d-block opacity-40 mb-2"></i>
                                    <h6 className="fw-bold text-dark">No Wallet Transactions</h6>
                                    <p className="small text-muted mb-0">No wallet credits or debits recorded for this account yet.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light text-xs text-muted">
                                            <tr>
                                                <th>Date &amp; Time</th>
                                                <th>Transaction ID</th>
                                                <th>Type</th>
                                                <th>Source</th>
                                                <th>Description</th>
                                                <th className="text-end">Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredWalletTransactions.map((w) => {
                                                const isCredit = (w.type || '').toUpperCase() === 'CREDIT';
                                                return (
                                                    <tr key={w.id}>
                                                        <td className="small text-muted">
                                                            {formatDateTime(w.created_at)}
                                                        </td>
                                                        <td className="small fw-semibold text-dark">
                                                            #{w.id}
                                                        </td>
                                                        <td>
                                                            <span className={`badge rounded-pill px-2 py-0.5 ${isCredit ? 'bg-success text-white' : 'bg-danger text-white'}`} style={{ fontSize: '10px' }}>
                                                                {isCredit ? '⬆ Credit' : '⬇ Debit'}
                                                            </span>
                                                        </td>
                                                        <td className="small text-muted">
                                                            {w.source || 'Commission'}
                                                        </td>
                                                        <td className="small text-dark" style={{ maxWidth: '280px' }}>
                                                            {w.description || 'Wallet transaction'}
                                                            {w.booking_id && (
                                                                <small className="d-block text-muted text-xs">
                                                                    Booking #{w.booking_id} {w.booking_customer_name ? `• ${w.booking_customer_name}` : ''}
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td className={`small fw-bold text-end ${isCredit ? 'text-success' : 'text-danger'}`}>
                                                            {isCredit ? '+' : '-'}{formatCurrency(w.amount)}
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-light text-success border rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                                                                {w.status || 'COMPLETED'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 7: REFERRAL HISTORY & NETWORK */}
                    {activeTab === 'referrals' && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                <div>
                                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri-share-forward-line text-warning"></i>
                                        <span>Referral Program &amp; Network History</span>
                                    </h5>
                                    <small className="text-muted">Referred users, signups via referral code, and commission logs.</small>
                                </div>
                                <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                                    <span className="input-group-text bg-light border-end-0"><i className="ri-search-line text-muted"></i></span>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm bg-light border-start-0"
                                        placeholder="Search referrals..."
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Referral Info Card Banner */}
                            <div className="p-3 bg-warning bg-opacity-10 rounded-4 border border-warning border-opacity-25 d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle bg-warning text-dark p-2.5 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                                        <i className="ri-gift-fill fs-4"></i>
                                    </div>
                                    <div>
                                        <small className="text-muted d-block text-xs">Unique Referral Code</small>
                                        <h5 className="fw-bold text-dark mb-0 font-monospace">
                                            {user.referral_code || user.referralcode || 'N/A'}
                                        </h5>
                                    </div>
                                </div>
                                <div className="d-flex gap-3 text-end">
                                    <div>
                                        <small className="text-muted d-block text-xs">Referred Users</small>
                                        <h4 className="fw-bold text-dark mb-0">{referredUsers.length}</h4>
                                    </div>
                                    <div className="border-start ps-3">
                                        <small className="text-muted d-block text-xs">Total Earnings</small>
                                        <h4 className="fw-bold text-success mb-0">{formatCurrency(stats.total_referral_earnings)}</h4>
                                    </div>
                                </div>
                            </div>

                            {/* Referred Users Table */}
                            <h6 className="fw-bold text-dark mb-2.5 small d-flex align-items-center gap-1.5">
                                <i className="ri-team-line text-primary"></i>
                                <span>Referred Users Network ({referredUsers.length})</span>
                            </h6>

                            {filteredReferredUsers.length === 0 ? (
                                <div className="text-center py-4 text-muted bg-light rounded-3 mb-4">
                                    <i className="ri-user-shared-line fs-2 opacity-40 d-block mb-1"></i>
                                    <small>No referred users on record yet.</small>
                                </div>
                            ) : (
                                <div className="table-responsive mb-4">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light text-xs text-muted">
                                            <tr>
                                                <th>User</th>
                                                <th>Contact</th>
                                                <th>Joined Date</th>
                                                <th>User Type</th>
                                                <th>Status</th>
                                                <th className="text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReferredUsers.map((u) => (
                                                <tr key={u.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                                {u.first_name ? u.first_name.charAt(0).toUpperCase() : 'U'}
                                                            </div>
                                                            <div>
                                                                <h6 className="fw-bold text-dark mb-0 small">{u.first_name} {u.last_name || ''}</h6>
                                                                <small className="text-muted text-xs">ID: #{u.id}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="small text-muted">
                                                        <div>{u.phone || 'No phone'}</div>
                                                        <small className="text-xs">{u.email || ''}</small>
                                                    </td>
                                                    <td className="small text-muted">
                                                        {formatDate(u.date)}
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light text-secondary border rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                                                            {u.user_type === 2 ? 'Corporate' : u.user_type === 3 ? 'Agent' : 'Retail'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge rounded-pill px-2 py-0.5 ${u.status ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '10px' }}>
                                                            {u.status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <Link href={`/users/view?id=${u.id}`} className="btn btn-outline-primary btn-xs rounded-pill px-2.5">
                                                            View Profile
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Referral Transactions / Commission Ledger */}
                            <h6 className="fw-bold text-dark mb-2.5 small d-flex align-items-center gap-1.5">
                                <i className="ri-money-dollar-circle-line text-success"></i>
                                <span>Referral Commission Transactions ({referralTransactions.length})</span>
                            </h6>

                            {filteredReferralTransactions.length === 0 ? (
                                <div className="text-center py-4 text-muted bg-light rounded-3">
                                    <i className="ri-copper-coin-line fs-2 opacity-40 d-block mb-1"></i>
                                    <small>No referral commission transactions logged yet.</small>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light text-xs text-muted">
                                            <tr>
                                                <th>Date</th>
                                                <th>Referred Customer</th>
                                                <th>Package</th>
                                                <th>Booking ID</th>
                                                <th className="text-end">Commission Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReferralTransactions.map((r) => (
                                                <tr key={r.id}>
                                                    <td className="small text-muted">{formatDate(r.created_at)}</td>
                                                    <td className="small fw-semibold text-dark">
                                                        {r.referred_first_name} {r.referred_last_name || ''}
                                                    </td>
                                                    <td className="small text-dark">{r.package_name || `Package #${r.package_id || ''}`}</td>
                                                    <td className="small text-muted">#{r.booking_id || '—'}</td>
                                                    <td className="small fw-bold text-success text-end">+{formatCurrency(r.commission_amount)}</td>
                                                    <td>
                                                        <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                                                            {r.status === 1 || r.status === '1' ? 'Credited' : 'Pending'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* RELEASE WALLET PAYOUT MODAL                                               */}
            {/* ========================================================================= */}
            {payoutModalOpen && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1055 }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <form onSubmit={handleReleasePayoutSubmit}>
                                <div className="modal-header bg-success text-white py-3 px-4 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="ri-hand-coin-line fs-4"></i>
                                        <div>
                                            <h5 className="modal-title fw-bold text-white mb-0">Release Wallet Payout</h5>
                                            <small className="opacity-75 text-xs">Direct funds disbursement to customer / partner</small>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setPayoutModalOpen(false)}
                                        aria-label="Close"
                                    ></button>
                                </div>

                                <div className="modal-body p-4">
                                    {/* User Balance Header Banner */}
                                    <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <small className="text-muted d-block text-xs">Recipient</small>
                                            <h6 className="fw-bold text-dark mb-0">{user.first_name} {user.last_name || ''}</h6>
                                        </div>
                                        <div className="text-end">
                                            <small className="text-muted d-block text-xs">Available Balance</small>
                                            <h5 className="fw-bold text-success mb-0">{formatCurrency(currentWalletBalance)}</h5>
                                        </div>
                                    </div>

                                    {/* Amount Field */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-dark">
                                            Payout Amount (₹) <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light fw-bold">₹</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="1"
                                                max={currentWalletBalance}
                                                className="form-control fw-bold"
                                                placeholder="Enter amount to withdraw"
                                                value={payoutForm.amount}
                                                onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                                required
                                            />
                                            {currentWalletBalance > 0 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => setPayoutForm({ ...payoutForm, amount: currentWalletBalance.toString() })}
                                                >
                                                    Full Balance
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-dark">Payment Method</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={payoutForm.payment_method}
                                            onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
                                        >
                                            <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                                            <option value="UPI">UPI Transfer (Google Pay / PhonePe / Paytm)</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Other">Other Payout Channel</option>
                                        </select>
                                    </div>

                                    {/* Bank / UPI Details */}
                                    <div className="row g-2 mb-3">
                                        {payoutForm.payment_method === 'UPI' ? (
                                            <div className="col-12">
                                                <label className="form-label small text-muted">UPI ID / VPA</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="e.g. user@okhdfcbank"
                                                    value={payoutForm.upi_id}
                                                    onChange={(e) => setPayoutForm({ ...payoutForm, upi_id: e.target.value })}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="col-6">
                                                    <label className="form-label small text-muted">Bank Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="e.g. HDFC Bank"
                                                        value={payoutForm.bank_name}
                                                        onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small text-muted">Account Number</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="Account #"
                                                        value={payoutForm.account_number}
                                                        onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small text-muted">IFSC Code</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="e.g. HDFC0001234"
                                                        value={payoutForm.ifsc_code}
                                                        onChange={(e) => setPayoutForm({ ...payoutForm, ifsc_code: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small text-muted">UPI ID (Optional)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="e.g. user@upi"
                                                        value={payoutForm.upi_id}
                                                        onChange={(e) => setPayoutForm({ ...payoutForm, upi_id: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Transaction Reference & Remarks */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-dark">
                                            Transaction Ref / UTR Number
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm font-monospace"
                                            placeholder="e.g. UTR123456789 / Bank Ref #"
                                            value={payoutForm.transaction_ref}
                                            onChange={(e) => setPayoutForm({ ...payoutForm, transaction_ref: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label small fw-semibold text-dark">Admin Notes / Remarks</label>
                                        <textarea
                                            rows="2"
                                            className="form-control form-control-sm"
                                            placeholder="Optional payout remarks..."
                                            value={payoutForm.admin_remarks}
                                            onChange={(e) => setPayoutForm({ ...payoutForm, admin_remarks: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                                        onClick={() => setPayoutModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success btn-sm rounded-pill px-4 fw-semibold shadow-sm"
                                        disabled={payoutSubmitting}
                                    >
                                        {payoutSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1"></span>
                                                Releasing...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-check-double-line me-1"></i>
                                                Confirm &amp; Release Payout
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

export default UserViewPage;