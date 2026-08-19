"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Link from 'next/link';
import { createHotelUrl, getAllCityUrl, getAllZoneUrl } from '@/app/routes/serviceRoutes';
import { getAllPackageUrl } from '@/app/routes/packageRoutes';
import EditorTinyMCE from '@/components/blogs/EditorTinyMCE';
import MetaComponent from '@/components/seocomponent/MetaComponent';
import { showMessage, scrollToView } from '@/libs/commonHelper';
import { axiosGet } from '@/libs/axiosHelper';

const PRESET_AMENITIES = [
    "Free High-Speed Wi-Fi",
    "Air Conditioned Rooms",
    "Swimming Pool",
    "Multi-Cuisine Restaurant",
    "24/7 Power Backup",
    "Safari Boat Transfer",
    "River View Balcony",
    "24/7 Room Service",
    "Complimentary Breakfast",
    "Spa & Wellness Center",
    "Campfire & Cultural Baul Show",
    "Hot Water Geyser",
    "Tea / Coffee Maker",
    "Children Play Area",
    "Free Parking",
    "Doctor on Call",
    "Forest View Deck",
    "CCTV & 24/7 Security"
];

const HOTEL_TYPES = [
    "Eco Resort",
    "Resort",
    "Luxury Hotel",
    "Riverside Retreat",
    "Luxury Houseboat",
    "Heritage Stay",
    "Boutique Hotel",
    "Nature Cottage",
    "Standard Hotel"
];

