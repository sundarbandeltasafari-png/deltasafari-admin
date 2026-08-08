"use client"
import { deleteZoneUrl, getAllZoneUrl } from '@/app/routes/serviceRoutes';
import DeleteModal from '@/components/admin/common/DeleteModal';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';
import ZoneCard from '@/components/zone/ZoneCard';
import { axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

function page() {
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState([])
    const [sortedRoots, setsortedRoots] = useState([]);
    const [deleteStatus, setDeleteStatus] = useState(false);
    const [deletePackage, setDeletePackage] = useState(null);
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
            if (res && res.status) {
                setLoading(false);
                const zoneList = Array.isArray(res.zone) ? res.zone : [];
                setZones(zoneList);
                setsortedRoots([...zoneList].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
            } else {
                setLoading(false);
                showMessage('Something went wrong, Please try again later');
            }
        }).catch((err) => {
            setLoading(false);
            showMessage(err.message);
        });
    }, []);

    function handleDeleteDetect(zone) {
        setDeletePackage(zone)
        setDeleteStatus(true)
    }

    function handleDelete(zoneId) {
        setLoading(true)
        axiosDelete(`${deleteZoneUrl}?id=${urlEncode(zoneId)}`, token).then((res) => {
            if (res.status) {
                showMessage(res?.msg, 'success')
                const newZones = zones.filter((elem) => elem.id != zoneId);
                setsortedRoots([...newZones].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
                setDeleteStatus(false)
            } else {
                showMessage(res?.msg, 'error')
            }
            setLoading(false)
        }).catch((err) => {
            showMessage('Something went wrong, please try again later.')
            setLoading(false)
        })
    }

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
                            <ZoneCard key={cat.id} zone={cat} level={0} handleDeleteDetect={handleDeleteDetect} />
                        ))}
                </div>}
            <DeleteModal status={deleteStatus} onChangeStatus={setDeleteStatus} handleChange={handleDelete} post={deletePackage} />
        </section>
    )
}

export default page