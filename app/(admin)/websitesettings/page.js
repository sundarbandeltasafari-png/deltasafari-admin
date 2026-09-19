"use client"
import { getSiteSettingsUrl, updateSiteSettingsUrl } from '@/app/routes/settingsRoutes';
import LoadingComponent from '@/components/common/LoadingComponent';
import { axiosGet, axiosPost, axiosPut } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const page = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        site_title: '', meta_description: '', meta_keywords: '',
        site_logo: '', site_favicon: '', og_title: '', og_description: '',
        og_image: '', og_url: '', og_type: 'website', og_site_name: '',
        twitter_card: 'summary_large_image', twitter_title: '',
        twitter_description: '', twitter_image: '', robots_meta: 'index, follow',
        canonical_url: '',
        google_client_id: '', google_client_secret: '', google_auth_token: '', enable_google_login: 1
    });

    const [fileFields, setFileFields] = useState({
        site_logo: null, site_favicon: null, og_image: null, twitter_image: null
    });

    const token = useSelector((state) => state.adminAuth?.token);
    const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL;

    // Check URL query param on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam && ['general', 'seo', 'og', 'twitter', 'google'].includes(tabParam)) {
                setActiveTab(tabParam);
            }
        }
    }, []);

    // Load configurations on mount
    useEffect(() => {
        axiosGet(getSiteSettingsUrl, token).then((data) => {
            if (data?.status) {
                const s = data?.siteSettings[0] || {};
                setSettings((prev) => ({
                    ...prev,
                    ...s
                }));
                setLoading(false);
            } else {
                showMessage(data?.message);
            }
        }).catch(err => showMessage(err?.message));
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings({ ...settings, [name]: value });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFileFields({ ...fileFields, [name]: files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        // Append text fields
        Object.keys(settings).forEach(key => {
            formData.append(key, settings[key]);
        });
        // Append raw binary media streams
        Object.keys(fileFields).forEach(key => {
            if (fileFields[key]) {
                formData.append(key, fileFields[key]);
            }
        });

        try {
            axiosPut(updateSiteSettingsUrl, formData, token, 'multipart/form-data').then((response) => {
                if (response.status) {
                    showMessage(response.msg, "success");
                    window.location.reload();
                } else {
                    showMessage(response.msg)
                }
            })
        } catch (error) {
            showMessage(error?.message)
        }
    };

    // Styling constants mapped to look like your reference template dashboard environment
    const tabClass = (tabName) => `nav-link cursor-pointer ${activeTab === tabName ? 'active fw-bold text-primary border-0 border-bottom border-2 border-primary' : 'text-secondary'}`;
    const previewStyle = { maxHeight: '150px', objectFit: 'contain', display: 'block', backgroundColor: '#fff' };

    const getImagePreview = (fieldName) => {
        if (fileFields[fieldName]) {
            return URL.createObjectURL(fileFields[fieldName]);
        }
        if (settings[fieldName]) {
            const cleanPath = settings[fieldName].replace(/\\/g, '/');
            const baseUrl = (BACKEND_URL || '').replace(/\/+$/, '');
            return `${baseUrl}/${cleanPath.replace(/^\/+/, '')}`;
        }
        return null;
    };

    return (
        <div className="container my-5" style={{ backgroundColor: '#f4f5fa', minHeight: '100vh', fontFamily: "'Public Sans', sans-serif" }}>
            <div className="row">
                <div className="col-md-12">
                    <h4 className="fw-bold py-3 mb-4">Website Settings</h4>

                    {loading ?
                        <LoadingComponent />
                        :
                        <form onSubmit={handleSubmit}>
                            <div className="card shadow-sm border-0 bg-white rounded-3">
                                <div className="card-header bg-white border-bottom p-0">
                                    <ul className="nav nav-tabs card-header-tabs m-0 px-3 py-2">
                                        <li className="nav-item">
                                            <button type="button" className={tabClass('general')} onClick={() => setActiveTab('general')}>General & Branding</button>
                                        </li>
                                        <li className="nav-item">
                                            <button type="button" className={tabClass('seo')} onClick={() => setActiveTab('seo')}>Global SEO Tags</button>
                                        </li>
                                        <li className="nav-item">
                                            <button type="button" className={tabClass('og')} onClick={() => setActiveTab('og')}>Open Graph (OG) Tags</button>
                                        </li>
                                        <li className="nav-item">
                                            <button type="button" className={tabClass('twitter')} onClick={() => setActiveTab('twitter')}>Twitter Cards</button>
                                        </li>
                                        <li className="nav-item">
                                            <button type="button" className={tabClass('google')} onClick={() => setActiveTab('google')}>
                                                <i className="ri-google-fill me-1"></i> Google Auth
                                            </button>
                                        </li>
                                    </ul>
                                </div>

                                <div className="card-body p-4">
                                    {/* GENERAL & BRANDING TAB */}
                                    {activeTab === 'general' && (
                                        <div className="row">
                                            <div className="col-md-12 mb-3">
                                                <label className="form-label fw-semibold">Global Website Title</label>
                                                <input type="text" className="form-control" name="site_title" value={settings.site_title || ''} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold d-flex justify-content-between align-items-center">
                                                    <span>Website Logo</span>
                                                    <span className="badge bg-primary-subtle text-primary fw-normal">.svg, .png, .jpg, .webp, .ico</span>
                                                </label>
                                                <input 
                                                    type="file" 
                                                    className="form-control" 
                                                    name="site_logo" 
                                                    accept="image/*,.ico,.svg" 
                                                    onChange={handleFileChange} 
                                                />
                                                <small className="text-muted d-block mt-1">
                                                    SVG (vector) or transparent PNG is recommended for crisp logos on all displays.
                                                </small>
                                                {getImagePreview('site_logo') && (
                                                    <div className="mt-2 p-2 border rounded bg-light d-inline-block">
                                                        <img src={getImagePreview('site_logo')} style={previewStyle} alt="Logo Preview" />
                                                        {fileFields.site_logo && (
                                                            <span className="badge bg-success-subtle text-success mt-1 d-block text-truncate" style={{ maxWidth: '260px' }}>
                                                                <i className="ri-check-line me-1"></i> Ready to upload: {fileFields.site_logo.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold d-flex justify-content-between align-items-center">
                                                    <span>Favicon</span>
                                                    <span className="badge bg-primary-subtle text-primary fw-normal">.ico, .svg, .png</span>
                                                </label>
                                                <input 
                                                    type="file" 
                                                    className="form-control" 
                                                    name="site_favicon" 
                                                    accept="image/*,.ico,.svg" 
                                                    onChange={handleFileChange} 
                                                />
                                                <small className="text-muted d-block mt-1">
                                                    Browser tab icon. Standard .ico, modern .svg, or .png format supported.
                                                </small>
                                                {getImagePreview('site_favicon') && (
                                                    <div className="mt-2 p-2 border rounded bg-light d-inline-block">
                                                        <img src={getImagePreview('site_favicon')} style={{ ...previewStyle, maxHeight: '64px', maxWidth: '64px' }} alt="Favicon Preview" />
                                                        {fileFields.site_favicon && (
                                                            <span className="badge bg-success-subtle text-success mt-1 d-block text-truncate" style={{ maxWidth: '260px' }}>
                                                                <i className="ri-check-line me-1"></i> Ready to upload: {fileFields.site_favicon.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* GLOBAL SEO TAGS TAB */}
                                    {activeTab === 'seo' && (
                                        <div>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Meta Description</label>
                                                <textarea className="form-control" name="meta_description" rows="3" value={settings.meta_description || ''} onChange={handleInputChange}></textarea>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Meta Keywords (Comma separated)</label>
                                                <input type="text" className="form-control" name="meta_keywords" value={settings.meta_keywords || ''} onChange={handleInputChange} />
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-semibold">Robots Meta Tag</label>
                                                    <select className="form-select" name="robots_meta" value={settings.robots_meta || 'index, follow'} onChange={handleInputChange}>
                                                        <option value="index, follow">index, follow (Default)</option>
                                                        <option value="noindex, follow">noindex, follow</option>
                                                        <option value="index, nofollow">index, nofollow</option>
                                                        <option value="noindex, nofollow">noindex, nofollow</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-semibold">Canonical URL</label>
                                                    <input type="url" class="form-control" name="canonical_url" value={settings.canonical_url || ''} onChange={handleInputChange} placeholder="https://example.com/" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* OPEN GRAPH TAGS TAB */}
                                    {activeTab === 'og' && (
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">OG Title</label>
                                                <input type="text" className="form-control" name="og_title" value={settings.og_title || ''} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">OG Site Name</label>
                                                <input type="text" className="form-control" name="og_site_name" value={settings.og_site_name || ''} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">OG Type</label>
                                                <input type="text" className="form-control" name="og_type" value={settings.og_type || 'website'} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">OG URL</label>
                                                <input type="url" className="form-control" name="og_url" value={settings.og_url || ''} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-12 mb-3">
                                                <label className="form-label fw-semibold">OG Description</label>
                                                <textarea className="form-control" name="og_description" rows="2" value={settings.og_description || ''} onChange={handleInputChange}></textarea>
                                            </div>
                                            <div className="col-md-12 mb-3">
                                                <label className="form-label fw-semibold d-flex justify-content-between align-items-center">
                                                    <span>OG Image (Social Shares)</span>
                                                    <span className="badge bg-secondary-subtle text-secondary fw-normal">.jpg, .png, .webp, .svg</span>
                                                </label>
                                                <input type="file" className="form-control" name="og_image" accept="image/*,.ico,.svg" onChange={handleFileChange} />
                                                <small className="text-muted d-block mt-1">Image displayed when links are shared on Facebook, LinkedIn, etc.</small>
                                                {getImagePreview('og_image') && (
                                                    <div className="mt-2 p-2 border rounded bg-light d-inline-block">
                                                        <img src={getImagePreview('og_image')} style={{ ...previewStyle, maxHeight: '100px' }} alt="OG Preview" />
                                                        {fileFields.og_image && (
                                                            <span className="badge bg-success-subtle text-success mt-1 d-block text-truncate" style={{ maxWidth: '260px' }}>
                                                                <i className="ri-check-line me-1"></i> Ready to upload: {fileFields.og_image.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* TWITTER CARD TAB */}
                                    {activeTab === 'twitter' && (
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Twitter Card Type</label>
                                                <select className="form-select" name="twitter_card" value={settings.twitter_card || 'summary_large_image'} onChange={handleInputChange}>
                                                    <option value="summary">Summary Card</option>
                                                    <option value="summary_large_image">Summary Card with Large Image</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Twitter Title</label>
                                                <input type="text" className="form-control" name="twitter_title" value={settings.twitter_title || ''} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-12 mb-3">
                                                <label className="form-label fw-semibold">Twitter Description</label>
                                                <textarea className="form-control" name="twitter_description" rows="2" value={settings.twitter_description || ''} onChange={handleInputChange}></textarea>
                                            </div>
                                            <div className="col-md-12 mb-3">
                                                <label className="form-label fw-semibold d-flex justify-content-between align-items-center">
                                                    <span>Twitter Image</span>
                                                    <span className="badge bg-secondary-subtle text-secondary fw-normal">.jpg, .png, .webp, .svg</span>
                                                </label>
                                                <input type="file" className="form-control" name="twitter_image" accept="image/*,.ico,.svg" onChange={handleFileChange} />
                                                <small className="text-muted d-block mt-1">Image displayed in Twitter / X cards.</small>
                                                {getImagePreview('twitter_image') && (
                                                    <div className="mt-2 p-2 border rounded bg-light d-inline-block">
                                                        <img src={getImagePreview('twitter_image')} style={{ ...previewStyle, maxHeight: '100px' }} alt="Twitter Card Preview" />
                                                        {fileFields.twitter_image && (
                                                            <span className="badge bg-success-subtle text-success mt-1 d-block text-truncate" style={{ maxWidth: '260px' }}>
                                                                <i className="ri-check-line me-1"></i> Ready to upload: {fileFields.twitter_image.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* GOOGLE AUTHENTICATION TAB */}
                                    {activeTab === 'google' && (
                                        <div className="row">
                                            <div className="col-12 mb-3">
                                                <div className="alert alert-primary py-3 px-3 d-flex align-items-center gap-2 rounded-3 border-0" style={{ backgroundColor: '#e7e7ff', color: '#696cff' }}>
                                                    <i className="ri-google-fill fs-4"></i>
                                                    <div>
                                                        <strong>Google OAuth 2.0 & Token Settings</strong>
                                                        <div className="small mt-1 text-muted" style={{ color: '#566a7f' }}>
                                                            Configure Google OAuth Client ID and credentials to enable 1-click Google Login on the traveler portal.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Enable Google Login</label>
                                                <select 
                                                    className="form-select" 
                                                    name="enable_google_login" 
                                                    value={settings.enable_google_login !== undefined ? settings.enable_google_login : 1} 
                                                    onChange={handleInputChange}
                                                >
                                                    <option value={1}>Enabled (Active on Login Page)</option>
                                                    <option value={0}>Disabled</option>
                                                </select>
                                                <small className="text-muted d-block mt-1">Show or hide the "Continue with Google" button on traveler login/signup.</small>
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Google Client ID</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control font-monospace" 
                                                    name="google_client_id" 
                                                    placeholder="e.g. 1060481688994-xxx.apps.googleusercontent.com" 
                                                    value={settings.google_client_id || ''} 
                                                    onChange={handleInputChange} 
                                                />
                                                <small className="text-muted d-block mt-1">OAuth 2.0 Client ID generated in Google Cloud Console.</small>
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Google Client Secret</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control font-monospace" 
                                                    name="google_client_secret" 
                                                    placeholder="e.g. GOCSPX-xxx" 
                                                    value={settings.google_client_secret || ''} 
                                                    onChange={handleInputChange} 
                                                />
                                                <small className="text-muted d-block mt-1">Client Secret key matching the Client ID.</small>
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Google Auth Token / API Key</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control font-monospace" 
                                                    name="google_auth_token" 
                                                    placeholder="Assigned Google Auth Token or API Key" 
                                                    value={settings.google_auth_token || ''} 
                                                    onChange={handleInputChange} 
                                                />
                                                <small className="text-muted d-block mt-1">OAuth 2.0 Auth token or access key assigned from admin.</small>
                                            </div>

                                            <div className="col-12 mt-2">
                                                <div className="p-3 bg-light rounded-3 border">
                                                    <h6 className="fw-bold mb-2 small text-dark"><i className="ri-shield-keyhole-line me-1 text-primary"></i> Setup Instructions for Google Cloud Console:</h6>
                                                    <ul className="mb-0 small text-muted ps-3" style={{ lineHeight: '1.6' }}>
                                                        <li>Create an OAuth 2.0 Web Application credential in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">Google Cloud Console</a>.</li>
                                                        <li>Add <strong>Authorized JavaScript origins</strong>: <code>http://localhost</code> and your production domain.</li>
                                                        <li>Paste the resulting <strong>Client ID</strong> and <strong>Client Secret</strong> into the fields above and click Save Changes.</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                </div>

                                <div className="card-footer bg-white border-top d-flex justify-content-end p-3">
                                    <button type="submit" className="btn btn-primary px-4 py-2" style={{ backgroundColor: '#696cff', borderColor: '#696cff' }}>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    }
                </div>
            </div>

        </div>
    );
};

export default page