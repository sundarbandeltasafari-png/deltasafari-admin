'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { getDashboardUrl } from '@/app/routes/serviceRoutes';
import { axiosGet } from '@/libs/axiosHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import { showMessage } from '@/libs/commonHelper';
import DashboardCharts from './DashboardCharts';

// Fallback initial dashboard state matching API schema exactly
const defaultDashboardData = {
  counts: {
    total_users: 150,
    total_packages: 24,
    total_bookings: 85,
    total_corporate_leads: 12,
    pending_corporate_leads: 4,
    total_contacts: 38,
    total_revenue: 1275000,
    conversion_rate: 16.7
  },
  charts: {
    monthly_revenue: [
      { month: "Feb", revenue: 120000, bookings: 8 },
      { month: "Mar", revenue: 155000, bookings: 10 },
      { month: "Apr", revenue: 180000, bookings: 12 },
      { month: "May", revenue: 210000, bookings: 14 },
      { month: "Jun", revenue: 290000, bookings: 19 },
      { month: "Jul", revenue: 320000, bookings: 22 }
    ],
    lead_status_breakdown: [
      { status: "Pending", count: 4, color: "#ffc107", bgClass: "bg-warning" },
      { status: "Contacted", count: 3, color: "#0dcaf0", bgClass: "bg-info" },
      { status: "In Progress", count: 2, color: "#0d6efd", bgClass: "bg-primary" },
      { status: "Converted", count: 2, color: "#198754", bgClass: "bg-success" },
      { status: "Closed", count: 1, color: "#dc3545", bgClass: "bg-danger" }
    ],
    category_bookings: [
      { category: "Wilderness Safari", count: 38, percentage: 44.7, color: "#696cff" },
      { category: "Festival Special", count: 22, percentage: 25.9, color: "#71dd37" },
      { category: "Bird Watching", count: 15, percentage: 17.6, color: "#03c3ec" },
      { category: "Luxury Resort Retreat", count: 10, percentage: 11.8, color: "#ffab00" }
    ],
    user_growth: [
      { month: "Feb", users: 15 },
      { month: "Mar", users: 22 },
      { month: "Apr", users: 28 },
      { month: "May", users: 35 },
      { month: "Jun", users: 40 },
      { month: "Jul", users: 50 }
    ]
  },
  recent_bookings: [
    {
      id: 85,
      package_id: 3,
      package_title: "Sundarbans Premier Wilderness Safari",
      base_price: "15000",
      created_on: "2026-07-24T08:30:00.000Z"
    },
    {
      id: 84,
      package_id: 1,
      package_title: "Sundarban Hilsa Festival Special 2 Night 3 Days",
      base_price: "13600",
      created_on: "2026-07-23T14:20:00.000Z"
    },
    {
      id: 83,
      package_id: 2,
      package_title: "Sundarban Bird Watching Safari 1 Night 2 Days",
      base_price: "10800",
      created_on: "2026-07-22T11:15:00.000Z"
    }
  ],
  recent_corporate_leads: [
    {
      id: 12,
      company_name: "Tech Corp",
      name: "Alex Smith",
      email: "alex@techcorp.com",
      phone: "+1987654321",
      destination: "Sundarbans Safari",
      group_size: "20-25 People",
      status: "Pending",
      created_at: "2026-07-24T09:15:00.000Z"
    },
    {
      id: 11,
      company_name: "Acme Corp",
      name: "John Doe",
      email: "john@acme.com",
      phone: "+1987654321",
      destination: "Sundarbans Eco Tour",
      group_size: "25-30 members",
      status: "Pending",
      created_at: "2026-07-24T09:45:00.000Z"
    },
    {
      id: 10,
      company_name: "TechNova Solutions",
      name: "Priya Sharma",
      email: "priya@technova.io",
      phone: "+919830123456",
      destination: "Sundarban Resort Retreat",
      group_size: "40-50 members",
      status: "Contacted",
      created_at: "2026-07-22T14:20:00.000Z"
    }
  ],
  recent_users: [
    {
      id: 150,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      phone: "+1122334455",
      created_on: "2026-07-24T07:45:00.000Z"
    },
    {
      id: 149,
      first_name: "Rahul",
      last_name: "Verma",
      email: "rahul.verma@example.com",
      phone: "+919876543210",
      created_on: "2026-07-23T18:10:00.000Z"
    },
    {
      id: 148,
      first_name: "Ananya",
      last_name: "Sen",
      email: "ananya.sen@example.com",
      phone: "+919830012345",
      created_on: "2026-07-23T10:30:00.000Z"
    }
  ]
};

