'use client'

import React, { useState } from 'react';

/**
 * DashboardCharts Component
 * Renders modern, responsive interactive statistic graphs for the Sundarbans Safari Admin Dashboard.
 * Supports dynamic data from API or elegant default analytical mock metrics.
 */
export default function DashboardCharts({ chartsData, countsData }) {
  const [timeframe, setTimeframe] = useState('6m'); // '6m' | 'ytd' | '30d'
  const [activeMetric, setActiveMetric] = useState('revenue'); // 'revenue' | 'bookings'

  // Standardize charts data with robust fallbacks
  const monthlyRevenue = chartsData?.monthly_revenue || [
    { month: "Feb", revenue: 120000, bookings: 8 },
    { month: "Mar", revenue: 155000, bookings: 10 },
    { month: "Apr", revenue: 180000, bookings: 12 },
    { month: "May", revenue: 210000, bookings: 14 },
    { month: "Jun", revenue: 290000, bookings: 19 },
    { month: "Jul", revenue: 320000, bookings: 22 }
  ];

  const leadStatus = chartsData?.lead_status_breakdown || [
    { status: "Pending", count: 4, color: "#ffc107", bgClass: "bg-warning" },
    { status: "Contacted", count: 3, color: "#0dcaf0", bgClass: "bg-info" },
    { status: "In Progress", count: 2, color: "#0d6efd", bgClass: "bg-primary" },
    { status: "Converted", count: 2, color: "#198754", bgClass: "bg-success" },
    { status: "Closed", count: 1, color: "#dc3545", bgClass: "bg-danger" }
  ];

  const categoryBookings = chartsData?.category_bookings || [
    { category: "Wilderness Safari", count: 38, percentage: 44.7, color: "#696cff" },
    { category: "Festival Special", count: 22, percentage: 25.9, color: "#71dd37" },
    { category: "Bird Watching", count: 15, percentage: 17.6, color: "#03c3ec" },
    { category: "Luxury Resort Retreat", count: 10, percentage: 11.8, color: "#ffab00" }
  ];

  const userGrowth = chartsData?.user_growth || [
    { month: "Feb", users: 15 },
    { month: "Mar", users: 22 },
    { month: "Apr", users: 28 },
    { month: "May", users: 35 },
    { month: "Jun", users: 40 },
    { month: "Jul", users: 50 }
  ];

  // Calculations & stats
  const totalRev = monthlyRevenue.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalBookingsCount = monthlyRevenue.reduce((acc, curr) => acc + (curr.bookings || 0), 0);
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue || 1));
  const maxBookings = Math.max(...monthlyRevenue.map(m => m.bookings || 1));
  const maxUsers = Math.max(...userGrowth.map(u => u.users || 1));
  const totalLeadsCount = leadStatus.reduce((acc, curr) => acc + (curr.count || 0), 0);

  // SVG Chart Height & Points Calculation for Area Chart
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = 35;

  const points = monthlyRevenue.map((item, index) => {
    const x = padding + (index / Math.max(monthlyRevenue.length - 1, 1)) * (svgWidth - padding * 2);
    const val = activeMetric === 'revenue' ? item.revenue : item.bookings;
    const maxVal = activeMetric === 'revenue' ? maxRevenue : maxBookings;
    const y = svgHeight - padding - (val / (maxVal * 1.15)) * (svgHeight - padding * 2);
    return { x, y, ...item };
  });

  const pathD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1]?.x || svgWidth - padding} ${svgHeight - padding} L ${points[0]?.x || padding} ${svgHeight - padding} Z`;

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dashboard-statistics-wrapper mb-4">
      {/* KPI Overview Summary Banner */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card shadow-sm border-0 bg-label-primary h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-uppercase fw-semibold text-primary small">Total Est. Revenue</span>
                <h4 className="fw-bold text-primary mb-0 mt-1">₹ {totalRev.toLocaleString('en-IN')}</h4>
                <span className="badge bg-primary text-white mt-2">+18.4% vs last period</span>
              </div>
              <div className="avatar avatar-md bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center">
                <i className="ri ri-money-rupee-circle-line fs-3"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card shadow-sm border-0 bg-label-success h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-uppercase fw-semibold text-success small">Conversion Rate</span>
                <h4 className="fw-bold text-success mb-0 mt-1">
                  {countsData?.conversion_rate || ((leadStatus.find(l => l.status === 'Converted')?.count || 2) / (totalLeadsCount || 12) * 100).toFixed(1)}%
                </h4>
                <span className="badge bg-success text-white mt-2">Optimal conversion</span>
              </div>
              <div className="avatar avatar-md bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center">
                <i className="ri ri-line-chart-line fs-3"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card shadow-sm border-0 bg-label-info h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-uppercase fw-semibold text-info small">Avg. Booking Value</span>
                <h4 className="fw-bold text-info mb-0 mt-1">
                  ₹ {totalBookingsCount > 0 ? Math.round(totalRev / totalBookingsCount).toLocaleString('en-IN') : '14,500'}
                </h4>
                <span className="badge bg-info text-white mt-2">{totalBookingsCount} Total Safaris</span>
              </div>
              <div className="avatar avatar-md bg-info text-white rounded-circle p-2 d-flex align-items-center justify-content-center">
                <i className="ri ri-ticket-line fs-3"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card shadow-sm border-0 bg-label-warning h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-uppercase fw-semibold text-warning small">Active Enquiries</span>
                <h4 className="fw-bold text-warning mb-0 mt-1">
                  {countsData?.pending_corporate_leads || 4} Leads
                </h4>
                <span className="badge bg-warning text-white mt-2">Follow-up needed</span>
              </div>
              <div className="avatar avatar-md bg-warning text-white rounded-circle p-2 d-flex align-items-center justify-content-center">
                <i className="ri ri-time-line fs-3"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="row g-4 mb-4">
        {/* Chart 1: Revenue & Bookings Trend Area Chart */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header border-bottom bg-white py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <h6 className="card-title m-0 fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="ri ri-bar-chart-fill text-primary fs-5"></i>
                  Revenue & Booking Analytics Trend
                </h6>
                <span className="text-muted small">Monthly performance metrics across all safari packages</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${activeMetric === 'revenue' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveMetric('revenue')}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    type="button"
                    className={`btn ${activeMetric === 'bookings' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveMetric('bookings')}
                  >
                    Bookings Count
                  </button>
                </div>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '110px' }}
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option value="6m">Last 6 Mos</option>
                  <option value="ytd">2026 YTD</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>
            <div className="card-body p-3">
              {/* Interactive Vector Line / Area Graph */}
              <div className="position-relative w-100 overflow-hidden" style={{ minHeight: '250px' }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-100 h-auto overflow-visible" style={{ maxHeight: '280px' }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#696cff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#696cff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const yVal = padding + ratio * (svgHeight - padding * 2);
                    return (
                      <line
                        key={idx}
                        x1={padding}
                        y1={yVal}
                        x2={svgWidth - padding}
                        y2={yVal}
                        stroke="#e0e0e0"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Filled Area */}
                  <path d={areaD} fill="url(#chartGradient)" />

                  {/* Smooth Line Path */}
                  <path d={pathD} fill="none" stroke="#696cff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Data Points */}
                  {points.map((p, i) => (
                    <g key={i} className="chart-point" style={{ cursor: 'pointer' }}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredPoint?.month === p.month ? 7 : 4.5}
                        fill="#ffffff"
                        stroke="#696cff"
                        strokeWidth="3"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* Month Label */}
                      <text
                        x={p.x}
                        y={svgHeight - 10}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill="#6c757d"
                      >
                        {p.month}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Hover Tooltip Overlay */}
                {hoveredPoint && (
                  <div
                    className="position-absolute bg-dark text-white rounded p-2 shadow-lg small"
                    style={{
                      top: '10px',
                      right: '15px',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                  >
                    <div className="fw-bold text-warning">{hoveredPoint.month} 2026</div>
                    <div>Revenue: ₹{hoveredPoint.revenue?.toLocaleString('en-IN')}</div>
                    <div>Bookings: {hoveredPoint.bookings} safaris</div>
                  </div>
                )}
              </div>

              {/* Footer Summary legend */}
              <div className="d-flex justify-content-around border-top pt-3 mt-2 text-center">
                <div>
                  <span className="text-muted small d-block">Peak Month</span>
                  <span className="fw-bold text-dark">{monthlyRevenue[monthlyRevenue.length - 1]?.month || 'Jul'} (₹{maxRevenue.toLocaleString('en-IN')})</span>
                </div>
                <div className="border-start ps-3">
                  <span className="text-muted small d-block">Monthly Avg</span>
                  <span className="fw-bold text-dark">₹{Math.round(totalRev / (monthlyRevenue.length || 1)).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-start ps-3">
                  <span className="text-muted small d-block">Growth Rate</span>
                  <span className="fw-bold text-success">+22.5% MoM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Corporate Lead Pipeline Breakdown */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header border-bottom bg-white py-3">
              <h6 className="card-title m-0 fw-bold text-dark d-flex align-items-center gap-2">
                <i className="ri ri-pie-chart-2-fill text-warning fs-5"></i>
                Corporate Lead Pipeline Status
              </h6>
              <span className="text-muted small">Distribution of active corporate inquiries</span>
            </div>
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              {/* Progress Stack Bar Visual */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold text-dark">Total Enquiries</span>
                  <span className="badge bg-label-dark font-monospace fs-6">{totalLeadsCount} Leads</span>
                </div>
                <div className="progress" style={{ height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                  {leadStatus.map((lead, idx) => {
                    const pct = totalLeadsCount > 0 ? (lead.count / totalLeadsCount) * 100 : 0;
                    return (
                      <div
                        key={idx}
                        className={`progress-bar ${lead.bgClass || ''}`}
                        role="progressbar"
                        style={{ width: `${pct}%`, backgroundColor: lead.color }}
                        title={`${lead.status}: ${lead.count} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Status List Breakdown */}
              <div className="list-group list-group-flush border-0">
                {leadStatus.map((item, idx) => {
                  const pct = totalLeadsCount > 0 ? ((item.count / totalLeadsCount) * 100).toFixed(1) : 0;
                  return (
                    <div key={idx} className="list-group-item border-0 px-0 py-2 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: item.color, display: 'inline-block' }}></span>
                        <span className="fw-medium text-dark small">{item.status}</span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-dark small">{item.count} leads</span>
                        <span className="badge bg-light text-muted font-monospace">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="alert alert-primary mb-0 p-2 mt-3 text-center small border-0">
                <i className="ri ri-lightbulb-line me-1"></i>
                <strong>Tip:</strong> Follow up with 4 pending leads to increase conversion by 33%.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="row g-4">
        {/* Chart 3: Category Wise Popularity */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header border-bottom bg-white py-3">
              <h6 className="card-title m-0 fw-bold text-dark d-flex align-items-center gap-2">
                <i className="ri ri-compass-3-fill text-info fs-5"></i>
                Safari Package Popularity Breakdown
              </h6>
              <span className="text-muted small">Most booked safari tour categories</span>
            </div>
            <div className="card-body p-3">
              <div className="space-y-3">
                {categoryBookings.map((cat, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-medium text-dark small">{cat.category}</span>
                      <span className="fw-bold text-dark small">{cat.count} bookings ({cat.percentage}%)</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar rounded-pill"
                        role="progressbar"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Monthly User Registration Growth */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header border-bottom bg-white py-3">
              <h6 className="card-title m-0 fw-bold text-dark d-flex align-items-center gap-2">
                <i className="ri ri-user-add-fill text-success fs-5"></i>
                New User Registration Growth
              </h6>
              <span className="text-muted small">Monthly registered customer accounts</span>
            </div>
            <div className="card-body p-3">
              <div className="d-flex align-items-end justify-content-around h-100 pt-4 pb-2" style={{ minHeight: '160px' }}>
                {userGrowth.map((ug, idx) => {
                  const barHeight = Math.round((ug.users / maxUsers) * 120);
                  return (
                    <div key={idx} className="d-flex flex-column align-items-center gap-2">
                      <span className="fw-bold small text-dark">{ug.users}</span>
                      <div
                        className="bg-success bg-gradient rounded-top shadow-sm transition-all"
                        style={{
                          width: '28px',
                          height: `${barHeight}px`,
                          opacity: 0.85
                        }}
                        title={`${ug.month}: ${ug.users} users`}
                      ></div>
                      <span className="text-muted small fw-semibold">{ug.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
