"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function MediaUpload({ setImages, setVideos, images = [], videos = [], assets, setDeletedAssets, deletedAssets }) {
  // Local object URLs for previews stored in arrays
  const [previews, setPreviews] = useState({
    images: assets && assets.length > 0 ? assets.map((asset) => { if (asset.type == 1) { return asset?.path } }) : [],
    videos: assets && assets.length > 0 ? assets.map((asset) => { if (asset.type == 2) { return asset?.path } }) : []
  });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);


  // Refs for hidden inputs
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Memory cleanup: Revoke object URLs when previews change or component unmounts
  useEffect(() => {
    return () => {
      previews.images.forEach(url => {
        if (url && url?.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      previews.videos.forEach(url => {
        if (url && url?.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  // Unified multi-file handler
  const handleFiles = (fileList, type) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles = Array.from(fileList);
    const newUrls = newFiles.map(file => URL.createObjectURL(file));

    if (type === "image") {
      setImages(prev => [...(Array.isArray(prev) ? prev : []), ...newFiles]);
      setPreviews(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
    } else if (type === "video") {
      setVideos(prev => [...(Array.isArray(prev) ? prev : []), ...newFiles]);
      setPreviews(prev => ({ ...prev, videos: [...prev.videos, ...newUrls] }));
    }
  };

  const onDrop = (e, type) => {
    e.preventDefault();
    if (type === 'image') {
      setIsDraggingImage(false);
      handleFiles(e.dataTransfer.files, 'image');
    } else {
      setIsDraggingVideo(false);
      handleFiles(e.dataTransfer.files, 'video');
    }
  };

  // Item removal logic
  const removeItem = (indexToRemove, type, e) => {
    e.stopPropagation(); // Prevents clicking through to open the file upload dialogue

    if (type === 'image') {
      const urlToRemove = previews.images[indexToRemove];

      if (urlToRemove?.startsWith('blob:')){
        URL.revokeObjectURL(urlToRemove);
      }else{
        setDeletedAssets([...deletedAssets, ...assets.filter((asset)=> asset.path == urlToRemove)])
      }

      setPreviews(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== indexToRemove) }));
      setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    } else {
      const urlToRemove = previews.videos[indexToRemove];
      if (urlToRemove?.startsWith('blob:')){
        URL.revokeObjectURL(urlToRemove);
      }else{
        setDeletedAssets([...deletedAssets, ...assets.filter((asset)=> asset.path == urlToRemove)])
      }

      setPreviews(prev => ({ ...prev, videos: prev.videos.filter((_, idx) => idx !== indexToRemove) }));
      setVideos(prev => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3">
        <h6 className="mb-0 fw-bold">Media Assets</h6>
      </div>
      <div className="card-body">

        {/* MULTIPLE IMAGES UPLOAD */}
        <div className="mb-4">
          <label className="form-label fw-semibold small">Featured Images</label>
          <div
            className={`upload-zone rounded border-2 border-dashed p-4 text-center ${isDraggingImage ? 'bg-primary-subtle border-primary' : 'bg-light'
              }`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
            onDragLeave={() => setIsDraggingImage(false)}
            onDrop={(e) => onDrop(e, 'image')}
            onClick={() => imageInputRef.current.click()}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <div className="py-2">
              <i className="bi bi-images text-muted fs-2"></i>
              <p className="small mb-0 text-muted">Drag images here or click to upload multiple files</p>
            </div>
            <input
              type="file"
              ref={imageInputRef}
              hidden
              multiple
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files, 'image')}
            />
          </div>

          {/* Image Previews Grid */}
          {((previews.images && previews.images.length > 0) || (images && images.length > 0)) && (
            <div className="row g-2 mt-2">
              {(previews.images.length > 0 ? previews.images : images).map((imgSrc, index) => {
                const finalSrc = typeof imgSrc === 'string' && !imgSrc.startsWith('blob:')
                  ? (process.env.NEXT_PUBLIC_SERVER_URL || '') + imgSrc
                  : imgSrc;

                if (typeof finalSrc !== 'string') return null;

                return (
                  <div key={`img-${index}`} className="col-4 col-sm-3 position-relative">
                    <div className="ratio ratio-1x1 border rounded overflow-hidden bg-dark">
                      <img src={finalSrc} className="img-fluid object-fit-cover" alt={`Preview ${index + 1}`} />
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 m-1 p-0 d-flex align-items-center justify-content-center"
                      style={{ width: '22px', height: '22px', fontSize: '12px', zIndex: 2 }}
                      onClick={(e) => removeItem(index, 'image', e)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MULTIPLE VIDEOS UPLOAD */}
        <div className="mb-0">
          <label className="form-label fw-semibold small">Featured Videos</label>
          <div
            className={`upload-zone rounded border-2 border-dashed p-4 text-center ${isDraggingVideo ? 'bg-primary-subtle border-primary' : 'bg-light'
              }`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingVideo(true); }}
            onDragLeave={() => setIsDraggingVideo(false)}
            onDrop={(e) => onDrop(e, 'video')}
            onClick={() => videoInputRef.current.click()}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <div className="py-2">
              <i className="bi bi-play-btn text-muted fs-2"></i>
              <p className="small mb-0 text-muted">Drag videos here or click to upload multiple files</p>
            </div>
            <input
              type="file"
              ref={videoInputRef}
              hidden
              multiple // Added to allow picking multiple videos natively
              accept="video/*"
              onChange={(e) => handleFiles(e.target.files, 'video')}
            />
          </div>

          {/* Video Previews Grid */}
          {((previews.videos && previews.videos.length > 0) || (videos && videos.length > 0)) && (
            <div className="row g-2 mt-2">
              {(previews.videos.length > 0 ? previews.videos : videos).map((vidSrc, index) => {
                const finalSrc = typeof vidSrc === 'string' && !vidSrc.startsWith('blob:')
                  ? (process.env.NEXT_PUBLIC_SERVER_URL || '') + vidSrc
                  : vidSrc;

                if (typeof finalSrc !== 'string') return null;

                return (
                  <div key={`vid-${index}`} className="col-6 col-sm-4 position-relative">
                    {/* ratio-16x9 looks cleaner for video templates over a 1x1 grid */}
                    <div className="ratio ratio-16x9 border rounded overflow-hidden bg-dark" onClick={(e) => e.stopPropagation()}>
                      <video src={finalSrc} controls className="w-100 h-100" />
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 m-1 p-0 d-flex align-items-center justify-content-center"
                      style={{ width: '22px', height: '22px', fontSize: '12px', zIndex: 2 }}
                      onClick={(e) => removeItem(index, 'video', e)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}