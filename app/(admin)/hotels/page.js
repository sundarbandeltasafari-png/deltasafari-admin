"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { getAllHotelsUrl, deleteHotelUrl } from '@/app/routes/serviceRoutes';
import DeleteModal from '@/components/admin/common/DeleteModal';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';
import SearchList from '@/components/common/SearchList';
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import Link from 'next/link';

export default function HotelsPage() {
    const [loading, setLoading] = useState(true);
    const [hotels, setHotels] = useState([]);
    const [searchData, setSearchData] = useState('');
    const [selectedStar, setSelectedStar] = useState('All');
    const [selectedType, setSelectedType] = useState('All');
    const [deleteStatus, setDeleteStatus] = useState(false);
    const [deleteHotelItem, setDeleteHotelItem] = useState(null);

    const router = useRouter();
    const token = useSelector((state) => state.adminAuth?.token);

    async function loadHotels() {
        try {
            setLoading(true);
            const response = await axios.get(getAllHotelsUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.status && response.data.hotels) {
                setHotels(response.data.hotels);
            } else {
                setHotels([]);
            }
        } catch (error) {
            console.error('Error fetching hotels:', error);
            showMessage(error?.response?.data?.msg || error.message || 'Failed to fetch hotels', 'error');
            setHotels([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadHotels();
    }, []);

    // Filter Logic
    const hotelTypes = ['All', ...new Set(hotels.map(h => h.hotel_type).filter(Boolean))];

    const filteredHotels = hotels.filter(hotel => {
        const query = searchData.toLowerCase();
        const matchesSearch =
            (hotel.name && hotel.name.toLowerCase().includes(query)) ||
            (hotel.city_name && hotel.city_name.toLowerCase().includes(query)) ||
            (hotel.zone_name && hotel.zone_name.toLowerCase().includes(query)) ||
            (hotel.address && hotel.address.toLowerCase().includes(query));

        const matchesStar = selectedStar === 'All' || String(hotel.star_rating) === String(selectedStar);
        const matchesType = selectedType === 'All' || hotel.hotel_type === selectedType;

        return matchesSearch && matchesStar && matchesType;
    });

    function handleDeleteDetect(hotel) {
        setDeleteHotelItem(hotel);
        setDeleteStatus(true);
    }

    async function handleDelete(hotelId) {
        setLoading(true);
        try {
            const response = await axios.delete(`${deleteHotelUrl}?id=${urlEncode(hotelId)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.status) {
                showMessage(response.data.msg || 'Hotel deleted successfully', 'success');
                setHotels(prev => prev.filter(h => h.id !== hotelId));
            } else {
                showMessage(response.data.msg || 'Failed to delete hotel', 'error');
            }
        } catch (error) {
            showMessage(error?.response?.data?.msg || error.message || 'Error deleting hotel', 'error');
        } finally {
            setDeleteStatus(false);
            setLoading(false);
        }
    }

    const renderStars = (count) => {
        const rating = parseInt(count) || 3;
        return (
            <div className="d-flex align-items-center text-warning" style={{ fontSize: '13px' }}>
                {[...Array(5)].map((_, i) => (
                    <i
                        key={i}
                        className={`ri-star-${i < rating ? 'fill text-warning' : 'line text-muted opacity-50'} me-0.5`}
                    ></i>
                ))}
                <span className="ms-1.5 text-dark fw-bold small">({rating}★)</span>
            </div>
        );
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">

            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-6 flex-wrap gap-3">
                <div>
                    <h4 className="fw-semibold mb-1 d-flex align-items-center gap-2">
                        <i className="ri-hotel-line text-primary"></i>
                        <span>Hotel & Reference Stays Master</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Create hotels with amenities, images, room types, and link them as reference stays to multiple tour packages
                    </p>
                </div>
                <div>
                    <Link
                        href="/hotels/add"
                        className="btn btn-primary d-flex align-items-center rounded-pill px-4 py-2.5 fw-semibold shadow-sm"
                    >
                        <i className="ri-add-line me-2 fs-5"></i>
                        <span>Add New Hotel</span>
                    </Link>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="row g-4 mb-6">
                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="avatar avatar-md bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center">
                                <i className="ri-hotel-line fs-3"></i>
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold">{hotels.length}</h5>
                                <small className="text-muted">Total Listed Hotels</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="avatar avatar-md bg-warning bg-opacity-10 text-warning rounded-3 d-flex align-items-center justify-content-center">
                                <i className="ri-star-smile-line fs-3"></i>
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold">
                                    {hotels.filter(h => Number(h.star_rating) >= 4).length}
                                </h5>
                                <small className="text-muted">Premium & Luxury (4★/5★)</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="avatar avatar-md bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center">
                                <i className="ri-links-line fs-3"></i>
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold">
                                    {hotels.filter(h => Number(h.linked_packages_count) > 0).length}
                                </h5>
                                <small className="text-muted">Linked to Packages</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="avatar avatar-md bg-info bg-opacity-10 text-info rounded-3 d-flex align-items-center justify-content-center">
                                <i className="ri-map-pin-2-line fs-3"></i>
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold">
                                    {new Set(hotels.map(h => h.city_name || h.zone_name).filter(Boolean)).size}
                                </h5>
                                <small className="text-muted">Active Locations</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Listing Card */}
            <div className="card border-0 shadow-sm">

                {/* Filters */}
                <div className="card-header border-bottom py-4">
                    <div className="row g-4 align-items-center">
                        <div className="col-md-6 col-lg-5">
                            <SearchList
                                handleSearch={setSearchData}
                                placeholder="Search hotel name, location, address..."
                            />
                        </div>
                        <div className="col-md-3 col-lg-3">
                            <select
                                className="form-select"
                                value={selectedStar}
                                onChange={(e) => setSelectedStar(e.target.value)}
                            >
                                <option value="All">All Star Ratings</option>
                                <option value="5">5 Star Luxury</option>
                                <option value="4">4 Star Deluxe</option>
                                <option value="3">3 Star Standard</option>
                                <option value="2">2 Star Budget</option>
                            </select>
                        </div>
                        <div className="col-md-3 col-lg-4">
                            <select
                                className="form-select"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                <option value="All">All Hotel Types</option>
                                {hotelTypes.filter(t => t !== 'All').map((type, idx) => (
                                    <option key={idx} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Hotels Table */}
                <div className="table-responsive">
                    {loading ? (
                        <div className="py-5">
                            <LoadingComponent />
                        </div>
                    ) : filteredHotels.length === 0 ? (
                        <div className="py-5 text-center">
                            <NotFound />
                            <p className="text-muted mt-2">No hotels found matching your search.</p>
                            <Link href="/hotels/add" className="btn btn-outline-primary btn-sm rounded-pill mt-2">
                                + Create New Hotel
                            </Link>
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '950px' }}>
                            <thead className="table-light text-uppercase">
                                <tr>
                                    <th className="py-3 ps-4" style={{ width: '80px' }}>Image</th>
                                    <th className="py-3">Hotel Details</th>
                                    <th className="py-3">Category & Rating</th>
                                    <th className="py-3">Location</th>
                                    <th className="py-3">Starting Price</th>
                                    <th className="py-3">Amenities</th>
                                    <th className="py-3 text-center">Linked Packages</th>
                                    <th className="py-3 pe-4 text-end" style={{ width: '130px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHotels.map((hotel) => {
                                    const imgSrc = hotel.main_image
                                        ? (hotel.main_image.startsWith('http') || hotel.main_image.startsWith('/')
                                            ? hotel.main_image
                                            : `${process.env.NEXT_PUBLIC_SERVER_URL}${hotel.main_image}`)
                                        : "/images/noimage.jpg";

                                    const amenitiesList = Array.isArray(hotel.amenities)
                                        ? hotel.amenities
                                        : [];

                                    return (
                                        <tr key={hotel.id}>
                                            <td className="ps-4">
                                                <div
                                                    className="rounded-3 overflow-hidden border bg-light d-flex align-items-center justify-content-center"
                                                    style={{ width: '64px', height: '48px' }}
                                                >
                                                    <img
                                                        src={imgSrc}
                                                        alt={hotel.name}
                                                        className="w-100 h-100 object-fit-cover"
                                                        onError={(e) => { e.target.src = "/images/noimage.jpg"; }}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-heading fs-6">{hotel.name}</span>
                                                    <small className="text-muted d-flex align-items-center gap-1">
                                                        <span className="badge bg-label-secondary text-capitalize px-2 py-0.5">
                                                            {hotel.hotel_type || 'Resort'}
                                                        </span>
                                                        {hotel.status === 1 ? (
                                                            <span className="badge bg-label-success px-1.5 py-0.5">Active</span>
                                                        ) : (
                                                            <span className="badge bg-label-danger px-1.5 py-0.5">Inactive</span>
                                                        )}
                                                    </small>
                                                </div>
                                            </td>
                                            <td>
                                                <div>{renderStars(hotel.star_rating)}</div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-semibold text-dark">
                                                        <i className="ri-map-pin-fill text-danger me-1 small"></i>
                                                        {hotel.city_name || hotel.zone_name || 'Sundarban'}
                                                    </span>
                                                    {hotel.address && (
                                                        <small className="text-muted text-truncate" style={{ maxWidth: '180px' }}>
                                                            {hotel.address}
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="fw-bold text-primary">
                                                    ₹{hotel.starting_price ? Number(hotel.starting_price).toLocaleString('en-IN') : '0'}
                                                </span>
                                                <small className="text-muted d-block text-2xs">/ night</small>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '240px' }}>
                                                    {amenitiesList.slice(0, 3).map((amenity, aIdx) => (
                                                        <span
                                                            key={aIdx}
                                                            className="badge bg-light text-dark border px-2 py-1"
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            {amenity}
                                                        </span>
                                                    ))}
                                                    {amenitiesList.length > 3 && (
                                                        <span
                                                            className="badge bg-primary bg-opacity-10 text-primary px-1.5 py-1"
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            +{amenitiesList.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {Number(hotel.linked_packages_count) > 0 ? (
                                                    <span className="badge bg-label-success fw-bold px-2.5 py-1.5 rounded-pill">
                                                        <i className="ri-instance-line me-1"></i>
                                                        {hotel.linked_packages_count} {hotel.linked_packages_count === 1 ? 'Package' : 'Packages'}
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-label-secondary text-muted px-2 py-1 rounded-pill">
                                                        0 Packages
                                                    </span>
                                                )}
                                            </td>
                                            <td className="pe-4 text-end">
                                                <button
                                                    onClick={() => router.push('/hotels/edit/' + urlEncode(hotel.id))}
                                                    className="btn btn-icon btn-text-secondary rounded-pill me-1"
                                                    title="Edit Hotel"
                                                >
                                                    <i className="bi bi-pencil-square fs-5"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDetect(hotel)}
                                                    className="btn btn-icon btn-text-danger rounded-pill"
                                                    title="Delete Hotel"
                                                >
                                                    <i className="bi bi-trash fs-5"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Deletion Modal */}
            {deleteStatus && (
                <DeleteModal
                    status={deleteStatus}
                    onChangeStatus={setDeleteStatus}
                    handleChange={handleDelete}
                    post={deleteHotelItem}
                />
            )}
        </div>
    );
}
