"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import LoadingComponent from '../../../components/common/LoadingComponent'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { showMessage } from '@/libs/commonHelper'
import { getPermisionsUrl, deletePermisionUrl } from '@/app/routes/premisionRoute'
import { calculateTime } from '@/libs/timeHelper'
import { urlEncode } from '@/libs/urlHelper'

function page() {
    const route = useRouter();
    const [loading, setLoading] = useState(true);
    const [permisions, setPermisions] = useState([]);
    // console.log(permisions)
    const token = useSelector((state) => state.adminAuth?.token);
    const [permisionRoutes, setPermisionRoutes] = useState([])
    const [selectedGroupToDelete, setSelectedGroupToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const currentUser = useSelector((state) => state.adminAuth?.user);
    const myPermisions = useSelector((state) => state.permision?.permisions || []);

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

    const openDeleteModal = (group) => {
        if (!group?.id) return;
        setSelectedGroupToDelete(group);
        setTimeout(() => {
            document.getElementById('deleteConfirmModalBtn')?.click();
        }, 100);
    };

    const closeModalHelper = () => {
        try {
            const closeBtn = document.getElementById('closeDeleteModalBtn');
            if (closeBtn) {
                closeBtn.click();
            }
            const modalEl = document.getElementById('deleteConfirmModal');
            if (modalEl && typeof window !== 'undefined' && window.bootstrap?.Modal) {
                const instance = window.bootstrap.Modal.getInstance(modalEl);
                if (instance) instance.hide();
            }
        } catch (e) {
            console.error("Modal close error:", e);
        }

        // Clean up backdrop and body styles
        setTimeout(() => {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(b => b.remove());
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('padding-right');
            document.body.style.removeProperty('overflow');
            setSelectedGroupToDelete(null);
        }, 150);
    };

    const confirmDeletePermission = async () => {
        if (!selectedGroupToDelete?.id) return;
        setDeleting(true);

        try {
            const response = await axios.post(deletePermisionUrl, { id: selectedGroupToDelete.id }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status) {
                showMessage("success", response.data.msg || "Permission group deleted successfully.");
                setPermisions(prev => prev.filter(p => p.id !== selectedGroupToDelete.id));
                closeModalHelper();
            } else {
                showMessage("error", response.data?.msg || "Cannot delete permission group.");
            }
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.message || "Failed to delete permission group.";
            showMessage("error", errMsg);
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        getAllPermision().then((res) => {
            if (res.status) {
                setLoading(false);
                setPermisions(res.permision)
            }
        })
    }, [])

    function handleViewRoute(permisionRoute) {
        try {
            const parsed = typeof permisionRoute === 'string' ? JSON.parse(permisionRoute) : (Array.isArray(permisionRoute) ? permisionRoute : []);
            const filtered = parsed.filter(r => {
                const n = (r.name || '').toLowerCase();
                const routeName = (r.route || '').toLowerCase();
                return !(
                    n.includes('crm') || 
                    n.includes('news') || 
                    n.includes('blog') || 
                    n.includes('reporter') || 
                    n.includes('zone') || 
                    n.includes('destination') ||
                    routeName.includes('crm') ||
                    routeName.includes('news') ||
                    routeName.includes('zone')
                );
            });
            setPermisionRoutes(filtered);
        } catch {
            setPermisionRoutes([]);
        }
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
                                <div className="d-md-flex py-3 w-100 align-items-center dt-layout-end col-md-auto ms-auto d-flex gap-md-4 justify-content-md-between justify-content-center gap-md-2 flex-wrap mt-0">
                                    <div className='d-flex gap-3'>
                                        
                                    </div>
                                    <div className="dt-buttons btn-group flex-wrap d-md-flex d-block gap-4 mb-md-0 mb-5 justify-content-center">
                                        {(currentUser?.admin === 1 || myPermisions.includes('*') || myPermisions.includes('/permision/add') || myPermisions.includes('/permision')) && (
                                            <Link href={"/permision/add"} className="btn add-new btn-primary d-flex align-items-center gap-2" tabIndex="0" type="button">
                                                <i className="icon-base ri ri-add-line icon-sm"></i>
                                                <span className="fw-medium">Add Permision Group</span>
                                            </Link>
                                        )}
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
                                                    <th data-dt-column="7" rowSpan="1" colSpan="1" className="dt-orderable-none text-center pe-4" aria-label="Actions" style={{ minWidth: '120px' }}><span className="dt-column-title">Actions</span><span className="dt-column-order"></span></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    permisions?.map((permision, index) => {
                                                        return <tr key={index}>
                                                            <td className="sorting_1">
                                                                <div className="d-flex justify-content-start align-items-center user-name">
                                                                    <div className="d-flex flex-column">
                                                                        <p className="fw-medium mb-0">{permision?.name}</p>
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
                                                                <p className="mb-0">{calculateTime(permision?.created_at)}</p>
                                                            </td>
                                                            <td className="text-center pe-4">
                                                                <div className="d-flex justify-content-center align-items-center gap-2">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => { handleViewRoute(permision.routes) }} 
                                                                        className="btn btn-icon btn-sm btn-text-secondary rounded-pill text-primary"
                                                                        style={{ cursor: 'pointer', width: '38px', height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        title="View Permissions"
                                                                    >
                                                                        <i className="icon-base ri ri-eye-line fs-4"></i>
                                                                    </button>
                                                                    {(currentUser?.admin === 1 || myPermisions.includes('*') || myPermisions.includes('/permision/edit') || myPermisions.includes('/permision')) && (
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => { route.push(`/permision/edit?id=${urlEncode(permision.id)}`) }} 
                                                                            className="btn btn-icon btn-sm btn-text-secondary rounded-pill text-info"
                                                                            style={{ cursor: 'pointer', width: '38px', height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                            title="Edit Permission Group"
                                                                        >
                                                                            <i className="icon-base ri ri-edit-box-line fs-4"></i>
                                                                        </button>
                                                                    )}
                                                                    {(currentUser?.admin === 1 || myPermisions.includes('*') || myPermisions.includes('/permision/delete') || myPermisions.includes('/permision')) && (
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => openDeleteModal(permision)} 
                                                                            className="btn btn-icon btn-sm btn-text-secondary rounded-pill text-danger"
                                                                            style={{ cursor: 'pointer', width: '38px', height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                            title="Delete Permission Group"
                                                                        >
                                                                            <i className="icon-base ri ri-delete-bin-line fs-4"></i>
                                                                        </button>
                                                                    )}
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

            {/* View Modal Trigger & Modal */}
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
                                                                    <label className="form-check-label" htmlFor="userManagementRead"> View </label>
                                                                </div>
                                                                <div className="form-check mb-0 mt-1  me-4">
                                                                    <input className="form-check-input" type="checkbox" id="userManagementCreate" disabled={true} checked={routes.add_route && true} />
                                                                    <label className="form-check-label" htmlFor="userManagementCreate"> Create </label>
                                                                </div>
                                                                <div className="form-check mb-0 mt-1 me-4 me-lg-12">
                                                                    <input className="form-check-input" type="checkbox" id="userManagementWrite" disabled={true} checked={routes.edit_route && true} />
                                                                    <label className="form-check-label" htmlFor="userManagementWrite"> Edit </label>
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

            {/* Delete Confirmation Modal Trigger & Modal */}
            <button type="button" className="btn btn-primary d-none" id="deleteConfirmModalBtn" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal"></button>
            <div className="modal fade" id="deleteConfirmModal" tabIndex="-1" aria-hidden="true" role="dialog">
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
                    <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div className="modal-body text-center p-4 p-md-5">
                            <div className="avatar avatar-xl bg-label-danger mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '72px', height: '72px' }}>
                                <i className="icon-base ri ri-delete-bin-line text-danger" style={{ fontSize: '36px' }}></i>
                            </div>
                            <h4 className="fw-bold mb-2">Delete Permission Group?</h4>
                            <p className="text-muted mb-3">
                                Are you sure you want to delete <strong className="text-heading">"{selectedGroupToDelete?.name}"</strong>?
                            </p>
                            <div className="alert alert-danger text-start d-flex align-items-center gap-2 py-2 px-3 mb-4 rounded-3 small">
                                <i className="ri ri-error-warning-line fs-5 flex-shrink-0"></i>
                                <span>If this permission group is assigned to any staff/admin user, deletion will be blocked automatically.</span>
                            </div>
                            <div className="d-flex justify-content-center gap-3">
                                <button 
                                    type="button" 
                                    id="closeDeleteModalBtn"
                                    onClick={closeModalHelper}
                                    className="btn btn-outline-secondary px-4 rounded-pill" 
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={confirmDeletePermission}
                                    className="btn btn-danger px-4 rounded-pill d-flex align-items-center gap-2"
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri ri-delete-bin-line"></i>
                                            <span>Yes, Delete</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default page