"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import LoadingComponent from '../../../components/common/LoadingComponent'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { showMessage } from '@/libs/commonHelper'
import { getPermisionsUrl } from '@/app/routes/premisionRoute'
import { calculateTime } from '@/libs/timeHelper'
import { urlEncode } from '@/libs/urlHelper'

function page() {
    const route = useRouter();
    const [loading, setLoading] = useState(true);
    const [permisions, setPermisions] = useState([]);
    // console.log(permisions)
    const token = useSelector((state) => state.adminAuth?.token);
    const [permisionRoutes, setPermisionRoutes] = useState([])
    const myPermisions = useSelector((state) => state.permision?.permisions);

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
        getAllPermision().then((res) => {
            if (res.status) {
                setLoading(false);
                setPermisions(res.permision)
            }
        })
    }, [])

    function handleViewRoute(permisionRoute) {
        setPermisionRoutes(JSON.parse(permisionRoute));
        setTimeout(() => {
            document.getElementById('addRoleModalbtn').click();
        }, 200);
    }

    return (
        <>
            <div className="container-xxl flex-grow-1 container-p-y">
                <div className="card">
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
                                    <div className="dt-buttons btn-group flex-wrap d-md-flex d-block gap-4 mb-md-0 mb-5 justify-content-center">
                                        {myPermisions.includes('/permision/add') && <Link href={"/permision/add"} className="btn add-new btn-primary" tabIndex="0" aria-controls="DataTables_Table_0" type="button">
                                            <span>
                                                <i className="icon-base ri ri-add-line icon-sm me-0 me-sm-2"></i>
                                                <span className="d-none d-sm-inline-block">Add Permision Group</span>
                                            </span>
                                        </Link>}
                                    </div>
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
                                                    <th data-dt-column="2" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc dt-ordering-desc" aria-sort="descending" aria-label="User: Activate to remove sorting" tabIndex="0"><span className="dt-column-title" role="button">Group</span><span className="dt-column-order"></span></th>

                                                    <th data-dt-column="6" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc" aria-label="Status: Activate to sort"
                                                        tabIndex="0"><span className="dt-column-title" role="button">Status</span><span className="dt-column-order"></span></th>
                                                    <th data-dt-column="6" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc" aria-label="Status: Activate to sort"
                                                        tabIndex="0"><span className="dt-column-title" role="button">Created Date</span><span className="dt-column-order"></span></th>
                                                    <th data-dt-column="7" rowSpan="1" colSpan="1" className="dt-orderable-none" aria-label="Actions"><span className="dt-column-title">Actions</span><span className="dt-column-order"></span></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    permisions?.map((permision, index) => {
                                                        return <tr key={index}>
                                                            <td className="sorting_1">
                                                                <div className="d-flex justify-content-start align-items-center user-name">
                                                                    <div className="d-flex flex-column">
                                                                        <p>{permision?.name}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {permision.status ?
                                                                    <span className="badge rounded-pill bg-label-success" text-capitalized="">Active</span>
                                                                    :
                                                                    <span className="badge rounded-pill bg-label-danger" text-capitalized="">Inactive</span>
                                                                }
                                                            </td>
                                                            <td>
                                                                <p>{calculateTime(permision?.created_at)}</p>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <a onClick={() => { handleViewRoute(permision.routes) }} className="btn btn-icon btn-text-secondary rounded-pill">
                                                                        <i className="icon-base ri ri-eye-line icon-md"></i>
                                                                    </a>
                                                                    {myPermisions.includes('/permision/edit') && <>
                                                                        <a className="btn btn-icon btn-text-secondary rounded-pill dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                                                            <i className="icon-base ri ri-more-2-line icon-md"></i>
                                                                        </a>
                                                                        <div className="dropdown-menu dropdown-menu-end m-0" onClick={() => { route.push(`/permision/edit?id=${urlEncode(permision.id)}`) }}>
                                                                            <a className="dropdown-item">Edit</a>
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
            <button type="button" className="btn btn-primary d-none" id="addRoleModalbtn" data-bs-toggle="modal" data-bs-target="#addRoleModal"></button>
            <div className={`modal fade`} id="addRoleModal" tabIndex="-1" aria-modal="true" role="dialog">
                <div className="modal-dialog modal-lg modal-simple modal-dialog-centered modal-add-new-role">
                    <div className="modal-content">
                        <div className="modal-body p-0">
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            <div className="col-12">
                                <h5 className="mb-6">Role Permissions</h5>
                                <div className="table-responsive">
                                    <table className="table table-flush-spacing">
                                        <tbody>
                                            <tr>
                                                <td className="text-nowrap fw-medium">
                                                    Administrator Access
                                                    <i className="icon-base ri ri-information-line icon-sm" data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Allows a full access to the system" data-bs-original-title="Allows a full access to the system"></i>
                                                </td>
                                            </tr>
                                            {
                                                permisionRoutes.length > 0 && permisionRoutes[0].route_id && permisionRoutes.map((routes) => {
                                                    return <tr>
                                                        <td className="text-nowrap fw-medium">{routes?.name}</td>
                                                        <td>
                                                            <div className="d-flex justify-content-end">
                                                                <div className="form-check mb-0 mt-1 me-4 me-lg-12">
                                                                    <input className="form-check-input" type="checkbox" id="userManagementRead" disabled={true} checked={routes.view_route && true} />
                                                                    <label className="form-check-label" for="userManagementRead"> View </label>
                                                                </div>
                                                                <div className="form-check mb-0 mt-1  me-4">
                                                                    <input className="form-check-input" type="checkbox" id="userManagementCreate" disabled={true} checked={routes.add_route && true} />
                                                                    <label className="form-check-label" for="userManagementCreate"> Create </label>
                                                                </div>
                                                                <div className="form-check mb-0 mt-1 me-4 me-lg-12">
                                                                    <input className="form-check-input" type="checkbox" id="userManagementWrite" disabled={true} checked={routes.edit_route && true} />
                                                                    <label className="form-check-label" for="userManagementWrite"> Edit </label>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                })
                                            }

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default page