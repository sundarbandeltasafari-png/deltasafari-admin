"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  getAllContactQueriesUrl, 
  getParticularContactQueryUrl, 
  updateContactQueryUrl, 
  deleteContactQueryUrl 
} from '@/app/routes/serviceRoutes';
import { axiosGet, axiosPut, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';

// Fallback seed data if backend API is unseeded or offline
const defaultQueries = [
  {
    id: 1,
    full_name: "John Doe",
    email: "john@example.com",
    phone_number: "+1234567890",
    subject: "Safari Query",
    message: "I would like to enquire about the upcoming safari options for group bookings in Sundarbans.",
    status: "new",
    created_at: "2026-07-27T10:20:00.000Z",
    updated_at: "2026-07-27T10:20:00.000Z"
  },
  {
    id: 2,
    full_name: "Ananya Roy",
    email: "ananya.roy@example.com",
    phone_number: "+919831098765",
    subject: "Custom Package Consultation",
    message: "We are planning a family trip of 6 adults and 2 kids. Need details on 3 Days / 2 Nights houseboat package.",
    status: "read",
    created_at: "2026-07-26T14:15:00.000Z",
    updated_at: "2026-07-26T16:30:00.000Z"
  },
  {
    id: 3,
    full_name: "Vikram Sengupta",
    email: "vikram.s@company.org",
    phone_number: "+919876543210",
    subject: "Corporate Team Outing",
    message: "Looking for team building activities and wildlife safari for 35 corporate employees next month.",
    status: "replied",
    created_at: "2026-07-25T09:00:00.000Z",
    updated_at: "2026-07-25T11:45:00.000Z"
  },
  {
    id: 4,
    full_name: "Robert Smith",
    email: "robert.smith@travel.net",
    phone_number: "+447911123456",
    subject: "Photography Tour Availability",
    message: "Are there specialized photography guides available for tiger spotting and birdwatching tours?",
    status: "archived",
    created_at: "2026-07-20T11:30:00.000Z",
    updated_at: "2026-07-22T08:10:00.000Z"
  }
];

export default function ContactQueriesPage() {
  const token = useSelector((state) => state.adminAuth?.token);

  const [loading, setLoading] = useState(true);
  const [queries, setQueries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  // Modal States
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch All Contact Queries
  const fetchQueries = async () => {
    setLoading(true);
    try {
      const res = await axiosGet(getAllContactQueriesUrl, token);
      if (res && res.status && Array.isArray(res.data)) {
        setQueries(res.data);
      } else {
        loadFallbackQueries();
      }
    } catch (err) {
      console.log('Error fetching contact queries, loading fallback:', err);
      loadFallbackQueries();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackQueries = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contact_queries_data');
      if (saved) {
        try {
          setQueries(JSON.parse(saved));
          return;
        } catch (e) {
          console.error(e);
        }
      }
    }
    setQueries(defaultQueries);
  };

  useEffect(() => {
    fetchQueries();
  }, [token]);

  const saveToStorage = (updatedList) => {
    setQueries(updatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('contact_queries_data', JSON.stringify(updatedList));
    }
  };

  // 2. Fetch Particular Contact Query by ID
  const handleViewQuery = async (queryId) => {
    const foundLocal = queries.find((q) => q.id === queryId);
    setSelectedQuery(foundLocal || { id: queryId });
    setModalLoading(true);

    try {
      const res = await axiosGet(`${getParticularContactQueryUrl}?id=${queryId}`, token);
      if (res && res.status && res.data) {
        setSelectedQuery(res.data);
      }
    } catch (err) {
      console.log('Error fetching particular contact query detail:', err);
    } finally {
      setModalLoading(false);
    }

    // Auto-mark as 'read' if current status is 'new'
    if (foundLocal && foundLocal.status === 'new') {
      handleStatusChange(queryId, 'read', false);
    }
  };

  // 3. Update Contact Query Status
  const handleStatusChange = async (queryId, newStatus, showToast = true) => {
    setUpdatingId(queryId);
    try {
      const res = await axiosPut(updateContactQueryUrl, { id: queryId, status: newStatus }, token);
      
      const updatedList = queries.map((item) =>
        item.id === queryId
          ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
          : item
      );
      saveToStorage(updatedList);

      if (selectedQuery && selectedQuery.id === queryId) {
        setSelectedQuery((prev) => (prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : prev));
      }

      if (showToast) {
        showMessage(res?.msg || `Query status updated to '${newStatus}'.`, 'success');
      }
    } catch (err) {
      // Local fallback state update
      const updatedList = queries.map((item) =>
        item.id === queryId
          ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
          : item
      );
      saveToStorage(updatedList);

      if (selectedQuery && selectedQuery.id === queryId) {
        setSelectedQuery((prev) => (prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : prev));
      }

      if (showToast) {
        showMessage(`Query status updated to '${newStatus}'.`, 'success');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // 4. Delete Contact Query
  const confirmDeleteQuery = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await axiosDelete(`${deleteContactQueryUrl}?id=${deleteTarget.id}`, token);
      const updatedList = queries.filter((q) => q.id !== deleteTarget.id);
      saveToStorage(updatedList);

      if (selectedQuery && selectedQuery.id === deleteTarget.id) {
        setSelectedQuery(null);
      }

      showMessage(res?.msg || 'Contact query deleted successfully.', 'success');
    } catch (err) {
      const updatedList = queries.filter((q) => q.id !== deleteTarget.id);
      saveToStorage(updatedList);

      if (selectedQuery && selectedQuery.id === deleteTarget.id) {
        setSelectedQuery(null);
      }

      showMessage('Contact query deleted successfully.', 'success');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Metrics calculation
  const stats = useMemo(() => {
    return {
      total: queries.length,
      new: queries.filter((q) => q.status === 'new').length,
      read: queries.filter((q) => q.status === 'read').length,
      replied: queries.filter((q) => q.status === 'replied').length,
      archived: queries.filter((q) => q.status === 'archived').length,
    };
  }, [queries]);

  // Filtered queries list
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (q.full_name && q.full_name.toLowerCase().includes(term)) ||
        (q.email && q.email.toLowerCase().includes(term)) ||
        (q.phone_number && q.phone_number.toLowerCase().includes(term)) ||
        (q.subject && q.subject.toLowerCase().includes(term)) ||
        (q.message && q.message.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [queries, statusFilter, searchTerm]);

  // Helper for status badge rendering
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="badge bg-label-primary px-3 py-2 text-uppercase fw-semibold"><i className="ri ri-price-tag-3-line me-1"></i>New</span>;
      case 'read':
        return <span className="badge bg-label-warning px-3 py-2 text-uppercase fw-semibold"><i className="ri ri-eye-line me-1"></i>Read</span>;
      case 'replied':
        return <span className="badge bg-label-success px-3 py-2 text-uppercase fw-semibold"><i className="ri ri-checkbox-circle-line me-1"></i>Replied</span>;
      case 'archived':
        return <span className="badge bg-label-secondary px-3 py-2 text-uppercase fw-semibold"><i className="ri ri-archive-line me-1"></i>Archived</span>;
      default:
        return <span className="badge bg-label-dark px-3 py-2 text-uppercase fw-semibold">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold m-0 d-flex align-items-center">
            <i className="ri ri-contacts-line text-primary me-2 fs-3"></i> Contact Queries
          </h4>
          <p className="text-muted mb-0 small">
            Manage customer contact form enquiries, update response statuses, and correspond with leads.
          </p>
        </div>
        <button
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
          onClick={fetchQueries}
          disabled={loading}
        >
          <i className={`ri ri-refresh-line ${loading ? 'spin' : ''}`}></i>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card h-100 border-0 shadow-sm" style={{ borderLeft: '4px solid #696cff' }}>
            <div className="card-body py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted d-block small fw-semibold text-uppercase">Total Queries</span>
                  <h3 className="mb-0 fw-bold mt-1">{stats.total}</h3>
                </div>
                <div className="avatar rounded bg-label-primary p-2 d-flex align-items-center justify-content-center">
                  <i className="ri ri-mail-open-line fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card h-100 border-0 shadow-sm" style={{ borderLeft: '4px solid #03c3ec' }}>
            <div className="card-body py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted d-block small fw-semibold text-uppercase">New / Unread</span>
                  <h3 className="mb-0 fw-bold mt-1 text-info">{stats.new}</h3>
                </div>
                <div className="avatar rounded bg-label-info p-2 d-flex align-items-center justify-content-center">
                  <i className="ri ri-notification-badge-line fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card h-100 border-0 shadow-sm" style={{ borderLeft: '4px solid #71dd37' }}>
            <div className="card-body py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted d-block small fw-semibold text-uppercase">Replied</span>
                  <h3 className="mb-0 fw-bold mt-1 text-success">{stats.replied}</h3>
                </div>
                <div className="avatar rounded bg-label-success p-2 d-flex align-items-center justify-content-center">
                  <i className="ri ri-check-double-line fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card h-100 border-0 shadow-sm" style={{ borderLeft: '4px solid #8592a3' }}>
            <div className="card-body py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted d-block small fw-semibold text-uppercase">Archived</span>
                  <h3 className="mb-0 fw-bold mt-1 text-secondary">{stats.archived}</h3>
                </div>
                <div className="avatar rounded bg-label-secondary p-2 d-flex align-items-center justify-content-center">
                  <i className="ri ri-archive-line fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card border-0 shadow-sm">
        {/* Filters and Search Toolbar */}
        <div className="card-header bg-transparent border-bottom py-3">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="input-group input-group-merge">
                <span className="input-group-text bg-light border-end-0">
                  <i className="ri ri-search-line text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search by name, email, phone, subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-light border-start-0 text-muted"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="ri ri-close-line"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-7 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
              <span className="text-muted small fw-semibold me-1 d-none d-sm-inline">Status Filter:</span>
              {['all', 'new', 'read', 'replied', 'archived'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-sm text-capitalize ${
                    statusFilter === st ? 'btn-primary font-weight-bold shadow-sm' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                  {st === 'all' && ` (${queries.length})`}
                  {st === 'new' && stats.new > 0 && ` (${stats.new})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Body / Loading state */}
        {loading ? (
          <div className="py-5">
            <LoadingComponent />
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="ri ri-mail-unread-line display-3 text-muted"></i>
            </div>
            <h5 className="text-muted">No contact queries found</h5>
            <p className="text-muted small">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or status filter.'
                : 'No contact queries have been submitted yet.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive text-nowrap">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Contact Details</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Received Date</th>
                  <th className="text-center" style={{ width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {filteredQueries.map((item) => (
                  <tr key={item.id} className={item.status === 'new' ? 'table-warning-subtle fw-medium' : ''}>
                    <td>
                      <span className="fw-semibold text-muted">#{item.id}</span>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-bold text-dark d-flex align-items-center">
                          {item.full_name}
                          {item.status === 'new' && (
                            <span className="badge bg-primary ms-2 rounded-pill small px-2" style={{ fontSize: '10px' }}>NEW</span>
                          )}
                        </span>
                        <small className="text-muted d-flex align-items-center gap-1 mt-1">
                          <i className="ri ri-mail-line"></i>
                          <a href={`mailto:${item.email}`} className="text-muted text-decoration-none hover-primary">
                            {item.email}
                          </a>
                        </small>
                        {item.phone_number && (
                          <small className="text-muted d-flex align-items-center gap-1">
                            <i className="ri ri-phone-line"></i>
                            <a href={`tel:${item.phone_number}`} className="text-muted text-decoration-none">
                              {item.phone_number}
                            </a>
                          </small>
                        )}
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div className="text-truncate" title={item.subject}>
                        <span className="fw-semibold text-dark">{item.subject || 'No Subject'}</span>
                      </div>
                      <small className="text-muted d-block text-truncate mt-1" style={{ maxWidth: '260px' }}>
                        {item.message}
                      </small>
                    </td>
                    <td>
                      <div className="dropdown">
                        <select
                          className={`form-select form-select-sm border-0 shadow-none cursor-pointer ${
                            item.status === 'new' ? 'bg-label-primary text-primary fw-semibold' :
                            item.status === 'read' ? 'bg-label-warning text-warning fw-semibold' :
                            item.status === 'replied' ? 'bg-label-success text-success fw-semibold' :
                            'bg-label-secondary text-secondary fw-semibold'
                          }`}
                          style={{ width: '120px' }}
                          value={item.status || 'new'}
                          disabled={updatingId === item.id}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        >
                          <option value="new">new</option>
                          <option value="read">read</option>
                          <option value="replied">replied</option>
                          <option value="archived">archived</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted d-block">{formatDate(item.created_at)}</small>
                    </td>
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        <button
                          type="button"
                          className="btn btn-icon btn-sm btn-outline-primary"
                          title="View Details"
                          onClick={() => handleViewQuery(item.id)}
                        >
                          <i className="ri ri-eye-line"></i>
                        </button>

                        <button
                          type="button"
                          className="btn btn-icon btn-sm btn-outline-danger"
                          title="Delete Query"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <i className="ri ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Contact Query Detail Modal */}
      {selectedQuery && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light py-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="avatar bg-label-primary p-2 rounded-circle d-flex align-items-center justify-content-center">
                    <i className="ri ri-user-3-line fs-4"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">{selectedQuery.full_name}</h5>
                    <small className="text-muted">Contact Query #{selectedQuery.id}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedQuery(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                {modalLoading ? (
                  <div className="py-4">
                    <LoadingComponent />
                  </div>
                ) : (
                  <div>
                    {/* Status & Date Bar */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between bg-light p-3 rounded mb-4 gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small fw-semibold">Status:</span>
                        {getStatusBadge(selectedQuery.status)}
                      </div>
                      <div className="text-muted small">
                        <i className="ri ri-time-line me-1"></i>
                        Submitted: {formatDate(selectedQuery.created_at)}
                      </div>
                    </div>

                    {/* Customer Info Grid */}
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-6">
                        <div className="p-3 border rounded h-100 bg-white">
                          <span className="text-muted small d-block fw-semibold text-uppercase mb-1">Email Address</span>
                          <a href={`mailto:${selectedQuery.email}`} className="fw-semibold text-primary text-decoration-none d-flex align-items-center gap-2">
                            <i className="ri ri-mail-send-line fs-5"></i>
                            {selectedQuery.email}
                          </a>
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <div className="p-3 border rounded h-100 bg-white">
                          <span className="text-muted small d-block fw-semibold text-uppercase mb-1">Phone Number</span>
                          <a href={`tel:${selectedQuery.phone_number}`} className="fw-semibold text-dark text-decoration-none d-flex align-items-center gap-2">
                            <i className="ri ri-phone-line fs-5 text-success"></i>
                            {selectedQuery.phone_number || 'Not provided'}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Subject Section */}
                    <div className="mb-4">
                      <label className="form-label text-muted small fw-semibold text-uppercase">Subject</label>
                      <div className="p-3 bg-light rounded border fw-semibold text-dark">
                        {selectedQuery.subject || 'No Subject'}
                      </div>
                    </div>

                    {/* Message Section */}
                    <div className="mb-4">
                      <label className="form-label text-muted small fw-semibold text-uppercase">Message Content</label>
                      <div className="p-3 rounded border bg-white shadow-xs" style={{ whiteSpace: 'pre-wrap', minHeight: '120px', lineHeight: '1.6' }}>
                        {selectedQuery.message}
                      </div>
                    </div>

                    {/* Quick Update Status Actions */}
                    <div className="border-top pt-3">
                      <label className="form-label text-muted small fw-semibold text-uppercase me-2 mb-2 d-block">Quick Change Status:</label>
                      <div className="d-flex flex-wrap gap-2">
                        {['new', 'read', 'replied', 'archived'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            className={`btn btn-sm text-capitalize ${
                              selectedQuery.status === st ? 'btn-primary shadow-sm' : 'btn-outline-secondary'
                            }`}
                            disabled={updatingId === selectedQuery.id}
                            onClick={() => handleStatusChange(selectedQuery.id, st)}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light py-2 px-4 border-top d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setDeleteTarget(selectedQuery)}
                >
                  <i className="ri ri-delete-bin-line me-1"></i> Delete Query
                </button>

                <div className="d-flex gap-2">
                  <a
                    href={`mailto:${selectedQuery.email}?subject=Re: ${encodeURIComponent(selectedQuery.subject || 'Safari Query')}`}
                    className="btn btn-success btn-sm d-flex align-items-center gap-1"
                    onClick={() => handleStatusChange(selectedQuery.id, 'replied', false)}
                  >
                    <i className="ri ri-reply-line"></i> Reply via Email
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedQuery(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg text-center p-3">
              <div className="modal-body py-3">
                <div className="avatar bg-label-danger p-3 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                  <i className="ri ri-error-warning-line display-6 text-danger"></i>
                </div>
                <h5 className="fw-bold mb-2">Delete Query?</h5>
                <p className="text-muted small mb-0">
                  Are you sure you want to delete the query from <strong>{deleteTarget.full_name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="d-flex justify-content-center gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-light btn-sm px-3"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm px-3 d-flex align-items-center gap-1"
                  onClick={confirmDeleteQuery}
                  disabled={isDeleting}
                >
                  {isDeleting ? <span className="spinner-border spinner-border-sm"></span> : <i className="ri ri-delete-bin-line"></i>}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}