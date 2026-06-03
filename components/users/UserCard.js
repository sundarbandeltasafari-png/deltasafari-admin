"use client"

import React from 'react'

function UserCard({ user }) {
    return (
        <>
            <div class="card mb-6">
                <div class="card-body pt-12">
                    <div class="user-avatar-section">
                        <div class="d-flex align-items-center flex-column">
                            <img class="img-fluid rounded-3 mb-4" src={user?.profile_picture ? process.env.NEXT_PUBLIC_SERVER_URL + user?.profile_picture : "/assets/img/avatars/1.png"} height="120" width="120" alt="User avatar" />
                            <div class="user-info text-center">
                                <h5>{user?.first_name+' '+user?.last_name}</h5>
                            </div>
                        </div>
                    </div>
                    {user.admin == 3 && <div class="d-flex justify-content-around flex-wrap my-6 gap-0 gap-md-3 gap-lg-4">
                        <div class="d-flex align-items-center me-5 gap-4">
                            <div class="avatar">
                                <div class="avatar-initial bg-label-primary rounded-3">
                                    <i class="icon-base ri ri-check-line icon-24px"></i>
                                </div>
                            </div>
                            <div>
                                <h5 class="mb-0">1.23k</h5>
                                <span>Task Done</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-4">
                            <div class="avatar">
                                <div class="avatar-initial bg-label-primary rounded-3">
                                    <i class="icon-base ri ri-briefcase-line icon-24px"></i>
                                </div>
                            </div>
                            <div>
                                <h5 class="mb-0">568</h5>
                                <span>Project Done</span>
                            </div>
                        </div>
                    </div>}
                    <h5 class="pb-4 border-bottom mb-4">Details</h5>
                    <div class="info-container">
                        <ul class="list-unstyled mb-6">
                            <li class="mb-2">
                                <span class="fw-medium text-heading me-2">Contact:</span>
                                <span>{user?.phone || 'N/A'}</span>
                            </li>
                            <li class="mb-2">
                                <span class="fw-medium text-heading me-2">Email:</span>
                                <span>{user?.email || 'N/A'}</span>
                            </li>
                            <li class="mb-2">
                                <span class="fw-medium text-heading me-2">Status:</span>
                                {
                                    user?.status ?
                                    <span class="badge bg-label-success rounded-pill">Active</span>
                                    :
                                    <span class="badge bg-label-danger rounded-pill">Inactive</span>
                                }
                            </li>
                            <li class="mb-2">
                                <span class="fw-medium text-heading me-2">Role:</span>
                                <span>{user?.admin == 0 ? 'User' : user?.admin == 3 ? 'Reporter' : 'Admin User'}</span>
                            </li>
                            
                        </ul>
                        <div class="d-flex justify-content-center">
                            <a href="javascript:;" class="btn btn-primary me-4 waves-effect waves-light" data-bs-target="#editUser" data-bs-toggle="modal">Edit</a>
                            <a href="javascript:;" class="btn btn-outline-danger suspend-user waves-effect">Suspend</a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UserCard