"use client"
import { urlEncode } from '@/libs/urlHelper';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
function ZoneCard({ zone, level }) {
  const [isOpen, setIsOpen] = useState(false);
  const permisions = useSelector((state) => state.permision?.permisions);
  const route = useRouter();
  // Sort children by sort_order (ascending) before rendering
  const sortedChildren = zone.children
    ? [...zone.children].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : [];

  const hasChildren = sortedChildren.length > 0;
  return (
    <div className={`accordion-item border-0 mb-2 shadow-sm rounded-3 overflow-hidden ${level > 0 ? 'ms-4 mt-2' : ''}`}>
      <div className={`accordion-header`}>
        <button
          className={`accordion-button ${!isOpen ? 'collapsed' : ''} ${!hasChildren ? 'no-icon' : ''} bg-white transition-all`}
          type="button"
          onClick={() => hasChildren && setIsOpen(!isOpen)}
          style={{ padding: '1rem' }}
        >
          <div className="d-flex align-items-start w-100 me-3">
            {/* zone Image with Hover Effect */}
            <div className="position-relative flex-shrink-0">
              <img
                src={process.env.NEXT_PUBLIC_SERVER_URL + zone.image}
                alt={zone.name}
                className="rounded-3 object-fit-contain shadow-sm border"
                style={{ width: '150px', height: '100px' }}
              />
              <span className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-dark border border-light" style={{ fontSize: '0.6rem' }}>
                #{zone.sort_order}
              </span>
            </div>

            {/* zone Details */}
            <div className="flex-grow-1 ms-3">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0 text-dark">{zone.name}</h6>
                <span className="text-muted">
                  <i className="bi bi-calendar3 me-1"></i>
                  {new Date(zone.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted small mb-0 mt-1 line-clamp-1">
                {zone.description || 'No description available for this zone.'}
              </p>
              {permisions.includes('/zone/edit') && <div onClick={(e)=>{route.push('/zone/edit/'+urlEncode(zone?.id))}} className ='position-relative mt-3 btn btn-primary'>+ Edit Destination</div>}
            </div>

            {/* Child Counter */}
            {hasChildren && (
              <div className="ms-auto ps-3 text-center">
                <div className="badge text-bg-dark p-2">
                  {sortedChildren.length} Items
                </div>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Sorted Child Container */}
      <div className={`collapse ${isOpen ? 'show' : ''} transition-all`}>
        <div className="accordion-body p-0 pb-2 border-start border-3 border-primary border-opacity-25 ms-2">
          {sortedChildren.map(child => (
            <ZoneCard
              key={child.id}
              zone={child}
              level={level + 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ZoneCard