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
        canonical_url: ''
    });

    const [fileFields, setFileFields] = useState({
        site_logo: null, site_favicon: null, og_image: null, twitter_image: null
    });
    const token = useSelector((state) => state.adminAuth?.token);


    const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL;

    // Load configurations on mount
    useEffect(() => {
        axiosGet(getSiteSettingsUrl, token).then((data) => {
            if (data?.status) {
                setSettings(data?.siteSettings[0])
                setLoading(false)
            } else {
                showMessage(data?.message)
            }
        }).catch(err => showMessage(err?.message));
    }, []);

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
    const previewStyle = { maxHeight: '150px', objectFit: 'contain', marginTop: '10px', display: 'block', border: '1px solid #ddd', padding: '4px', borderRadius: '4px', backgroundColor: '#fff' };

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
                                                <label className="form-label fw-semibold">Website Logo</label>
                                                <input type="file" className="form-control" name="site_logo" accept="image/*" onChange={handleFileChange} />
                                                {settings.site_logo && <img src={`${BACKEND_URL}${settings.site_logo}`} style={previewStyle} alt="Logo Preview" />}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Favicon (.ico/.png)</label>
                                                <input type="file" className="form-control" name="site_favicon" accept="image/*" onChange={handleFileChange} />
                                                {settings.site_favicon && <img src={`${BACKEND_URL}${settings.site_favicon}`} style={{ ...previewStyle, maxHeight: '100px' }} alt="Favicon Preview" />}
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
                                                <label className="form-label fw-semibold">OG Image (Social Shares)</label>
                                                <input type="file" className="form-control" name="og_image" accept="image/*" onChange={handleFileChange} />
                                                {settings.og_image && <img src={`${BACKEND_URL}${settings.og_image}`} style={{ ...previewStyle, maxHeight: '100px' }} alt="OG Preview" />}
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
                                                <label className="form-label fw-semibold">Twitter Image</label>
                                                <input type="file" className="form-control" name="twitter_image" accept="image/*" onChange={handleFileChange} />
                                                {settings.twitter_image && <img src={`${BACKEND_URL}${settings.twitter_image}`} style={{ ...previewStyle, maxHeight: '100px' }} alt="Twitter Card Preview" />}
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