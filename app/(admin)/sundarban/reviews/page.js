'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import {
    getSundarbanReviewsUrl,
    createSundarbanReviewUrl,
    updateSundarbanReviewUrl,
    deleteSundarbanReviewUrl
} from '@/app/routes/sundarbanRoutes';

export default function SundarbanReviewsPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingReview, setEditingReview] = useState(null);

    const [formData, setFormData] = useState({
        author_name: '',
        author_role: 'Google Reviewer',
        author_image: '',
        rating: 5,
        review_date: '',
        title: '',
        review_text: '',
        google_review_url: 'https://www.google.com/search?q=Delta+Safari+Reviews',
        is_featured: 1,
        is_active: 1,
        sort_order: 0
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef(null);

    const fetchReviews = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosGet(getSundarbanReviewsUrl + '?all=true', token);
            if (res && res.status) {
                setReviews(res.reviews || []);
            }
        } catch (err) {
            showMessage(err?.message || "Failed to load reviews", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [token]);

    const openCreateModal = () => {
        setEditingReview(null);
        setFormData({
            author_name: '',
            author_role: 'Google Reviewer',
            author_image: '',
            rating: 5,
            review_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            title: '',
            review_text: '',
            google_review_url: 'https://www.google.com/search?q=Delta+Safari+Reviews',
            is_featured: 1,
            is_active: 1,
            sort_order: reviews.length + 1
        });
        setSelectedFile(null);
        setPreviewUrl('');
        setShowModal(true);
    };

    const openEditModal = (rev) => {
        setEditingReview(rev);
        setFormData({
            author_name: rev.author_name || '',
            author_role: rev.author_role || 'Google Reviewer',
            author_image: rev.author_image || '',
            rating: rev.rating || 5,
            review_date: rev.review_date || '',
            title: rev.title || '',
            review_text: rev.review_text || '',
            google_review_url: rev.google_review_url || '',
            is_featured: rev.is_featured !== undefined ? rev.is_featured : 1,
            is_active: rev.is_active !== undefined ? rev.is_active : 1,
            sort_order: rev.sort_order || 0
        });
        setSelectedFile(null);
        setPreviewUrl(getAvatarSource(rev.author_image, rev.author_name));
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
        if (!formData.author_name.trim() || !formData.review_text.trim()) {
            showMessage("Please fill in reviewer name and review comments", "warning");
            return;
        }

        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('author_name', formData.author_name);
            data.append('author_role', formData.author_role);
            data.append('rating', formData.rating);
            data.append('review_date', formData.review_date);
            data.append('title', formData.title || '');
            data.append('review_text', formData.review_text);
            data.append('google_review_url', formData.google_review_url || '');
            data.append('is_featured', formData.is_featured);
            data.append('is_active', formData.is_active);
            data.append('sort_order', formData.sort_order || 0);

            if (selectedFile) {
                data.append('image', selectedFile);
            } else if (formData.author_image) {
                data.append('author_image', formData.author_image);
            }

            let res;
            if (editingReview?.id) {
                res = await axiosPut(updateSundarbanReviewUrl(editingReview.id), data, token, 'multipart/form-data');
            } else {
                res = await axiosPost(createSundarbanReviewUrl, data, token, 'multipart/form-data');
            }

            if (res && res.status) {
                showMessage(editingReview ? "Review updated successfully!" : "Review added successfully!", "success");
                setShowModal(false);
                fetchReviews();
            } else {
                showMessage(res?.msg || "Failed to save review", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Communication error with server", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (rev) => {
        if (!window.confirm(`Are you sure you want to delete review from "${rev.author_name}"?`)) return;
        try {
            const res = await axiosDelete(deleteSundarbanReviewUrl(rev.id), token);
            if (res && res.status) {
                showMessage("Review deleted successfully!", "success");
                setReviews(prev => prev.filter(r => r.id !== rev.id));
            } else {
                showMessage(res?.msg || "Failed to delete review", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Communication error with server", "error");
        }
    };

    const toggleStatus = async (rev) => {
        const nextStatus = rev.is_active ? 0 : 1;
        try {
            const res = await axiosPut(updateSundarbanReviewUrl(rev.id), { is_active: nextStatus }, token);
            if (res && res.status) {
                setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, is_active: nextStatus } : r));
                showMessage(`Review set to ${nextStatus ? 'Active' : 'Hidden'}`, "success");
            }
        } catch (error) {
            showMessage("Failed to update status", "error");
        }
    };

    const getAvatarSource = (img, name) => {
        if (!img) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Traveler')}&background=4285F4&color=fff&rounded=true&bold=true`;
        if (img.startsWith('http')) return img;
        if (img.startsWith('uploads/')) return `http://localhost:3002/${img}`;
        return `http://localhost/sundarban-deltasafari/${img.replace(/^\/+/, '')}`;
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-star-smile-line text-warning"></i>
                        <span>User Reviews &amp; Testimonials Manager</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Manage traveler feedback, 5-star ratings, author photos, and Google Review links featured on the website.
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn btn-success d-inline-flex align-items-center gap-2 rounded-3 shadow-sm px-3"
                >
                    <i className="ri ri-add-circle-line"></i>
                    <span>Add New Review</span>
                </button>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : reviews.length === 0 ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <i className="ri ri-star-line text-muted display-4 mb-3"></i>
                    <h5 className="text-dark fw-bold">No Reviews Yet</h5>
                    <p className="text-muted small mb-4">
                        Add traveler testimonials to boost trust and booking conversions.
                    </p>
                    <div>
                        <button onClick={openCreateModal} className="btn btn-warning rounded-3">
                            <i className="ri ri-add-line me-1"></i> Add Review
                        </button>
                    </div>
                </div>
            ) : (
                <div className="row g-4">
                    {reviews.map((rev) => {
                        const avatar = getAvatarSource(rev.author_image, rev.author_name);
                        return (
                            <div className="col-md-6 col-xl-4" key={rev.id}>
                                <div className="card shadow-sm border-0 rounded-4 h-100 p-3 p-md-4 d-flex flex-column position-relative">
                                    {/* Top Reviewer Row */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <img
                                                src={avatar}
                                                alt={rev.author_name}
                                                className="rounded-circle border"
                                                style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.author_name)}&background=4285F4&color=fff&rounded=true&bold=true`;
                                                }}
                                            />
                                            <div>
                                                <h6 className="fw-bold mb-0 text-dark">{rev.author_name}</h6>
                                                <small className="text-muted d-block">
                                                    {rev.author_role || 'Google Reviewer'} &bull; {rev.review_date || 'Recent'}
                                                </small>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <button
                                                onClick={() => toggleStatus(rev)}
                                                className={`badge border-0 cursor-pointer ${rev.is_active ? 'bg-success' : 'bg-secondary'}`}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to toggle status"
                                            >
                                                {rev.is_active ? 'Active' : 'Hidden'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Star Rating */}
                                    <div className="d-flex align-items-center gap-1 mb-2 text-warning">
                                        {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                                            <i key={i} className="ri ri-star-fill"></i>
                                        ))}
                                        <span className="text-dark small fw-bold ms-1">({rev.rating || 5}.0)</span>
                                    </div>

                                    {/* Review Title & Narrative */}
                                    {rev.title && (
                                        <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14.5px' }}>
                                            "{rev.title}"
                                        </h6>
                                    )}
                                    <p className="text-muted small flex-grow-1 mb-3" style={{ lineHeight: '1.6', fontSize: '13px' }}>
                                        {rev.review_text.length > 200 ? `${rev.review_text.slice(0, 200)}...` : rev.review_text}
                                    </p>

                                    {/* Footer Actions */}
                                    <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
                                        {rev.google_review_url ? (
                                            <a
                                                href={rev.google_review_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="small text-primary text-decoration-none d-flex align-items-center gap-1"
                                            >
                                                <img src="https://cdn.trustindex.io/assets/platform/Google/icon.svg" alt="G" style={{ width: '14px' }} />
                                                <span>Google Review</span>
                                            </a>
                                        ) : (
                                            <span className="small text-muted">Direct Testimonial</span>
                                        )}
                                        <div className="d-flex gap-1">
                                            <button
                                                onClick={() => openEditModal(rev)}
                                                className="btn btn-sm btn-outline-primary p-1 px-2 rounded-2"
                                                title="Edit Review"
                                            >
                                                <i className="ri ri-edit-line"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rev)}
                                                className="btn btn-sm btn-outline-danger p-1 px-2 rounded-2"
                                                title="Delete Review"
                                            >
                                                <i className="ri ri-delete-bin-line"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal for Add / Edit Review */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content rounded-4 border-0 shadow">
                            <div className="modal-header bg-white border-bottom py-3">
                                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                                    <i className="ri ri-star-smile-line text-warning"></i>
                                    <span>{editingReview ? 'Edit Review' : 'Add New Review'}</span>
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-close"
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-8">
                                            <div className="row g-2 mb-3">
                                                <div className="col-md-7">
                                                    <label className="form-label fw-semibold">Reviewer Name <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.author_name}
                                                        onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                                                        placeholder="e.g. Ananya Roy"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-5">
                                                    <label className="form-label fw-semibold">Reviewer Tag / Role</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.author_role}
                                                        onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                                                        placeholder="e.g. Google Reviewer"
                                                    />
                                                </div>
                                            </div>

                                            <div className="row g-2 mb-3">
                                                <div className="col-md-4">
                                                    <label className="form-label fw-semibold">Star Rating</label>
                                                    <select
                                                        className="form-select"
                                                        value={formData.rating}
                                                        onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                                                    >
                                                        <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                                                        <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                                                        <option value={3}>⭐⭐⭐ (3 Stars)</option>
                                                        <option value={2}>⭐⭐ (2 Stars)</option>
                                                        <option value={1}>⭐ (1 Star)</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label fw-semibold">Review Date</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.review_date}
                                                        onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                                                        placeholder="e.g. 15 Jan 2026"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label fw-semibold">Status</label>
                                                    <select
                                                        className="form-select"
                                                        value={formData.is_active}
                                                        onChange={(e) => setFormData({ ...formData, is_active: Number(e.target.value) })}
                                                    >
                                                        <option value={1}>Active</option>
                                                        <option value={0}>Hidden</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Review Headline / Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="e.g. Darun Experience &amp; Delicious Food!"
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Review Feedback Story <span className="text-danger">*</span></label>
                                                <textarea
                                                    rows="4"
                                                    className="form-control"
                                                    value={formData.review_text}
                                                    onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                                                    placeholder="Write the customer's full review comments..."
                                                    required
                                                ></textarea>
                                            </div>

                                            <div className="mb-0">
                                                <label className="form-label fw-semibold">Google Review Profile URL</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.google_review_url}
                                                    onChange={(e) => setFormData({ ...formData, google_review_url: e.target.value })}
                                                    placeholder="https://www.google.com/search?q=..."
                                                />
                                            </div>
                                        </div>

                                        {/* Avatar Column */}
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Reviewer Photo</label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border border-2 border-dashed rounded-4 p-3 text-center cursor-pointer mb-2 d-flex flex-column align-items-center justify-content-center"
                                                style={{ minHeight: '180px', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                                            >
                                                {previewUrl ? (
                                                    <img
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '50%' }}
                                                    />
                                                ) : (
                                                    <>
                                                        <i className="ri ri-user-smile-line text-warning display-5 mb-2"></i>
                                                        <span className="fw-semibold small d-block">Click to upload photo</span>
                                                        <small className="text-muted" style={{ fontSize: '11px' }}>JPG, PNG</small>
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
                                            <div className="mt-2">
                                                <label className="form-label small fw-semibold">Or Avatar URL</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={formData.author_image}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, author_image: e.target.value });
                                                        setPreviewUrl(e.target.value);
                                                    }}
                                                    placeholder="/images/reviewers/..."
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
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-check-line"></i>
                                                <span>{editingReview ? 'Update Review' : 'Save Review'}</span>
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
