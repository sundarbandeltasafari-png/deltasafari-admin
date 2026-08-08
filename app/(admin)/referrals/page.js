"use client";
import React, { useEffect, useState } from 'react';
import { getReferralOverviewUrl } from '../../routes/userRoutes';
import LoadingComponent from '../../../components/common/LoadingComponent';
import { useSelector } from 'react-redux';
import { axiosGet } from '@/libs/axiosHelper';
import { formatDate } from '@/libs/timeHelper';
import NotFound from '@/components/common/NotFound';

export default function ReferralsAdminPage() {
    const [loading, setLoading] = useState(true);
    const [referrers, setReferrers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState('referrers'); // 'referrers' | 'transactions'
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
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error loading referral overview:", err);
            });
    };

    // Summary calculations
    const totalReferrersCount = referrers.length;
    const totalReferredFriends = referrers.reduce((sum, r) => sum + Number(r.total_friends_referred || 0), 0);
    const totalCommissionsPaid = transactions.reduce((sum, t) => sum + Number(t.commission_amount || 0), 0);

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header Title & Summary Cards */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h4 className="fw-bold mb-1"><i className="ri ri-gift-line me-2 text-primary"></i>Referral & Commission Program</h4>
                    <p className="text-muted small mb-0">Overview of all customer referrers, referred friends, and package booking commission rewards.</p>
                </div>
                <button onClick={fetchReferralOverview} className="btn btn-sm btn-outline-primary rounded-pill">
                    <i className="ri ri-refresh-line me-1"></i> Refresh Overview
                </button>
            </div>

            {/* Stat Summary Cards */}
            <div className="row g-4 mb-4">
                <div className="col-sm-6 col-lg-4">
                    <div className="card border-0 shadow-xs">
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Active Referrers</span>
                                <h3 className="fw-bold mb-0 text-primary">{totalReferrersCount}</h3>
                                <small className="text-muted">Users sharing referral codes</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-primary rounded-circle">
                                <i className="ri ri-user-shared-line icon-24px"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-4">
                    <div className="card border-0 shadow-xs">
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Referred Friends</span>
                                <h3 className="fw-bold mb-0 text-success">{totalReferredFriends}</h3>
                                <small className="text-muted">Total accounts registered via invite</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-success rounded-circle">
                                <i className="ri ri-user-follow-line icon-24px"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-4">
                    <div className="card border-0 shadow-xs">
                        <div className="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-uppercase text-muted fw-bold small d-block mb-1">Total Commission Paid</span>
                                <h3 className="fw-bold mb-0 text-warning">₹{totalCommissionsPaid.toLocaleString('en-IN')}</h3>
                                <small className="text-muted">Direct rewards credited to user wallets</small>
                            </div>
                            <div className="avatar avatar-lg bg-label-warning rounded-circle">
                                <i className="ri ri-money-dollar-circle-line icon-24px"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="card">
                <div className="card-header border-bottom">
                    <ul className="nav nav-tabs card-header-tabs" role="tablist">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'referrers' ? 'active' : ''}`}
                                onClick={() => setActiveTab('referrers')}>
                                <i className="ri ri-team-line me-1"></i> Referrers Summary ({referrers.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('transactions')}>
                                <i className="ri ri-file-list-3-line me-1"></i> Commission Transactions ({transactions.length})
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-5">
                            <LoadingComponent />
                        </div>
                    ) : activeTab === 'referrers' ? (
                        /* Referrers Table */
                        referrers.length === 0 ? (
                            <div className="p-4 text-center">
                                <NotFound height={120} width={120} classes={"col-12"} />
                                <p className="text-muted mt-2">No active referrers found yet.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-uppercase">
                                        <tr>
                                            <th>Referrer User</th>
                                            <th>Referral Code</th>
                                            <th>Account Type</th>
                                            <th>Friends Referred</th>
                                            <th>Bookings Triggered</th>
                                            <th>Total Earnings</th>
                                            <th>Wallet Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referrers.map((ref) => (
                                            <tr key={ref.id}>
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
                                                    <span className="badge bg-label-primary px-3 py-2 fw-bold font-monospace" style={{ fontSize: '0.85rem' }}>
                                                        {ref.referral_code || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill ${ref.user_type == 3 ? 'bg-label-info' : ref.user_type == 2 ? 'bg-label-purple' : 'bg-label-secondary'}`}>
                                                        {ref.user_type == 3 ? 'Agent Partner' : ref.user_type == 2 ? 'Corporate' : 'Customer'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-dark fs-6">{ref.total_friends_referred}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-label-success fw-bold px-2.5 py-1.5">
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        /* Referral Transactions Table */
                        transactions.length === 0 ? (
                            <div className="p-4 text-center">
                                <NotFound height={120} width={120} classes={"col-12"} />
                                <p className="text-muted mt-2">No referral transactions logged yet.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-uppercase">
                                        <tr>
                                            <th>Booking ID</th>
                                            <th>Referrer User</th>
                                            <th>Referred Friend</th>
                                            <th>Package Booked</th>
                                            <th>Commission Reward</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx.id}>
                                                <td>
                                                    <span className="fw-bold text-primary">#{tx.booking_id}</span>
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-heading">{tx.referrer_first_name} {tx.referrer_last_name}</div>
                                                    <small className="text-muted">{tx.referrer_email}</small>
                                                </td>
                                                <td>
                                                    <div className="fw-semibold">{tx.friend_first_name} {tx.friend_last_name}</div>
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
                                                    <span className="badge bg-label-success fw-bold">
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
