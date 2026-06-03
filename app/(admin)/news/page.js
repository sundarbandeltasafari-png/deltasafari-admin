"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import DeleteModal from '@/components/admin/common/DeleteModal';
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import { deleteNewsUrl, getAllNewsUrl } from "../../routes/serviceRoutes";
import { formatDate } from '@/libs/timeHelper';
import { decodeBlob } from '@/libs/decodeHelper';
import NotFound from '@/components/common/NotFound';

function page() {
  const route = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const token = useSelector((state) => state.adminAuth?.token);
  const [deleteStatus, setDeleteStatus] = useState(false);
  const [deleteBlog, setDeleteBlog] = useState(null)
  const permisions = useSelector((state) => state.permision?.permisions);

  async function getAllPosts() {
    try {
      const response = await axios.get(getAllNewsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      showMessage('Error fetching data:', error.response ? error.response.data : error.message);
    }
  }

  useEffect(() => {
    getAllPosts().then((res) => {
      if (res.status) {
        setLoading(false);
        setPosts(res.posts)
      } else {
        showMessage('Something went wrong, Please try again later')
      }
    }).catch((err) => {
      showMessage(`Something went wrong, ${err.message}`)
    })
  }, [])

  function handleDeleteDetect(blog) {
    setDeleteBlog(blog)
    setDeleteStatus(true)
  }
  
  async function handleDelete(postId) {
    try {
      const response = await axios.delete(deleteNewsUrl, {
        condition: {
          id: postId
        }
      },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      if (!response.status) {
        showMessage('Something went wrong when deleting blog.');
      } else {
        setPosts(posts.filter((elem) => elem.id != postId))
      }
    } catch (error) {
      showMessage('Error updating data:', error.response ? error.response.data : error.message);
    }

  }

  return (
    <section className='p-3'>
      <div className='card mt-10'>
        <div className=' card-header d-flex justify-content-between p-3 pb-4'>
          <div>
            <h5>Blog Dashboard</h5>
            <p className='mb-0'>Manage your content beautifully</p>
          </div>
          <div>
            {permisions.includes('/news/add') && <button onClick={() => { route.push("/news/add") }} className='btn btn-primary' variant="primary">
              <i className="bi bi-plus-lg me-3"></i>
              Add New Blog
            </button>}
          </div>
        </div>
      </div>
      <div className="pt-3">
        {!loading && <div className="row g-4">
          {posts?.length > 0 ? posts.map((blog, index) => {
            return <div key={index} className="col-lg-3 col-md-4">
              <div className="blog-card card shadow-sm p-3">
                <div className="position-relative">
                  <img src={`${process.env.NEXT_PUBLIC_SERVER_URL}${blog.featured_image}`} style={{ height: "250px", borderRadius: "10px" }} className="w-100 blog-img" />
                  {blog.status == 1 ?
                    <div className="ribbon position-absolute bg-success" style={{ top: "10px", right: "10px" }}>
                      <span >Published</span>
                    </div>
                    :
                    <div className="ribbon position-absolute bg-secondary" style={{ top: "10px", right: "10px" }}>
                      <span >Draft</span>
                    </div>
                  }
                  <div className="overlay d-flex gap-2 mt-0" style={{ borderRadius: "10px" }}>
                    <button className="btn btn-light"><i className="bi bi-eye"></i></button>
                    {permisions.includes('/news/edit') && <>
                      <button className="btn btn-warning" onClick={() => { route.push('/news/edit/' + urlEncode(blog?.id)) }}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-danger" onClick={() => { handleDeleteDetect(blog) }}><i className="bi bi-trash"></i></button>
                    </>}
                  </div>
                </div>
                <div className="p-3">
                  <h5 className="fw-semibold singleline">{decodeBlob(blog.title)}</h5>
                  <p className="text-muted small mb-3 twoline">
                    {decodeBlob(blog.summary)}
                  </p>
                  <div className="d-flex justify-content-between align-items-center blog-footer">
                    <div>
                      <strong>Admin</strong><br />
                      <div className='d-flex gap-2'>
                        <i className="bi bi-calendar"></i>
                        <h6 className="text-muted">{formatDate(blog.created_at)}</h6>
                      </div>
                    </div>
                    <div className="text-start d-flex gap-3">
                      <div className="stat"><i className="bi bi-eye"></i> 0</div>
                      <div className="stat"><i className="bi bi-chat"></i> 0</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          })
          :
          <NotFound />
          }
        </div>}
        <DeleteModal status={deleteStatus} onChangeStatus={setDeleteStatus} handleChange={handleDelete} post={deleteBlog} />
      </div>
    </section>
  )
}

export default page