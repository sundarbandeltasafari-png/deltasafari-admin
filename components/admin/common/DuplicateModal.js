"use client"
import React, { useState, useEffect } from 'react';

export default function DuplicateModal({ status, onClose, onConfirm, packageItem, isProcessing }) {
  const [duplicateTitle, setDuplicateTitle] = useState('');

  useEffect(() => {
    if (packageItem?.title) {
      setDuplicateTitle(`${packageItem.title} (Copy)`);
    }
  }, [packageItem]);

  if (!status) return null;

  const handleConfirm = () => {
    if (!duplicateTitle.trim()) return;
    onConfirm(packageItem, duplicateTitle.trim());
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        id="duplicateModal"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg border-0">
            <div className="modal-header bg-light border-bottom">
              <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
                Duplicate Package Warning
              </h5>
              <button
                type="button"
                className="btn-close"
                disabled={isProcessing}
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body p-4">
              <div className="alert alert-warning d-flex align-items-center gap-2 mb-4" role="alert">
                <i className="bi bi-info-circle-fill fs-5"></i>
                <div className="small">
                  This will create a new copy of <strong>"{packageItem?.title}"</strong> with all its details, images, and itineraries duplicated.
                </div>
              </div>

              {/* Image Preview */}
              {packageItem && (
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded border mb-4">
                  <img
                    src={
                      packageItem?.path
                        ? (packageItem.path.startsWith('http') || packageItem.path.startsWith('/')
                          ? packageItem.path
                          : process.env.NEXT_PUBLIC_SERVER_URL + packageItem.path)
                        : '/images/noimage.jpg'
                    }
                    alt={packageItem?.title}
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div className="overflow-hidden">
                    <h6 className="mb-1 text-truncate fw-bold">{packageItem?.title}</h6>
                    <span className="badge bg-primary me-2">{packageItem?.package_type_name || 'Package'}</span>
                    <span className="small text-muted">{packageItem?.duration_nights}N / {packageItem?.duration_days}D</span>
                  </div>
                </div>
              )}

              {/* Title Edit Field */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">
                  New Package Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={duplicateTitle}
                  onChange={(e) => setDuplicateTitle(e.target.value)}
                  placeholder="Enter title for duplicated package..."
                  disabled={isProcessing}
                  required
                />
              </div>
            </div>

            <div className="modal-footer bg-light border-top">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={isProcessing}
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-warning fw-bold text-dark d-flex align-items-center gap-2"
                disabled={isProcessing || !duplicateTitle.trim()}
                onClick={handleConfirm}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Duplicating Package...
                  </>
                ) : (
                  <>
                    <i className="bi bi-copy"></i> Proceed to Duplicate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
