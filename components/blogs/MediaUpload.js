
"use client";
import React, { useState, useRef } from 'react';

export default function MediaUpload({ setImage, setVideo, image, video }) {
  const [previews, setPreviews] = useState({ image: null, video: null });
  const [isDragging, setIsDragging] = useState(false);

  // Refs for hidden inputs
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleFile = (file, type) => {
    if (!file) return;

    // Create a local URL for the preview
    const url = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [type]: url }));
    if (type == "image") {
      setImage(file)
    } else {
      setVideo(file)
    }
  };

  const onDrop = (e, type) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file, type);
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3">
        <h6 className="mb-0 fw-bold">Media Assets</h6>
      </div>
      <div className="card-body">

        {/* IMAGE UPLOAD */}
        <div className="mb-4">
          <label className="form-label fw-semibold small">Featured Image</label>
          <div
            className={`upload-zone rounded border-2 border-dashed p-3 text-center ${isDragging ? 'bg-primary-subtle border-primary' : 'bg-light'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => onDrop(e, 'image')}
            onClick={() => imageInputRef.current.click()}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {!previews.image && !image ? (
              <div className="py-2">
                <i className="bi bi-image text-muted fs-2"></i>
                <p className="small mb-0 text-muted">Drag image here or click to upload</p>
              </div>
            ) : (
              <div className="position-relative">
                <img src={previews.image ? previews.image : process.env.NEXT_PUBLIC_SERVER_URL + image} className="img-fluid rounded" alt="Preview" />
                <button
                  type="button"
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                  onClick={(e) => { e.stopPropagation(); setPreviews(p => ({ ...p, image: null })); }}
                >×</button>
              </div>
            )}
            <input
              type="file"
              ref={imageInputRef}
              hidden
              accept="image/*"
              onChange={(e) => handleFile(e.target.files[0], 'image')}
            />
          </div>
        </div>

        {/* VIDEO UPLOAD */}
        <div className="mb-0">
          <label className="form-label fw-semibold small">Featured Video</label>
          <div
            className="upload-zone rounded border-2 border-dashed p-3 text-center bg-light"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, 'video')}
            onClick={() => videoInputRef.current.click()}
            style={{ cursor: 'pointer' }}
          >
            {!previews.video && !video ? (
              <div className="py-2">
                <i className="bi bi-play-btn text-muted fs-2"></i>
                <p className="small mb-0 text-muted">Drag video here or click</p>
              </div>
            ) : (
              <div className="position-relative">
                <video src={previews.video ? previews.video : process.env.NEXT_PUBLIC_SERVER_URL + video} className="w-100 rounded" controls />
                <button
                  type="button"
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                  onClick={(e) => { e.stopPropagation(); setPreviews(p => ({ ...p, video: null })); }}
                >×</button>
              </div>
            )}
            <input
              type="file"
              ref={videoInputRef}
              hidden
              accept="video/*"
              onChange={(e) => handleFile(e.target.files[0], 'video')}
            />
          </div>
        </div>

      </div>
    </div>
  );
}