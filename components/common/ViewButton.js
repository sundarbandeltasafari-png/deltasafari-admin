"use client"

import { useRouter } from 'next/navigation';
import React from 'react'
import { useSelector } from 'react-redux';

function ViewButton({ hrefPath, viewPath }) {
    const route = useRouter();
    const permisions = useSelector((state) => state.permision?.permisions || []);
    const user = useSelector((state) => state.adminAuth?.user);

    const hasPermission = 
        user?.admin === 1 || 
        (Array.isArray(permisions) && (
            permisions.includes('*') || 
            (viewPath && permisions.includes(viewPath)) || 
            (hrefPath && permisions.includes(hrefPath))
        ));

    if (!hasPermission) return null;

    return (
        <a 
            onClick={() => { route.push(hrefPath) }} 
            className="btn btn-icon btn-sm btn-text-secondary rounded-pill text-primary"
            style={{ cursor: 'pointer', width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            title="View Details"
        >
            <i className="icon-base ri ri-eye-line fs-4"></i>
        </a>
    );
}

export default ViewButton;