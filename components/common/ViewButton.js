"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation';
import React from 'react'
import { useSelector } from 'react-redux';

function ViewButton({hrefPath, viewPath}) {
    const route = useRouter()
    const permisions = useSelector((state) => state.permision?.permisions);
    return (
        <>
            {permisions.includes(viewPath) && <a onClick={()=> {route.push(hrefPath)}} className="btn btn-icon btn-text-secondary rounded-pill">
                <i className="icon-base ri ri-eye-line icon-md"></i>
            </a>}
        </>
    )
}

export default ViewButton