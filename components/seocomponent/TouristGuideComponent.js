"use client";

import React, { useState, useEffect } from "react";

export const defaultGuideData = {
  enabled: true,
  guide_title: "Sundarban Tour Guide",
  guide_subtitle: "Things you have to know before making a Sundarban trip.",
  how_to_reach_title: "How can I make a Sundarban tour comfortable?",
  overview_desc: "We have been providing satisfactory, safe, and eco-friendly tours to tourists from every corner of the world. With licensed forest department naturalists, luxury solar vessels, and dedicated local support, we make your journey comfortable, memorable, and hassle-free.",
  ways_to_reach: [
    {
      title: "Way-1: By Air (Kolkata Airport)",
      description: "Reach Netaji Subhash Chandra Bose International Airport (CCU), Kolkata. It is approximately 110-120 km from Godkhali / Sonakhali boarding points. AC cab transfers or package pickup can be arranged directly."
    },
    {
      title: "Way-2: By Train (Sealdah / Howrah)",
      description: "Arrive at Sealdah or Howrah Railway Station. Take a local EMU train to Canning Station (approx. 45 km from Kolkata, 1 hr 15 mins), from where private auto or cab takes you to the boat ghats."
    },
    {
      title: "Way-3: By Road / Direct Cab",
      description: "Travel smoothly via Basanti Highway or Baruipur-Canning route by private car, taxi, or tourist bus directly to Godkhali Ferry Ghat (approx. 3.5 hrs drive from Central Kolkata)."
    }
  ],
  guide_points: [
    {
      title: "Enjoy Natural & Mangrove Beauty",
      description: "Sundarban is a UNESCO World Heritage Site with the world's largest contiguous mangrove ecosystem, crisscrossed by tidal rivers and scenic creeks.",
      icon: "fa-solid fa-tree"
    },
    {
      title: "How to Plan Your Tour",
      description: "Choose from 1 Day, 2 Days 1 Night, or 3 Days 2 Nights all-inclusive packages with resort stay, all meals, permit fees, and boat cruise included.",
      icon: "fa-solid fa-compass"
    },
    {
      title: "Watch Towers & Key Sighting Points",
      description: "Visit prominent forest watchtowers including Sajnekhali, Sudhanyakhali, and Dobanki (canopy walk) to spot tigers, spotted deer, wild boars, and exotic birds.",
      icon: "fa-solid fa-binoculars"
    },
    {
      title: "Houseboat & River Safari",
      description: "Cruising on luxury, solar-powered safari boats with open observation decks is the centerpiece of the trip. Experience the song of the mangrove rivers.",
      icon: "fa-solid fa-ship"
    },
    {
      title: "Jungle Wildlife & Bird Watching",
      description: "Home to the Royal Bengal Tiger, estuarine crocodiles, monitor lizards, Gangetic dolphins, and over 200 species of resident and migratory birds.",
      icon: "fa-solid fa-paw"
    },
    {
      title: "ATM & Money Availability",
      description: "ATMs are very limited inside the delta islands. Please withdraw sufficient cash in Kolkata, Canning, or Gosaba before boarding the boat.",
      icon: "fa-solid fa-credit-card"
    }
  ],
  services: [
    { title: "Resort Accommodation", desc: "Clean, comfortable AC and non-AC rooms with attached baths.", icon: "fa-solid fa-hotel" },
    { title: "Privacy & Group Care", desc: "Private boat cabins and customized group tour options.", icon: "fa-solid fa-user-shield" },
    { title: "Fresh Hot Local Food", desc: "Delicious Bengali meals cooked fresh onboard with prawn and crab specials.", icon: "fa-solid fa-utensils" },
    { title: "Reliable Transport", desc: "AC vehicle pickup and drop from Kolkata and Canning.", icon: "fa-solid fa-van-shuttle" },
    { title: "100% Safety & Lifejackets", desc: "GPS-equipped vessels, life buoys, and licensed forest guides.", icon: "fa-solid fa-shield-halved" },
    { title: "Expert Local Guides", desc: "Forest department licensed naturalists who know tiger tracks intimately.", icon: "fa-solid fa-compass" },
    { title: "Doctor on Call", desc: "24x7 medical emergency support and onboard first-aid kit.", icon: "fa-solid fa-kit-medical" },
    { title: "Solar & Electricity", desc: "24x7 power backup for charging cameras, phones, and lighting.", icon: "fa-solid fa-bolt" }
  ],
  important_tips: [
    "Carry original Photo ID Proof (Aadhaar, Passport, Voter ID) required for Forest Department entry permits.",
    "Wear light, earthy-colored cotton clothes (khaki, olive green, beige) during safari; avoid bright neon colors.",
    "Do not play loud music or litter plastic into the river; help preserve this fragile UNESCO biosphere.",
    "Keep personal medication, binoculars, camera lenses, and insect repellent handy."
  ]
};

