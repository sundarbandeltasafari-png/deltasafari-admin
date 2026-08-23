"use client"

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import axios from 'axios'
import LoadingComponent from '@/components/common/LoadingComponent'
import { getParticularAdminUserUrl } from '@/app/routes/userRoutes'
import { getParticularPermisionUrl } from '@/app/routes/premisionRoute'
import { showMessage } from '@/libs/commonHelper'

function ViewAdminUserContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('id');
    const token = useSelector((state) => state.adminAuth?.token);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [loadingPermissions, setLoadingPermissions] = useState(false);

    useEffect(() => {
        if (!userId) {
            router.push('/adminusers');
            return;
        }

        if (token) {
            setLoading(true);
            axios.get(`${getParticularAdminUserUrl}?id=${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }).then((res) => {
                if (res.data?.status && res.data?.user) {
                    setUser(res.data.user);
                    if (res.data.user.permision_group_id) {
                        fetchRolePermissions(res.data.user.permision_group_id);
                    }
                } else {
                    showMessage("error", res.data?.msg || "Failed to load admin user details.");
                }
            }).catch((err) => {
                showMessage("error", "Error loading admin user: " + (err.response?.data?.msg || err.message));
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [userId, token]);

    const fetchRolePermissions = (groupId) => {
        setLoadingPermissions(true);
        axios.get(`${getParticularPermisionUrl}?id=${groupId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then((res) => {
            if (res.data?.status && res.data?.permision?.routes) {
                try {
                    const parsed = typeof res.data.permision.routes === 'string'
                        ? JSON.parse(res.data.permision.routes)
                        : (Array.isArray(res.data.permision.routes) ? res.data.permision.routes : []);
                    setRolePermissions(parsed);
                } catch {
                    setRolePermissions([]);
                }
            }
        }).catch(() => {
            setRolePermissions([]);
        }).finally(() => {
            setLoadingPermissions(false);
        });
    };

    if (loading) {
        return (
            <div className="container-xxl flex-grow-1 container-p-y py-5">
                <LoadingComponent />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container-xxl flex-grow-1 container-p-y text-center py-5">
                <h4>Admin User Not Found</h4>
                <Link href="/adminusers" className="btn btn-primary mt-3">Back to Admin Users</Link>
            </div>
        );
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header / Breadcrumb */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Admin User Profile</h4>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb breadcrumb-style1 mb-0">
                            <li className="breadcrumb-item">
                                <Link href="/adminusers">Admin Users</Link>
                            </li>
                            <li className="breadcrumb-item active">{user.first_name} {user.last_name}</li>
                        </ol>
                    </nav>
                </div>
                <div className="d-flex gap-2">
                    <Link href="/adminusers" className="btn btn-outline-secondary">
                        <i className="ri ri-arrow-left-line me-1"></i> Back
                    </Link>
                    <Link href={`/adminusers/edit?id=${user.id}`} className="btn btn-primary">
                        <i className="ri ri-edit-box-line me-1"></i> Edit User & Permissions
                    </Link>
                </div>
            </div>

            <div className="row g-4">
                {/* Left Column: User Summary Card */}
                <div className="col-xl-4 col-lg-5 col-md-5">
                    <div className="card mb-4 shadow-sm border-0">
                        <div className="card-body text-center pt-5">
                            <div className="avatar-wrapper mb-3">
                                <div className="avatar avatar-xl d-inline-block">
                                    <img 
                                        src={user.profile_picture ? (user.profile_picture.startsWith('data:') || user.profile_picture.startsWith('http') ? user.profile_picture : process.env.NEXT_PUBLIC_SERVER_URL + user.profile_picture) : "/assets/img/avatars/1.png"} 
                                        alt="Avatar" 
                                        className="rounded-circle shadow-sm"
                                        style={{ width: "110px", height: "110px", objectFit: "cover" }}
                                    />
                                </div>
                            </div>
                            <h5 className="mb-1 text-dark fw-bold">{user.first_name} {user.last_name}</h5>
                            <div className="d-flex justify-content-center gap-2 mb-3">
                                <span className="badge bg-label-primary px-3 py-1.5 rounded-pill">
                                    {user.role_name || (user.admin === 1 ? "Super Admin" : "Maintainer / Admin User")}
                                </span>
                                {user.status === 1 ? (
                                    <span className="badge bg-label-success px-3 py-1.5 rounded-pill">Active</span>
                                ) : (
                                    <span className="badge bg-label-danger px-3 py-1.5 rounded-pill">Inactive</span>
                                )}
                            </div>

                            <hr className="my-4 text-muted opacity-25" />

                            <div className="text-start">
                                <h6 className="text-uppercase text-muted small fw-bold mb-3">Account Details</h6>
                                <ul className="list-unstyled mb-0">
                                    <li className="mb-3 d-flex align-items-center">
                                        <i className="ri ri-mail-line text-primary me-2 fs-5"></i>
                                        <div>
                                            <small className="text-muted d-block">Email Address</small>
                                            <span className="fw-semibold text-dark">{user.email || "N/A"}</span>
                                        </div>
                                    </li>
                                    <li className="mb-3 d-flex align-items-center">
                                        <i className="ri ri-phone-line text-success me-2 fs-5"></i>
                                        <div>
                                            <small className="text-muted d-block">Phone Number</small>
                                            <span className="fw-semibold text-dark">{user.phone || "N/A"}</span>
                                        </div>
                                    </li>
                                    <li className="mb-3 d-flex align-items-center">
                                        <i className="ri ri-shield-keyhole-line text-info me-2 fs-5"></i>
                                        <div>
                                            <small className="text-muted d-block">Admin Role Group</small>
                                            <span className="fw-semibold text-dark">{user.role_name || "Custom Permissions"}</span>
                                        </div>
                                    </li>
                                    <li className="mb-0 d-flex align-items-center">
                                        <i className="ri ri-calendar-line text-warning me-2 fs-5"></i>
                                        <div>
                                            <small className="text-muted d-block">Member Since</small>
                                            <span className="fw-semibold text-dark">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                                            </span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Social & Contact Card */}
                    <div className="card mb-4 shadow-sm border-0">
                        <div className="card-header border-bottom py-3">
                            <h6 className="card-title mb-0 fw-bold">Social Links</h6>
                        </div>
                        <div className="card-body pt-3">
                            {user.socials && Object.keys(user.socials).length > 0 ? (
                                <ul className="list-unstyled mb-0">
                                    {user.socials.twitter && (
                                        <li className="mb-2">
                                            <a href={user.socials.twitter} target="_blank" rel="noreferrer" className="text-decoration-none d-flex align-items-center text-dark">
                                                <i className="ri ri-twitter-x-line text-dark me-2"></i> {user.socials.twitter}
                                            </a>
                                        </li>
                                    )}
                                    {user.socials.facebook && (
                                        <li className="mb-2">
                                            <a href={user.socials.facebook} target="_blank" rel="noreferrer" className="text-decoration-none d-flex align-items-center text-primary">
                                                <i className="ri ri-facebook-fill text-primary me-2"></i> {user.socials.facebook}
                                            </a>
                                        </li>
                                    )}
                                    {user.socials.linkedin && (
                                        <li className="mb-2">
                                            <a href={user.socials.linkedin} target="_blank" rel="noreferrer" className="text-decoration-none d-flex align-items-center text-info">
                                                <i className="ri ri-linkedin-fill text-info me-2"></i> {user.socials.linkedin}
                                            </a>
                                        </li>
                                    )}
                                    {user.socials.portfolio && (
                                        <li className="mb-0">
                                            <a href={user.socials.portfolio} target="_blank" rel="noreferrer" className="text-decoration-none d-flex align-items-center text-secondary">
                                                <i className="ri ri-global-line text-secondary me-2"></i> {user.socials.portfolio}
                                            </a>
                                        </li>
                                    )}
                                </ul>
                            ) : (
                                <p className="text-muted mb-0 small">No social links linked to this profile.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Bio, Address & Permissions Breakdown */}
                <div className="col-xl-8 col-lg-7 col-md-7">
                    {/* Bio & Address Card */}
                    <div className="card mb-4 shadow-sm border-0">
                        <div className="card-header border-bottom py-3">
                            <h6 className="card-title mb-0 fw-bold">Personal & Address Information</h6>
                        </div>
                        <div className="card-body pt-3">
                            <div className="mb-4">
                                <label className="text-muted small fw-bold text-uppercase d-block mb-1">Biography</label>
                                <p className="text-dark mb-0 bg-light p-3 rounded-2">
                                    {user.bio || "No biography provided."}
                                </p>
                            </div>

                            <label className="text-muted small fw-bold text-uppercase d-block mb-2">Location & Address</label>
                            <div className="row g-3">
                                <div className="col-sm-6">
                                    <div className="p-3 bg-light rounded-2">
                                        <small className="text-muted d-block">Street</small>
                                        <span className="fw-semibold text-dark">{user.street || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="p-3 bg-light rounded-2">
                                        <small className="text-muted d-block">City</small>
                                        <span className="fw-semibold text-dark">{user.city || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="p-3 bg-light rounded-2">
                                        <small className="text-muted d-block">State</small>
                                        <span className="fw-semibold text-dark">{user.state || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="p-3 bg-light rounded-2">
                                        <small className="text-muted d-block">Zip Code</small>
                                        <span className="fw-semibold text-dark">{user.zip_code || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="p-3 bg-light rounded-2">
                                        <small className="text-muted d-block">Country</small>
                                        <span className="fw-semibold text-dark">{user.country || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Permissions Breakdown Card */}
                    <div className="card shadow-sm border-0">
                        <div className="card-header border-bottom py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="card-title mb-0 fw-bold">Active Role & Module Permissions</h6>
                                <small className="text-muted">Assigned via: <strong>{user.role_name || "Default Role"}</strong></small>
                            </div>
                            <Link href={`/adminusers/edit?id=${user.id}`} className="btn btn-sm btn-outline-primary">
                                Change Role
                            </Link>
                        </div>
                        <div className="card-body p-0">
                            {loadingPermissions ? (
                                <div className="p-4 text-center">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                    <span className="ms-2 text-muted">Loading role permissions...</span>
                                </div>
                            ) : rolePermissions.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0 align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Module Name</th>
                                                <th className="text-center">Read / View</th>
                                                <th className="text-center">Create / Add</th>
                                                <th className="text-center pe-4">Edit / Update</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rolePermissions.map((route, idx) => (
                                                <tr key={idx}>
                                                    <td className="ps-4 fw-medium text-dark">{route.name || `Module #${route.route_name || route.id}`}</td>
                                                    <td className="text-center">
                                                        {route.view_route ? (
                                                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5">
                                                                <i className="ri-check-line me-1"></i> Allowed
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill px-2.5">
                                                                <i className="ri-close-line me-1"></i> No Access
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {route.add_route ? (
                                                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5">
                                                                <i className="ri-check-line me-1"></i> Allowed
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill px-2.5">
                                                                <i className="ri-close-line me-1"></i> No Access
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-center pe-4">
                                                        {route.edit_route ? (
                                                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5">
                                                                <i className="ri-check-line me-1"></i> Allowed
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill px-2.5">
                                                                <i className="ri-close-line me-1"></i> No Access
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-4 text-center text-muted">
                                    <p className="mb-0">No custom module matrix assigned. Full system administrator access applies.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ViewAdminUserPage() {
    return (
        <Suspense fallback={<div className="container-xxl flex-grow-1 container-p-y py-5"><LoadingComponent /></div>}>
            <ViewAdminUserContent />
        </Suspense>
    );
}
