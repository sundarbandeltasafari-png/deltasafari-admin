'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
    getLeadManagersUrl, 
    toggleLeadManagerUrl, 
    assignLeadUrl, 
    getWhatsAppContactsUrl 
} from '@/app/routes/whatsappRoutes';
import { showMessage } from '@/libs/commonHelper';
import { calculateTime } from '@/libs/timeHelper';
import LoadingComponent from '@/components/common/LoadingComponent';

export default function AssignLeadsPage() {
    const user = useSelector((state) => state.adminAuth?.user);
    const token = useSelector((state) => state.adminAuth?.token);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [managers, setManagers] = useState([]);
    const [stats, setStats] = useState({
        total_leads: 0,
        assigned_leads: 0,
        unassigned_leads: 0,
        total_admin_users: 0,
        active_lead_managers: 0
    });
    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [reassigningContactId, setReassigningContactId] = useState(null);

    // Redirect regular admin users away from this Super Admin page
    useEffect(() => {
        if (user && user.admin !== 1) {
            router.push('/crm/whatsapp');
        }
    }, [user, router]);

    const fetchLeadManagers = async () => {
        if (!token) return;
        try {
            const res = await axios.get(getLeadManagersUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data?.status) {
                setManagers(res.data.managers || []);
                if (res.data.stats) {
                    setStats(res.data.stats);
                }
            }
        } catch (err) {
            console.error('Error loading lead managers:', err);
        }
    };

    const fetchContacts = async () => {
        if (!token) return;
        setContactsLoading(true);
        try {
            const res = await axios.get(getWhatsAppContactsUrl, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    search: searchTerm,
                    assigned_to: filterAssignee,
                    limit: 50
                }
            });
            if (res.data?.status) {
                setContacts(res.data.data || []);
            }
        } catch (err) {
            console.error('Error loading contacts:', err);
        } finally {
            setContactsLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchLeadManagers(), fetchContacts()]).finally(() => {
            setLoading(false);
        });
    }, [token]);

    const handleToggleManager = async (manager) => {
        const nextState = manager.is_active ? 0 : 1;
        setUpdatingUserId(manager.user_id);
        try {
            const res = await axios.post(toggleLeadManagerUrl, {
                user_id: manager.user_id,
                is_active: nextState
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data?.status) {
                showMessage('success', `${manager.name} is now ${nextState ? 'active in' : 'removed from'} the lead distribution pool.`);
                setManagers(prev => prev.map(m => m.user_id === manager.user_id ? { ...m, is_active: nextState } : m));
                fetchLeadManagers();
            } else {
                showMessage('error', res.data?.msg || 'Failed to update status');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error updating manager');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleReassignLead = async (contactId, newUserId) => {
        setReassigningContactId(contactId);
        try {
            const res = await axios.post(assignLeadUrl, {
                contact_id: contactId,
                user_id: newUserId || null
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data?.status) {
                const assignedManager = managers.find(m => String(m.user_id) === String(newUserId));
                showMessage('success', newUserId ? `Lead assigned to ${assignedManager?.name || 'Admin User'}.` : 'Lead unassigned.');
                fetchContacts();
                fetchLeadManagers();
            } else {
                showMessage('error', res.data?.msg || 'Failed to reassign lead');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error reassigning lead');
        } finally {
            setReassigningContactId(null);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchContacts();
    };

    if (loading) {
        return (
            <div className="container-xxl flex-grow-1 container-p-y d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <LoadingComponent />
            </div>
        );
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header Title */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 text-heading">
                        <i className="ri ri-user-shared-line me-2 text-primary"></i>
                        Lead Distribution & Assignment
                    </h4>
                    <p className="text-muted mb-0 small">
                        Configure auto-distribution rules for incoming WhatsApp leads and manage lead assignments across admin staff.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button 
                        type="button" 
                        onClick={() => { fetchLeadManagers(); fetchContacts(); }}
                        className="btn btn-outline-primary d-flex align-items-center gap-2 rounded-pill px-3 shadow-sm"
                    >
                        <i className="ri ri-refresh-line"></i>
                        <span>Refresh Data</span>
                    </button>
                    <button 
                        type="button" 
                        onClick={() => router.push('/crm/whatsapp')}
                        className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm"
                    >
                        <i className="ri ri-whatsapp-line"></i>
                        <span>Go to WhatsApp CRM</span>
                    </button>
                </div>
            </div>

            {/* Overview Stat Cards */}
            <div className="row g-4 mb-4">
                <div className="col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="avatar avatar-lg rounded-circle bg-label-primary d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                                <i className="ri ri-user-voice-line fs-3 text-primary"></i>
                            </div>
                            <div>
                                <span className="text-muted small fw-medium">Total WhatsApp Leads</span>
                                <h3 className="mb-0 fw-bold text-heading">{stats.total_leads}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="avatar avatar-lg rounded-circle bg-label-success d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                                <i className="ri ri-check-double-line fs-3 text-success"></i>
                            </div>
                            <div>
                                <span className="text-muted small fw-medium">Assigned Leads</span>
                                <h3 className="mb-0 fw-bold text-success">{stats.assigned_leads}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="avatar avatar-lg rounded-circle bg-label-warning d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                                <i className="ri ri-time-line fs-3 text-warning"></i>
                            </div>
                            <div>
                                <span className="text-muted small fw-medium">Unassigned Leads</span>
                                <h3 className="mb-0 fw-bold text-warning">{stats.unassigned_leads}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="avatar avatar-lg rounded-circle bg-label-info d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                                <i className="ri ri-group-line fs-3 text-info"></i>
                            </div>
                            <div>
                                <span className="text-muted small fw-medium">Active Managers in Pool</span>
                                <h3 className="mb-0 fw-bold text-info">{stats.active_lead_managers} / {stats.total_admin_users}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 1: Lead Distribution Pool (Auto-Assignment) */}
            <div className="card shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
                <div className="card-header bg-transparent border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h5 className="mb-1 fw-bold text-heading">
                            <i className="ri ri-shuffle-line me-2 text-primary"></i>
                            Auto-Distribution Pool (Round-Robin)
                        </h5>
                        <p className="text-muted small mb-0">
                            Toggle admin users who should automatically receive new incoming WhatsApp leads in equal rotation.
                        </p>
                    </div>
                    <span className="badge bg-label-primary px-3 py-2 rounded-pill small">
                        <i className="ri ri-information-line me-1"></i> Equal Round-Robin Enabled
                    </span>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Admin Staff Member</th>
                                    <th>Email & Phone</th>
                                    <th>Role / Bio</th>
                                    <th className="text-center">Active Leads</th>
                                    <th className="text-center">Total Distributed</th>
                                    <th>Last Lead Assigned</th>
                                    <th className="text-center pe-4">Auto-Distribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted">
                                            No admin users found. Create admin users in <strong>Users & Roles &gt; Admin Users</strong> to assign leads.
                                        </td>
                                    </tr>
                                ) : (
                                    managers.map((m) => (
                                        <tr key={m.user_id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="avatar avatar-md rounded-circle bg-label-primary d-flex align-items-center justify-content-center fw-bold">
                                                        {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="fw-bold text-heading mb-0">{m.name}</p>
                                                        <span className="small text-muted">ID #{m.user_id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <p className="mb-0 small fw-medium">{m.email}</p>
                                                <span className="small text-muted">{m.phone || 'No phone'}</span>
                                            </td>
                                            <td>
                                                <span className="badge bg-label-secondary rounded-pill px-2.5 py-1">
                                                    {m.bio || 'Admin Staff'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge rounded-pill bg-label-primary fs-6 px-3 py-1 fw-bold">
                                                    {m.active_leads_count}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="text-muted fw-semibold">
                                                    {m.total_assigned_count || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="small text-muted">
                                                    {m.last_assigned_at ? calculateTime(m.last_assigned_at) : 'Never'}
                                                </span>
                                            </td>
                                            <td className="text-center pe-4">
                                                <div className="form-check form-switch d-inline-flex align-items-center justify-content-center m-0">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        role="switch"
                                                        id={`switch_${m.user_id}`}
                                                        checked={Boolean(m.is_active)}
                                                        disabled={updatingUserId === m.user_id}
                                                        onChange={() => handleToggleManager(m)}
                                                        style={{ width: '42px', height: '22px', cursor: 'pointer' }}
                                                    />
                                                    <label className="form-check-label ms-2 small fw-semibold" htmlFor={`switch_${m.user_id}`}>
                                                        {m.is_active ? (
                                                            <span className="text-success">Active</span>
                                                        ) : (
                                                            <span className="text-secondary">Paused</span>
                                                        )}
                                                    </label>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Section 2: Manage & Reassign Incoming Leads */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="card-header bg-transparent border-bottom py-3">
                    <div className="row g-3 align-items-center justify-content-between">
                        <div className="col-md-5">
                            <h5 className="mb-1 fw-bold text-heading">
                                <i className="ri ri-exchange-line me-2 text-primary"></i>
                                Lead Assignments & Reassignment
                            </h5>
                            <p className="text-muted small mb-0">View all incoming leads and reassign them to any staff member anytime.</p>
                        </div>
                        <div className="col-md-7">
                            <form onSubmit={handleSearchSubmit} className="d-flex gap-2 justify-content-md-end flex-wrap">
                                <select 
                                    className="form-select rounded-pill" 
                                    style={{ maxWidth: '200px' }}
                                    value={filterAssignee}
                                    onChange={(e) => {
                                        setFilterAssignee(e.target.value);
                                        setTimeout(fetchContacts, 50);
                                    }}
                                >
                                    <option value="">All Leads</option>
                                    <option value="unassigned">Unassigned Leads</option>
                                    {managers.map(m => (
                                        <option key={m.user_id} value={m.user_id}>Assigned to {m.name} ({m.email})</option>
                                    ))}
                                </select>
                                <div className="input-group" style={{ maxWidth: '260px' }}>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-start-pill" 
                                        placeholder="Search lead or name..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <button className="btn btn-primary rounded-end-pill px-3" type="submit">
                                        <i className="ri ri-search-line"></i>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">WhatsApp Lead</th>
                                    <th>Last Message</th>
                                    <th>Currently Assigned To</th>
                                    <th>Last Contacted</th>
                                    <th className="text-center pe-4">Reassign Lead</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contactsLoading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status"></div>
                                            <p className="mt-2 text-muted mb-0">Loading leads...</p>
                                        </td>
                                    </tr>
                                ) : contacts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            No leads match the selected filter.
                                        </td>
                                    </tr>
                                ) : (
                                    contacts.map((contact) => (
                                        <tr key={contact.id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="avatar avatar-md rounded-circle bg-label-success d-flex align-items-center justify-content-center fw-bold">
                                                        <i className="ri ri-whatsapp-line text-success"></i>
                                                    </div>
                                                    <div>
                                                        <p className="fw-bold text-heading mb-0">{contact.name || 'WhatsApp Customer'}</p>
                                                        <span className="small text-muted font-monospace">{contact.wa_id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: '280px' }}>
                                                <p className="text-truncate mb-0 small text-muted">
                                                    {contact.last_message ? (
                                                        <>
                                                            {contact.last_sender_type === 'business' && <strong className="text-primary me-1">You:</strong>}
                                                            {contact.last_message}
                                                        </>
                                                    ) : (
                                                        <em className="text-secondary">No conversation yet</em>
                                                    )}
                                                </p>
                                            </td>
                                            <td>
                                                {contact.assigned_to ? (
                                                    <div>
                                                        <span className="badge bg-label-primary px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5 fw-semibold">
                                                            <i className="ri ri-user-follow-line text-primary"></i>
                                                            <span>{contact.assigned_user_name || `Admin User #${contact.assigned_to}`}</span>
                                                        </span>
                                                        {contact.assigned_user_email && (
                                                            <small className="text-muted d-block mt-1" style={{ fontSize: '11.5px' }}>
                                                                {contact.assigned_user_email}
                                                            </small>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-label-warning px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5 fw-semibold">
                                                        <i className="ri ri-question-line text-warning"></i>
                                                        <span>Unassigned</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="small text-muted">
                                                    {contact.last_message_time || contact.updated_at ? calculateTime(contact.last_message_time || contact.updated_at) : 'Just now'}
                                                </span>
                                            </td>
                                            <td className="text-center pe-4">
                                                <div className="d-inline-flex align-items-center gap-2">
                                                    <select 
                                                        className="form-select form-select-sm rounded-pill"
                                                        value={contact.assigned_to || ''}
                                                        disabled={reassigningContactId === contact.id}
                                                        onChange={(e) => handleReassignLead(contact.id, e.target.value)}
                                                        style={{ width: '220px' }}
                                                    >
                                                        <option value="">-- Unassign Lead --</option>
                                                        {managers.map(m => (
                                                            <option key={m.user_id} value={m.user_id}>
                                                                {m.name} ({m.email}) {m.is_active ? '(Active)' : '(Paused)'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => router.push(`/crm/whatsapp`)}
                                                        className="btn btn-icon btn-sm btn-text-secondary rounded-pill text-primary"
                                                        title="Open Chat"
                                                    >
                                                        <i className="ri ri-chat-1-line fs-5"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
