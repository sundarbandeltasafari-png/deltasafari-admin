"use client"
import { showMessage } from '@/libs/commonHelper';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import qs from 'qs';
import { createPermisionUrl, getMainPermisionRouteUrl } from '@/app/routes/premisionRoute';
import { useRouter } from 'next/navigation';

const defaultSidebarRoutes = [
    { id: 1, name: 'Dashboards', route: '/dashboard' },
    { id: 3, name: 'Cities', route: '/cities' },
    { id: 4, name: 'Package', route: '/package' },
    { id: 5, name: 'Hotels', route: '/hotels' },
    { id: 6, name: 'Calendar', route: '/calendar' },
    { id: 7, name: 'Bookings', route: '/bookings' },
    { id: 8, name: 'Corporate Lead', route: '/corporate-lead' },
    { id: 9, name: 'Custom Package', route: '/custom-package' },
    { id: 10, name: 'Website Settings', route: '/websitesettings' },
    { id: 11, name: 'General Settings', route: '/generalsettings' },
    { id: 12, name: 'FAQ Pages', route: '/faqpages' },
    { id: 13, name: 'SEO Pages', route: '/seopages' },
    { id: 14, name: 'Common Pages', route: '/commonpages' },
    { id: 15, name: 'Contacts', route: '/contacts' },
    { id: 18, name: 'Users', route: '/users' },
    { id: 19, name: 'Permision Group', route: '/permision' },
    { id: 20, name: 'Admin Users', route: '/adminusers' },
    { id: 21, name: 'Referral Program', route: '/referrals' }
];

const isExcludedPermission = (name = '', route = '') => {
    const n = name.toLowerCase().trim();
    const r = route.toLowerCase().trim();
    return (
        n.includes('crm') || 
        n.includes('whatsapp') || 
        n.includes('news') || 
        n.includes('blog') || 
        n.includes('reporter') || 
        n.includes('zone') || 
        n.includes('destination') ||
        r.includes('crm') || 
        r.includes('whatsapp') || 
        r.includes('news') || 
        r.includes('reporter') || 
        r.includes('zone')
    );
};

