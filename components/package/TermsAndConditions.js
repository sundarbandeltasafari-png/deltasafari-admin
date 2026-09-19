'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { axiosGet, axiosPost } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import { 
  getDefaultPoliciesUrl, 
  saveDefaultPoliciesUrl, 
  getAllPackageUrl, 
  getParticularPackageUrl 
} from '@/app/routes/packageRoutes';

export default function TermsAndConditions({ policies = [], setPolicies }) {
  const token = useSelector((state) => state.adminAuth?.token);
  
  const [copyingDefault, setCopyingDefault] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [allPackages, setAllPackages] = useState([]);
  const [selectedCopyPackageId, setSelectedCopyPackageId] = useState('');
  const [copyingFromPackage, setCopyingFromPackage] = useState(false);

  // Manage Default Template Modal State
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [defaultTemplatePolicies, setDefaultTemplatePolicies] = useState([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Load available packages for "Copy from Package" dropdown
  useEffect(() => {
    if (!token) return;
    axiosGet(getAllPackageUrl, token)
      .then((res) => {
        if (res?.status && Array.isArray(res.packages)) {
          setAllPackages(res.packages);
        }
      })
      .catch((err) => {
        console.error("Error fetching packages for T&C copy:", err);
      });
  }, [token]);

  // --- LOCAL POLICY MANAGERS ---
  const handleAddNewSection = () => {
    const newSection = {
      id: Date.now(),
      title: '',
      bullets: ['']
    };
    setPolicies([...policies, newSection]);
  };

  const handleTitleChange = (id, newTitle) => {
    setPolicies(prev =>
      prev.map(p => (p.id === id ? { ...p, title: newTitle } : p))
    );
  };

  const handleDeleteSection = (id) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setPolicies(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleBulletChange = (sectionId, bulletIdx, value) => {
    setPolicies(prev =>
      prev.map(p => {
        if (p.id === sectionId) {
          const updatedBullets = [...p.bullets];
          updatedBullets[bulletIdx] = value;
          return { ...p, bullets: updatedBullets };
        }
        return p;
      })
    );
  };

  const handleAddBulletRow = (sectionId) => {
    setPolicies(prev =>
      prev.map(p => (p.id === sectionId ? { ...p, bullets: [...p.bullets, ''] } : p))
    );
  };

  const handleRemoveBulletRow = (sectionId, bulletIdx) => {
    setPolicies(prev =>
      prev.map(p => {
        if (p.id === sectionId) {
          return { ...p, bullets: p.bullets.filter((_, i) => i !== bulletIdx) };
        }
        return p;
      })
    );
  };

  // --- 1. COPY ADMIN DEFAULT TERMS & CONDITIONS ---
  const handleCopyDefault = async (mode = 'replace') => {
    setCopyingDefault(true);
    try {
      const res = await axiosGet(getDefaultPoliciesUrl, token);
      if (res?.status && Array.isArray(res.policies) && res.policies.length > 0) {
        const loaded = res.policies.map((p, idx) => ({
          id: Date.now() + idx,
          title: p.title || '',
          bullets: Array.isArray(p.bullets) ? [...p.bullets] : []
        }));

        if (mode === 'append' && policies.length > 0) {
          setPolicies([...policies, ...loaded]);
          showMessage(`Appended ${loaded.length} default policy section(s)!`, 'success');
        } else {
          setPolicies(loaded);
          showMessage(`Loaded ${loaded.length} default Terms & Conditions section(s)!`, 'success');
        }
      } else {
        showMessage('No default terms found. You can set them using "Save as Default"!', 'info');
      }
    } catch (err) {
      console.error(err);
      showMessage(err?.message || 'Failed to load default Terms & Conditions', 'error');
    } finally {
      setCopyingDefault(false);
    }
  };

  // --- 2. SAVE CURRENT AS ADMIN DEFAULT TERMS & CONDITIONS ---
  const handleSaveCurrentAsDefault = async () => {
    const validSections = policies.filter(
      p => p.title && p.title.trim().length > 0 && Array.isArray(p.bullets) && p.bullets.some(b => b && b.trim().length > 0)
    );

    if (validSections.length === 0) {
      showMessage('Please add at least one section with a title and bullet point before saving as default.', 'warning');
      return;
    }

    if (!confirm('Set these current Terms & Conditions as the global Admin Default? Future packages can load this default with one click.')) {
      return;
    }

    setSavingDefault(true);
    try {
      const res = await axiosPost(saveDefaultPoliciesUrl, { policies: validSections }, token);
      if (res?.status) {
        showMessage(res.msg || 'Default Terms & Conditions saved successfully!', 'success');
      } else {
        showMessage(res?.msg || 'Could not save default terms.', 'error');
      }
    } catch (err) {
      console.error(err);
      showMessage(err?.message || 'Failed to save default terms', 'error');
    } finally {
      setSavingDefault(false);
    }
  };

  // --- 3. COPY FROM AN EXISTING PACKAGE ---
  const handleCopyFromPackage = async () => {
    if (!selectedCopyPackageId) {
      showMessage('Please select a package to copy from.', 'info');
      return;
    }

    setCopyingFromPackage(true);
    try {
      const res = await axiosGet(`${getParticularPackageUrl}?id=${selectedCopyPackageId}`, token);
      if (res?.status && res.package?.policies) {
        let pkgPolicies = res.package.policies;
        if (typeof pkgPolicies === 'string') {
          try {
            pkgPolicies = JSON.parse(pkgPolicies);
          } catch (e) {
            pkgPolicies = [];
          }
        }

        if (Array.isArray(pkgPolicies) && pkgPolicies.length > 0) {
          const parsed = pkgPolicies.map((p, idx) => {
            let bullets = [];
            if (Array.isArray(p.bullets)) {
              bullets = p.bullets;
            } else if (typeof p.bullets === 'string') {
              try {
                bullets = JSON.parse(p.bullets);
              } catch (e) {
                bullets = [p.bullets];
              }
            }
            return {
              id: Date.now() + idx,
              title: p.title || '',
              bullets: Array.isArray(bullets) ? bullets : []
            };
          });

          setPolicies(parsed);
          showMessage(`Successfully copied ${parsed.length} Terms & Conditions section(s) from "${res.package.title}"!`, 'success');
        } else {
          showMessage('The selected package has no Terms & Conditions saved.', 'info');
        }
      } else {
        showMessage('Could not retrieve policies from the selected package.', 'error');
      }
    } catch (err) {
      console.error(err);
      showMessage(err?.message || 'Failed to copy from package', 'error');
    } finally {
      setCopyingFromPackage(false);
    }
  };

  // --- 4. MANAGE DEFAULT TEMPLATE MODAL HANDLERS ---
  const handleOpenManageModal = async () => {
    setManageModalOpen(true);
    setLoadingTemplate(true);
    try {
      const res = await axiosGet(getDefaultPoliciesUrl, token);
      if (res?.status && Array.isArray(res.policies)) {
        setDefaultTemplatePolicies(res.policies.map((p, i) => ({
          id: p.id || Date.now() + i,
          title: p.title || '',
          bullets: Array.isArray(p.bullets) ? [...p.bullets] : ['']
        })));
      } else {
        setDefaultTemplatePolicies([
          { id: 1, title: 'Booking Policy', bullets: ['A deposit of 50% is required to confirm booking.'] }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleSaveDefaultTemplate = async () => {
    const valid = defaultTemplatePolicies.filter(
      p => p.title && p.title.trim().length > 0 && Array.isArray(p.bullets) && p.bullets.some(b => b && b.trim().length > 0)
    );

    if (valid.length === 0) {
      showMessage('Please add at least one section with title and bullets.', 'warning');
      return;
    }

    setSavingTemplate(true);
    try {
      const res = await axiosPost(saveDefaultPoliciesUrl, { policies: valid }, token);
      if (res?.status) {
        showMessage('Admin Default Terms & Conditions template updated successfully!', 'success');
        setManageModalOpen(false);
      } else {
        showMessage(res?.msg || 'Failed to save template', 'error');
      }
    } catch (err) {
      showMessage(err?.message || 'Error saving template', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="container-fluid p-1">
      {/* Main Framework Wrapper Layout */}
      <div className="card shadow-sm border-0 rounded-3 p-4 bg-white">
        
        {/* Top Header with Engine Title and Actions */}
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 border-start border-primary border-4 ps-3 mb-4">
          <div>
            <h5 className="fw-bold mb-0 text-dark text-uppercase tracking-wide d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-ruled-fill text-primary"></i>
              Terms &amp; Conditions Engine
            </h5>
            <small className="text-muted">
              Configure policies, cancellation rules, and requirements for this package.
            </small>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* 1. Copy Default T&C Button */}
            <button
              type="button"
              onClick={() => handleCopyDefault('replace')}
              disabled={copyingDefault}
              className="btn btn-warning fw-semibold shadow-xs d-flex align-items-center text-dark"
              title="Replace current sections with the global Admin Default Terms & Conditions"
            >
              {copyingDefault ? (
                <span className="spinner-border spinner-border-sm me-1"></span>
              ) : (
                <i className="bi bi-clipboard2-check-fill me-1.5"></i>
              )}
              Copy Default T&amp;C
            </button>

            {/* 2. Save as Default Button */}
            <button
              type="button"
              onClick={handleSaveCurrentAsDefault}
              disabled={savingDefault || policies.length === 0}
              className="btn btn-outline-success fw-semibold shadow-xs d-flex align-items-center"
              title="Save current sections as the new Admin Default Terms & Conditions"
            >
              {savingDefault ? (
                <span className="spinner-border spinner-border-sm me-1"></span>
              ) : (
                <i className="bi bi-bookmark-check me-1.5"></i>
              )}
              Save as Default
            </button>

            {/* 3. Manage Default Template */}
            <button
              type="button"
              onClick={handleOpenManageModal}
              className="btn btn-outline-secondary fw-semibold shadow-xs d-flex align-items-center"
              title="View and edit the global default template"
            >
              <i className="bi bi-gear me-1.5"></i>
              Manage Default
            </button>

            {/* 4. Add New Section */}
            <button
              type="button"
              onClick={handleAddNewSection}
              className="btn btn-primary fw-semibold shadow-xs d-flex align-items-center"
            >
              <i className="bi bi-plus-circle me-1.5"></i>
              Create Section
            </button>
          </div>
        </div>

        {/* Quick Toolbar: Copy from Existing Package Option */}
        <div className="p-3 mb-4 rounded-3 border bg-light d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2.5">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 p-2 rounded-2">
              <i className="bi bi-box-seam fs-6"></i>
            </span>
            <div>
              <span className="fw-bold small text-dark d-block">Copy T&amp;C from Existing Package:</span>
              <small className="text-muted">Import all policies and conditions from an existing published tour</small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select
              value={selectedCopyPackageId}
              onChange={(e) => setSelectedCopyPackageId(e.target.value)}
              className="form-select form-select-sm bg-white"
              style={{ minWidth: '240px', maxWidth: '360px' }}
            >
              <option value="">-- Choose Package to Copy From --</option>
              {allPackages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.duration_nights || 1}N/{p.duration_days || 2}D)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCopyFromPackage}
              disabled={!selectedCopyPackageId || copyingFromPackage}
              className="btn btn-outline-primary btn-sm fw-semibold flex-shrink-0"
            >
              {copyingFromPackage ? (
                <span className="spinner-border spinner-border-sm me-1"></span>
              ) : (
                <i className="bi bi-copy me-1"></i>
              )}
              Copy
            </button>
          </div>
        </div>

        {/* Dynamic Mapping Over Policy Cards */}
        {policies.length === 0 ? (
          <div className="p-5 text-center bg-light rounded-4 border border-dashed my-2">
            <i className="bi bi-card-checklist display-5 text-muted mb-3 d-block"></i>
            <h6 className="fw-bold text-dark">No Terms &amp; Conditions Sections Added</h6>
            <p className="text-muted small mb-3">
              Get started quickly by copying your Admin Default Terms &amp; Conditions or creating a new section.
            </p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleCopyDefault('replace')}
                className="btn btn-warning btn-sm fw-semibold text-dark shadow-xs"
              >
                <i className="bi bi-clipboard2-check-fill me-1"></i>
                Load Admin Default T&amp;C
              </button>
              <button
                type="button"
                onClick={handleAddNewSection}
                className="btn btn-primary btn-sm fw-semibold shadow-xs"
              >
                + Create First Section
              </button>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3.5">
            {policies.map((section, secIdx) => (
              <div key={section.id} className="card border rounded-3 overflow-hidden shadow-xs">
                {/* Dynamic Header: Section Title Input */}
                <div
                  className="card-header d-flex justify-content-between align-items-center border-bottom py-2.5 px-3"
                  style={{ backgroundColor: '#f0f7ff' }}
                >
                  <div className="d-flex align-items-center gap-2 flex-grow-1 me-3">
                    <span className="badge bg-primary text-white rounded-pill px-2 py-0.5" style={{ fontSize: '0.75rem' }}>
                      Section {secIdx + 1}
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold border-0 bg-transparent p-0 text-dark shadow-none"
                      style={{ fontSize: '0.95rem' }}
                      value={section.title}
                      onChange={(e) => handleTitleChange(section.id, e.target.value)}
                      placeholder="e.g. Booking & Payment Policy, Cancellation Rules, Child Guidelines..."
                    />
                  </div>

                  {/* Delete Section Button */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger border-0 py-1 px-2.5 fw-semibold"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => handleDeleteSection(section.id)}
                    title="Delete this Section"
                  >
                    <i className="bi bi-trash3 me-1"></i>Delete
                  </button>
                </div>

                {/* Editable Bullet Points */}
                <div className="card-body bg-white p-3">
                  <div className="d-flex flex-column gap-2">
                    {section.bullets.map((bullet, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-2">
                        <span className="text-primary fw-bold ps-1">•</span>
                        <input
                          type="text"
                          className="form-control form-control-sm border rounded px-2.5 py-1.5 text-dark shadow-none"
                          style={{ backgroundColor: '#fafafa' }}
                          value={bullet}
                          placeholder="Type specific policy or term condition here..."
                          onChange={(e) => handleBulletChange(section.id, idx, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBulletRow(section.id, idx)}
                          className="btn btn-sm btn-link text-danger p-1 text-decoration-none fw-bold"
                          title="Remove this bullet line"
                        >
                          <i className="bi bi-x-circle fs-6"></i>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Bullet Button */}
                  <div className="mt-2.5 pt-2 border-top border-light d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      onClick={() => handleAddBulletRow(section.id)}
                      className="btn btn-xs btn-light text-primary fw-semibold border rounded-pill px-3 py-1"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <i className="bi bi-plus me-1"></i>Add Bullet Point
                    </button>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {section.bullets.filter(b => b && b.trim()).length} point(s)
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: MANAGE GLOBAL DEFAULT TERMS & CONDITIONS */}
      {manageModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div className="p-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-light">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                  <i className="bi bi-sliders fs-5"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold text-dark">Admin Default Terms &amp; Conditions</h5>
                  <small className="text-muted">Edit the master template available across all packages</small>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setManageModalOpen(false)}
              ></button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-auto flex-grow-1" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {loadingTemplate ? (
                <div className="p-5 text-center">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2 text-muted small">Loading default template...</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  <p className="text-muted small mb-2">
                    These sections and bullets will be stored as your Admin Default template. Whenever you or your team click <strong>"Copy Default T&amp;C"</strong> in package creation, these exact conditions will be populated.
                  </p>

                  {defaultTemplatePolicies.map((section, sIdx) => (
                    <div key={section.id} className="border rounded-3 p-3 bg-white shadow-2xs">
                      <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                        <div className="d-flex align-items-center gap-2 flex-grow-1 me-2">
                          <span className="badge bg-secondary text-white rounded-pill px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                            #{sIdx + 1}
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm fw-bold border-0 bg-light px-2"
                            value={section.title}
                            placeholder="Section Title..."
                            onChange={(e) => {
                              const val = e.target.value;
                              setDefaultTemplatePolicies(prev =>
                                prev.map(p => p.id === section.id ? { ...p, title: val } : p)
                              );
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-danger border-0"
                          onClick={() => {
                            if (confirm('Remove this section from default template?')) {
                              setDefaultTemplatePolicies(prev => prev.filter(p => p.id !== section.id));
                            }
                          }}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>

                      <div className="d-flex flex-column gap-1.5">
                        {section.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="d-flex align-items-center gap-1.5">
                            <span className="text-muted small">•</span>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={bullet}
                              placeholder="Condition bullet point..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setDefaultTemplatePolicies(prev =>
                                  prev.map(p => {
                                    if (p.id === section.id) {
                                      const updated = [...p.bullets];
                                      updated[bIdx] = val;
                                      return { ...p, bullets: updated };
                                    }
                                    return p;
                                  })
                                );
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-link text-danger p-0 px-1 text-decoration-none"
                              onClick={() => {
                                setDefaultTemplatePolicies(prev =>
                                  prev.map(p => {
                                    if (p.id === section.id) {
                                      return { ...p, bullets: p.bullets.filter((_, i) => i !== bIdx) };
                                    }
                                    return p;
                                  })
                                );
                              }}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="btn btn-xs btn-light text-primary border rounded-pill mt-2 px-2.5 py-0.5"
                        onClick={() => {
                          setDefaultTemplatePolicies(prev =>
                            prev.map(p => p.id === section.id ? { ...p, bullets: [...p.bullets, ''] } : p)
                          );
                        }}
                      >
                        + Add Bullet
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm rounded-pill fw-semibold mt-2 align-self-start"
                    onClick={() => {
                      setDefaultTemplatePolicies(prev => [
                        ...prev,
                        { id: Date.now(), title: '', bullets: [''] }
                      ]);
                    }}
                  >
                    + Add New Template Section
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-4 border-top d-flex justify-content-between align-items-center bg-light">
              <button
                type="button"
                className="btn btn-light border rounded-pill px-4"
                onClick={() => setManageModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4 fw-bold"
                onClick={handleSaveDefaultTemplate}
                disabled={savingTemplate}
              >
                {savingTemplate ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1.5"></span> Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1.5"></i> Save Master Default Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}