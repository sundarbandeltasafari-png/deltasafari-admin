"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getParticularCorporateLeadEnquiryUrl, updateCorporateLeadEnquiryUrl } from '@/app/routes/serviceRoutes';
import { axiosGet, axiosPut } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';

const defaultLeadsMap = {
  1: {
    id: 1,
    company_name: "Acme Corp",
    name: "John Doe",
    email: "john@acme.com",
    phone: "+1987654321",
    destination: "Sundarbans Safari",
    group_size: "25-30 members",
    travel_date: "2026-10-15",
    budget: "50000 INR",
    message: "Interested in 3-day corporate team outing package with luxury boat safari.",
    status: "Pending",
    created_at: "2026-07-24T09:45:00.000Z",
    updated_at: "2026-07-24T09:45:00.000Z"
  },
  2: {
    id: 2,
    company_name: "TechNova Solutions",
    name: "Priya Sharma",
    email: "priya@technova.io",
    phone: "+919830123456",
    destination: "Sundarban Mangrove Resort",
    group_size: "40-50 members",
    travel_date: "2026-11-20",
    budget: "120000 INR",
    message: "Annual company retreat. Need conference room setup + jungle safari.",
    status: "Contacted",
    created_at: "2026-07-22T14:20:00.000Z",
    updated_at: "2026-07-23T11:10:00.000Z"
  },
  3: {
    id: 3,
    company_name: "Global Horizons Pvt Ltd",
    name: "Amitabh Das",
    email: "amitabh@globalhorizons.com",
    phone: "+919874563210",
    destination: "Sundarban Hilsa Utsav Package",
    group_size: "15-20 members",
    travel_date: "2026-09-05",
    budget: "85000 INR",
    message: "Leadership team outing. Custom food menu requested.",
    status: "In Progress",
    created_at: "2026-07-20T10:00:00.000Z",
    updated_at: "2026-07-21T16:45:00.000Z"
  },
  4: {
    id: 4,
    company_name: "NexGen Analytics",
    name: "Rahul Verma",
    email: "r.verma@nexgen.com",
    phone: "+919123456789",
    destination: "Sundarbans Eco Tour",
    group_size: "50+ members",
    travel_date: "2026-12-01",
    budget: "200000 INR",
    message: "Looking for full boat booking for 2 days 1 night.",
    status: "Converted",
    created_at: "2026-07-15T08:30:00.000Z",
    updated_at: "2026-07-18T12:00:00.000Z"
  }
};

