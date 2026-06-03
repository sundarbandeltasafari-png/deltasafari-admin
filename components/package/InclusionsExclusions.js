'use client';

import React, { useState } from 'react';

export default function InclusionsExclusions({ inclusions, setInclusions, exclusions, setExclusions }) {
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  // Handlers for adding items
  const handleAddInclusion = (e) => {
    e.preventDefault();
    if (!newInclusion.trim()) return;
    setInclusions([...inclusions, newInclusion.trim()]);
    setNewInclusion('');
  };

  const handleAddExclusion = (e) => {
    e.preventDefault();
    if (!newExclusion.trim()) return;
    setExclusions([...exclusions, newExclusion.trim()]);
    setNewExclusion('');
  };

  // Handlers for removing items
  const handleRemoveInclusion = (index) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const handleRemoveExclusion = (index) => {
    setExclusions(exclusions.filter((_, i) => i !== index));
  };


  return (
    <div className="container-fluid p-0">
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="card h-100 shadow-sm border-0 rounded-4">
            {/* Visual match to your UI: Left accent line with subtle background */}
            <div className="card-header bg-success-subtle text-success border-start border-success border-4 py-3 rounded-top-4">
              <h5 className="card-title mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-2"></i> Inclusions
              </h5>
            </div>

            <div className="card-body d-flex flex-column justify-content-between">
              {/* Preview/Scrollable Area */}
              <div className="mb-4" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                {inclusions.length === 0 ? (
                  <p className="text-muted text-center py-4">No inclusions added yet.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {inclusions.map((item, idx) => (
                      <li key={idx} className="list-group-item d-flex justify-content-between align-items-start border-0 px-0 py-2">
                        <span className="text-dark small">
                          <span className="text-success fw-bold me-2">✓</span> {item}
                        </span>
                        <button type="button"
                          onClick={() => handleRemoveInclusion(idx)}
                          className="btn btn-sm btn-link text-danger p-0 ms-2 text-decoration-none"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Input for adding new inclusions */}
              <div className="input-group mt-auto">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add an inclusion item..."
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                />
                <button type="button" onClick={handleAddInclusion} className="btn btn-success" >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= EXCLUSIONS MANAGEMENT ================= */}
        <div className="col-12 col-md-6">
          <div className="card h-100 shadow-sm border-0 rounded-4">
            {/* Visual match to your UI: Left accent line with subtle background */}
            <div className="card-header bg-danger-subtle text-danger border-start border-danger border-4 py-3 rounded-top-4">
              <h5 className="card-title mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-x-circle-fill me-2"></i> Exclusions
              </h5>
            </div>

            <div className="card-body d-flex flex-column justify-content-between">
              {/* Preview/Scrollable Area */}
              <div className="mb-4" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                {exclusions.length === 0 ? (
                  <p className="text-muted text-center py-4">No exclusions added yet.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {exclusions.map((item, idx) => (
                      <li key={idx} className="list-group-item d-flex justify-content-between align-items-start border-0 px-0 py-2">
                        <span className="text-dark small">
                          <span className="text-danger fw-bold me-2">✕</span> {item}
                        </span>
                        <button type="button"
                          onClick={() => handleRemoveExclusion(idx)}
                          className="btn btn-sm btn-link text-danger p-0 ms-2 text-decoration-none"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Input for adding new exclusions */}
              <div className="input-group mt-auto">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add an exclusion item..."
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                />
                <button onClick={handleAddExclusion} type="button" className="btn btn-danger" >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}