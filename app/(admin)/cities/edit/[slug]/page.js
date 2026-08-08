"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { getParticularCityUrl, updateCityUrl, getAllCountriesUrl } from '@/app/routes/serviceRoutes';
import MediaUpload from '@/components/blogs/MediaUpload';
import MetaComponent from '@/components/seocomponent/MetaComponent';
import TouristGuideComponent, { defaultGuideData } from '@/components/seocomponent/TouristGuideComponent';
import LoadingComponent from '@/components/common/LoadingComponent';
import { showMessage } from '@/libs/commonHelper';
import { urlDecode } from '@/libs/urlHelper';
import { axiosGet } from '@/libs/axiosHelper';
import Link from 'next/link';

export default function EditCityPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const cityId = rawSlug ? rawSlug : null;

  const [loading, setLoading] = useState(true);
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
    show_in_cab: false,
    meta_title: '',
    meta_description: '',
    tags: [],
    canonical_url: '',
    og_title: '',
    og_description: '',
    robots_meta: 'index, follow'
  });
  const [guideData, setGuideData] = useState(defaultGuideData);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const token = useSelector((state) => state.adminAuth?.token);
  const route = useRouter();

  // Fetch states from external API
  const getStatesByCountry = async (countryCode) => {
    const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states`, {
      headers: { 'X-CSCAPI-KEY': '7bf90ffb8a61dc4125f60da9050c8268af8d3d58da8c3f5a4a128e4e0360e894' }
    });
    if (response.ok) {
      const statesList = await response.json();
      return statesList;
    } else {
      throw new Error('Country not found or no states available');
    }
  };

  // Load countries list & load city details
  useEffect(() => {
    if (!cityId) {
      showMessage('Invalid City ID', 'error');
      route.push('/cities');
      return;
    }

    async function initializePage() {
      try {
        setLoading(true);
        // 1. Fetch countries first
        let fetchedCountries = [];
        const countriesRes = await axiosGet(getAllCountriesUrl, token);
        if (countriesRes.status) {
          setCountries(countriesRes.countries);
          fetchedCountries = countriesRes.countries;
        } else {
          showMessage('Something went wrong when fetching countries', 'error');
        }

        // 2. Fetch city details
        let city = null;
        try {
          const response = await axios.get(`${getParticularCityUrl}?id=${cityId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 3000
          });
          if (response.data && response.data.status && response.data.city) {
            city = response.data.city;
          }
        } catch (error) {
          console.log('Backend city fetch failed, fetching from LocalStorage fallback...');
        }

        if (!city) {
          // LocalStorage fallback
          const localCities = localStorage.getItem('cities');
          if (localCities) {
            const parsed = JSON.parse(localCities);
            city = parsed.find(c => c.id === cityId);
          }
        }

        if (city) {
          // Pre-populate formData
          setFormData({
            name: city.name,
            country: city.country,
            state: city.state,
            starting_from: city.starting_from,
            days: city.days,
            nights: city.nights,
            city_image: null,
            show_in_package: city.show_in_package === true || city.show_in_package === 1 || city.show_in_package === '1',
            show_in_corporate: city.show_in_corporate === true || city.show_in_corporate === 1 || city.show_in_corporate === '1',
            show_in_hotel: city.show_in_hotel === true || city.show_in_hotel === 1 || city.show_in_hotel === '1',
            show_in_cab: city.show_in_cab === true || city.show_in_cab === 1 || city.show_in_cab === '1',
            meta_title: city.meta_title || '',
            meta_description: city.meta_description || '',
            tags: city.tags ? (typeof city.tags === 'string' ? city.tags.split(',').map(s => s.trim()) : city.tags) : [],
            canonical_url: city.canonical_url || '',
            og_title: city.og_title || '',
            og_description: city.og_description || '',
            robots_meta: city.robots_meta || 'index, follow'
          });
          if (city.tourist_guide) {
            try {
              const parsed = typeof city.tourist_guide === 'string' ? JSON.parse(city.tourist_guide) : city.tourist_guide;
              setGuideData(parsed);
            } catch (e) {
              console.error('Error parsing city tourist_guide:', e);
            }
          }
          setImagePreview(city.image || city.city_image);

          // 3. Fetch states for the city's current country so state dropdown is loaded
          if (city.country) {
            try {
              const loadedStates = await getStatesByCountry(city.country);
              setStates(loadedStates);
            } catch (err) {
              console.log('Error loading states during initial load:', err.message);
            }
          }
        } else {
          showMessage('City not found', 'error');
          route.push('/cities');
        }
      } catch (err) {
        showMessage(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [cityId]);

  // Handle simple input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear state if country changes to keep dropdown aligned
      ...(name === 'country' ? { state: '' } : {})
    }));

    if (name === 'country') {
      getStatesByCountry(value)
        .then((res) => {
          setStates(res);
        })
        .catch((err) => {
          showMessage(err.message, 'error');
        });
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

  const handleUpdateCity = async (e) => {
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

    setSubmitting(true);

    try {
      // Build form data for API upload
      const apiFormData = new FormData();
      apiFormData.append('id', cityId);
      apiFormData.append('name', formData.name);
      apiFormData.append('country', formData.country);
      apiFormData.append('state', formData.state);
      apiFormData.append('starting_from', formData.starting_from);
      apiFormData.append('days', formData.days);
      apiFormData.append('nights', formData.nights);
      apiFormData.append('show_in_package', formData.show_in_package ? '1' : '0');
      apiFormData.append('show_in_corporate', formData.show_in_corporate ? '1' : '0');
      apiFormData.append('show_in_hotel', formData.show_in_hotel ? '1' : '0');
      apiFormData.append('show_in_cab', formData.show_in_cab ? '1' : '0');
      apiFormData.append('cityId', cityId);
      apiFormData.append('tourist_guide', JSON.stringify(guideData));
      apiFormData.append('meta_title', formData.meta_title || '');
      apiFormData.append('meta_description', formData.meta_description || '');
      apiFormData.append('tags', Array.isArray(formData.tags) ? formData.tags.join(',') : (formData.tags || ''));
      apiFormData.append('canonical_url', formData.canonical_url || '');
      apiFormData.append('og_title', formData.og_title || '');
      apiFormData.append('og_description', formData.og_description || '');
      apiFormData.append('robots_meta', formData.robots_meta || 'index, follow');
      if (formData.city_image) {
        apiFormData.append('city_image', formData.city_image);
      }

      // Attempt backend post
      const response = await axios.put(updateCityUrl, apiFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 4000
      });

      if (response.data && response.data.status) {
        showMessage('City updated successfully!', 'success');
        route.push('/cities');
      } else {
        showMessage(response?.data?.msg || 'Update failed', 'error');
        await saveToLocalStorage();
      }
    } catch (error) {
      console.log('Backend API update failed, saving to LocalStorage:', error.message);
      await saveToLocalStorage();
    } finally {
      setSubmitting(false);
    }
  };

  const saveToLocalStorage = async () => {
    try {
      const localData = localStorage.getItem('cities');
      if (localData) {
        const parsed = JSON.parse(localData);

        let finalImage = imagePreview;
        if (formData.city_image) {
          finalImage = await getBase64(formData.city_image);
        }

        const updatedList = parsed.map(c => {
          if (c.id === cityId) {
            return {
              ...c,
              name: formData.name,
              country: formData.country,
              state: formData.state,
              starting_from: formData.starting_from,
              days: formData.days,
              nights: formData.nights,
              image: finalImage,
              city_image: finalImage,
              show_in_package: formData.show_in_package,
              show_in_corporate: formData.show_in_corporate,
              show_in_hotel: formData.show_in_hotel,
              show_in_cab: formData.show_in_cab
            };
          }
          return c;
        });

        localStorage.setItem('cities', JSON.stringify(updatedList));
        showMessage('City updated successfully (LocalStorage)', 'success');
        route.push('/cities');
      }
    } catch (err) {
      showMessage('Failed to update city data locally', 'error');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y py-5">
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">

      {/* Navigation Breadcrumbs & Header */}
      <div className="d-flex align-items-center mb-6 gap-3">
        <Link href="/cities" className="btn btn-icon btn-outline-secondary rounded-pill">
          <i className="ri-arrow-left-line fs-4"></i>
        </Link>
        <div>
          <h4 className="fw-semibold mb-0">Edit City</h4>
          <p className="text-muted small mb-0">Modify specifications and details for {formData.name}</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">

          <form onSubmit={handleUpdateCity}>
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
                          {countries.map((country) => (
                            <option key={country?.country_id} value={country?.iso_alpha2}>
                              {country?.country_name}
                            </option>
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
                            <option key={state.id || state.name} value={state.name}>
                              {state.name}
                            </option>
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
                    image={formData.city_image}
                    previewImage={imagePreview ? (imagePreview.startsWith('data:') || imagePreview.startsWith('/') ? imagePreview : process.env.NEXT_PUBLIC_SERVER_URL + imagePreview) : null}
                    type='image'
                  />
                </div>
              </div>

              {/* SEO Meta Details Component */}
              <div className="col-12 mt-3">
                <MetaComponent metaDetails={formData} setMetaDetails={handleInputChange} setFormData={setFormData} />
              </div>

              {/* Tourist Guide Section Configuration */}
              <div className="col-12 mt-3">
                <TouristGuideComponent guideData={guideData} setGuideData={setGuideData} entityName="City" />
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
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-save-line me-2"></i>
                          <span>Update City</span>
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