'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import { getSundarbanContactUrl, updateSundarbanContactUrl } from '@/app/routes/sundarbanRoutes';

export default function SundarbanContactPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [contact, setContact] = useState({
        phone_1: '',
        phone_2: '',
        whatsapp_number: '',
        email: '',
        address: '',
        kolkata_office_address: '',
        godkhali_office_address: '',
        support_hours: '24/7 Available (7 Days a Week)',
        emergency_contact: '',
        map_embed_url: '',
        facebook_url: '',
        instagram_url: '',
        youtube_url: '',
        tripadvisor_url: ''
    });

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        axiosGet(getSundarbanContactUrl, token).then((res) => {
            if (res && res.status && res.contact) {
                setContact((prev) => ({
                    ...prev,
                    ...res.contact
                }));
            }
        }).catch((err) => {
            showMessage(err?.message || "Failed to load contact information", "error");
        }).finally(() => {
            setLoading(false);
        });
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setContact((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axiosPost(updateSundarbanContactUrl, contact, token);
            if (res && res.status) {
                showMessage("Sundarban contact details updated successfully!", "success");
            } else {
                showMessage(res?.msg || "Failed to update contact info", "error");
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
                        <i className="ri ri-customer-service-2-line text-danger"></i>
                        <span>Sundarban Contact &amp; Helpline Manager</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Configure customer helplines, WhatsApp live desk, Kolkata and Godkhali physical offices, and map locations.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* SECTION 1: Phone, WhatsApp & Email Helplines */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                <i className="ri ri-phone-line text-success"></i>
                                <span>Direct Helpline Numbers &amp; Email</span>
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Primary Phone Helpline</label>
                                    <input
                                        type="text"
                                        name="phone_1"
                                        value={contact.phone_1 || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="+91 98300 12345"
                                    />
                                    <small className="text-muted">Displayed in header, topbar, and contact page.</small>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Secondary Phone Helpline</label>
                                    <input
                                        type="text"
                                        name="phone_2"
                                        value={contact.phone_2 || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="+91 98300 54321"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Instant WhatsApp Desk Number</label>
                                    <input
                                        type="text"
                                        name="whatsapp_number"
                                        value={contact.whatsapp_number || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="919830012345 (with country code)"
                                    />
                                    <small className="text-muted">Powers the floating WhatsApp button and direct inquiry chat links.</small>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Customer Support Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={contact.email || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="sundarban@deltasafari.in"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Emergency / Off-Hours Helpline</label>
                                    <input
                                        type="text"
                                        name="emergency_contact"
                                        value={contact.emergency_contact || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="+91 98300 99999"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Support Desk Operating Hours</label>
                                    <input
                                        type="text"
                                        name="support_hours"
                                        value={contact.support_hours || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="e.g. 24/7 Available (7 Days a Week) or 8:00 AM - 10:00 PM"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Physical Office Addresses */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                <i className="ri ri-building-2-line text-primary"></i>
                                <span>Boarding Jetty &amp; Kolkata City Offices</span>
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Godkhali Ferry Ghat &amp; Boarding Jetty Address</label>
                                    <textarea
                                        rows="3"
                                        name="address"
                                        value={contact.address || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Godkhali Ferry Ghat, Opposite Gosaba Island, South 24 Parganas, West Bengal - 743370"
                                    ></textarea>
                                    <small className="text-muted">Main embarkation point for all luxury launch vessels and houseboats.</small>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Kolkata City Booking Desk Address</label>
                                    <textarea
                                        rows="3"
                                        name="kolkata_office_address"
                                        value={contact.kolkata_office_address || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Salt Lake Sector V & Indian Museum Pickup Hub, Kolkata, West Bengal - 700091"
                                    ></textarea>
                                    <small className="text-muted">Central Kolkata consultation and AC vehicle pickup hub.</small>
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-semibold">Google Map Embed Link / URL</label>
                                    <input
                                        type="text"
                                        name="map_embed_url"
                                        value={contact.map_embed_url || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="https://www.google.com/maps/embed?pb=..."
                                    />
                                    <small className="text-muted">Optional: Iframe src URL to display on the contact page.</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Social Media Channels */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                <i className="ri ri-share-line text-info"></i>
                                <span>Official Social Media Channels</span>
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold"><i className="ri ri-facebook-fill text-primary me-1"></i> Facebook Page URL</label>
                                    <input
                                        type="text"
                                        name="facebook_url"
                                        value={contact.facebook_url || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="https://facebook.com/sundarbandeltasafari"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold"><i className="ri ri-instagram-line text-danger me-1"></i> Instagram Profile URL</label>
                                    <input
                                        type="text"
                                        name="instagram_url"
                                        value={contact.instagram_url || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="https://instagram.com/sundarbandeltasafari"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold"><i className="ri ri-youtube-line text-danger me-1"></i> YouTube Channel URL</label>
                                    <input
                                        type="text"
                                        name="youtube_url"
                                        value={contact.youtube_url || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="https://youtube.com/@sundarbandeltasafari"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold"><i className="ri ri-tripadvisor-line text-success me-1"></i> TripAdvisor URL</label>
                                    <input
                                        type="text"
                                        name="tripadvisor_url"
                                        value={contact.tripadvisor_url || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="https://tripadvisor.com/..."
                                    />
                                </div>
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
                                    <span>Save Contact Information</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
