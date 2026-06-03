import React from 'react'

function notFound() {
  return (
    <>
    <div className="misc-wrapper">
      <h1 className="mb-2 mx-2" style={{fontSize: "6rem", lineHeight: "6rem"}}>404</h1>
      <h4 className="mb-2">Page Not Found ⚠️</h4>
      <p className="mb-6 mx-2">we couldn't find the page you are looking for</p>
      <div className="d-flex justify-content-center mt-9">
        <img src="/assets/img/illustrations/misc-error-object.png" alt="misc-error" className="img-fluid misc-object d-none d-lg-inline-block" width="160"/>
        <img src="https://alphiber.com/demoadmin/assets/img/illustrations/misc-bg-light.png" alt="misc-error" className="misc-bg d-none d-lg-inline-block" data-app-light-img="illustrations/misc-bg-light.png" data-app-dark-img="illustrations/misc-bg-dark.png" style={{ visibility: "visible"}}/>
        <div className="d-flex flex-column align-items-center">
          <img src="/assets/img/illustrations/misc-error-illustration.png" alt="misc-error" className="img-fluid z-1" width="190"/>
          <div>
            <a href="/" className="btn btn-primary text-center my-10 waves-effect waves-light">Back to home</a>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default notFound