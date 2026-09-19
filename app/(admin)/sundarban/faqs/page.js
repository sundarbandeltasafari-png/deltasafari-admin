'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import {
    getSundarbanFaqsUrl,
    createSundarbanFaqUrl,
    updateSundarbanFaqUrl,
    deleteSundarbanFaqUrl
} from '@/app/routes/sundarbanRoutes';

export default function SundarbanFaqsPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [faqs, setFaqs] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'General',
        sort_order: 1,
        is_active: 1
    });

    const categories = [
        'All',
        'General',
        'Safari & Wildlife',
        'Boats & Accommodation',
        'Permits & Timing',
        'Food & Safety',
        'Bookings & Cancellation'
    ];

    const fetchFaqs = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosGet(getSundarbanFaqsUrl + '?all=true', token);
            if (res && res.status) {
                setFaqs(res.faqs || []);
            }
        } catch (err) {
            showMessage(err?.message || "Failed to load FAQs", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, [token]);

    const openCreateModal = () => {
        setEditingFaq(null);
        setFormData({
            question: '',
            answer: '',
            category: 'General',
            sort_order: faqs.length + 1,
            is_active: 1
        });
        setShowModal(true);
    };

    const openEditModal = (faq) => {
        setEditingFaq(faq);
        setFormData({
            question: faq.question || '',
            answer: faq.answer || '',
            category: faq.category || 'General',
            sort_order: faq.sort_order || 1,
            is_active: faq.is_active !== undefined ? faq.is_active : 1
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.question.trim() || !formData.answer.trim()) {
            showMessage("Please fill in both Question and Answer fields.", "warning");
            return;
        }

        setSubmitting(true);
        try {
            let res;
            if (editingFaq?.id) {
                res = await axiosPut(updateSundarbanFaqUrl(editingFaq.id), formData, token);
            } else {
                res = await axiosPost(createSundarbanFaqUrl, formData, token);
            }

            if (res && res.status) {
                showMessage(editingFaq ? "FAQ updated successfully!" : "FAQ created successfully!", "success");
                setShowModal(false);
                fetchFaqs();
            } else {
                showMessage(res?.msg || "Failed to save FAQ", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Communication error with server", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (faq) => {
        if (!window.confirm(`Are you sure you want to delete this FAQ: "${faq.question.slice(0, 50)}..."?`)) return;
        try {
            const res = await axiosDelete(deleteSundarbanFaqUrl(faq.id), token);
            if (res && res.status) {
                showMessage("FAQ deleted successfully!", "success");
                setFaqs(prev => prev.filter(f => f.id !== faq.id));
            } else {
                showMessage(res?.msg || "Failed to delete FAQ", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Communication error with server", "error");
        }
    };

    const toggleStatus = async (faq) => {
        const nextStatus = faq.is_active ? 0 : 1;
        try {
            const res = await axiosPut(updateSundarbanFaqUrl(faq.id), { is_active: nextStatus }, token);
            if (res && res.status) {
                setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: nextStatus } : f));
                showMessage(`FAQ marked as ${nextStatus ? 'Active' : 'Inactive'}`, "success");
            }
        } catch (error) {
            showMessage("Failed to update status", "error");
        }
    };

    const filteredFaqs = selectedCategory === 'All'
        ? faqs
        : faqs.filter(f => f.category?.toLowerCase() === selectedCategory.toLowerCase());

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-question-line text-warning"></i>
                        <span>Sundarban FAQs Manager</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Manage questions and answers displayed on the live /faq page and tour booking information sections.
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn btn-success d-inline-flex align-items-center gap-2 rounded-3 shadow-sm px-3"
                >
                    <i className="ri ri-add-circle-line"></i>
                    <span>Add New FAQ</span>
                </button>
            </div>

            {/* Category Filter Chips */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
                <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex flex-wrap gap-1">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`btn btn-sm rounded-pill px-3 ${
                                    selectedCategory === cat ? 'btn-warning text-dark shadow-sm fw-bold' : 'btn-outline-secondary'
                                }`}
                            >
                                {cat}
                                {cat !== 'All' && (
                                    <span className="ms-1 small opacity-75">
                                        ({faqs.filter(f => f.category?.toLowerCase() === cat.toLowerCase()).length})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <span className="text-muted small">
                        Showing <strong>{filteredFaqs.length}</strong> of {faqs.length} FAQs
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : filteredFaqs.length === 0 ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <i className="ri ri-questionnaire-line text-muted display-4 mb-3"></i>
                    <h5 className="text-dark fw-bold">No FAQs Found</h5>
                    <p className="text-muted small mb-4">
                        {selectedCategory === 'All'
                            ? "No FAQs have been added yet. Click below to add your first FAQ."
                            : `No FAQs under "${selectedCategory}" category.`}
                    </p>
                    <div>
                        <button onClick={openCreateModal} className="btn btn-warning rounded-3">
                            <i className="ri ri-add-line me-1"></i> Add FAQ
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                    <div className="table-responsive text-nowrap">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '60px' }}>#</th>
                                    <th>Question &amp; Answer</th>
                                    <th>Category</th>
                                    <th style={{ width: '80px' }}>Order</th>
                                    <th style={{ width: '100px' }}>Status</th>
                                    <th className="text-center" style={{ width: '120px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFaqs.map((faq, index) => (
                                    <tr key={faq.id}>
                                        <td className="fw-bold text-muted">#{index + 1}</td>
                                        <td style={{ whiteSpace: 'normal', maxWidth: '480px' }}>
                                            <div className="fw-bold text-dark mb-1" style={{ fontSize: '14.5px' }}>
                                                {faq.question}
                                            </div>
                                            <div className="text-muted small" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                                {faq.answer.length > 140 ? `${faq.answer.slice(0, 140)}...` : faq.answer}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border px-2 py-1">
                                                {faq.category || 'General'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge bg-secondary">{faq.sort_order || 1}</span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleStatus(faq)}
                                                className={`badge border-0 cursor-pointer ${faq.is_active ? 'bg-success' : 'bg-danger'}`}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to toggle status"
                                            >
                                                {faq.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="text-center">
                                            <div className="d-flex justify-content-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(faq)}
                                                    className="btn btn-sm btn-outline-primary p-1 px-2 rounded-2"
                                                    title="Edit FAQ"
                                                >
                                                    <i className="ri ri-edit-line"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(faq)}
                                                    className="btn btn-sm btn-outline-danger p-1 px-2 rounded-2"
                                                    title="Delete FAQ"
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal for Add / Edit FAQ */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content rounded-4 border-0 shadow">
                            <div className="modal-header bg-white border-bottom py-3">
                                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                                    <i className="ri ri-questionnaire-line text-warning"></i>
                                    <span>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</span>
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-close"
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Question <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.question}
                                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                            placeholder="e.g. What are the chances of seeing a Royal Bengal Tiger?"
                                            required
                                        />
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Category</label>
                                            <select
                                                className="form-select"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                {categories.filter(c => c !== 'All').map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-semibold">Sort Order</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={formData.sort_order}
                                                onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-semibold">Status</label>
                                            <select
                                                className="form-select"
                                                value={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: Number(e.target.value) })}
                                            >
                                                <option value={1}>Active</option>
                                                <option value={0}>Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-0">
                                        <label className="form-label fw-semibold">Answer <span className="text-danger">*</span></label>
                                        <textarea
                                            rows="5"
                                            className="form-control"
                                            value={formData.answer}
                                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                            placeholder="Provide a detailed, helpful answer for travelers..."
                                            required
                                        ></textarea>
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
                                                <span>{editingFaq ? 'Update FAQ' : 'Create FAQ'}</span>
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
