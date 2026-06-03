import React from 'react'

function Loading() {
    return (
        <>
            <div className="spinner-border text-primary d-flex justify-content-center align-items-center w-100 h-100" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </>
    )
}

export default Loading