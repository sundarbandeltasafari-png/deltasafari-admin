"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { 
    getSundarbanSettingsUrl, 
    updateSundarbanSettingsUrl 
} from '@/app/routes/sundarbanRoutes';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';

export default function SundarbanSettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        site_title: '',
        tagline: '',
        phone_1: '',
        phone_2: '',
        whatsapp_number: '',
        email: '',
        address: '',
        hero_badge: '',
        hero_title: '',
        hero_subtitle: '',
        about_title: '',
        about_description: '',
        about_experience_years: 12,
        about_happy_travelers: 15000,
        facebook_url: '',
        instagram_url: '',
        youtube_url: '',
        tripadvisor_url: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        google_client_id: '',
        google_client_secret: '',
        enable_google_login: 1
    });

    const token = useSelector((state) => state.adminAuth?.token);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        axiosGet(getSundarbanSettingsUrl, token).then((data) => {
            if (data?.status && data?.settings) {
                setSettings((prev) => ({ ...prev, ...data.settings }));
            }
        }).catch((err) => {
            showMessage(err?.message || "Failed to load settings");
        }).finally(() => {
            setLoading(false);
        });
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axiosPost(updateSundarbanSettingsUrl, settings, token);
            if (res && res.status) {
                showMessage("Sundarban DeltaSafari website settings saved successfully!", "success");
            } else {
                showMessage(res?.msg || "Failed to update settings", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Failed to communicate with server", "error");
        } finally {
            setSaving(false);
        }
    };

    const tabClass = (tabName) => `nav-link cursor-pointer ${activeTab === tabName ? 'active fw-bold text-success border-0 border-bottom border-2 border-success' : 'text-secondary'}`;

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-settings-4-line text-success"></i>
                        <span>Sundarban Website Settings</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Configure branding, contact channels, hero banners, about text, and SEO for sundarban-deltasafari.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                        <div className="card-header bg-white border-bottom p-0">
                            <ul className="nav nav-tabs card-header-tabs m-0 px-3 py-2">
                                <li className="nav-item">
                                    <button type="button" className={tabClass('general')} onClick={() => setActiveTab('general')}>
                                        <i className="ri ri-store-2-line me-1"></i> General &amp; Contact
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button type="button" className={tabClass('hero')} onClick={() => setActiveTab('hero')}>
                                        <i className="ri ri-image-2-line me-1"></i> Hero Section
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button type="button" className={tabClass('about')} onClick={() => setActiveTab('about')}>
                                        <i className="ri ri-information-line me-1"></i> About Story
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button type="button" className={tabClass('social')} onClick={() => setActiveTab('social')}>
                                        <i className="ri ri-share-line me-1"></i> Social Links
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button type="button" className={tabClass('seo')} onClick={() => setActiveTab('seo')}>
                                        <i className="ri ri-search-line me-1"></i> SEO &amp; Meta Tags
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button type="button" className={tabClass('google')} onClick={() => setActiveTab('google')}>
                                        <i className="ri ri-google-fill me-1 text-danger"></i> Google Sign-In
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="card-body p-4 p-md-5">
                            {/* TAB 1: General & Contact */}
                            {activeTab === 'general' && (
                                <div className="row g-3">
                                    <div className="col-12 border-bottom pb-2 mb-2">
                                        <h6 className="fw-bold text-success mb-1">Branding &amp; Contact Information</h6>
                                        <p className="text-muted small mb-0">Shown across the header, footer, topbar, and contact page.</p>
                                    </div>

                                    <div className="col-12">
                                        <div className="alert alert-primary d-flex flex-wrap align-items-center justify-content-between p-3 rounded-3 mb-2" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                                            <div className="d-flex align-items-center gap-2 text-primary">
                                                <i className="ri ri-image-edit-line fs-5"></i>
                                                <span className="small fw-semibold">Want to manage Website Header Logo, Mobile Logo, Dark Footer Logo &amp; Favicon?</span>
                                            </div>
                                            <Link href="/sundarban/branding" className="btn btn-sm btn-primary rounded-3 mt-2 mt-sm-0">
                                                Open Logo &amp; Favicon Manager &rarr;
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Website Title</label>
                                        <input 
                                            type="text" 
                                            name="site_title" 
                                            value={settings.site_title || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="Sundarban Delta Safari - Premier Wildlife & Boat Safaris" 
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Tagline / Slogan</label>
                                        <input 
                                            type="text" 
                                            name="tagline" 
                                            value={settings.tagline || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="Experience the Wild Majesty of Royal Bengal Tigers" 
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold text-secondary">Primary Phone Number</label>
                                        <input 
                                            type="text" 
                                            name="phone_1" 
                                            value={settings.phone_1 || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="+91 98300 12345" 
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold text-secondary">Secondary Phone Number</label>
                                        <input 
                                            type="text" 
                                            name="phone_2" 
                                            value={settings.phone_2 || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="+91 98300 54321" 
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold text-secondary">WhatsApp Direct Number</label>
                                        <input 
                                            type="text" 
                                            name="whatsapp_number" 
                                            value={settings.whatsapp_number || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="+91 98300 12345" 
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Official Email Address</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            value={settings.email || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="sundarban@deltasafari.in" 
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Physical Office &amp; Booking Hub Address</label>
                                        <textarea 
                                            name="address" 
                                            value={settings.address || ''} 
                                            onChange={handleInputChange} 
                                            rows={2} 
                                            className="form-control" 
                                            placeholder="Godkhali Ferry Ghat & Kolkata Office: Delta Safari, Salt Lake Sector V, Kolkata" 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Hero Section */}
                            {activeTab === 'hero' && (
                                <div className="row g-3">
                                    <div className="col-12 border-bottom pb-2 mb-2">
                                        <h6 className="fw-bold text-success mb-1">Hero Section &amp; Headlines</h6>
                                        <p className="text-muted small mb-0">The main banner at the top of the Sundarban DeltaSafari homepage.</p>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Hero Badge / Pill Text</label>
                                        <input 
                                            type="text" 
                                            name="hero_badge" 
                                            value={settings.hero_badge || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="Govt. Authorized Sundarban Safari Operator" 
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Hero Main Title</label>
                                        <input 
                                            type="text" 
                                            name="hero_title" 
                                            value={settings.hero_title || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="Discover the Wild Wonders of Sundarban" 
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-secondary">Hero Subtitle Text</label>
                                        <textarea 
                                            name="hero_subtitle" 
                                            value={settings.hero_subtitle || ''} 
                                            onChange={handleInputChange} 
                                            rows={3} 
                                            className="form-control" 
                                            placeholder="Customized & All-Inclusive Sundarban Safari Packages. Royal Bengal Tiger spotting, luxury houseboats, mangrove creek cruising, watchtowers, and authentic Bengali cuisine." 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: About Story */}
                            {activeTab === 'about' && (
                                <div className="row g-3">
                                    <div className="col-12 border-bottom pb-2 mb-2">
                                        <h6 className="fw-bold text-success mb-1">About Story &amp; Trust Metrics</h6>
                                        <p className="text-muted small mb-0">Displayed in the About Section and About page of sundarban-deltasafari.</p>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary">About Section Title</label>
                                        <input 
                                            type="text" 
                                            name="about_title" 
                                            value={settings.about_title || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="The Ultimate Sundarban Wildlife Experience" 
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label className="form-label fw-semibold text-secondary">Years of Safari Experience</label>
                                        <input 
                                            type="number" 
                                            name="about_experience_years" 
                                            value={settings.about_experience_years || 12} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="12" 
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label className="form-label fw-semibold text-secondary">Happy Travelers Count</label>
                                        <input 
                                            type="number" 
                                            name="about_happy_travelers" 
                                            value={settings.about_happy_travelers || 15000} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="15000" 
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-secondary">About Narrative / Description</label>
                                        <textarea 
                                            name="about_description" 
                                            value={settings.about_description || ''} 
                                            onChange={handleInputChange} 
                                            rows={5} 
                                            className="form-control" 
                                            placeholder="Sundarban Delta Safari is dedicated solely to offering breathtaking, safe, and ecologically sustainable expeditions through the UNESCO World Heritage Sundarban Mangrove Forest..." 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: Social Links */}
                            {activeTab === 'social' && (
                                <div className="row g-3">
                                    <div className="col-12 border-bottom pb-2 mb-2">
                                        <h6 className="fw-bold text-success mb-1">Social Media &amp; Review Profiles</h6>
                                        <p className="text-muted small mb-0">Shown in the topbar, footer, and contact section.</p>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary"><i className="ri ri-facebook-fill text-primary me-1"></i> Facebook Page URL</label>
                                        <input 
                                            type="url" 
                                            name="facebook_url" 
                                            value={settings.facebook_url || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="https://facebook.com/sundarbandeltasafari" 
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary"><i className="ri ri-instagram-line text-danger me-1"></i> Instagram Profile URL</label>
                                        <input 
                                            type="url" 
                                            name="instagram_url" 
                                            value={settings.instagram_url || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="https://instagram.com/sundarbandeltasafari" 
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary"><i className="ri ri-youtube-fill text-danger me-1"></i> YouTube Channel URL</label>
                                        <input 
                                            type="url" 
                                            name="youtube_url" 
                                            value={settings.youtube_url || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="https://youtube.com/@sundarbandeltasafari" 
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary"><i className="ri ri-star-smile-fill text-success me-1"></i> TripAdvisor Review Profile URL</label>
                                        <input 
                                            type="url" 
                                            name="tripadvisor_url" 
                                            value={settings.tripadvisor_url || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="https://tripadvisor.com" 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: SEO & Meta */}
                            {activeTab === 'seo' && (
                                <div className="row g-3">
                                    <div className="col-12 border-bottom pb-2 mb-2">
                                        <h6 className="fw-bold text-success mb-1">Global SEO &amp; Search Engine Meta</h6>
                                        <p className="text-muted small mb-0">Applied across the sundarban-deltasafari frontend for Google ranking.</p>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-secondary">Meta Title (Search Heading)</label>
                                        <input 
                                            type="text" 
                                            name="meta_title" 
                                            value={settings.meta_title || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="Sundarban Tour Packages 2026 | Best Sundarban Delta Safari Booking" 
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-secondary">Meta Description</label>
                                        <textarea 
                                            name="meta_description" 
                                            value={settings.meta_description || ''} 
                                            onChange={handleInputChange} 
                                            rows={3} 
                                            className="form-control" 
                                            placeholder="Book official Sundarban tour packages with Delta Safari. 1N/2D, 2N/3D, 3N/4D safari packages with Kolkata pickup, luxury boats, watchtowers, village walks, and tiger tracking." 
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-secondary">Meta Keywords (Comma separated)</label>
                                        <input 
                                            type="text" 
                                            name="meta_keywords" 
                                            value={settings.meta_keywords || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control" 
                                            placeholder="sundarban tour, sundarban delta safari, sundarban package, sundarban boat safari, royal bengal tiger safari" 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 6: Google Sign-In / OAuth */}
                            {activeTab === 'google' && (
                                <div className="row g-3">
                                    <div className="col-12 border-bottom pb-2 mb-2">
                                        <h6 className="fw-bold text-success mb-1">Google OAuth &amp; One-Click Sign-In</h6>
                                        <p className="text-muted small mb-0">Manage Google Sign-In configuration for traveler registration and login on Sundarban Delta Safari.</p>
                                    </div>

                                    <div className="col-12">
                                        <div className="alert alert-primary py-3 px-3 d-flex align-items-center gap-3 rounded-3 border-0" style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}>
                                            <div className="p-2 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                                <i className="ri ri-google-fill fs-4 text-danger"></i>
                                            </div>
                                            <div>
                                                <strong>Google OAuth 2.0 &amp; One-Tap Login</strong>
                                                <div className="small mt-1 text-muted" style={{ color: '#4B5563' }}>
                                                    Allows travelers to log in and sign up with a single click using their verified Google accounts.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Enable Google Login</label>
                                        <select 
                                            name="enable_google_login" 
                                            value={settings.enable_google_login !== undefined ? settings.enable_google_login : 1} 
                                            onChange={handleInputChange} 
                                            className="form-select rounded-3"
                                        >
                                            <option value={1}>Enabled (Show &quot;Continue with Google&quot;)</option>
                                            <option value={0}>Disabled (Hide &quot;Continue with Google&quot;)</option>
                                        </select>
                                        <small className="text-muted d-block mt-1">Show or hide the Google Sign-In button on the login and register pages.</small>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Google OAuth Status</label>
                                        <div className="form-control bg-light rounded-3 d-flex align-items-center gap-2">
                                            {Number(settings.enable_google_login) === 1 && settings.google_client_id ? (
                                                <>
                                                    <span className="badge bg-success rounded-pill">Active</span>
                                                    <span className="small text-muted">Google Sign-In is live on website</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="badge bg-secondary rounded-pill">Inactive</span>
                                                    <span className="small text-muted">{Number(settings.enable_google_login) === 0 ? 'Disabled by admin' : 'Client ID required'}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-secondary">Google OAuth Client ID</label>
                                        <input 
                                            type="text" 
                                            name="google_client_id" 
                                            value={settings.google_client_id || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control font-monospace" 
                                            placeholder="e.g. 1060481688994-xxx.apps.googleusercontent.com" 
                                        />
                                        <small className="text-muted d-block mt-1">Obtain from Google Cloud Console &rarr; APIs &amp; Services &rarr; Credentials &rarr; OAuth 2.0 Client IDs (Web application).</small>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-secondary">Google OAuth Client Secret</label>
                                        <input 
                                            type="text" 
                                            name="google_client_secret" 
                                            value={settings.google_client_secret || ''} 
                                            onChange={handleInputChange} 
                                            className="form-control font-monospace" 
                                            placeholder="e.g. GOCSPX-xxx" 
                                        />
                                        <small className="text-muted d-block mt-1">Client Secret key associated with your Google Cloud project.</small>
                                    </div>

                                    <div className="col-12 mt-3">
                                        <div className="card border rounded-3 p-3 bg-light">
                                            <h6 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                                                <i className="ri ri-information-line text-info"></i>
                                                <span>Google Cloud Console Configuration Guide</span>
                                            </h6>
                                            <p className="small text-muted mb-2">
                                                To ensure the &quot;Continue with Google&quot; button works smoothly without OAuth errors, configure your Google Cloud Web Client ID with:
                                            </p>
                                            <ul className="small text-muted mb-0 ps-3">
                                                <li className="mb-1">
                                                    <strong>Authorized JavaScript origins:</strong>
                                                    <code className="ms-1 bg-white px-2 py-0.5 rounded border">http://localhost</code>,
                                                    <code className="ms-1 bg-white px-2 py-0.5 rounded border">http://localhost:3000</code>,
                                                    <code className="ms-1 bg-white px-2 py-0.5 rounded border">https://sundarbandeltasafari.com</code>
                                                </li>
                                                <li>
                                                    <strong>Authorized redirect URIs:</strong>
                                                    <code className="ms-1 bg-white px-2 py-0.5 rounded border">http://localhost/sundarban-deltasafari/auth/google_login</code>,
                                                    <code className="ms-1 bg-white px-2 py-0.5 rounded border">https://sundarbandeltasafari.com/auth/google_login</code>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save Button Bar */}
                            <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                                <button 
                                    type="submit" 
                                    disabled={saving} 
                                    className="btn btn-success d-flex align-items-center gap-2 rounded-pill px-4 text-white shadow-sm"
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                            Saving Settings...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri ri-save-line"></i> Save Website Settings
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
