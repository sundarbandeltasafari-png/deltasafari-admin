'use client';

import React, { useState } from 'react';

export default function TermsAndConditions({policies, setPolicies}) {
    // Create an entirely new card section
    const handleAddNewSection = () => {
        const newSection = {
            id: Date.now(), // Unique ID using timestamp
            title: '',
            bullets: []
        };
        setPolicies([...policies, newSection]);
    };

    // Change the title text of a section
    const handleTitleChange = (id, newTitle) => {
        setPolicies(prev =>
            prev.map(p => (p.id === id ? { ...p, title: newTitle } : p))
        );
    };

    // Delete an entire section card
    const handleDeleteSection = (id) => {
        if (confirm('Are you sure you want to delete this entire section?')) {
            setPolicies(prev => prev.filter(p => p.id !== id));
        }
    };


    // --- BULLET ROW MANAGERS ---

    // Change the text value of a specific bullet point line
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

    // Add an empty text row inside a specific section
    const handleAddBulletRow = (sectionId) => {
        setPolicies(prev =>
            prev.map(p => (p.id === sectionId ? { ...p, bullets: [...p.bullets, ''] } : p))
        );
    };

    // Delete an individual bullet row
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

    const handleSaveData = () => {
        console.log('Sending final structural payload to DB:', policies);
        alert('Changes saved successfully! Check your console.');
    };

    return (
        <div className="container-fluid p-1">

            {/* Main Framework Wrapper Layout */}
            <div className="card shadow-sm border-0 rounded-3 p-4 bg-white">
                <div className="border-start border-primary border-4 ps-3 mb-4 d-flex justify-content-between">
                    <h5 className="fw-bold mb-0 text-dark text-uppercase tracking-wide">Term & Condition Engine</h5>
                    <button type="button" onClick={handleAddNewSection} className="btn btn-outline-primary fw-semibold shadow-sm" >
                        + Create New Section
                    </button>
                </div>

                {/* Dynamic Mapping Over Cards */}
                <div className="d-flex flex-column gap-4">
                    {policies.map((section) => (
                        <div key={section.id} className="card border-secondary-subtle rounded-3 overflow-hidden shadow-sm">

                            {/* Dynamic Header: Title is now an editable Input element */}
                            <div
                                className="card-header d-flex justify-content-between align-items-center border-0 py-2 px-3"
                                style={{ backgroundColor: '#d1ecf1' }}
                            >
                                <input
                                    type="text"
                                    className="form-control form-control-sm fw-bold border-0 bg-transparent p-0 text-dark shadow-none"
                                    style={{ fontSize: '0.95rem', maxWidth: '70%' }}
                                    value={section.title}
                                    onChange={(e) => handleTitleChange(section.id, e.target.value)}
                                    placeholder="Enter Section Title Here..."
                                />

                                {/* Delete Entire Block Section button */}
                                <button type="button"

                                    className="btn btn-sm btn-outline-danger border-0 py-0 px-2 fw-semibold"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => handleDeleteSection(section.id)}
                                    title="Delete Section Card"
                                >
                                    Delete Section
                                </button>
                            </div>

                            {/* Editable Bullet Points Row Structure */}
                            <div className="card-body bg-white p-3">
                                <div className="d-flex flex-column gap-2">
                                    {section.bullets.map((bullet, idx) => (
                                        <div key={idx} className="d-flex align-items-center gap-2">
                                            <span className="text-muted fs-5 ps-1">•</span>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-0 border-bottom rounded-0 px-1 py-1 text-dark shadow-none"
                                                style={{ backgroundColor: 'transparent' }}
                                                value={bullet}
                                                placeholder="Add specific terms data line..."
                                                onChange={(e) => handleBulletChange(section.id, idx, e.target.value)}
                                            />
                                            {/* Delete Individual Row Line button */}
                                            <button type="button"

                                                onClick={() => handleRemoveBulletRow(section.id, idx)}
                                                className="btn btn-sm btn-link text-danger p-0 m-0 text-decoration-none fw-bold"
                                                title="Remove point row"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Controls within Card: Add row line items */}
                                <div className="mt-2 pt-2 border-top border-light">
                                    <button type="button"

                                        onClick={() => handleAddBulletRow(section.id)}
                                        className="btn btn-sm btn-light text-success fw-semibold p-1 px-2 rounded-2"
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        + Add New Bullet Row
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}