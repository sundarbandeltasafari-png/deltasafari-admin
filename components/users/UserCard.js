"use client"

import React from 'react';
import Link from 'next/link';

function UserCard({ user, stats, addresses }) {
    const isCorporate = user?.user_type === 2 || user?.type === 2;
    const isAgent = user?.user_type === 3 || user?.type === 3;
    const primaryAddress = addresses && addresses.length > 0 ? addresses[0] : null;

    const userTypeName = isCorporate
        ? 'Corporate Account'
        : isAgent
        ? 'B2B Travel Partner'
        : 'Retail Traveler';

    const roleName =
        user?.admin === 1
            ? 'Super Admin'
            : user?.admin === 2
            ? 'Admin Staff'
            : 'Customer';

    return (
        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden bg-white">
            {/* Header banner */}
            <div
                className="p-3 text-white d-flex justify-content-between align-items-center"
                style={{
                    background: isCorporate
                        ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                        : isAgent
                        ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
                        : 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)'
                }}
            >
                <div className="d-flex align-items-center gap-2">
                    <i className={`fs-5 ${isCorporate ? 'ri-building-line' : isAgent ? 'ri-shake-hands-line' : 'ri-user-smile-line'}`}></i>
                    <span className="fw-semibold small">{userTypeName}</span>
                </div>
                <span className={`badge rounded-pill px-2.5 py-1 ${user?.status ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                    {user?.status ? '🟢 Active' : '🔴 Inactive'}
                </span>
            </div>

            <div className="card-body pt-4">
                {/* User Avatar & Name */}
                <div className="d-flex flex-column align-items-center text-center mb-4">
                    <div className="position-relative mb-2">
                        {user?.profile_picture ? (
                            <img
                                className="img-fluid rounded-circle shadow-sm border border-3 border-white"
                                src={user.profile_picture.startsWith('http') ? user.profile_picture : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002'}${user.profile_picture}`}
                                style={{ width: '90px', height: '90px', objectFit: 'cover' }}
                                alt={user?.first_name || 'User Avatar'}
                            />
                        ) : (
                            <div
                                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                style={{
                                    width: '90px',
                                    height: '90px',
                                    fontSize: '32px',
                                    backgroundColor: isCorporate ? '#1e3c72' : '#0066cc'
                                }}
                            >
                                {user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                        <span
                            className={`position-absolute bottom-0 end-0 rounded-circle border border-2 border-white ${
                                user?.status ? 'bg-success' : 'bg-secondary'
                            }`}
                            style={{ width: '16px', height: '16px' }}
                        ></span>
                    </div>

                    <h5 className="fw-bold text-dark mb-1">
                        {user?.first_name} {user?.last_name || ''}
                    </h5>
                    <div className="d-flex align-items-center gap-1.5 flex-wrap justify-content-center">
                        <span className="badge bg-light text-muted border px-2 py-0.5" style={{ fontSize: '11px' }}>
                            ID: #{user?.id}
                        </span>
                        <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-0.5" style={{ fontSize: '11px' }}>
                            {roleName}
                        </span>
                        {user?.gender !== null && user?.gender !== undefined && (
                            <span className="badge bg-light text-secondary border px-2 py-0.5" style={{ fontSize: '11px' }}>
                                {user.gender === 1 ? 'Male' : user.gender === 2 ? 'Female' : 'Other'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Quick KPI Stat Counter Pills */}
                <div className="row g-2 mb-4 text-center">
                    <div className="col-4">
                        <div className="p-2 bg-light rounded-3 border">
                            <h6 className="fw-bold text-primary mb-0">{stats?.total_bookings || 0}</h6>
                            <small className="text-muted text-xs" style={{ fontSize: '10.5px' }}>Bookings</small>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="p-2 bg-light rounded-3 border">
                            <h6 className="fw-bold text-warning-emphasis mb-0">{stats?.total_enquiries || 0}</h6>
                            <small className="text-muted text-xs" style={{ fontSize: '10.5px' }}>Enquiries</small>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="p-2 bg-light rounded-3 border">
                            <h6 className="fw-bold text-danger mb-0">{stats?.total_saved || 0}</h6>
                            <small className="text-muted text-xs" style={{ fontSize: '10.5px' }}>Wishlist</small>
                        </div>
                    </div>
                </div>

                {/* Contact & Profile Info Details List */}
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 small d-flex align-items-center gap-1.5">
                    <i className="ri-information-line text-primary"></i>
                    <span>Contact &amp; Account Info</span>
                </h6>

                <ul className="list-unstyled d-flex flex-column gap-2.5 mb-4 small">
                    <li className="d-flex align-items-start gap-2">
                        <i className="ri-phone-line text-muted mt-0.5"></i>
                        <div>
                            <span className="text-muted d-block text-xs">Phone</span>
                            <span className="fw-semibold text-dark">{user?.phone || 'N/A'}</span>
                        </div>
                    </li>
                    <li className="d-flex align-items-start gap-2">
                        <i className="ri-mail-line text-muted mt-0.5"></i>
                        <div className="text-truncate">
                            <span className="text-muted d-block text-xs">Email Address</span>
                            <span className="fw-semibold text-dark text-truncate d-block">{user?.email || 'N/A'}</span>
                        </div>
                    </li>
                    {primaryAddress && (
                        <li className="d-flex align-items-start gap-2">
                            <i className="ri-map-pin-line text-muted mt-0.5"></i>
                            <div>
                                <span className="text-muted d-block text-xs">Address</span>
                                <span className="fw-semibold text-dark">
                                    {[primaryAddress.street, primaryAddress.city, primaryAddress.state, primaryAddress.country, primaryAddress.zip_code].filter(Boolean).join(', ')}
                                </span>
                            </div>
                        </li>
                    )}
                    {user?.city && !primaryAddress && (
                        <li className="d-flex align-items-start gap-2">
                            <i className="ri-building-2-line text-muted mt-0.5"></i>
                            <div>
                                <span className="text-muted d-block text-xs">City</span>
                                <span className="fw-semibold text-dark">{user.city}</span>
                            </div>
                        </li>
                    )}
                    <li className="d-flex align-items-start gap-2">
                        <i className="ri-gift-line text-muted mt-0.5"></i>
                        <div>
                            <span className="text-muted d-block text-xs">Referral Code</span>
                            <span className="badge bg-light text-primary border fw-semibold">
                                {user?.referral_code || user?.referralcode || 'N/A'}
                            </span>
                        </div>
                    </li>
                    {user?.date && (
                        <li className="d-flex align-items-start gap-2">
                            <i className="ri-calendar-line text-muted mt-0.5"></i>
                            <div>
                                <span className="text-muted d-block text-xs">Member Since</span>
                                <span className="fw-semibold text-dark">
                                    {new Date(user.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </li>
                    )}
                </ul>

                {/* Quick Actions */}
                <div className="d-flex gap-2">
                    <Link
                        href={`/crm/chat`}
                        className="btn btn-outline-primary btn-sm rounded-pill w-100 d-inline-flex align-items-center justify-content-center gap-1"
                    >
                        <i className="ri-chat-smile-2-line"></i>
                        <span>Message</span>
                    </Link>
                    <Link
                        href={`/crm/whatsapp?phone=${user?.phone || ''}`}
                        className="btn btn-outline-success btn-sm rounded-pill w-100 d-inline-flex align-items-center justify-content-center gap-1"
                    >
                        <i className="ri-whatsapp-line"></i>
                        <span>WhatsApp</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default UserCard;