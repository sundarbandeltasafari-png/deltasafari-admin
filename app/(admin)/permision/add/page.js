"use client"
import { showMessage } from '@/libs/commonHelper';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import qs from 'qs';
import { createPermisionUrl, getMainPermisionRouteUrl } from '@/app/routes/premisionRoute';
import { useRouter } from 'next/navigation';

function page() {
    const [allPermisions, setAllPermisions] = useState([]);
    const [posting, setPosting] = useState(false);
    const token = useSelector((state) => state.adminAuth?.token);
    const route = useRouter();
    async function getPermisionRoute() {
        const response = await axios.get(getMainPermisionRouteUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });
        return response.data;
    }

    useEffect(() => {
        getPermisionRoute().then((permision) => {
            if (permision.status) {
                setAllPermisions(permision.routes);
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
        if(posting){
            return;
        }
        const formData = new FormData(event.currentTarget);
        const queryString = new URLSearchParams(formData).toString();
        const obj = qs.parse(queryString);
        if (!posting) {
            if (obj.group_name && obj.route) {
                setPosting(true);
                try {
                    const response = await axios.post(createPermisionUrl, obj, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    setPosting(false);
                    if (response.status) {
                        route.push("/permisions")
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
                <div className='container-xxl flex-grow-1 container-p-y'>
                    <div className="card p-4">
                        <div className="text-start mb-6">
                            <h4 className="role-title mb-2 pb-0">Add New Permision Group</h4>
                            <p>Set role permissions</p>
                        </div>
                        <form id="addRoleForm" className="row g-3 fv-plugins-bootstrap5 fv-plugins-framework" onSubmit={handleSubmit}>
                            <div className="col-md-4 form-control-validation mb-3 fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
                                <div className="form-floating form-floating-outline">
                                    <input type="text" id="group_name" name="group_name" className="form-control" placeholder="Enter a group name" />
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
                                                allPermisions.length > 0 &&
                                                allPermisions.map((routes, index) => {
                                                    return <tr key={index}>
                                                        <td className="text-nowrap fw-medium">{routes.name}</td>
                                                        <td>
                                                            <div className="d-flex justify-content-end">
                                                                <div className="form-check mb-0 mt-1 me-4 me-lg-12">
                                                                    <input className="form-check-input" type="checkbox" name={`route['${routes.id}']['1'][]`} id={`userManagementRead_${index}`} />
                                                                    <label className="form-check-label" htmlFor={`userManagementRead_${index}`}> Read </label>
                                                                </div>
                                                                <div className="form-check mb-0 mt-1 me-4 me-lg-12">
                                                                    <input className="form-check-input" type="checkbox" name={`route['${routes.id}']['2'][]`} id={`userManagementCreate_${index}`} />
                                                                    <label className="form-check-label" htmlFor={`userManagementCreate_${index}`}> Create </label>
                                                                </div>
                                                                <div className="form-check mb-0 mt-1">
                                                                    <input className="form-check-input" type="checkbox" name={`route['${routes.id}']['3'][]`} id={`userManagementEdit_${index}`} />
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
                    </div>
                </div>
            </div>
        </>
    )
}

export default page