'use client';

import React from 'react';
import Link from 'next/link';

export default function SundarbanGuidePage() {
    const liveGuideUrl = (process.env.NEXT_PUBLIC_PUBLIC_URL || 'http://localhost/sundarban-deltasafari') + '/sundarban-guide';

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1">
                            <i className="ri ri-book-read-line me-1"></i> Static Editorial Content
                        </span>
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1">
                            High Performance &amp; SEO Optimized
                        </span>
                    </div>
                    <h4 className="fw-bold mb-1 text-dark">Sundarban Safari &amp; Travel Guide</h4>
                    <p className="text-muted small mb-0">
                        Configured as a high-converting, comprehensive static editorial field guide on the frontend.
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <a 
                        href="http://localhost/sundarban-deltasafari/sundarban-guide" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm"
                    >
                        <i className="ri ri-external-link-line"></i> View Live Safari Guide
                    </a>
                </div>
            </div>

            {/* Architecture Banner */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-start border-4 border-primary">
                <div className="row align-items-center">
                    <div className="col-lg-9">
                        <h5 className="fw-bold text-dark mb-2">Static Field Guide Architecture</h5>
                        <p className="text-muted small mb-0" style={{ lineHeight: '1.7' }}>
                            The Safari Guide is maintained as a curated static editorial guide on the website rather than through fragmented dynamic database entries. This guarantees instantaneous page load speed, rich typography, zero database dependency, and maximum Google Search Rich Snippet rankings.
                        </p>
                    </div>
                    <div className="col-lg-3 text-lg-end mt-3 mt-lg-0">
                        <span className="badge bg-light text-secondary border p-2 px-3 rounded-pill text-xs">
                            <i className="ri ri-checkbox-circle-fill text-success me-1"></i> Static &amp; Fully Rendered
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Modules Overview */}
            <div className="row g-4 mb-4">
                {/* 1. Seasons */}
                <div className="col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="p-3 bg-success bg-opacity-10 text-success rounded-3 fs-4">
                                <i className="ri ri-sun-line"></i>
                            </span>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">Seasonality &amp; Weather</h6>
                                <small className="text-muted">3 Curated Wildlife Windows</small>
                            </div>
                        </div>
                        <p className="text-muted small mb-0" style={{ lineHeight: '1.7' }}>
                            Detailed breakdown of Winter Peak (Oct–Mar tiger basking), Summer Sweet-Water (Apr–Jun high pond activity), and Monsoon Emerald Season (Jul–Sep Hilsa food festival).
                        </p>
                    </div>
                </div>

                {/* 2. Tidal Dynamics */}
                <div className="col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="p-3 bg-info bg-opacity-10 text-info rounded-3 fs-4">
                                <i className="ri ri-water-percent-line"></i>
                            </span>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">The Science of Tides</h6>
                                <small className="text-muted">High Tide vs. Low Tide Dynamics</small>
                            </div>
                        </div>
                        <p className="text-muted small mb-0" style={{ lineHeight: '1.7' }}>
                            Explains how 10–15 foot tidal variations dictate wildlife sightings (Low Tide mudbank basking) and canal access (High Tide narrow creek navigation).
                        </p>
                    </div>
                </div>

                {/* 3. Watchtowers */}
                <div className="col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="p-3 bg-warning bg-opacity-10 text-warning rounded-3 fs-4">
                                <i className="ri ri-building-line"></i>
                            </span>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">5 Core Watchtowers</h6>
                                <small className="text-muted">Strategic Observation Posts</small>
                            </div>
                        </div>
                        <p className="text-muted small mb-0" style={{ lineHeight: '1.7' }}>
                            Comprehensive field profiles for Sajnekhali (Museum &amp; Permits), Sudhanyakhali (Tiger Hotspot), Dobanki (Canopy Walk), Burirdabri (Mud-walk cage), and Netidhopani.
                        </p>
                    </div>
                </div>

                {/* 4. Wildlife Big 5 */}
                <div className="col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="p-3 bg-danger bg-opacity-10 text-danger rounded-3 fs-4">
                                <i className="ri ri-shield-cross-line"></i>
                            </span>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">Mangrove "Big 5"</h6>
                                <small className="text-muted">Endemic Fauna &amp; Birds</small>
                            </div>
                        </div>
                        <p className="text-muted small mb-0" style={{ lineHeight: '1.7' }}>
                            Identifies Royal Bengal Tigers, Saltwater Crocodiles, Gangetic &amp; Irrawaddy Dolphins, Water Monitor Lizards, Chital Deer, and 8 resident Kingfisher bird species.
                        </p>
                    </div>
                </div>

                {/* 5. Transit & Routes */}
                <div className="col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="p-3 bg-primary bg-opacity-10 text-primary rounded-3 fs-4">
                                <i className="ri ri-route-line"></i>
                            </span>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">How to Reach Godkhali</h6>
                                <small className="text-muted">Transit Logistics from Kolkata</small>
                            </div>
                        </div>
                        <p className="text-muted small mb-0" style={{ lineHeight: '1.7' }}>
                            Clear step-by-step guidance for Road travel (Baruipur-Canning highway), Suburban Trains from Sealdah Station, and Airport Transfers (CCU) with jetty boarding rules.
                        </p>
                    </div>
                </div>

                {/* 6. Packing & Forest Rules */}
                <div className="col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="p-3 bg-secondary bg-opacity-10 text-secondary rounded-3 fs-4">
                                <i className="ri ri-suitcase-line"></i>
                            </span>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">Packing &amp; Forest Rules</h6>
                                <small className="text-muted">Essential Gear &amp; Do's/Don'ts</small>
                            </div>
                        </div>
                        <p className="text-muted small mb-0" style={{ lineHeight: '1.7' }}>
                            Checklists for binoculars, earthy attire, sun protection, cash/IDs, plastic ban compliance, silence protocols, and official Forest Department regulations.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-center">
                <h6 className="fw-bold text-dark mb-2">Want to review or test the live guide?</h6>
                <p className="text-muted small mb-3">
                    Click below to open the complete Safari Guide page directly on the Sundarban website.
                </p>
                <div className="d-flex justify-content-center gap-2">
                    <a 
                        href="http://localhost/sundarban-deltasafari/sundarban-guide" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-outline-primary rounded-pill px-4"
                    >
                        <i className="ri ri-eye-line me-1"></i> View Live Page (/sundarban-guide)
                    </a>
                    <Link href="/sundarban/settings" className="btn btn-outline-secondary rounded-pill px-4">
                        <i className="ri ri-settings-line me-1"></i> Website Settings
                    </Link>
                </div>
            </div>
        </div>
    );
}
