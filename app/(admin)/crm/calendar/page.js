'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { 
    getPeakDatesUrl, 
    createPeakDateUrl, 
    updatePeakDateUrl, 
    deletePeakDateUrl 
} from '@/app/routes/whatsappRoutes';
import { getIndianHoliday, getIndianHolidaysForMonth, INDIAN_HOLIDAYS_DATA } from '@/libs/indianHolidays';
import { axiosGet, axiosPost, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';

export default function PeakCalendarPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);
    const isSuperAdmin = user?.admin === 1;

    // Current Calendar Navigation State (Default to current date)
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed (0 = Jan, 11 = Dec)
    const [viewMode, setViewMode] = useState('grid'); // 'grid' (Google Calendar Month) or 'list' (Upcoming Schedule)

    // Peak Dates Data
    const [loading, setLoading] = useState(true);
    const [peakDates, setPeakDates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Selected Day View / Modal State
    const [selectedDateStr, setSelectedDateStr] = useState(null);
    const [dayDetailModalOpen, setDayDetailModalOpen] = useState(false);

    // Add / Edit Peak Date Modal State
    const [peakModalOpen, setPeakModalOpen] = useState(false);
    const [editingPeakId, setEditingPeakId] = useState(null);
    const [submittingPeak, setSubmittingPeak] = useState(false);
    const [peakFormData, setPeakFormData] = useState({
        title: '',
        start_date: '',
        end_date: '',
        peak_type: 'peak',
        surge_percentage: 0,
        color: '#dc2626',
        notes: ''
    });

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    // Fetch Peak Dates from Backend
    const fetchPeakDates = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Fetch dates for current year window
            const startYearStr = `${currentYear - 1}-01-01`;
            const endYearStr = `${currentYear + 1}-12-31`;
            const res = await axiosGet(`${getPeakDatesUrl}?start_date=${startYearStr}&end_date=${endYearStr}`, token);

            if (res?.status && Array.isArray(res.data)) {
                setPeakDates(res.data);
            } else {
                setPeakDates([]);
            }
        } catch (err) {
            console.error("Error fetching peak dates:", err);
            setPeakDates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchPeakDates();
        }
    }, [token, currentYear]);

    // Navigate to Prev / Next / Today
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const handleGoToday = () => {
        const now = new Date();
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
    };

    // Calculate Calendar Days for Google Calendar Grid
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
        const totalDaysInMonth = lastDayOfMonth.getDate();

        const days = [];

        // Previous month padding days
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const d = prevMonthLastDay - i;
            const prevMonthDate = new Date(currentYear, currentMonth - 1, d);
            const dateStr = prevMonthDate.toISOString().split('T')[0];
            days.push({
                date: prevMonthDate,
                dayNumber: d,
                dateStr,
                isCurrentMonth: false,
                isToday: false
            });
        }

        // Current month days
        const todayStr = new Date().toISOString().split('T')[0];
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const dateObj = new Date(currentYear, currentMonth, day);
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({
                date: dateObj,
                dayNumber: day,
                dateStr,
                isCurrentMonth: true,
                isToday: dateStr === todayStr
            });
        }

        // Next month padding days to complete 35 or 42 grid cells
        const remainingCells = (7 - (days.length % 7)) % 7;
        for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
            const nextMonthDate = new Date(currentYear, currentMonth + 1, nextDay);
            const dateStr = nextMonthDate.toISOString().split('T')[0];
            days.push({
                date: nextMonthDate,
                dayNumber: nextDay,
                dateStr,
                isCurrentMonth: false,
                isToday: false
            });
        }

        return days;
    }, [currentYear, currentMonth]);

    // Check if a date string has peak dates
    const getPeakDatesForDate = (dateStr) => {
        if (!dateStr || !Array.isArray(peakDates)) return [];
        return peakDates.filter(p => {
            return dateStr >= p.start_date && dateStr <= p.end_date;
        });
    };

    // Open Day Detail Modal
    const handleDayClick = (dateStr) => {
        setSelectedDateStr(dateStr);
        setDayDetailModalOpen(true);
    };

    // Open Add Peak Date Modal
    const handleOpenAddPeakModal = (initialDate = '') => {
        const defaultDate = initialDate || selectedDateStr || new Date().toISOString().split('T')[0];
        setEditingPeakId(null);
        setPeakFormData({
            title: '',
            start_date: defaultDate,
            end_date: defaultDate,
            peak_type: 'peak',
            surge_percentage: 20,
            color: '#dc2626',
            notes: ''
        });
        setPeakModalOpen(true);
    };

    // Open Edit Peak Date Modal
    const handleOpenEditPeakModal = (peakItem) => {
        setEditingPeakId(peakItem.id);
        setPeakFormData({
            title: peakItem.title || '',
            start_date: peakItem.start_date || '',
            end_date: peakItem.end_date || peakItem.start_date || '',
            peak_type: peakItem.peak_type || 'peak',
            surge_percentage: peakItem.surge_percentage || 0,
            color: peakItem.color || '#dc2626',
            notes: peakItem.notes || ''
        });
        setPeakModalOpen(true);
    };

    // Submit Add / Edit Peak Date
    const handleSavePeakDate = async (e) => {
        e.preventDefault();
        if (!peakFormData.title.trim()) {
            showMessage('error', 'Please enter peak date title.');
            return;
        }
        if (!peakFormData.start_date) {
            showMessage('error', 'Please select start date.');
            return;
        }
        if (peakFormData.end_date && peakFormData.start_date && peakFormData.end_date < peakFormData.start_date) {
            showMessage('error', 'End date cannot be earlier than start date.');
            return;
        }

        setSubmittingPeak(true);
        try {
            let res;
            if (editingPeakId) {
                res = await axiosPost(`${updatePeakDateUrl}${editingPeakId}`, peakFormData, token);
            } else {
                res = await axiosPost(createPeakDateUrl, peakFormData, token);
            }

            if (res?.status) {
                showMessage('success', res?.msg || 'Peak date saved successfully!');
                setPeakModalOpen(false);
                fetchPeakDates();
            } else {
                showMessage('error', res?.msg || 'Failed to save peak date.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error saving peak date.');
        } finally {
            setSubmittingPeak(false);
        }
    };

    // Delete Peak Date
    const handleDeletePeakDate = async (peakId) => {
        if (!window.confirm("Are you sure you want to remove this peak date mark?")) {
            return;
        }

        try {
            const res = await axiosDelete(`${deletePeakDateUrl}${peakId}`, token);
            if (res?.status) {
                showMessage('success', 'Peak date mark removed successfully.');
                setPeakDates(prev => prev.filter(p => p.id !== peakId));
                if (dayDetailModalOpen) {
                    setDayDetailModalOpen(false);
                }
            } else {
                showMessage('error', res?.msg || 'Failed to delete peak date.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error deleting peak date.');
        }
    };

    // Current Month Holidays Summary
    const monthHolidays = useMemo(() => {
        return getIndianHolidaysForMonth(currentYear, currentMonth);
    }, [currentYear, currentMonth]);

    // Current Month Peak Dates Summary
    const monthPeaks = useMemo(() => {
        const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        return peakDates.filter(p => {
            return (p.start_date && p.start_date.startsWith(monthPrefix)) || (p.end_date && p.end_date.startsWith(monthPrefix));
        });
    }, [peakDates, currentYear, currentMonth]);

    const formatFullDate = (dStr) => {
        if (!dStr) return '';
        try {
            const d = new Date(dStr);
            return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            return dStr;
        }
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* 1. Header Banner */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-calendar-event-fill text-danger fs-3"></i>
                        <span>Safari Peak Dates &amp; Indian Holiday Calendar</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Interactive Google Calendar view marking all Indian public holidays, festival rush periods, and peak safari booking dates.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        type="button"
                        onClick={() => handleOpenAddPeakModal()}
                        className="btn btn-danger rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
                        style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                    >
                        <i className="ri ri-fire-fill"></i>
                        <span>+ Mark Peak Dates</span>
                    </button>
                    <Link href="/crm/followups" className="btn btn-outline-primary rounded-pill px-3 d-inline-flex align-items-center gap-1.5 shadow-xs">
                        <i className="ri ri-calendar-check-line"></i>
                        <span>Lead Follow-ups</span>
                    </Link>
                </div>
            </div>

            {/* 2. Google Calendar Control Navigation Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3.5">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        {/* Left: Month Navigators & Title */}
                        <div className="d-flex align-items-center gap-3 flex-wrap">
                            <button 
                                type="button" 
                                onClick={handleGoToday}
                                className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold"
                            >
                                Today
                            </button>

                            <div className="btn-group shadow-xs rounded-pill" role="group">
                                <button 
                                    type="button" 
                                    onClick={handlePrevMonth}
                                    className="btn btn-light btn-sm px-3 rounded-start-pill border"
                                    title="Previous Month"
                                >
                                    <i className="ri ri-arrow-left-s-line fs-5"></i>
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleNextMonth}
                                    className="btn btn-light btn-sm px-3 rounded-end-pill border"
                                    title="Next Month"
                                >
                                    <i className="ri ri-arrow-right-s-line fs-5"></i>
                                </button>
                            </div>

                            <h3 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '1.4rem' }}>
                                <span>{monthNames[currentMonth]} {currentYear}</span>
                            </h3>
                        </div>

                        {/* Middle: Month & Year Fast Jump Dropdowns */}
                        <div className="d-flex align-items-center gap-2">
                            <select
                                className="form-select form-select-sm rounded-pill bg-light"
                                value={currentMonth}
                                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                                style={{ width: '130px' }}
                            >
                                {monthNames.map((name, idx) => (
                                    <option key={idx} value={idx}>{name}</option>
                                ))}
                            </select>

                            <select
                                className="form-select form-select-sm rounded-pill bg-light"
                                value={currentYear}
                                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                                style={{ width: '100px' }}
                            >
                                {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                                    <option key={yr} value={yr}>{yr}</option>
                                ))}
                            </select>
                        </div>

                        {/* Right: Legend & View Switcher */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {/* View Switcher */}
                            <div className="btn-group p-1 bg-light rounded-pill border" role="group">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`btn btn-sm rounded-pill px-3 py-1 ${viewMode === 'grid' ? 'btn-primary text-white shadow-xs' : 'btn-transparent text-muted'}`}
                                >
                                    <i className="ri ri-grid-fill me-1"></i> Month
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`btn btn-sm rounded-pill px-3 py-1 ${viewMode === 'list' ? 'btn-primary text-white shadow-xs' : 'btn-transparent text-muted'}`}
                                >
                                    <i className="ri ri-list-check-2 me-1"></i> Schedule List
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Color Legend Bar */}
                    <div className="d-flex align-items-center gap-3 mt-3 pt-3 border-top flex-wrap text-muted small">
                        <span className="fw-semibold text-dark">Legend:</span>
                        <span className="d-inline-flex align-items-center gap-1.5">
                            <span className="badge rounded-circle p-1" style={{ backgroundColor: '#dc2626', width: '10px', height: '10px' }}></span>
                            <span className="text-danger fw-semibold">🔥 Safari Peak Season / Surge (+20% - 50%)</span>
                        </span>
                        <span className="d-inline-flex align-items-center gap-1.5">
                            <span className="badge rounded-circle p-1" style={{ backgroundColor: '#16a34a', width: '10px', height: '10px' }}></span>
                            <span className="text-success fw-semibold">🇮🇳 Indian National &amp; Gazetted Holidays</span>
                        </span>
                        <span className="d-inline-flex align-items-center gap-1.5">
                            <span className="badge rounded-circle p-1" style={{ backgroundColor: '#f59e0b', width: '10px', height: '10px' }}></span>
                            <span className="text-warning fw-semibold">🪔 Major Festivals (Durga Puja, Diwali, Holi)</span>
                        </span>
                        <span className="d-inline-flex align-items-center gap-1.5 ms-auto">
                            <i className="ri ri-cursor-line text-primary"></i>
                            <span>Click on any date to view details or mark peak season</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. GOOGLE CALENDAR MONTH GRID VIEW */}
            {viewMode === 'grid' && (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    {/* Day Headers (Sun - Sat) */}
                    <div className="row g-0 border-bottom bg-light text-center py-2 fw-bold text-muted" style={{ fontSize: '12.5px' }}>
                        {dayNames.map((dName, idx) => (
                            <div key={idx} className={`col ${idx === 0 || idx === 6 ? 'text-danger' : ''}`} style={{ flex: '1 0 14.28%' }}>
                                {dName}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days Matrix (7x5 or 7x6) */}
                    <div className="d-flex flex-wrap" style={{ minHeight: '680px' }}>
                        {calendarDays.map((cell, idx) => {
                            const holiday = getIndianHoliday(cell.dateStr);
                            const peaks = getPeakDatesForDate(cell.dateStr);
                            const isPeakDay = peaks.length > 0;

                            // Cell Background Styling
                            let cellBg = cell.isCurrentMonth ? '#ffffff' : '#f8fafc';
                            if (isPeakDay) {
                                cellBg = 'rgba(239, 68, 68, 0.06)';
                            }

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(cell.dateStr)}
                                    className={`p-2 border-bottom border-end position-relative transition-all d-flex flex-column justify-content-between`}
                                    style={{
                                        flex: '1 0 14.28%',
                                        maxWidth: '14.28%',
                                        minHeight: '115px',
                                        backgroundColor: cellBg,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isPeakDay ? 'rgba(239, 68, 68, 0.12)' : '#f1f5f9'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = cellBg; }}
                                >
                                    {/* Top Row: Date Number & Peak Flame Badge */}
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        {/* Date Number Badge */}
                                        <span
                                            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                                                cell.isToday 
                                                    ? 'bg-primary text-white shadow-xs' 
                                                    : cell.isCurrentMonth 
                                                        ? 'text-dark' 
                                                        : 'text-muted opacity-50'
                                            }`}
                                            style={{ 
                                                width: '26px', 
                                                height: '26px', 
                                                fontSize: '12.5px',
                                                backgroundColor: cell.isToday ? '#0066cc' : 'transparent'
                                            }}
                                        >
                                            {cell.dayNumber}
                                        </span>

                                        {/* Peak Marker Icon */}
                                        {isPeakDay && (
                                            <span 
                                                className="badge bg-danger text-white rounded-pill px-1.5 py-0.5 d-inline-flex align-items-center gap-0.5 shadow-xs" 
                                                style={{ fontSize: '10px', backgroundColor: peaks[0]?.color || '#dc2626' }}
                                                title={`Peak Date: ${peaks[0]?.title}`}
                                            >
                                                <i className="ri ri-fire-fill"></i>
                                                {peaks[0]?.surge_percentage > 0 && <span>+{peaks[0]?.surge_percentage}%</span>}
                                            </span>
                                        )}
                                    </div>

                                    {/* Middle Event Pills (Indian Holidays & Peak Dates) */}
                                    <div className="d-flex flex-column gap-1 overflow-hidden" style={{ maxHeight: '72px' }}>
                                        {/* 1. Indian Holiday Badge */}
                                        {holiday && (
                                            <div
                                                className="px-1.5 py-0.5 rounded-1 text-truncate fw-semibold text-white d-flex align-items-center gap-1 shadow-2xs"
                                                style={{
                                                    backgroundColor: holiday.color || '#16a34a',
                                                    fontSize: '10.5px',
                                                    lineHeight: '1.2'
                                                }}
                                                title={`🇮🇳 ${holiday.name} (${holiday.type})`}
                                            >
                                                <span className="text-truncate">{holiday.name}</span>
                                            </div>
                                        )}

                                        {/* 2. Peak Safari Dates Badges */}
                                        {peaks.map((p) => (
                                            <div
                                                key={p.id}
                                                className="px-1.5 py-0.5 rounded-1 text-truncate fw-bold text-white d-flex align-items-center gap-1 shadow-2xs"
                                                style={{
                                                    backgroundColor: p.color || '#dc2626',
                                                    fontSize: '10.5px',
                                                    lineHeight: '1.2'
                                                }}
                                                title={`🔥 Peak: ${p.title} (${p.surge_percentage}% surge)`}
                                            >
                                                <i className="ri ri-fire-fill flex-shrink-0" style={{ fontSize: '9px' }}></i>
                                                <span className="text-truncate">{p.title}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom Hint */}
                                    <div className="text-end opacity-0 hover-show">
                                        <small className="text-muted" style={{ fontSize: '9px' }}>+ Add</small>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 4. SCHEDULE / LIST VIEW */}
            {viewMode === 'list' && (
                <div className="row g-4 mb-4">
                    {/* Left Column: Peak Safari Dates List */}
                    <div className="col-12 col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                            <div className="card-header bg-danger bg-opacity-10 border-bottom py-3 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold text-danger d-flex align-items-center gap-2">
                                    <i className="ri ri-fire-fill"></i>
                                    <span>Configured Safari Peak Dates ({peakDates.length})</span>
                                </h5>
                                <button 
                                    type="button" 
                                    onClick={() => handleOpenAddPeakModal()}
                                    className="btn btn-sm btn-danger rounded-pill px-3 shadow-xs"
                                >
                                    + Add Peak
                                </button>
                            </div>

                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="p-4 text-center">
                                        <LoadingComponent />
                                    </div>
                                ) : peakDates.length === 0 ? (
                                    <div className="p-4 text-center text-muted">
                                        <p className="mb-2">No peak safari dates configured yet.</p>
                                        <button 
                                            type="button" 
                                            onClick={() => handleOpenAddPeakModal()}
                                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                        >
                                            Mark first peak date
                                        </button>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {peakDates.map((peak) => (
                                            <div key={peak.id} className="list-group-item p-3 border-bottom d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <span 
                                                            className="badge text-white rounded-pill px-2.5 py-0.5 fw-bold"
                                                            style={{ backgroundColor: peak.color || '#dc2626' }}
                                                        >
                                                            🔥 {peak.title}
                                                        </span>
                                                        {peak.surge_percentage > 0 && (
                                                            <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2 py-0.5 small">
                                                                +{peak.surge_percentage}% Surge
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="small text-muted d-flex align-items-center gap-2">
                                                        <i className="ri ri-calendar-line text-secondary"></i>
                                                        <span>{formatFullDate(peak.start_date)} {peak.start_date !== peak.end_date && `to ${formatFullDate(peak.end_date)}`}</span>
                                                    </div>
                                                    {peak.notes && (
                                                        <small className="text-muted d-block mt-1 fst-italic">
                                                            "{peak.notes}"
                                                        </small>
                                                    )}
                                                </div>

                                                <div className="d-flex align-items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditPeakModal(peak)}
                                                        className="btn btn-sm btn-outline-secondary rounded-circle p-1.5"
                                                        title="Edit Peak Date"
                                                        style={{ width: '32px', height: '32px' }}
                                                    >
                                                        <i className="ri ri-pencil-line"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePeakDate(peak.id)}
                                                        className="btn btn-sm btn-outline-danger rounded-circle p-1.5"
                                                        title="Delete Peak Date"
                                                        style={{ width: '32px', height: '32px' }}
                                                    >
                                                        <i className="ri ri-delete-bin-line"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Indian Holidays in Current Month & Year */}
                    <div className="col-12 col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                            <div className="card-header bg-success bg-opacity-10 border-bottom py-3 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold text-success d-flex align-items-center gap-2">
                                    <i className="ri ri-flag-fill"></i>
                                    <span>Indian Holidays in {monthNames[currentMonth]} {currentYear}</span>
                                </h5>
                                <span className="badge bg-success rounded-pill text-white px-2.5 py-1">
                                    {monthHolidays.length} Holidays
                                </span>
                            </div>

                            <div className="card-body p-0">
                                {monthHolidays.length === 0 ? (
                                    <div className="p-4 text-center text-muted">
                                        <p className="mb-0">No public holidays in this month.</p>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {monthHolidays.map((h, idx) => (
                                            <div key={idx} className="list-group-item p-3 border-bottom d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span 
                                                        className="badge text-white rounded-pill px-2.5 py-1 fw-bold d-inline-block mb-1"
                                                        style={{ backgroundColor: h.color || '#16a34a' }}
                                                    >
                                                        {h.name}
                                                    </span>
                                                    <div className="small text-muted">
                                                        <i className="ri ri-calendar-check-line text-success me-1"></i>
                                                        <strong>{formatFullDate(h.date)}</strong>
                                                    </div>
                                                </div>
                                                <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 small text-uppercase">
                                                    {h.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. DAY DETAIL & EVENT MODAL (When clicking any calendar cell) */}
            {dayDetailModalOpen && selectedDateStr && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-md">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-calendar-check-fill text-primary"></i>
                                        <span>{formatFullDate(selectedDateStr)}</span>
                                    </h5>
                                    <small className="text-muted font-monospace">{selectedDateStr}</small>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setDayDetailModalOpen(false)} aria-label="Close"></button>
                            </div>

                            <div className="modal-body p-4">
                                {/* Indian Holiday Info */}
                                {getIndianHoliday(selectedDateStr) ? (
                                    <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 p-3 mb-3 border-0 shadow-2xs" style={{ backgroundColor: '#ecfdf5' }}>
                                        <i className="ri ri-flag-fill fs-4 text-success"></i>
                                        <div>
                                            <strong className="d-block text-success">
                                                🇮🇳 {getIndianHoliday(selectedDateStr)?.name}
                                            </strong>
                                            <span className="small text-muted">
                                                Official Indian {getIndianHoliday(selectedDateStr)?.type} Holiday / Festival.
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2.5 bg-light rounded-3 mb-3 small text-muted d-flex align-items-center gap-2">
                                        <i className="ri ri-information-line text-secondary"></i>
                                        <span>No public Indian holiday on this date.</span>
                                    </div>
                                )}

                                {/* Peak Safari Status on this date */}
                                <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1.5">
                                    <i className="ri ri-fire-fill text-danger"></i>
                                    <span>Peak Safari Status</span>
                                </h6>

                                {getPeakDatesForDate(selectedDateStr).length === 0 ? (
                                    <div className="p-3 bg-light rounded-3 text-center mb-3">
                                        <p className="text-muted small mb-2">This date is currently marked as Regular Standard Season.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDayDetailModalOpen(false);
                                                handleOpenAddPeakModal(selectedDateStr);
                                            }}
                                            className="btn btn-sm btn-danger rounded-pill px-3 shadow-xs"
                                        >
                                            <i className="ri ri-fire-fill me-1"></i> Mark as Peak Date
                                        </button>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-2 mb-3">
                                        {getPeakDatesForDate(selectedDateStr).map((p) => (
                                            <div key={p.id} className="card border p-3 rounded-3 shadow-2xs" style={{ borderLeft: `4px solid ${p.color || '#dc2626'}` }}>
                                                <div className="d-flex justify-content-between align-items-start mb-1">
                                                    <div>
                                                        <strong className="text-dark fs-6 d-block">🔥 {p.title}</strong>
                                                        <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2 py-0.5 small mt-0.5">
                                                            {p.peak_type?.toUpperCase()} {p.surge_percentage > 0 && `(+${p.surge_percentage}% Surge)`}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDayDetailModalOpen(false);
                                                                handleOpenEditPeakModal(p);
                                                            }}
                                                            className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-1"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeletePeakDate(p.id)}
                                                            className="btn btn-xs btn-outline-danger rounded-pill px-2 py-1"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                {p.notes && (
                                                    <small className="text-muted mt-1 d-block">
                                                        Note: {p.notes}
                                                    </small>
                                                )}
                                                <small className="text-muted font-monospace mt-1 d-block" style={{ fontSize: '11px' }}>
                                                    Span: {p.start_date} to {p.end_date}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between">
                                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4" onClick={() => setDayDetailModalOpen(false)}>
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setDayDetailModalOpen(false);
                                        handleOpenAddPeakModal(selectedDateStr);
                                    }}
                                    className="btn btn-danger btn-sm rounded-pill px-3 shadow-xs"
                                >
                                    + Add Another Peak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. ADD / EDIT PEAK DATE MODAL */}
            {peakModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-danger text-white py-3 px-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#dc2626' }}>
                                <div>
                                    <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                        <i className="ri ri-fire-fill"></i>
                                        <span>{editingPeakId ? 'Edit Safari Peak Date' : 'Mark Safari Peak Date / Season'}</span>
                                    </h5>
                                    <small className="text-white-50">
                                        Define high-demand peak dates, festival surges, or sold-out periods across the calendar.
                                    </small>
                                </div>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setPeakModalOpen(false)} aria-label="Close"></button>
                            </div>

                            <form onSubmit={handleSavePeakDate}>
                                <div className="modal-body p-4">
                                    {/* 1. Peak Title */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-dark">
                                            Peak Date Label / Title <span className="text-danger">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-control rounded-3"
                                            placeholder="e.g. Durga Puja Rush, Christmas & New Year Peak, Tiger Safari Season"
                                            value={peakFormData.title}
                                            onChange={(e) => setPeakFormData({ ...peakFormData, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {/* 2. Date Range (Start & End Date) */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold text-dark">
                                                Start Date <span className="text-danger">*</span>
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control rounded-3"
                                                value={peakFormData.start_date}
                                                onChange={(e) => {
                                                    const newStart = e.target.value;
                                                    if (peakFormData.end_date && peakFormData.end_date < newStart) {
                                                        setPeakFormData({ ...peakFormData, start_date: newStart, end_date: newStart });
                                                    } else {
                                                        setPeakFormData({ ...peakFormData, start_date: newStart });
                                                    }
                                                }}
                                                required
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold text-dark">
                                                End Date (Optional for single day)
                                            </label>
                                            <input 
                                                type="date" 
                                                min={peakFormData.start_date || ''}
                                                className={`form-control rounded-3 ${peakFormData.end_date && peakFormData.start_date && peakFormData.end_date < peakFormData.start_date ? 'is-invalid border-danger' : ''}`}
                                                value={peakFormData.end_date}
                                                onChange={(e) => {
                                                    const newEnd = e.target.value;
                                                    if (peakFormData.start_date && newEnd && newEnd < peakFormData.start_date) {
                                                        showMessage('warning', 'End date cannot be earlier than start date.');
                                                    }
                                                    setPeakFormData({ ...peakFormData, end_date: newEnd });
                                                }}
                                            />
                                            {peakFormData.end_date && peakFormData.start_date && peakFormData.end_date < peakFormData.start_date ? (
                                                <div className="invalid-feedback d-block small text-danger mt-1">
                                                    End date cannot be earlier than start date ({peakFormData.start_date}).
                                                </div>
                                            ) : (
                                                <small className="text-muted" style={{ fontSize: '11px' }}>
                                                    Must be on or after start date.
                                                </small>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Peak Category & Surge Percentage */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Peak Demand Category</label>
                                            <select 
                                                className="form-select rounded-3"
                                                value={peakFormData.peak_type}
                                                onChange={(e) => setPeakFormData({ ...peakFormData, peak_type: e.target.value })}
                                            >
                                                <option value="peak">🔥 High Demand Peak</option>
                                                <option value="super_peak">⚡ Super Peak Season</option>
                                                <option value="festival_rush">🪔 Festival Rush (Puja / Diwali)</option>
                                                <option value="boat_sold_out">🚤 Safari Boats Sold Out</option>
                                                <option value="wildlife_season">🐯 Prime Sighting Season</option>
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Estimated Price Surge (%)</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light fw-bold">+</span>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max="200"
                                                    className="form-control rounded-end-3"
                                                    placeholder="20"
                                                    value={peakFormData.surge_percentage}
                                                    onChange={(e) => setPeakFormData({ ...peakFormData, surge_percentage: e.target.value })}
                                                />
                                                <span className="input-group-text bg-light">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Badge Marker Color */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold d-block mb-1.5">Calendar Badge Color</label>
                                        <div className="d-flex align-items-center gap-2">
                                            {[
                                                { label: 'Red', hex: '#dc2626' },
                                                { label: 'Orange', hex: '#ea580c' },
                                                { label: 'Purple', hex: '#7c3aed' },
                                                { label: 'Pink', hex: '#db2777' },
                                                { label: 'Emerald', hex: '#059669' },
                                                { label: 'Blue', hex: '#2563eb' }
                                            ].map((c) => (
                                                <button
                                                    key={c.hex}
                                                    type="button"
                                                    onClick={() => setPeakFormData({ ...peakFormData, color: c.hex })}
                                                    className={`btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center ${peakFormData.color === c.hex ? 'ring-2 border-2 border-dark shadow-sm' : 'border-0'}`}
                                                    style={{ width: '32px', height: '32px', backgroundColor: c.hex }}
                                                    title={c.label}
                                                >
                                                    {peakFormData.color === c.hex && <i className="ri ri-check-line text-white"></i>}
                                                </button>
                                            ))}
                                            <input 
                                                type="color" 
                                                value={peakFormData.color}
                                                onChange={(e) => setPeakFormData({ ...peakFormData, color: e.target.value })}
                                                className="form-control form-control-color rounded-circle border-0 ms-2"
                                                style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                                                title="Custom Color"
                                            />
                                        </div>
                                    </div>

                                    {/* 5. Notes */}
                                    <div className="mb-2">
                                        <label className="form-label small fw-semibold">Operational Remarks / Booking Guidance</label>
                                        <textarea
                                            className="form-control rounded-3"
                                            rows="3"
                                            placeholder="e.g. Heavy rush anticipated for Sundarban Boat Safari. Require min 50% advance. No last-minute cancellations."
                                            value={peakFormData.notes}
                                            onChange={(e) => setPeakFormData({ ...peakFormData, notes: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setPeakModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submittingPeak}
                                        className="btn btn-danger rounded-pill px-5 d-inline-flex align-items-center gap-2 shadow-sm"
                                        style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                                    >
                                        {submittingPeak ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Saving Peak Date...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-check-double-line"></i>
                                                <span>Save Peak Date Mark</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