export default function AddHotelPage() {
    const [formData, setFormData] = useState({
        name: '',
        star_rating: 4,
        hotel_type: 'Eco Resort',
        city_id: '',
        city_name: '',
        zone_id: '',
        zone_name: '',
        address: '',
        starting_price: '',
        check_in_time: '12:00 PM',
        check_out_time: '11:00 AM',
        contact_number: '',
        contact_email: '',
        description: '',
        status: 1,
        meta_title: '',
        meta_description: '',
        tags: []
    });

    const [selectedAmenities, setSelectedAmenities] = useState([
        "Free High-Speed Wi-Fi",
        "Air Conditioned Rooms",
        "Multi-Cuisine Restaurant",
        "24/7 Power Backup",
        "Safari Boat Transfer",
        "River View Balcony"
    ]);
    const [customAmenityInput, setCustomAmenityInput] = useState('');

    const [roomTypes, setRoomTypes] = useState([
        { name: "Deluxe AC Room", price: 2800, features: "King Bed, River View Balcony, AC, Attached Bath" },
        { name: "Executive Suite", price: 4200, features: "Private Balcony, Bathtub, Garden View, Minibar" }
    ]);

    const [packagesList, setPackagesList] = useState([]);
    const [packageSearch, setPackageSearch] = useState('');
    const [selectedPackageIds, setSelectedPackageIds] = useState([]);

    const [cities, setCities] = useState([]);
    const [zones, setZones] = useState([]);

    const [mainImage, setMainImage] = useState(null);
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const token = useSelector((state) => state.adminAuth?.token);
    const router = useRouter();

    const mainImageRef = useRef(null);
    const galleryImageRef = useRef(null);

    useEffect(() => {
        // Fetch Cities
        axiosGet(getAllCityUrl, token).then((res) => {
            if (res?.status && res?.cities) setCities(res.cities);
        }).catch(console.error);

        // Fetch Zones / Destinations
        axiosGet(getAllZoneUrl, token).then((res) => {
            if (res?.status && res?.zone) setZones(res.zone);
        }).catch(console.error);

        // Fetch All Packages for Linking
        axiosGet(getAllPackageUrl, token).then((res) => {
            if (res?.status && res?.packages) {
                setPackagesList(res.packages);
            }
        }).catch(console.error);
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCityChange = (e) => {
        const cityId = e.target.value;
        const selectedCity = cities.find(c => String(c.id) === String(cityId));
        setFormData(prev => ({
            ...prev,
            city_id: cityId,
            city_name: selectedCity ? selectedCity.name : ''
        }));
    };

    const handleZoneChange = (e) => {
        const zoneId = e.target.value;
        const selectedZone = zones.find(z => String(z.id) === String(zoneId));
        setFormData(prev => ({
            ...prev,
            zone_id: zoneId,
            zone_name: selectedZone ? selectedZone.name : ''
        }));
    };

    // Toggle Amenity Selection
    const toggleAmenity = (amenity) => {
        if (selectedAmenities.includes(amenity)) {
            setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
        } else {
            setSelectedAmenities([...selectedAmenities, amenity]);
        }
    };

    // Add Custom Amenity
    const handleAddCustomAmenity = (e) => {
        if (e) e.preventDefault();
        const trimmed = customAmenityInput.trim();
        if (trimmed && !selectedAmenities.includes(trimmed)) {
            setSelectedAmenities([...selectedAmenities, trimmed]);
            setCustomAmenityInput('');
        }
    };

    // Room Types Handlers
    const handleAddRoomType = () => {
        setRoomTypes([...roomTypes, { name: '', price: '', features: '' }]);
    };

    const handleRemoveRoomType = (index) => {
        setRoomTypes(roomTypes.filter((_, i) => i !== index));
    };

    const handleRoomTypeChange = (index, field, value) => {
        const updated = [...roomTypes];
        updated[index][field] = value;
        setRoomTypes(updated);
    };

    // Package Linking Handlers
    const togglePackageSelection = (pkgId) => {
        const idNum = Number(pkgId);
        if (selectedPackageIds.includes(idNum)) {
            setSelectedPackageIds(selectedPackageIds.filter(id => id !== idNum));
        } else {
            setSelectedPackageIds([...selectedPackageIds, idNum]);
        }
    };

    const handleSelectAllPackages = () => {
        if (selectedPackageIds.length === filteredPackages.length) {
            setSelectedPackageIds([]);
        } else {
            setSelectedPackageIds(filteredPackages.map(p => Number(p.id)));
        }
    };

    const filteredPackages = packagesList.filter(pkg =>
        pkg.title && pkg.title.toLowerCase().includes(packageSearch.toLowerCase())
    );

    // Media Handlers
    const handleMainImageChange = (file) => {
        if (!file) return;
        setMainImage(file);
        setMainImagePreview(URL.createObjectURL(file));
    };

    const handleGalleryImagesChange = (files) => {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files);
        setGalleryImages(prev => [...prev, ...newFiles]);
        const newPreviews = newFiles.map(f => URL.createObjectURL(f));
        setGalleryPreviews(prev => [...prev, ...newPreviews]);
    };

    const handleRemoveGalleryImage = (index) => {
        setGalleryImages(galleryImages.filter((_, i) => i !== index));
        setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
    };

    // Form Submission
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (submitting) return;

        if (!formData.name.trim()) {
            showMessage('Hotel name is required', 'error');
            scrollToView('hotelNameField');
            return;
        }

        if (!mainImage) {
            showMessage('Please upload a featured main image for the hotel', 'error');
            scrollToView('mediaUploadSection');
            return;
        }

        setSubmitting(true);
        try {
            const uploadData = new FormData();
            uploadData.append('name', formData.name.trim());
            uploadData.append('star_rating', formData.star_rating);
            uploadData.append('hotel_type', formData.hotel_type);
            uploadData.append('city_id', formData.city_id || '');
            uploadData.append('city_name', formData.city_name || '');
            uploadData.append('zone_id', formData.zone_id || '');
            uploadData.append('zone_name', formData.zone_name || '');
            uploadData.append('address', formData.address || '');
            uploadData.append('starting_price', formData.starting_price || 0);
            uploadData.append('check_in_time', formData.check_in_time || '12:00 PM');
            uploadData.append('check_out_time', formData.check_out_time || '11:00 AM');
            uploadData.append('contact_number', formData.contact_number || '');
            uploadData.append('contact_email', formData.contact_email || '');
            uploadData.append('description', formData.description || '');
            uploadData.append('status', formData.status);
            uploadData.append('meta_title', formData.meta_title || '');
            uploadData.append('meta_description', formData.meta_description || '');
            uploadData.append('tags', Array.isArray(formData.tags) ? formData.tags.join(',') : (formData.tags || ''));

            uploadData.append('amenities', JSON.stringify(selectedAmenities));
            uploadData.append('room_types', JSON.stringify(roomTypes.filter(r => r.name.trim() !== '')));
            uploadData.append('package_ids', JSON.stringify(selectedPackageIds));

            if (mainImage) {
                uploadData.append('main_image', mainImage);
            }

            galleryImages.forEach(file => {
                uploadData.append('images[]', file);
            });

            const response = await axios.post(createHotelUrl, uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.status) {
                showMessage('Hotel created and linked successfully!', 'success');
                router.push('/hotels');
            } else {
                showMessage(response.data?.msg || 'Failed to create hotel', 'error');
            }
        } catch (error) {
            console.error('Error creating hotel:', error);
            showMessage(error?.response?.data?.msg || error.message || 'Error creating hotel', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">

            {/* Header Breadcrumb */}
            <div className="d-flex align-items-center mb-6 gap-3">
                <Link href="/hotels" className="btn btn-icon btn-outline-secondary rounded-pill">
                    <i className="ri-arrow-left-line fs-4"></i>
                </Link>
                <div>
                    <h4 className="fw-semibold mb-0">Add New Hotel / Reference Stay</h4>
                    <p className="text-muted small mb-0">
                        Create hotel profile, configure amenities, room types, and link to tour packages
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row g-6">

                    {/* Left 8 Columns: Form Specifications */}
                    <div className="col-12 col-lg-8">

                        {/* Basic Information Card */}
                        <div id="hotelNameField" className="card border-0 shadow-sm mb-6 rounded-3">
                            <div className="card-header bg-white border-bottom py-4">
                                <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                                    <i className="ri-hotel-line text-primary"></i>
                                    <span>Hotel Information</span>
                                </h5>
                            </div>
                            <div className="card-body py-5">
                                <div className="row g-4">

                                    <div className="col-12 col-md-8">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Hotel / Resort Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control form-control-lg"
                                            placeholder="e.g. Sundarban Tiger Camp Eco Resort"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Hotel Type
                                        </label>
                                        <select
                                            name="hotel_type"
                                            className="form-select form-select-lg"
                                            value={formData.hotel_type}
                                            onChange={handleInputChange}
                                        >
                                            {HOTEL_TYPES.map((type, i) => (
                                                <option key={i} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Star Rating
                                        </label>
                                        <select
                                            name="star_rating"
                                            className="form-select form-select-lg"
                                            value={formData.star_rating}
                                            onChange={handleInputChange}
                                        >
                                            <option value="5">5 Star Luxury</option>
                                            <option value="4">4 Star Deluxe</option>
                                            <option value="3">3 Star Standard</option>
                                            <option value="2">2 Star Budget</option>
                                            <option value="1">1 Star Basic</option>
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Starting Price (₹ / night)
                                        </label>
                                        <div className="input-group input-group-merge">
                                            <span className="input-group-text">₹</span>
                                            <input
                                                type="number"
                                                name="starting_price"
                                                className="form-control form-control-lg"
                                                placeholder="2500"
                                                value={formData.starting_price}
                                                onChange={handleInputChange}
                                                onWheel={(e) => e.target.blur()}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Status
                                        </label>
                                        <div className="form-check form-switch mt-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                id="hotelStatusSwitch"
                                                name="status"
                                                checked={Number(formData.status) === 1}
                                                onChange={handleInputChange}
                                                style={{ width: '2.8em', height: '1.4em' }}
                                            />
                                            <label className="form-check-label ms-2 mt-1 fw-medium" htmlFor="hotelStatusSwitch">
                                                {Number(formData.status) === 1 ? 'Active & Visible' : 'Disabled'}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Location specifications */}
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            City / Hub
                                        </label>
                                        <select
                                            name="city_id"
                                            className="form-select form-select-lg"
                                            value={formData.city_id}
                                            onChange={handleCityChange}
                                        >
                                            <option value="">-- Select City (Optional) --</option>
                                            {cities.map((city) => (
                                                <option key={city.id} value={city.id}>{city.name} ({city.state})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Destination / Zone
                                        </label>
                                        <select
                                            name="zone_id"
                                            className="form-select form-select-lg"
                                            value={formData.zone_id}
                                            onChange={handleZoneChange}
                                        >
                                            <option value="">-- Select Destination (Optional) --</option>
                                            {zones.map((zone) => (
                                                <option key={zone.id} value={zone.id}>{zone.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Full Address / Location Details
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            className="form-control form-control-lg"
                                            placeholder="e.g. Dayapur Island, Opposite Sajnekhali Watch Tower, Gosaba, Sundarban"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    {/* Timings & Contacts */}
                                    <div className="col-12 col-md-3">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Check-in Time
                                        </label>
                                        <input
                                            type="text"
                                            name="check_in_time"
                                            className="form-control"
                                            placeholder="12:00 PM"
                                            value={formData.check_in_time}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Check-out Time
                                        </label>
                                        <input
                                            type="text"
                                            name="check_out_time"
                                            className="form-control"
                                            placeholder="11:00 AM"
                                            value={formData.check_out_time}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Phone / Support
                                        </label>
                                        <input
                                            type="text"
                                            name="contact_number"
                                            className="form-control"
                                            placeholder="+91 98765 43210"
                                            value={formData.contact_number}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="contact_email"
                                            className="form-control"
                                            placeholder="stay@deltasafari.com"
                                            value={formData.contact_email}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Amenities Configuration Card */}
                        <div className="card border-0 shadow-sm mb-6 rounded-3">
                            <div className="card-header bg-white border-bottom py-4 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                                    <i className="ri-cup-line text-success"></i>
                                    <span>Hotel Amenities & Highlights</span>
                                </h5>
                                <span className="badge bg-label-success fw-bold">
                                    {selectedAmenities.length} Selected
                                </span>
                            </div>
                            <div className="card-body py-5">
                                <p className="text-muted small mb-3">
                                    Click any preset chip to toggle, or type custom amenity below:
                                </p>

                                <div className="d-flex flex-wrap gap-2 mb-4">
                                    {PRESET_AMENITIES.map((amenity, idx) => {
                                        const isSelected = selectedAmenities.includes(amenity);
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleAmenity(amenity)}
                                                className={`btn btn-sm rounded-pill px-3 py-2 transition-all ${isSelected
                                                    ? 'btn-success text-white shadow-sm'
                                                    : 'btn-outline-secondary'
                                                    }`}
                                                style={{ fontSize: '12px' }}
                                            >
                                                <i className={`ri-${isSelected ? 'check-line' : 'add-line'} me-1`}></i>
                                                {amenity}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Custom Amenity Add Box */}
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Add custom amenity (e.g. Electric Kettle, Riverfront Hammock, Bird Watching Deck)..."
                                        value={customAmenityInput}
                                        onChange={(e) => setCustomAmenityInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomAmenity(); } }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomAmenity}
                                        className="btn btn-outline-primary px-4 fw-semibold"
                                    >
                                        <i className="ri-add-circle-line me-1"></i> Add Amenity
                                    </button>
                                </div>

                                {selectedAmenities.filter(a => !PRESET_AMENITIES.includes(a)).length > 0 && (
                                    <div className="mt-3 d-flex flex-wrap gap-2 align-items-center">
                                        <small className="text-muted fw-bold">Custom Added:</small>
                                        {selectedAmenities.filter(a => !PRESET_AMENITIES.includes(a)).map((customA, ci) => (
                                            <span key={ci} className="badge bg-primary px-2.5 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5">
                                                <span>{customA}</span>
                                                <i
                                                    className="ri-close-line cursor-pointer"
                                                    onClick={() => toggleAmenity(customA)}
                                                ></i>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Room Types Builder Card */}
                        <div className="card border-0 shadow-sm mb-6 rounded-3">
                            <div className="card-header bg-white border-bottom py-4 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                                    <i className="ri-hotel-bed-line text-warning"></i>
                                    <span>Room Categories & Pricing</span>
                                </h5>
                                <button
                                    type="button"
                                    onClick={handleAddRoomType}
                                    className="btn btn-sm btn-outline-warning rounded-pill px-3 fw-semibold"
                                >
                                    <i className="ri-add-line me-1"></i> Add Room Type
                                </button>
                            </div>
                            <div className="card-body py-4">
                                {roomTypes.map((room, rIdx) => (
                                    <div key={rIdx} className="p-3 mb-3 bg-light rounded-3 border position-relative">
                                        <div className="row g-3 align-items-center">
                                            <div className="col-md-4">
                                                <label className="form-label text-muted small fw-bold mb-1">Room Category Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-white"
                                                    placeholder="e.g. Deluxe AC Cottage"
                                                    value={room.name}
                                                    onChange={(e) => handleRoomTypeChange(rIdx, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label text-muted small fw-bold mb-1">Price (₹ / night)</label>
                                                <input
                                                    type="number"
                                                    className="form-control bg-white"
                                                    placeholder="2800"
                                                    value={room.price}
                                                    onChange={(e) => handleRoomTypeChange(rIdx, 'price', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label text-muted small fw-bold mb-1">Key Features</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-white"
                                                    placeholder="King Bed, River View, AC"
                                                    value={room.features}
                                                    onChange={(e) => handleRoomTypeChange(rIdx, 'features', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-1 text-end pt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRoomType(rIdx)}
                                                    className="btn btn-icon btn-sm btn-outline-danger rounded-circle"
                                                    title="Remove Room Type"
                                                >
                                                    <i className="ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LINK TO MULTIPLE PACKAGES CARD (Many-to-Many) */}
                        <div className="card border-0 shadow-sm mb-6 rounded-3">
                            <div className="card-header bg-white border-bottom py-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                                        <i className="ri-links-line text-info"></i>
                                        <span>Link Reference Hotel to Tour Packages</span>
                                    </h5>
                                    <p className="text-muted small mb-0">
                                        Select which packages will feature this hotel on their package details page
                                    </p>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-label-info fw-bold px-2.5 py-1">
                                        {selectedPackageIds.length} Linked
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleSelectAllPackages}
                                        className="btn btn-xs btn-outline-secondary rounded-pill"
                                    >
                                        {selectedPackageIds.length === filteredPackages.length && filteredPackages.length > 0
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </button>
                                </div>
                            </div>
                            <div className="card-body py-4">
                                {/* Search Package */}
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Filter tour packages by title..."
                                        value={packageSearch}
                                        onChange={(e) => setPackageSearch(e.target.value)}
                                    />
                                </div>

                                <div
                                    className="border rounded-3 p-3 bg-light overflow-auto"
                                    style={{ maxHeight: '280px' }}
                                >
                                    {filteredPackages.length === 0 ? (
                                        <p className="text-muted small text-center my-3">No packages found.</p>
                                    ) : (
                                        <div className="row g-2">
                                            {filteredPackages.map((pkg) => {
                                                const isChecked = selectedPackageIds.includes(Number(pkg.id));
                                                return (
                                                    <div key={pkg.id} className="col-12 col-md-6">
                                                        <div
                                                            onClick={() => togglePackageSelection(pkg.id)}
                                                            className={`p-2.5 rounded-3 border d-flex align-items-center gap-2.5 cursor-pointer transition-all ${isChecked
                                                                ? 'bg-white border-primary shadow-2xs'
                                                                : 'bg-white bg-opacity-60 hover-bg-white'
                                                                }`}
                                                            style={{
                                                                borderLeft: isChecked ? '4px solid #0d6efd' : undefined,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input m-0 cursor-pointer"
                                                                checked={isChecked}
                                                                onChange={() => { }} // controlled by parent div onClick
                                                            />
                                                            <div className="flex-grow-1 overflow-hidden">
                                                                <span className="fw-semibold text-dark text-truncate d-block small">
                                                                    {pkg.title}
                                                                </span>
                                                                <small className="text-muted d-block text-2xs">
                                                                    {pkg.duration_days}D / {pkg.duration_nights || (pkg.duration_days - 1)}N • ₹{pkg.actual_price || pkg.price || 0}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="card border-0 shadow-sm mb-6 rounded-3">
                            <div className="card-header bg-white border-bottom py-4">
                                <h5 className="mb-0 fw-semibold">Hotel Description & Experience</h5>
                            </div>
                            <div className="card-body py-4">
                                <EditorTinyMCE
                                    value={formData.description}
                                    handleEditorChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                                />
                            </div>
                        </div>

                        {/* SEO Meta Component */}
                        <div className="mb-6">
                            <MetaComponent
                                metaDetails={formData}
                                setMetaDetails={handleInputChange}
                                setFormData={setFormData}
                            />
                        </div>

                    </div>

                    {/* Right 4 Columns: Media Uploads & Actions */}
                    <div className="col-12 col-lg-4">

                        {/* Main Featured Image Card */}
                        <div id="mediaUploadSection" className="card border-0 shadow-sm mb-6 rounded-3">
                            <div className="card-header bg-white border-bottom py-4">
                                <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                                    <i className="ri-image-line text-primary"></i>
                                    <span>Main Featured Image <span className="text-danger">*</span></span>
                                </h5>
                            </div>
                            <div className="card-body py-4 text-center">
                                {mainImagePreview ? (
                                    <div className="position-relative rounded-3 overflow-hidden border mb-3">
                                        <img
                                            src={mainImagePreview}
                                            alt="Preview"
                                            className="w-100 object-fit-cover"
                                            style={{ height: '200px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setMainImage(null); setMainImagePreview(null); }}
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle"
                                        >
                                            <i className="ri-close-line"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => mainImageRef.current.click()}
                                        className="border-2 border-dashed rounded-3 p-4 bg-light cursor-pointer mb-3 hover-shadow transition-all"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="ri-upload-cloud-2-line fs-1 text-muted d-block mb-2"></i>
                                        <span className="fw-semibold text-dark d-block">Click to upload Main Hotel Photo</span>
                                        <small className="text-muted">High quality JPG, PNG or WebP</small>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={mainImageRef}
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => handleMainImageChange(e.target.files[0])}
                                />
                            </div>
                        </div>

                        {/* Gallery Images Card */}
                        <div className="card border-0 shadow-sm mb-6 rounded-3">
                            <div className="card-header bg-white border-bottom py-4 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                                    <i className="ri-gallery-line text-success"></i>
                                    <span>Gallery Photos</span>
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => galleryImageRef.current.click()}
                                    className="btn btn-xs btn-outline-success rounded-pill"
                                >
                                    + Add Photos
                                </button>
                            </div>
                            <div className="card-body py-4">
                                <input
                                    type="file"
                                    ref={galleryImageRef}
                                    accept="image/*"
                                    multiple
                                    hidden
                                    onChange={(e) => handleGalleryImagesChange(e.target.files)}
                                />

                                {galleryPreviews.length === 0 ? (
                                    <div
                                        onClick={() => galleryImageRef.current.click()}
                                        className="border-2 border-dashed rounded-3 p-4 bg-light text-center cursor-pointer"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="ri-images-line fs-2 text-muted d-block mb-1"></i>
                                        <small className="text-muted">Upload hotel rooms, swimming pool & garden photos</small>
                                    </div>
                                ) : (
                                    <div className="row g-2">
                                        {galleryPreviews.map((preview, gIdx) => (
                                            <div key={gIdx} className="col-6 position-relative">
                                                <div className="rounded-2 overflow-hidden border" style={{ height: '90px' }}>
                                                    <img
                                                        src={preview}
                                                        alt="Gallery preview"
                                                        className="w-100 h-100 object-fit-cover"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveGalleryImage(gIdx)}
                                                    className="btn btn-danger btn-xs position-absolute top-0 end-0 m-1 rounded-circle p-1"
                                                    style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <i className="ri-close-line" style={{ fontSize: '12px' }}></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Action Card */}
                        <div className="card border-0 shadow-sm rounded-3 position-sticky" style={{ top: '90px' }}>
                            <div className="card-body d-flex flex-column gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 fs-6"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                            <span>Creating Hotel...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-save-line fs-5"></i>
                                            <span>Create & Link Hotel</span>
                                        </>
                                    )}
                                </button>

                                <Link href="/hotels" className="btn btn-outline-secondary py-2.5 rounded-pill fw-semibold text-center">
                                    Cancel & Return
                                </Link>
                            </div>
                        </div>

                    </div>

                </div>
            </form>

        </div>
    );
}
