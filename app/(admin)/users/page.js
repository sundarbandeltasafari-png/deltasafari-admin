"use client"
import React, { useEffect, useState } from 'react'
import { getUserStatusUrl, getAllUsersUrl, getUserSearchUrl } from '../../routes/userRoutes'
import LoadingComponent from '../../../components/common/LoadingComponent'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import axios from 'axios'
import UserStatusCard from '../../../components/common/UserStatusCard'
import { showMessage } from '@/libs/commonHelper'
import FilterUser from '@/components/users/FilterUser'
import SearchList from '@/components/common/SearchList'
import AddButton from '@/components/common/AddButton'
import ViewButton from '@/components/common/ViewButton'
import { urlEncode } from '@/libs/urlHelper'
import NotFound from '@/components/common/NotFound'

function page() {
    const route = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setusers] = useState([]);
    const token = useSelector((state) => state.adminAuth?.token);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [usersStatus, setusersStatus] = useState();
    const permisions = useSelector((state) => state.permision?.permisions);

    async function getAllusers() {
        try {
            const response = await axios.get(getAllUsersUrl, {
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

    async function getuserstatus() {
        try {
            const response = await axios.get(getUserStatusUrl, {
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

    async function getSearchResult(searchData) {
        try {
            const response = await axios.post(getUserSearchUrl, {
                searchData: searchData
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
            );
            return response.data;
        } catch (error) {
            return new Error('Error fetching data:', error.response ? error.response.data : error.message);
        }
    }

    function handleSearch(searchData) {
        setLoading(true)
        getSearchResult(searchData).then((res) => {
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
        getAllusers().then((res) => {
            if (res.status) {
                setLoading(false);
                setusers(res.users);
            }
        })
        getuserstatus().then((res) => {
            if (res.status) {
                setLoadingStatus(false);
                setusersStatus(res.userStatus);
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
                        usersStatus.map((status, index) => {
                            var colorType = "primary";
                            var description = status?.title + " Users"
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
                        <FilterUser />
                    </div>
                    <div className="card-datatable">
                        <div id="DataTables_Table_0_wrapper" className="dt-container dt-bootstrap5 dt-empty-footer">
                            <div className="row m-2 my-0 mt-0 justify-content-between">
                                <div className="d-md-flex w-100 align-items-center dt-layout-end col-md-auto ms-auto d-flex gap-md-4 justify-content-md-between justify-content-center gap-md-2 flex-wrap mt-0">
                                    <SearchList handleSearch={handleSearch} />
                                    <AddButton hrefPath={"/users/add"} buttonName={'Add New User'} />
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
                                                    <th data-dt-column="2" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc dt-ordering-desc" aria-sort="descending" aria-label="User: Activate to remove sorting" tabIndex="0">
                                                        <span className="dt-column-title" role="button">User</span>
                                                        <span className="dt-column-order"></span>
                                                    </th>
                                                    <th data-dt-column="3" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc" aria-label="Email: Activate to sort" tabIndex="0">
                                                        <span className="dt-column-title" role="button">Phone / Email</span>
                                                        <span className="dt-column-order"></span>
                                                    </th>
                                                    <th data-dt-column="4" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc" aria-label="Role: Activate to sort" tabIndex="0">
                                                        <span className="dt-column-title" role="button">Role</span>
                                                        <span className="dt-column-order"></span>
                                                    </th>
                                                    <th data-dt-column="6" rowSpan="1" colSpan="1" className="dt-orderable-asc dt-orderable-desc" aria-label="Status: Activate to sort" tabIndex="0">
                                                        <span className="dt-column-title" role="button">Status</span>
                                                        <span className="dt-column-order"></span>
                                                    </th>
                                                    <th data-dt-column="7" rowSpan="1" colSpan="1" className="dt-orderable-none" aria-label="Actions">
                                                        <span className="dt-column-title">Actions</span>
                                                        <span className="dt-column-order"></span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.length == 0 ?
                                                <tr>
                                                    <NotFound height={150} width={150} classes={"col-12"} />
                                                </tr>
                                                    :
                                                    users?.map((user, index) => {
                                                        return <tr key={index}>
                                                            <td className="sorting_1">
                                                                <div className="d-flex justify-content-start align-items-center user-name">
                                                                    <div className="avatar-wrapper">
                                                                        <div className="avatar avatar-sm me-4">
                                                                            <img src={user?.profile_picture ? process.env.NEXT_PUBLIC_SERVER_URL + user?.profile_picture : "/assets/img/avatars/2.png"} alt="Avatar" className="rounded-circle" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex flex-column">
                                                                        <a href="app-user-view-account.html" className="text-heading text-truncate">
                                                                            <span className="fw-medium">{user?.first_name + " " + user?.last_name}</span>
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span>{user?.phone ? user?.phone : user?.email}</span>
                                                            </td>
                                                            <td>
                                                                <span className="text-truncate d-flex align-items-center text-heading">
                                                                    <i className="icon-base ri ri-pie-chart-line icon-22px text-success me-2"></i>Maintainer</span>
                                                            </td>
                                                            <td>
                                                                {user.status ?
                                                                    <span className="badge rounded-pill bg-label-success" text-capitalized="">Active</span>
                                                                    :
                                                                    <span className="badge rounded-pill bg-label-danger" text-capitalized="">Inactive</span>
                                                                }
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <ViewButton hrefPath={`/users/view?id=${urlEncode(user?.id)}`} viewPath={"/users"} />
                                                                    {permisions.includes('/users/edit') && <>
                                                                        <a href="javascript:;" className="btn btn-icon btn-text-secondary rounded-pill dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                                                            <i className="icon-base ri ri-more-2-line icon-md"></i>
                                                                        </a>
                                                                        <div className="dropdown-menu dropdown-menu-end m-0">
                                                                            <a onClick={() => { route.push(`/users/edit?id=${urlEncode(user?.id)}`) }} className="dropdown-item">Edit</a>
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