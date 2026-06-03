"use client"
import { getAllCategoryUrl, getParticularCategoryUrl, setCategoryUrl } from '@/app/routes/serviceRoutes';
import MultiLevelSelect from '@/components/blogs/MultiLevelSelect';
import Loading from '@/components/common/Loading';
import LoadingComponent from '@/components/common/LoadingComponent';
import { showMessage } from '@/libs/commonHelper';
import { urlDecode } from '@/libs/urlHelper';
import axios from 'axios';
import { redirect, useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

export default function page() {
    const params = useParams();
    const categoryId = urlDecode(params?.slug);
    if (!categoryId) {
        redirect('/news/category');
    }
    const [formData, setFormData] = useState({
        name: '',
        parent_id: '',
        description: '',
        sort_order: 1,
        image: null,
        showleft: false
    });
    const [category, setCategory] = useState(null)
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(true);
    const [parentCatLoading, setParentCatLoading] = useState(true);
    const [categoryData, setCategoryData] = useState([])
    const token = useSelector((state) => state.adminAuth?.token);
    const [selectedParent, setSelectedParent] = useState({ id: null });

    const route = useRouter();

    const handleChange = (e) => {
        const { name, value } = e.target;
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
            showMessage('Error fetching data:', error.response ? error.response.data : error.message);
            setTimeout(() => {
                route.push('/news/category')
            }, 2500);
        }
    }

    async function getParticularCategories() {
        try {
            const response = await axios.get(`${getParticularCategoryUrl}?id=${categoryId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            showMessage('Error fetching data:', error.response ? error.response.data : error.message);
            setTimeout(() => {
                route.push('/news/category')
            }, 2500);
        }
    }

    useEffect(() => {
        getCategories().then((res) => {
            if (res.status) {
                setParentCatLoading(false)
                setCategoryData(res.category)
            } else {
                showMessage('Something went wrong, Please try again later')
            }
        }).catch((err) => {
            showMessage(err.message)
        }).finally(() => {
            getParticularCategories().then((response) => {
                if (response.status) {
                    setFormData({
                        name: response?.category?.name,
                        parent_id: response?.category?.parent_id,
                        description: response?.category?.description,
                        sort_order: response?.category?.sort_order,
                        showleft: response?.category?.showleft ? true : false,
                        id: response?.category?.id
                    })
                    setCategory(response?.category);
                    setSelectedParent({ id: response?.category?.parent_id })
                    setLoading(false);
                } else {
                    showMessage('Something went wrong, Please try again later')
                }
            }).catch((err) => {
                showMessage(err.message)
            })
        })
    }, [])

    const handleSelection = (category) => {
        setSelectedParent({ id: category.id });
    };

    const handleUpdateCategory = async () => {
        if (formData.name && formData.description && formData.sort_order) {
            const formDataNew = new FormData();
            Object.keys(formData).forEach(key => {
                formDataNew.append(key, formData[key]);
            });

            try {
                const response = await axios.put(setCategoryUrl, formDataNew, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data.status) {
                    route.push('/news/category');
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
                                            <h3 className="fw-bold mb-0">New Category</h3>
                                            <p className="text-muted small">Fill in the details to create a parking classification.</p>
                                        </div>
                                    </div>

                                    <form className="row g-4">
                                        <div className="col-md-8">
                                            <label className="form-label fw-bold small text-uppercase text-secondary">Category Name</label>
                                            <input type="text" name="name" value={formData?.name} className="form-control  p-3" placeholder="News Category Name" onChange={handleChange} />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-secondary">Sort Order</label>
                                            <input type="number" min={1} value={formData?.sort_order} name="sort_order" className="form-control  p-3" placeholder="1" onChange={handleChange} />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-bold small text-uppercase text-secondary">Description</label>
                                            <textarea name="description" value={formData?.description} className="form-control  p-3" rows="3" placeholder="Briefly describe this category..." onChange={handleChange}></textarea>
                                        </div>

                                        <div className="form-check form-switch ms-2">
                                            <input className="form-check-input" name='showleft' onChange={(event) => { setFormData({ ...formData, showleft: event.target.checked }); console.log(event.target.checked) }} type="checkbox" role="switch" id="switchCheckChecked" checked={formData.showleft == 1 ? true : false} />
                                            <label className="form-check-label" htmlFor="switchCheckChecked">Show this on left side bar</label>
                                        </div>
                                        {(category?.image || preview) && <div className='mt-3 mb-2' style={{ height: "250px" }}>
                                            <label className='mb-2'>Image Preview</label>
                                            <img src={preview ? preview : process.env.NEXT_PUBLIC_SERVER_URL + category?.image} className='w-100 h-100' style={{ objectFit: "fill" }} />
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
                                            <button onClick={handleUpdateCategory} type="button" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm w-100 w-md-auto">
                                                Update Category
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Right Side: Multi-level Parent Picker */}
                                <div className="col-lg-5">
                                    <div className="p-4">
                                        {parentCatLoading ?
                                            <Loading />
                                            :
                                            <MultiLevelSelect
                                                categories={categoryData}
                                                selectedId={selectedParent.id}
                                                onSelect={handleSelection}
                                                categoryId={category?.id}
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
