"use client"
import { getAllZoneUrl, getParticularZoneUrl, setZoneUrl } from '@/app/routes/serviceRoutes';
import MultiLevelSelect from '@/components/blogs/MultiLevelSelect';
import LoadingComponent from '@/components/common/LoadingComponent';
import { showMessage } from '@/libs/commonHelper';
import { urlDecode } from '@/libs/urlHelper';
import axios from 'axios';
import { redirect, useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

export default function page() {
  const params = useParams();

  if (!params?.slug) {
    redirect('/zone');
  }
  const categoryId = urlDecode(params?.slug);
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    description: '',
    sort_order: 1,
    image: null,
    showleft: false
  });
  const [zone, setZone] = useState(null)
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parentCatLoading, setParentCatLoading] = useState(true);
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

  async function getCategories() {
    try {
      const response = await axios.get(getAllZoneUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      showMessage('Error fetching data:', error.response ? error.response.data : error.message);
      setTimeout(() => {
        route.push('/zone')
      }, 2500);
    }
  }

  async function getParticularCategories() {
    try {
      const response = await axios.post(getParticularZoneUrl, {
        condition: {
          id: categoryId
        }
      },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

      return response.data;
    } catch (error) {
      showMessage('Error fetching data:', error.response ? error.response.data : error.message);
      setTimeout(() => {
        route.push('/zone')
      }, 2500);
    }
  }

  useEffect(() => {
    getCategories().then((res) => {
      if (res.status) {
        setParentCatLoading(false)
        setZoneData(res.zone)
      } else {
        showMessage('Something went wrong, Please try again later')
      }
    }).catch((err) => {
      showMessage(err.message)
    }).finally(() => {
      getParticularCategories().then((response) => {
        if (response.status) {
          setFormData({
            name: response?.zone?.name,
            parent_id: response?.zone?.parent_id,
            description: response?.zone?.description,
            sort_order: response?.zone?.sort_order,
            showleft: response?.zone?.showleft ? true : false,
            id: response?.zone?.id
          })
          setZone(response?.zone);
          setLoading(false);
        } else {
          showMessage('Invalid zone, Please try again later.')
        }
      }).catch((err) => {
        showMessage(err.message)
      })
    })
  }, [])

  const handleSelection = (category) => {
    setFormData({...formData, parent_id: category.id });
  };

  const handleUpdateZone = async () => {
    if (formData.name && formData.description && formData.sort_order) {
      const formDataNew = new FormData();
      Object.keys(formData).forEach(key => {
        formDataNew.append(key, formData[key]);
      });

      try {
        const response = await axios.put(setZoneUrl, formDataNew, {
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
      <div className="row justify-content-center h-100">
        <div className="col-12">
          {loading ?
            <LoadingComponent />
            :
            <div className="card border-0 shadow-lg overflow-hidden rounded-4">
              <div className="row g-0">

                {/* Left Side: Interactive Form */}
                <div className="col-lg-7 p-4 p-md-5 bg-white" style={{ borderRightWidth: "1px", borderRightColor: "#8080802e", borderRightStyle: "solid" }}>
                  <div className="d-flex align-items-center mb-4">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3 text-primary">
                      <i className="bi bi-folder-plus fs-3"></i>
                    </div>
                    <div>
                      <h3 className="fw-bold mb-0">Update Destination</h3>
                      <p className="text-muted small">Fill in the details to create a parking classification.</p>
                    </div>
                  </div>

                  <form className="row g-4">
                    <div className="col-md-8">
                      <label className="form-label fw-bold small text-uppercase text-secondary">Destination Name</label>
                      <input type="text" name="name" value={formData?.name} className="form-control  p-3" placeholder="News Zone Name" onChange={handleChange} />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small text-uppercase text-secondary">Sort Order</label>
                      <input type="number" min={1} value={formData?.sort_order} name="sort_order" className="form-control  p-3" placeholder="1" onChange={handleChange} />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold small text-uppercase text-secondary">Description</label>
                      <textarea name="description" value={formData?.description} className="form-control  p-3" rows="3" placeholder="Briefly describe this zone..." onChange={handleChange}></textarea>
                    </div>

                    <div className="form-check form-switch ms-2">
                      <input className="form-check-input" name='showleft' onChange={(event) => { setFormData({ ...formData, showleft: event.target.checked }) }} type="checkbox" role="switch" id="switchCheckChecked" checked={formData.showleft == 1 ? true : false} />
                      <label className="form-check-label" htmlFor="switchCheckChecked">Show this on left side bar</label>
                    </div>
                    {(zone?.image || preview) && <div className='mt-3 mb-2' style={{ height: "250px" }}>
                      <label className='mb-2'>Image Preview</label>
                      <img src={preview ? preview : process.env.NEXT_PUBLIC_SERVER_URL + zone?.image} className='w-100 h-100' style={{ objectFit: "fill" }} />
                    </div>}
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
                      <button onClick={handleUpdateZone} type="button" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm w-100 w-md-auto">
                        Update Destination
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Side: Multi-level Parent Picker */}
                <div className="col-lg-5">
                  <div className="p-4">
                    {parentCatLoading ?
                      <LoadingComponent />
                      :
                      <MultiLevelSelect
                        categories={zoneData}
                        selectedId={formData.parent_id}
                        onSelect={handleSelection}
                        categoryId={zone?.id}
                      />}
                  </div>
                </div>
              </div>
            </div>}
        </div>
      </div>
    </div>
  )
}
