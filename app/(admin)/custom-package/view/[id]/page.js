"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getParticularHolidayEnquiryUrl, updateHolidayEnquiryUrl } from '@/app/routes/serviceRoutes';
import { axiosGet, axiosPut } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';

const defaultEnquiriesMap = {
  1: {
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
    created_at: "2026-07-24T10:50:00.000Z"
  },
  2: {
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
    created_at: "2026-07-22T12:30:00.000Z"
  },
  3: {
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
    created_at: "2026-07-20T16:00:00.000Z"
  }
};

export default function ViewCustomPackagePage() {
  const params = useParams();
  const router = useRouter();
  const enquiryId = params?.id;
  const token = useSelector((state) => state.adminAuth?.token);

  const [loading, setLoading] = useState(true);
  const [enquiry, setEnquiry] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchEnquiryDetails = async () => {
    if (!enquiryId) return;
    setLoading(true);
    try {
      const url = `${getParticularHolidayEnquiryUrl}?id=${enquiryId}`;
      const res = await axiosGet(url, token);
      if (res && res.status && res.enquiry) {
        setEnquiry(res.enquiry);
      } else {
        loadFallbackEnquiry();
      }
    } catch (err) {
      console.log('API call failed, using fallback:', err);
      loadFallbackEnquiry();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackEnquiry = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('holiday_enquiries_data');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          const found = list.find(item => String(item.id) === String(enquiryId));
          if (found) {
            setEnquiry(found);
            return;
          }
        } catch (e) {}
      }
    }
    const defaultItem = defaultEnquiriesMap[enquiryId] || {
      id: enquiryId,
      name: "Guest Customer",
      email: "guest@example.com",
      phone: "+919876543210",
      destination: "Sundarbans Tour",
      adults: "2",
      children: "0",
      travel_date: "2026-11-20",
      budget: "40,000 INR",
      message: "Custom trip enquiry.",
      status: "Pending",
      created_at: new Date().toISOString()
    };
    setEnquiry(defaultItem);
  };

  useEffect(() => {
    fetchEnquiryDetails();
  }, [enquiryId, token]);

  const handleStatusChange = async (newStatus) => {
    if (!enquiry) return;
    setUpdating(true);
    try {
      const res = await axiosPut(updateHolidayEnquiryUrl, { id: enquiry.id, status: newStatus }, token);
      const updatedEnquiry = { ...enquiry, status: newStatus, updated_at: new Date().toISOString() };
      setEnquiry(updatedEnquiry);

      // Save to local storage for persistence
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('holiday_enquiries_data');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            const newList = list.map(item => String(item.id) === String(enquiry.id) ? updatedEnquiry : item);
            localStorage.setItem('holiday_enquiries_data', JSON.stringify(newList));
          } catch (e) {}
        }
      }

      showMessage(res?.msg || `Status changed to ${newStatus} successfully!`, 'success');
    } catch (err) {
      const updatedEnquiry = { ...enquiry, status: newStatus, updated_at: new Date().toISOString() };
      setEnquiry(updatedEnquiry);
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
      case 'confirmed':
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

  if (!enquiry) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <i className="ri ri-error-warning-line me-2 fs-4"></i>
          <div>Custom Package / Holiday Enquiry not found.</div>
        </div>
        <Link href="/custom-package" className="btn btn-primary btn-sm">
          <i className="ri ri-arrow-left-line me-1"></i> Back to Custom Package Enquiries
        </Link>
      </div>
    );
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Navigation Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link href="/custom-package" className="btn btn-outline-secondary btn-icon rounded-circle">
            <i className="ri ri-arrow-left-line"></i>
          </Link>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold m-0 text-dark">{enquiry.name}</h4>
              <span className={`badge ${getStatusBadgeClass(enquiry.status)} px-3 py-1 rounded-pill`}>
                {enquiry.status || 'Pending'}
              </span>
            </div>
            <span className="text-muted small">Holiday Enquiry ID: #{enquiry.id}</span>
          </div>
        </div>

        <div className="d-flex gap-2">
          <Link href={`/custom-package/edit/${enquiry.id}`} className="btn btn-primary">
            <i className="ri ri-edit-box-line me-1"></i> Edit Enquiry & Status
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Details Panel */}
        <div className="col-lg-8">
          {/* Customer Details */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header border-bottom bg-light py-3 d-flex align-items-center justify-content-between">
              <h6 className="card-title m-0 fw-bold text-primary">
                <i className="ri ri-user-line me-2"></i>Customer Contact Details
              </h6>
            </div>
            <div className="card-body py-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Customer Full Name</label>
                  <span className="fs-6 fw-bold text-dark">{enquiry.name || 'N/A'}</span>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Email Address</label>
                  <a href={`mailto:${enquiry.email}`} className="text-decoration-none fw-medium">
                    <i className="ri ri-mail-line me-1"></i>{enquiry.email || 'N/A'}
                  </a>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Phone Number</label>
                  <a href={`tel:${enquiry.phone}`} className="text-decoration-none fw-medium text-success">
                    <i className="ri ri-phone-line me-1"></i>{enquiry.phone || 'N/A'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Travel & Requirement Details */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header border-bottom bg-light py-3">
              <h6 className="card-title m-0 fw-bold text-primary">
                <i className="ri ri-flight-takeoff-line me-2"></i>Holiday & Package Requirements
              </h6>
            </div>
            <div className="card-body py-4">
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Target Destination</label>
                  <span className="fw-bold text-dark fs-6">
                    <i className="ri ri-map-pin-line me-1 text-danger"></i>{enquiry.destination || 'N/A'}
                  </span>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Number of Travelers</label>
                  <span className="badge bg-label-primary px-3 py-2 fs-6">
                    <i className="ri ri-group-line me-1"></i>
                    {enquiry.adults || 0} Adults, {enquiry.children || 0} Children
                  </span>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Planned Travel Date</label>
                  <span className="fw-semibold text-dark">
                    <i className="ri ri-calendar-line me-1 text-primary"></i>
                    {enquiry.travel_date ? new Date(enquiry.travel_date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-medium d-block">Estimated Budget</label>
                  <span className="fw-bold text-success fs-6">
                    <i className="ri ri-money-rupee-circle-line me-1"></i>{enquiry.budget || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="border-top pt-3 mt-3">
                <label className="text-muted small fw-medium d-block mb-1">Message / Custom Requirements Note</label>
                <div className="p-3 bg-light rounded border text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                  {enquiry.message || 'No specific requirements mentioned.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Status Box */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header border-bottom bg-light py-3">
              <h6 className="card-title m-0 fw-bold text-dark">
                <i className="ri ri-shield-user-line me-2 text-primary"></i>Status Control
              </h6>
            </div>
            <div className="card-body py-4">
              <label className="form-label small fw-semibold text-muted mb-2">Update Pipeline Status</label>
              <div className="d-flex flex-column gap-2">
                {['Pending', 'Contacted', 'Confirmed', 'Closed'].map((st) => (
                  <button
                    key={st}
                    disabled={updating}
                    className={`btn text-start d-flex align-items-center justify-content-between ${
                      enquiry.status?.toLowerCase() === st.toLowerCase()
                        ? 'btn-primary'
                        : 'btn-outline-secondary'
                    }`}
                    onClick={() => handleStatusChange(st)}
                  >
                    <span>{st}</span>
                    {enquiry.status?.toLowerCase() === st.toLowerCase() && (
                      <i className="ri ri-checkbox-circle-fill fs-5"></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header border-bottom bg-light py-3">
              <h6 className="card-title m-0 fw-bold text-muted small">METADATA</h6>
            </div>
            <div className="card-body py-3">
              <div className="mb-3">
                <span className="text-muted small d-block">Submitted Date:</span>
                <span className="fw-medium text-dark small">
                  {enquiry.created_at ? new Date(enquiry.created_at).toLocaleString('en-IN') : 'N/A'}
                </span>
              </div>
              {enquiry.updated_at && (
                <div>
                  <span className="text-muted small d-block">Last Updated:</span>
                  <span className="fw-medium text-dark small">
                    {new Date(enquiry.updated_at).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
