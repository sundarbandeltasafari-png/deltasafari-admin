"use client"

import Link from 'next/link'
import React from 'react'
import { useSelector } from 'react-redux';

function AddButton({ hrefPath, buttonName }) {
    const permisions = useSelector((state) => state.permision?.permisions || []);
    const user = useSelector((state) => state.adminAuth?.user);

    const basePath = hrefPath ? hrefPath.replace(/\/add.*$/, '') : '';
    const hasPermission = 
        user?.admin === 1 || 
        (Array.isArray(permisions) && (
            permisions.includes('*') || 
            permisions.includes(hrefPath) || 
            (basePath && permisions.includes(basePath))
        ));

    if (!hasPermission) return null;

    return (
        <div className="dt-buttons btn-group flex-wrap d-md-flex d-block gap-4 mb-md-0 mb-2 justify-content-center">
            <Link href={hrefPath} className="btn add-new btn-primary d-flex align-items-center gap-2" type="button">
                <i className="icon-base ri ri-add-line icon-sm"></i>
                <span className="d-none d-sm-inline-block fw-medium">{buttonName}</span>
            </Link>
        </div>
    );
}

export default AddButton;