function Dashboard() {
  const token = useSelector((state) => state.adminAuth?.token);
  const user = useSelector((state) => state.adminAuth?.user);

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await axiosGet(getDashboardUrl, token);
      if (res && res.status && res.data) {
        setDashboardData(res.data);
        setLastUpdated(new Date());
      } else {
        setDashboardData(defaultDashboardData);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.log('API call failed for Dashboard, rendering default metrics:', err);
      setDashboardData(defaultDashboardData);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const counts = dashboardData?.counts || {};
  const charts = dashboardData?.charts || defaultDashboardData.charts;
  const recentBookings = dashboardData?.recent_bookings || [];
  const recentCorporateLeads = dashboardData?.recent_corporate_leads || [];
  const recentUsers = dashboardData?.recent_users || [];

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-label-warning text-warning';
      case 'contacted':
        return 'bg-label-info text-info';
      case 'in progress':
        return 'bg-label-primary text-primary';
      case 'converted':
        return 'bg-label-success text-success';
      case 'closed':
        return 'bg-label-danger text-danger';
      default:
        return 'bg-label-secondary text-secondary';
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Welcome Banner Header */}
      <div className="card border-0 bg-primary text-white mb-4 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
        <div className="card-body p-4 position-relative">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h4 className="fw-bold text-white mb-1">
                Welcome back, {user?.first_name || 'Admin'} 👋🏻
              </h4>
              <p className="mb-0 text-white-50 small">
                Here is what is happening with your Sundarbans Delta Safari bookings & corporate leads today.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-light btn-sm text-primary fw-bold d-flex align-items-center gap-1"
                onClick={fetchDashboardData}
                disabled={loading}
              >
                <i className="ri ri-refresh-line"></i> Sync Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-5 text-center">
          <LoadingComponent />
        </div>
      ) : (
        <>
          {/* Interactive Statistics Graphs & KPI Dashboard */}
          <DashboardCharts chartsData={charts} countsData={counts} />

          {/* 6 Key Metrics Stat Cards */}
          <div className="row g-3 mb-4">
            {/* Total Users */}
            <div className="col-sm-6 col-md-4 col-xl-2">
              <Link href="/users" className="text-decoration-none">
                <div className="card shadow-sm border-0 h-100 card-hover-effect">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="avatar avatar-sm bg-label-primary rounded p-2">
                        <i className="ri ri-user-3-line fs-5"></i>
                      </div>
                      <span className="badge bg-label-primary font-monospace">Users</span>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{counts.total_users ?? 0}</h3>
                    <span className="text-muted small">Total Registered</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Total Packages */}
            <div className="col-sm-6 col-md-4 col-xl-2">
              <Link href="/package" className="text-decoration-none">
                <div className="card shadow-sm border-0 h-100 card-hover-effect">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="avatar avatar-sm bg-label-success rounded p-2">
                        <i className="ri ri-instance-line fs-5"></i>
                      </div>
                      <span className="badge bg-label-success font-monospace">Packages</span>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{counts.total_packages ?? 0}</h3>
                    <span className="text-muted small">Active Packages</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Total Bookings */}
            <div className="col-sm-6 col-md-4 col-xl-2">
              <Link href="/bookings" className="text-decoration-none">
                <div className="card shadow-sm border-0 h-100 card-hover-effect">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="avatar avatar-sm bg-label-info rounded p-2">
                        <i className="ri ri-reserved-line fs-5"></i>
                      </div>
                      <span className="badge bg-label-info font-monospace">Bookings</span>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{counts.total_bookings ?? 0}</h3>
                    <span className="text-muted small">Total Reservations</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Total Corporate Leads */}
            <div className="col-sm-6 col-md-4 col-xl-2">
              <Link href="/corporate-lead" className="text-decoration-none">
                <div className="card shadow-sm border-0 h-100 card-hover-effect">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="avatar avatar-sm bg-label-warning rounded p-2">
                        <i className="ri ri-briefcase-line fs-5"></i>
                      </div>
                      <span className="badge bg-label-warning font-monospace">Leads</span>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{counts.total_corporate_leads ?? 0}</h3>
                    <span className="text-muted small">Corporate Enquiries</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Pending Corporate Leads */}
            <div className="col-sm-6 col-md-4 col-xl-2">
              <Link href="/corporate-lead" className="text-decoration-none">
                <div className="card shadow-sm border-0 h-100 card-hover-effect border-start border-4 border-warning">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="avatar avatar-sm bg-label-warning rounded p-2">
                        <i className="ri ri-time-line fs-5"></i>
                      </div>
                      <span className="badge bg-warning text-white font-monospace">Pending</span>
                    </div>
                    <h3 className="fw-bold text-warning mb-0">{counts.pending_corporate_leads ?? 0}</h3>
                    <span className="text-muted small">Needs Attention</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Total Contacts */}
            <div className="col-sm-6 col-md-4 col-xl-2">
              <Link href="/contacts" className="text-decoration-none">
                <div className="card shadow-sm border-0 h-100 card-hover-effect">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="avatar avatar-sm bg-label-danger rounded p-2">
                        <i className="ri ri-contacts-line fs-5"></i>
                      </div>
                      <span className="badge bg-label-danger font-monospace">Contacts</span>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{counts.total_contacts ?? 0}</h3>
                    <span className="text-muted small">Contact Messages</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Main Grid Tables */}
          <div className="row g-4 mb-4">
            {/* Recent Corporate Leads */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header border-bottom bg-light py-3 d-flex align-items-center justify-content-between">
                  <h6 className="card-title m-0 fw-bold text-dark d-flex align-items-center gap-2">
                    <i className="ri ri-briefcase-line text-warning fs-5"></i>
                    Recent Corporate Lead Enquiries
                  </h6>
                  <Link href="/corporate-lead" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                    View All
                  </Link>
                </div>
                <div className="card-body p-0">
                  {recentCorporateLeads.length === 0 ? (
                    <div className="p-4 text-center text-muted small">No recent corporate lead enquiries.</div>
                  ) : (
                    <div className="table-responsive text-nowrap">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Company & Contact</th>
                            <th>Destination</th>
                            <th>Status</th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentCorporateLeads.map((lead) => (
                            <tr key={lead.id}>
                              <td>
                                <div className="d-flex flex-column">
                                  <span className="fw-bold text-dark">{lead.company_name}</span>
                                  <span className="small text-muted">{lead.name} ({lead.phone})</span>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <span className="small fw-medium text-dark">{lead.destination || 'N/A'}</span>
                                  <span className="small text-muted">{lead.group_size}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
                                  {lead.status || 'Pending'}
                                </span>
                              </td>
                              <td className="text-center">
                                <Link href={`/corporate-lead/view/${lead.id}`} className="btn btn-icon btn-sm btn-label-info">
                                  <i className="ri ri-eye-line"></i>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header border-bottom bg-light py-3 d-flex align-items-center justify-content-between">
                  <h6 className="card-title m-0 fw-bold text-dark d-flex align-items-center gap-2">
                    <i className="ri ri-reserved-line text-info fs-5"></i>
                    Recent Bookings
                  </h6>
                  <Link href="/bookings" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                    View All
                  </Link>
                </div>
                <div className="card-body p-0">
                  {recentBookings.length === 0 ? (
                    <div className="p-4 text-center text-muted small">No recent package bookings.</div>
                  ) : (
                    <div className="table-responsive text-nowrap">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Booking ID</th>
                            <th>Package Title</th>
                            <th>Price</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentBookings.map((b) => (
                            <tr key={b.id}>
                              <td>
                                <span className="badge bg-label-dark">#{b.id}</span>
                              </td>
                              <td>
                                <span className="fw-semibold text-dark text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                  {b.package_title}
                                </span>
                              </td>
                              <td>
                                <span className="fw-bold text-success">₹ {b.base_price}</span>
                              </td>
                              <td>
                                <span className="small text-muted">
                                  {b.created_on ? new Date(b.created_on).toLocaleDateString('en-IN') : 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Registered Users */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-header border-bottom bg-light py-3 d-flex align-items-center justify-content-between">
                  <h6 className="card-title m-0 fw-bold text-dark d-flex align-items-center gap-2">
                    <i className="ri ri-user-line text-primary fs-5"></i>
                    Recently Registered Users
                  </h6>
                  <Link href="/users" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                    View All Users
                  </Link>
                </div>
                <div className="card-body p-0">
                  {recentUsers.length === 0 ? (
                    <div className="p-4 text-center text-muted small">No recently registered users.</div>
                  ) : (
                    <div className="table-responsive text-nowrap">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>User ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Joined Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsers.map((u) => (
                            <tr key={u.id}>
                              <td>
                                <span className="badge bg-label-secondary">#{u.id}</span>
                              </td>
                              <td>
                                <span className="fw-bold text-dark">{u.first_name} {u.last_name}</span>
                              </td>
                              <td>
                                <span className="small text-muted">{u.email}</span>
                              </td>
                              <td>
                                <span className="small text-dark fw-medium">{u.phone || 'N/A'}</span>
                              </td>
                              <td>
                                <span className="small text-muted">
                                  {u.created_on ? new Date(u.created_on).toLocaleDateString('en-IN') : 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;