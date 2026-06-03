"use client"
import { getAllZoneUrl } from '@/app/routes/serviceRoutes';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';
import ZoneCard from '@/components/zone/ZoneCard';
import { showMessage } from '@/libs/commonHelper';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

function page() {
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState([])
    const [sortedRoots, setsortedRoots] = useState([]);
    const route = useRouter();
    const token = useSelector((state) => state.adminAuth?.token);
    const permisions = useSelector((state) => state.permision?.permisions);

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
                setZones(res.zone)
                setsortedRoots([...res.zone].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
            }else{
                showMessage('Something went wrong, Please try again later')
            }
        }).catch((err)=>{
            showMessage(err.message)
        })
    }, [])

    return (
        <section className='p-3'>
            <div className='card mt-10'>
                <div className=' card-header d-flex justify-content-between p-3 pb-4'>
                    <div>
                        <h4>Destination Master</h4>
                        <p className='mb-0'>Manage your Destination Master</p>
                    </div>
                    <div>
                        {permisions.includes('/zone/add') && <button onClick={() => { route.push("/zone/add") }} className='btn btn-primary' variant="primary">
                            <i className="bi bi-plus-lg me-3"></i>
                            Add Destination
                        </button>}
                    </div>
                </div>
            </div>
            {loading ?
            <LoadingComponent />
            :
            <div className="category-explorer p-3">
                {sortedRoots.length == 0 ?
                <NotFound />
                :
                sortedRoots.map(cat => (
                    <ZoneCard key={cat.id} zone={cat} level={0} />
                ))}
            </div>}
        </section>
    )
}

export default page