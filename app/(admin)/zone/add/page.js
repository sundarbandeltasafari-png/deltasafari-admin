"use client"
import {createZoneUrl, getAllZoneUrl } from '@/app/routes/serviceRoutes';
import MultiLevelSelect from '@/components/blogs/MultiLevelSelect';
import MetaComponent from '@/components/seocomponent/MetaComponent';
import TouristGuideComponent, { defaultGuideData } from '@/components/seocomponent/TouristGuideComponent';
import { showMessage } from '@/libs/commonHelper';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

function page() {
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    description: '',
    sort_order: 1,
    image: null,
    top_trending: false,
    top_destination: false,
    show_in_corporate: false,
    corporate_tag: '',
    showing_text: '',
    meta_title: '',
    meta_description: '',
    tags: [],
    canonical_url: '',
    og_title: '',
    og_description: '',
    robots_meta: 'index, follow'
  });
  const [guideData, setGuideData] = useState(defaultGuideData);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zoneData, setZoneData] = useState([])
  const token = useSelector((state) => state.adminAuth?.token);
  const route = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(value)
    setFormData({ ...formData, [name]: value });
  };

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const processFile = (file) => {
    setFormData({ ...formData, image: file });
    setPreview(URL.createObjectURL(file));
  };

  async function getZones() {
    try {
      const response = await axios.get(getAllZoneUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      return new Error('Error fetching data:', error.response ? error.response.data : error.message);
    }
  }

  useEffect(() => {
    getZones().then((res) => {
      if (res.status) {
        setLoading(false);
        setZoneData(res.zone)
      }else{
        showMessage('Something went wrong! Please try again later.')
      }
    }).catch((err)=>{
        showMessage('Something went wrong! Please try again later.')
    })
  }, [])

  const handleSelection = (category) => {
    setFormData({...formData, parent_id: category.id });
  };

  const handleCreateZone = async () => {
    // Validation 
    if (formData.name && formData.description && formData.sort_order) {
      const formDataNew = new FormData();

      // Convert JSON keys to FormData fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataNew.append(key, typeof formData[key] === 'object' && !(formData[key] instanceof File) ? JSON.stringify(formData[key]) : formData[key]);
        }
      });

      // Append Tourist Guide config
      formDataNew.append('tourist_guide', JSON.stringify(guideData));

      try {
        const response = await axios.post(createZoneUrl, formDataNew, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data.status) { 
          route.push('/zone');
        }
      } catch (error) {
        showMessage('Submission failed', error);
      }
    }
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
                    <i className="bi bi-folder-plus fs-3"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0">New Destination Create</h3>
                    <p className="text-muted small">Fill in the details to create a Destination.</p>
                  </div>
                </div>

                <form className="row g-4">
                  <div className="col-md-8">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Destination Name</label>
                    <input type="text" name="name" className="form-control  p-3" placeholder="Destination Name" onChange={handleChange} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Sort Order</label>
                    <input type="number" min={1} name="sort_order" className="form-control  p-3" placeholder="1" onChange={handleChange} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Description</label>
                    <textarea name="description" className="form-control  p-3" rows="3" placeholder="Briefly describe this Destination..." onChange={handleChange}></textarea>
                  </div>

                  <div className="form-check form-switch ms-2">
                    <input className="form-check-input" name='top_trending' onChange={(event) => { setFormData({ ...formData, top_trending: event.target.checked }) }} type="checkbox" role="switch" id="topTrendingSwitch" />
                    <label className="form-check-label" htmlFor="topTrendingSwitch">Showing in Top Trending</label>
                  </div>

                  <div className="form-check form-switch ms-2">
                    <input className="form-check-input" name='top_destination' onChange={(event) => { setFormData({ ...formData, top_destination: event.target.checked }) }} type="checkbox" role="switch" id="topDestinationSwitch" />
                    <label className="form-check-label" htmlFor="topDestinationSwitch">Top Destination</label>
                  </div>

                  {formData.top_destination && (
                    <div className="col-12 mt-2">
                      <label className="form-label fw-bold small text-uppercase text-secondary">Showing Text</label>
                      <input type="text" name="showing_text" className="form-control p-3" placeholder="Showing Text" onChange={handleChange} />
                    </div>
                  )}

                  <div className="form-check form-switch ms-2">
                    <input 
                      className="form-check-input" 
                      name='show_in_corporate' 
                      onChange={(event) => { setFormData({ ...formData, show_in_corporate: event.target.checked }) }} 
                      type="checkbox" 
                      role="switch" 
                      id="showInCorporateSwitch" 
                      checked={formData.show_in_corporate} 
                    />
                    <label className="form-check-label" htmlFor="showInCorporateSwitch">Show in Corporate Destinations (/corporate)</label>
                  </div>

                  {formData.show_in_corporate && (
                    <div className="col-12 mt-2">
                      <label className="form-label fw-bold small text-uppercase text-secondary">Corporate Tag / Subtitle</label>
                      <input 
                        type="text" 
                        name="corporate_tag" 
                        value={formData.corporate_tag || ''} 
                        className="form-control p-3" 
                        placeholder="e.g. Jungle & Boat Safari, Mountain Offsite, International MICE" 
                        onChange={handleChange} 
                      />
                    </div>
                  )}

                  {/* SEO Meta Details Component */}
                  <MetaComponent metaDetails={formData} setMetaDetails={handleChange} setFormData={setFormData} />

                  {/* Tourist Guide Section Configuration */}
                  <div className="col-12">
                    <TouristGuideComponent guideData={guideData} setGuideData={setGuideData} entityName="Destination" />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Upload Icon/Image</label>
                    <div
                      className={`drag-drop-zone transition-all d-flex flex-column align-items-center justify-content-center border-2 rounded-4 p-5 ${isDragging ? 'bg-primary bg-opacity-10 border-primary' : 'bg-light border-dashed'}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('fileInput').click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <input id="fileInput" type="file" className="d-none" accept="image/*" onChange={(e) => processFile(e.target.files[0])} />
                      <i className={`bi ${preview ? 'bi-check-circle-fill text-success' : 'bi-cloud-arrow-up text-primary'} display-4 mb-2`}></i>
                      <p className="mb-0 fw-semibold text-dark">{preview ? 'Image Selected!' : 'Drag & Drop image here'}</p>
                      <p className="text-muted small">or click to browse your files</p>
                    </div>
                  </div>

                  <div className="col-12 pt-3">
                    <button onClick={handleCreateZone} type="button" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm w-100 w-md-auto">
                      Create Destination
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side: Multi-level Parent Picker */}
              <div className="col-lg-5">
                <div className="p-4">
                  <MultiLevelSelect
                    categories={zoneData}
                    selectedId={formData.parent_id}
                    onSelect={handleSelection}
                    name='Zone'
                  />
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