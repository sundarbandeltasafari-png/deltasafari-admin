"use client"
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import DeleteModal from '@/components/admin/common/DeleteModal';
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import { deleteNewsUrl, getAllNewsUrl } from "../../routes/serviceRoutes";
import NotFound from '@/components/common/NotFound';
import { axiosDelete, axiosGet } from '@/libs/axiosHelper';
import { getAllPackageUrl } from '@/app/routes/packageRoutes';
import Link from 'next/link';

function page() {
  const route = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, getPackages] = useState([]);
  const token = useSelector((state) => state.adminAuth?.token);
  const [deleteStatus, setDeleteStatus] = useState(false);
  const [deletePackage, setDeletePackage] = useState(null)
  const permisions = useSelector((state) => state.permision?.permisions);

  useEffect(() => {
    axiosGet(getAllPackageUrl, token).then((res) => {
      if (res.status) {
        setLoading(false);
        getPackages(res.packages)
      } else {
        showMessage(res.msg)
      }
    }).catch((err) => {
      showMessage(`Something went wrong, ${err.message}`)
    })
  }, [])

  function handleDeleteDetect(pkg) {
    setDeletePackage(pkg)
    setDeleteStatus(true)
  }

  function handleDelete(postId) {
    axiosDelete(deleteNewsUrl, { id: postId }, token).then((response) => {
      if (response.status) {
        getPackages(packages.filter((elem) => elem.id != postId))
        showMessage(response?.msg, "success");
      } else {
        showMessage(response?.msg);
      }
    }).catch((err) => {
      showMessage(err?.message)
    })

  }

  return (
    <section className='p-3'>
      <div className='card mt-10'>
        <div className=' card-header d-flex justify-content-between p-3 pb-4'>
          <div>
            <h5>Package Dashboard</h5>
            <p className='mb-0'>Manage your package beautifully</p>
          </div>
          <div>
            {permisions.includes('/news/add') && <button onClick={() => { route.push("/package/add") }} className='btn btn-primary' variant="primary">
              <i className="bi bi-plus-lg me-3"></i>
              Add New Package
            </button>}
          </div>
        </div>
      </div>
      <div className="pt-3">
        {!loading && <div className="row g-4">
          {packages?.length > 0 ? packages.map((pkg, index) => {
            return <div key={index} className="col-lg-4 col-md-4">
              <div className="card package-card border-0 shadow-sm h-100">
                <div className="position-relative overflow-hidden rounded-top-3" style={{ borderBottom: "1px solid #80808024" }}>
                  <img src={pkg?.path ? process.env.NEXT_PUBLIC_SERVER_URL + pkg?.path : 'assets/images/Travel-Agency-3.png'} className="card-img-top package-img" alt={pkg?.title} />

                  <div className="position-absolute top-0 start-0 m-3 d-flex align-items-center">
                    {pkg.status == 1 ?
                      <div className="badge text-bg-success">
                        <span >Published</span>
                      </div>
                      :
                      <div className="badge text-bg-secondary">
                        <span >Draft</span>
                      </div>
                    }
                  </div>
                  <span className="position-absolute top-0 end-0 m-3 badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-sm">
                    {pkg?.discount}% Discount
                  </span>

                  <span className="position-absolute bottom-0 start-0 m-3 badge bg-primary px-3 py-2 fs-6 rounded-pill">
                    {pkg?.duration_nights}N / {pkg?.duration_days}D
                  </span>

                </div>

                <div className="card-body p-4">
                  <span className=" my-3 mt-0 badge bg-secondary py-2 fs-6">
                    {pkg?.package_type_name} Package
                  </span>
                  <h5 className="card-title fw-bold text-dark mb-1 twoline">{pkg?.title}</h5>
                  <p className="text-muted small fw-medium mb-3 twoline">{pkg?.description}</p>

                  <div className="row g-2 small fw-medium text-dark-emphasis mb-4">
                    {
                      pkg?.inclusions && JSON.parse(pkg?.inclusions).map((inclusion, index) => (
                        <div key={index} className="col-6 d-flex align-items-center gap-2">
                          <i className="bi bi-check2 text-success fs-5"></i> {inclusion}
                        </div>
                      ))
                    }
                  </div>

                  <div className="row align-items-center bg-light rounded-3 p-3 mx-0 mb-4 g-2 border">
                    <div className="col-6 border-end">
                      <span className="d-block text-muted small lh-sm">Pickup Location <i className="bi bi-question-circle text-muted" style={{ fontSize: "0.75rem" }}></i></span>
                      <span className="small fw-bold text-dark mt-1">{pkg?.from_destination_name}</span>
                    </div>
                    <div className="col-6 d-flex justify-content-between align-items-center ps-3">
                      <div>
                        <span className="d-block text-muted small lh-sm">Package Destination <i className="bi bi-question-circle text-muted" style={{ fontSize: "0.75rem" }}></i></span>
                        <span className="badge bg-primary d-block mt-1">{pkg?.to_destination_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top">
                    <div>
                      <div className='d-flex align-items-center gap-2'>
                        <span className="text-muted d-block small lh-1">Starting From </span>
                        <span className='custom-strike'>₹ {pkg?.base_price}</span>
                      </div>
                      <h3 className="fw-extrabold text-dark my-1">₹ {Math.ceil(pkg.actual_price)}</h3>
                      <span className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Per Person</span>
                    </div>
                    <Link href={"package/edit/" + urlEncode(pkg?.id)} className="btn btn-orange px-4 py-2.5 fw-bold text-white rounded-pill d-flex align-items-center gap-2 shadow-sm transition-all">
                      Edit <i className="bi bi-pen"></i>
                    </Link>
                    <button onClick={() => { handleDeleteDetect(pkg) }} className="btn btn-orange px-4 py-2.5 fw-bold text-white rounded-pill d-flex align-items-center gap-2 shadow-sm transition-all">
                      Delete <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          })
            :
            <NotFound />
          }
        </div>}

        <DeleteModal status={deleteStatus} onChangeStatus={setDeleteStatus} handleChange={handleDelete} post={deletePackage} />
      </div>
    </section>
  )
}

export default page