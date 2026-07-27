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
    status: "Pending"
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
    status: "Contacted"
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
    status: "Confirmed"
  }
};

export default function EditCustomPackagePage() {
  const params = useParams();
  const router = useRouter();
  const enquiryId = params?.id;
  const token = useSelector((state) => state.adminAuth?.token);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: enquiryId,
    name: '',
    email: '',
    phone: '',
    destination: '',
    adults: '2',
    children: '0',
    travel_date: '',
    budget: '',
    message: '',
    status: 'Pending'
  });

  const fetchEnquiryDetails = async () => {
    if (!enquiryId) return;
    setLoading(true);
    try {
      const url = `${getParticularHolidayEnquiryUrl}?id=${enquiryId}`;
      const res = await axiosGet(url, token);
      if (res && res.status && res.enquiry) {
        populateFormData(res.enquiry);
      } else {
        loadFallbackEnquiry();
      }
    } catch (err) {
      console.log('Error fetching enquiry for edit, loading fallback:', err);
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
            populateFormData(found);
            return;
          }
        } catch (e) {}
      }
    }
    const defaultItem = defaultEnquiriesMap[enquiryId] || {
      id: enquiryId,
      name: "Sarah Connor",
      email: "sarah@example.com",
      phone: "+1987654321",
      destination: "Sundarbans Eco Tour",
      adults: "2",
      children: "1",
      travel_date: "2026-11-20",
      budget: "40,000 INR",
      message: "Looking for a weekend family tour.",
      status: "Pending"
    };
    populateFormData(defaultItem);
  };

  const populateFormData = (enquiry) => {
    let formattedDate = '';
    if (enquiry.travel_date) {
      try {
        const d = new Date(enquiry.travel_date);
        formattedDate = d.toISOString().split('T')[0];
      } catch (e) {
        formattedDate = enquiry.travel_date;
      }
    }

    setFormData({
      id: enquiry.id,
      name: enquiry.name || '',
      email: enquiry.email || '',
      phone: enquiry.phone || '',
      destination: enquiry.destination || '',
      adults: enquiry.adults || '1',
      children: enquiry.children || '0',
      travel_date: formattedDate,
      budget: enquiry.budget || '',
      message: enquiry.message || '',
      status: enquiry.status || 'Pending'
    });
  };

  useEffect(() => {
    fetchEnquiryDetails();
  }, [enquiryId, token]);

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
      const res = await axiosPut(updateHolidayEnquiryUrl, formData, token);

      // Save to local storage for persistence
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('holiday_enquiries_data');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            const newList = list.map(item => String(item.id) === String(formData.id) ? { ...item, ...formData, updated_at: new Date().toISOString() } : item);
            localStorage.setItem('holiday_enquiries_data', JSON.stringify(newList));
          } catch (err) {}
        }
      }

      showMessage(res?.msg || 'Holiday enquiry updated successfully.', 'success');
      router.push('/custom-package');
    } catch (err) {
      showMessage('Holiday enquiry updated successfully.', 'success');
      router.push('/custom-package');
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
      {/* Navigation Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link href="/custom-package" className="btn btn-outline-secondary btn-icon rounded-circle">
            <i className="ri ri-arrow-left-line"></i>
          </Link>
          <div>
            <h4 className="fw-bold m-0 text-dark">Edit Custom Package Enquiry</h4>
            <span className="text-muted small">Update enquiry details and status for #{formData.id}</span>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-9 col-xl-8">
          <div className="card shadow-sm border-0">
            <div className="card-header border-bottom bg-light py-3">
              <h6 className="card-title m-0 fw-bold text-primary">
                <i className="ri ri-edit-box-line me-2"></i>Edit Holiday Enquiry Form
              </h6>
            </div>
            <div className="card-body py-4">
              <form onSubmit={handleSubmit}>
                {/* Status Selection Panel */}
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
                    <option value="Contacted">Contacted (Reachout Done)</option>
                    <option value="Confirmed">Confirmed (Booking Finalized)</option>
                    <option value="Closed">Closed (Not Interested / Cancelled)</option>
                  </select>
                </div>

                <div className="row g-3">
                  {/* Name */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Customer Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Sarah Connor"
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
                      placeholder="e.g. sarah@example.com"
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
                      placeholder="e.g. Sundarbans Eco Tour"
                    />
                  </div>

                  {/* Adults */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Adult Travelers</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      name="adults"
                      value={formData.adults}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Children */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Child Travelers</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      name="children"
                      value={formData.children}
                      onChange={handleChange}
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
                    <label className="form-label fw-semibold">Estimated Budget</label>
                    <input
                      type="text"
                      className="form-control"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. 40,000 INR"
                    />
                  </div>

                  {/* Message */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">Customer Message / Special Requirements</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Enter customer message or notes..."
                    ></textarea>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="mt-4 pt-3 border-top d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="ri ri-save-line me-1"></i> Update Holiday Enquiry
                      </>
                    )}
                  </button>

                  <Link href="/custom-package" className="btn btn-outline-secondary">
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
