"use client"
import { createPackageUrl } from '@/app/routes/packageRoutes';
import { getAllPackageTypeUrl, getAllZoneUrl, getAllHotelsUrl, getAllCityUrl } from '@/app/routes/serviceRoutes';
import MultiLevelSelect from '@/components/blogs/MultiLevelSelect';
import MultiMediaUpload from '@/components/blogs/MultiMediaUpload';
import LoadingComponent from '@/components/common/LoadingComponent';
import EditorTinyMCE from '@/components/blogs/EditorTinyMCE';
import InclusionsExclusions from '@/components/package/InclusionsExclusions';
import ItineraryComponent from '@/components/package/ItineraryComponent';
import TermsAndConditions from '@/components/package/TermsAndConditions';
import MetaComponent from '@/components/seocomponent/MetaComponent';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { scrollToView, showMessage } from '@/libs/commonHelper';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

function page() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: 1,
    meta_title: '',
    meta_description: '',
    tags: [],
    to_destination: '',
    from_destination: '',
    city: '',
    duration_days: '',
    duration_nights: '',
    base_price: '',
    discount_type: 'percentage',
    discount: '',
    actual_price: '',
    agent_discount: '',
    agent_actual_price: '',
    category: null,
    platform: 'both'
  });
  const [days, setDays] = useState([
    {
      dayNumber: 1,
      title: "",
      roadmap: [],
      details: ""
    }
  ]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [policies, setPolicies] = useState([
    {
      id: 1,
      title: '',
      bullets: []
    }
  ]);
  const [availableHotels, setAvailableHotels] = useState([]);
  const [selectedHotelIds, setSelectedHotelIds] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneData, setZoneData] = useState([])
  const [PackageLoading, setPackageLoading] = useState(true);
  const [packageType, setPackageType] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false)
  const token = useSelector((state) => state.adminAuth?.token);
  const route = useRouter();

  const formattedCities = useMemo(() => {
    return (citiesList || []).map((c) => ({
      id: c.id,
      name: c.state ? `${c.name} (${c.state})` : c.name,
      image: c.city_image ? (c.city_image.startsWith('http') || c.city_image.startsWith('/') ? c.city_image : `${process.env.NEXT_PUBLIC_SERVER_URL}${c.city_image}`) : null
    }));
  }, [citiesList]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      if (value === '' || value === null || value === undefined) {
        setFormData((prev) => ({ ...prev, [name]: '' }));
      } else {
        const parsed = parseInt(value, 10);
        setFormData((prev) => ({ ...prev, [name]: isNaN(parsed) ? '' : Math.abs(parsed) }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Live Auto-Calculation for both Normal User and Agent Discounts
  useEffect(() => {
    const base = Number(formData.base_price) || 0;
    const userDisc = Number(formData.discount) || 0;
    const agentDisc = Number(formData.agent_discount) || 0;

    if (base > 0) {
      // 1. Normal User Discount & Actual Price Calculation
      let actualPrice = 0;
      if (formData.discount_type === 'flat') {
        actualPrice = base - userDisc;
      } else {
        actualPrice = base - ((base * userDisc) / 100);
      }

      // 2. Travel Agent Discount / Commission & Actual Price Calculation
      let agentActualPrice = 0;
      if (formData.discount_type === 'flat') {
        agentActualPrice = base - agentDisc;
      } else {
        agentActualPrice = base - ((base * agentDisc) / 100);
      }

      setFormData((prev) => ({
        ...prev,
        actual_price: actualPrice > 0 ? Math.round(actualPrice) : 0,
        agent_actual_price: agentActualPrice > 0 ? Math.round(agentActualPrice) : 0
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        actual_price: '',
        agent_actual_price: ''
      }));
    }
  }, [formData.base_price, formData.discount, formData.agent_discount, formData.discount_type]);

  useEffect(() => {
    axiosGet(getAllZoneUrl, token).then((res) => {
      if (res && res.status) {
        setZoneData(res.zone || []);
      } else {
        showMessage('Something went wrong loading destinations!');
      }
    }).catch((err) => {
      showMessage(err.message);
    }).finally(() => {
      setLoading(false);
    });

    axiosGet(getAllPackageTypeUrl, token).then((res) => {
      if (res && res.status) {
        setPackageType(res.packageTypes || []);
      } else {
        showMessage('Something went wrong loading categories!');
      }
    }).catch((err) => {
      showMessage(err.message);
    }).finally(() => {
      setPackageLoading(false);
    });

    axiosGet(getAllHotelsUrl, token).then((res) => {
      if (res?.status && res?.hotels) {
        setAvailableHotels(res.hotels);
      }
    }).catch(console.error);

    axiosGet(getAllCityUrl, token).then((res) => {
      if (res?.status && Array.isArray(res.cities)) {
        setCitiesList(res.cities);
      }
    }).catch(console.error).finally(() => {
      setCitiesLoading(false);
    });
  }, []);

  const handleSelection = (category, name) => {
    setFormData((prev) => ({ ...prev, [name]: category ? (category.id ?? '') : '' }));
  };

  const toggleHotelSelection = (hotelId) => {
    const idNum = Number(hotelId);
    if (selectedHotelIds.includes(idNum)) {
      setSelectedHotelIds(selectedHotelIds.filter(id => id !== idNum));
    } else {
      setSelectedHotelIds([...selectedHotelIds, idNum]);
    }
  };

  function showError(msg, container) {
    showMessage(msg);
    scrollToView(container)
    setPostLoading(false)
  }

  const [duplicateWarningModal, setDuplicateWarningModal] = useState({ open: false, msg: '' });

  const handleCreatePackage = async () => {
    if (postLoading) {
      return;
    }
    setPostLoading(true)
    if (!formData.name || !formData.description || !formData.sort_order || !formData.duration_days || !formData.duration_nights || !formData.base_price) {
      showError('Please update package details', 'packageDetails');
      return;
    }
    else if (!formData.meta_title || !formData.meta_description || formData.tags.length == 0) {
      showError('Please update meta details', 'packageMetaDetails');
      return;
    }
    else if (!formData.from_destination) {
      showError('Please select any From Destination', 'from_destination');
      return;
    }
    else if (!formData.to_destination) {
      showError('Please select any To Destination', 'to_destination');
      return;
    }
    else if (!formData.category) {
      showError('Please select any category', 'category');
      return;
    }
    else if (images.length == 0 && videos.length == 0) {
      showError('Please add package media details', 'media');
      return;
    }

    const formDataNew = new FormData();
    Object.keys(formData).forEach(key => {
      formDataNew.append(key, formData[key]);
    });
    images.forEach((image) => {
      formDataNew.append('images[]', image);
    })
    videos.forEach((video) => {
      formDataNew.append('videos[]', video);
    })
    days.forEach((day) => {
      if (day.title && day.details) {
        formDataNew.append('days[]', JSON.stringify(day));
      }
    })
    inclusions.map((inclusion) => {
      formDataNew.append('inclusions[]', inclusion);
    })
    exclusions.map((exclusion) => {
      formDataNew.append('exclusions[]', exclusion);
    })
    policies.map((policy) => {
      if (policy.title && policy.bullets.length > 0) {
        formDataNew.append('policies[]', JSON.stringify(policy));
      }
    })
    if (selectedHotelIds.length > 0) {
      formDataNew.append('hotel_ids', JSON.stringify(selectedHotelIds));
    }
    axiosPost(createPackageUrl, formDataNew, token, 'multipart/form-data').then((response) => {
      if (response.status) {
        showMessage(response.msg, "success");
        route.push('/package')
      } else {
        if (response.isDuplicateSlug || response.msg?.toLowerCase().includes('already exists')) {
          setDuplicateWarningModal({
            open: true,
            msg: response.msg || 'A package with this title/name already exists! Please choose a unique name.'
          });
        } else {
          showMessage(response.msg);
        }
        setPostLoading(false);
      }
    }).catch((err) => {
      showMessage(err.message);
      setPostLoading(false);
    })
  }

  return (
    <div className="container-fluid min-vh-100 py-5 bg-light mt-10">
      <div className="row justify-content-center">
        <div className="col-12">
          {!loading && <div className="card border-0 shadow-lg overflow-hidden rounded-4">
            <div className="row g-0">

              {/* Left Side: Interactive Form */}
              <div className="col-lg-7 p-4 p-md-5 bg-white" style={{ borderRightWidth: "1px", borderRightColor: "#8080802e", borderRightStyle: "solid" }}>
                <div className="d-flex align-items-center mb-4">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3 text-primary">
                    <i className="bi bi-box-fill fs-3"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0">New Package Create</h3>
                    <p className="text-muted small">Fill in the details to create a Package.</p>
                  </div>
                </div>

                <div className="row g-4">
                  <div id='packageDetails' className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">Package Details</span>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Package Name <span className='text-danger'>*</span></label>
                    <input type="text" name="name" className="form-control  p-3" placeholder="Destination Name" onChange={handleChange} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Sort Order <span className='text-danger'>*</span></label>
                    <input type="number" name="sort_order" className="form-control  p-3" placeholder="1" onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase text-secondary mb-2">Description <span className='text-danger'>*</span></label>
                    <EditorTinyMCE
                      value={formData.description}
                      handleEditorChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Duration Days (3N/5D) <span className='text-danger'>*</span></label>
                    <input type="number" value={formData.duration_days} name="duration_days" className="form-control  p-3" placeholder="Package Days" onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Duration Nights (3N/5D) <span className='text-danger'>*</span></label>
                    <input type="number" value={formData.duration_nights} name="duration_nights" className="form-control  p-3" placeholder="Package Nights" onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </div>

                  <div className="col-12">
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label fw-bold small text-uppercase text-secondary mb-0">
                          <i className="ri-map-pin-2-line text-primary me-1"></i> Select Package City / Region
                        </label>
                        <Link href="/cities/add" target="_blank" className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-decoration-none">
                          <i className="ri-add-line me-1"></i>+ Add City
                        </Link>
                      </div>
                      <select 
                        name="city" 
                        value={formData.city || ''} 
                        onChange={handleChange}
                        className="form-select p-2.5 bg-white fw-semibold"
                      >
                        <option value="">-- Select City for this Package (e.g. Sundarban, Kolkata, Shimla...) --</option>
                        {citiesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            📍 {c.name} {c.state ? `(${c.state})` : ''}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted d-block mt-1">
                        Associate this tour package with a City so customers can easily find it when searching by city.
                      </small>
                    </div>
                  </div>

                  {/* Pricing & Multi-Tier Discounts */}
                  <div className="col-12">
                    <div className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                      <span className="fw-bold small text-uppercase text-secondary">Pricing & Multi-Tier Discounts (Normal User & Agent)</span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Base Price (₹) <span className='text-danger'>*</span></label>
                    <input type="number" value={formData.base_price} name="base_price" className="form-control  p-3" placeholder="Package Base Price" onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Discount Calculation Mode</label>
                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="discountTypeSwitch"
                        checked={formData.discount_type === 'flat'}
                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.checked ? 'flat' : 'percentage' })}
                        style={{ width: '3em', height: '1.5em' }}
                      />
                      <label className="form-check-label ms-2 mt-1 fw-semibold" htmlFor="discountTypeSwitch">
                        {formData.discount_type === 'flat' ? 'Flat Amount (₹)' : 'Percentage (%)'}
                      </label>
                    </div>
                  </div>

                  {/* Option 1: Normal User Discount */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <label className="form-label fw-bold small text-uppercase text-primary mb-1">
                        <i className="fa-solid fa-user me-1"></i> Normal User Discount {formData.discount_type === 'flat' ? '(₹)' : '(%)'}
                      </label>
                      <input 
                        type="number" 
                        value={formData.discount} 
                        name="discount" 
                        className="form-control p-2.5 bg-white" 
                        placeholder="e.g. 10% for normal users" 
                        onChange={handleChange} 
                        onWheel={(e) => e.target.blur()} 
                      />
                      <div className="mt-2 d-flex align-items-center justify-content-between">
                        <small className="text-muted fw-semibold">Customer Selling Price:</small>
                        <span className="badge bg-primary fs-6 px-2.5 py-1">
                          ₹{formData.actual_price ? Number(formData.actual_price).toLocaleString('en-IN') : '0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Travel Agent Discount */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <label className="form-label fw-bold small text-uppercase text-success mb-1">
                        <i className="fa-solid fa-user-shield me-1"></i> Agent Discount / Commission {formData.discount_type === 'flat' ? '(₹)' : '(%)'}
                      </label>
                      <input 
                        type="number" 
                        value={formData.agent_discount} 
                        name="agent_discount" 
                        className="form-control p-2.5 bg-white" 
                        placeholder="e.g. 20% for travel agents" 
                        onChange={handleChange} 
                        onWheel={(e) => e.target.blur()} 
                      />
                      <div className="mt-2 d-flex align-items-center justify-content-between">
                        <small className="text-muted fw-semibold">Agent B2B Net Price:</small>
                        <span className="badge bg-success fs-6 px-2.5 py-1">
                          ₹{formData.agent_actual_price ? Number(formData.agent_actual_price).toLocaleString('en-IN') : '0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div id='packageMetaDetails' className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">SEO Details</span>
                  </div>
                  <MetaComponent metaDetails={formData} setMetaDetails={handleChange} setFormData={setFormData} />

                  <div className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">Package Itinerary</span>
                  </div>

                  <ItineraryComponent days={days} setDays={setDays} />

                  <div className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">Inclusions / Exclusions</span>
                  </div>

                  <InclusionsExclusions inclusions={inclusions} setInclusions={setInclusions} exclusions={exclusions} setExclusions={setExclusions} />

                  {/* Reference Hotels Selection Section */}
                  <div className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">
                      <i className="ri-hotel-line text-primary me-1"></i> Reference Hotels & Accommodation
                    </span>
                    <span className="badge bg-primary rounded-pill">
                      {selectedHotelIds.length} Hotels Linked
                    </span>
                  </div>

                  <div className="col-12 mb-3">
                    <p className="text-muted small mb-2">
                      Select reference hotels and partner stays to display on this package's detail page for customers:
                    </p>
                    {availableHotels.length === 0 ? (
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <small className="text-muted">No hotels created yet. </small>
                        <a href="/hotels/add" target="_blank" className="btn btn-xs btn-outline-primary ms-2 rounded-pill">
                          + Create Hotel
                        </a>
                      </div>
                    ) : (
                      <div className="row g-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {availableHotels.map((hotel) => {
                          const isSelected = selectedHotelIds.includes(Number(hotel.id));
                          const hotelImg = hotel.main_image
                            ? (hotel.main_image.startsWith('http') || hotel.main_image.startsWith('/')
                              ? hotel.main_image
                              : `${process.env.NEXT_PUBLIC_SERVER_URL}${hotel.main_image}`)
                            : "/images/noimage.jpg";

                          return (
                            <div key={hotel.id} className="col-md-6">
                              <div
                                onClick={() => toggleHotelSelection(hotel.id)}
                                className={`p-2.5 rounded-3 border d-flex align-items-center gap-2.5 cursor-pointer transition-all ${
                                  isSelected ? 'bg-primary bg-opacity-10 border-primary shadow-2xs' : 'bg-light hover-bg-white'
                                }`}
                                style={{ cursor: 'pointer', borderLeft: isSelected ? '4px solid #0d6efd' : undefined }}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input m-0 cursor-pointer"
                                  checked={isSelected}
                                  onChange={() => {}}
                                />
                                <div className="rounded overflow-hidden flex-shrink-0" style={{ width: '42px', height: '32px' }}>
                                  <img
                                    src={hotelImg}
                                    alt={hotel.name}
                                    className="w-100 h-100 object-fit-cover"
                                    onError={(e) => { e.target.src = "/images/noimage.jpg"; }}
                                  />
                                </div>
                                <div className="overflow-hidden flex-grow-1">
                                  <span className="fw-semibold text-dark text-truncate d-block small mb-0">
                                    {hotel.name}
                                  </span>
                                  <small className="text-muted d-block text-2xs">
                                    ★ {hotel.star_rating || 3} Star • {hotel.city_name || hotel.zone_name || 'Sundarban'}
                                  </small>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">Terms & Conditions</span>
                  </div>

                  <TermsAndConditions policies={policies} setPolicies={setPolicies} />

                  <div className="col-12 pt-3">
                    {
                      postLoading ?
                        <button type="button" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm w-100 w-md-auto">
                          <div className="spinner-border text-light" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </button>
                        :
                        <button onClick={handleCreatePackage} type="button" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm w-100 w-md-auto">
                          Create Package
                        </button>
                    }
                  </div>
                </div>
              </div>

              {/* Right Side: Classification & Media Upload */}
              <div className="col-lg-5 p-4 p-md-5 bg-light d-flex flex-column gap-4">
                
                {/* 1. Classification & Location Card */}
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3 text-primary">
                      <i className="bi bi-geo-alt-fill fs-4"></i>
                    </div>
                    <div>
                      <h4 className="fw-bold mb-0">Location &amp; Destination</h4>
                      <p className="text-muted small mb-0">Select Category, City, and Destination routes.</p>
                    </div>
                  </div>

                  {/* Platform Visibility */}
                  <div className="my-3 p-3 bg-light rounded-3 border">
                    <label className="form-label fw-bold small text-uppercase text-secondary mb-2 d-flex align-items-center justify-content-between">
                      <span><i className="ri ri-global-line me-1 text-primary"></i> Platform Visibility <span className='text-danger'>*</span></span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Visibility</span>
                    </label>
                    <select 
                      name="platform" 
                      value={formData.platform || 'both'} 
                      onChange={handleChange}
                      className="form-select p-2.5 fw-semibold"
                    >
                      <option value="both">🌐 Show on Both (DeltaSafari &amp; Sundarban)</option>
                      <option value="deltasafari">⛵ Delta Safari Only</option>
                      <option value="sundarban">🐅 Sundarban DeltaSafari Only</option>
                    </select>
                    <small className="text-muted d-block mt-1">
                      Control which booking website this package is visible on.
                    </small>
                  </div>

                  {/* Package Category */}
                  <div id='category' className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-bold small text-uppercase text-secondary mb-0">
                        Package Category <span className='text-danger'>*</span>
                      </label>
                      <Link href="/news/category" target="_blank" className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-decoration-none">
                        <i className="ri-add-line me-1"></i>+ Category
                      </Link>
                    </div>
                    {PackageLoading ? (
                      <div className="p-3 text-center bg-white rounded-3 border">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        <span className="small text-muted">Loading categories...</span>
                      </div>
                    ) : (
                      <MultiLevelSelect
                        categories={packageType}
                        selectedId={formData.category}
                        onSelect={(category) => { handleSelection(category, 'category') }}
                        type="select"
                        name="Category"
                        placeholder="Search category..."
                      />
                    )}
                  </div>

                  {/* Package City */}
                  <div id='city' className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-bold small text-uppercase text-secondary mb-0">
                        <i className="ri-map-pin-2-line text-primary me-1"></i> Package City
                      </label>
                      <Link href="/cities/add" target="_blank" className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-decoration-none">
                        <i className="ri-add-line me-1"></i>+ Add City
                      </Link>
                    </div>
                    {citiesLoading ? (
                      <div className="p-3 text-center bg-white rounded-3 border">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        <span className="small text-muted">Loading cities...</span>
                      </div>
                    ) : (
                      <MultiLevelSelect
                        categories={formattedCities}
                        selectedId={formData.city}
                        onSelect={(city) => { handleSelection(city, 'city') }}
                        type="select"
                        name="City"
                        placeholder="Search city (e.g. Sundarban, Kolkata, Shimla)..."
                      />
                    )}
                  </div>

                  {/* From Destination */}
                  <div id='from_destination' className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-bold small text-uppercase text-secondary mb-0">
                        From Destination (Pickup Point) <span className='text-danger'>*</span>
                      </label>
                      <Link href="/zone/add" target="_blank" className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-decoration-none">
                        <i className="ri-add-line me-1"></i>+ Add Destination
                      </Link>
                    </div>
                    {loading ? (
                      <div className="p-3 text-center bg-white rounded-3 border">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        <span className="small text-muted">Loading destinations...</span>
                      </div>
                    ) : (
                      <MultiLevelSelect
                        categories={zoneData}
                        selectedId={formData.from_destination}
                        onSelect={(category) => { handleSelection(category, 'from_destination') }}
                        type="select"
                        name="From Destination"
                        placeholder="Search starting pickup destination..."
                      />
                    )}
                  </div>

                  {/* To Destination */}
                  <div id='to_destination' className="mb-0">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-bold small text-uppercase text-secondary mb-0">
                        To Destination (Tour Spot) <span className='text-danger'>*</span>
                      </label>
                      <Link href="/zone/add" target="_blank" className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-decoration-none">
                        <i className="ri-add-line me-1"></i>+ Add Destination
                      </Link>
                    </div>
                    {loading ? (
                      <div className="p-3 text-center bg-white rounded-3 border">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        <span className="small text-muted">Loading destinations...</span>
                      </div>
                    ) : (
                      <MultiLevelSelect
                        categories={zoneData}
                        selectedId={formData.to_destination}
                        onSelect={(category) => { handleSelection(category, 'to_destination') }}
                        type="select"
                        name="To Destination"
                        placeholder="Search tour destination spot..."
                      />
                    )}
                  </div>
                </div>

                {/* 2. Media Upload Card */}
                <div id='media' className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <div className="d-flex align-items-center mb-4">
                    <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3 text-success">
                      <i className="bi bi-images fs-3"></i>
                    </div>
                    <div>
                      <h4 className="fw-bold mb-0">Package Media</h4>
                      <p className="text-muted small mb-0">Upload high quality images and short videos.</p>
                    </div>
                  </div>

                  <MultiMediaUpload images={images} setImages={setImages} videos={videos} setVideos={setVideos} />
                </div>

              </div>

            </div>
          </div>}
        </div>
      </div>

      {/* Duplicate Slug / Name Warning Modal */}
      {duplicateWarningModal.open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              padding: '30px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '16px'
              }}
            >
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
              Duplicate Package Name
            </h4>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              {duplicateWarningModal.msg}
            </p>
            <button
              type="button"
              className="btn btn-primary w-100 py-2.5 rounded-pill fw-bold"
              onClick={() => setDuplicateWarningModal({ open: false, msg: '' })}
            >
              Okay, I will change the title
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default page;