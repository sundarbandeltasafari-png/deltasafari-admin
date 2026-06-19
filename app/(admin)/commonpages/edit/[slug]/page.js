"use client"

import { createCommonPageUrl, getCommonPageUrl } from "@/app/routes/pagesRoute";
import EditorTinyMCE from "@/components/blogs/EditorTinyMCE";
import LoadingComponent from "@/components/common/LoadingComponent";
import { axiosPost, axiosPut } from "@/libs/axiosHelper";
import { showMessage } from "@/libs/commonHelper";
import { urlDecode } from "@/libs/urlHelper";
import { Editor } from "@tinymce/tinymce-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";

export default function PrivacyPolicyAdmin() {
    const params = useParams();
    const pageId = params?.slug
    if (!pageId) {
        redirect('/commonpages');
    }
    const token = useSelector((state) => state.adminAuth?.token);
    const route = useRouter();
    const [newPolicy, setNewPolicy] = useState({ title: '', content: '', display_order: '0' });
    const [loading, setLoading] = useState(true)
    const [notice, setNotice] = useState({ show: false, text: '', type: 'success' });

    const API_URL = 'http://localhost:5000/api/privacy-policy';

    useEffect(() => {
        axiosPost(getCommonPageUrl, { page_id: urlDecode(pageId) }, token).then((res) => {
            if (res.status && res?.commonpage) {
                setNewPolicy({ ...res?.commonpage, page_id: pageId })
                setLoading(false)
            } else {
                showMessage(res.msg, "error")
            }
        }).catch((err) => {
            showMessage(err.message)
        })
    }, []);


    const triggerNotice = (text, type) => {
        setNotice({ show: true, text, type });
        setTimeout(() => setNotice({ show: false, text: '', type: 'success' }), 4000);
    };

    const handleAddPolicy = async (e) => {
        e.preventDefault();
        axiosPut(createCommonPageUrl, newPolicy, token).then((res) => {
            if (res.status) {
                route.push('/commonpages')
                showMessage(res?.msg, 'success')
            } else {
                showMessage(res?.msg)
            }
        }).catch((err) => {
            showMessage(err.message)
        })
    };


    return (
        <div className="container-fluid px-4 py-4">

            {/* Header Container Area matching theme */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h4 className="mb-1 fw-semibold text-dark">Common Pages Workspace</h4>
                    <p className="text-muted mb-0 small">Add, modify, or deprecate corporate legal statement disclosure nodes.</p>
                </div>
            </div>

            {/* Notice Feed Banner Block */}
            {notice.show && (
                <div className={`alert alert-${notice.type} alert-dismissible fade show border-0 shadow-sm mb-4`} role="alert">
                    <div className="d-flex align-items-center">
                        <span className="me-2 font-medium small">{notice.text}</span>
                    </div>
                    <button type="button" className="btn-close shadow-none" onClick={() => setNotice({ ...notice, show: false })} aria-label="Close"></button>
                </div>
            )}

            <div className="row g-4">

                {/* Left Side: Create / Input Segment Node Form */}
                {loading ?
                    <LoadingComponent />
                    :
                    <div className="col-12 col-lg-12">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-transparent border-light py-3">
                                <h5 className="card-title mb-0 fw-semibold text-dark">Create Policy Segment</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleAddPolicy} className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label text-muted fw-medium small mb-1">Section Header Title</label>
                                        <input type="text" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                            placeholder="e.g., Information Sharing Protocols"
                                            value={newPolicy.title} onChange={e => setNewPolicy({ ...newPolicy, title: e.target.value })} required />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label text-muted fw-medium small mb-1">Display Index Rank Weight</label>
                                        <input type="number" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                            value={newPolicy.display_order} onChange={e => setNewPolicy({ ...newPolicy, display_order: e.target.value })} required />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label text-muted fw-medium small mb-1">Policy Content Body</label>
                                        <EditorTinyMCE value={newPolicy.content} handleEditorChange={(content) => { setNewPolicy({ ...newPolicy, content: content }) }} />
                                    </div>

                                    <div className="col-12 pt-2">
                                        <button type="submit" className="btn btn-primary btn-sm w-100 py-2 fw-medium shadow-sm border-0">
                                            Publish Legal Element
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>}

            </div>

        </div>
    );
}