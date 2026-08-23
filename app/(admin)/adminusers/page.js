"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import axios from 'axios'
import LoadingComponent from '../../../components/common/LoadingComponent'
import UserStatusCard from '../../../components/common/UserStatusCard'
import FilterUser from '@/components/users/FilterUser'
import AddButton from '@/components/common/AddButton'
import SearchList from '@/components/common/SearchList'
import { getAdminUserStatusUrl, getAllAdminUsersUrl, updateAdminUserUrl } from '../../routes/userRoutes'
import { getPermisionsUrl } from '@/app/routes/premisionRoute'
import { showMessage } from '@/libs/commonHelper'

const PAGE_SIZE = 25;

function AdminUsersListPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const permisions = useSelector((state) => state.permision?.permisions || []);

    const [adminUsers, setAdminUsers] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);

    const [adminUsersStatus, setAdminUsersStatus] = useState([]);
    const [allPermisions, setAllPermisions] = useState([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [usersFilterStatus, setUsersFilterStatus] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const observer = useRef();

    // Fetch Status summary cards
    const fetchStatuses = useCallback(() => {
        if (!token) return;
        axios.get(getAdminUserStatusUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then((res) => {
            if (res.data?.status && res.data?.userStatus) {
                setAdminUsersStatus(res.data.userStatus);
            }
        }).catch(() => {}).finally(() => {
            setLoadingStatus(false);
        });
    }, [token]);

    // Fetch Permission groups for filter
    const fetchPermissionGroups = useCallback(() => {
        if (!token) return;
        axios.get(getPermisionsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then((res) => {
            if (res.data?.status && Array.isArray(res.data.permision)) {
                setAllPermisions(res.data.permision);
            }
        }).catch(() => {});
    }, [token]);

    // Fetch Paginated Admin Users
    const fetchAdminUsers = useCallback(async (pageNum = 1, isInitial = false) => {
        if (!token) return;
        if (isInitial) {
            setLoadingInitial(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const params = {
                page: pageNum,
                limit: PAGE_SIZE,
                search: searchQuery,
                status: usersFilterStatus,
                role: roleFilter
            };

            const response = await axios.get(getAllAdminUsersUrl, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data?.status) {
                const incomingUsers = response.data.adminUsers || response.data.reporters || [];
                const total = response.data.total !== undefined ? response.data.total : incomingUsers.length;
                const hasMorePages = response.data.hasMore !== undefined 
                    ? response.data.hasMore 
                    : (pageNum * PAGE_SIZE < total);

                if (isInitial || pageNum === 1) {
                    setAdminUsers(incomingUsers);
                } else {
                    setAdminUsers(prev => [...prev, ...incomingUsers]);
                }

                setTotalCount(total);
                setHasMore(hasMorePages);
                setPage(pageNum);
            } else {
                if (isInitial || pageNum === 1) setAdminUsers([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching admin users:", error);
            if (isInitial || pageNum === 1) setAdminUsers([]);
        } finally {
            setLoadingInitial(false);
            setLoadingMore(false);
        }
    }, [token, searchQuery, usersFilterStatus, roleFilter]);

    // Initial load
    useEffect(() => {
        fetchStatuses();
        fetchPermissionGroups();
    }, [fetchStatuses, fetchPermissionGroups]);

    // When filters change -> reload from page 1
    useEffect(() => {
        fetchAdminUsers(1, true);
    }, [fetchAdminUsers]);

    // Infinite scroll observer sentinel
    const lastUserElementRef = useCallback(node => {
        if (loadingInitial || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchAdminUsers(page + 1, false);
            }
        }, { threshold: 0.5 });
        if (node) observer.current.observe(node);
    }, [loadingInitial, loadingMore, hasMore, page, fetchAdminUsers]);

    // Toggle user status (Activate / Suspend)
    const handleToggleStatus = async (user) => {
        const nextStatus = user.status === 1 ? 0 : 1;
        const actionLabel = nextStatus === 1 ? "Activate" : "Suspend";

        if (!confirm(`Are you sure you want to ${actionLabel} ${user.first_name} ${user.last_name}?`)) {
            return;
        }

        try {
            const response = await axios.post(updateAdminUserUrl, {
                id: user.id,
                status: nextStatus
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data?.status) {
                showMessage("success", `User account ${actionLabel.toLowerCase()}d successfully.`);
                setAdminUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
                fetchStatuses();
            } else {
                showMessage("error", response.data?.msg || `Failed to ${actionLabel.toLowerCase()} user.`);
            }
        } catch (err) {
            showMessage("error", `Error: ${err.message}`);
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Page Header & Create Admin User Action */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <h4 className="fw-bold mb-1">Admin Users Management</h4>
                    <p className="text-muted small mb-0">Manage system administrators, staff members, and access privileges.</p>
                </div>
                <div>
                    <Link href="/adminusers/add" className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
                        <i className="icon-base ri ri-user-add-line icon-sm"></i>
                        <span className="fw-medium">Create Admin User</span>
                    </Link>
                </div>
            </div>

            {/* Status Overview Cards */}
            <div className="row g-6 mb-6">
                {loadingStatus ? (
                    <LoadingComponent />
                ) : (
                    adminUsersStatus && adminUsersStatus.map((status, index) => {
                        let colorType = "primary";
                        let description = status?.title + " Admin Users";
                        if (status?.title === "Active") colorType = "success";
                        if (status?.title === "Inactive") colorType = "danger";
                        if (status?.title === "Deleted") colorType = "danger";
                        const avatar = "ri ri-shield-user-line";
                        return <UserStatusCard key={index} status={status} description={description} avatar={avatar} colorType={colorType} />;
                    })
                )}
            </div>

            {/* Main Listing Card */}
            <div className="card shadow-sm border-0">
                {/* Filter Header */}
                <div className="card-header border-bottom py-3">
                    <FilterUser 
                        type={'adminuser'} 
                        allPermisions={allPermisions} 
                        setRoleChange={setRoleFilter} 
                        setUserStatus={setUsersFilterStatus} 
                    />
                </div>

                {/* Search & Actions Bar */}
                <div className="card-body border-bottom py-3">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div className="flex-grow-1" style={{ maxWidth: '400px' }}>
                            <SearchList handleSearch={setSearchQuery} placeholder="Search admin by name, email, phone..." />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted small fw-semibold">
                                {totalCount > 0 ? `Showing ${adminUsers.length} of ${totalCount} Admin Users` : '0 Admin Users'}
                            </span>
                            <AddButton hrefPath={"/adminusers/add"} buttonName={'Create Admin User'} />
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="table-responsive text-nowrap">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="ps-4">Admin User</th>
                                <th>Contact Information</th>
                                <th>Role / Permission Group</th>
                                <th>Status</th>
                                <th className="text-center pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingInitial ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <LoadingComponent />
                                    </td>
                                </tr>
                            ) : adminUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted">
                                        <i className="ri-user-unfollow-line fs-1 d-block mb-2 text-secondary"></i>
                                        <h6>No Admin Users Found</h6>
                                        <p className="mb-3 small">Try adjusting your filters or search terms.</p>
                                        <Link href="/adminusers/add" className="btn btn-sm btn-primary">
                                            <i className="ri-user-add-line me-1"></i> Add Admin User
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                adminUsers.map((reporter, index) => {
                                    const isLast = index === adminUsers.length - 1;
                                    return (
                                        <tr key={reporter.id || index} ref={isLast ? lastUserElementRef : null}>
                                            <td className="ps-4">
                                                <div className="d-flex justify-content-start align-items-center">
                                                    <div className="avatar avatar-md me-3">
                                                        <img 
                                                            src={reporter?.profile_picture ? (reporter.profile_picture.startsWith('data:') || reporter.profile_picture.startsWith('http') ? reporter.profile_picture : process.env.NEXT_PUBLIC_SERVER_URL + reporter?.profile_picture) : "/assets/img/avatars/1.png"} 
                                                            alt="Avatar" 
                                                            className="rounded-circle shadow-sm"
                                                            style={{ width: "42px", height: "42px", objectFit: "cover" }}
                                                        />
                                                    </div>
                                                    <div className="d-flex flex-column">
                                                        <Link href={`/adminusers/view?id=${reporter.id}`} className="text-heading fw-semibold text-decoration-none text-dark hover-primary">
                                                            {reporter.first_name} {reporter?.last_name}
                                                        </Link>
                                                        <small className="text-muted">{reporter.email || "No email registered"}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-medium text-dark">{reporter?.phone || "N/A"}</span>
                                                    <small className="text-muted">Direct Line</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-label-primary px-3 py-1.5 rounded-pill fw-semibold">
                                                    <i className="ri-shield-keyhole-line me-1"></i>
                                                    {reporter.role_name || (reporter.admin === 1 ? "Super Admin" : "Maintainer / Admin User")}
                                                </span>
                                            </td>
                                            <td>
                                                {reporter.status === 1 ? (
                                                    <span className="badge bg-label-success px-3 py-1.5 rounded-pill fw-semibold">Active</span>
                                                ) : (
                                                    <span className="badge bg-label-danger px-3 py-1.5 rounded-pill fw-semibold">Inactive</span>
                                                )}
                                            </td>
                                            <td className="text-center pe-4">
                                                <div className="d-flex justify-content-center align-items-center gap-2">
                                                    {/* View Profile */}
                                                    <Link 
                                                        href={`/adminusers/view?id=${reporter.id}`} 
                                                        className="btn btn-icon btn-sm btn-text-secondary rounded-pill text-primary"
                                                        title="View Admin Profile"
                                                    >
                                                        <i className="icon-base ri ri-eye-line icon-md"></i>
                                                    </Link>

                                                    {/* Edit User & Permissions */}
                                                    <Link 
                                                        href={`/adminusers/edit?id=${reporter.id}`} 
                                                        className="btn btn-icon btn-sm btn-text-secondary rounded-pill text-info"
                                                        title="Edit User & Permissions"
                                                    >
                                                        <i className="icon-base ri ri-edit-box-line icon-md"></i>
                                                    </Link>

                                                    {/* Toggle Status */}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleToggleStatus(reporter)}
                                                        className={`btn btn-icon btn-sm btn-text-secondary rounded-pill ${reporter.status === 1 ? "text-danger" : "text-success"}`}
                                                        title={reporter.status === 1 ? "Suspend User" : "Activate User"}
                                                    >
                                                        <i className={`icon-base ri ${reporter.status === 1 ? "ri-user-forbid-line" : "ri-user-follow-line"} icon-md`}></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Infinite Scroll Footer Indicator */}
                {loadingMore && (
                    <div className="text-center py-4 border-top">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        <span className="text-muted small fw-semibold">Loading next 25 admin users...</span>
                    </div>
                )}

                {!hasMore && adminUsers.length > 0 && !loadingInitial && (
                    <div className="text-center py-3 border-top bg-light">
                        <small className="text-muted">
                            <i className="ri-checkbox-circle-line text-success me-1"></i>
                            All {totalCount} admin users loaded.
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminUsersListPage;