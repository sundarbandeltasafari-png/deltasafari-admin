import React, { useState, useEffect, useMemo } from 'react';

const MultiLevelSelect = ({
  categories = [],
  onSelect,
  handleSelection, // backward compatibility for components passing handleSelection
  selectedId,
  active, // backward compatibility for components passing active
  type = "",
  categoryId = "",
  name = "Category",
  inputName,
  title,
  placeholder
}) => {
  const [expandedIds, setExpandedIds] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const selectCallback = onSelect || handleSelection || (() => {});
  const effectiveSelectedId = selectedId !== undefined ? selectedId : active;

  // Helper to find an item recursively by ID
  const findItem = (items, targetId) => {
    if (!items || !Array.isArray(items) || targetId === null || targetId === undefined || targetId === '') {
      return null;
    }
    for (const item of items) {
      if (String(item.id) === String(targetId)) {
        return item;
      }
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        const found = findItem(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to find all ancestor IDs of an item to auto-expand them
  const findAncestorIds = (items, targetId, ancestors = []) => {
    if (!items || !Array.isArray(items) || !targetId) return [];
    for (const item of items) {
      if (String(item.id) === String(targetId)) {
        return ancestors;
      }
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        const found = findAncestorIds(item.children, targetId, [...ancestors, item.id]);
        if (found.length > 0) return found;
      }
    }
    return [];
  };

  // Automatically expand parents of currently selected item on mount or selection change
  useEffect(() => {
    if (effectiveSelectedId && categories && categories.length > 0) {
      const ancestors = findAncestorIds(categories, effectiveSelectedId);
      if (ancestors.length > 0) {
        setExpandedIds((prev) => {
          const next = { ...prev };
          ancestors.forEach((id) => {
            next[id] = true;
          });
          return next;
        });
      }
    }
  }, [effectiveSelectedId, categories]);

  const toggleExpand = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const doSelect = (cat, e) => {
    if (e) e.stopPropagation();
    if (selectCallback) {
      selectCallback(cat, inputName);
    }
  };

  const selectedItem = useMemo(() => {
    return findItem(categories, effectiveSelectedId);
  }, [categories, effectiveSelectedId]);

  // Filter items recursively when searching
  const filterTree = (items, query) => {
    if (!query) return items;
    const lower = query.toLowerCase();
    const result = [];
    for (const item of items) {
      const matchesSelf = item.name && item.name.toLowerCase().includes(lower);
      const filteredChildren = item.children && Array.isArray(item.children)
        ? filterTree(item.children, query)
        : [];
      if (matchesSelf || filteredChildren.length > 0) {
        result.push({
          ...item,
          children: filteredChildren,
          _autoExpand: filteredChildren.length > 0
        });
      }
    }
    return result;
  };

  const displayCategories = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    if (!searchTerm.trim()) return safeCategories;
    return filterTree(safeCategories, searchTerm.trim());
  }, [categories, searchTerm]);

  // Auto-expand all matching branches when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      const collectExpands = (items) => {
        let expands = {};
        for (const item of items) {
          if (item._autoExpand || (item.children && item.children.length > 0)) {
            expands[item.id] = true;
          }
          if (item.children && item.children.length > 0) {
            expands = { ...expands, ...collectExpands(item.children) };
          }
        }
        return expands;
      };
      setExpandedIds((prev) => ({ ...prev, ...collectExpands(displayCategories) }));
    }
  }, [searchTerm, displayCategories]);

  const renderItems = (items, level = 0) => {
    if (!items || !Array.isArray(items)) return null;
    const sorted = [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return (
      <div className={`list-group list-group-flush ${level > 0 ? 'ms-3 border-start ps-2' : ''}`}>
        {sorted.map((cat) => {
          if (categoryId && String(categoryId) === String(cat.id)) {
            return null;
          }
          const hasChildren = cat?.children && Array.isArray(cat.children) && cat.children.length > 0;
          const isExpanded = !!expandedIds[cat.id];
          const isSelected =
            effectiveSelectedId !== null &&
            effectiveSelectedId !== undefined &&
            effectiveSelectedId !== '' &&
            String(effectiveSelectedId) === String(cat.id);

          const imageUrl = cat.image
            ? (cat.image.startsWith('http') || cat.image.startsWith('/')
              ? cat.image
              : `${process.env.NEXT_PUBLIC_SERVER_URL || ''}${cat.image.replace(/\\/g, '/')}`)
            : null;

          return (
            <div key={cat.id} className="border-0 mb-1">
              <div
                className={`list-group-item list-group-item-action d-flex align-items-center py-2 px-3 border rounded-3 transition-all ${
                  isSelected
                    ? 'bg-primary bg-opacity-10 border-primary shadow-xs'
                    : 'bg-white border-light-subtle hover-bg-light'
                }`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  if (hasChildren) {
                    toggleExpand(cat.id, e);
                  } else {
                    doSelect(cat, e);
                  }
                }}
              >
                {/* Expand Arrow or bullet */}
                <div
                  className="me-2 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '22px', height: '22px', cursor: hasChildren ? 'pointer' : 'default' }}
                  onClick={(e) => {
                    if (hasChildren) {
                      toggleExpand(cat.id, e);
                    }
                  }}
                >
                  {hasChildren ? (
                    <i
                      className={`bi bi-chevron-right text-muted fs-6 transition-all ${
                        isExpanded ? 'rotate-90 text-primary' : ''
                      }`}
                    ></i>
                  ) : (
                    <span className="text-muted opacity-25" style={{ fontSize: '0.6rem' }}>●</span>
                  )}
                </div>

                {/* Category Thumbnail or Icon */}
                <div
                  className="rounded-2 me-2.5 border bg-light d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                  style={{ width: '34px', height: '34px' }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      className="w-100 h-100 object-fit-cover"
                      alt={cat.name || ''}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <i
                    className={`bi ${
                      name.toLowerCase().includes('destination') || name.toLowerCase().includes('zone')
                        ? 'bi-geo-alt-fill text-danger'
                        : 'bi-tags-fill text-primary'
                    } fs-6`}
                    style={{ display: imageUrl ? 'none' : 'block' }}
                  ></i>
                </div>

                {/* Title & Info */}
                <div className="flex-grow-1 overflow-hidden me-2">
                  <div className={`fw-semibold text-truncate small mb-0 ${isSelected ? 'text-primary fw-bold' : 'text-dark'}`}>
                    {cat.name}
                  </div>
                  {hasChildren && (
                    <small className="text-muted d-block text-2xs" style={{ fontSize: '0.7rem' }}>
                      {cat.children.length} sub-area{cat.children.length > 1 ? 's' : ''}
                    </small>
                  )}
                </div>

                {/* Selection Action Button */}
                <button
                  type="button"
                  className={`btn btn-xs rounded-pill px-3 fw-semibold flex-shrink-0 ${
                    isSelected ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                  onClick={(e) => doSelect(cat, e)}
                >
                  {isSelected ? (
                    <>
                      <i className="bi bi-check-circle-fill me-1"></i>Selected
                    </>
                  ) : (
                    'Select'
                  )}
                </button>
              </div>

              {/* Recursive Children */}
              {hasChildren && isExpanded && (
                <div className="ps-2 pt-1">
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
    <div className="p-2 bg-white rounded-3 border">
      {/* Root picker (only when type is empty, used in zone/category parent picker) */}
      {type === "" && (
        <div className="p-2 mb-2 border-bottom d-flex justify-content-between align-items-center">
          <span className="fw-bold small text-uppercase text-secondary">Pick Parent {name}</span>
          <button
            type="button"
            className={`btn btn-xs rounded-pill ${
              effectiveSelectedId === null || effectiveSelectedId === '' ? 'btn-dark' : 'btn-light text-muted border'
            }`}
            onClick={() => doSelect({ id: null })}
          >
            Set as Root
          </button>
        </div>
      )}

      {/* Selected Item Indicator (when type !== "") */}
      {type !== "" && (
        <div className="mb-2">
          {selectedItem ? (
            <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <i className="bi bi-check-circle-fill text-primary flex-shrink-0"></i>
                <span className="small text-muted flex-shrink-0">Selected:</span>
                <span className="fw-bold text-primary text-truncate small">{selectedItem.name}</span>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-outline-secondary rounded-pill flex-shrink-0 ms-2"
                onClick={(e) => doSelect({ id: '' }, e)}
                title="Deselect / Clear"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="p-2 rounded-3 bg-light border border-light-subtle text-muted small d-flex align-items-center gap-2">
              <i className="bi bi-info-circle text-secondary"></i>
              <span>No {name.toLowerCase()} selected yet. Choose below:</span>
            </div>
          )}
        </div>
      )}

      {/* Search Input when more than 3 items exist */}
      {Array.isArray(categories) && categories.length > 3 && (
        <div className="mb-2">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light border-end-0 py-1">
              <i className="bi bi-search text-muted small"></i>
            </span>
            <input
              type="text"
              className="form-control form-control-sm bg-light border-start-0 py-1"
              placeholder={placeholder || `Filter ${name.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="btn btn-sm btn-light border py-1"
                onClick={() => setSearchTerm('')}
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Item List / Tree */}
      <div className="overflow-auto pe-1" style={{ maxHeight: '280px' }}>
        {displayCategories.length > 0 ? (
          renderItems(displayCategories)
        ) : (
          <div className="p-3 text-center text-muted small">
            {searchTerm ? (
              <>
                <i className="bi bi-search d-block fs-5 text-secondary mb-1"></i>
                No matching {name.toLowerCase()} found for "{searchTerm}"
              </>
            ) : (
              <>
                <i className="bi bi-inbox d-block fs-5 text-secondary mb-1"></i>
                No {name.toLowerCase()} available.
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .rotate-90 {
          transform: rotate(90deg);
        }
        .transition-all {
          transition: all 0.15s ease-in-out;
        }
        .btn-xs {
          padding: 0.2rem 0.65rem;
          font-size: 0.72rem;
        }
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
};

export default MultiLevelSelect;