"use client"
import { createSeoPageUrl, getSeoPageUrl } from '@/app/routes/pagesRoute';
import { axiosPost, axiosPut } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import { urlDecode } from '@/libs/urlHelper';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const page = ({ onBack }) => {
    const params = useParams();
    const pageId = params?.slug
    if (!pageId) {
        redirect('/faqpages');
    }
    const token = useSelector((state) => state.adminAuth?.token);
    const route = useRouter();
    const [seoSettings, setSeoSettings] = useState({
        meta_title: '', meta_description: '', meta_keywords: '',
        og_title: '', og_description: '', page_name: '', page_id: pageId
    });
    const [loading, setLoading] = useState()


    useEffect(() => {
        axiosPost(getSeoPageUrl, { page_id: urlDecode(pageId) }, token).then((res) => {
            if (res.status && res?.seos) {
                setSeoSettings({...res?.seos, page_id: pageId})
                setLoading(false)
            } else {
                showMessage(res.msg, "error")
            }
        }).catch((err) => {
            showMessage(err.message)
        })
    }, []);

    const handleSeoChange = (e) => {
        const { name, value } = e.target;
        setSeoSettings({ ...seoSettings, [name]: value });
    };


    const handleSubmitAll = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(seoSettings).forEach(key => {
            formData.append(key, seoSettings[key]);
        });
        axiosPut(createSeoPageUrl, formData, token, 'multipart/form-data').then((res) => {
            if (res.status) {
                route.push('/seopages')
                showMessage(res?.msg, 'success')
            } else {
                showMessage(res?.msg)
            }
        }).catch((err) => {
            showMessage(err.message)
        })

    };

    return (
        <div className="container my-5" style={{ fontFamily: "'Public Sans', sans-serif" }}>
            {/* Top Navigation Row */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1"><span className="text-muted fw-light"></span> Configure FAQ</h4>
                    <p className="text-muted mb-0">Managing layouts and assets for: <strong className="text-primary">{page.page_name} Page</strong></p>
                </div>
                <button onClick={onBack} className="btn btn-outline-secondary px-3 btn-sm">
                    <i className="bi bi-arrow-left me-1"></i> Back to List
                </button>
            </div>

            <form onSubmit={handleSubmitAll}>
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-header bg-white border-bottom py-3">
                        <h5 className="mb-0 fw-semibold text-dark"><i className="bi bi-search text-warning me-2"></i>1. Search Engine Optimization (SEO Meta & OG)</h5>
                    </div>
                    <div className="card-body p-4">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">FAQ Page Meta Title</label>
                                <input type="text" className="form-control" name="meta_title" value={seoSettings.meta_title} onChange={handleSeoChange} placeholder="e.g. Frequently Asked Questions | Company Name" />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Meta Keywords</label>
                                <input type="text" className="form-control" name="meta_keywords" value={seoSettings.meta_keywords} onChange={handleSeoChange} placeholder="keywords, separated, by, commas" />
                            </div>
                            <div className="col-12 mb-3">
                                <label className="form-label fw-medium">Meta Description Summary</label>
                                <textarea className="form-control" rows="2" name="meta_description" value={seoSettings.meta_description} onChange={handleSeoChange} placeholder="Write a short summary overview targeting organic search results indexes..."></textarea>
                            </div>
                            <div className="col-md-12 mb-3">
                                <label className="form-label fw-medium">Facebook/WhatsApp Share Title (OG)</label>
                                <input type="text" className="form-control" name="og_title" value={seoSettings.og_title} onChange={handleSeoChange} />
                            </div>
                        </div>
                    </div>
                </div>
                {/* COMPONENT SECTION 2: DYNAMIC MULTIPLE FAQ FIELDS BLOCK */}
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-footer bg-white border-top text-end p-3">
                        <button type="submit" className="btn btn-primary px-5" style={{ backgroundColor: '#696cff', borderColor: '#696cff' }}>
                            Save SEO
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default page;