export default function TouristGuideComponent({ guideData, setGuideData, entityName = "Destination" }) {
  const [isOpen, setIsOpen] = useState(true);

  // Parse guideData if passed as string or initialize with default
  const currentGuide = React.useMemo(() => {
    if (!guideData) return defaultGuideData;
    if (typeof guideData === "string") {
      try {
        return JSON.parse(guideData);
      } catch (e) {
        return defaultGuideData;
      }
    }
    return guideData;
  }, [guideData]);

  const updateGuide = (updater) => {
    const updated = typeof updater === "function" ? updater(currentGuide) : { ...currentGuide, ...updater };
    setGuideData(updated);
  };

  // Helper for Top-level text fields
  const handleTextChange = (field, value) => {
    updateGuide(prev => ({ ...prev, [field]: value }));
  };

  // --- Ways to Reach Handlers ---
  const handleWayChange = (index, field, value) => {
    updateGuide(prev => {
      const ways = [...(prev.ways_to_reach || [])];
      ways[index] = { ...ways[index], [field]: value };
      return { ...prev, ways_to_reach: ways };
    });
  };

  const addWay = () => {
    updateGuide(prev => ({
      ...prev,
      ways_to_reach: [
        ...(prev.ways_to_reach || []),
        { title: `Way-${(prev.ways_to_reach?.length || 0) + 1}: Transit Route`, description: "" }
      ]
    }));
  };

  const removeWay = (index) => {
    updateGuide(prev => ({
      ...prev,
      ways_to_reach: (prev.ways_to_reach || []).filter((_, i) => i !== index)
    }));
  };

  // --- Guide Points Handlers ---
  const handlePointChange = (index, field, value) => {
    updateGuide(prev => {
      const points = [...(prev.guide_points || [])];
      points[index] = { ...points[index], [field]: value };
      return { ...prev, guide_points: points };
    });
  };

  const addPoint = () => {
    updateGuide(prev => ({
      ...prev,
      guide_points: [
        ...(prev.guide_points || []),
        { title: "New Travel Insight", description: "", icon: "fa-solid fa-map-pin" }
      ]
    }));
  };

  const removePoint = (index) => {
    updateGuide(prev => ({
      ...prev,
      guide_points: (prev.guide_points || []).filter((_, i) => i !== index)
    }));
  };

  // --- Important Tips Handlers ---
  const handleTipChange = (index, value) => {
    updateGuide(prev => {
      const tips = [...(prev.important_tips || [])];
      tips[index] = value;
      return { ...prev, important_tips: tips };
    });
  };

  const addTip = () => {
    updateGuide(prev => ({
      ...prev,
      important_tips: [...(prev.important_tips || []), ""]
    }));
  };

  const removeTip = (index) => {
    updateGuide(prev => ({
      ...prev,
      important_tips: (prev.important_tips || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
      <div 
        className="card-header bg-gradient bg-primary text-white p-3 d-flex justify-content-between align-items-center"
        style={{ cursor: "pointer" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-compass fs-4"></i>
          <div>
            <h5 className="mb-0 fw-bold">Tourist Guide Configuration ({entityName})</h5>
            <small className="opacity-75">Configure rich Sundarban Eco Tourism style tour guide for this {entityName.toLowerCase()}</small>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-white text-primary fw-bold px-3 py-1.5 rounded-pill">
            {currentGuide.enabled !== false ? "Active Guide" : "Disabled"}
          </span>
          <i className={`bi bi-chevron-${isOpen ? "up" : "down"} fs-5`}></i>
        </div>
      </div>

      {isOpen && (
        <div className="card-body p-4 bg-light">
          {/* Active Switch */}
          <div className="form-check form-switch mb-4 p-3 bg-white rounded-3 border">
            <input 
              className="form-check-input ms-0 me-3" 
              type="checkbox" 
              role="switch" 
              id="guideEnabledSwitch"
              checked={currentGuide.enabled !== false}
              onChange={(e) => handleTextChange("enabled", e.target.checked)}
            />
            <label className="form-check-label fw-bold text-dark" htmlFor="guideEnabledSwitch">
              Display Tourist Guide on Packages Page for this {entityName}
            </label>
            <p className="text-muted small mb-0 ms-5">
              When enabled, a full responsive Tourist Guide section (like sundarbanecotourism.com) will be displayed on the packages page filtered by this {entityName.toLowerCase()}.
            </p>
          </div>

          {/* Section 1: Main Headings */}
          <div className="card border-0 shadow-xs rounded-3 p-3 mb-4 bg-white">
            <h6 className="fw-bold text-primary mb-3">
              <i className="bi bi-type-h1 me-2"></i>Guide Section Headings
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small text-muted text-uppercase">Guide Main Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Sundarban Tour Guide" 
                  value={currentGuide.guide_title || ""}
                  onChange={(e) => handleTextChange("guide_title", e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small text-muted text-uppercase">Guide Subtitle / Tagline</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Things you have to know before making a Sundarban trip." 
                  value={currentGuide.guide_subtitle || ""}
                  onChange={(e) => handleTextChange("guide_subtitle", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Overview & How to Make Tour Comfortable */}
          <div className="card border-0 shadow-xs rounded-3 p-3 mb-4 bg-white">
            <h6 className="fw-bold text-primary mb-3">
              <i className="bi bi-signpost-2 me-2"></i>Overview & Transit Guide (How To Reach)
            </h6>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold small text-muted text-uppercase">Comfortable Tour Question Heading</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. How can I make a sundarban tour comfortable?" 
                  value={currentGuide.how_to_reach_title || ""}
                  onChange={(e) => handleTextChange("how_to_reach_title", e.target.value)}
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small text-muted text-uppercase">Overview Paragraph</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Describe your tour operator experience, dedication, and safety promise..."
                  value={currentGuide.overview_desc || ""}
                  onChange={(e) => handleTextChange("overview_desc", e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* Ways to reach dynamic list */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold text-dark m-0">
                  <i className="bi bi-bezier2 me-1 text-success"></i> Ways to Reach / Travel Routes ({currentGuide.ways_to_reach?.length || 0})
                </label>
                <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1" onClick={addWay}>
                  <i className="bi bi-plus-circle me-1"></i> Add Transit Way
                </button>
              </div>

              {(currentGuide.ways_to_reach || []).map((way, wIdx) => (
                <div key={wIdx} className="p-3 bg-light rounded-3 border mb-2 position-relative">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-primary-subtle text-primary fw-bold">Way #{wIdx + 1}</span>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-link text-danger p-0" 
                      onClick={() => removeWay(wIdx)}
                      title="Remove this way"
                    >
                      <i className="bi bi-trash"></i> Remove
                    </button>
                  </div>
                  <div className="row g-2">
                    <div className="col-md-5">
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="Heading e.g. Way-1: By Air (Airport)" 
                        value={way.title || ""}
                        onChange={(e) => handleWayChange(wIdx, "title", e.target.value)}
                      />
                    </div>
                    <div className="col-md-7">
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="Route details, distance, connectivity, cabs/trains..." 
                        value={way.description || ""}
                        onChange={(e) => handleWayChange(wIdx, "description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Tourist Guide Highlights & Points */}
          <div className="card border-0 shadow-xs rounded-3 p-3 mb-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-primary mb-0">
                  <i className="bi bi-card-checklist me-2"></i>Guide Points & Highlights ({currentGuide.guide_points?.length || 0})
                </h6>
                <small className="text-muted">Key information cards for natural beauty, watch towers, boat rides, wildlife, ATMs, etc.</small>
              </div>
              <button type="button" className="btn btn-sm btn-outline-success rounded-pill px-3 py-1" onClick={addPoint}>
                <i className="bi bi-plus-circle me-1"></i> Add Guide Point
              </button>
            </div>

            <div className="row g-3">
              {(currentGuide.guide_points || []).map((pt, pIdx) => (
                <div key={pIdx} className="col-md-6">
                  <div className="p-3 bg-light rounded-3 border h-100 position-relative">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-success-subtle text-success fw-bold">Point #{pIdx + 1}</span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-link text-danger p-0" 
                        onClick={() => removePoint(pIdx)}
                      >
                        <i className="bi bi-x-circle-fill"></i>
                      </button>
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-muted mb-1">Point Title</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="e.g. Watch Towers & Viewpoints" 
                        value={pt.title || ""}
                        onChange={(e) => handlePointChange(pIdx, "title", e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-muted mb-1">Icon Class (FontAwesome)</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="e.g. fa-solid fa-binoculars" 
                        value={pt.icon || "fa-solid fa-check"}
                        onChange={(e) => handlePointChange(pIdx, "icon", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label small fw-semibold text-muted mb-1">Description</label>
                      <textarea 
                        className="form-control form-control-sm" 
                        rows="2" 
                        placeholder="Explanation of this guide point..."
                        value={pt.description || ""}
                        onChange={(e) => handlePointChange(pIdx, "description", e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Important Tourist Tips / Guidelines */}
          <div className="card border-0 shadow-xs rounded-3 p-3 mb-2 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-primary mb-0">
                  <i className="bi bi-info-circle me-2"></i>Important Tips & Guidelines ({currentGuide.important_tips?.length || 0})
                </h6>
                <small className="text-muted">Vital travel advice (ID proofs, clothing, precautions, season tips)</small>
              </div>
              <button type="button" className="btn btn-sm btn-outline-info rounded-pill px-3 py-1" onClick={addTip}>
                <i className="bi bi-plus-circle me-1"></i> Add Tip
              </button>
            </div>

            {(currentGuide.important_tips || []).map((tip, tIdx) => (
              <div key={tIdx} className="input-group input-group-sm mb-2">
                <span className="input-group-text bg-white fw-bold text-muted">{tIdx + 1}</span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter important tip or guideline..." 
                  value={tip || ""}
                  onChange={(e) => handleTipChange(tIdx, e.target.value)}
                />
                <button type="button" className="btn btn-outline-danger" onClick={() => removeTip(tIdx)}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
