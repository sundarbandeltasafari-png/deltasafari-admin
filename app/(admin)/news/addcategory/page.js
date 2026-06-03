"use client"
import { createCategoryUrl, getAllCategoryUrl } from '@/app/routes/serviceRoutes';
import MultiLevelSelect from '@/components/blogs/MultiLevelSelect';
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
    showleft: false
  });
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState([])
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
      const response = await axios.get(getAllCategoryUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error.response ? error.response.data : error.message);
    }
  }

  useEffect(() => {
    getCategories().then((res) => {
      if (res.status) {
        setLoading(false);
        setCategoryData(res.category)
      }
    })
  }, [])


  const handleSelection = (category) => {
    setFormData({ ...formData, parent_id: category.id});
  };

  const handleCreateCategory = async () => {
    // Validation 
    if (formData.name && formData.description && formData.sort_order) {
      const formDataNew = new FormData();

      // Convert JSON keys to FormData fields
      Object.keys(formData).forEach(key => {
        formDataNew.append(key, formData[key]);
      });

      try {
        const response = await axios.post(createCategoryUrl, formDataNew, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data.status) { 
          route.push('/news/category');
        }
      } catch (error) {
        console.error('Submission failed', error);
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
                    <h3 className="fw-bold mb-0">New Category</h3>
                    <p className="text-muted small">Fill in the details to create a parking classification.</p>
                  </div>
                </div>

                <form className="row g-4">
                  <div className="col-md-8">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Category Name</label>
                    <input type="text" name="name" className="form-control  p-3" placeholder="News Category Name" onChange={handleChange} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Sort Order</label>
                    <input type="number" min={1} name="sort_order" className="form-control  p-3" placeholder="1" onChange={handleChange} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Description</label>
                    <textarea name="description" className="form-control  p-3" rows="3" placeholder="Briefly describe this category..." onChange={handleChange}></textarea>
                  </div>

                  <div class="form-check form-switch ms-2">
                    <input class="form-check-input" name='showleft' onChange={(event)=>{setFormData({...formData, showleft: event.target.checked})}} type="checkbox" role="switch" id="switchCheckChecked" />
                      <label class="form-check-label" for="switchCheckChecked">Show this on left side bar</label>
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
                    <button onClick={handleCreateCategory} type="button" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm w-100 w-md-auto">
                      Create Category
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side: Multi-level Parent Picker */}
              <div className="col-lg-5">
                <div className="p-4">
                  <MultiLevelSelect
                    categories={categoryData}
                    selectedId={formData.parent_id}
                    onSelect={handleSelection}
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