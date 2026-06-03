"use client"
import { createOfficeAddressUrl, deleteOfficeAddressUrl, getOfficeAddressPageUrl, setContactDetailsUrl } from '@/app/routes/pagesRoute';
import { axiosDelete, axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function ContactAdmin() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [channels, setChannels] = useState({
        phone_1: '', phone_2: '', email: '', whatsapp_link: '', availability_hours: ''
    });
    const [offices, setOffices] = useState([]);
    const [newOffice, setNewOffice] = useState({ office_type: 'Branch Office', address: '', map_direction_link: '' });

    useEffect(() => {
        axiosGet(getOfficeAddressPageUrl, token).then((res) => {
            if (res.status) {
                setOffices(res.offices);
                setChannels(res.contacts)
            } else {
                showMessage(res.msg)
            }
        }).catch((err) => {
            showMessage(err.message)
        })
    }, []);

    const handleChannelsSubmit = async (e) => {
        e.preventDefault();
        try {
            axiosPost(setContactDetailsUrl, channels, token).then((res) => {
                if (res.status) {
                    showMessage(res.msg, 'success');
                } else {
                    showMessage(res.msg);
                }
            })
        } catch (err) {
            showMessage(res.msg);
        }
    };

    const handleAddOffice = async (e) => {
        e.preventDefault();
        try {
            axiosPost(createOfficeAddressUrl, newOffice, token).then((res) => {
                if (res.status) {
                    showMessage(res.msg, 'success')
                    window.location.reload()
                } else {
                    showMessage(res.msg)
                }
            })
        } catch (err) {
            showMessage(err.message)
        }
    };

    const handleDeleteOffice = async (id) => {
        if (!window.confirm('Are you certain you want to purge this record entry?')) return;
        try {
            axiosDelete(deleteOfficeAddressUrl + "?id=" + id, token).then((res) => {
                if (res.status) {
                    showMessage(res.msg, 'success')
                    window.location.reload()
                } else {
                    showMessage(res.msg)
                }
            })
        } catch (err) {
            showMessage(err.message)
        }
    };

    return (
        <div className="container-fluid px-4 py-4">

            {/* Dynamic Header Structure */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h4 className="mb-1 fw-semibold text-dark">Contact Hub Management</h4>
                    <p className="text-muted mb-0 small">Update support paths and corporate physical office listings dynamically.</p>
                </div>
            </div>

            {/* Main Forms Layout Grid */}
            <div className="row g-4 mb-4">

                {/* Module 1: Live Communication Channels */}
                <div className="col-12 col-xl-6">
                    <div className="card h-100 border-0 shadow-sm rounded-3">
                        <div className="card-header bg-transparent border-light py-3">
                            <h5 className="card-title mb-0 fw-semibold text-dark">Support Channels</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleChannelsSubmit} className="row g-3">
                                <div className="col-12">
                                    <label className="form-label text-muted fw-medium small mb-1">Global Business Availability Hours</label>
                                    <input type="text" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                        value={channels.availability_hours || ''} onChange={e => setChannels({ ...channels, availability_hours: e.target.value })} required />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-muted fw-medium small mb-1">Primary Contact Number</label>
                                    <input type="text" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                        value={channels.phone_1 || ''} onChange={e => setChannels({ ...channels, phone_1: e.target.value })} required />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-muted fw-medium small mb-1">Secondary Contact Number</label>
                                    <input type="text" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                        value={channels.phone_2 || ''} onChange={e => setChannels({ ...channels, phone_2: e.target.value })} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-muted fw-medium small mb-1">Support Mail</label>
                                    <input type="email" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                        value={channels.email || ''} onChange={e => setChannels({ ...channels, email: e.target.value })} required />
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-muted fw-medium small mb-1">WhatsApp Chat Redirect Link</label>
                                    <input type="url" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                        value={channels.whatsapp_link || ''} onChange={e => setChannels({ ...channels, whatsapp_link: e.target.value })} required />
                                </div>
                                <div className="col-12 pt-2">
                                    <button type="submit" className="btn btn-primary btn-sm px-4 py-2 fw-medium shadow-sm border-0">
                                        Save Support Information
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Module 2: Create / Append New Location Entry */}
                <div className="col-12 col-xl-6">
                    <div className="card h-100 border-0 shadow-sm rounded-3">
                        <div className="card-header bg-transparent border-light py-3">
                            <h5 className="card-title mb-0 fw-semibold text-dark">Add New Location Panel</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleAddOffice} className="row g-3">
                                <div className="col-12">
                                    <label className="form-label text-muted fw-medium small mb-1">Office Operational Hierarchy</label>
                                    <select className="form-select form-select-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                        value={newOffice.office_type} onChange={e => setNewOffice({ ...newOffice, office_type: e.target.value })}>
                                        <option value="Branch Office">Branch Office</option>
                                        <option value="Head Office">Head Office</option>
                                    </select>
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-muted fw-medium small mb-1">Full Physical Postal Address</label>
                                    <textarea rows="3" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                        placeholder="Enter full raw clean line address context..."
                                        value={newOffice.address} onChange={e => setNewOffice({ ...newOffice, address: e.target.value })} required />
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-muted fw-medium small mb-1">Map Navigation Tracking Destination URL</label>
                                    <input type="text" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                        placeholder="https://maps.google.com/..."
                                        value={newOffice.map_direction_link} onChange={e => setNewOffice({ ...newOffice, map_direction_link: e.target.value })} required />
                                </div>
                                <div className="col-12 pt-2">
                                    <button type="submit" className="btn btn-success btn-sm px-4 py-2 fw-medium shadow-sm border-0">
                                        Publish Office Address
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

            </div>

            {/* Module 3: Active Office Node Control Matrix Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                        <div className="card-header bg-transparent border-light py-3">
                            <h5 className="card-title mb-0 fw-semibold text-dark">Deployed Office Listings Matrix</h5>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-nowrap align-middle mb-0 border-0">
                                    <thead className="table-light text-muted small uppercase">
                                        <tr>
                                            <th className="px-4 border-0" style={{ width: '15%' }}>Hierarchy</th>
                                            <th className="px-4 border-0" style={{ width: '50%' }}>Address Block Context</th>
                                            <th className="px-4 border-0" style={{ width: '20%' }}>Direction Routing Link</th>
                                            <th className="px-4 border-0 text-center" style={{ width: '15%' }}>Action Controls</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-secondary small">
                                        {offices.map((office) => (
                                            <tr key={office.id}>
                                                <td className="px-4 py-3 border-light">
                                                    <span className={`badge px-2.5 py-1.5 fw-medium border-0 rounded ${office.office_type === 'Head Office' ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'
                                                        }`}>
                                                        {office.office_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 border-light text-wrap fw-normal text-dark" style={{ minWidth: '280px' }}>
                                                    {office.address}
                                                </td>
                                                <td className="px-4 py-3 border-light">
                                                    <a href={office.map_direction_link} target="_blank" rel="noreferrer" className="text-primary text-decoration-none d-inline-block text-truncate" style={{ maxWidth: '180px' }}>
                                                        {office.map_direction_link}
                                                    </a>
                                                </td>
                                                <td className="px-4 py-3 border-light text-center">
                                                    <button onClick={() => handleDeleteOffice(office.id)} className="btn btn-link link-danger p-0 border-0 shadow-none text-decoration-none fw-medium small">
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {offices.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-5 text-center text-muted fw-normal">
                                                    No locations mapped inside the target context container. Add entry rows above.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}