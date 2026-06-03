"use client"

import { getParticulerUsersUrl } from '@/app/routes/userRoutes';
import LoadingComponent from '@/components/common/LoadingComponent';
import UserCard from '@/components/users/UserCard'
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

function page() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const token = useSelector((state) => state.adminAuth?.token);
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');

    async function getParticularUser() {
        try {
            const response = await axios.get(`${getParticulerUsersUrl}?id=${userId}`, {
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
        getParticularUser().then((res) => {
            if (res.status) {
                setLoading(false);
                setUser(res.user)
            }
        })
    }, [])

    return (
        <>
            {loading ?
                <LoadingComponent />
                :
                <div className="container-lg row mt-4">
                    <div className="col-xl-4 col-lg-5 col-md-5 order-1 order-md-0">
                        <UserCard user={user} />
                    </div>
                    <div className="col-xl-8 col-lg-7 col-md-7 order-0 order-md-1">
                        <div className="nav-align-top">
                            <ul className="nav nav-pills flex-column flex-md-row flex-wrap mb-6 row-gap-2">
                                <li className="nav-item">
                                    <a className="nav-link active waves-effect waves-light" href="javascript:void(0);"><i className="icon-base ri ri-group-line icon-sm me-2"></i>Account</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link waves-effect waves-light" href="app-user-view-security.html"><i className="icon-base ri ri-lock-2-line icon-sm me-2"></i>Security</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link waves-effect waves-light" href="app-user-view-billing.html"><i className="icon-base ri ri-bookmark-line icon-sm me-2"></i>Billing &amp; Plans</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link waves-effect waves-light" href="app-user-view-notifications.html"><i className="icon-base ri ri-notification-4-line icon-sm me-2"></i>Notifications</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link waves-effect waves-light" href="app-user-view-connections.html"><i className="icon-base ri ri-link-m icon-sm me-2"></i>Connections</a>
                                </li>
                            </ul>
                        </div>
                        <div className="card mb-6">
                            <div className="card-datatable table-responsive mb-n8">
                                <div id="DataTables_Table_0_wrapper" className="dt-container dt-bootstrap5 dt-empty-footer">
                                    <div className="row mx-md-2 my-0 justify-content-between">
                                        <div className="d-md-flex justify-content-between align-items-center dt-layout-start col-md-auto me-auto">
                                            <h5 className="card-title mb-0 text-md-start text-center">Project List</h5></div>
                                        <div className="d-md-flex justify-content-between align-items-center dt-layout-end col-md-auto ms-auto">
                                            <div className="dt-search">
                                                <input type="search" className="form-control form-control-sm" id="dt-search-0" placeholder="Search Project" aria-controls="DataTables_Table_0" />
                                                <label for="dt-search-0"></label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="justify-content-between dt-layout-table">
                                        <div className="d-md-flex justify-content-between align-items-center dt-layout-full table-responsive">
                                            <table className="table datatable-project table-border-bottom-0 mb-2 dataTable dtr-column" id="DataTables_Table_0" style={{width:  "100%"}}>

                                                <thead>
                                                    <tr>
                                                        <th data-dt-column="0" className="control dt-orderable-none dtr-hidden" rowspan="1" colspan="1" aria-label="" style={{display:  "none"}}><span className="dt-column-title"></span><span className="dt-column-order"></span></th>
                                                        <th data-dt-column="1" rowspan="1" colspan="1" className="dt-orderable-asc dt-orderable-desc dt-ordering-desc" aria-sort="descending" aria-label="Project: Activate to remove sorting"
                                                            tabindex="0"><span className="dt-column-title" role="button">Project</span><span className="dt-column-order"></span></th>
                                                        <th className="text-nowrap dt-orderable-asc dt-orderable-desc" data-dt-column="2" rowspan="1" colspan="1" aria-label="Total Task: Activate to sort"
                                                            tabindex="0"><span className="dt-column-title" role="button">Total Task</span><span className="dt-column-order"></span></th>
                                                        <th data-dt-column="3" rowspan="1" colspan="1" className="dt-orderable-asc dt-orderable-desc dt-type-numeric" aria-label="Progress: Activate to sort"
                                                            tabindex="0"><span className="dt-column-title" role="button">Progress</span><span className="dt-column-order"></span></th>
                                                        <th data-dt-column="4" rowspan="1" colspan="1" className="dt-orderable-none" aria-label="Hours"><span className="dt-column-title">Hours</span><span className="dt-column-order"></span></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="control dtr-hidden" tabindex="0" style={{display:  "none"}}></td>
                                                        <td className="sorting_1">
                                                            <div className="d-flex justify-content-left align-items-center">
                                                                <div className="avatar-wrapper">
                                                                    <div className="avatar avatar-sm me-3"><img src="../../assets/img/icons/brands/vue.png" alt="Project Image" className="rounded-circle" /></div>
                                                                </div>
                                                                <div className="d-flex flex-column"><span className="text-truncate fw-medium text-heading">Vue Admin template</span><small>Vuejs Project</small></div>
                                                            </div>
                                                        </td>
                                                        <td><span className="text-heading">214/627</span></td>
                                                        <td className="dt-type-numeric">
                                                            <div className="d-flex flex-column">
                                                                <p className="mb-0 text-heading">78%</p>
                                                                <div className="progress rounded bg-label-success w-100 me-3" style={{height:  "6px"}}>
                                                                    <div className="progress-bar rounded bg-success" style={{width:  "78%"}} aria-valuenow="78%" aria-valuemin="0" aria-valuemax="100"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>88:19h</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="control dtr-hidden" tabindex="0" style={{display:  "none"}}></td>
                                                        <td className="sorting_1">
                                                            <div className="d-flex justify-content-left align-items-center">
                                                                <div className="avatar-wrapper">
                                                                    <div className="avatar avatar-sm me-3"><img src="../../assets/img/icons/brands/html-label.png" alt="Project Image" className="rounded-circle" /></div>
                                                                </div>
                                                                <div className="d-flex flex-column"><span className="text-truncate fw-medium text-heading">Hoffman Website</span><small>HTML Project</small></div>
                                                            </div>
                                                        </td>
                                                        <td><span className="text-heading">56/183</span></td>
                                                        <td className="dt-type-numeric">
                                                            <div className="d-flex flex-column">
                                                                <p className="mb-0 text-heading">43%</p>
                                                                <div className="progress rounded bg-label-warning w-100 me-3" style={{height:  "6px"}}>
                                                                    <div className="progress-bar rounded bg-warning" style={{width:  "43%"}} aria-valuenow="43%" aria-valuemin="0" aria-valuemax="100"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>76h</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="control dtr-hidden" tabindex="0" style={{display:  "none"}}></td>
                                                        <td className="sorting_1">
                                                            <div className="d-flex justify-content-left align-items-center">
                                                                <div className="avatar-wrapper">
                                                                    <div className="avatar avatar-sm me-3"><img src="../../assets/img/icons/brands/xamarin.png" alt="Project Image" className="rounded-circle" /></div>
                                                                </div>
                                                                <div className="d-flex flex-column"><span className="text-truncate fw-medium text-heading">Foodista Mobile App</span><small>Xamarin Project</small></div>
                                                            </div>
                                                        </td>
                                                        <td><span className="text-heading">12/20</span></td>
                                                        <td className="dt-type-numeric">
                                                            <div className="d-flex flex-column">
                                                                <p className="mb-0 text-heading">69%</p>
                                                                <div className="progress rounded bg-label-info w-100 me-3" style={{height:  "6px"}}>
                                                                    <div className="progress-bar rounded bg-info" style={{width:  "69%"}} aria-valuenow="69%" aria-valuemin="0" aria-valuemax="100"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>12:12h</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="control dtr-hidden" tabindex="0" style={{display:  "none"}}></td>
                                                        <td className="sorting_1">
                                                            <div className="d-flex justify-content-left align-items-center">
                                                                <div className="avatar-wrapper">
                                                                    <div className="avatar avatar-sm me-3"><img src="../../assets/img/icons/brands/sketch-label.png" alt="Project Image" className="rounded-circle" /></div>
                                                                </div>
                                                                <div className="d-flex flex-column"><span className="text-truncate fw-medium text-heading">Foodista mobile app</span><small>iPhone Project</small></div>
                                                            </div>
                                                        </td>
                                                        <td><span className="text-heading">12/86</span></td>
                                                        <td className="dt-type-numeric">
                                                            <div className="d-flex flex-column">
                                                                <p className="mb-0 text-heading">49%</p>
                                                                <div className="progress rounded bg-label-warning w-100 me-3" style={{height:  "6px"}}>
                                                                    <div className="progress-bar rounded bg-warning" style={{width:  "49%"}} aria-valuenow="49%" aria-valuemin="0" aria-valuemax="100"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>45h</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="control dtr-hidden" tabindex="0" style={{display:  "none"}}></td>
                                                        <td className="sorting_1">
                                                            <div className="d-flex justify-content-left align-items-center">
                                                                <div className="avatar-wrapper">
                                                                    <div className="avatar avatar-sm me-3"><img src="../../assets/img/icons/brands/xd-label.png" alt="Project Image" className="rounded-circle" /></div>
                                                                </div>
                                                                <div className="d-flex flex-column"><span className="text-truncate fw-medium text-heading">Falcon Logo Design</span><small>UI/UX Project</small></div>
                                                            </div>
                                                        </td>
                                                        <td><span className="text-heading">9/50</span></td>
                                                        <td className="dt-type-numeric">
                                                            <div className="d-flex flex-column">
                                                                <p className="mb-0 text-heading">15%</p>
                                                                <div className="progress rounded bg-label-danger w-100 me-3" style={{height:  "6px"}}>
                                                                    <div className="progress-bar rounded bg-danger" style={{width:  "15%"}} aria-valuenow="15%" aria-valuemin="0" aria-valuemax="100"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>89h</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="control dtr-hidden" tabindex="0" style={{display:  "none"}}></td>
                                                        <td className="sorting_1">
                                                            <div className="d-flex justify-content-left align-items-center">
                                                                <div className="avatar-wrapper">
                                                                    <div className="avatar avatar-sm me-3"><img src="../../assets/img/icons/brands/react-info.png" alt="Project Image" className="rounded-circle" /></div>
                                                                </div>
                                                                <div className="d-flex flex-column"><span className="text-truncate fw-medium text-heading">Dojo React Project</span><small>React Project</small></div>
                                                            </div>
                                                        </td>
                                                        <td><span className="text-heading">234/378</span></td>
                                                        <td className="dt-type-numeric">
                                                            <div className="d-flex flex-column">
                                                                <p className="mb-0 text-heading">73%</p>
                                                                <div className="progress rounded bg-label-info w-100 me-3" style={{height:  "6px"}}>
                                                                    <div className="progress-bar rounded bg-info" style={{width:  "73%"}} aria-valuenow="73%" aria-valuemin="0" aria-valuemax="100"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>67:10h</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="control dtr-hidden" tabindex="0" style={{display:  "none"}}></td>
                                                        <td className="sorting_1">
                                                            <div className="d-flex justify-content-left align-items-center">
                                                                <div className="avatar-wrapper">
                                                                    <div className="avatar avatar-sm me-3">
                                                                        <img src="../../assets/img/icons/brands/figma-label-info.png" alt="Project Image" className="rounded-circle" />
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex flex-column"><span className="text-truncate fw-medium text-heading">Dashboard Design</span><small>Vuejs Project</small></div>
                                                            </div>
                                                        </td>
                                                        <td><span className="text-heading">100/190</span></td>
                                                        <td className="dt-type-numeric">
                                                            <div className="d-flex flex-column">
                                                                <p className="mb-0 text-heading">90%</p>
                                                                <div className="progress rounded bg-label-success w-100 me-3" style={{height:  "6px"}}>
                                                                    <div className="progress-bar rounded bg-success" style={{width:  "90%"}} aria-valuenow="90%" aria-valuemin="0" aria-valuemax="100"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>129:45h</td>
                                                    </tr>
                                                </tbody>
                                                <tfoot></tfoot>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="row mt-2 justify-content-between">
                                        <div className="d-md-flex justify-content-between align-items-center dt-layout-start col-md-auto me-auto"></div>
                                        <div className="d-md-flex justify-content-between align-items-center dt-layout-end col-md-auto ms-auto"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>}
        </>
    )
}

export default page