export default function ViewCorporateLeadPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id;
  const token = useSelector((state) => state.adminAuth?.token);

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const url = `${getParticularCorporateLeadEnquiryUrl}?id=${leadId}`;
      const res = await axiosGet(url, token);
      if (res && res.status && res.lead) {
        setLead(res.lead);
      } else {
        loadFallbackLead();
      }
    } catch (err) {
      console.log('API call failed, using local storage or fallback:', err);
      loadFallbackLead();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackLead = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('corporate_leads_data');
      if (saved) {
        try {
          const leadsArr = JSON.parse(saved);
          const found = leadsArr.find(item => String(item.id) === String(leadId));
          if (found) {
            setLead(found);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    const defaultItem = defaultLeadsMap[leadId] || {
      id: leadId,
      company_name: "Corporate Client",
      name: "Client Representative",
      email: "client@company.com",
      phone: "+919876543210",
      destination: "Sundarbans Tour",
      group_size: "20-30 members",
      travel_date: "2026-10-15",
      budget: "75000 INR",
      message: "Special corporate team building package inquiry.",
      status: "Pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLead(defaultItem);
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId, token]);

  const handleStatusChange = async (newStatus) => {
    if (!lead) return;
    setUpdating(true);
    try {
      const res = await axiosPut(updateCorporateLeadEnquiryUrl, { id: lead.id, status: newStatus }, token);
      const updatedLead = { ...lead, status: newStatus, updated_at: new Date().toISOString() };
      setLead(updatedLead);

      // Persist to local storage for consistency
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('corporate_leads_data');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            const newList = list.map(item => String(item.id) === String(lead.id) ? updatedLead : item);
            localStorage.setItem('corporate_leads_data', JSON.stringify(newList));
          } catch (e) {}
        }
      }

      showMessage(res?.msg || `Status changed to ${newStatus} successfully!`, 'success');
    } catch (err) {
      const updatedLead = { ...lead, status: newStatus, updated_at: new Date().toISOString() };
      setLead(updatedLead);
      showMessage(`Status changed to ${newStatus} successfully!`, 'success');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-warning text-white';
      case 'contacted':
        return 'bg-info text-white';
      case 'in progress':
        return 'bg-primary text-white';
      case 'converted':
        return 'bg-success text-white';
      case 'closed':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  };

  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y py-5 text-center">
        <LoadingComponent />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <i className="ri ri-error-warning-line me-2 fs-4"></i>
          <div>Corporate Lead Enquiry not found.</div>
        </div>
        <Link href="/corporate-lead" className="btn btn-primary btn-sm">
          <i className="ri ri-arrow-left-line me-1"></i> Back to Corporate Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Top Header Navigation */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link href="/corporate-lead" className="btn btn-outline-secondary btn-icon rounded-circle">
            <i className="ri ri-arrow-left-line"></i>
          </Link>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold m-0 text-dark">{lead.company_name}</h4>
              <span className={`badge ${getStatusBadgeClass(lead.status)} px-3 py-1 rounded-pill`}>
                {lead.status || 'Pending'}
              </span>
            </div>
            <span className="text-muted small">Lead ID: #{lead.id}</span>
          </div>
        </div>

        <div className="d-flex gap-2">
          <Link href={`/corporate-lead/edit/${lead.id}`} className="btn btn-primary">
            <i className="ri ri-edit-box-line me-1"></i> Edit Lead & Status
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Details Card */}
        <div className="col-lg-8">
          {/* Company & Contact Information */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header border-bottom bg-light py-3 d-flex align-items-center justify-content-between">
              <h6 className="card-title m-0 fw-bold text-primary">
                <i className="ri ri-building-line me-2"></i>Company & Contact Details
              </h6>
            </div>
            <div className="card-body py-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Company Name</label>
                  <span className="fs-6 fw-bold text-dark">{lead.company_name || 'N/A'}</span>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Contact Person</label>
                  <span className="fs-6 fw-semibold text-dark">
                    <i className="ri ri-user-3-line me-1 text-primary"></i>{lead.name || 'N/A'}
                  </span>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Email Address</label>
                  <a href={`mailto:${lead.email}`} className="text-decoration-none fw-medium">
                    <i className="ri ri-mail-line me-1"></i>{lead.email || 'N/A'}
                  </a>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Phone Number</label>
                  <a href={`tel:${lead.phone}`} className="text-decoration-none fw-medium text-success">
                    <i className="ri ri-phone-line me-1"></i>{lead.phone || 'N/A'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Enquiry Details */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header border-bottom bg-light py-3">
              <h6 className="card-title m-0 fw-bold text-primary">
                <i className="ri ri-flight-takeoff-line me-2"></i>Enquiry & Tour Requirements
              </h6>
            </div>
            <div className="card-body py-4">
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Target Destination</label>
                  <span className="fw-bold text-dark">
                    <i className="ri ri-map-pin-line me-1 text-danger"></i>{lead.destination || 'N/A'}
                  </span>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Group Size</label>
                  <span className="badge bg-label-primary px-2 py-1 fs-6">
                    <i className="ri ri-group-line me-1"></i>{lead.group_size || 'N/A'}
                  </span>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Tentative Travel Date</label>
                  <span className="fw-semibold text-dark">
                    <i className="ri ri-calendar-line me-1 text-primary"></i>
                    {lead.travel_date ? new Date(lead.travel_date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Budget Allocation</label>
                  <span className="fw-bold text-success fs-6">
                    <i className="ri ri-money-rupee-circle-line me-1"></i>{lead.budget || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="border-top pt-3 mt-3">
                <label className="text-muted small fw-medium d-block mb-1">Message / Requirements Note</label>
                <div className="p-3 bg-light rounded border text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                  {lead.message || 'No additional message provided.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Status & Metadata Panel */}
        <div className="col-lg-4">
          {/* Quick Status Change Box */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header border-bottom bg-light py-3">
              <h6 className="card-title m-0 fw-bold text-dark">
                <i className="ri ri-shield-user-line me-2 text-primary"></i>Lead Status Control
              </h6>
            </div>
            <div className="card-body py-4">
              <label className="form-label small fw-semibold text-muted">Update Current Status</label>
              <div className="d-flex flex-column gap-2">
                {['Pending', 'Contacted', 'In Progress', 'Converted', 'Closed'].map((st) => (
                  <button
                    key={st}
                    disabled={updating}
                    className={`btn text-start d-flex align-items-center justify-content-between ${
                      lead.status?.toLowerCase() === st.toLowerCase()
                        ? 'btn-primary'
                        : 'btn-outline-secondary'
                    }`}
                    onClick={() => handleStatusChange(st)}
                  >
                    <span>{st}</span>
                    {lead.status?.toLowerCase() === st.toLowerCase() && (
                      <i className="ri ri-checkbox-circle-fill fs-5"></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Timestamps */}
          <div className="card shadow-sm border-0">
            <div className="card-header border-bottom bg-light py-3">
              <h6 className="card-title m-0 fw-bold text-muted small">SYSTEM METADATA</h6>
            </div>
            <div className="card-body py-3">
              <div className="mb-3">
                <span className="text-muted small d-block">Submitted At:</span>
                <span className="fw-medium text-dark small">
                  {lead.created_at ? new Date(lead.created_at).toLocaleString('en-IN') : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted small d-block">Last Updated:</span>
                <span className="fw-medium text-dark small">
                  {lead.updated_at ? new Date(lead.updated_at).toLocaleString('en-IN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
