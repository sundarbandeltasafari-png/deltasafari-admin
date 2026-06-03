"use client"
import { getAllPagesUrl } from '@/app/routes/settingsRoutes';
import LoadingComponent from '@/components/common/LoadingComponent';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const page = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = useSelector((state) => state.adminAuth?.token);
    const route = useRouter();

    function onEditFaq(page) {
        route.push('seopages/edit/'+urlEncode(page?.id))
    }

    useEffect(() => {
        axiosPost(getAllPagesUrl, { type: 1 }, token).then((res) => {
            if (res?.status) {
                setPages(res?.pages)
                setLoading(false)
            }
        }).catch((err) => {
            showMessage(err.message)
        })
    }, []);

    return (
        <div className="container my-5" style={{ fontFamily: "'Public Sans', sans-serif" }}>
            <div className="card shadow-sm border-0 rounded-3">
                <div className="card-header bg-white py-3 border-bottom">
                    <h5 className="mb-0 fw-semibold text-dark">Website Navigational Pages</h5>
                </div>
                {loading ?
                    <LoadingComponent />
                    :
                    <div className="table-responsive text-nowrap">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th># ID</th>
                                    <th>Page Name</th>
                                    <th>URL Slug</th>
                                    <th>Status</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="table-border-bottom-0">
                                {pages.map((page) => (
                                    <tr key={page.id}>
                                        <td><strong>#{page.id}</strong></td>
                                        <td>
                                            <i className={`${page.icon_class} me-2 text-primary fs-5`}></i>
                                            <span className="fw-medium">{page.page_name}</span>
                                        </td>
                                        <td><code>/{page.slug}</code></td>
                                        <td>
                                            <span className={`badge ${page.is_active ? 'bg-label-success text-success bg-light' : 'bg-label-danger text-danger bg-light'} p-2`}>
                                                {page.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                onClick={() => onEditFaq(page)}
                                                className="btn btn-sm btn-outline-primary px-3 rounded-2"
                                                style={{ borderColor: '#696cff', color: '#696cff' }}
                                            >
                                                <i className="bi bi-pencil-square me-1"></i> Edit SEO
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                }
            </div>
        </div>
    );
};

export default page;