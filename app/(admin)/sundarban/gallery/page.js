'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import {
    getSundarbanGalleryUrl,
    createSundarbanGalleryUrl,
    updateSundarbanGalleryUrl,
    deleteSundarbanGalleryUrl
} from '@/app/routes/sundarbanRoutes';

export default function SundarbanGalleryPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [gallery, setGallery] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        caption: '',
        category: 'Wildlife',
        image_url: '',
        sort_order: 0,
        is_active: 1
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef(null);

    const categories = [
        'All',
        'Wildlife',
        'River & Mangroves',
        'Boats & Houseboats',
        'Watchtowers & Villages',
        'Sunsets & Landscapes'
    ];

    const fetchGallery = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosGet(getSundarbanGalleryUrl + '?all=true', token);
            if (res && res.status) {
                setGallery(res.gallery || []);
            }
        } catch (err) {
            showMessage(err?.message || "Failed to load gallery items", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, [token]);

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({
            title: '',
            caption: '',
            category: 'Wildlife',
            image_url: '',
            sort_order: gallery.length + 1,
            is_active: 1
        });
        setSelectedFile(null);
        setPreviewUrl('');
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            title: item.title || '',
            caption: item.caption || '',
            category: item.category || 'Wildlife',
            image_url: item.image_url || '',
            sort_order: item.sort_order || 0,
            is_active: item.is_active !== undefined ? item.is_active : 1
        });
        setSelectedFile(null);
        setPreviewUrl(getImageSource(item.image_url));
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
        if (!formData.title) {
            showMessage("Please enter an image title", "warning");
            return;
        }
        if (!selectedFile && !formData.image_url) {
            showMessage("Please select an image file or provide an image URL", "warning");
            return;
        }

        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('caption', formData.caption || '');
            data.append('category', formData.category || 'Wildlife');
            data.append('sort_order', formData.sort_order || 0);
            data.append('is_active', formData.is_active);

            if (selectedFile) {
                data.append('image', selectedFile);
            } else if (formData.image_url) {
                data.append('image_url', formData.image_url);
            }

            let res;
            if (editingItem?.id) {
                res = await axiosPut(updateSundarbanGalleryUrl(editingItem.id), data, token, 'multipart/form-data');
            } else {
                res = await axiosPost(createSundarbanGalleryUrl, data, token, 'multipart/form-data');
            }

            if (res && res.status) {
                showMessage(editingItem ? "Gallery photo updated successfully!" : "Gallery photo added successfully!", "success");
                setShowModal(false);
                fetchGallery();
            } else {
                showMessage(res?.msg || "Failed to save gallery photo", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Communication error with server", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;
        try {
            const res = await axiosDelete(deleteSundarbanGalleryUrl(item.id), token);
            if (res && res.status) {
                showMessage("Gallery photo deleted successfully!", "success");
                setGallery(prev => prev.filter(g => g.id !== item.id));
            } else {
                showMessage(res?.msg || "Failed to delete photo", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Communication error with server", "error");
        }
    };

    const toggleStatus = async (item) => {
        const nextStatus = item.is_active ? 0 : 1;
        try {
            const res = await axiosPut(updateSundarbanGalleryUrl(item.id), { is_active: nextStatus }, token);
            if (res && res.status) {
                setGallery(prev => prev.map(g => g.id === item.id ? { ...g, is_active: nextStatus } : g));
                showMessage(`Photo status set to ${nextStatus ? 'Active' : 'Inactive'}`, "success");
            }
        } catch (error) {
            showMessage("Failed to update status", "error");
        }
    };

    const getImageSource = (url) => {
        if (!url) return '/images/placeholder.jpg';
        if (url.startsWith('http')) return url;
        if (url.startsWith('uploads/')) return `http://localhost:3002/${url}`;
        return `http://localhost/sundarban-deltasafari/${url.replace(/^\/+/, '')}`;
    };

    const filteredGallery = activeCategory === 'All'
        ? gallery
        : gallery.filter(item => item.category?.toLowerCase() === activeCategory.toLowerCase());

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-gallery-line text-primary"></i>
                        <span>Sundarban Gallery Manager</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Upload and manage photos &amp; videos displayed on the /gallery page and website showcases.
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn btn-success d-inline-flex align-items-center gap-2 rounded-3 shadow-sm px-3"
                >
                    <i className="ri ri-add-circle-line"></i>
                    <span>Add New Photo</span>
                </button>
            </div>

            {/* Category Filter Chips */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
                <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex flex-wrap gap-1">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`btn btn-sm rounded-pill px-3 ${
                                    activeCategory === cat ? 'btn-primary shadow-sm fw-bold' : 'btn-outline-secondary'
                                }`}
                            >
                                {cat}
                                {cat !== 'All' && (
                                    <span className="ms-1 small opacity-75">
                                        ({gallery.filter(g => g.category?.toLowerCase() === cat.toLowerCase()).length})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <span className="text-muted small">
                        Showing <strong>{filteredGallery.length}</strong> of {gallery.length} photos
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : filteredGallery.length === 0 ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <i className="ri ri-image-line text-muted display-4 mb-3"></i>
                    <h5 className="text-dark fw-bold">No Photos Found</h5>
                    <p className="text-muted small mb-4">
                        {activeCategory === 'All'
                            ? "No photos have been uploaded yet. Click below to add your first photo."
                            : `No photos under "${activeCategory}" category.`}
                    </p>
                    <div>
                        <button onClick={openCreateModal} className="btn btn-primary rounded-3">
                            <i className="ri ri-upload-cloud-line me-1"></i> Upload Photo
                        </button>
                    </div>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredGallery.map((item) => {
                        const imgUrl = getImageSource(item.image_url);
                        return (
                            <div className="col-sm-6 col-md-4 col-xl-3" key={item.id}>
                                <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100 position-relative group-card">
                                    <div style={{ height: '200px', backgroundColor: '#f1f5f9', position: 'relative' }}>
                                        <img
                                            src={imgUrl}
                                            alt={item.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop';
                                            }}
                                        />
                                        <div className="position-absolute top-0 start-0 p-2">
                                            <span className="badge bg-dark bg-opacity-75 text-white" style={{ fontSize: '11px' }}>
                                                {item.category || 'Wildlife'}
                                            </span>
                                        </div>
                                        <div className="position-absolute top-0 end-0 p-2">
                                            <button
                                                onClick={() => toggleStatus(item)}
                                                className={`badge border-0 cursor-pointer ${item.is_active ? 'bg-success' : 'bg-danger'}`}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to toggle active status"
                                            >
                                                {item.is_active ? 'Active' : 'Hidden'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card-body p-3 d-flex flex-column">
                                        <h6 className="fw-bold mb-1 text-dark text-truncate" title={item.title}>
                                            {item.title}
                                        </h6>
                                        <p className="text-muted small flex-grow-1 mb-3 text-truncate-2" style={{ minHeight: '36px', fontSize: '12.5px' }}>
                                            {item.caption || 'No caption provided.'}
                                        </p>

                                        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                            <span className="text-muted small">Order: #{item.sort_order}</span>
                                            <div className="d-flex gap-1">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="btn btn-sm btn-outline-primary p-1 px-2 rounded-2"
                                                    title="Edit Photo"
                                                >
                                                    <i className="ri ri-edit-line"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="btn btn-sm btn-outline-danger p-1 px-2 rounded-2"
                                                    title="Delete Photo"
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal for Add / Edit Gallery Photo */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content rounded-4 border-0 shadow">
                            <div className="modal-header bg-white border-bottom py-3">
                                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                                    <i className="ri ri-image-add-line text-success"></i>
                                    <span>{editingItem ? 'Edit Gallery Photo' : 'Add New Gallery Photo'}</span>
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
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Photo Title <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="e.g. Royal Bengal Tiger in Untamed Mangroves"
                                                    required
                                                />
                                            </div>

                                            <div className="row g-2 mb-3">
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
                                                        onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
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
                                                        <option value={0}>Hidden</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Caption / Subtitle</label>
                                                <textarea
                                                    rows="3"
                                                    className="form-control"
                                                    value={formData.caption}
                                                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                                                    placeholder="Brief description of the photo or location..."
                                                ></textarea>
                                            </div>

                                            <div className="mb-0">
                                                <label className="form-label fw-semibold">Or Image URL (if not uploading a file)</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.image_url}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, image_url: e.target.value });
                                                        setPreviewUrl(e.target.value);
                                                    }}
                                                    placeholder="/images/... or https://..."
                                                />
                                            </div>
                                        </div>

                                        {/* Image Upload & Preview Column */}
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Upload Photo File</label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border border-2 border-dashed rounded-4 p-3 text-center cursor-pointer mb-2 d-flex flex-column align-items-center justify-content-center"
                                                style={{ minHeight: '210px', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                                            >
                                                {previewUrl ? (
                                                    <img
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px' }}
                                                    />
                                                ) : (
                                                    <>
                                                        <i className="ri ri-upload-cloud-2-line text-success display-5 mb-2"></i>
                                                        <span className="fw-semibold small d-block">Click to browse file</span>
                                                        <small className="text-muted" style={{ fontSize: '11px' }}>JPG, PNG, WEBP up to 50MB</small>
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
                                            {selectedFile && (
                                                <small className="text-success d-block text-truncate">
                                                    <i className="ri ri-check-line me-1"></i>
                                                    {selectedFile.name}
                                                </small>
                                            )}
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
                                                <span>{editingItem ? 'Update Photo' : 'Upload Photo'}</span>
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
