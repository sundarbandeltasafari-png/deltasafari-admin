"use client"
import { showMessage } from '@/libs/commonHelper';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import qs from 'qs';
import { editPermisionUrl, getMainPermisionRouteUrl, getParticularPermisionUrl } from '@/app/routes/premisionRoute';
import { useRouter, useSearchParams } from 'next/navigation';
import Loading from '@/components/common/Loading';
import { urlDecode } from '@/libs/urlHelper';

function page() {
    const [combinePermision, setCombinePermision] = useState(null);
    const [loading, setLoading] = useState(true)
    const [posting, setPosting] = useState(false);
    const token = useSelector((state) => state.adminAuth?.token);
    const route = useRouter();
    const searchParams = useSearchParams()
    const permisionId = searchParams.get('id');
    if (!permisionId) {
        route.push('/permision');
        return;
    }


    async function getPermisionRoute() {
        const response = await axios.get(getMainPermisionRouteUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });
        return response.data;
    }

    async function getPerticularPermision() {
        const response = await axios.get(`${getParticularPermisionUrl}?id=${permisionId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });
        return response.data;
    }

    useEffect(() => {
        setLoading(true)
        getPermisionRoute().then((permision) => {
            if (permision.status) {
                getPerticularPermision().then((res) => {
                    if (res.status) {
                        const proutes = JSON.parse(res.permision?.routes);
                        const combined = permision.routes.map(module => {
                            const match = proutes.find(r => r.route_name == module.id);
                            const permissions = match ? {
                                view: match.view_route,
                                add: match.add_route,
                                edit: match.edit_route
                            } : {}
                            return {
                                ...module,
                                ...permissions
                            };
                        });
                        setCombinePermision({ id: res.permision?.id, name: res.permision?.name, routes: combined });
                    } else {
                        showMessage("Something went wrong, Please try again later")
                    }
                    setLoading(false)
                }).catch((err) => {
                    showMessage("Something went wrong " + err.message)
                    setLoading(false)
                })
            } else {
                showMessage("Something went wrong, Please try again later")
            }
        }).catch((err) => {
            showMessage("Something went wrong " + err.message)
        })
    }, []);

    function handleSelectAll(e) {
        Array.from(document.getElementsByClassName('form-check-input')).forEach((input) => { input.checked = e.target.checked })
    }



    async function handleSubmit(event) {
        event.preventDefault();
        if (posting) {
            return;
        }
        const formData = new FormData(event.currentTarget);
        const queryString = new URLSearchParams(formData).toString();
        const obj = qs.parse(queryString);
        if (!posting) {
            if (obj.group_name && obj.route) {
                obj.permision_id = urlDecode(permisionId);
                setPosting(true);
                try {
                    const response = await axios.put(editPermisionUrl, obj, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    setPosting(false);
                    if (response.status) {
                        route.push("/permision")
                    } else {
                        showMessage("error", "Something went wrong please try again later.")
                    }
                } catch (error) {
                    showMessage('error', `Submission failed ${error}`);
                    setPosting(false);
                }
            } else {
                showMessage("error", "Please update all fields to create a post.")
            }
        } else {
            showMessage("error", "We are uploading your post...")
        }
    }

    return (
        <>
            <div className='content-wrapper'>
                {loading ?
                    <div className='d-flex justify-content-center align-items-center h-100 w-100'>
                        <div className='d-flex' style={{ height: 100, width: 100 }}>
                            <Loading />
                        </div>
                    </div>
                    :
                    <div className='container-xxl flex-grow-1 container-p-y'>
                        {combinePermision && <div className="card p-4">
                            <div className="text-start mb-6">
                                <h4 className="role-title mb-2 pb-0">Edit Permision Group</h4>
                                <p>Set role permissions</p>
                            </div>
                            <form id="addRoleForm" className="row g-3 fv-plugins-bootstrap5 fv-plugins-framework" onSubmit={handleSubmit}>
                                <div className="col-md-4 form-control-validation mb-3 fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
                                    <div className="form-floating form-floating-outline">
                                        <input type="text" id="group_name" name="group_name" defaultValue={combinePermision?.name} className="form-control" placeholder="Enter a group name" />
                                        <label htmlFor="group_name">Group Name</label>
                                    </div>
                                    <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div></div>
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
                                                    <td>
                                                        <div className="d-flex justify-content-end">
                                                            <div className="form-check mb-0 mt-1">
                                                                <input className="form-check-input" type="checkbox" id="selectAll" onChange={handleSelectAll} />
                                                                <label className="form-check-label" htmlFor="selectAll"> Select All </label>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {
                                                    combinePermision?.routes.length > 0 &&
                                                    combinePermision?.routes.map((routes, index) => {
                                                        return <tr key={index}>
                                                            <td className="text-nowrap fw-medium">{routes.name}</td>
                                                            <td>
                                                                <div className="d-flex justify-content-end">
                                                                    <div className="form-check mb-0 mt-1 me-4 me-lg-12">
                                                                        <input className="form-check-input" type="checkbox" name={`route['${routes.id}']['1'][]`} id={`userManagementRead_${index}`} defaultChecked={routes?.view} />
                                                                        <label className="form-check-label" htmlFor={`userManagementRead_${index}`}> Read </label>
                                                                    </div>
                                                                    <div className="form-check mb-0 mt-1 me-4 me-lg-12">
                                                                        <input className="form-check-input" type="checkbox" name={`route['${routes.id}']['2'][]`} id={`userManagementCreate_${index}`} defaultChecked={routes?.add} />
                                                                        <label className="form-check-label" htmlFor={`userManagementCreate_${index}`}> Create </label>
                                                                    </div>
                                                                    <div className="form-check mb-0 mt-1">
                                                                        <input className="form-check-input" type="checkbox" name={`route['${routes.id}']['3'][]`} id={`userManagementEdit_${index}`} defaultChecked={routes?.edit} />
                                                                        <label className="form-check-label" htmlFor={`userManagementEdit_${index}`}> Edit </label>
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
                                <div className="col-12 text-center d-flex gap-3 justify-content-end">
                                    <button type="reset" className="btn btn-outline-secondary waves-effect" data-bs-dismiss="modal" aria-label="Close">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary me-3 waves-effect waves-light">Submit</button>
                                </div>
                                <input type="hidden" /></form>
                        </div>}
                    </div>}
            </div>
        </>
    )
}

export default page