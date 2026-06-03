"use client"
import { createPackageUrl } from '@/app/routes/packageRoutes';
import { getAllPackageTypeUrl, getAllZoneUrl } from '@/app/routes/serviceRoutes';
import MultiLevelSelect from '@/components/blogs/MultiLevelSelect';
import MultiMediaUpload from '@/components/blogs/MultiMediaUpload';
import LoadingComponent from '@/components/common/LoadingComponent';
import InclusionsExclusions from '@/components/package/InclusionsExclusions';
import ItineraryComponent from '@/components/package/ItineraryComponent';
import TermsAndConditions from '@/components/package/TermsAndConditions';
import MetaComponent from '@/components/seocomponent/MetaComponent';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { scrollToView, showMessage } from '@/libs/commonHelper';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
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
    duration_days: 0,
    duration_nights: 0,
    base_price: 0,
    discount: 0,
    actual_price: 0,
    category: null
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
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneData, setZoneData] = useState([])
  const [PackageLoading, setPackageLoading] = useState(true);
  const [packageType, setPackageType] = useState([]);
  const [postLoading, setPostLoading] = useState(false)
  const token = useSelector((state) => state.adminAuth?.token);
  const route = useRouter();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type == 'number' ? parseInt(Math.abs(value), 10) : value });
  };

  useEffect(() => {
    if (formData.base_price > 0) {
      const actualPrice = formData.base_price - ((formData.base_price * formData.discount) / 100);
      setFormData({ ...formData, actual_price: actualPrice })
    }
  }, [formData.base_price, formData.discount])


  useEffect(() => {
    axiosGet(getAllZoneUrl, token).then((res) => {
      if (res.status) {
        setZoneData(res.zone)
        setLoading(false);
      } else {
        showMessage('Something went wrong! Please try again later.')
      }
    }).catch((err) => {
      showMessage(err.message)
    })
    axiosGet(getAllPackageTypeUrl, token).then((res) => {
      if (res.status) {
        setPackageType(res.packageTypes)
        setPackageLoading(false);
      } else {
        showMessage('Something went wrong! Please try again later.')
      }
    }).catch((err) => {
      showMessage(err.message)
    })
  }, [])

  const handleSelection = (category, name) => {
    setFormData({ ...formData, [name]: category.id });
  };

  function showError(msg, container) {
    showMessage(msg);
    scrollToView(container)
    setPostLoading(false)
  }



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
      showError('Please update package meta details', 'packageMetaDetails');
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
    axiosPost(createPackageUrl, formDataNew, token, 'multipart/form-data').then((response) => {
      if (response.status) {
        showMessage(response.msg, "success");
        route.push('/package')
      } else {
        showMessage(response.msg)
        setPostLoading(false)
      }
    }).catch((err) => {
      showMessage(err.message)
      setPostLoading(false)
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
                    <i class="bi bi-box-fill fs-3"></i>
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
                    <input type="number" name="sort_order" className="form-control  p-3" placeholder="1" onChange={handleChange} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Description <span className='text-danger'>*</span></label>
                    <textarea name="description" className="form-control  p-3" rows="8" placeholder="Briefly describe this Package..." onChange={handleChange}></textarea>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Duration Days (3N/5D) <span className='text-danger'>*</span></label>
                    <input type="number" value={formData.duration_days} name="duration_days" className="form-control  p-3" placeholder="Package Days" onChange={handleChange} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Duration Nights (3N/5D) <span className='text-danger'>*</span></label>
                    <input type="number" value={formData.duration_nights} name="duration_nights" className="form-control  p-3" placeholder="Package Nights" onChange={handleChange} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Base Price (₹) <span className='text-danger'>*</span></label>
                    <input type="number" value={formData.base_price} name="base_price" className="form-control  p-3" placeholder="Package Base Price" onChange={handleChange} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Discount (%)</label>
                    <input type="number" value={formData.discount} name="discount" className="form-control  p-3" placeholder="Package Discount" onChange={handleChange} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Actual Price (₹) <span className='text-danger'>*</span></label>
                    <input type="number" className="form-control  p-3" value={formData.actual_price} placeholder="Package Actual Price" disabled={true} />
                  </div>

                  {/* <div class="form-check form-switch ms-2">
                    <input class="form-check-input" name='showleft' onChange={(event) => { setFormData({ ...formData, showleft: event.target.checked }) }} type="checkbox" role="switch" id="switchCheckChecked" />
                    <label class="form-check-label" for="switchCheckChecked">Show this on left side bar</label>
                  </div>
                  <div class="form-check form-switch ms-2">
                    <input class="form-check-input" name='showleft' onChange={(event) => { setFormData({ ...formData, showleft: event.target.checked }) }} type="checkbox" role="switch" id="switchCheckChecked" />
                    <label class="form-check-label" for="switchCheckChecked">Show this on left side bar</label>
                  </div>
                  <div class="form-check form-switch ms-2">
                    <input class="form-check-input" name='showleft' onChange={(event) => { setFormData({ ...formData, showleft: event.target.checked }) }} type="checkbox" role="switch" id="switchCheckChecked" />
                    <label class="form-check-label" for="switchCheckChecked">Show this on left side bar</label>
                  </div> */}

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

                  <div className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">Terms & Conditions</span>
                  </div>

                  <TermsAndConditions policies={policies} setPolicies={setPolicies} />

                  <div className="col-12 pt-3">
                    {
                      postLoading ?
                        <button type="button" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm w-100 w-md-auto">
                          <div class="spinner-border text-light" role="status">
                            <span class="visually-hidden">Loading...</span>
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

              {/* Right Side: Multi-level Parent Picker */}
              <div className="col-lg-5">
                <div className="p-4">
                  <div id='from_destination' className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">From Destination</span>
                  </div>
                  <MultiLevelSelect
                    categories={zoneData}
                    selectedId={formData.from_destination}
                    onSelect={handleSelection}
                    name='Zone'
                    type='Destination'
                    inputName={'from_destination'}
                  />
                </div>
                <div className="p-4">
                  <div id='to_destination' className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">To Destination</span>
                  </div>
                  <MultiLevelSelect
                    categories={zoneData}
                    selectedId={formData.to_destination}
                    onSelect={handleSelection}
                    name='Zone'
                    type='Destination'
                    inputName={'to_destination'}
                  />
                </div>
                <div className="p-4">
                  <div id='category' className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">Category</span>
                  </div>
                  {PackageLoading ?
                    <LoadingComponent />
                    :
                    <MultiLevelSelect
                      categories={packageType}
                      selectedId={formData.category}
                      onSelect={handleSelection}
                      name='Package'
                      type='Package Type'
                      inputName={'category'}
                    />}
                </div>
                <div className="p-4">
                  <div id='media' className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">Package Media</span>
                  </div>
                  <div className="col-12">
                    <MultiMediaUpload images={images} setImages={setImages} videos={videos} setVideos={setVideos} />
                  </div>
                </div>
              </div>
            </div>
          </div>}
        </div>
      </div>
    </div>
  )
}

export default page