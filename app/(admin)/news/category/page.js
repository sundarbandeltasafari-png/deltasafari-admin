"use client"
import { getAllCategoryUrl } from '@/app/routes/serviceRoutes';
import CategoryCard from '@/components/blogs/CategoryCard';
import NotFound from '@/components/common/NotFound';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

function page() {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([])
    const [sortedRoots, setsortedRoots] = useState([]);
    const route = useRouter();
    const token = useSelector((state) => state.adminAuth?.token);
    const permisions = useSelector((state) => state.permision?.permisions);

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
            return new Error('Error fetching data:', error.response ? error.response.data : error.message);
        }
    }

    useEffect(() => {
        getCategories().then((res) => {
            if (res.status) {
                setLoading(false);
                setCategories(res.category)
                setsortedRoots([...res.category].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
            } else {

            }
        })
    }, [])

    return (
        <section className='p-3'>
            <div className='card mt-10'>
                <div className=' card-header d-flex justify-content-between p-3 pb-4'>
                    <div>
                        <h4>Blog Category</h4>
                        <p className='mb-0'>Manage your blog category</p>
                    </div>
                    <div>
                        {permisions.includes('/news/addcategory') && <button onClick={() => { route.push("/news/addcategory") }} className='btn btn-primary' variant="primary">
                            <i className="bi bi-plus-lg me-3"></i>
                            Add Category
                        </button>}
                    </div>
                </div>
            </div>
            {!loading && <div className="category-explorer p-3">
                {sortedRoots.length > 0 ?
                    sortedRoots.map(cat => (
                        <CategoryCard key={cat.id} category={cat} level={0} />
                    ))
                    :
                    <NotFound />
                }
            </div>}
        </section>
    )
}

export default page