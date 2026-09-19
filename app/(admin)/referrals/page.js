"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getReferralOverviewUrl } from '../../routes/userRoutes';
import LoadingComponent from '../../../components/common/LoadingComponent';
import { useSelector } from 'react-redux';
import { axiosGet } from '@/libs/axiosHelper';
import { formatDate } from '@/libs/timeHelper';
import NotFound from '@/components/common/NotFound';
import { toast } from 'react-toastify';

export default function ReferralsAdminPage() {
    const [loading, setLoading] = useState(true);
    const [referrers, setReferrers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [allReferrals, setAllReferrals] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'referrers' | 'transactions'
    const [searchTerm, setSearchTerm] = useState('');
    const token = useSelector((state) => state.adminAuth?.token);

    useEffect(() => {
        if (token) {
            fetchReferralOverview();
        }
    }, [token]);

    const fetchReferralOverview = () => {
        setLoading(true);
        axiosGet(getReferralOverviewUrl, token)
            .then((res) => {
                setLoading(false);
                if (res?.status) {
                    setReferrers(res.referrers || []);
                    setTransactions(res.transactions || []);
                    setAllReferrals(res.all_referrals || []);
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error loading referral overview:", err);
            });
    };

    // Summary calculations
    const totalReferrersCount = referrers.length;
    const totalReferredFriends = allReferrals.length || referrers.reduce((sum, r) => sum + Number(r.total_friends_referred || 0), 0);
    const totalBookingsGenerated = transactions.length || referrers.reduce((sum, r) => sum + Number(r.total_referral_bookings || 0), 0);
    const totalCommissionsPaid = transactions.reduce((sum, t) => sum + Number(t.commission_amount || 0), 0);

    const handleCopyCode = (code) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        toast.success(`Referral code ${code} copied!`);
    };

    // Filtered items based on searchTerm
    const searchLower = searchTerm.toLowerCase().trim();

    const filteredAllReferrals = allReferrals.filter(r => {
        if (!searchLower) return true;
        const friendName = `${r.referred_first_name || ''} ${r.referred_last_name || ''}`.toLowerCase();
        const friendEmail = (r.referred_email || '').toLowerCase();
        const friendPhone = (r.referred_phone || '').toLowerCase();
        const referrerName = `${r.referrer_first_name || ''} ${r.referrer_last_name || ''}`.toLowerCase();
        const refCode = (r.referral_code || '').toLowerCase();
        return friendName.includes(searchLower) || friendEmail.includes(searchLower) || friendPhone.includes(searchLower) || referrerName.includes(searchLower) || refCode.includes(searchLower);
    });

    const filteredReferrers = referrers.filter(r => {
        if (!searchLower) return true;
        const name = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
        const email = (r.email || '').toLowerCase();
        const phone = (r.phone || '').toLowerCase();
        const code = (r.referral_code || '').toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower) || code.includes(searchLower);
    });

    const filteredTransactions = transactions.filter(t => {
        if (!searchLower) return true;
        const idStr = String(t.booking_id || '');
        const referrer = `${t.referrer_first_name || ''} ${t.referrer_last_name || ''} ${t.referrer_email || ''}`.toLowerCase();
        const friend = `${t.friend_first_name || ''} ${t.friend_last_name || ''} ${t.friend_email || ''}`.toLowerCase();
        const pkg = (t.package_title || '').toLowerCase();
        return idStr.includes(searchLower) || referrer.includes(searchLower) || friend.includes(searchLower) || pkg.includes(searchLower);
    });

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header Title & Summary Cards */}
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-2">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <i className="ri ri-gift-line text-primary fs-3"></i>
                        <span>Referral Program &amp; Customer Network</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Track all customer referrals, invitations, booking commissions, and rewards ledger across Delta Safari.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button onClick={fetchReferralOverview} className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-xs">
                        <i className="ri ri-refresh-line me-1"></i> Refresh Data
                    </button>
                    <Link href="/withdrawals" className="btn btn-sm btn-primary rounded-pill px-3 shadow-xs">
                        <i className="ri ri-bank-card-line me-1"></i> Bank &amp; Withdrawals
                    </Link>
                </div>
            </div>

            {/* Stat Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-xs h-100">
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Active Referrers</span>
                                <h3 className="fw-bold mb-0 text-primary">{totalReferrersCount}</h3>
                                <small className="text-muted">Users sharing referral codes</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-primary rounded-circle d-flex align-items-center justify-content-center">
                                <i className="ri ri-user-shared-line fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-xs h-100">
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Referred Friends</span>
                                <h3 className="fw-bold mb-0 text-success">{totalReferredFriends}</h3>
                                <small className="text-muted">Signed up via referral links</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-success rounded-circle d-flex align-items-center justify-content-center">
                                <i className="ri ri-user-follow-line fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-xs h-100">
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Referral Bookings</span>
                                <h3 className="fw-bold mb-0 text-info">{totalBookingsGenerated}</h3>
                                <small className="text-muted">Completed tour reservations</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-info rounded-circle d-flex align-items-center justify-content-center">
                                <i className="ri ri-calendar-check-line fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-xs h-100">
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Total Rewards Paid</span>
                                <h3 className="fw-bold mb-0 text-warning">₹{totalCommissionsPaid.toLocaleString('en-IN')}</h3>
                                <small className="text-muted">Credited to customer wallets</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-warning rounded-circle d-flex align-items-center justify-content-center">
                                <i className="ri ri-money-dollar-circle-line fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs and Search Bar */}
            <div className="card border-0 shadow-xs">
                <div className="card-header border-bottom py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <ul className="nav nav-tabs card-header-tabs m-0 border-0" role="tablist">
                        <li className="nav-item">
                            <button 
                                className={`nav-link fw-semibold ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTab('all')}>
                                <i className="ri ri-node-tree me-1.5"></i> All Referrals Network ({allReferrals.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link fw-semibold ${activeTab === 'referrers' ? 'active' : ''}`}
                                onClick={() => setActiveTab('referrers')}>
                                <i className="ri ri-team-line me-1.5"></i> Top Referrers ({referrers.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link fw-semibold ${activeTab === 'transactions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('transactions')}>
                                <i className="ri ri-file-list-3-line me-1.5"></i> Commission Ledger ({transactions.length})
                            </button>
                        </li>
                    </ul>

                    {/* Search Bar */}
                    <div className="d-flex align-items-center position-relative" style={{ minWidth: '280px' }}>
                        <i className="ri ri-search-line position-absolute ms-3 text-muted"></i>
                        <input
                            type="text"
                            className="form-control form-control-sm ps-5 rounded-pill"
                            placeholder="Search by name, email, referral code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                className="btn btn-sm btn-link position-absolute end-0 me-2 text-muted p-0"
                                onClick={() => setSearchTerm('')}
                                title="Clear search"
                            >
                                <i className="ri ri-close-circle-fill"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-5 text-center">
                            <LoadingComponent />
                        </div>
                    ) : activeTab === 'all' ? (
                        /* TAB 1: ALL REFERRALS NETWORK */
                        filteredAllReferrals.length === 0 ? (
                            <div className="p-5 text-center">
                                <NotFound height={120} width={120} classes={"col-12"} />
                                <h6 className="fw-bold text-dark mt-3">No Referral Linkages Found</h6>
                                <p className="text-muted small">
                                    {searchTerm ? 'No referral records match your search criteria.' : 'No users have registered through a referral code yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-uppercase small">
                                        <tr>
                                            <th>#</th>
                                            <th>Referred Friend</th>
                                            <th>Referred By</th>
                                            <th>Registration Date</th>
                                            <th>Bookings Placed</th>
                                            <th>Commission Generated</th>
                                            <th>Friend Status</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAllReferrals.map((item, idx) => (
                                            <tr key={item.referred_user_id}>
                                                <td className="text-muted small">{idx + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-sm me-2.5">
                                                            <span className="avatar-initial rounded-circle bg-label-info text-info fw-bold">
                                                                {(item.referred_first_name?.[0] || 'U').toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-heading">
                                                                {item.referred_first_name} {item.referred_last_name || ''}
                                                            </div>
                                                            <small className="text-muted d-block">{item.referred_email || item.referred_phone || 'No Contact'}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-sm me-2.5">
                                                            <span className="avatar-initial rounded-circle bg-label-primary text-primary fw-bold">
                                                                {(item.referrer_first_name?.[0] || 'R').toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-heading">
                                                                {item.referrer_first_name} {item.referrer_last_name || ''}
                                                            </div>
                                                            <div className="d-flex align-items-center gap-1 mt-0.5">
                                                                <span className="badge bg-label-primary font-monospace px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                                                                    {item.referral_code}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-xs btn-link text-primary p-0"
                                                                    onClick={() => handleCopyCode(item.referral_code)}
                                                                    title="Copy referral code"
                                                                >
                                                                    <i className="ri ri-file-copy-line"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="small text-muted">
                                                    {formatDate(item.referred_date)}
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill px-2.5 py-1 ${Number(item.total_bookings) > 0 ? 'bg-success text-white' : 'bg-label-secondary'}`}>
                                                        {item.total_bookings} Booking{Number(item.total_bookings) === 1 ? '' : 's'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-success fs-6">
                                                        ₹{Number(item.total_commission_earned || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill px-2 py-0.5 ${Number(item.referred_status) === 1 ? 'bg-label-success' : 'bg-label-danger'}`} style={{ fontSize: '11px' }}>
                                                        {Number(item.referred_status) === 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <div className="dropdown">
                                                        <button className="btn btn-sm btn-icon btn-outline-secondary rounded-pill" type="button" data-bs-toggle="dropdown">
                                                            <i className="ri ri-more-2-fill"></i>
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border">
                                                            <li>
                                                                <Link href={`/users/view?id=${item.referred_user_id}`} className="dropdown-item">
                                                                    <i className="ri ri-user-line me-2 text-info"></i> View Friend Profile
                                                                </Link>
                                                            </li>
                                                            <li>
                                                                <Link href={`/users/view?id=${item.referrer_id}`} className="dropdown-item">
                                                                    <i className="ri ri-user-shared-line me-2 text-primary"></i> View Referrer Profile
                                                                </Link>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : activeTab === 'referrers' ? (
                        /* TAB 2: REFERRERS SUMMARY */
                        filteredReferrers.length === 0 ? (
                            <div className="p-5 text-center">
                                <NotFound height={120} width={120} classes={"col-12"} />
                                <h6 className="fw-bold text-dark mt-3">No Referrers Found</h6>
                                <p className="text-muted small">
                                    {searchTerm ? 'No referrers match your search criteria.' : 'No users have referred any accounts yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-uppercase small">
                                        <tr>
                                            <th>#</th>
                                            <th>Referrer User</th>
                                            <th>Referral Code</th>
                                            <th>Account Type</th>
                                            <th>Friends Invited</th>
                                            <th>Bookings Triggered</th>
                                            <th>Total Commission Paid</th>
                                            <th>Current Wallet Balance</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReferrers.map((ref, idx) => (
                                            <tr key={ref.id}>
                                                <td className="text-muted small">{idx + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-sm me-3">
                                                            <span className="avatar-initial rounded-circle bg-primary text-white fw-bold">
                                                                {(ref.first_name?.[0] || 'U').toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-heading">{ref.first_name} {ref.last_name}</div>
                                                            <small className="text-muted">{ref.email || ref.phone}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="badge bg-label-primary px-2.5 py-1.5 fw-bold font-monospace" style={{ fontSize: '0.85rem' }}>
                                                            {ref.referral_code || 'N/A'}
                                                        </span>
                                                        {ref.referral_code && (
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-xs btn-link text-primary p-0"
                                                                onClick={() => handleCopyCode(ref.referral_code)}
                                                                title="Copy Code"
                                                            >
                                                                <i className="ri ri-file-copy-line"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill ${ref.user_type == 3 ? 'bg-label-info' : ref.user_type == 2 ? 'bg-label-warning' : 'bg-label-secondary'}`}>
                                                        {ref.user_type == 3 ? 'Agent Partner' : ref.user_type == 2 ? 'Corporate' : 'Customer'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-dark fs-6">{ref.total_friends_referred}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge px-2.5 py-1 ${Number(ref.total_referral_bookings) > 0 ? 'bg-label-success fw-bold' : 'bg-label-secondary'}`}>
                                                        {ref.total_referral_bookings} Bookings
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-success fs-6">
                                                        ₹{Number(ref.total_commission_paid).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-primary">
                                                        ₹{Number(ref.wallet_balance || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <Link 
                                                        href={`/users/view?id=${ref.id}`} 
                                                        className="btn btn-sm btn-outline-primary rounded-pill px-2.5"
                                                        title="View Complete User Details"
                                                    >
                                                        <i className="ri ri-eye-line me-1"></i> View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        /* TAB 3: COMMISSION TRANSACTIONS LEDGER */
                        filteredTransactions.length === 0 ? (
                            <div className="p-5 text-center">
                                <NotFound height={120} width={120} classes={"col-12"} />
                                <h6 className="fw-bold text-dark mt-3">No Commission Transactions</h6>
                                <p className="text-muted small">
                                    {searchTerm ? 'No transactions match your search.' : 'No referral commissions have been credited yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-uppercase small">
                                        <tr>
                                            <th>Booking ID</th>
                                            <th>Referrer (Recipient)</th>
                                            <th>Friend (Traveler)</th>
                                            <th>Tour Package</th>
                                            <th>Commission Credited</th>
                                            <th>Transaction Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransactions.map((tx) => (
                                            <tr key={tx.id}>
                                                <td>
                                                    <span className="fw-bold text-primary font-monospace">#{tx.booking_id}</span>
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-heading">{tx.referrer_first_name} {tx.referrer_last_name}</div>
                                                    <small className="text-muted">{tx.referrer_email}</small>
                                                </td>
                                                <td>
                                                    <div className="fw-semibold text-heading">{tx.friend_first_name} {tx.friend_last_name}</div>
                                                    <small className="text-muted">{tx.friend_email}</small>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-dark">{tx.package_title || 'Tour Package'}</span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-success fs-6">+₹{Number(tx.commission_amount).toLocaleString('en-IN')}</span>
                                                </td>
                                                <td className="small text-muted">
                                                    {formatDate(tx.created_at)}
                                                </td>
                                                <td>
                                                    <span className="badge bg-success text-white rounded-pill px-2.5 py-1 fw-bold">
                                                        <i className="ri ri-checkbox-circle-line me-1"></i>{tx.status}
                                                    </span>
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
        </div>
    );
}
