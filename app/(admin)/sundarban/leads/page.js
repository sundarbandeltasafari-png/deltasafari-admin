"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getSundarbanLeadsUrl } from '@/app/routes/sundarbanRoutes';
import { updateHolidayEnquiryUrl } from '@/app/routes/serviceRoutes';
import { axiosGet, axiosPut } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';

export default function SundarbanLeadsPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedLead, setSelectedLead] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

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
                <div>
                    <button 
                        type="button" 
                        className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm" 
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
                                        {selectedLead.phone && (
                                            <a 
                                                href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="btn btn-sm btn-success rounded-pill px-3"
                                            >
                                                <i className="ri ri-whatsapp-fill me-1"></i> WhatsApp
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
        </div>
    );
}
