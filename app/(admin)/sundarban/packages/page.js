"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getSundarbanPackagesUrl } from '@/app/routes/sundarbanRoutes';
import { deletePackageUrl } from '@/app/routes/packageRoutes';
import { axiosGet, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';
import DeleteModal from '@/components/admin/common/DeleteModal';

export default function SundarbanPackagesPage() {
    const router = useRouter();
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [deleteModalStatus, setDeleteModalStatus] = useState(false);
    const [targetDeletePackage, setTargetDeletePackage] = useState(null);

    const loadPackages = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosGet(getSundarbanPackagesUrl, token);
            if (res && res.status && Array.isArray(res.packages)) {
                setPackages(res.packages);
            } else {
                setPackages([]);
            }
        } catch (err) {
            console.error("Error loading Sundarban packages:", err);
            showMessage(err?.message || "Failed to load packages", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPackages();
    }, [token]);

    const handleDelete = async (packageId) => {
        try {
            const res = await axiosDelete(`${deletePackageUrl}?id=${urlEncode(packageId)}`, token);
            if (res && res.status) {
                setPackages(prev => prev.filter(p => p.id !== packageId));
                showMessage("Package deleted successfully", "success");
                setDeleteModalStatus(false);
            } else {
                showMessage(res?.msg || "Failed to delete package", "error");
            }
        } catch (err) {
            showMessage(err?.message || "Failed to delete package", "error");
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1">
                            <i className="ri ri-instance-line me-1"></i> Active Platform Tours
                        </span>
                    </div>
                    <h4 className="fw-bold mb-1 text-dark">Sundarban Safari Tour Packages</h4>
                    <p className="text-muted small mb-0">
                        Packages enabled for display on sundarban-deltasafari (Platform: Both or Sundarban DeltaSafari Only).
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button 
                        type="button" 
                        className="btn btn-outline-secondary d-flex align-items-center gap-2 rounded-pill px-3"
                        onClick={loadPackages}
                    >
                        <i className="ri ri-refresh-line"></i> Refresh
                    </button>
                    <Link 
                        href="/package/add" 
                        className="btn btn-success d-flex align-items-center gap-2 rounded-pill px-4 text-white shadow-sm"
                    >
                        <i className="ri ri-add-line"></i> Add New Package
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : packages.length === 0 ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <NotFound />
                    <p className="text-muted mt-3">No packages currently assigned to Sundarban DeltaSafari.</p>
                    <div>
                        <Link href="/package/add" className="btn btn-primary rounded-pill px-4">
                            + Create First Sundarban Package
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="row g-4">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="col-lg-4 col-md-6">
                            <div className="card package-card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white">
                                <div className="position-relative" style={{ height: '220px', backgroundColor: '#1e293b' }}>
                                    <img 
                                        src={pkg.path ? (process.env.NEXT_PUBLIC_SERVER_URL + pkg.path) : '/images/noimage.jpg'} 
                                        alt={pkg.title}
                                        className="w-100 h-100"
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <div className="position-absolute top-0 start-0 m-3">
                                        <span className={`badge ${pkg.status === 1 ? 'bg-success' : 'bg-secondary'} rounded-pill px-2.5 py-1`}>
                                            {pkg.status === 1 ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    <div className="position-absolute top-0 end-0 m-3">
                                        <span className="badge bg-warning text-dark fw-bold rounded-pill px-2.5 py-1 shadow-xs">
                                            {pkg.platform === 'sundarban' ? 'Sundarban Only' : 'Both Platforms'}
                                        </span>
                                    </div>
                                    <div className="position-absolute bottom-0 start-0 m-3">
                                        <span className="badge bg-dark bg-opacity-75 text-white rounded-pill px-3 py-1 fs-6">
                                            {pkg.duration_nights || 1}N / {pkg.duration_days || 2}D
                                        </span>
                                    </div>
                                </div>

                                <div className="card-body p-4 d-flex flex-column">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="badge bg-light text-secondary border">
                                            {pkg.package_type_name || 'Safari Package'}
                                        </span>
                                        <span className="text-success fw-bold fs-5">
                                            ₹{Number(pkg.actual_price || pkg.base_price || 0).toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    <h5 className="fw-bold text-dark mb-2 text-truncate" title={pkg.title}>
                                        {pkg.title}
                                    </h5>
                                    <p className="text-muted small mb-4 text-truncate" title={pkg.description}>
                                        {pkg.description || 'Explore the Sundarban delta with premier wildlife guides.'}
                                    </p>

                                    <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                        <div className="d-flex gap-2">
                                            <Link 
                                                href={`/package/edit/${urlEncode(pkg.id)}`} 
                                                className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                            >
                                                <i className="ri ri-edit-line me-1"></i> Edit
                                            </Link>
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-outline-danger rounded-pill px-2.5"
                                                onClick={() => {
                                                    setTargetDeletePackage(pkg);
                                                    setDeleteModalStatus(true);
                                                }}
                                                title="Delete Package"
                                            >
                                                <i className="ri ri-delete-bin-line"></i>
                                            </button>
                                        </div>
                                        <span className="small text-muted font-monospace">#{pkg.id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {deleteModalStatus && targetDeletePackage && (
                <DeleteModal 
                    isOpen={deleteModalStatus} 
                    onClose={() => setDeleteModalStatus(false)} 
                    onDelete={() => handleDelete(targetDeletePackage.id)}
                    title={`Are you sure you want to delete "${targetDeletePackage.title}"?`}
                />
            )}
        </div>
    );
}
