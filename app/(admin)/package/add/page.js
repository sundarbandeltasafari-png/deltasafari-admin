"use client"
import { createPackageUrl } from '@/app/routes/packageRoutes';
import { getAllPackageTypeUrl, getAllZoneUrl } from '@/app/routes/serviceRoutes';
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
    duration_days: '',
    duration_nights: '',
    base_price: '',
    discount_type: 'percentage',
    discount: '',
    actual_price: '',
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

  useEffect(() => {
    const base = Number(formData.base_price) || 0;
    const disc = Number(formData.discount) || 0;
    if (base > 0) {
      let actualPrice = 0;
      if (formData.discount_type === 'flat') {
        actualPrice = base - disc;
      } else {
        actualPrice = base - ((base * disc) / 100);
      }
      setFormData((prev) => ({ ...prev, actual_price: actualPrice > 0 ? Math.round(actualPrice) : 0 }));
    } else {
      setFormData((prev) => ({ ...prev, actual_price: '' }));
    }
  }, [formData.base_price, formData.discount, formData.discount_type]);


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

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Base Price (₹) <span className='text-danger'>*</span></label>
                    <input type="number" value={formData.base_price} name="base_price" className="form-control  p-3" placeholder="Package Base Price" onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Discount Type</label>
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
                      <label className="form-check-label ms-2 mt-1" htmlFor="discountTypeSwitch">
                        {formData.discount_type === 'flat' ? 'Flat (₹)' : 'Percentage (%)'}
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Discount {formData.discount_type === 'flat' ? '(₹)' : '(%)'}</label>
                    <input type="number" value={formData.discount} name="discount" className="form-control  p-3" placeholder="Package Discount" onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Actual Price (₹) <span className='text-danger'>*</span></label>
                    <input type="number" className="form-control  p-3" value={formData.actual_price} placeholder="Package Actual Price" disabled={true} onWheel={(e) => e.target.blur()} />
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

      {/* Duplicate Slug Warning Modal */}
      {duplicateWarningModal.open && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header bg-warning bg-opacity-10 border-bottom-0 p-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
                  Duplicate Package Name Warning
                </h5>
                <button type="button" className="btn-close" onClick={() => setDuplicateWarningModal({ open: false, msg: '' })}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger fw-semibold mb-3 p-3 rounded-3">
                  <i className="bi bi-x-circle-fill me-2 fs-5"></i>
                  {duplicateWarningModal.msg}
                </div>
                <p className="text-muted small mb-0">
                  Please update the package name to a unique title. Details and images will not be saved until the package name is unique.
                </p>
              </div>
              <div className="modal-footer border-top-0 justify-content-center p-3">
                <button type="button" className="btn btn-primary rounded-pill px-4 fw-bold" onClick={() => setDuplicateWarningModal({ open: false, msg: '' })}>
                  Got it, I will change title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default page