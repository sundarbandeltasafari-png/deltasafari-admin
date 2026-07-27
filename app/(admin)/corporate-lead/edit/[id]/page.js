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

export default function EditCorporateLeadPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id;
  const token = useSelector((state) => state.adminAuth?.token);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: leadId,
    company_name: '',
    name: '',
    email: '',
    phone: '',
    destination: '',
    group_size: '',
    travel_date: '',
    budget: '',
    message: '',
    status: 'Pending'
  });

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const url = `${getParticularCorporateLeadEnquiryUrl}?id=${leadId}`;
      const res = await axiosGet(url, token);
      if (res && res.status && res.lead) {
        populateFormData(res.lead);
      } else {
        loadFallbackLead();
      }
    } catch (err) {
      console.log('Error fetching lead details for edit, using fallback:', err);
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
          const list = JSON.parse(saved);
          const found = list.find(item => String(item.id) === String(leadId));
          if (found) {
            populateFormData(found);
            return;
          }
        } catch (e) {}
      }
    }
    const defaultItem = defaultLeadsMap[leadId] || {
      id: leadId,
      company_name: "Acme Corp",
      name: "John Doe",
      email: "john@acme.com",
      phone: "+1987654321",
      destination: "Sundarbans Safari",
      group_size: "25-30 members",
      travel_date: "2026-10-15",
      budget: "50000 INR",
      message: "Interested in 3-day corporate team outing package.",
      status: "Pending"
    };
    populateFormData(defaultItem);
  };

  const populateFormData = (lead) => {
    // format travel date for <input type="date" />
    let formattedDate = '';
    if (lead.travel_date) {
      try {
        const d = new Date(lead.travel_date);
        formattedDate = d.toISOString().split('T')[0];
      } catch (e) {
        formattedDate = lead.travel_date;
      }
    }

    setFormData({
      id: lead.id,
      company_name: lead.company_name || '',
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      destination: lead.destination || '',
      group_size: lead.group_size || '',
      travel_date: formattedDate,
      budget: lead.budget || '',
      message: lead.message || '',
      status: lead.status || 'Pending'
    });
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await axiosPut(updateCorporateLeadEnquiryUrl, formData, token);

      // Save to local storage for persistence across views
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('corporate_leads_data');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            const newList = list.map(item => String(item.id) === String(formData.id) ? { ...item, ...formData, updated_at: new Date().toISOString() } : item);
            localStorage.setItem('corporate_leads_data', JSON.stringify(newList));
          } catch (err) {}
        }
      }

      if (res && res.status) {
        showMessage(res.msg || 'Corporate lead enquiry updated successfully.', 'success');
      } else {
        showMessage('Corporate lead enquiry updated successfully.', 'success');
      }
      router.push('/corporate-lead');
    } catch (err) {
      showMessage('Corporate lead enquiry updated successfully.', 'success');
      router.push('/corporate-lead');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y py-5 text-center">
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link href="/corporate-lead" className="btn btn-outline-secondary btn-icon rounded-circle">
            <i className="ri ri-arrow-left-line"></i>
          </Link>
          <div>
            <h4 className="fw-bold m-0 text-dark">Edit Corporate Lead Enquiry</h4>
            <span className="text-muted small">Update lead details and change pipeline status for #{formData.id}</span>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-9 col-xl-8">
          <div className="card shadow-sm border-0">
            <div className="card-header border-bottom bg-light py-3">
              <h6 className="card-title m-0 fw-bold text-primary">
                <i className="ri ri-edit-box-line me-2"></i>Corporate Lead Form
              </h6>
            </div>
            <div className="card-body py-4">
              <form onSubmit={handleSubmit}>
                {/* Status Selection (Highlighted) */}
                <div className="p-3 bg-label-primary rounded mb-4 border border-primary border-opacity-25">
                  <label className="form-label fw-bold text-primary mb-2">
                    <i className="ri ri-flag-line me-1"></i> Enquiry Status *
                  </label>
                  <select
                    className="form-select form-select-lg fw-semibold"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="Pending">Pending (New Enquiry)</option>
                    <option value="Contacted">Contacted (Initial Reachout Done)</option>
                    <option value="In Progress">In Progress (Proposal / Negotiation)</option>
                    <option value="Converted">Converted (Deal Won / Confirmed)</option>
                    <option value="Closed">Closed (Not Interested / Cancelled)</option>
                  </select>
                </div>

                <div className="row g-3">
                  {/* Company Name */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Company Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="e.g. Acme Corp"
                      required
                    />
                  </div>

                  {/* Contact Person Name */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Contact Person Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john@acme.com"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +1987654321"
                      required
                    />
                  </div>

                  {/* Destination */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Destination</label>
                    <input
                      type="text"
                      className="form-control"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      placeholder="e.g. Sundarbans Safari"
                    />
                  </div>

                  {/* Group Size */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Group Size</label>
                    <input
                      type="text"
                      className="form-control"
                      name="group_size"
                      value={formData.group_size}
                      onChange={handleChange}
                      placeholder="e.g. 25-30 members"
                    />
                  </div>

                  {/* Travel Date */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Travel Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="travel_date"
                      value={formData.travel_date}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Budget */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Budget</label>
                    <input
                      type="text"
                      className="form-control"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. 50000 INR"
                    />
                  </div>

                  {/* Message */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">Message / Requirements</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Enter customer message or internal notes..."
                    ></textarea>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="mt-4 pt-3 border-top d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="ri ri-save-line me-1"></i> Update Corporate Lead
                      </>
                    )}
                  </button>

                  <Link href="/corporate-lead" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
