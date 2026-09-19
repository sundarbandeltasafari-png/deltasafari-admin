'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import {
    getSundarbanBrandingUrl,
    updateSundarbanBrandingUrl,
    uploadSundarbanImageUrl
} from '@/app/routes/sundarbanRoutes';

export default function SundarbanBrandingPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingField, setUploadingField] = useState(null);

    const [branding, setBranding] = useState({
        site_title: 'Sundarban Delta Safari - Premier Wildlife & Boat Safaris',
        tagline: 'Experience the Wild Majesty of Royal Bengal Tigers & Mangrove Waters',
        header_logo: '',
        footer_logo: '',
        mobile_logo: '',
        favicon: '',
        apple_touch_icon: ''
    });

    const fileInputRefs = {
        header_logo: useRef(null),
        footer_logo: useRef(null),
        mobile_logo: useRef(null),
        favicon: useRef(null),
        apple_touch_icon: useRef(null)
    };

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002/';

    const getFullImageUrl = (path, fallback = '') => {
        if (!path) return fallback;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        return `${serverUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    };

    const fetchBranding = async () => {
        try {
            setLoading(true);
            const res = await axiosGet(getSundarbanBrandingUrl, token);
            if (res && res.status && res.branding) {
                setBranding((prev) => ({
                    ...prev,
                    ...res.branding
                }));
            }
        } catch (err) {
            console.error('Error fetching branding:', err);
            showMessage('danger', err.message || 'Failed to load branding data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchBranding();
        }
    }, [token]);

    const handleFileUpload = async (field, file) => {
        if (!file) return;
        setUploadingField(field);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await axiosPost(uploadSundarbanImageUrl, formData, token);
            if (res && res.status && res.path) {
                setBranding((prev) => ({
                    ...prev,
                    [field]: res.path
                }));
                showMessage('success', `${field.replace('_', ' ').toUpperCase()} uploaded successfully!`);
            } else {
                showMessage('danger', res?.msg || 'Failed to upload image.');
            }
        } catch (err) {
            console.error(`Upload error for ${field}:`, err);
            showMessage('danger', err.message || 'Image upload failed.');
        } finally {
            setUploadingField(null);
        }
    };

    const handleClearField = (field) => {
        setBranding((prev) => ({
            ...prev,
            [field]: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axiosPost(updateSundarbanBrandingUrl, branding, token);
            if (res && res.status) {
                showMessage('success', 'Website logo, favicon & branding updated successfully!');
            } else {
                showMessage('danger', res?.msg || 'Failed to update branding.');
            }
        } catch (err) {
            console.error('Update branding error:', err);
            showMessage('danger', err.message || 'Failed to save branding.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Page Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <i className="ri ri-image-edit-line text-warning"></i>
                        <span>Website Logo &amp; Favicon Manager</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Upload and manage main desktop header logo, mobile navigation logo, dark footer logo, browser tab favicon, and mobile touch icon.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <a
                        href="http://localhost/sundarban-deltasafari"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1 rounded-3"
                    >
                        <i className="ri ri-external-link-line"></i>
                        <span>Preview Live Website</span>
                    </a>
                </div>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* SECTION 1: Brand Titles */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                <i className="ri ri-font-size-2 text-primary"></i>
                                <span>Site Title &amp; Tagline</span>
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Official Site Title</label>
                                    <input
                                        type="text"
                                        className="form-control rounded-3"
                                        placeholder="e.g. Sundarban Delta Safari - Premier Wildlife & Boat Safaris"
                                        value={branding.site_title || ''}
                                        onChange={(e) => setBranding({ ...branding, site_title: e.target.value })}
                                    />
                                    <small className="text-muted">Used for image alt tags, browser tab title, and search engine results.</small>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Brand Tagline</label>
                                    <input
                                        type="text"
                                        className="form-control rounded-3"
                                        placeholder="e.g. Experience the Wild Majesty of Royal Bengal Tigers"
                                        value={branding.tagline || ''}
                                        onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                                    />
                                    <small className="text-muted">Used in header subtitles and social share descriptions.</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Header & Mobile Logos */}
                    <div className="row g-4 mb-4">
                        {/* 1. Main Header Logo */}
                        <div className="col-lg-6">
                            <div className="card shadow-sm border-0 rounded-4 h-100">
                                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                        <i className="ri ri-layout-top-line text-success"></i>
                                        <span>Primary Header Logo</span>
                                    </h5>
                                    <span className="badge bg-label-success">Desktop Header</span>
                                </div>
                                <div className="card-body p-4 d-flex flex-column">
                                    <p className="text-muted small mb-3">
                                        Displayed on the desktop navigation bar and sticky header. Recommended format: transparent <strong>PNG</strong> or <strong>SVG</strong>, approx <strong>220 &times; 55 px</strong>.
                                    </p>

                                    {/* Preview Box on Light Header */}
                                    <div
                                        className="rounded-3 border d-flex align-items-center justify-content-center p-3 mb-3"
                                        style={{ background: '#F8FAFC', minHeight: '110px' }}
                                    >
                                        <img
                                            src={getFullImageUrl(branding.header_logo, '/images/logo_DS.png')}
                                            alt="Header Logo Preview"
                                            style={{ maxHeight: '55px', maxWidth: '100%', objectFit: 'contain' }}
                                            onError={(e) => {
                                                e.target.src = '/images/logo_DS.png';
                                            }}
                                        />
                                    </div>

                                    <div className="mt-auto">
                                        <input
                                            type="file"
                                            ref={fileInputRefs.header_logo}
                                            className="d-none"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            onChange={(e) => handleFileUpload('header_logo', e.target.files[0])}
                                        />
                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                            <button
                                                type="button"
                                                className="btn btn-outline-success btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                onClick={() => fileInputRefs.header_logo.current?.click()}
                                                disabled={uploadingField === 'header_logo'}
                                            >
                                                {uploadingField === 'header_logo' ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri ri-upload-2-line"></i>
                                                        <span>Upload New Logo</span>
                                                    </>
                                                )}
                                            </button>

                                            {branding.header_logo && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                    onClick={() => handleClearField('header_logo')}
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                    <span>Reset to Default</span>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            className="form-control form-control-sm rounded-3 text-muted"
                                            placeholder="or enter image URL (uploads/sundarban/...)"
                                            value={branding.header_logo || ''}
                                            onChange={(e) => setBranding({ ...branding, header_logo: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Mobile Drawer Logo */}
                        <div className="col-lg-6">
                            <div className="card shadow-sm border-0 rounded-4 h-100">
                                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                        <i className="ri ri-smartphone-line text-info"></i>
                                        <span>Mobile Drawer Logo</span>
                                    </h5>
                                    <span className="badge bg-label-info">Offcanvas Menu</span>
                                </div>
                                <div className="card-body p-4 d-flex flex-column">
                                    <p className="text-muted small mb-3">
                                        Displayed at the top of the slide-out mobile drawer on smartphones and tablets. Recommended size: approx <strong>180 &times; 50 px</strong>.
                                    </p>

                                    {/* Preview Box on Mobile Header */}
                                    <div
                                        className="rounded-3 border d-flex align-items-center justify-content-between px-3 py-2 mb-3"
                                        style={{ background: '#FFFFFF', minHeight: '110px' }}
                                    >
                                        <img
                                            src={getFullImageUrl(branding.mobile_logo || branding.header_logo, '/images/logo_DS.png')}
                                            alt="Mobile Logo Preview"
                                            style={{ maxHeight: '48px', maxWidth: '180px', objectFit: 'contain' }}
                                            onError={(e) => {
                                                e.target.src = '/images/logo_DS.png';
                                            }}
                                        />
                                        <div className="btn btn-sm btn-light border rounded-circle" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="ri ri-close-line"></i>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <input
                                            type="file"
                                            ref={fileInputRefs.mobile_logo}
                                            className="d-none"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            onChange={(e) => handleFileUpload('mobile_logo', e.target.files[0])}
                                        />
                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                            <button
                                                type="button"
                                                className="btn btn-outline-info btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                onClick={() => fileInputRefs.mobile_logo.current?.click()}
                                                disabled={uploadingField === 'mobile_logo'}
                                            >
                                                {uploadingField === 'mobile_logo' ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri ri-upload-2-line"></i>
                                                        <span>Upload Mobile Logo</span>
                                                    </>
                                                )}
                                            </button>

                                            {branding.mobile_logo && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                    onClick={() => handleClearField('mobile_logo')}
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                    <span>Clear (Fallback to Header)</span>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            className="form-control form-control-sm rounded-3 text-muted"
                                            placeholder="or enter image URL (uploads/sundarban/...)"
                                            value={branding.mobile_logo || ''}
                                            onChange={(e) => setBranding({ ...branding, mobile_logo: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Footer Logo, Favicon & Apple Touch Icon */}
                    <div className="row g-4 mb-4">
                        {/* 3. Footer / Dark Theme Logo */}
                        <div className="col-lg-4">
                            <div className="card shadow-sm border-0 rounded-4 h-100">
                                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                        <i className="ri ri-layout-bottom-line text-dark"></i>
                                        <span>Footer Logo</span>
                                    </h5>
                                    <span className="badge bg-dark text-white">Dark Backdrop</span>
                                </div>
                                <div className="card-body p-4 d-flex flex-column">
                                    <p className="text-muted small mb-3">
                                        Rendered inside the website footer. Uses white/contrasted palette suitable for dark backgrounds.
                                    </p>

                                    {/* Dark Preview Background */}
                                    <div
                                        className="rounded-3 d-flex align-items-center justify-content-center p-3 mb-3 shadow-inner"
                                        style={{ background: '#0B192C', minHeight: '110px' }}
                                    >
                                        <img
                                            src={getFullImageUrl(branding.footer_logo || branding.header_logo, '/images/logo_DS.png')}
                                            alt="Footer Logo Preview"
                                            style={{
                                                maxHeight: '48px',
                                                maxWidth: '100%',
                                                objectFit: 'contain',
                                                background: branding.footer_logo ? 'transparent' : 'rgba(255,255,255,0.95)',
                                                padding: branding.footer_logo ? '0' : '4px 10px',
                                                borderRadius: '6px'
                                            }}
                                            onError={(e) => {
                                                e.target.src = '/images/logo_DS.png';
                                            }}
                                        />
                                    </div>

                                    <div className="mt-auto">
                                        <input
                                            type="file"
                                            ref={fileInputRefs.footer_logo}
                                            className="d-none"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            onChange={(e) => handleFileUpload('footer_logo', e.target.files[0])}
                                        />
                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                            <button
                                                type="button"
                                                className="btn btn-outline-dark btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                onClick={() => fileInputRefs.footer_logo.current?.click()}
                                                disabled={uploadingField === 'footer_logo'}
                                            >
                                                {uploadingField === 'footer_logo' ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri ri-upload-2-line"></i>
                                                        <span>Upload Footer Logo</span>
                                                    </>
                                                )}
                                            </button>

                                            {branding.footer_logo && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                    onClick={() => handleClearField('footer_logo')}
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                    <span>Clear</span>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            className="form-control form-control-sm rounded-3 text-muted"
                                            placeholder="or enter image URL"
                                            value={branding.footer_logo || ''}
                                            onChange={(e) => setBranding({ ...branding, footer_logo: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Browser Tab Favicon */}
                        <div className="col-lg-4">
                            <div className="card shadow-sm border-0 rounded-4 h-100">
                                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                        <i className="ri ri-window-line text-warning"></i>
                                        <span>Browser Tab Favicon</span>
                                    </h5>
                                    <span className="badge bg-label-warning">Browser Tab</span>
                                </div>
                                <div className="card-body p-4 d-flex flex-column">
                                    <p className="text-muted small mb-3">
                                        Icon displayed on browser tabs and bookmarks. Recommended: <strong>32 &times; 32 px</strong> or <strong>64 &times; 64 px</strong> (.png or .ico).
                                    </p>

                                    {/* Mock Browser Tab Preview */}
                                    <div
                                        className="rounded-3 border p-2 mb-3 d-flex align-items-center"
                                        style={{ background: '#E2E8F0', minHeight: '110px' }}
                                    >
                                        <div
                                            className="bg-white rounded-top px-3 py-2 d-flex align-items-center gap-2 shadow-sm"
                                            style={{ width: '100%', maxWidth: '240px', fontSize: '12px' }}
                                        >
                                            <img
                                                src={getFullImageUrl(branding.favicon, '/images/favicon.png')}
                                                alt="Favicon Preview"
                                                style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                                onError={(e) => {
                                                    e.target.src = '/images/favicon.png';
                                                }}
                                            />
                                            <span className="text-truncate fw-semibold text-dark">
                                                Sundarban Delta Safari...
                                            </span>
                                            <i className="ri ri-close-line ms-auto text-muted"></i>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <input
                                            type="file"
                                            ref={fileInputRefs.favicon}
                                            className="d-none"
                                            accept="image/png,image/x-icon,image/svg+xml,image/jpeg"
                                            onChange={(e) => handleFileUpload('favicon', e.target.files[0])}
                                        />
                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                            <button
                                                type="button"
                                                className="btn btn-outline-warning btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                onClick={() => fileInputRefs.favicon.current?.click()}
                                                disabled={uploadingField === 'favicon'}
                                            >
                                                {uploadingField === 'favicon' ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri ri-upload-2-line"></i>
                                                        <span>Upload Favicon</span>
                                                    </>
                                                )}
                                            </button>

                                            {branding.favicon && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                    onClick={() => handleClearField('favicon')}
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                    <span>Clear</span>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            className="form-control form-control-sm rounded-3 text-muted"
                                            placeholder="or enter image URL"
                                            value={branding.favicon || ''}
                                            onChange={(e) => setBranding({ ...branding, favicon: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Apple Touch / Mobile App Icon */}
                        <div className="col-lg-4">
                            <div className="card shadow-sm border-0 rounded-4 h-100">
                                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                        <i className="ri ri-apple-fill text-danger"></i>
                                        <span>Apple Touch Icon</span>
                                    </h5>
                                    <span className="badge bg-label-danger">Mobile App Tile</span>
                                </div>
                                <div className="card-body p-4 d-flex flex-column">
                                    <p className="text-muted small mb-3">
                                        Used when users tap &quot;Add to Home Screen&quot; on iOS &amp; Android. Recommended size: <strong>180 &times; 180 px</strong> square PNG.
                                    </p>

                                    {/* Mock Smartphone Icon Tile */}
                                    <div
                                        className="rounded-3 border d-flex flex-column align-items-center justify-content-center p-3 mb-3"
                                        style={{ background: '#F1F5F9', minHeight: '110px' }}
                                    >
                                        <div
                                            className="shadow-sm d-flex align-items-center justify-content-center overflow-hidden"
                                            style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '14px',
                                                background: '#FFFFFF',
                                                border: '1px solid #E2E8F0'
                                            }}
                                        >
                                            <img
                                                src={getFullImageUrl(branding.apple_touch_icon || branding.favicon, '/images/favicon.png')}
                                                alt="App Icon Preview"
                                                style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                                                onError={(e) => {
                                                    e.target.src = '/images/favicon.png';
                                                }}
                                            />
                                        </div>
                                        <small className="mt-1 text-muted fw-semibold" style={{ fontSize: '11px' }}>Delta Safari</small>
                                    </div>

                                    <div className="mt-auto">
                                        <input
                                            type="file"
                                            ref={fileInputRefs.apple_touch_icon}
                                            className="d-none"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) => handleFileUpload('apple_touch_icon', e.target.files[0])}
                                        />
                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                onClick={() => fileInputRefs.apple_touch_icon.current?.click()}
                                                disabled={uploadingField === 'apple_touch_icon'}
                                            >
                                                {uploadingField === 'apple_touch_icon' ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri ri-upload-2-line"></i>
                                                        <span>Upload App Icon</span>
                                                    </>
                                                )}
                                            </button>

                                            {branding.apple_touch_icon && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm rounded-3 d-inline-flex align-items-center gap-1"
                                                    onClick={() => handleClearField('apple_touch_icon')}
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                    <span>Clear</span>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            className="form-control form-control-sm rounded-3 text-muted"
                                            placeholder="or enter image URL"
                                            value={branding.apple_touch_icon || ''}
                                            onChange={(e) => setBranding({ ...branding, apple_touch_icon: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Save Sticky Bar */}
                    <div className="card shadow-sm border-0 rounded-4 sticky-bottom mb-4">
                        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white rounded-4">
                            <div className="text-muted small d-flex align-items-center gap-2">
                                <i className="ri ri-shield-check-line text-success fs-5"></i>
                                <span>Changes update immediately across the Sundarban website, browser tabs, and bookmarks.</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    onClick={fetchBranding}
                                    className="btn btn-outline-secondary rounded-3 px-3"
                                    disabled={saving}
                                >
                                    Reset
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-success rounded-3 px-4 d-inline-flex align-items-center gap-2 shadow-sm fw-bold"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                            <span>Saving Branding...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri ri-save-line"></i>
                                            <span>Save Branding Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
