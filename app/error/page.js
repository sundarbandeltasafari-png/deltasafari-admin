
import Link from 'next/link'
import React from 'react'

function page() {
  return (
    <>
      <div className="misc-wrapper">
        <h1 className="mb-2 mx-2" style={{ fontSize: "6rem", lineHeight: "6rem" }}>401</h1>
        <h4 className="mb-2">You are not authorized! 🔐</h4>
        <p className="mb-3 mx-2">You don’t have permission to access this page. Go Home!</p>
        <div className="d-flex justify-content-center mt-12">
          <img src="/assets/img/illustrations/misc-not-authorized-object.png" alt="misc-not-authorized" className="img-fluid misc-object d-none d-lg-inline-block" width="190" />
          <img src="/assets/img/illustrations/misc-bg-dark.png" alt="misc-not-authorized" className="misc-bg d-none d-lg-inline-block" data-app-light-img="illustrations/misc-bg-light.png" data-app-dark-img="illustrations/misc-bg-dark.png" style={{ visibility: "visible" }} />
          <div className="d-flex flex-column align-items-center">
            <img src="/assets/img/illustrations/misc-not-authorized-illustration.png" alt="misc-not-authorized" className="img-fluid z-1" width="160" />
            <div>
              <Link href="/" className="btn btn-primary text-center my-10 waves-effect waves-light">Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default page