"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAdminUserStatusUrl, getAllAdminUsersUrl, getAlladminUsersUrl } from '../../routes/userRoutes'
import LoadingComponent from '../../../components/common/LoadingComponent'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import axios from 'axios'
import UserStatusCard from '../../../components/common/UserStatusCard'
import { getPermisionsUrl } from '@/app/routes/premisionRoute'

function page() {
    const [loading, setLoading] = useState(true);
    const [adminUsers, setAdminUsers] = useState([]);
    const token = useSelector((state) => state.adminAuth?.token);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [adminUsersStatus, setAdminUsersStatus] = useState();
    const permisions = useSelector((state) => state.permision?.permisions);
    const [allPermisions, setAllPermisions] = useState([]);

    async function getAlladminUsers() {
        try {
            const response = await axios.get(getAllAdminUsersUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            showMessage('Error fetching data:', error.response ? error.response.data : error.message);
        }
    }

    async function getadminUserstatus() {
        try {
            const response = await axios.get(getAdminUserStatusUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            showMessage('Error fetching data:', error.response ? error.response.data : error.message);
        }
    }

    async function getAllPermision() {
        try {
            const response = await axios.get(getPermisionsUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            showMessage('Error fetching data:', error.response ? error.response.data : error.message);
        }
    }

    useEffect(() => {
        getAlladminUsers().then((res) => {
            if (res.status) {
                setLoading(false);
                setAdminUsers(res.adminUsers)
            }
        })
        getadminUserstatus().then((res) => {
            if (res.status) {
                setLoadingStatus(false);
                setAdminUsersStatus(res.userStatus)
            }
        })
        getAllPermision().then((res) => {
            if (res.status) {
                setAllPermisions(res.permision)
            }
        })
    }, [])

    return (
        <>
            <div className="container-xxl flex-grow-1 container-p-y">
                <div className="row g-6 mb-6">
                    {loadingStatus ?
                        <LoadingComponent />
                        :
                        adminUsersStatus.map((status, index) => {
                            var colorType = "primary";
                            var description = status?.title + " Reporters"
                            if (status?.title == "Active") {
                                colorType = "success"
                            }
                            if (status?.title == "Inactive") {
                                colorType = "danger"
                            }
                            if (status?.title == "Deleted") {
                                colorType = "danger"
                            }
                            var avatar = "ri ri-group-line"
                            return <UserStatusCard key={index} status={status} description={description} avatar={avatar} colorType={colorType} />
                        })}
                </div>
                <div className="card">
                    <div className="card-header border-bottom">
                        <h5 className="card-title mb-0">Filters</h5>
                        <div className="d-flex justify-content-between align-items-center row gx-5 pt-4 gap-5 gap-md-0">
                            <div className="col-md-6 user_role">
                                <select id="UserRole" className="form-select text-capitalize">
                                    {
                                        allPermisions.map((per)=>{
                                            return <option value={per?.id}>{per?.name}</option>
                                        })
                                    }
                                </select>
                            </div>
                            <div className="col-md-6 user_status">
                                <select id="FilterTransaction" className="form-select text-capitalize">
                                    <option value="">Select Status</option>
                                    <option value="1" className="text-capitalize">Active</option>
                                    <option value="0" className="text-capitalize">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="card-datatable">
                        <div id="DataTables_Table_0_wrapper" className="dt-container dt-bootstrap5 dt-empty-footer">
                            <div className="row m-2 my-0 mt-0 justify-content-between">
                                <div className="d-md-flex w-100 align-items-center dt-layout-end col-md-auto ms-auto d-flex gap-md-4 justify-content-md-between justify-content-center gap-md-2 flex-wrap mt-0">
                                    <div className='d-flex gap-3'>
                                        <div className="dt-search">
                                            <input type="search" className="form-control form-control-sm" id="dt-search-0" placeholder="Search User" aria-controls="DataTables_Table_0" />
                                            <label htmlFor="dt-search-0"></label>
                                        </div>
                                        <div className='d-flex align-items-center justify-content-center'>
                                            <button className="btn add-new btn-primary" tabIndex="0" aria-controls="DataTables_Table_0" type="button">
                                                <span>
                                                    <i className="icon-base ri ri-search-line icon-sm me-0 me-sm-2"></i>
                                                    <span className="d-none d-sm-inline-block">Search</span>
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    {permisions.includes('/adminusers/add') && <div className="dt-buttons btn-group flex-wrap d-md-flex d-block gap-4 mb-md-0 mb-5 justify-content-center">
                                        <Link href={"/adminusers/add"} className="btn add-new btn-primary" tabIndex="0" aria-controls="DataTables_Table_0" type="button">
                                            <span>
                                                <i className="icon-base ri ri-add-line icon-sm me-0 me-sm-2"></i>
                                                <span className="d-none d-sm-inline-block">Add New Admin User</span>
                                            </span>
                                        </Link>
                                    </div>}
                                </div>
                            </div>
                            {loading ?
                                <LoadingComponent />
                                :
                                <div className="justify-content-between dt-layout-table">
                                    <div className="d-md-flex justify-content-between align-items-center dt-layout-full">
                                        <table className="datatables-users table dataTable dtr-column table-responsive" id="DataTables_Table_0" aria-describedby="DataTables_Table_0_info" style={{ width: "100%" }}>

                                            <thead>
                                                <tr>
                                                    <th data-dt-column="2" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc dt-ordering-desc" aria-sort="descending" aria-label="User: Activate to remove sorting" tabIndex="0"><span className="dt-column-title" role="button">User</span><span className="dt-column-order"></span></th>
                                                    <th data-dt-column="3" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc" aria-label="Email: Activate to sort"
                                                        tabIndex="0"><span className="dt-column-title" role="button">Phone</span><span className="dt-column-order"></span></th>
                                                    <th data-dt-column="4" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc" aria-label="Role: Activate to sort"
                                                        tabIndex="0"><span className="dt-column-title" role="button">Role</span><span className="dt-column-order"></span></th>
                                                    <th data-dt-column="5" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc" aria-label="Plan: Activate to sort"
                                                        tabIndex="0"><span className="dt-column-title" role="button">Plan</span><span className="dt-column-order"></span></th>
                                                    <th data-dt-column="6" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc" aria-label="Status: Activate to sort"
                                                        tabIndex="0"><span className="dt-column-title" role="button">Status</span><span className="dt-column-order"></span></th>
                                                    <th data-dt-column="7" rowSpan="1" colSpan="1" className="dt-orderable-none" aria-label="Actions"><span className="dt-column-title">Actions</span><span className="dt-column-order"></span></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    adminUsers?.map((reporter, index) => {
                                                        return <tr key={index}>
                                                            <td className="sorting_1">
                                                                <div className="d-flex justify-content-start align-items-center user-name">
                                                                    <div className="avatar-wrapper">
                                                                        <div className="avatar avatar-sm me-4">
                                                                            <img src="../../assets/img/avatars/2.png" alt="Avatar" className="rounded-circle" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex flex-column">
                                                                        <a href="app-user-view-account.html" className="text-heading text-truncate">
                                                                            <span className="fw-medium">{reporter.first_name + " " + reporter?.last_name}</span>
                                                                        </a>
                                                                        <small>Reporter</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span>{reporter?.phone}</span>
                                                            </td>
                                                            <td>
                                                                <span className="text-truncate d-flex align-items-center text-heading">
                                                                    <i className="icon-base ri ri-pie-chart-line icon-22px text-success me-2"></i>Maintainer</span>
                                                            </td>
                                                            <td>
                                                                <span className="text-heading">Enterprise</span>
                                                            </td>
                                                            <td>
                                                                {reporter.status ?
                                                                    <span className="badge rounded-pill bg-label-success" text-capitalized="">Active</span>
                                                                    :
                                                                    <span className="badge rounded-pill bg-label-danger" text-capitalized="">Inactive</span>
                                                                }
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <a href="app-user-view-account.html" className="btn btn-icon btn-text-secondary rounded-pill">
                                                                        <i className="icon-base ri ri-eye-line icon-md"></i>
                                                                    </a>
                                                                    {permisions.includes('/adminusers/edit') && <>
                                                                        <a href="javascript:;" className="btn btn-icon btn-text-secondary rounded-pill dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                                                            <i className="icon-base ri ri-more-2-line icon-md"></i>
                                                                        </a>
                                                                        <div className="dropdown-menu dropdown-menu-end m-0">
                                                                            <a href="javascript:;" className="dropdown-item">Edit</a>
                                                                            <a href="javascript:;" className="dropdown-item">Suspend</a>
                                                                        </div>
                                                                    </>}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default page