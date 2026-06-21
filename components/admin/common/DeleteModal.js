import React from 'react'

function DeleteModal({status, onChangeStatus, handleChange, post}) {
    return (
        <>
            <div className={`modal ${status ? 'fade show' : 'd-none'}`} id="modalCenter" tabIndex="-1" style={{display: "block"}} aria-modal="true" role="dialog">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="modalCenterTitle">Are you sure you want to delete this?</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={()=>{onChangeStatus(false)}}></button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-12 mb-6 mt-2">
                                    <div className="form-floating form-floating-outline" style={{height: "200px", border: "1px solid #cbcbcb", borderRadius: "10px", overflow: "hidden"}}>
                                        <img 
                                            src={
                                                post?.featured_image ? (post.featured_image.startsWith('data:') || post.featured_image.startsWith('/') ? post.featured_image : process.env.NEXT_PUBLIC_SERVER_URL + post.featured_image) :
                                                post?.path ? (post.path.startsWith('data:') || post.path.startsWith('/') ? post.path : process.env.NEXT_PUBLIC_SERVER_URL + post.path) :
                                                post?.image ? (post.image.startsWith('data:') || post.image.startsWith('/') ? post.image : process.env.NEXT_PUBLIC_SERVER_URL + post.image) :
                                                post?.city_image ? (post.city_image.startsWith('data:') || post.city_image.startsWith('/') ? post.city_image : process.env.NEXT_PUBLIC_SERVER_URL + post.city_image) :
                                                "/images/noimage.jpg"
                                            } 
                                            alt={post?.title ? (typeof post.title === 'string' ? post.title : Buffer.from(post.title).toString('utf-8')) : post?.name} 
                                            style={{width: "100%", height: "100%", objectFit: "cover"}} 
                                        />
                                    </div>
                                </div>
                                <div className="col-12 mb-6 mt-2">
                                    <h4 className='oneLine'>{post?.title ? Buffer.from(post?.title).toString('utf-8') : post?.name}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={()=>{onChangeStatus(false)}} className="btn btn-outline-secondary waves-effect" data-bs-dismiss="modal">
                                Close
                            </button>
                            <button type="button" onClick={()=>{handleChange(post?.id)}} className="btn btn-danger waves-effect waves-light">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default DeleteModal