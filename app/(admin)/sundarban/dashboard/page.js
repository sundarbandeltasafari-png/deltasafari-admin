"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { 
    getSundarbanStatsUrl, 
    getSundarbanLeadsUrl, 
    getSundarbanBookingsUrl 
} from '@/app/routes/sundarbanRoutes';
import { axiosGet } from '@/libs/axiosHelper';
import LoadingComponent from '@/components/common/LoadingComponent';

export default function SundarbanDashboardPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        totalRevenue: 0,
        totalLeads: 0,
        activePackages: 0
    });
    const [recentLeads, setRecentLeads] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [statsRes, leadsRes, bookingsRes] = await Promise.allSettled([
                axiosGet(getSundarbanStatsUrl, token),
                axiosGet(getSundarbanLeadsUrl, token),
                axiosGet(getSundarbanBookingsUrl, token)
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value?.status) {
                setStats(statsRes.value.stats || {});
            }
            if (leadsRes.status === 'fulfilled' && leadsRes.value?.status) {
                setRecentLeads((leadsRes.value.leads || []).slice(0, 5));
            }
            if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.status) {
                setRecentBookings((bookingsRes.value.bookings || []).slice(0, 5));
            }
        } catch (err) {
            console.error("Sundarban Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1">
                            <i className="ri ri-compass-3-line me-1"></i> Dedicated Destination Portal
                        </span>
                    </div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <span>Sundarban Delta Safari Management</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Manage website settings, customized leads, tour packages, and direct bookings for Sundarban DeltaSafari.
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <Link 
                        href="/sundarban/settings" 
                        className="btn btn-outline-warning d-flex align-items-center gap-2 rounded-pill px-3 shadow-xs"
                    >
                        <i className="ri ri-settings-4-line"></i> Website Settings
                    </Link>
                    <Link 
                        href="/sundarban/leads" 
                        className="btn btn-outline-info d-flex align-items-center gap-2 rounded-pill px-3 shadow-xs"
                    >
                        <i className="ri ri-user-voice-line"></i> Custom Leads
                    </Link>
                    <button 
                        type="button" 
                        className="btn btn-success d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm text-white"
                        onClick={fetchData}
                    >
                        <i className="ri ri-refresh-line"></i> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="row g-3 mb-4">
                {/* Total Revenue */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-success">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Sundarban Revenue</span>
                                <h3 className="fw-bold text-success mb-0">₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')}</h3>
                                <small className="text-muted mt-1 d-block">
                                    {stats.confirmedBookings || 0} Confirmed Bookings
                                </small>
                            </div>
                            <span className="badge bg-success bg-opacity-10 rounded-circle p-3 text-success">
                                <i className="ri ri-money-rupee-circle-fill fs-3"></i>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Total Bookings */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-primary">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Total Bookings</span>
                                <h3 className="fw-bold text-primary mb-0">{stats.totalBookings || 0}</h3>
                                <small className="text-primary mt-1 d-block">Platform Tagged</small>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 rounded-circle p-3 text-primary">
                                <i className="ri ri-ticket-2-fill fs-3"></i>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Custom Tour Leads */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-info">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Customized Leads</span>
                                <h3 className="fw-bold text-info mb-0">{stats.totalLeads || 0}</h3>
                                <small className="text-muted mt-1 d-block">Tailored Inquiries</small>
                            </div>
                            <span className="badge bg-info bg-opacity-10 rounded-circle p-3 text-info">
                                <i className="ri ri-user-voice-fill fs-3"></i>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Active Packages */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-warning">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase d-block mb-1">Sundarban Packages</span>
                                <h3 className="fw-bold text-warning mb-0">{stats.activePackages || 0}</h3>
                                <small className="text-muted mt-1 d-block">Published for Safari</small>
                            </div>
                            <span className="badge bg-warning bg-opacity-10 rounded-circle p-3 text-warning">
                                <i className="ri ri-compass-3-fill fs-3"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="p-3 bg-success bg-opacity-10 text-success rounded-3 fs-4">
                                <i className="ri ri-settings-4-line"></i>
                            </span>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">Website Settings</h6>
                                <small className="text-muted">Control branding, contact &amp; hero text</small>
                            </div>
                        </div>
                        <p className="text-muted small mb-3">
                            Update contact phone numbers, WhatsApp, email, hero banners, about section story, and SEO metadata.
                        </p>
                        <Link href="/sundarban/settings" className="btn btn-sm btn-outline-success rounded-pill mt-auto">
                            Manage Settings <i className="ri ri-arrow-right-line ms-1"></i>
                        </Link>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="p-3 bg-info bg-opacity-10 text-info rounded-3 fs-4">
                                <i className="ri ri-user-voice-line"></i>
                            </span>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">Customized Leads</h6>
                                <small className="text-muted">Tailor-made safari inquiries</small>
                            </div>
                        </div>
                        <p className="text-muted small mb-3">
                            Guests planning custom dates, group sizes, and luxury boat preferences directly on sundarban-deltasafari.
                        </p>
                        <Link href="/sundarban/leads" className="btn btn-sm btn-outline-info rounded-pill mt-auto">
                            Review Leads ({stats.totalLeads}) <i className="ri ri-arrow-right-line ms-1"></i>
                        </Link>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="p-3 bg-primary bg-opacity-10 text-primary rounded-3 fs-4">
                                <i className="ri ri-instance-line"></i>
                            </span>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">Sundarban Packages</h6>
                                <small className="text-muted">Tour itineraries &amp; rates</small>
                            </div>
                        </div>
                        <p className="text-muted small mb-3">
                            Manage packages configured with Platform Visibility: Both Platforms or Sundarban DeltaSafari Only.
                        </p>
                        <div className="d-flex gap-2 mt-auto">
                            <Link href="/sundarban/packages" className="btn btn-sm btn-outline-primary rounded-pill">
                                View Packages <i className="ri ri-arrow-right-line ms-1"></i>
                            </Link>
                            <Link href="/package/add" className="btn btn-sm btn-primary rounded-pill text-white">
                                + Add New
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tables Row: Recent Leads & Recent Bookings */}
            <div className="row g-4">
                {/* Recent Custom Leads */}
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
                        <div className="card-header bg-white border-bottom p-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                <i className="ri ri-user-voice-line text-info"></i> Recent Customized Leads
                            </h6>
                            <Link href="/sundarban/leads" className="btn btn-xs btn-outline-secondary rounded-pill">
                                View All
                            </Link>
                        </div>
                        <div className="table-responsive">
                            {loading ? (
                                <div className="p-4 text-center"><LoadingComponent /></div>
                            ) : recentLeads.length === 0 ? (
                                <div className="p-4 text-center text-muted small">No customized leads received yet.</div>
                            ) : (
                                <table className="table table-hover align-middle mb-0 small">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Client</th>
                                            <th>Guests &amp; Travel Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentLeads.map((lead) => (
                                            <tr key={lead.id}>
                                                <td>
                                                    <span className="fw-bold text-dark d-block">{lead.full_name || lead.name}</span>
                                                    <span className="text-muted font-monospace">{lead.phone}</span>
                                                </td>
                                                <td>
                                                    <span className="d-block text-dark fw-medium">
                                                        {lead.adults_count || lead.adults || 1} Adults, {lead.children_count || lead.children || 0} Children
                                                    </span>
                                                    <span className="text-muted">
                                                        {lead.travel_date ? new Date(lead.travel_date).toLocaleDateString('en-IN') : 'Flexible Date'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill">
                                                        {lead.status || 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Sundarban Bookings */}
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
                        <div className="card-header bg-white border-bottom p-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                <i className="ri ri-ticket-2-line text-success"></i> Recent Sundarban Bookings
                            </h6>
                            <Link href="/bookings" className="btn btn-xs btn-outline-secondary rounded-pill">
                                Master Bookings
                            </Link>
                        </div>
                        <div className="table-responsive">
                            {loading ? (
                                <div className="p-4 text-center"><LoadingComponent /></div>
                            ) : recentBookings.length === 0 ? (
                                <div className="p-4 text-center text-muted small">No bookings recorded with Sundarban tag yet.</div>
                            ) : (
                                <table className="table table-hover align-middle mb-0 small">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Client</th>
                                            <th>Tour &amp; Amount</th>
                                            <th>Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentBookings.map((b) => (
                                            <tr key={b.id || b.bookings_id}>
                                                <td>
                                                    <span className="fw-bold text-dark d-block">{b.customer_name}</span>
                                                    <span className="text-muted font-monospace">{b.customer_phone}</span>
                                                </td>
                                                <td>
                                                    <span className="d-block text-truncate fw-medium" style={{ maxWidth: '180px' }}>
                                                        {b.title || 'Sundarban Safari'}
                                                    </span>
                                                    <span className="text-success fw-bold">
                                                        ₹{Number(b.total_cost || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${b.payment_status === 'PAID' ? 'bg-success' : 'bg-warning'} rounded-pill`}>
                                                        {b.payment_status || 'PENDING'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
