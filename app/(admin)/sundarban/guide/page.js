'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import { getSundarbanGuideUrl, updateSundarbanGuideUrl } from '@/app/routes/sundarbanRoutes';

export default function SundarbanGuidePage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [guide, setGuide] = useState({
        seasons: [
            {
                badge: 'Peak Season',
                badge_color: 'success',
                title: 'October to March (Winter)',
                description: 'Pleasant weather (15°C - 25°C), cool river breezes, and highest tiger basking sightings along muddy riverbanks during sunny low tides. Ideal for birdwatching and wildlife photography.'
            },
            {
                badge: 'Shoulder Season',
                badge_color: 'warning',
                title: 'April to June (Summer)',
                description: 'Warmer days, but animals frequently visit sweet-water ponds inside watchtower compounds (Sudhanyakhali, Dobanki) to drink water, providing concentrated sighting opportunities.'
            },
            {
                badge: 'Green Season',
                badge_color: 'info',
                title: 'July to September (Monsoon)',
                description: 'The mangroves turn lush and emerald green. The Hilsa (Ilish) fish festival takes place, making it a feast for foodies and lovers of dramatic monsoon photography.'
            }
        ],
        ways_to_reach: [
            {
                title: 'Way-1: By Road from Kolkata',
                description: 'Distance is approx 85 km from Kolkata. Drive via Baruipur - Canning - Basanti highway to Godkhali Ferry Ghat (approx 3 to 3.5 hours).'
            },
            {
                title: 'Way-2: By Local Train',
                description: 'Board local Canning suburban local trains from Sealdah South Station (approx 1 hr 15 mins). From Canning Station, shared autos and cabs reach Godkhali in 45 mins.'
            },
            {
                title: 'Way-3: From Kolkata Airport',
                description: 'Netaji Subhash Chandra Bose Airport (CCU) is 90 km from Godkhali. We arrange doorstep AC sedan/SUV pickups straight from arrival gates.'
            }
        ],
        watchtowers: [
            { name: 'Sajnekhali Watchtower', highlight: 'Mangrove Interpretation Centre, Crocodile Pond & Sweet-Water Hole' },
            { name: 'Sudhanyakhali Watchtower', highlight: 'Highest tiger sighting rate overlooking sweet-water drinking pond' },
            { name: 'Dobanki Canopy Walk', highlight: 'Elevated 496-meter caged walkway half a kilometer into tree canopy' },
            { name: 'Burirdabri Watchtower', highlight: 'Mud-walk cage trail bordering Bangladesh border with panoramic views' }
        ],
        safari_rules: [
            'Carry original Government photo ID cards (Aadhaar / Voter ID / Passport).',
            'Wear muted earthy clothing (greens, khakis, browns) that blend into the forest.',
            'Maintain pin-drop silence when approaching watchtowers or wildlife banks.',
            'Do NOT step down or lean out of the safari boat into water under any circumstances.',
            'Do NOT bring single-use plastic bottles, polythene, or throw waste into rivers.',
            'Do NOT smoke or consume alcohol inside the National Park protected zones.'
        ]
    });

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        axiosGet(getSundarbanGuideUrl, token).then((res) => {
            if (res && res.status && res.guide) {
                setGuide((prev) => ({
                    ...prev,
                    ...res.guide
                }));
            }
        }).catch((err) => {
            showMessage(err?.message || "Failed to load safari guide data", "error");
        }).finally(() => {
            setLoading(false);
        });
    }, [token]);

    // Handle Season Field Changes
    const handleSeasonChange = (index, field, value) => {
        const updated = [...(guide.seasons || [])];
        updated[index] = { ...updated[index], [field]: value };
        setGuide((prev) => ({ ...prev, seasons: updated }));
    };

    const addSeason = () => {
        setGuide((prev) => ({
            ...prev,
            seasons: [
                ...(prev.seasons || []),
                { badge: 'New Season', badge_color: 'success', title: '', description: '' }
            ]
        }));
    };

    const removeSeason = (index) => {
        setGuide((prev) => ({
            ...prev,
            seasons: (prev.seasons || []).filter((_, i) => i !== index)
        }));
    };

    // Handle Ways to Reach
    const handleWayChange = (index, field, value) => {
        const updated = [...(guide.ways_to_reach || [])];
        updated[index] = { ...updated[index], [field]: value };
        setGuide((prev) => ({ ...prev, ways_to_reach: updated }));
    };

    const addWay = () => {
        setGuide((prev) => ({
            ...prev,
            ways_to_reach: [
                ...(prev.ways_to_reach || []),
                { title: '', description: '' }
            ]
        }));
    };

    const removeWay = (index) => {
        setGuide((prev) => ({
            ...prev,
            ways_to_reach: (prev.ways_to_reach || []).filter((_, i) => i !== index)
        }));
    };

    // Handle Watchtowers
    const handleWatchtowerChange = (index, field, value) => {
        const updated = [...(guide.watchtowers || [])];
        updated[index] = { ...updated[index], [field]: value };
        setGuide((prev) => ({ ...prev, watchtowers: updated }));
    };

    const addWatchtower = () => {
        setGuide((prev) => ({
            ...prev,
            watchtowers: [
                ...(prev.watchtowers || []),
                { name: '', highlight: '' }
            ]
        }));
    };

    const removeWatchtower = (index) => {
        setGuide((prev) => ({
            ...prev,
            watchtowers: (prev.watchtowers || []).filter((_, i) => i !== index)
        }));
    };

    // Handle Safari Rules
    const handleRuleChange = (index, value) => {
        const updated = [...(guide.safari_rules || [])];
        updated[index] = value;
        setGuide((prev) => ({ ...prev, safari_rules: updated }));
    };

    const addRule = () => {
        setGuide((prev) => ({
            ...prev,
            safari_rules: [...(prev.safari_rules || []), '']
        }));
    };

    const removeRule = (index) => {
        setGuide((prev) => ({
            ...prev,
            safari_rules: (prev.safari_rules || []).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axiosPost(updateSundarbanGuideUrl, { guide }, token);
            if (res && res.status) {
                showMessage("Safari & Travel Guide content updated successfully!", "success");
            } else {
                showMessage(res?.msg || "Failed to update guide data", "error");
            }
        } catch (error) {
            showMessage(error?.message || "Communication error with server", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="ri ri-compass-3-line text-success"></i>
                        <span>Safari &amp; Travel Guide Manager</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Manage best visiting seasons, transit ways to Godkhali, key watchtowers, and forest safari regulations.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                    <LoadingComponent />
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* SECTION 1: Best Visiting Seasons */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                    <i className="ri ri-calendar-check-line text-success"></i>
                                    <span>Visiting Seasons &amp; Tiger Sighting Windows</span>
                                </h5>
                                <small className="text-muted">Displays in 3 season cards on the /guide page.</small>
                            </div>
                            <button type="button" onClick={addSeason} className="btn btn-sm btn-outline-success rounded-3">
                                <i className="ri ri-add-line me-1"></i> Add Season
                            </button>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-4">
                                {(guide.seasons || []).map((season, index) => (
                                    <div className="col-lg-4 col-md-6" key={index}>
                                        <div className="card border rounded-3 p-3 h-100 bg-light">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="badge bg-secondary">Season #{index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSeason(index)}
                                                    className="btn btn-sm btn-outline-danger border-0 p-1"
                                                    title="Remove season"
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                </button>
                                            </div>

                                            <div className="mb-2">
                                                <label className="form-label small fw-semibold">Badge Text</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={season.badge || ''}
                                                    onChange={(e) => handleSeasonChange(index, 'badge', e.target.value)}
                                                    placeholder="e.g. Peak Season"
                                                />
                                            </div>

                                            <div className="mb-2">
                                                <label className="form-label small fw-semibold">Badge Color</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={season.badge_color || 'success'}
                                                    onChange={(e) => handleSeasonChange(index, 'badge_color', e.target.value)}
                                                >
                                                    <option value="success">Green (Success)</option>
                                                    <option value="warning">Orange (Warning)</option>
                                                    <option value="info">Blue (Info)</option>
                                                </select>
                                            </div>

                                            <div className="mb-2">
                                                <label className="form-label small fw-semibold">Title (Months)</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={season.title || ''}
                                                    onChange={(e) => handleSeasonChange(index, 'title', e.target.value)}
                                                    placeholder="e.g. October to March (Winter)"
                                                />
                                            </div>

                                            <div className="mb-0">
                                                <label className="form-label small fw-semibold">Description</label>
                                                <textarea
                                                    rows="3"
                                                    className="form-control form-control-sm"
                                                    value={season.description || ''}
                                                    onChange={(e) => handleSeasonChange(index, 'description', e.target.value)}
                                                    placeholder="Describe temperature, wildlife activity, and sightings..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: How to Reach Godkhali */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                    <i className="ri ri-route-line text-primary"></i>
                                    <span>How to Reach Godkhali Ferry Ghat</span>
                                </h5>
                                <small className="text-muted">Transit routes by road, train, and airport.</small>
                            </div>
                            <button type="button" onClick={addWay} className="btn btn-sm btn-outline-primary rounded-3">
                                <i className="ri ri-add-line me-1"></i> Add Route Option
                            </button>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                {(guide.ways_to_reach || []).map((way, index) => (
                                    <div className="col-md-4" key={index}>
                                        <div className="card border rounded-3 p-3 h-100 bg-light">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="badge bg-primary">Option #{index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeWay(index)}
                                                    className="btn btn-sm btn-outline-danger border-0 p-1"
                                                >
                                                    <i className="ri ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                            <div className="mb-2">
                                                <label className="form-label small fw-semibold">Heading</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={way.title || ''}
                                                    onChange={(e) => handleWayChange(index, 'title', e.target.value)}
                                                    placeholder="e.g. By Road from Kolkata"
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label small fw-semibold">Directions &amp; Distance</label>
                                                <textarea
                                                    rows="3"
                                                    className="form-control form-control-sm"
                                                    value={way.description || ''}
                                                    onChange={(e) => handleWayChange(index, 'description', e.target.value)}
                                                    placeholder="Distance, highway name, estimated travel time..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Forest Watchtowers */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                    <i className="ri ri-binoculars-line text-warning"></i>
                                    <span>Watchtowers &amp; Sighting Compounds</span>
                                </h5>
                                <small className="text-muted">Key forest observation posts visited during safaris.</small>
                            </div>
                            <button type="button" onClick={addWatchtower} className="btn btn-sm btn-outline-warning rounded-3">
                                <i className="ri ri-add-line me-1"></i> Add Watchtower
                            </button>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                {(guide.watchtowers || []).map((wt, index) => (
                                    <div className="col-md-6" key={index}>
                                        <div className="d-flex gap-2 align-items-center p-2 rounded-3 border bg-light">
                                            <div className="flex-grow-1">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm mb-1 fw-bold"
                                                    value={wt.name || ''}
                                                    onChange={(e) => handleWatchtowerChange(index, 'name', e.target.value)}
                                                    placeholder="Watchtower Name"
                                                />
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={wt.highlight || ''}
                                                    onChange={(e) => handleWatchtowerChange(index, 'highlight', e.target.value)}
                                                    placeholder="Highlight (e.g. Canopy walk, sweet-water hole)"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeWatchtower(index)}
                                                className="btn btn-sm btn-outline-danger border-0 p-2"
                                            >
                                                <i className="ri ri-delete-bin-line"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: Safari Rules & Do's / Don'ts */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                    <i className="ri ri-shield-check-line text-danger"></i>
                                    <span>Safari Regulations, Do's &amp; Don'ts</span>
                                </h5>
                                <small className="text-muted">Safety and eco-preservation rules enforced by Forest Department.</small>
                            </div>
                            <button type="button" onClick={addRule} className="btn btn-sm btn-outline-danger rounded-3">
                                <i className="ri ri-add-line me-1"></i> Add Rule
                            </button>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-2">
                                {(guide.safari_rules || []).map((rule, index) => (
                                    <div className="col-md-6" key={index}>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-white border-end-0">
                                                <i className="ri ri-checkbox-circle-line text-success"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={rule}
                                                onChange={(e) => handleRuleChange(index, e.target.value)}
                                                placeholder="Enter safety guideline or regulation..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeRule(index)}
                                                className="btn btn-outline-danger"
                                            >
                                                <i className="ri ri-close-line"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button Bar */}
                    <div className="card shadow-sm border-0 rounded-4 p-3 d-flex flex-row justify-content-end align-items-center gap-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-success px-4 py-2 rounded-3 fw-bold d-inline-flex align-items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                    <span>Saving Changes...</span>
                                </>
                            ) : (
                                <>
                                    <i className="ri ri-save-line"></i>
                                    <span>Save Safari Guide</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
