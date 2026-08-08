"use client"
import { createPackageUrl, getParticularPackageUrl, updatePackageUrl } from '@/app/routes/packageRoutes';
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
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

function page() {
  const params = useParams();
  const packageId = params?.slug;
  if (!packageId) {
    redirect('/news');
  }
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
    agent_discount: '',
    agent_actual_price: '',
    category: null,
    package_id: packageId
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
  const [zoneLoading, setZoneLoading] = useState(true);
  const [zoneData, setZoneData] = useState([])
  const [PackageLoading, setPackageLoading] = useState(true);
  const [packageType, setPackageType] = useState([]);
  const [assets, setAssets] = useState([]);
  const [deletedAssets, setDeletedAssets] = useState([])
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
      if (res.status) {
        setZoneData(res.zone)
        setZoneLoading(false);
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
    axiosGet(`${getParticularPackageUrl}?id=${packageId}`, token).then((response) => {
      if (response.status) {
        const pkg = response?.package
        setFormData({
          name: pkg?.title,
          description: pkg?.description,
          sort_order: pkg?.sort_order,
          meta_title: pkg?.meta_title,
          meta_description: pkg?.meta_description,
          tags: pkg?.tags && pkg?.tags.split(','),
          to_destination: pkg?.to_destination,
          from_destination: pkg?.from_destination,
          duration_days: pkg?.duration_days,
          duration_nights: pkg?.duration_nights,
          base_price: pkg?.base_price,
          discount_type: pkg?.discount_type || 'percentage',
          discount: pkg?.discount,
          actual_price: pkg?.actual_price,
          agent_discount: pkg?.agent_discount || '',
          agent_actual_price: pkg?.agent_actual_price || '',
          category: pkg?.package_type,
          package_id: packageId
        })
        setInclusions(JSON.parse(pkg?.inclusions));
        setExclusions(JSON.parse(pkg?.exclusions));
        setDays(
          response?.package?.itineraries?.map((day) => {
            return {
              ...day,
              details: Buffer.from(day?.details).toString('utf8'),
              roadmap: JSON.parse(day.roadmap)
            }
          })
        )
        setPolicies(
          response?.package?.policies?.map((policy) => {
            return {
              id: policy?.id,
              title: policy?.title,
              bullets: JSON.parse(policy.bullets)
            }
          })
        )
        setAssets(pkg?.assets)
        setLoading(false)
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
    else if (assets.length == 0 && images.length == 0 && videos.length == 0) {
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
    deletedAssets.forEach((delAsset) => {
      formDataNew.append('delAssets[]', JSON.stringify(delAsset));
    })
    axiosPost(updatePackageUrl, formDataNew, token, 'multipart/form-data').then((response) => {
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
                    <h3 className="fw-bold mb-0">Update Package</h3>
                    <p className="text-muted small">Fill in the details to update a Package.</p>
                  </div>
                </div>

                <div className="row g-4">
                  <div id='packageDetails' className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold small text-uppercase text-secondary">Package Details</span>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Package Name <span className='text-danger'>*</span></label>
                    <input type="text" value={formData?.name} name="name" className="form-control  p-3" placeholder="Destination Name" onChange={handleChange} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Sort Order <span className='text-danger'>*</span></label>
                    <input type="number" value={formData?.sort_order} name="sort_order" className="form-control  p-3" placeholder="1" onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase text-secondary mb-2">Description <span className='text-danger'>*</span></label>
                    <EditorTinyMCE
                      value={formData?.description}
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
                          Update Package
                        </button>
                    }
                  </div>
                </div>
              </div>

              {/* Right Side: Media Upload */}
              <div className="col-lg-5 p-4 p-md-5 bg-light d-flex flex-column justify-content-between">
                <div id='media'>
                  <div className="d-flex align-items-center mb-4">
                    <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3 text-success">
                      <i className="bi bi-images fs-3"></i>
                    </div>
                    <div>
                      <h3 className="fw-bold mb-0">Package Media</h3>
                      <p className="text-muted small">Upload high quality images and short videos.</p>
                    </div>
                  </div>

                  {
                    !PackageLoading &&
                    <div className="my-3">
                      <label className="form-label fw-bold small text-uppercase text-secondary">Package Category <span className='text-danger'>*</span></label>
                      <MultiLevelSelect active={formData.category} categories={packageType} handleSelection={(category) => { handleSelection(category, 'category') }} title="Select Category" />
                    </div>
                  }
                  <div className="my-3">
                    <label className="form-label fw-bold small text-uppercase text-secondary">From Destination <span className='text-danger'>*</span></label>
                    <MultiLevelSelect active={formData.from_destination} categories={zoneData} handleSelection={(category) => { handleSelection(category, 'from_destination') }} title="Select From Destination" />
                  </div>
                  <div className="my-3">
                    <label className="form-label fw-bold small text-uppercase text-secondary">To Destination <span className='text-danger'>*</span></label>
                    <MultiLevelSelect active={formData.to_destination} categories={zoneData} handleSelection={(category) => { handleSelection(category, 'to_destination') }} title="Select To Destination" />
                  </div>

                  <MultiMediaUpload assets={assets} setDeletedAssets={setDeletedAssets} images={images} setImages={setImages} videos={videos} setVideos={setVideos} />
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