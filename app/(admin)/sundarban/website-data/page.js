'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { axiosGet } from '@/libs/axiosHelper';
import {
    getSundarbanGalleryUrl,
    getSundarbanFaqsUrl,
    getSundarbanReviewsUrl,
    getSundarbanSeoUrl,
    getSundarbanSettingsUrl
} from '@/app/routes/sundarbanRoutes';

export default function SundarbanWebsiteDataHubPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [counts, setCounts] = useState({
        gallery: 0,
        faqs: 0,
        reviews: 0,
        avgRating: 5.0,
        seoPages: 0,
        siteTitle: 'Sundarban Delta Safari'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        setLoading(true);

        Promise.allSettled([
            axiosGet(getSundarbanGalleryUrl + '?all=true', token),
            axiosGet(getSundarbanFaqsUrl + '?all=true', token),
            axiosGet(getSundarbanReviewsUrl + '?all=true', token),
            axiosGet(getSundarbanSeoUrl, token),
            axiosGet(getSundarbanSettingsUrl, token)
        ]).then(([galleryRes, faqsRes, reviewsRes, seoRes, settingsRes]) => {
            const galleryList = galleryRes.value?.status ? galleryRes.value.gallery || [] : [];
            const faqsList = faqsRes.value?.status ? faqsRes.value.faqs || [] : [];
            const reviewsList = reviewsRes.value?.status ? reviewsRes.value.reviews || [] : [];
            const seoList = seoRes.value?.status ? seoRes.value.pages || [] : [];
            const settingsData = settingsRes.value?.status ? settingsRes.value.settings || {} : {};

            let avg = 5.0;
            if (reviewsList.length > 0) {
                const total = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
                avg = (total / reviewsList.length).toFixed(1);
            }

            setCounts({
                gallery: galleryList.length,
                faqs: faqsList.length,
                reviews: reviewsList.length,
                avgRating: avg,
                seoPages: seoList.length,
                siteTitle: settingsData.site_title || 'Sundarban Delta Safari'
            });
        }).finally(() => {
            setLoading(false);
        });
    }, [token]);

    const managementModules = [
        {
            title: 'Safari & Travel Guide',
            description: 'Manage travel calendar, best seasons (winter, summer, monsoon), ways to reach Godkhali from Kolkata, watchtower details, and safety rules.',
            icon: 'ri-compass-3-line',
            color: 'text-success',
            badge: 'Content',
            href: '/sundarban/guide',
            btnText: 'Manage Safari Guide'
        },
        {
            title: 'Wildlife & Boat Gallery',
            description: 'Upload high-res photos of tigers, saltwater crocodiles, luxury houseboats, watchtowers, and river sunsets with categories and captions.',
            icon: 'ri-gallery-line',
            color: 'text-primary',
            badge: `${counts.gallery} Images`,
            href: '/sundarban/gallery',
            btnText: 'Manage Gallery'
        },
        {
            title: 'About Us & Company Story',
            description: 'Configure brand philosophy, 3 core pillars of Delta Safari, mission & vision, years in operation, and happy traveler counts.',
            icon: 'ri-information-line',
            color: 'text-info',
            badge: 'Story & Mission',
            href: '/sundarban/about',
            btnText: 'Manage About Us'
        },
        {
            title: 'Frequently Asked Questions',
            description: 'Add, organize, and categorize traveler questions about permits, boat safety, wildlife sighting chances, meals, and cancellation policies.',
            icon: 'ri-question-line',
            color: 'text-warning',
            badge: `${counts.faqs} FAQs`,
            href: '/sundarban/faqs',
            btnText: 'Manage FAQs'
        },
        {
            title: 'Contact Details & Helplines',
            description: 'Update customer service phone numbers, WhatsApp desk, Kolkata & Godkhali boarding jetty addresses, office hours, and map embeds.',
            icon: 'ri-customer-service-2-line',
            color: 'text-danger',
            badge: 'Direct Channels',
            href: '/sundarban/contact',
            btnText: 'Manage Contact Info'
        },
        {
            title: 'User Reviews & Ratings',
            description: 'Manage verified traveler testimonials, reviewer avatars, star ratings (1-5), review comments, dates, and Google Review profile links.',
            icon: 'ri-star-smile-line',
            color: 'text-warning',
            badge: `${counts.reviews} Reviews (${counts.avgRating}★)`,
            href: '/sundarban/reviews',
            btnText: 'Manage Reviews'
        },
        {
            title: 'All Page SEO Details',
            description: 'Fine-tune Meta Titles, Meta Descriptions, Focus Keywords, and OpenGraph social share previews for every single page of the website.',
            icon: 'ri-search-eye-line',
            color: 'text-success',
            badge: `${counts.seoPages} Pages`,
            href: '/sundarban/seo',
            btnText: 'Manage Page SEO'
        },
        {
            title: 'General Website Settings',
            description: 'Customize global branding, hero badges, main headings, introductory story paragraph, social media handles, and footer disclaimers.',
            icon: 'ri-settings-4-line',
            color: 'text-secondary',
            badge: 'Global Settings',
            href: '/sundarban/settings',
            btnText: 'Website Settings'
        }
    ];

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-apps-2-line text-success"></i>
                        <span>Sundarban Website Data Manager</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Central control hub to manage all live website content, guide, media, FAQs, reviews, contacts, and page SEO for Sundarban Delta Safari.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <a
                        href="http://localhost/sundarban-deltasafari/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1 shadow-sm rounded-3"
                    >
                        <i className="ri ri-external-link-line"></i>
                        <span>Preview Live Website</span>
                    </a>
                </div>
            </div>

            {/* Top Quick Stats Row */}
            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body p-3 d-flex align-items-center gap-3">
                            <div className="rounded-3 p-3 bg-success bg-opacity-10 text-success fs-3 d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                                <i className="ri ri-gallery-line"></i>
                            </div>
                            <div>
                                <span className="text-muted small d-block">Gallery Captures</span>
                                <h4 className="mb-0 fw-bold text-dark">{loading ? '...' : counts.gallery}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body p-3 d-flex align-items-center gap-3">
                            <div className="rounded-3 p-3 bg-warning bg-opacity-10 text-warning fs-3 d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                                <i className="ri ri-question-line"></i>
                            </div>
                            <div>
                                <span className="text-muted small d-block">Active FAQs</span>
                                <h4 className="mb-0 fw-bold text-dark">{loading ? '...' : counts.faqs}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body p-3 d-flex align-items-center gap-3">
                            <div className="rounded-3 p-3 bg-primary bg-opacity-10 text-primary fs-3 d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                                <i className="ri ri-star-smile-line"></i>
                            </div>
                            <div>
                                <span className="text-muted small d-block">Traveler Reviews</span>
                                <h4 className="mb-0 fw-bold text-dark">{loading ? '...' : `${counts.reviews} (${counts.avgRating}★)`}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body p-3 d-flex align-items-center gap-3">
                            <div className="rounded-3 p-3 bg-info bg-opacity-10 text-info fs-3 d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                                <i className="ri ri-search-eye-line"></i>
                            </div>
                            <div>
                                <span className="text-muted small d-block">Configured Page SEO</span>
                                <h4 className="mb-0 fw-bold text-dark">{loading ? '...' : `${counts.seoPages} Pages`}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Modules Grid */}
            <div className="row g-4">
                {managementModules.map((item, index) => (
                    <div className="col-md-6 col-lg-4 col-xl-3" key={index}>
                        <div className="card shadow-sm border-0 rounded-4 h-100 transition-all hover-shadow">
                            <div className="card-body p-4 d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className={`p-3 rounded-3 bg-light fs-3 ${item.color}`}>
                                        <i className={`ri ${item.icon}`}></i>
                                    </div>
                                    <span className="badge bg-light text-muted border px-2 py-1 small">
                                        {item.badge}
                                    </span>
                                </div>
                                <h5 className="fw-bold mb-2 text-dark">{item.title}</h5>
                                <p className="text-muted small flex-grow-1 mb-4" style={{ lineHeight: '1.6' }}>
                                    {item.description}
                                </p>
                                <Link
                                    href={item.href}
                                    className="btn btn-outline-success btn-sm w-100 rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                                >
                                    <span>{item.btnText}</span>
                                    <i className="ri ri-arrow-right-line"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