function page() {
    const [allPermisions, setAllPermisions] = useState(defaultSidebarRoutes);
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
            let list = [...defaultSidebarRoutes];
            if (permision?.status && Array.isArray(permision.routes) && permision.routes.length > 0) {
                // Filter out CRM, News, News Category, Reporters, Zone
                const apiRoutes = permision.routes.filter(r => !isExcludedPermission(r.name, r.route));
                const merged = [...apiRoutes];
                const apiNames = apiRoutes.map(r => (r.name || '').toLowerCase().trim());
                defaultSidebarRoutes.forEach(def => {
                    if (!apiNames.includes(def.name.toLowerCase().trim())) {
                        merged.push(def);
                    }
                });
                list = merged;
            }
            setAllPermisions(list);
        }).catch((err) => {
            console.log("Using default sidebar routes for permissions:", err.message);
            setAllPermisions(defaultSidebarRoutes);
        })
    }, []);

    // Global Select All
    function handleSelectAll(e) {
        const checked = e.target.checked;
        Array.from(document.querySelectorAll('.perm-checkbox')).forEach((input) => { 
            input.checked = checked; 
        });
        Array.from(document.querySelectorAll('.row-select-all')).forEach((input) => { 
            input.checked = checked; 
        });
        const selectAllRead = document.getElementById('selectAllRead');
        if (selectAllRead) selectAllRead.checked = checked;
        const selectAllCreate = document.getElementById('selectAllCreate');
        if (selectAllCreate) selectAllCreate.checked = checked;
        const selectAllEdit = document.getElementById('selectAllEdit');
        if (selectAllEdit) selectAllEdit.checked = checked;
    }

    // Column-level Select All (Read / Create / Edit)
    function handleColumnSelectAll(columnType, e) {
        const checked = e.target.checked;
        Array.from(document.querySelectorAll(`.perm-${columnType}`)).forEach((input) => { 
            input.checked = checked; 
        });
        allPermisions.forEach((_, index) => {
            updateRowSelectAllState(index);
        });
    }

    // Row-level Select All (Read, Create, Edit for a single module in one select)
    function handleRowSelectAll(index, e) {
        const checked = e.target.checked;
        const readInput = document.getElementById(`userManagementRead_${index}`);
        const createInput = document.getElementById(`userManagementCreate_${index}`);
        const editInput = document.getElementById(`userManagementEdit_${index}`);
        if (readInput) readInput.checked = checked;
        if (createInput) createInput.checked = checked;
        if (editInput) editInput.checked = checked;
    }

    // When an individual checkbox changes, update the row's "Select All" checkbox
    function handleIndividualChange(index) {
        updateRowSelectAllState(index);
    }

    function updateRowSelectAllState(index) {
        const readInput = document.getElementById(`userManagementRead_${index}`);
        const createInput = document.getElementById(`userManagementCreate_${index}`);
        const editInput = document.getElementById(`userManagementEdit_${index}`);
        const rowSelectAll = document.getElementById(`rowSelectAll_${index}`);
        if (rowSelectAll && readInput && createInput && editInput) {
            rowSelectAll.checked = readInput.checked && createInput.checked && editInput.checked;
        }
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
                    if (response.data?.status || response.status === 200) {
                        showMessage("success", "Permission group created successfully!");
                        route.push("/permision");
                    } else {
                        showMessage("error", response.data?.msg || "Something went wrong please try again later.");
                    }
                } catch (error) {
                    const errMsg = error.response?.data?.msg || error.message;
                    showMessage('error', `Submission failed: ${errMsg}`);
                    setPosting(false);
                }
            } else {
                showMessage("error", "Please provide a Group Name and select at least one permission.");
            }
        } else {
            showMessage("error", "We are saving your permission group...");
        }
    }

    return (
        <>
            <div className='content-wrapper'>
                <div className='container-xxl flex-grow-1 container-p-y'>
                    <div className="card p-4">
                        <div className="text-start mb-6">
                            <h4 className="role-title mb-2 pb-0">Add New Permision Group</h4>
                            <p className="text-muted small">Configure role permissions and access levels for administrators.</p>
                        </div>
                        <form id="addRoleForm" className="row g-3 fv-plugins-bootstrap5 fv-plugins-framework" onSubmit={handleSubmit}>
                            <div className="col-md-4 form-control-validation mb-3 fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
                                <div className="form-floating form-floating-outline">
                                    <input type="text" id="group_name" name="group_name" className="form-control" placeholder="Enter a group name" required />
                                    <label htmlFor="group_name">Group Name</label>
                                </div>
                                <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
                            </div>
                            <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                                    <h5 className="mb-0">Role Permissions</h5>
                                    <span className="badge bg-label-primary px-3 py-2">
                                        <i className="ri ri-checkbox-multiple-line me-1"></i> You can select individual actions or use "Select All (Read, Create, Edit)" per module
                                    </span>
                                </div>
                                <div className="table-responsive border rounded-3">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4" style={{ minWidth: '220px' }}>
                                                    <span className="fw-bold text-heading">Module / Feature</span>
                                                </th>
                                                <th className="text-center" style={{ minWidth: '150px' }}>
                                                    <div className="form-check form-check-inline m-0">
                                                        <input className="form-check-input" type="checkbox" id="selectAll" onChange={handleSelectAll} />
                                                        <label className="form-check-label fw-bold text-primary" htmlFor="selectAll">
                                                            Select All Modules
                                                        </label>
                                                    </div>
                                                </th>
                                                <th className="text-center" style={{ width: '120px' }}>
                                                    <div className="form-check form-check-inline m-0">
                                                        <input className="form-check-input" type="checkbox" id="selectAllRead" onChange={(e) => handleColumnSelectAll('read', e)} />
                                                        <label className="form-check-label fw-semibold text-heading" htmlFor="selectAllRead">All Read</label>
                                                    </div>
                                                </th>
                                                <th className="text-center" style={{ width: '120px' }}>
                                                    <div className="form-check form-check-inline m-0">
                                                        <input className="form-check-input" type="checkbox" id="selectAllCreate" onChange={(e) => handleColumnSelectAll('create', e)} />
                                                        <label className="form-check-label fw-semibold text-heading" htmlFor="selectAllCreate">All Create</label>
                                                    </div>
                                                </th>
                                                <th className="text-center pe-4" style={{ width: '130px' }}>
                                                    <div className="form-check form-check-inline m-0">
                                                        <input className="form-check-input" type="checkbox" id="selectAllEdit" onChange={(e) => handleColumnSelectAll('edit', e)} />
                                                        <label className="form-check-label fw-semibold text-heading" htmlFor="selectAllEdit">All Edit</label>
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allPermisions.length > 0 &&
                                                allPermisions.map((routes, index) => {
                                                    return (
                                                        <tr key={index}>
                                                            <td className="ps-4 text-nowrap fw-medium text-heading">
                                                                <i className="ri ri-checkbox-blank-circle-fill text-primary me-2" style={{ fontSize: '8px' }}></i>
                                                                {routes.name}
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="form-check form-check-inline m-0">
                                                                    <input 
                                                                        className="form-check-input row-select-all" 
                                                                        type="checkbox" 
                                                                        id={`rowSelectAll_${index}`} 
                                                                        onChange={(e) => handleRowSelectAll(index, e)} 
                                                                    />
                                                                    <label className="form-check-label small fw-semibold text-primary" htmlFor={`rowSelectAll_${index}`}>
                                                                        All (Read, Create, Edit)
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="form-check form-check-inline m-0">
                                                                    <input 
                                                                        className="form-check-input perm-checkbox perm-read" 
                                                                        type="checkbox" 
                                                                        name={`route['${routes.id}']['1'][]`} 
                                                                        id={`userManagementRead_${index}`} 
                                                                        onChange={() => handleIndividualChange(index)} 
                                                                    />
                                                                    <label className="form-check-label small" htmlFor={`userManagementRead_${index}`}>Read</label>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="form-check form-check-inline m-0">
                                                                    <input 
                                                                        className="form-check-input perm-checkbox perm-create" 
                                                                        type="checkbox" 
                                                                        name={`route['${routes.id}']['2'][]`} 
                                                                        id={`userManagementCreate_${index}`} 
                                                                        onChange={() => handleIndividualChange(index)} 
                                                                    />
                                                                    <label className="form-check-label small" htmlFor={`userManagementCreate_${index}`}>Create</label>
                                                                </div>
                                                            </td>
                                                            <td className="text-center pe-4">
                                                                <div className="form-check form-check-inline m-0">
                                                                    <input 
                                                                        className="form-check-input perm-checkbox perm-edit" 
                                                                        type="checkbox" 
                                                                        name={`route['${routes.id}']['3'][]`} 
                                                                        id={`userManagementEdit_${index}`} 
                                                                        onChange={() => handleIndividualChange(index)} 
                                                                    />
                                                                    <label className="form-check-label small" htmlFor={`userManagementEdit_${index}`}>Edit</label>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="col-12 text-center d-flex gap-3 justify-content-end mt-4">
                                <button type="button" onClick={() => route.push('/permision')} className="btn btn-outline-secondary waves-effect">
                                    Cancel
                                </button>
                                <button type="submit" disabled={posting} className="btn btn-primary me-3 waves-effect waves-light d-flex align-items-center gap-2">
                                    {posting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri ri-save-line"></i>
                                            <span>Save Permission Group</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default page