import React from 'react'
import TagsInputCustom from '../blogs/TagsInputCustom'

function MetaComponent({ metaDetails, setMetaDetails, setFormData }) {
    function setTags(data){
        setFormData({...metaDetails, tags: data})
    }
    return (
        <>
            <div className="col-md-12">
                <label className="form-label fw-bold small text-uppercase text-secondary">Meta Title <span className='text-danger'>*</span></label>
                <input type="text" value={metaDetails?.meta_title} name="meta_title" className="form-control  p-3" placeholder="Package Meta Name" onChange={setMetaDetails} />
            </div>
            <div className="col-12 pb-0 mb-0">
                <label className="form-label fw-bold small text-uppercase text-secondary">Meta Description <span className='text-danger'>*</span></label>
                <textarea name="meta_description" value={metaDetails?.meta_description} className="form-control  p-3" rows="4" placeholder="Briefly describe this Package..." onChange={setMetaDetails}></textarea>
            </div>
            <TagsInputCustom tags={metaDetails.tags} setTags={setTags} name='Meta' />
        </>
    )
}

export default MetaComponent