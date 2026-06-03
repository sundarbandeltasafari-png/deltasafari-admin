import React, { useState } from 'react';

const MultiLevelSelect = ({ categories, onSelect, selectedId, type="", categoryId="", name="Category", inputName}) => {
  const [expandedIds, setExpandedIds] = useState({});

  const toggleExpand = (id, e) => {
    e.stopPropagation(); // Prevent selection when just expanding
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const renderItems = (items, level = 0) => {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

    return (
      <div className={`list-group list-group-flush ${level > 0 ? 'ms-3 border-start' : ''}`}>
        {sorted.map((cat) => {
          if(categoryId && categoryId == cat.id){
            return ;
          }
          const hasChildren = cat?.children && cat?.children.length > 0;
          const isExpanded = expandedIds[cat.id];
          const isSelected = selectedId === cat.id;
          return (
            <div key={cat.id} className="border-0">
              <div 
                className={`list-group-item list-group-item-action d-flex align-items-center py-3 border-0 transition-all ${isSelected ? 'bg-primary bg-opacity-10' : ''}`}
                style={{ cursor: 'pointer', borderRadius: '10px' }}
                onClick={(e) => hasChildren ? toggleExpand(cat.id, e) : onSelect(cat, inputName)}
              >
                {/* Expand Arrow */}
                <div className="me-2" style={{ width: '20px' }}>
                  {hasChildren && (
                    <i className={`bi bi-chevron-right transition-all d-inline-block ${isExpanded ? 'rotate-90' : ''}`} 
                       onClick={(e) => toggleExpand(cat.id, e)}></i>
                  )}
                </div>

                {/* Category Image */}
                <img 
                  src={"http://localhost:3002/"+cat.image || 'https://via.placeholder.com/40'} 
                  className="rounded-2 me-3 border shadow-sm" 
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                  alt="" 
                />

                {/* Title & Info */}
                <div className="flex-grow-1">
                  <div className={`fw-bold mb-0 ${isSelected ? 'text-light' : 'text-dark'}`}>{cat.name}</div>
                  <small className={`${isSelected ? 'text-light' : 'text-dark'}`} style={{ fontSize: '0.7rem' }}>Order: {cat.sort_order}</small>
                </div>

                {/* Selection Action */}
                <button 
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 ${isSelected ? 'btn-primary' : 'btn-outline-secondary opacity-50'}`}
                  onClick={(e) => { e.stopPropagation(); onSelect(cat, inputName); }}
                >
                  {isSelected ? <i className="bi bi-check-circle-fill me-1"></i> : null}
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>

              {/* Recursive Children */}
              {hasChildren && isExpanded && (
                <div className="ps-2">
                  {renderItems(cat.children, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-2">
      {type == "" && <div className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
        <span className="fw-bold small text-uppercase text-secondary">Pick Parent {name}</span>
        <button 
          className={`btn btn-xs rounded-pill ${selectedId === null ? 'btn-dark' : 'btn-light text-muted border'}`}
          onClick={() => onSelect({ id: null })}
        >
          Set as Root
        </button>
      </div>}
      
      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
        {renderItems(categories)}
      </div>

      <style>{`
        .rotate-90 { transform: rotate(90deg); }
        .transition-all { transition: all 0.2s ease-in-out; }
        .btn-xs { padding: 0.25rem 0.75rem; font-size: 0.75rem; }
      `}</style>
    </div>
  );
};

export default MultiLevelSelect;