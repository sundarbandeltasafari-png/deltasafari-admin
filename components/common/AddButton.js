"use client"

import Link from 'next/link'
import React from 'react'
import { useSelector } from 'react-redux';

function AddButton({ hrefPath, buttonName }) {
    const permisions = useSelector((state) => state.permision?.permisions);
    return (
        <>
            {permisions.includes(hrefPath) && 
                <div className="dt-buttons btn-group flex-wrap d-md-flex d-block gap-4 mb-md-0 mb-5 justify-content-center">
                    <Link href={hrefPath} className="btn add-new btn-primary" tabIndex="0" aria-controls="DataTables_Table_0" type="button">
                        <span>
                            <i className="icon-base ri ri-add-line icon-sm me-0 me-sm-2"></i>
                            <span className="d-none d-sm-inline-block">{buttonName}</span>
                        </span>
                    </Link>
                </div>
            }
        </>
    )
}

export default AddButton