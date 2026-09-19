'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SundarbanNavTabs() {
    const pathname = usePathname();

    const tabs = [
        { name: 'Safari Guide', href: '/sundarban/guide', icon: 'ri-compass-3-line' },
        { name: 'Gallery', href: '/sundarban/gallery', icon: 'ri-gallery-line' },
        { name: 'About Us', href: '/sundarban/about', icon: 'ri-information-line' },
        { name: 'FAQs', href: '/sundarban/faqs', icon: 'ri-question-line' },
        { name: 'Contact Info', href: '/sundarban/contact', icon: 'ri-customer-service-2-line' },
        { name: 'User Reviews', href: '/sundarban/reviews', icon: 'ri-star-smile-line' },
        { name: 'All Page SEO', href: '/sundarban/seo', icon: 'ri-search-eye-line' },
        { name: 'Settings', href: '/sundarban/settings', icon: 'ri-settings-4-line' },
    ];

    return (
        <div className="card shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
            <div className="card-body p-2 bg-white">
                <div className="d-flex flex-wrap gap-1 align-items-center">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`btn btn-sm d-inline-flex align-items-center gap-2 rounded-3 px-3 py-2 text-decoration-none transition-all ${
                                    isActive
                                        ? 'btn-success text-white shadow-sm fw-bold'
                                        : 'btn-outline-light text-secondary border-0 bg-transparent hover-bg-light'
                                }`}
                                style={{
                                    fontSize: '13.5px',
                                    backgroundColor: isActive ? '#198754' : 'transparent'
                                }}
                            >
                                <i className={`ri ${tab.icon} ${isActive ? 'text-white' : 'text-success'}`}></i>
                                <span>{tab.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
