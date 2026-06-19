"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAdminUserSearchUrl, getAdminUserStatusUrl, getAllAdminUsersUrl, getAlladminUsersUrl } from '../../routes/userRoutes'
import LoadingComponent from '../../../components/common/LoadingComponent'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import axios from 'axios'
import UserStatusCard from '../../../components/common/UserStatusCard'
import { getPermisionsUrl } from '@/app/routes/premisionRoute'
import FilterUser from '@/components/users/FilterUser'
import { axiosGet } from '@/libs/axiosHelper'
import AddButton from '@/components/common/AddButton'
import SearchList from '@/components/common/SearchList'

function page() {
    const [loading, setLoading] = useState(true);
    const [adminUsers, setAdminUsers] = useState([]);
    const token = useSelector((state) => state.adminAuth?.token);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [adminUsersStatus, setAdminUsersStatus] = useState();
    const [usersFilterStatus, setUsersFilterStatus] = useState();
    const [roleChange, setRoleChange] = useState()
    const permisions = useSelector((state) => state.permision?.permisions);
    const [allPermisions, setAllPermisions] = useState([]);
    const [searchData, setSearchData] = useState('')

    useEffect(() => {
        if (searchData || usersFilterStatus) {
            handleSearch();
        }
    }, [searchData, usersFilterStatus])

    function handleSearch() {
        setLoading(true)
        axiosPost(getAdminUserSearchUrl, { searchData: searchData, status: usersFilterStatus, role: roleChange }, token).then((res) => {
            if (res.status) {
                setusers(res.users)
            } else {
                showMessage("Something went wrong! Please try again later")
            }
        }).catch((err) => {
            showMessage("Something went wrong! " + err.message)
        }).finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        axiosGet(getAllAdminUsersUrl, token).then((res) => {
            if (res.status) {
                setLoading(false);
                setAdminUsers(res.adminUsers)
            }
        })
        axiosGet(getAdminUserStatusUrl, token).then((res) => {
            if (res.status) {
                setLoadingStatus(false);
                setAdminUsersStatus(res.userStatus)
            }
        })
        axiosGet(getPermisionsUrl, token).then((res) => {
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
                            <FilterUser type={'adminuser'} allPermisions={allPermisions} setRoleChange={setRoleChange} setUserStatus={setUsersFilterStatus} />
                        </div>
                    </div>
                    <div className="card-datatable">
                        <div id="DataTables_Table_0_wrapper" className="dt-container dt-bootstrap5 dt-empty-footer">
                            <div className="row m-2 my-0 mt-0 justify-content-between">
                                <div className="d-md-flex w-100 align-items-center dt-layout-end col-md-auto ms-auto d-flex gap-md-4 justify-content-md-between justify-content-center gap-md-2 flex-wrap mt-0">
                                    <SearchList handleSearch={setSearchData} />
                                    <AddButton hrefPath={"/adminusers/add"} buttonName={'Add New Admin User'} />
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
                                                                            <img src={reporter?.profile_picture ? process.env.NEXT_PUBLIC_SERVER_URL + reporter?.profile_picture : (reporter?.gender == 1 ? "/assets/img/avatars/1.png" : reporter?.gender == 2 ? "/assets/img/avatars/2.png" : "/assets/img/avatars/7.png")} alt="Avatar" className="rounded-circle" />
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