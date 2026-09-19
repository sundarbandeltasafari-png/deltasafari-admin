'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import { getSundarbanAboutUrl, updateSundarbanAboutUrl } from '@/app/routes/sundarbanRoutes';

export default function SundarbanAboutPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [aboutData, setAboutData] = useState({
        about_title: '',
        about_description: '',
        about_experience_years: 12,
        about_happy_travelers: 18500,
        about_mission: '',
        about_vision: '',
        about_pillars: ''
    });

    const [pillars, setPillars] = useState([
        {
            title: 'Sustainable Ecotourism',
            subtitle: 'Zero-Waste & Green Vessels',
            description: 'Our solar and dual-engine safari boats prioritize low-emission navigation, protecting delicate mangrove tidal habitats.'
        },
        {
            title: 'Licensed Naturalists',
            subtitle: 'Indigenous Forest Trackers',
            description: 'Guided by certified local naturalists born and raised in the delta who know every creek, pugmark, and tiger habitat.'
        },
        {
            title: 'Authentic Local Hospitality',
            subtitle: 'Fresh River Catch & Tribal Culture',
            description: 'Serving hot Bengali village cuisine cooked onboard, paired with traditional Baul and Bonbibi folk music evenings.'
        }
    ]);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        axiosGet(getSundarbanAboutUrl, token).then((res) => {
            if (res && res.status && res.about) {
                setAboutData((prev) => ({
                    ...prev,
                    ...res.about
                }));
                if (res.about.about_pillars) {
                    try {
                        const parsed = typeof res.about.about_pillars === 'string'
                            ? JSON.parse(res.about.about_pillars)
                            : res.about.about_pillars;
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setPillars(parsed);
                        }
                    } catch (e) {}
                }
            }
        }).catch((err) => {
            showMessage(err?.message || "Failed to load About Us details", "error");
        }).finally(() => {
            setLoading(false);
        });
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAboutData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePillarChange = (index, field, value) => {
        const updated = [...pillars];
        updated[index] = { ...updated[index], [field]: value };
        setPillars(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...aboutData,
                about_pillars: JSON.stringify(pillars)
            };
            const res = await axiosPost(updateSundarbanAboutUrl, payload, token);
            if (res && res.status) {
                showMessage("About Us content updated successfully!", "success");
            } else {
                showMessage(res?.msg || "Failed to update About Us data", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Communication error with server", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-information-line text-info"></i>
                        <span>About Us &amp; Company Story Manager</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Manage the brand story, experience stats, mission &amp; vision, and 3 core pillars displayed on the /about page.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* SECTION 1: Main Story & Achievements */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                <i className="ri ri-book-open-line text-primary"></i>
                                <span>Main Story &amp; Headline</span>
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label fw-semibold">Story Title / Headline</label>
                                    <input
                                        type="text"
                                        name="about_title"
                                        value={aboutData.about_title || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Preserving Sundarbans While Delivering Unforgettable Wilderness Expeditions"
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-semibold">Story Description / Narrative</label>
                                    <textarea
                                        rows="5"
                                        name="about_description"
                                        value={aboutData.about_description || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Detailed narrative about Sundarban Delta Safari's origins, vessel standards, and dedication to conservation..."
                                    ></textarea>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Years of Operational Experience</label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            name="about_experience_years"
                                            value={aboutData.about_experience_years || 12}
                                            onChange={handleInputChange}
                                            className="form-control"
                                        />
                                        <span className="input-group-text bg-light">Years+</span>
                                    </div>
                                    <small className="text-muted">Displays in the achievement counter.</small>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Satisfied Travelers Hosted</label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            name="about_happy_travelers"
                                            value={aboutData.about_happy_travelers || 18500}
                                            onChange={handleInputChange}
                                            className="form-control"
                                        />
                                        <span className="input-group-text bg-light">Guests+</span>
                                    </div>
                                    <small className="text-muted">Displays in the satisfied travelers counter.</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Mission & Vision Statements */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                <i className="ri ri-flag-line text-success"></i>
                                <span>Mission &amp; Vision Statements</span>
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Our Mission</label>
                                    <textarea
                                        rows="4"
                                        name="about_mission"
                                        value={aboutData.about_mission || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="To protect and celebrate the unique Sundarban mangrove ecosystem..."
                                    ></textarea>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Our Vision</label>
                                    <textarea
                                        rows="4"
                                        name="about_vision"
                                        value={aboutData.about_vision || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="To be India's premier mangrove wilderness tour operator..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: 3 Pillars of Delta Safari */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                <i className="ri ri-trophy-line text-warning"></i>
                                <span>Three Core Pillars of Delta Safari</span>
                            </h5>
                            <small className="text-muted">Showcased in the philosophy feature section of /about.</small>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                {pillars.map((pillar, index) => (
                                    <div className="col-lg-4" key={index}>
                                        <div className="card border rounded-3 p-3 h-100 bg-light">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="badge bg-success">Pillar #{index + 1}</span>
                                            </div>
                                            <div className="mb-2">
                                                <label className="form-label small fw-semibold">Pillar Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={pillar.title || ''}
                                                    onChange={(e) => handlePillarChange(index, 'title', e.target.value)}
                                                    placeholder="e.g. Sustainable Ecotourism"
                                                />
                                            </div>
                                            <div className="mb-2">
                                                <label className="form-label small fw-semibold">Subtitle / Tagline</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={pillar.subtitle || ''}
                                                    onChange={(e) => handlePillarChange(index, 'subtitle', e.target.value)}
                                                    placeholder="e.g. Zero-Waste & Green Vessels"
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label small fw-semibold">Description</label>
                                                <textarea
                                                    rows="3"
                                                    className="form-control form-control-sm"
                                                    value={pillar.description || ''}
                                                    onChange={(e) => handlePillarChange(index, 'description', e.target.value)}
                                                    placeholder="How we uphold this value..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button Bar */}
                    <div className="card shadow-sm border-0 rounded-4 p-3 d-flex flex-row justify-content-end align-items-center gap-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-success px-4 py-2 rounded-3 fw-bold d-inline-flex align-items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"></span>
                                    <span>Saving Changes...</span>
                                </>
                            ) : (
                                <>
                                    <i className="ri ri-save-line"></i>
                                    <span>Save About Us Details</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
