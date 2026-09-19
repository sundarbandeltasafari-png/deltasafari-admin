"use client"
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import DeleteModal from '@/components/admin/common/DeleteModal';
import DuplicateModal from '@/components/admin/common/DuplicateModal';
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import NotFound from '@/components/common/NotFound';
import { axiosDelete, axiosGet, axiosPost } from '@/libs/axiosHelper';
import { deletePackageUrl, getAllPackageUrl, duplicatePackageUrl } from '@/app/routes/packageRoutes';
import Link from 'next/link';

function page() {
  const route = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, getPackages] = useState([]);
  const token = useSelector((state) => state.adminAuth?.token);

  // Delete modal state
  const [deleteStatus, setDeleteStatus] = useState(false);
  const [deletePackage, setDeletePackage] = useState(null);

  // Duplicate modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateTargetPackage, setDuplicateTargetPackage] = useState(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('ALL');

  const permisions = useSelector((state) => state.permision?.permisions);

  function loadPackages() {
    setLoading(true);
    axiosGet(getAllPackageUrl, token).then((res) => {
      if (res && res.status) {
        getPackages(res.packages || []);
      } else {
        if (res?.msg) showMessage(res.msg);
      }
    }).catch((err) => {
      showMessage(`Something went wrong, ${err.message}`)
    }).finally(() => {
      setLoading(false);
    });
  }

  useEffect(() => {
    loadPackages();
  }, [token]);

  function handleDeleteDetect(pkg) {
    setDeletePackage(pkg);
    setDeleteStatus(true);
  }

  function handleDelete(packageId) {
    axiosDelete(`${deletePackageUrl}?id=${urlEncode(packageId)}`, token).then((response) => {
      if (response && response.status) {
        getPackages(packages.filter((elem) => elem.id != packageId));
        showMessage(response?.msg || "Package deleted successfully", "success");
        setDeleteStatus(false);
      } else {
        showMessage(response?.msg || "Failed to delete package");
      }
    }).catch((err) => {
      showMessage(err?.message);
    });
  }

  // Open warning modal when duplicate button clicked
  function handleOpenDuplicateModal(pkg) {
    setDuplicateTargetPackage(pkg);
    setDuplicateModalOpen(true);
  }

  // Handle actual duplication post-confirmation
  async function handleConfirmDuplicate(pkg, newTitle) {
    setIsDuplicating(true);
    try {
      const res = await axiosPost(duplicatePackageUrl, { id: pkg.id, title: newTitle }, token);
      if (res && res.status) {
        showMessage(res.msg || "Package duplicated successfully.", "success");
        loadPackages();
        setDuplicateModalOpen(false);
        setDuplicateTargetPackage(null);
      } else {
        showMessage(res?.msg || "A package with this title or slug already exists!", "error");
      }
    } catch (err) {
      showMessage(err?.message || "Failed to duplicate package.", "error");
    } finally {
      setIsDuplicating(false);
    }
  }

  const filteredPackages = packages.filter(pkg => {
    if (platformFilter === 'ALL') return true;
    if (platformFilter === 'both') return !pkg.platform || pkg.platform === 'both';
    if (platformFilter === 'sundarban') return pkg.platform === 'sundarban';
    if (platformFilter === 'deltasafari') return pkg.platform === 'deltasafari';
    return true;
  });

  return (
    <section className='p-3'>
      <div className='card mt-10'>
        <div className='card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 p-3 pb-4'>
          <div>
            <h5 className="mb-1">Package Dashboard</h5>
            <p className='mb-0 text-muted'>Manage your packages beautifully across DeltaSafari and Sundarban</p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select
              className="form-select form-select-sm fw-semibold"
              style={{ width: 'auto', minWidth: '180px' }}
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="ALL">🌐 All Platforms ({packages.length})</option>
              <option value="both">🔗 Both Platforms</option>
              <option value="deltasafari">⛵ Delta Safari Only</option>
              <option value="sundarban">🐅 Sundarban Safari Only</option>
            </select>

            {(permisions?.includes('/news/add') || true) && (
              <button onClick={() => { route.push("/package/add") }} className='btn btn-primary' variant="primary">
                <i className="bi bi-plus-lg me-2"></i>
                Add New Package
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="pt-3">
        {!loading && <div className="row g-4">
          {filteredPackages?.length > 0 ? filteredPackages.map((pkg, index) => {
            return <div key={index} className="col-lg-4 col-md-6">
              <div className="card package-card border-0 shadow-sm h-100">
                <div className="position-relative overflow-hidden rounded-top-3" style={{ borderBottom: "1px solid #80808024" }}>
                  <img src={pkg?.path ? process.env.NEXT_PUBLIC_SERVER_URL + pkg?.path : process.env.NEXT_PUBLIC_PUBLIC_URL + '/images/noimage.jpg'} className="card-img-top package-img" alt={pkg?.title} />

                  <div className="position-absolute top-0 start-0 m-3 d-flex align-items-center">
                    {pkg.status == 1 ?
                      <div className="badge text-bg-success">
                        <span>Published</span>
                      </div>
                      :
                      <div className="badge text-bg-secondary">
                        <span>Draft</span>
                      </div>
                    }
                  </div>
                  <span className="position-absolute top-0 end-0 m-3 badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-sm">
                    {pkg?.discount_type === 'flat' ? `₹ ${pkg?.discount}` : `${pkg?.discount}%`} Discount
                  </span>

                  <span className="position-absolute bottom-0 start-0 m-3 badge bg-primary px-3 py-2 fs-6 rounded-pill">
                    {pkg?.duration_nights}N / {pkg?.duration_days}D
                  </span>

                </div>

                <div className="card-body p-4 d-flex flex-column">
                  <div>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      <span className="badge bg-secondary py-1.5 px-2.5 fs-6">
                        {pkg?.package_type_name} Package
                      </span>
                      {(!pkg?.platform || pkg?.platform === 'both') && (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle py-1.5 px-2.5 fs-6">
                          <i className="ri ri-links-line me-1"></i>Both Platforms
                        </span>
                      )}
                      {pkg?.platform === 'sundarban' && (
                        <span className="badge bg-success-subtle text-success border border-success-subtle py-1.5 px-2.5 fs-6">
                          <i className="ri ri-compass-3-line me-1"></i>Sundarban Safari
                        </span>
                      )}
                      {pkg?.platform === 'deltasafari' && (
                        <span className="badge bg-info-subtle text-info border border-info-subtle py-1.5 px-2.5 fs-6">
                          <i className="ri ri-global-line me-1"></i>Delta Safari
                        </span>
                      )}
                      {pkg?.city_name && (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle py-1.5 px-2.5 fs-6">
                          <i className="ri-map-pin-2-line me-1"></i>{pkg.city_name}
                        </span>
                      )}
                    </div>
                    <h5 className="card-title fw-bold text-dark mb-1 twoline">{pkg?.title}</h5>
                    <p className="text-muted small fw-medium mb-3 twoline">{pkg?.description}</p>
                  </div>

                  <div className="row g-2 small fw-medium text-dark-emphasis mb-4">
                    {
                      pkg?.inclusions && (typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : pkg.inclusions).map((inclusion, idx) => (
                        <div key={idx} className="col-6 d-flex align-items-center gap-2">
                          <i className="bi bi-check2 text-success fs-5"></i> {inclusion}
                        </div>
                      ))
                    }
                  </div>

                  <div className="row align-items-center bg-light rounded-3 p-3 mx-0 mb-4 g-2 border">
                    <div className="col-4 border-end">
                      <span className="d-block text-muted small lh-sm">Pickup</span>
                      <span className="small fw-bold text-dark mt-1 text-truncate d-block">{pkg?.from_destination_name || 'N/A'}</span>
                    </div>
                    <div className="col-4 border-end ps-2">
                      <span className="d-block text-muted small lh-sm">Destination</span>
                      <span className="badge bg-primary d-block mt-1 text-truncate">{pkg?.to_destination_name || 'N/A'}</span>
                    </div>
                    <div className="col-4 ps-2">
                      <span className="d-block text-muted small lh-sm">City</span>
                      <span className="badge bg-info-subtle text-dark border border-info-subtle d-block mt-1 text-truncate">
                        {pkg?.city_name || 'No City'}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-auto pt-3 border-top flex-wrap gap-2">
                    <div>
                      <div className='d-flex align-items-center gap-2'>
                        <span className="text-muted d-block small lh-1">Starting From </span>
                        <span className='custom-strike'>₹ {pkg?.base_price}</span>
                      </div>
                      <h3 className="fw-extrabold text-dark my-1">₹ {Math.ceil(pkg?.actual_price || 0)}</h3>
                      <span className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Per Person</span>
                    </div>
                    <div className="d-flex gap-1 flex-wrap">
                      <Link href={"package/edit/" + urlEncode(pkg?.id)} className="btn btn-sm btn-orange fw-bold text-white rounded-pill d-flex align-items-center gap-1 shadow-sm px-3 py-2">
                        Edit <i className="bi bi-pen"></i>
                      </Link>
                      <button
                        onClick={() => handleOpenDuplicateModal(pkg)}
                        className="btn btn-sm btn-outline-primary fw-bold rounded-pill d-flex align-items-center gap-1 shadow-sm px-3 py-2"
                        title="Duplicate Package"
                      >
                        Duplicate <i className="bi bi-copy"></i>
                      </button>
                      <button onClick={() => { handleDeleteDetect(pkg) }} className="btn btn-sm btn-danger fw-bold text-white rounded-pill d-flex align-items-center gap-1 shadow-sm px-3 py-2">
                        Delete <i className="bi bi-trash"></i>
                      </button>
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

        {/* Delete Confirmation Modal */}
        <DeleteModal status={deleteStatus} onChangeStatus={setDeleteStatus} handleChange={handleDelete} post={deletePackage} />

        {/* Warning Duplicate Confirmation Modal */}
        <DuplicateModal
          status={duplicateModalOpen}
          onClose={() => setDuplicateModalOpen(false)}
          onConfirm={handleConfirmDuplicate}
          packageItem={duplicateTargetPackage}
          isProcessing={isDuplicating}
        />
      </div>
    </section>
  )
}

export default page