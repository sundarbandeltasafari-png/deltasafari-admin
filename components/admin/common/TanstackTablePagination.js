"use client";

import React from "react";

/**
 * Reusable TanStack Table Pagination Component
 * Displays:
 * - "Showing X to Y of Z entries"
 * - Page size selector (10, 25, 50, 100)
 * - Navigation: First, Prev, Page numbers, Next, Last
 */
export default function TanstackTablePagination({ table, totalItems, label = "entries" }) {
    if (!table) return null;

    const pageIndex = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;
    const pageCount = table.getPageCount();
    const totalRows = totalItems !== undefined ? totalItems : table.getFilteredRowModel().rows.length;

    const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
    const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

    // Calculate visible page numbers (sliding window of up to 5 buttons)
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        let start = Math.max(0, pageIndex - Math.floor(maxPagesToShow / 2));
        let end = Math.min(pageCount - 1, start + maxPagesToShow - 1);
        if (end - start + 1 < maxPagesToShow) {
            start = Math.max(0, end - maxPagesToShow + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    if (totalRows === 0) return null;

    return (
        <div className="card-footer bg-white border-top py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="text-muted small">
                    Showing <strong className="text-dark">{startRow}</strong> to{" "}
                    <strong className="text-dark">{endRow}</strong> of{" "}
                    <strong className="text-dark">{totalRows}</strong> {label}
                </span>

                <div className="d-flex align-items-center gap-1.5">
                    <span className="text-muted small">Show:</span>
                    <select
                        className="form-select form-select-sm bg-white border rounded-3"
                        style={{ width: "75px", height: "32px", fontSize: "12px" }}
                        value={pageSize}
                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                    >
                        {[10, 25, 50, 100].map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                    <span className="text-muted small">per page</span>
                </div>
            </div>

            <div className="d-flex align-items-center gap-1">
                {/* First Page */}
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 d-inline-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    title="First Page"
                >
                    <i className="ri ri-skip-back-line"></i>
                </button>

                {/* Previous Page */}
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                    style={{ height: "32px" }}
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    <i className="ri ri-arrow-left-s-line"></i> Prev
                </button>

                {/* Page Number Buttons */}
                <div className="d-flex align-items-center gap-1 mx-1">
                    {getPageNumbers().map((idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={`btn btn-sm rounded-circle p-0 d-inline-flex align-items-center justify-content-center ${
                                pageIndex === idx
                                    ? "btn-primary text-white shadow-xs"
                                    : "btn-light text-dark border"
                            }`}
                            style={{
                                width: "32px",
                                height: "32px",
                                fontSize: "13px",
                                fontWeight: pageIndex === idx ? "700" : "500",
                            }}
                            onClick={() => table.setPageIndex(idx)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Next Page */}
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                    style={{ height: "32px" }}
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next <i className="ri ri-arrow-right-s-line"></i>
                </button>

                {/* Last Page */}
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 d-inline-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                    onClick={() => table.setPageIndex(pageCount - 1)}
                    disabled={!table.getCanNextPage()}
                    title="Last Page"
                >
                    <i className="ri ri-skip-forward-line"></i>
                </button>
            </div>
        </div>
    );
}
