'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import { getSundarbanSeoUrl, updateSundarbanSeoUrl } from '@/app/routes/sundarbanRoutes';

export default function SundarbanAllPageSeoPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [seoForm, setSeoForm] = useState({
        page_key: '',
        page_name: '',
        page_url: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        og_title: '',
        og_description: '',
        og_image: '',
        canonical_url: '',
        robots: 'index, follow'
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef(null);

    const fetchSeoPages = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosGet(getSundarbanSeoUrl, token);
            if (res && res.status) {
                setPages(res.pages || []);
            }
        } catch (err) {
            showMessage(err?.message || "Failed to load page SEO data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeoPages();
    }, [token]);

    const openEditModal = (page) => {
        setSelectedPage(page);
        setSeoForm({
            page_key: page.page_key || '',
            page_name: page.page_name || '',
            page_url: page.page_url || '',
            meta_title: page.meta_title || '',
            meta_description: page.meta_description || '',
            meta_keywords: page.meta_keywords || '',
            og_title: page.og_title || page.meta_title || '',
            og_description: page.og_description || page.meta_description || '',
            og_image: page.og_image || '',
            canonical_url: page.canonical_url || '',
            robots: page.robots || 'index, follow'
        });
        setSelectedFile(null);
        setPreviewUrl(getOgImageSource(page.og_image));
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(seoForm).forEach((key) => {
                if (seoForm[key] !== null && seoForm[key] !== undefined) {
                    data.append(key, seoForm[key]);
                }
            });

            if (selectedFile) {
                data.append('image', selectedFile);
            }

            const res = await axiosPost(updateSundarbanSeoUrl(seoForm.page_key), data, token, 'multipart/form-data');
            if (res && res.status) {
                showMessage(`SEO details for "${seoForm.page_name}" updated successfully!`, "success");
                setShowModal(false);
                fetchSeoPages();
            } else {
                showMessage(res?.msg || "Failed to update SEO settings", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Communication error with server", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const getOgImageSource = (img) => {
        if (!img) return '';
        if (img.startsWith('http')) return img;
        if (img.startsWith('uploads/')) return `http://localhost:3002/${img}`;
        return `http://localhost/sundarban-deltasafari/${img.replace(/^\/+/, '')}`;
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-search-eye-line text-success"></i>
                        <span>Manage All Page SEO Details</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Configure Meta Titles, Descriptions, Keywords, Canonical URLs, and Social Media Share cards for every page of the website.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : pages.length === 0 ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <i className="ri ri-file-search-line text-muted display-4 mb-3"></i>
                    <h5 className="text-dark fw-bold">No Pages Configured</h5>
                    <p className="text-muted small">Please run the website data migration to initialize page SEO records.</p>
                </div>
            ) : (
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0 fw-bold text-dark">Website Navigational Pages SEO</h5>
                            <small className="text-muted">Total {pages.length} core pages mapped with live Google &amp; Social tags.</small>
                        </div>
                    </div>
                    <div className="table-responsive text-nowrap">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '60px' }}>#</th>
                                    <th>Page Name</th>
                                    <th>URL Route</th>
                                    <th>Page Meta Title</th>
                                    <th>Meta Description</th>
                                    <th>Robots</th>
                                    <th className="text-center" style={{ width: '120px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pages.map((p, index) => (
                                    <tr key={p.id}>
                                        <td className="fw-bold text-muted">#{index + 1}</td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="p-2 rounded-2 bg-light text-success">
                                                    <i className="ri ri-global-line"></i>
                                                </div>
                                                <div>
                                                    <strong className="text-dark d-block">{p.page_name}</strong>
                                                    <span className="badge bg-secondary font-monospace" style={{ fontSize: '10px' }}>{p.page_key}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <code className="text-primary bg-light px-2 py-1 rounded">
                                                {p.page_url}
                                            </code>
                                        </td>
                                        <td style={{ whiteSpace: 'normal', maxWidth: '280px' }}>
                                            <div className="text-dark fw-semibold small">
                                                {p.meta_title || <span className="text-muted fst-italic">Default Site Title</span>}
                                            </div>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>
                                                {(p.meta_title || '').length} characters
                                            </small>
                                        </td>
                                        <td style={{ whiteSpace: 'normal', maxWidth: '320px' }}>
                                            <div className="text-muted small" style={{ fontSize: '12.5px', lineHeight: '1.4' }}>
                                                {p.meta_description ? (
                                                    p.meta_description.length > 100 ? `${p.meta_description.slice(0, 100)}...` : p.meta_description
                                                ) : (
                                                    <span className="text-muted fst-italic">No meta description set</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border">
                                                {p.robots || 'index, follow'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                onClick={() => openEditModal(p)}
                                                className="btn btn-sm btn-outline-success px-3 rounded-2 fw-semibold d-inline-flex align-items-center gap-1"
                                            >
                                                <i className="ri ri-edit-box-line"></i>
                                                <span>Edit SEO</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal for Editing Page SEO */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content rounded-4 border-0 shadow">
                            <div className="modal-header bg-white border-bottom py-3">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2 mb-0">
                                        <i className="ri ri-search-eye-line text-success"></i>
                                        <span>Configure SEO Details &bull; {seoForm.page_name}</span>
                                    </h5>
                                    <small className="text-muted">Target Route: <code>{seoForm.page_url}</code> (key: {seoForm.page_key})</small>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-close"
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="row g-4">
                                        {/* Left Column: Form Fields */}
                                        <div className="col-lg-7">
                                            <div className="card border rounded-3 p-3 mb-3 bg-light">
                                                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                                                    <i className="ri ri-google-fill text-danger"></i>
                                                    <span>Search Engine Metadata</span>
                                                </h6>

                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <label className="form-label small fw-semibold mb-0">Meta Title Tag</label>
                                                        <span className={`small ${(seoForm.meta_title || '').length > 60 ? 'text-warning' : 'text-muted'}`} style={{ fontSize: '11px' }}>
                                                            {(seoForm.meta_title || '').length} / 60 recommended
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={seoForm.meta_title || ''}
                                                        onChange={(e) => setSeoForm({ ...seoForm, meta_title: e.target.value })}
                                                        placeholder="Primary search engine title..."
                                                        required
                                                    />
                                                </div>

                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <label className="form-label small fw-semibold mb-0">Meta Description Summary</label>
                                                        <span className={`small ${(seoForm.meta_description || '').length > 160 ? 'text-warning' : 'text-muted'}`} style={{ fontSize: '11px' }}>
                                                            {(seoForm.meta_description || '').length} / 160 recommended
                                                        </span>
                                                    </div>
                                                    <textarea
                                                        rows="3"
                                                        className="form-control"
                                                        value={seoForm.meta_description || ''}
                                                        onChange={(e) => setSeoForm({ ...seoForm, meta_description: e.target.value })}
                                                        placeholder="Write a concise overview targeting search results clicks..."
                                                    ></textarea>
                                                </div>

                                                <div className="mb-0">
                                                    <label className="form-label small fw-semibold">Meta Keywords</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={seoForm.meta_keywords || ''}
                                                        onChange={(e) => setSeoForm({ ...seoForm, meta_keywords: e.target.value })}
                                                        placeholder="comma, separated, key, terms"
                                                    />
                                                </div>
                                            </div>

                                            <div className="card border rounded-3 p-3 bg-light">
                                                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                                                    <i className="ri ri-share-forward-fill text-primary"></i>
                                                    <span>OpenGraph (WhatsApp / Facebook Sharing)</span>
                                                </h6>

                                                <div className="mb-3">
                                                    <label className="form-label small fw-semibold">Social Share Title (og:title)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={seoForm.og_title || ''}
                                                        onChange={(e) => setSeoForm({ ...seoForm, og_title: e.target.value })}
                                                        placeholder="Title shown when link is shared..."
                                                    />
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label small fw-semibold">Social Share Description (og:description)</label>
                                                    <textarea
                                                        rows="2"
                                                        className="form-control form-control-sm"
                                                        value={seoForm.og_description || ''}
                                                        onChange={(e) => setSeoForm({ ...seoForm, og_description: e.target.value })}
                                                        placeholder="Short description for social cards..."
                                                    ></textarea>
                                                </div>

                                                <div className="row g-2">
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-semibold">Canonical URL</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            value={seoForm.canonical_url || ''}
                                                            onChange={(e) => setSeoForm({ ...seoForm, canonical_url: e.target.value })}
                                                            placeholder="https://sundarbandeltasafari.com/..."
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-semibold">Robots Directives</label>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={seoForm.robots || 'index, follow'}
                                                            onChange={(e) => setSeoForm({ ...seoForm, robots: e.target.value })}
                                                        >
                                                            <option value="index, follow">index, follow (Default - Recommended)</option>
                                                            <option value="noindex, follow">noindex, follow</option>
                                                            <option value="index, nofollow">index, nofollow</option>
                                                            <option value="noindex, nofollow">noindex, nofollow</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Previews & OG Image */}
                                        <div className="col-lg-5">
                                            {/* Google SERP Preview Box */}
                                            <div className="card border rounded-3 p-3 mb-3" style={{ backgroundColor: '#ffffff' }}>
                                                <span className="badge bg-light text-dark border mb-2 small">Google Search Preview</span>
                                                <div style={{ fontFamily: 'arial, sans-serif' }}>
                                                    <div className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: '12px', color: '#202124' }}>
                                                        <div className="rounded-circle bg-light border p-1" style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <img src="/images/favicon.png" alt="" style={{ width: '14px', height: '14px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                        </div>
                                                        <div className="text-truncate">
                                                            <span style={{ fontWeight: 500 }}>Sundarban Delta Safari</span>
                                                            <div className="text-muted" style={{ fontSize: '11px' }}>
                                                                https://sundarbandeltasafari.com{seoForm.page_url}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ color: '#1a0dab', fontSize: '18px', lineHeight: '1.3', fontWeight: 400, textDecoration: 'none', cursor: 'pointer' }} className="text-truncate">
                                                        {seoForm.meta_title || 'Sundarban Delta Safari | Official Eco Safari'}
                                                    </div>
                                                    <div style={{ color: '#4d5156', fontSize: '13px', lineHeight: '1.5', marginTop: '4px' }}>
                                                        {seoForm.meta_description || 'Book verified Sundarban safari tour packages, 1N/2D, 2N/3D, and custom houseboat trips with pick-up from Kolkata and Godkhali.'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Social Sharing Image Upload */}
                                            <div className="card border rounded-3 p-3 bg-light">
                                                <label className="form-label small fw-semibold">Social Preview Image (og:image)</label>
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="border border-2 border-dashed rounded-3 p-3 text-center cursor-pointer mb-2 d-flex flex-column align-items-center justify-content-center"
                                                    style={{ minHeight: '140px', backgroundColor: '#ffffff', cursor: 'pointer' }}
                                                >
                                                    {previewUrl ? (
                                                        <img
                                                            src={previewUrl}
                                                            alt="Preview"
                                                            style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px' }}
                                                        />
                                                    ) : (
                                                        <>
                                                            <i className="ri ri-image-2-line text-success fs-2 mb-1"></i>
                                                            <span className="fw-semibold small d-block">Upload OG Image (1200x630px)</span>
                                                            <small className="text-muted" style={{ fontSize: '11px' }}>For WhatsApp &amp; Facebook</small>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="d-none"
                                                    onChange={handleFileChange}
                                                />
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={seoForm.og_image || ''}
                                                    onChange={(e) => {
                                                        setSeoForm({ ...seoForm, og_image: e.target.value });
                                                        setPreviewUrl(e.target.value);
                                                    }}
                                                    placeholder="Or image URL: /images/..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light border-top py-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn btn-outline-secondary rounded-3"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn btn-success rounded-3 px-4 fw-bold d-inline-flex align-items-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm"></span>
                                                <span>Saving Changes...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-save-line"></i>
                                                <span>Save SEO Settings</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
