"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { getSundarbanLeadsUrl, createSundarbanLeadUrl, createSundarbanLeadFromEnquiryUrl } from '@/app/routes/sundarbanRoutes';
import { updateHolidayEnquiryUrl } from '@/app/routes/serviceRoutes';
import { axiosGet, axiosPost, axiosPut } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';

const initialCreateForm = {
    enquiry_id: null,
    full_name: '',
    phone: '',
    email: '',
    destination: 'Sundarban Custom Safari',
    departure_city: 'Kolkata',
    travel_date: '',
    duration_days: 2,
    duration_nights: 1,
    adults_count: 2,
    children_count: 0,
    hotel_category: 'Eco Luxury Resort',
    meal_plan: 'All Meals Included (Bengali Traditional Cuisine)',
    cab_type: 'AC Car / Launch Boat Transfer',
    budget: '',
    status: 'Pending',
    message: ''
};

export default function SundarbanLeadsPage() {
    const router = useRouter();
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedLead, setSelectedLead] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [creatingLeadId, setCreatingLeadId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createForm, setCreateForm] = useState(initialCreateForm);

    const fetchLeads = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosGet(getSundarbanLeadsUrl, token);
            if (res && res.status && Array.isArray(res.leads)) {
                setLeads(res.leads);
            } else {
                setLeads([]);
            }
        } catch (err) {
            console.error("Error fetching Sundarban leads:", err);
            showMessage(err?.message || "Failed to load leads", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [token]);

    const handleStatusChange = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const res = await axiosPut(updateHolidayEnquiryUrl, { id, status: newStatus }, token);
            if (res && res.status) {
                showMessage("Lead status updated successfully.", "success");
                setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
                if (selectedLead && selectedLead.id === id) {
                    setSelectedLead(prev => ({ ...prev, status: newStatus }));
                }
            } else {
                showMessage(res?.msg || "Failed to update status", "error");
            }
        } catch (err) {
            showMessage(err?.message || "Failed to update status", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    // Convert custom package enquiry directly to official WhatsApp / CRM Lead
    const handleCreateLeadFromEnquiry = async (item) => {
        if (!item || !item.id) return;
        setCreatingLeadId(item.id);
        try {
            const res = await axiosPost(createSundarbanLeadFromEnquiryUrl, { enquiry_id: item.id }, token);
            if (res && res.status) {
                showMessage(res.msg || 'Custom CRM lead created successfully!', 'success');
                const contactId = res.contact_id || res.data?.contact_id;
                const cleanPhone = res.phone || item.phone;

                setLeads(prev => prev.map(l => l.id === item.id ? {
                    ...l,
                    whatsapp_lead_id: contactId,
                    whatsapp_phone: cleanPhone
                } : l));

                if (selectedLead && selectedLead.id === item.id) {
                    setSelectedLead(prev => ({
                        ...prev,
                        whatsapp_lead_id: contactId,
                        whatsapp_phone: cleanPhone
                    }));
                }
            } else {
                showMessage(res?.msg || 'Failed to create custom lead.', 'error');
            }
        } catch (err) {
            console.error('Error creating lead from enquiry:', err);
            showMessage(err?.message || 'Error creating lead from enquiry.', 'error');
        } finally {
            setCreatingLeadId(null);
        }
    };

    // Open lead in CRM
    const handleViewWhatsAppLead = (item) => {
        const rawPhone = item.whatsapp_phone || item.phone || '';
        const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
        const searchVal = cleanPhone || encodeURIComponent(item.full_name || item.name || '');
        const contactId = item.whatsapp_lead_id || '';
        router.push(`/crm/whatsapp?search=${searchVal}&contactId=${contactId}&autoOpen=true`);
    };

    // Open modal prefilled with enquiry details
    const handleOpenPrefilledModal = (item) => {
        setCreateForm({
            enquiry_id: item.id,
            full_name: item.full_name || item.name || '',
            phone: item.phone || '',
            email: item.email || '',
            destination: item.destination || 'Sundarban Custom Safari',
            departure_city: item.departure_city || 'Kolkata',
            travel_date: item.travel_date ? String(item.travel_date).slice(0, 10) : '',
            duration_days: Number(item.duration_days) || 2,
            duration_nights: Number(item.duration_nights) || 1,
            adults_count: Number(item.adults_count || item.adults) || 2,
            children_count: Number(item.children_count || item.children) || 0,
            hotel_category: item.hotel_category || 'Eco Luxury Resort',
            meal_plan: item.meal_plan || 'All Meals Included (Bengali Traditional Cuisine)',
            cab_type: item.cab_type || 'AC Car / Launch Boat Transfer',
            budget: item.budget || '',
            status: item.status || 'Pending',
            message: item.message || item.special_notes || ''
        });
        setShowCreateModal(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!createForm.full_name?.trim() || !createForm.phone?.trim()) {
            showMessage("Guest full name and phone number are required.", "error");
            return;
        }

        setCreateSubmitting(true);
        try {
            let res;
            if (createForm.enquiry_id) {
                res = await axiosPost(createSundarbanLeadFromEnquiryUrl, createForm, token);
            } else {
                res = await axiosPost(createSundarbanLeadUrl, createForm, token);
            }

            if (res && res.status) {
                showMessage(res.msg || "Custom Sundarban tour lead created successfully!", "success");
                setShowCreateModal(false);
                setCreateForm(initialCreateForm);
                fetchLeads();
            } else {
                showMessage(res?.msg || "Failed to create custom lead.", "error");
            }
        } catch (err) {
            console.error("Error creating custom lead:", err);
            showMessage(err?.message || "Failed to create lead", "error");
        } finally {
            setCreateSubmitting(false);
        }
    };

    const filteredLeads = useMemo(() => {
        return leads.filter((item) => {
            const matchesStatus = statusFilter === 'All' || (item.status || '').toLowerCase() === statusFilter.toLowerCase();
            const term = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                (item.full_name || item.name || '').toLowerCase().includes(term) ||
                (item.phone || '').toLowerCase().includes(term) ||
                (item.email || '').toLowerCase().includes(term) ||
                (item.destination || '').toLowerCase().includes(term);

            return matchesStatus && matchesSearch;
        });
    }, [leads, statusFilter, searchTerm]);

    const getStatusBadge = (status) => {
        const s = (status || 'Pending').toLowerCase();
        if (s === 'confirmed') return 'bg-success text-white';
        if (s === 'contacted') return 'bg-info text-white';
        if (s === 'closed') return 'bg-secondary text-white';
        return 'bg-warning text-dark';
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1">
                            <i className="ri ri-user-voice-line me-1"></i> Custom Tour Enquiries
                        </span>
                    </div>
                    <h4 className="fw-bold mb-1 text-dark">Sundarban Customized Leads</h4>
                    <p className="text-muted small mb-0">
                        Tailored vacation requests submitted through the Sundarban DeltaSafari custom tour planner.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button 
                        type="button" 
                        className="btn btn-success d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm fw-semibold" 
                        onClick={() => { setCreateForm(initialCreateForm); setShowCreateModal(true); }}
                    >
                        <i className="ri ri-user-add-line"></i> Create Custom Lead
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-outline-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm" 
                        onClick={fetchLeads}
                    >
                        <i className="ri ri-refresh-line"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Main Card */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                <div className="card-header bg-white border-bottom p-3">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-5">
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="ri ri-search-line text-muted"></i>
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control bg-light border-start-0" 
                                    placeholder="Search by client name, phone, email..." 
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

                        <div className="col-md-7 d-flex justify-content-md-end align-items-center gap-2 flex-wrap">
                            <label className="text-muted small fw-bold text-uppercase mb-0">Status:</label>
                            <select 
                                className="form-select form-select-sm w-auto fw-semibold" 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses ({leads.length})</option>
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="table-responsive text-nowrap">
                    {loading ? (
                        <div className="p-5 text-center">
                            <LoadingComponent />
                            <p className="text-muted mt-2">Loading Sundarban customized leads...</p>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="p-5 text-center">
                            <NotFound />
                            <p className="text-muted mt-2">No customized tour leads found.</p>
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Lead Ref</th>
                                    <th>Client &amp; Contact</th>
                                    <th>Travel Date &amp; Duration</th>
                                    <th>Group Size</th>
                                    <th>Estimated Budget</th>
                                    <th>Status</th>
                                    <th className="text-center">Custom Lead (CRM)</th>
                                    <th className="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((item) => {
                                    const clientPhone = item.phone ? item.phone.replace(/[^0-9]/g, '') : '';
                                    return (
                                        <tr key={item.id}>
                                            <td className="ps-4">
                                                <span className="badge bg-light text-primary border font-monospace px-2.5 py-1">
                                                    #SUN-{item.id}
                                                </span>
                                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5 d-block mt-1" style={{ fontSize: '10px' }}>
                                                    Sundarban
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-dark">{item.full_name || item.name}</span>
                                                    {item.phone && (
                                                        <div className="d-flex align-items-center gap-1 mt-0.5">
                                                            <a 
                                                                href={`https://wa.me/${clientPhone}?text=${encodeURIComponent(`Hello ${item.full_name || item.name}, greetings from Sundarban DeltaSafari! Regarding your custom safari inquiry...`)}`}
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                className="badge bg-success text-white rounded-pill px-2 py-0.5 font-monospace text-decoration-none d-inline-flex align-items-center gap-1"
                                                                title="Chat on WhatsApp"
                                                            >
                                                                <i className="ri ri-whatsapp-fill"></i> {item.phone}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {item.email && (
                                                        <span className="text-muted small mt-0.5">
                                                            <i className="ri ri-mail-line me-1"></i>{item.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-medium text-dark">
                                                        <i className="ri ri-calendar-line me-1 text-primary"></i>
                                                        {item.travel_date ? new Date(item.travel_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}
                                                    </span>
                                                    <span className="small text-muted">
                                                        {item.duration_days || 2} Days / {item.duration_nights || 1} Nights
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-secondary border px-2.5 py-1">
                                                    <i className="ri ri-user-line me-1 text-primary"></i>
                                                    {item.adults_count || item.adults || 2} Adults, {item.children_count || item.children || 0} Children
                                                </span>
                                            </td>
                                            <td>
                                                <span className="fw-bold text-success">
                                                    {item.budget ? (item.budget.startsWith('₹') ? item.budget : `₹ ${item.budget}`) : 'Flexible'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="dropdown">
                                                    <button 
                                                        className={`btn btn-xs rounded-pill dropdown-toggle fw-semibold ${getStatusBadge(item.status)}`}
                                                        type="button" 
                                                        data-bs-toggle="dropdown"
                                                    >
                                                        {item.status || 'Pending'}
                                                    </button>
                                                    <ul className="dropdown-menu shadow-sm border-0">
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(item.id, 'Pending')}>Pending</button></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(item.id, 'Contacted')}>Contacted</button></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(item.id, 'Confirmed')}>Confirmed</button></li>
                                                        <li><button className="dropdown-item text-danger" onClick={() => handleStatusChange(item.id, 'Closed')}>Closed</button></li>
                                                    </ul>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {item.whatsapp_lead_id ? (
                                                    <div className="d-inline-flex align-items-center gap-1.5">
                                                        <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2.5 py-1 rounded-pill" title="Official CRM Lead Linked">
                                                            <i className="ri ri-check-double-line me-1"></i>#CRM-{item.whatsapp_lead_id}
                                                        </span>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-xs btn-success d-inline-flex align-items-center gap-1 shadow-sm fw-medium rounded-pill px-2.5 py-1"
                                                            onClick={() => handleViewWhatsAppLead(item)}
                                                            title="View this Lead in CRM Section"
                                                        >
                                                            <i className="ri ri-whatsapp-fill"></i>
                                                            <span>View</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="d-inline-flex align-items-center gap-1">
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-xs btn-success d-inline-flex align-items-center gap-1 shadow-sm fw-semibold rounded-pill px-2.5 py-1"
                                                            disabled={creatingLeadId === item.id}
                                                            onClick={() => handleCreateLeadFromEnquiry(item)}
                                                            title="Create Custom Lead directly using these enquiry details"
                                                        >
                                                            {creatingLeadId === item.id ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span>
                                                                    <span>Creating...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="ri ri-user-add-line"></i>
                                                                    <span>Create Lead</span>
                                                                </>
                                                            )}
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-xs btn-outline-secondary rounded-circle p-1" 
                                                            title="Review details & customize before creating lead"
                                                            onClick={() => handleOpenPrefilledModal(item)}
                                                        >
                                                            <i className="ri ri-edit-line"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-end pe-4">
                                                <div className="d-flex justify-content-end gap-1.5">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-sm btn-outline-info rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                                                        onClick={() => setSelectedLead(item)}
                                                    >
                                                        <i className="ri ri-eye-line"></i> Dossier
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Lead Details Modal */}
            {selectedLead && (
                <>
                    <div 
                        className="modal-backdrop fade show" 
                        style={{ zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setSelectedLead(null)}
                    ></div>

                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1060, overflowY: 'auto' }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-header border-bottom bg-success text-white p-4 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                            <i className="ri ri-compass-3-line"></i> Custom Safari Lead #SUN-{selectedLead.id}
                                        </h5>
                                        <p className="text-white text-opacity-75 small mb-0 mt-1">Submitted from Sundarban DeltaSafari website planner</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        onClick={() => setSelectedLead(null)}
                                    ></button>
                                </div>

                                <div className="modal-body p-4 bg-light">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="bg-white p-3.5 rounded-3 shadow-xs border h-100">
                                                <h6 className="fw-bold text-primary small text-uppercase mb-2">Guest Profile</h6>
                                                <p className="mb-1"><strong>Name:</strong> {selectedLead.full_name || selectedLead.name}</p>
                                                <p className="mb-1"><strong>Phone:</strong> {selectedLead.phone}</p>
                                                <p className="mb-1"><strong>Email:</strong> {selectedLead.email || 'N/A'}</p>
                                                <p className="mb-0"><strong>Pickup:</strong> {selectedLead.departure_city || 'Kolkata'}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="bg-white p-3.5 rounded-3 shadow-xs border h-100">
                                                <h6 className="fw-bold text-success small text-uppercase mb-2">Safari Requirements</h6>
                                                <p className="mb-1"><strong>Travel Date:</strong> {selectedLead.travel_date ? new Date(selectedLead.travel_date).toLocaleDateString('en-IN') : 'Flexible'}</p>
                                                <p className="mb-1"><strong>Duration:</strong> {selectedLead.duration_days || 2} Days / {selectedLead.duration_nights || 1} Nights</p>
                                                <p className="mb-1"><strong>Party Size:</strong> {selectedLead.adults_count || selectedLead.adults || 2} Adults, {selectedLead.children_count || selectedLead.children || 0} Children</p>
                                                <p className="mb-0"><strong>Stay Preference:</strong> {selectedLead.hotel_category || 'Eco Resort / Boat'}</p>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="bg-white p-3.5 rounded-3 shadow-xs border">
                                                <h6 className="fw-bold text-dark small text-uppercase mb-2">Notes &amp; Custom Requests</h6>
                                                <p className="text-muted mb-0">{selectedLead.message || 'No special requirements noted.'}</p>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="card border-0 shadow-xs rounded-3 p-3 bg-white">
                                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                                    <div>
                                                        <h6 className="fw-bold text-dark small text-uppercase mb-1 d-flex align-items-center gap-1.5">
                                                            <i className="ri ri-customer-service-2-line text-success"></i> CRM Custom Lead Integration
                                                        </h6>
                                                        <p className="text-muted small mb-0">
                                                            {selectedLead.whatsapp_lead_id 
                                                                ? `This enquiry is officially linked to CRM Lead #CRM-${selectedLead.whatsapp_lead_id}.`
                                                                : 'Convert this customized enquiry into an official CRM Lead using all submitted guest requirements.'
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        {selectedLead.whatsapp_lead_id ? (
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-sm btn-success rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-sm fw-medium"
                                                                onClick={() => handleViewWhatsAppLead(selectedLead)}
                                                            >
                                                                <i className="ri ri-whatsapp-fill"></i>
                                                                <span>Open #CRM-{selectedLead.whatsapp_lead_id}</span>
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-sm btn-success rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-sm fw-semibold"
                                                                    disabled={creatingLeadId === selectedLead.id}
                                                                    onClick={() => handleCreateLeadFromEnquiry(selectedLead)}
                                                                >
                                                                    {creatingLeadId === selectedLead.id ? (
                                                                        <>
                                                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                                            <span>Creating...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <i className="ri ri-user-add-line"></i>
                                                                            <span>Create Custom Lead from Details</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                                                                    onClick={() => {
                                                                        const leadToPrefill = selectedLead;
                                                                        setSelectedLead(null);
                                                                        handleOpenPrefilledModal(leadToPrefill);
                                                                    }}
                                                                >
                                                                    <i className="ri ri-edit-line"></i>
                                                                    <span>Customize &amp; Create</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-white p-3 border-top d-flex justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="small text-muted">Update Status:</span>
                                        <select 
                                            className="form-select form-select-sm w-auto fw-semibold" 
                                            value={selectedLead.status || 'Pending'} 
                                            onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Contacted">Contacted</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                    <div className="d-flex gap-2">
                                        {!selectedLead.whatsapp_lead_id && (
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-success rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-sm"
                                                disabled={creatingLeadId === selectedLead.id}
                                                onClick={() => handleCreateLeadFromEnquiry(selectedLead)}
                                            >
                                                <i className="ri ri-user-add-line"></i> Create Lead
                                            </button>
                                        )}
                                        {selectedLead.phone && (
                                            <a 
                                                href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="btn btn-sm btn-outline-success rounded-pill px-3 d-inline-flex align-items-center gap-1"
                                            >
                                                <i className="ri ri-whatsapp-line"></i> WhatsApp Direct
                                            </a>
                                        )}
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline-secondary rounded-pill px-3" 
                                            onClick={() => setSelectedLead(null)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Create Custom Lead Modal */}
            {showCreateModal && (
                <>
                    <div 
                        className="modal-backdrop fade show" 
                        style={{ zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
                        onClick={() => !createSubmitting && setShowCreateModal(false)}
                    ></div>

                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1060, overflowY: 'auto' }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-header bg-success text-white p-3 px-4 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                            <i className="ri ri-user-add-line"></i> {createForm.enquiry_id ? `Create Custom Lead from Enquiry #SUN-${createForm.enquiry_id}` : 'Create Custom Sundarban Lead'}
                                        </h5>
                                        <p className="text-white text-opacity-75 small mb-0 mt-0.5">
                                            {createForm.enquiry_id 
                                                ? 'All fields pre-filled from this incoming inquiry. Review, adjust if needed, and save to register this CRM lead.' 
                                                : 'Manually record a customized tour inquiry for Sundarban DeltaSafari'}
                                        </p>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        onClick={() => !createSubmitting && setShowCreateModal(false)}
                                    ></button>
                                </div>

                                <form onSubmit={handleCreateSubmit}>
                                    <div className="modal-body p-4 bg-light" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                                        {createForm.enquiry_id && (
                                            <div className="alert alert-success d-flex align-items-center justify-content-between rounded-3 py-2 px-3 mb-3 border border-success border-opacity-25">
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="ri ri-checkbox-circle-line fs-5 text-success"></i>
                                                    <div>
                                                        <strong>Pre-filled from Inquiry #SUN-{createForm.enquiry_id}</strong>
                                                        <div className="small text-muted">All details from the enquiry were loaded. You can modify any detail before creating the official CRM lead.</div>
                                                    </div>
                                                </div>
                                                <span className="badge bg-success text-white">Enquiry #SUN-{createForm.enquiry_id}</span>
                                            </div>
                                        )}

                                        {/* Section 1: Guest Information */}
                                        <div className="card border-0 shadow-xs rounded-3 p-3 mb-3 bg-white">
                                            <h6 className="fw-bold text-success text-uppercase small mb-3 d-flex align-items-center gap-1.5 border-bottom pb-2">
                                                <i className="ri ri-user-3-line"></i> 1. Guest &amp; Contact Details
                                            </h6>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Guest Full Name <span className="text-danger">*</span>
                                                    </label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light"><i className="ri ri-user-line text-muted"></i></span>
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            placeholder="e.g. Subhajit Roy" 
                                                            value={createForm.full_name} 
                                                            onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                                                            required 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Phone / WhatsApp <span className="text-danger">*</span>
                                                    </label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light"><i className="ri ri-phone-line text-muted"></i></span>
                                                        <input 
                                                            type="tel" 
                                                            className="form-control" 
                                                            placeholder="e.g. +91 98300 12345" 
                                                            value={createForm.phone} 
                                                            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                                            required 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Email Address <span className="text-muted small fw-normal">(Optional)</span>
                                                    </label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light"><i className="ri ri-mail-line text-muted"></i></span>
                                                        <input 
                                                            type="email" 
                                                            className="form-control" 
                                                            placeholder="e.g. guest@example.com" 
                                                            value={createForm.email} 
                                                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Departure / Pickup Location
                                                    </label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light"><i className="ri ri-map-pin-line text-muted"></i></span>
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            placeholder="e.g. Kolkata / Godkhali / Airport" 
                                                            value={createForm.departure_city} 
                                                            onChange={(e) => setCreateForm({ ...createForm, departure_city: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 2: Tour Schedule & Party Size */}
                                        <div className="card border-0 shadow-xs rounded-3 p-3 mb-3 bg-white">
                                            <h6 className="fw-bold text-primary text-uppercase small mb-3 d-flex align-items-center gap-1.5 border-bottom pb-2">
                                                <i className="ri ri-calendar-check-line"></i> 2. Tour Schedule &amp; Party Size
                                            </h6>
                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Travel Date
                                                    </label>
                                                    <input 
                                                        type="date" 
                                                        className="form-control" 
                                                        value={createForm.travel_date} 
                                                        onChange={(e) => setCreateForm({ ...createForm, travel_date: e.target.value })}
                                                    />
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Duration (Days)
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        max="30"
                                                        className="form-control" 
                                                        value={createForm.duration_days} 
                                                        onChange={(e) => {
                                                            const days = parseInt(e.target.value) || 1;
                                                            setCreateForm({
                                                                ...createForm,
                                                                duration_days: days,
                                                                duration_nights: Math.max(0, days - 1)
                                                            });
                                                        }}
                                                    />
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Duration (Nights)
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        max="30"
                                                        className="form-control" 
                                                        value={createForm.duration_nights} 
                                                        onChange={(e) => setCreateForm({ ...createForm, duration_nights: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Adults (Age 12+)
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        max="100"
                                                        className="form-control" 
                                                        value={createForm.adults_count} 
                                                        onChange={(e) => setCreateForm({ ...createForm, adults_count: parseInt(e.target.value) || 1 })}
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Children (Below 12)
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        max="50"
                                                        className="form-control" 
                                                        value={createForm.children_count} 
                                                        onChange={(e) => setCreateForm({ ...createForm, children_count: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 3: Accommodation & Preferences */}
                                        <div className="card border-0 shadow-xs rounded-3 p-3 mb-3 bg-white">
                                            <h6 className="fw-bold text-dark text-uppercase small mb-3 d-flex align-items-center gap-1.5 border-bottom pb-2">
                                                <i className="ri ri-hotel-bed-line"></i> 3. Accommodation &amp; Preferences
                                            </h6>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Stay Preference
                                                    </label>
                                                    <select 
                                                        className="form-select" 
                                                        value={createForm.hotel_category} 
                                                        onChange={(e) => setCreateForm({ ...createForm, hotel_category: e.target.value })}
                                                    >
                                                        <option value="Eco Luxury Resort">Eco Luxury Resort</option>
                                                        <option value="Luxury Houseboat / Safari Vessel">Luxury Houseboat / Safari Vessel</option>
                                                        <option value="Deluxe Mangrove Cottage">Deluxe Mangrove Cottage</option>
                                                        <option value="Budget Forest Camp">Budget Forest Camp</option>
                                                        <option value="Day Tour (No Stay)">Day Tour (No Stay)</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Meal Plan
                                                    </label>
                                                    <select 
                                                        className="form-select" 
                                                        value={createForm.meal_plan} 
                                                        onChange={(e) => setCreateForm({ ...createForm, meal_plan: e.target.value })}
                                                    >
                                                        <option value="All Meals Included (Bengali Traditional Cuisine)">All Meals Included (Bengali Traditional Cuisine)</option>
                                                        <option value="Breakfast & Dinner (MAP)">Breakfast &amp; Dinner (MAP)</option>
                                                        <option value="Breakfast Only (CP)">Breakfast Only (CP)</option>
                                                        <option value="Pure Veg / Jain Special">Pure Veg / Jain Special</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Cab / Transport Type
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control" 
                                                        placeholder="e.g. AC Sedan / Innova + Launch Boat" 
                                                        value={createForm.cab_type} 
                                                        onChange={(e) => setCreateForm({ ...createForm, cab_type: e.target.value })}
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Estimated Budget
                                                    </label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light">₹</span>
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            placeholder="e.g. 15000 or Flexible" 
                                                            value={createForm.budget} 
                                                            onChange={(e) => setCreateForm({ ...createForm, budget: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Initial Lead Status
                                                    </label>
                                                    <select 
                                                        className="form-select" 
                                                        value={createForm.status} 
                                                        onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Contacted">Contacted</option>
                                                        <option value="Confirmed">Confirmed</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Destination
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control bg-light" 
                                                        value={createForm.destination} 
                                                        onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
                                                    />
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label fw-semibold small text-dark">
                                                        Notes &amp; Custom Requests
                                                    </label>
                                                    <textarea 
                                                        rows="3" 
                                                        className="form-control" 
                                                        placeholder="Add any specific requests, photography naturalist needed, senior citizen support, dietary requirements..." 
                                                        value={createForm.message} 
                                                        onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer bg-white p-3 border-top d-flex justify-content-between">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary rounded-pill px-4" 
                                            onClick={() => !createSubmitting && setShowCreateModal(false)}
                                            disabled={createSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-success d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm fw-semibold"
                                            disabled={createSubmitting}
                                        >
                                            {createSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    Saving Lead...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri ri-check-line"></i> {createForm.enquiry_id ? 'Create Lead from Enquiry' : 'Save Custom Lead'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
