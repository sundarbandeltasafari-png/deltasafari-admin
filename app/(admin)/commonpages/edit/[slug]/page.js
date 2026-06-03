"use client"

import { Editor } from "@tinymce/tinymce-react";
import React, { useState, useEffect } from 'react';

export default function PrivacyPolicyAdmin() {
    const [policies, setPolicies] = useState([]);
    const [newPolicy, setNewPolicy] = useState({ section_title: '', section_content: '', display_order: '0' });
    const [notice, setNotice] = useState({ show: false, text: '', type: 'success' });

    const API_URL = 'http://localhost:5000/api/privacy-policy';

    useEffect(() => {
        
    }, []);


    const triggerNotice = (text, type) => {
        setNotice({ show: true, text, type });
        setTimeout(() => setNotice({ show: false, text: '', type: 'success' }), 4000);
    };

    const handleAddPolicy = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPolicy)
            });
            if (res.ok) {
                triggerNotice('New privacy content module appended successfully.', 'success');
                setNewPolicy({ section_title: '', section_content: '', display_order: '0' });
                fetchPolicies();
            }
        } catch (err) {
            triggerNotice('Error executing write stream configuration to database.', 'danger');
        }
    };

    const handleDeletePolicy = async (id) => {
        if (!window.confirm('Are you certain you want to purge this structural policy block?')) return;
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                triggerNotice('Policy block dropped from current view parameters.', 'warning');
                fetchPolicies();
            }
        } catch (err) {
            triggerNotice('Error executing element structural deletion macro.', 'danger');
        }
    };

    const editorConfig = {
        height: 180,
        menubar: false,
        plugins: ['lists', 'link', 'code', 'wordcount'],
        toolbar: 'undo redo | bold italic | bullist numlist | removeformat'
    };

    return (
        <div className="container-fluid px-4 py-4">

            {/* Header Container Area matching theme */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h4 className="mb-1 fw-semibold text-dark">Privacy Policy Workspace</h4>
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
                                        value={newPolicy.section_title} onChange={e => setNewPolicy({ ...newPolicy, section_title: e.target.value })} required />
                                </div>

                                <div className="col-12">
                                    <label className="form-label text-muted fw-medium small mb-1">Display Index Rank Weight</label>
                                    <input type="number" className="form-control form-control-sm bg-light-subtle border-secondary-subtle py-2 shadow-none"
                                        value={newPolicy.display_order} onChange={e => setNewPolicy({ ...newPolicy, display_order: e.target.value })} required />
                                </div>

                                <div className="col-12">
                                    <label className="form-label text-muted fw-medium small mb-1">Policy Content Body</label>
                                    <Editor
                                        apiKey={process.env.NEXT_PUBLIC_TinyMCE_API}
                                        value={newPolicy.section_content}
                                        init={editorConfig}
                                        onEditorChange={(content) => setNewPolicy({ ...newPolicy, section_content: content})}
                                    />
                                </div>

                                <div className="col-12 pt-2">
                                    <button type="submit" className="btn btn-primary btn-sm w-100 py-2 fw-medium shadow-sm border-0">
                                        Publish Legal Element
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}