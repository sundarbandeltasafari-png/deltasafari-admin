"use client"

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getAllHolidayEnquiriesUrl, updateHolidayEnquiryUrl, createHolidayEnquiryWhatsAppLeadUrl } from '@/app/routes/serviceRoutes';
import { axiosGet, axiosPut, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';

// Fallback seed data if backend API is unseeded or offline
const defaultEnquiries = [
  {
    id: 1,
    name: "Sarah Connor",
    email: "sarah@example.com",
    phone: "+1987654321",
    destination: "Sundarbans Eco Tour",
    adults: "2",
    children: "1",
    travel_date: "2026-11-20",
    budget: "40,000 INR",
    message: "Looking for a weekend family tour with boat safari included.",
    status: "Pending",
    created_at: "2026-07-24T10:50:00.000Z",
    updated_at: "2026-07-24T10:50:00.000Z"
  },
  {
    id: 2,
    name: "David Miller",
    email: "david.m@example.com",
    phone: "+919876501234",
    destination: "Sundarban Hilsa Utsav Special",
    adults: "4",
    children: "0",
    travel_date: "2026-09-15",
    budget: "60,000 INR",
    message: "Custom luxury launch boat request with local seafood catering.",
    status: "Contacted",
    created_at: "2026-07-22T12:30:00.000Z",
    updated_at: "2026-07-23T09:15:00.000Z"
  },
  {
    id: 3,
    name: "Meera Mukherjee",
    email: "meera.m@example.com",
    phone: "+919830112233",
    destination: "Sundarban Photography Safari",
    adults: "2",
    children: "0",
    travel_date: "2026-10-10",
    budget: "35,000 INR",
    message: "Private bird watching and wildlife photography guide required.",
    status: "Confirmed",
    created_at: "2026-07-20T16:00:00.000Z",
    updated_at: "2026-07-21T14:40:00.000Z"
  }
];

export default function CustomPackagePage() {
  const router = useRouter();
  const token = useSelector((state) => state.adminAuth?.token);

  const [loading, setLoading] = useState(true);
  const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [creatingLeadId, setCreatingLeadId] = useState(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await axiosGet(getAllHolidayEnquiriesUrl, token);
      if (res && res.status && Array.isArray(res.enquiries)) {
        setEnquiries(res.enquiries);
      } else {
        loadFallbackEnquiries();
      }
    } catch (err) {
      console.log('Error fetching custom package enquiries, loading local fallback:', err);
      loadFallbackEnquiries();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackEnquiries = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('holiday_enquiries_data');
      if (saved) {
        try {
          setEnquiries(JSON.parse(saved));
          return;
        } catch (e) {}
      }
    }
    setEnquiries(defaultEnquiries);
  };

  useEffect(() => {
    fetchEnquiries();
  }, [token]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await axiosPut(updateHolidayEnquiryUrl, { id, status: newStatus }, token);
      if (res && res.status) {
        showMessage('Status updated successfully.', 'success');
        setEnquiries(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      } else {
        // Fallback update in state and localStorage
        setEnquiries(prev => {
          const updated = prev.map(item => item.id === id ? { ...item, status: newStatus } : item);
          if (typeof window !== 'undefined') {
            localStorage.setItem('holiday_enquiries_data', JSON.stringify(updated));
          }
          return updated;
        });
        showMessage('Status updated locally.', 'success');
      }
    } catch (err) {
      console.log('API update failed, updating local state:', err);
      setEnquiries(prev => {
        const updated = prev.map(item => item.id === id ? { ...item, status: newStatus } : item);
        if (typeof window !== 'undefined') {
          localStorage.setItem('holiday_enquiries_data', JSON.stringify(updated));
        }
        return updated;
      });
      showMessage('Status updated locally.', 'success');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateWhatsAppLead = async (item) => {
    if (!item || !item.id) return;
    setCreatingLeadId(item.id);
    try {
      const res = await axiosPost(createHolidayEnquiryWhatsAppLeadUrl, { enquiry_id: item.id }, token);
      if (res && res.status) {
        showMessage(res.msg || 'Custom WhatsApp lead created successfully!', 'success');
        const contactId = res.contact_id || res.data?.contact_id;
        const cleanPhone = res.phone || item.phone;

        setEnquiries(prev => prev.map(e => e.id === item.id ? {
          ...e,
          whatsapp_lead_id: contactId,
          whatsapp_phone: cleanPhone
        } : e));

        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('holiday_enquiries_data');
          if (saved) {
            try {
              const list = JSON.parse(saved);
              const updated = list.map(e => e.id === item.id ? {
                ...e,
                whatsapp_lead_id: contactId,
                whatsapp_phone: cleanPhone
              } : e);
              localStorage.setItem('holiday_enquiries_data', JSON.stringify(updated));
            } catch (e) {}
          }
        }
      } else {
        showMessage(res?.msg || 'Failed to create WhatsApp lead.', 'error');
      }
    } catch (err) {
      console.error('Error creating WhatsApp lead:', err);
      const errMsg = err.response?.data?.msg || err.message || 'Error creating WhatsApp lead.';
      showMessage(errMsg, 'error');
    } finally {
      setCreatingLeadId(null);
    }
  };

  const handleViewWhatsAppLead = (item) => {
    const rawPhone = item.whatsapp_phone || item.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const searchVal = cleanPhone || encodeURIComponent(item.name || '');
    const contactId = item.whatsapp_lead_id || '';
    router.push(`/crm/whatsapp?search=${searchVal}&contactId=${contactId}&autoOpen=true`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-label-warning text-warning';
      case 'contacted':
        return 'bg-label-info text-info';
      case 'confirmed':
        return 'bg-label-success text-success';
      case 'closed':
        return 'bg-label-danger text-danger';
      default:
        return 'bg-label-secondary text-secondary';
    }
  };

  const metrics = useMemo(() => {
    const total = enquiries.length;
    const pending = enquiries.filter(e => e.status?.toLowerCase() === 'pending').length;
    const contacted = enquiries.filter(e => e.status?.toLowerCase() === 'contacted').length;
    const confirmed = enquiries.filter(e => e.status?.toLowerCase() === 'confirmed').length;
    const closed = enquiries.filter(e => e.status?.toLowerCase() === 'closed').length;
    return { total, pending, contacted, confirmed, closed };
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(item => {
      const matchesStatus = statusFilter === 'All' || item.status?.toLowerCase() === statusFilter.toLowerCase();
      const itemPlatform = item.platform || 'deltasafari';
      const matchesPlatform = platformFilter === 'All' ||
        (platformFilter === 'deltasafari' && itemPlatform === 'deltasafari') ||
        (platformFilter === 'sundarban-deltasafari' && (itemPlatform === 'sundarban-deltasafari' || (item.destination || '').toLowerCase().includes('sundarban')));

      const term = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        item.name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.phone?.toLowerCase().includes(term) ||
        item.destination?.toLowerCase().includes(term);

      return matchesStatus && matchesPlatform && matchesSearch;
    });
  }, [enquiries, statusFilter, platformFilter, searchTerm]);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold m-0 text-primary">
            <i className="ri ri-compass-3-line me-2"></i>Custom Package / Holiday Enquiries
          </h4>
          <p className="text-muted mb-0 small">
            View and manage custom tour requests, guest requirements, budgets, and booking status.
          </p>
        </div>
        <div>
          <button className="btn btn-outline-secondary btn-sm me-2" onClick={fetchEnquiries}>
            <i className="ri ri-refresh-line me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 border-start border-4 border-primary">
            <div className="card-body py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1 text-muted small fw-medium">Total Enquiries</h6>
                  <h4 className="mb-0 fw-bold">{metrics.total}</h4>
                </div>
                <div className="avatar avatar-sm bg-label-primary rounded p-2">
                  <i className="ri ri-compass-3-line fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 border-start border-4 border-warning">
            <div className="card-body py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1 text-muted small fw-medium">Pending</h6>
                  <h4 className="mb-0 fw-bold text-warning">{metrics.pending}</h4>
                </div>
                <div className="avatar avatar-sm bg-label-warning rounded p-2">
                  <i className="ri ri-time-line fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 border-start border-4 border-info">
            <div className="card-body py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1 text-muted small fw-medium">Contacted</h6>
                  <h4 className="mb-0 fw-bold text-info">{metrics.contacted}</h4>
                </div>
                <div className="avatar avatar-sm bg-label-info rounded p-2">
                  <i className="ri ri-phone-line fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 border-start border-4 border-success">
            <div className="card-body py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1 text-muted small fw-medium">Confirmed</h6>
                  <h4 className="mb-0 fw-bold text-success">{metrics.confirmed}</h4>
                </div>
                <div className="avatar avatar-sm bg-label-success rounded p-2">
                  <i className="ri ri-checkbox-circle-line fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table & Filter Container */}
      <div className="card shadow-sm border-0">
        <div className="card-header border-bottom py-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-6 col-lg-4">
              <div className="input-group input-group-merge">
                <span className="input-group-text"><i className="ri ri-search-line"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, phone, destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchTerm('')}>
                    <i className="ri ri-close-line"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-6 col-lg-5 ms-auto d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
              <label className="fw-medium text-muted small mb-0 me-1">Platform:</label>
              <select
                className="form-select form-select-sm w-auto"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="All">All Platforms</option>
                <option value="deltasafari">⛵ Delta Safari</option>
                <option value="sundarban-deltasafari">🐅 Sundarban Safari</option>
              </select>

              <label className="fw-medium text-muted small mb-0 me-1 ms-2">Status:</label>
              <select
                className="form-select form-select-sm w-auto"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Contacted">Contacted</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-5 text-center">
            <LoadingComponent />
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-4">
            <NotFound message="No custom package enquiries found matching your search." />
          </div>
        ) : (
          <div className="table-responsive text-nowrap">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Customer Name & Contact</th>
                  <th>Destination & Guests</th>
                  <th>Travel Date & Budget</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-center">WhatsApp Lead</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="badge bg-label-dark font-monospace">#{item.id}</span>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-bold text-dark">{item.name}</span>
                        <div className="d-flex gap-2 align-items-center small text-muted">
                          <span><i className="ri ri-mail-line me-1"></i>{item.email}</span>
                          <span>|</span>
                          <span><i className="ri ri-phone-line me-1"></i>{item.phone}</span>
                        </div>
                        <div className="mt-1">
                          {(item.platform === 'sundarban-deltasafari' || (item.destination || '').toLowerCase().includes('sundarban')) ? (
                            <span className="badge bg-success-subtle text-success border border-success border-opacity-25 rounded-pill px-2 py-0.5" style={{ fontSize: '10px', fontWeight: '700' }}>
                              <i className="ri ri-compass-3-line me-1"></i>Sundarban Safari
                            </span>
                          ) : (
                            <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 rounded-pill px-2 py-0.5" style={{ fontSize: '10px', fontWeight: '700' }}>
                              <i className="ri ri-global-line me-1"></i>Delta Safari
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-medium text-dark">{item.destination || 'N/A'}</span>
                        <span className="small text-muted">
                          <i className="ri ri-user-2-line me-1 text-primary"></i>
                          {item.adults || 0} Adults, {item.children || 0} Children
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-medium">
                          <i className="ri ri-calendar-event-line me-1 text-primary"></i>
                          {item.travel_date ? new Date(item.travel_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </span>
                        <span className="fw-bold text-success small mt-1">
                          <i className="ri ri-money-rupee-circle-line me-1"></i>{item.budget || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <span className={`badge ${getStatusBadgeClass(item.status)} px-2 py-1`}>
                          {item.status || 'Pending'}
                        </span>
                        <select
                          className="form-select form-select-sm border-0 bg-transparent text-muted p-0 ms-1 cursor-pointer"
                          style={{ width: '24px', boxShadow: 'none' }}
                          value={item.status || 'Pending'}
                          disabled={updatingId === item.id}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          title="Quick change status"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <span className="small text-muted">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </span>
                    </td>
                    <td className="text-center">
                      {item.whatsapp_lead_id ? (
                        <div className="d-inline-flex align-items-center gap-1.5">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary d-inline-flex align-items-center gap-1"
                            disabled
                            title={`WhatsApp Lead #${item.whatsapp_lead_id} is already created`}
                            style={{ cursor: 'not-allowed', opacity: 0.75 }}
                          >
                            <i className="ri ri-checkbox-circle-fill text-success"></i>
                            <span>Create Lead</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-success d-inline-flex align-items-center gap-1 shadow-sm fw-medium"
                            onClick={() => handleViewWhatsAppLead(item)}
                            title="View this Lead in WhatsApp CRM Section"
                          >
                            <i className="ri ri-whatsapp-fill"></i>
                            <span>View</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-success d-inline-flex align-items-center gap-1 shadow-sm fw-medium"
                          disabled={creatingLeadId === item.id}
                          onClick={() => handleCreateWhatsAppLead(item)}
                          title="Create Custom WhatsApp Lead from this enquiry"
                        >
                          {creatingLeadId === item.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span>
                              <span>Creating...</span>
                            </>
                          ) : (
                            <>
                              <i className="ri ri-whatsapp-line"></i>
                              <span>Create Lead</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        {item.whatsapp_lead_id && (
                          <button
                            type="button"
                            onClick={() => handleViewWhatsAppLead(item)}
                            className="btn btn-icon btn-sm btn-label-success"
                            title="View in WhatsApp CRM"
                          >
                            <i className="ri ri-whatsapp-fill icon-18px"></i>
                          </button>
                        )}
                        <Link
                          href={`/custom-package/view/${item.id}`}
                          className="btn btn-icon btn-sm btn-label-info"
                          title="View Details"
                        >
                          <i className="ri ri-eye-line icon-18px"></i>
                        </Link>
                        <Link
                          href={`/custom-package/edit/${item.id}`}
                          className="btn btn-icon btn-sm btn-label-primary"
                          title="Edit Enquiry & Status"
                        >
                          <i className="ri ri-edit-box-line icon-18px"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card-footer border-top py-3 d-flex justify-content-between align-items-center">
          <span className="small text-muted">
            Showing {filteredEnquiries.length} of {enquiries.length} custom package enquiries
          </span>
        </div>
      </div>
    </div>
  );
}
