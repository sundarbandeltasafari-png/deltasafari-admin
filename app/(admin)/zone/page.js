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
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import SearchList from '@/components/common/SearchList';

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

    const [searchData, setSearchData] = useState('');

    const filteredRoots = sortedRoots.filter(zone => {
        if (!searchData) return true;
        const query = searchData.toLowerCase();
        const matchesZone = (z) => {
            if (z.name?.toLowerCase().includes(query) || z.description?.toLowerCase().includes(query)) return true;
            if (z.children && z.children.some(matchesZone)) return true;
            return false;
        };
        return matchesZone(zone);
    });

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-6">
                <div>
                    <h4 className="fw-semibold mb-1 d-flex align-items-center gap-2">
                        <i className="ri-map-pin-5-line text-primary"></i>
                        <span>Destination Master</span>
                    </h4>
                    <p className="text-muted small mb-0">Manage global travel destinations, regions, and multi-level zones</p>
                </div>
            </div>

            {/* Main Listing Card */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                {/* Search & Action Bar */}
                <div className="card-body py-4 border-bottom bg-light bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-4">
                        <div className="flex-grow-1 max-w-400">
                            <SearchList handleSearch={setSearchData} placeholder="Search destinations by name or description..." />
                        </div>
                        <div className="dt-buttons btn-group flex-wrap">
                            <Link
                                href="/zone/add"
                                className="btn btn-primary d-flex align-items-center rounded-pill px-4 py-2 fw-semibold shadow-sm transition-all"
                            >
                                <i className="ri-add-line me-2 fs-5"></i>
                                <span>Add Destination</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="py-5">
                        <LoadingComponent />
                    </div>
                ) : (
                    <div className="category-explorer p-4">
                        {filteredRoots.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="avatar avatar-xl bg-primary bg-opacity-10 text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                                    <i className="ri-map-pin-line fs-2"></i>
                                </div>
                                <h5 className="fw-semibold text-dark">No Destinations Found</h5>
                                <p className="text-muted small mb-4">
                                    {searchData ? `No destinations match "${searchData}"` : "Get started by creating your first travel destination."}
                                </p>
                                <Link href="/zone/add" className="btn btn-primary rounded-pill px-4 py-2.5 fw-semibold shadow-sm">
                                    <i className="ri-add-line me-2 fs-5"></i>
                                    <span>Add Destination</span>
                                </Link>
                            </div>
                        ) : (
                            filteredRoots.map(cat => (
                                <ZoneCard key={cat.id} zone={cat} level={0} handleDeleteDetect={handleDeleteDetect} />
                            ))
                        )}
                    </div>
                )}
            </div>

            <DeleteModal status={deleteStatus} onChangeStatus={setDeleteStatus} handleChange={handleDelete} post={deletePackage} />
        </div>
    );
}

export default page