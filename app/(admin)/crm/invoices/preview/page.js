'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { getInvoiceConfigUrl } from '@/app/routes/whatsappRoutes';
import { axiosGet } from '@/libs/axiosHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import InvoicePrintTemplate from '@/components/admin/invoice/InvoicePrintTemplate';
import { printInvoiceDocument } from '@/libs/printHelper';

export default function DummyInvoicePreviewPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);

    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(100); // 80, 100, 125, 150

    // Exact replica dummy invoice matching Invoice-30018.pdf
    const dummyInvoice = {
        invoice_no: 'INV-0030018',
        invoice_date: '2026-08-20',
        customer_name: 'Kaushik Bhattacharjee',
        customer_address: 'West Bengal',
        customer_phone: '8777810327',
        customer_email: 'sundarban.deltasafari@gmail.com',
        pickup_drop: 'Canning',
        number_of_pax: 5,
        room_required: '1 AC',
        food_preference: 'Non Veg',
        departure_date_text: '26/09/2026 to 28/09/2026',
        items: [
            {
                sn: 1,
                description: '2N 3D Sundarban Hilsa Festivle Special(5 Sharing)',
                rate: 2700,
                person: 5,
                amount: 13500
            },
            {
                sn: 2,
                description: 'AC Charges',
                rate: 1000,
                person: '',
                amount: 1000
            }
        ],
        subtotal: 14500,
        gst_percent: 5,
        gst_amount: 0, // In original PDF: "N/A"
        discount_amount: 0,
        advance_note: '700/pax',
        advance_received: 2500,
        total_due_amount: 12000,
        payment_status: 'partial'
    };

    const fetchConfig = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosGet(getInvoiceConfigUrl, token);
            if (res?.status && res.data) {
                setConfig(res.data);
            }
        } catch (err) {
            console.error('Error fetching config:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchConfig();
        }
    }, [token]);

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header Control Toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-file-paper-2-fill text-primary fs-3"></i>
                        <span>Dummy Invoice Viewer (Invoice-30018.pdf Replica)</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        1:1 pixel-perfect document preview matching the official Delta Safari invoice format.
                    </p>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    {/* Zoom Controls */}
                    <div className="btn-group bg-white shadow-xs rounded-pill border p-1" role="group">
                        <button
                            type="button"
                            onClick={() => setZoomLevel(prev => Math.max(70, prev - 15))}
                            className="btn btn-light btn-sm rounded-circle p-1"
                            title="Zoom Out"
                            style={{ width: '30px', height: '30px' }}
                        >
                            <i className="ri ri-zoom-out-line"></i>
                        </button>
                        <span className="px-2.5 py-1 small fw-bold text-muted font-monospace align-self-center">
                            {zoomLevel}%
                        </span>
                        <button
                            type="button"
                            onClick={() => setZoomLevel(prev => Math.min(160, prev + 15))}
                            className="btn btn-light btn-sm rounded-circle p-1"
                            title="Zoom In"
                            style={{ width: '30px', height: '30px' }}
                        >
                            <i className="ri ri-zoom-in-line"></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoomLevel(100)}
                            className="btn btn-light btn-sm rounded-pill px-2.5 py-0 text-muted small"
                            title="Reset Zoom"
                        >
                            100%
                        </button>
                    </div>

                    {/* Print / Save PDF */}
                    <button
                        type="button"
                        onClick={() => printInvoiceDocument({ invoice: dummyInvoice, config })}
                        className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri ri-printer-fill"></i>
                        <span>Print / Save PDF</span>
                    </button>

                    {/* Navigation */}
                    <Link href="/crm/invoices" className="btn btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-xs">
                        <i className="ri ri-arrow-left-line"></i>
                        <span>Back to Invoices</span>
                    </Link>
                </div>
            </div>

            {/* Document Viewer Container */}
            <div className="card border-0 shadow-sm rounded-4 p-4 text-center overflow-auto" style={{ backgroundColor: '#e2e8f0', minHeight: '780px' }}>
                {loading ? (
                    <div className="p-5">
                        <LoadingComponent />
                        <p className="text-muted small mt-2">Loading sample invoice...</p>
                    </div>
                ) : (
                    <div 
                        className="d-inline-block shadow-lg rounded-2 overflow-hidden mx-auto transition-all"
                        style={{ 
                            transform: `scale(${zoomLevel / 100})`, 
                            transformOrigin: 'top center',
                            backgroundColor: '#ffffff',
                            margin: '10px auto 40px auto'
                        }}
                    >
                        <InvoicePrintTemplate 
                            invoice={dummyInvoice} 
                            config={config} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
