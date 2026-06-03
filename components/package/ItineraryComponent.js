"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";

export default function ItineraryComponent({days, setDays}) {

  // TinyMCE settings Profile
  const editorConfig = {
    height: 180,
    menubar: false,
    plugins: ['lists', 'link', 'code', 'wordcount'],
    toolbar: 'undo redo | bold italic | bullist numlist | removeformat'
  };

  // --- Change Handlers ---
  const handleFieldChange = (index, field, value) => {
    const updatedDays = [...days];
    updatedDays[index][field] = value;
    setDays(updatedDays);
  };

  // Handle roadmap waypoint text updates
  const handleRoadmapStopChange = (dayIndex, stopIndex, value) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].roadmap[stopIndex] = value;
    setDays(updatedDays);
  };

  // Add waypoint to a specific day
  const addRoadmapStop = (dayIndex) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].roadmap.push("");
    setDays(updatedDays);
  };

  // Remove waypoint from a specific day
  const removeRoadmapStop = (dayIndex, stopIndex) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].roadmap.splice(stopIndex, 1);
    setDays(updatedDays);
  };

  const addDay = () => {
    setDays([...days, {
      dayNumber: days.length + 1,
      title: "",
      roadmap: ["Start Location", "End Location"],
      details: ""
    }]);
  };

  const removeDay = (index) => {
    const filtered = days.filter((_, idx) => idx !== index);
    setDays(filtered.map((d, i) => ({ ...d, dayNumber: i + 1 })));
  };


  return (
    <div className="container my-5 p-4 rounded shadow-sm" style={{ maxWidth: "1100px" }}>
      
      <div className="border-bottom pb-3 mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="fw-bold text-dark m-0">Itinerary Creation</h5>
          <small className="text-muted">Manage structured trip routes, transit roadmaps, and rich text descriptions.</small>
        </div>
        <button type="button" className="btn btn-primary fw-semibold" onClick={addDay}>+ Add New Day</button>
      </div>

      <div>
        
        {days.map((item, dIdx) => (
          <div key={dIdx} className="card mb-5 shadow-sm border border-secondary border-opacity-25 mt-3">
            
            {/* Day Title Block */}
            <div className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center py-2 px-3">
              <span className="fw-bold text-primary fs-5">Day {item.dayNumber} Setup</span>
              {days.length > 1 && (
                <button type="button"  className="btn btn-sm btn-outline-danger" onClick={() => removeDay(dIdx)}>Remove Day</button>
              )}
            </div>

            <div className="card-body bg-white">
              <div className="row g-3 mb-4">
                <div className="col-md-12">
                  <label className="form-label fw-semibold small text-uppercase text-muted">Day Heading Focus</label>
                  <input 
                    type="text" className="form-control" placeholder="e.g., Cochin to Munnar Drive"
                    value={item.title} onChange={(e) => handleFieldChange(dIdx, "title", e.target.value)} required
                  />
                </div>
              </div>

              {/* ROADMAP ROUTE BUILDER */}
              <div className="bg-light p-3 rounded mb-4 border border-dashed">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold m-0 text-dark" style={{fontSize:"14px"}}>
                    📍 Map Route Stops & Waypoints (In order)
                  </label>
                  <button type="button"  className="btn btn-xs btn-secondary px-2 py-1 text-xs" style={{fontSize:"11px"}} onClick={() => addRoadmapStop(dIdx)}>
                    + Add Stop
                  </button>
                </div>
                
                {/* Inputs for Route Stops */}
                <div className="row g-2 align-items-center mb-3">
                  {item.roadmap.map((stop, sIdx) => (
                    <div key={sIdx} className="col-md-3">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white text-secondary small fw-bold">{sIdx + 1}</span>
                        <input 
                          type="text" className="form-control form-control-sm" placeholder="Location name"
                          value={stop} onChange={(e) => handleRoadmapStopChange(dIdx, sIdx, e.target.value)} required
                        />
                        {item.roadmap.length > 2 && (
                          <button type="button" className="btn btn-outline-danger" onClick={() => removeRoadmapStop(dIdx, sIdx)}>&times;</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* VISUAL MAP PREVIEW (Renders immediately inside Admin UI) */}
                <div className="mt-2 bg-white p-2 rounded border border-light">
                  <span className="text-muted fw-semibold d-block mb-1" style={{fontSize: "11px", letterSpacing: "0.5px"}}>LIVE ROADMAP PREVIEW:</span>
                  <div className="d-flex align-items-center flex-wrap gap-2 py-1">
                    {item.roadmap.map((stop, sIdx) => (
                      <React.Fragment key={sIdx}>
                        <span className="badge bg-primary px-2.5 py-1.5 fw-medium rounded-pill shadow-xs">
                          {stop || `Stop ${sIdx + 1}`}
                        </span>
                        {sIdx < item.roadmap.length - 1 && (
                          <span className="text-secondary fw-bold" style={{fontSize:"13px"}}>➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* DETAIL TEXT ACTIONS */}
              <div>
                <label className="form-label fw-semibold small text-uppercase text-muted">Detailed Itinerary Contents</label>
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TinyMCE_API}
                  value={item.details}
                  init={editorConfig}
                  onEditorChange={(content) => handleFieldChange(dIdx, "details", content)}
                />
              </div>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}