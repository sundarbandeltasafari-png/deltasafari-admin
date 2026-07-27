"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { createCityUrl, getAllCountriesUrl } from '@/app/routes/serviceRoutes';
import MediaUpload from '@/components/blogs/MediaUpload';
import { showMessage } from '@/libs/commonHelper';
import Link from 'next/link';
import { axiosGet } from '@/libs/axiosHelper';

export default function AddCityPage() {
    const [formData, setFormData] = useState({
        name: '',
        country: '',
        state: '',
        starting_from: '',
        days: '',
        nights: '',
        city_image: null,
        show_in_package: false,
        show_in_corporate: false,
        show_in_hotel: false,
        show_in_cab: false
    });
    const [submitting, setSubmitting] = useState(false);
    const token = useSelector((state) => state.adminAuth?.token);
    const route = useRouter();
    const [countris, setCountries] = useState([])
    const [states, setStates] = useState([])

    useEffect(() => {
        axiosGet(getAllCountriesUrl, token).then((res) => {
            if (res.status) {
                setCountries(res?.countries)
            } else {
                showMessage('Somenthing  went wrong  when fetch country', 'error')
            }
        }).catch((err) => {
            showMessage('Somenthing  went wrong  when fetch country', 'error')
        })
    }, [])

    const getStatesByCountry = async (countryCode) => {
        const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states`, {
            headers: { 'X-CSCAPI-KEY': '7bf90ffb8a61dc4125f60da9050c8268af8d3d58da8c3f5a4a128e4e0360e894' }
        });
        if (response.ok) {
            const states = await response.json();
            return states;
        } else {
            throw new Error('Country not found or no states available');
        }
    };

    // Handle simple input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Clear state if country changes to keep dropdown aligned
            ...(name === 'country' ? { state: '' } : {})
        }));
        if (name == 'country') {
            getStatesByCountry(value).then((res)=>{
                setStates(res)
                console.log(res);
                
            }).catch((err)=>{
                showMessage(err.message,'error')
            })
        }
    };

    // Handle Switch toggles
    const handleSwitchChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    // Convert File to Base64 (for LocalStorage persistence)
    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleCreateCity = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            showMessage('City name is required', 'error');
            return;
        }
        if (!formData.country) {
            showMessage('Please select a country', 'error');
            return;
        }
        if (!formData.state) {
            showMessage('Please select a state', 'error');
            return;
        }
        if (!formData.city_image) {
            showMessage('Please upload a city image', 'error');
            return;
        }
        if (!formData.starting_from) {
            showMessage('Please add a starting from', 'error');
            return;
        }
        if (!formData.nights) {
            showMessage('Please add a nights', 'error');
            return;
        }
        if (!formData.days) {
            showMessage('Please add a days', 'error');
            return;
        }

        setSubmitting(true);

        try {
            // Build form data for API upload
            const apiFormData = new FormData();
            apiFormData.append('name', formData.name);
            apiFormData.append('country', formData.country);
            apiFormData.append('state', formData.state);
            apiFormData.append('city_image', formData.city_image);
            apiFormData.append('starting_from', formData.starting_from);
            apiFormData.append('days', formData.days);
            apiFormData.append('nights', formData.nights);
            apiFormData.append('show_in_package', formData.show_in_package ? '1' : '0');
            apiFormData.append('show_in_corporate', formData.show_in_corporate ? '1' : '0');
            apiFormData.append('show_in_hotel', formData.show_in_hotel ? '1' : '0');
            apiFormData.append('show_in_cab', formData.show_in_cab ? '1' : '0');

            // Attempt backend post
            const response = await axios.post(createCityUrl, apiFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.status) {
                showMessage('City created successfully!', 'success');
                route.push('/cities');
            } else {
                // Fallback to local storage if status is false
                // await saveToLocalStorage();
                showMessage(response?.data?.msg, 'error')
            }
        } catch (error) {
            showMessage(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const saveToLocalStorage = async () => {
        try {
            const imageBase64 = await getBase64(formData.image);
            const newCity = {
                id: Date.now().toString(),
                name: formData.name,
                country: formData.country,
                state: formData.state,
                city_image: imageBase64,
                show_in_package: formData.show_in_package,
                show_in_corporate: formData.show_in_corporate,
                show_in_hotel: formData.show_in_hotel,
                show_in_cab: formData.show_in_cab
            };

            let localData = localStorage.getItem('cities');
            let citiesList = localData ? JSON.parse(localData) : [];

            citiesList.unshift(newCity);
            localStorage.setItem('cities', JSON.stringify(citiesList));

            showMessage('City created successfully (LocalStorage)', 'success');
            route.push('/cities');
        } catch (err) {
            showMessage('Failed to save city data locally', 'error');
            console.error(err);
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">

            {/* Navigation Breadcrumbs & Header */}
            <div className="d-flex align-items-center mb-6 gap-3">
                <Link href="/cities" className="btn btn-icon btn-outline-secondary rounded-pill">
                    <i className="ri-arrow-left-line fs-4"></i>
                </Link>
                <div>
                    <h4 className="fw-semibold mb-0">Add New City</h4>
                    <p className="text-muted small mb-0">Create and list a new city in the global destination database</p>
                </div>
            </div>

            <div className="row justify-content-center">
                <div className="col-12 col-lg-10">

                    <form onSubmit={handleCreateCity}>
                        <div className="row g-6">

                            {/* Form Input Details Card */}
                            <div className="col-12 col-md-7">
                                <div className="card h-100 border-0 shadow-sm rounded-3">
                                    <div className="card-header bg-white border-bottom py-4">
                                        <h5 className="mb-0 fw-semibold">City Specifications</h5>
                                    </div>

                                    <div className="card-body py-5">
                                        <div className="row g-5">

                                            {/* City Name */}
                                            <div className="col-12">
                                                <label className="form-label fw-semibold text-uppercase text-secondary small">City Name</label>
                                                <div className="input-group input-group-merge">
                                                    <span className="input-group-text"><i className="ri-map-pin-line text-muted"></i></span>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        className="form-control form-control-lg ps-2"
                                                        placeholder="Enter city name (e.g. Kolkata, Paris)"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-semibold text-uppercase text-secondary small">Starting From</label>
                                                <div className="input-group input-group-merge">
                                                    <span className="input-group-text"><i className="ri-map-pin-line text-muted"></i></span>
                                                    <input
                                                        type="text"
                                                        name="starting_from"
                                                        className="form-control form-control-lg ps-2"
                                                        placeholder="Starting Package Price"
                                                        value={formData.starting_from}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold text-uppercase text-secondary small">Package Days</label>
                                                <div className="input-group input-group-merge">
                                                    <span className="input-group-text"><i className="ri-map-pin-line text-muted"></i></span>
                                                    <input
                                                        type="text"
                                                        name="days"
                                                        className="form-control form-control-lg ps-2"
                                                        placeholder="Starting Package Price"
                                                        value={formData.days}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold text-uppercase text-secondary small">Package Nights</label>
                                                <div className="input-group input-group-merge">
                                                    <span className="input-group-text"><i className="ri-map-pin-line text-muted"></i></span>
                                                    <input
                                                        type="text"
                                                        name="nights"
                                                        className="form-control form-control-lg ps-2"
                                                        placeholder="Starting Package Price"
                                                        value={formData.nights}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Country Select */}
                                            <div className="col-12 col-md-6">
                                                <label className="form-label fw-semibold text-uppercase text-secondary small">Country</label>
                                                <select
                                                    name="country"
                                                    className="form-select form-select-lg"
                                                    value={formData.country}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">-- Select Country --</option>
                                                    {countris.map((country) => (
                                                        <option key={country?.country_id} value={country?.iso_alpha2}>{country?.country_name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* State Select */}
                                            <div className="col-12 col-md-6">
                                                <label className="form-label fw-semibold text-uppercase text-secondary small">State / Province</label>
                                                <select
                                                    name="state"
                                                    className="form-select form-select-lg"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    disabled={!formData.country}
                                                    required
                                                >
                                                    <option value="">
                                                        {formData.country ? '-- Select State --' : 'Select a Country first'}
                                                    </option>
                                                    {states.map((state) => (
                                                        <option key={state.id} value={state.name}>{state.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Show Page Settings Switches */}
                                            <div className="col-12 border-top pt-4 mt-4">
                                                <h6 className="fw-semibold mb-3 text-secondary text-uppercase small">Page Display Settings</h6>
                                                <div className="row g-4">

                                                    {/* Show in Package */}
                                                    <div className="col-6">
                                                        <div className="form-check form-switch ms-1">
                                                            <input
                                                                className="form-check-input cursor-pointer"
                                                                type="checkbox"
                                                                role="switch"
                                                                name="show_in_package"
                                                                id="showInPackageSwitch"
                                                                checked={formData.show_in_package}
                                                                onChange={handleSwitchChange}
                                                            />
                                                            <label className="form-check-label fw-medium text-dark cursor-pointer ms-2" htmlFor="showInPackageSwitch">
                                                                Package Page
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Show in Corporate */}
                                                    <div className="col-6">
                                                        <div className="form-check form-switch ms-1">
                                                            <input
                                                                className="form-check-input cursor-pointer"
                                                                type="checkbox"
                                                                role="switch"
                                                                name="show_in_corporate"
                                                                id="showInCorporateSwitch"
                                                                checked={formData.show_in_corporate}
                                                                onChange={handleSwitchChange}
                                                            />
                                                            <label className="form-check-label fw-medium text-dark cursor-pointer ms-2" htmlFor="showInCorporateSwitch">
                                                                Corporate Page
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Show in Hotel */}
                                                    <div className="col-6 mt-3">
                                                        <div className="form-check form-switch ms-1">
                                                            <input
                                                                className="form-check-input cursor-pointer"
                                                                type="checkbox"
                                                                role="switch"
                                                                name="show_in_hotel"
                                                                id="showInHotelSwitch"
                                                                checked={formData.show_in_hotel}
                                                                onChange={handleSwitchChange}
                                                            />
                                                            <label className="form-check-label fw-medium text-dark cursor-pointer ms-2" htmlFor="showInHotelSwitch">
                                                                Hotel Page
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Show in Cab */}
                                                    <div className="col-6 mt-3">
                                                        <div className="form-check form-switch ms-1">
                                                            <input
                                                                className="form-check-input cursor-pointer"
                                                                type="checkbox"
                                                                role="switch"
                                                                name="show_in_cab"
                                                                id="showInCabSwitch"
                                                                checked={formData.show_in_cab}
                                                                onChange={handleSwitchChange}
                                                            />
                                                            <label className="form-check-label fw-medium text-dark cursor-pointer ms-2" htmlFor="showInCabSwitch">
                                                                Cab Page
                                                            </label>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Media Upload Uploader Component Card */}
                            <div className="col-12 col-md-5">
                                <div className="h-100">
                                    <MediaUpload
                                        setImage={(imgFile) => {
                                            setFormData(prev => ({ ...prev, city_image: imgFile }));
                                        }}
                                        image={formData.image}
                                        previewImage={null}
                                        type='image'
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="col-12 pt-3">
                                <div className="card border-0 shadow-sm rounded-3">
                                    <div className="card-body d-flex gap-4 justify-content-end align-items-center">
                                        <Link href="/cities" className="btn btn-outline-secondary rounded-pill px-5 py-2">
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            className="btn btn-primary rounded-pill px-5 py-2 fw-semibold d-flex align-items-center"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    <span>Submitting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-save-line me-2"></i>
                                                    <span>Create City</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </form>

                </div>
            </div>

        </div>
    );
}