"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { getAllZoneUrl, getAllCityUrl } from "@/app/routes/serviceRoutes";
import { showMessage } from "@/libs/commonHelper";
import { defaultGuideData } from "@/components/seocomponent/TouristGuideComponent";

// Helper to flatten nested zone tree
function flattenZones(items, prefix = "") {
  let result = [];
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    const displayName = prefix ? `${prefix} > ${item.name}` : item.name;
    result.push({
      ...item,
      displayName
    });
    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
      result = result.concat(flattenZones(item.children, displayName));
    }
  }
  return result;
}

export default function CopyContentDropdown({ 
  onCopy, 
  setGuideData, 
  currentEntityName = "Content",
  compact = false 
}) {
  const [zones, setZones] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const token = useSelector((state) => state.adminAuth?.token);

  useEffect(() => {
    let isMounted = true;
    async function loadAllEntities() {
      try {
        setLoading(true);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [zoneRes, cityRes] = await Promise.allSettled([
          axios.get(getAllZoneUrl, { headers }).catch(err => ({ data: { status: false, msg: err.message } })),
          axios.get(getAllCityUrl, { headers }).catch(err => ({ data: { status: false, msg: err.message } }))
        ]);

        if (isMounted) {
          if (zoneRes.status === "fulfilled" && zoneRes.value?.data?.status) {
            const rawZones = zoneRes.value.data.zone || [];
            const flat = flattenZones(rawZones);
            setZones(flat);
          }

          if (cityRes.status === "fulfilled" && cityRes.value?.data?.status) {
            const rawCities = cityRes.value.data.cities || [];
            setCities(rawCities);
          }
        }
      } catch (err) {
        console.error("Error loading destinations and cities for copy:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAllEntities();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleCopy = () => {
    if (!selectedKey) {
      showMessage("Please select a Destination or City from the dropdown first.", "error");
      return;
    }

    const [type, idStr] = selectedKey.split(":");
    const id = parseInt(idStr, 10);

    let sourceItem = null;
    let sourceTypeName = "";

    if (type === "zone") {
      sourceItem = zones.find(z => z.id === id);
      sourceTypeName = "Destination";
    } else if (type === "city") {
      sourceItem = cities.find(c => c.id === id);
      sourceTypeName = "City";
    }

    if (!sourceItem) {
      showMessage("Selected item could not be found.", "error");
      return;
    }

    // 1. Parse tourist_guide
    let parsedGuide = null;
    if (sourceItem.tourist_guide) {
      try {
        parsedGuide = typeof sourceItem.tourist_guide === "string" 
          ? JSON.parse(sourceItem.tourist_guide) 
          : sourceItem.tourist_guide;
      } catch (e) {
        console.error("Failed to parse source tourist_guide:", e);
      }
    }

    // Fallback template if no guide was configured
    if (!parsedGuide) {
      parsedGuide = {
        ...defaultGuideData,
        guide_title: `${sourceItem.name} Tour Guide`,
        how_to_reach_title: `How can I make a ${sourceItem.name} tour comfortable?`
      };
    }

    // Apply to guideData if setGuideData is provided
    if (typeof setGuideData === "function") {
      setGuideData(parsedGuide);
    }

    // Call onCopy callback for parent form fields (SEO, description, etc.)
    if (typeof onCopy === "function") {
      onCopy({
        type,
        sourceTypeName,
        item: sourceItem,
        touristGuide: parsedGuide,
        description: sourceItem.description || "",
        meta_title: sourceItem.meta_title || sourceItem.name || "",
        meta_description: sourceItem.meta_description || sourceItem.description || "",
        tags: sourceItem.tags 
          ? (typeof sourceItem.tags === "string" ? sourceItem.tags.split(",").map(s => s.trim()) : sourceItem.tags)
          : [],
        canonical_url: sourceItem.canonical_url || "",
        og_title: sourceItem.og_title || sourceItem.meta_title || sourceItem.name || "",
        og_description: sourceItem.og_description || sourceItem.meta_description || "",
        robots_meta: sourceItem.robots_meta || "index, follow"
      });
    }

    showMessage(
      `Content and Tourist Guide successfully copied from ${sourceTypeName} "${sourceItem.name}"!`,
      "success"
    );
  };

  if (compact) {
    return (
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <select
          className="form-select form-select-sm"
          style={{ minWidth: "260px", maxWidth: "360px" }}
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Select City or Destination to Copy --</option>
          {destinationsOptgroup(zones)}
          {citiesOptgroup(cities)}
        </select>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!selectedKey}
          className="btn btn-warning btn-sm fw-semibold text-dark d-flex align-items-center shadow-xs"
        >
          <i className="bi bi-clipboard2-check me-1"></i>
          Copy Content
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white rounded-3 border shadow-xs mb-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning bg-opacity-20 text-dark p-2 rounded-2">
              <i className="bi bi-copy fs-6"></i>
            </span>
            <div>
              <h6 className="mb-0 fw-bold text-dark">
                Copy Content from Existing City or Destination
              </h6>
              <small className="text-muted">
                Quickly copy Tourist Guide Configuration and SEO details from another {currentEntityName}.
              </small>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select
            className="form-select"
            style={{ minWidth: "280px" }}
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Choose City or Destination --</option>
            {destinationsOptgroup(zones)}
            {citiesOptgroup(cities)}
          </select>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!selectedKey}
            className="btn btn-primary fw-semibold d-flex align-items-center px-4"
          >
            <i className="bi bi-clipboard2-check me-2"></i>
            Copy Content
          </button>
        </div>
      </div>
    </div>
  );
}

function destinationsOptgroup(zones) {
  if (!zones || zones.length === 0) return null;
  return (
    <optgroup label="📍 Destinations (Zones)">
      {zones.map((z) => {
        const hasGuide = !!z.tourist_guide;
        return (
          <option key={`zone:${z.id}`} value={`zone:${z.id}`}>
            📍 {z.displayName || z.name} {hasGuide ? "⭐ [Guide Ready]" : ""}
          </option>
        );
      })}
    </optgroup>
  );
}

function citiesOptgroup(cities) {
  if (!cities || cities.length === 0) return null;
  return (
    <optgroup label="🏙️ Cities">
      {cities.map((c) => {
        const hasGuide = !!c.tourist_guide;
        const locationText = c.state ? `${c.name} (${c.state})` : c.name;
        return (
          <option key={`city:${c.id}`} value={`city:${c.id}`}>
            🏙️ {locationText} {hasGuide ? "⭐ [Guide Ready]" : ""}
          </option>
        );
      })}
    </optgroup>
  );
}
