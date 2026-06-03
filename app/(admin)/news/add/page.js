"use client";
// import Editor from '@/components/blogs/Editor';
import EditorTinyMCE from '@/components/blogs/EditorTinyMCE';
import MediaUpload from '@/components/blogs/MediaUpload';
import MultiLevelSelect from '@/components/blogs/MultiLevelSelect';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { showMessage } from '@/libs/commonHelper';
import TagsInputCustom from '@/components/blogs/TagsInputCustom';
import { createNewsUrl, getAllCategoryUrl } from '@/app/routes/serviceRoutes';
import Loading from '@/components/common/Loading';

export default function page() {
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [categoryData, setCategoryData] = useState([])
  const token = useSelector((state) => state.adminAuth?.token);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category_id: '',
    status: 1,
    tags: [],
    featured_video: '',
    featured_image: ''
  });
  const [selectedParent, setSelectedParent] = useState({ id: null, name: 'None (Root)' });
  const route = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  function setTags(data) {
    setFormData({ ...formData, tags: data })
  }

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
        setCategoryData(res.category)
        if (res.category.length > 0) {
          handleSelection(res.category[0]);
          setLoading(false)
        }
      }
    }).catch((err) => {
      showMessage("Something went wrong! " + err.message)
    })
  }, [])


  const handleEditorChange = (htmlContent, editor) => {
    setFormData({ ...formData, content: htmlContent });
  };

  const handleSelection = (category) => {
    setSelectedParent({ id: category.id, name: category.name });
    setFormData({ ...formData, category_id: category?.id })
  };

  async function handleSubmit() {
    if (!posting) {
      if (formData.title && formData.summary && formData.content && formData.featured_image) {
        setPosting(true);
        const formDataNew = new FormData();
        Object.keys(formData).forEach(key => {
          formDataNew.append(key, formData[key]);
        });
        try {
          const response = await axios.post(createNewsUrl, formDataNew, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });
          setPosting(false);
          if (response.status) {
            route.push("/news")
          } else {
            showMessage("error", "Something went wrong please try again later.")
          }
        } catch (error) {
          showMessage('error', `Submission failed ${error}`);
          setPosting(false);
        }
      } else {
        showMessage("error", "Please update all fields to create a post.")
      }
    } else {
      showMessage("error", "We are uploading your post...")
    }
  }

  return (
    <div className=" py-5 mt-10">
      <div className="row justify-content-center">
        <div className='col-lg-11 card mb-3'>
          <div className=' card-header d-flex justify-content-between p-3 pb-4'>
            <div>
              <h3>Create New Blog</h3>
              <p className='mb-0'>Manage your blog beautifully</p>
            </div>
          </div>
        </div>
        {!loading ?
        <Loading />
        :
        <div className="col-lg-11 card">
          <form onSubmit={(e) => { e.preventDefault() }} className="row">
            {/* Main Content Area */}
            <div className="col-md-12 mt-2">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  {/* Title & Slug */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Title</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      placeholder="Title of the article"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Summary */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Short Description</label>
                    <textarea
                      name="summary"
                      className="form-control"
                      rows="3"
                      placeholder="Write a brief summary."
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  {/* Content Editor Placeholder */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Content</label>
                    <div className="bg-light rounded p-3 text-center border" style={{ minHeight: '400px' }}>
                      <EditorTinyMCE handleEditorChange={handleEditorChange} />
                    </div>
                  </div>
                  <div className="mb-3 mt-1">
                    <TagsInputCustom tags={formData.tags} setTags={setTags} />
                  </div>
                </div>
              </div>
            </div>

            <div className='col-md-6'>
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <div className="card-header bg-white py-3">
                    <h6 className="mb-0 fw-bold">Organization</h6>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select name="status" value={1} className="form-select" onChange={handleChange}>
                      <option value="0">Draft</option>
                      <option value="1">Published</option>
                    </select>
                  </div>
                  <MediaUpload setImage={(imgFile) => { setFormData({ ...formData, featured_image: imgFile }) }} setVideo={(videoFile) => { setFormData({ ...formData, featured_video: videoFile }) }} />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              {/* Status & Category */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white py-3">
                  <h6 className="mb-0 fw-bold">Category</h6>
                </div>
                <div className="card-body">
                  <div className="mb-0">
                    <MultiLevelSelect
                      categories={categoryData}
                      selectedId={selectedParent.id}
                      onSelect={handleSelection}
                      type="select"
                    />
                  </div>
                </div>
              </div>
            </div>


            <div className='mt-4 mb-3 d-flex justify-content-end'>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary">Save Draft</button>
                <button onClick={handleSubmit} className="btn btn-primary">Publish Post</button>
              </div>
            </div>
          </form>
        </div>}
      </div>
    </div>
  );
}