import React from 'react'

function LoadingComponent() {
    return (
        <div className='w-100 h-100 d-flex justify-content-center align-items-center'>
            <div style={{width: "50px", height: "50px"}}>
                <div className="spinner-border text-primary d-flex justify-content-center align-items-center w-100 h-100" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
    )
}

export default LoadingComponent