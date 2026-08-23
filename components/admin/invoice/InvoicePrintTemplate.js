'use client';

import React from 'react';

/**
 * InvoicePrintTemplate renders the exact invoice layout matching Invoice-30018.pdf (1:1 clone)
 */
export default function InvoicePrintTemplate({ invoice, config }) {
    if (!invoice) return null;

    // Use invoice specific values or fallback to default config
    const companyName = config?.company_name || 'DELTA SAFARI';
    const address = config?.address || 'Canning, Herobhanga, South 24 Parganas- 743329';
    const msmeReg = config?.msme_reg || 'UDYAM-WB-18-0109198';
    const tradeLicence = config?.trade_licence || '767';
    const mobileNumbers = config?.mobile_numbers || '+91 7029533240 & +91 6297603562';
    const email = config?.email || 'sundarban.deltasafari@gmail.com';
    const website = config?.website || 'sundarbandeltasafari.com';
    const logoSrc = config?.logo_url || '/images/logo_DS.png';

    // Account details lines
    const bankName = config?.bank_name || 'STATE BANK OF INDIA';
    const accountHolder = config?.account_holder || 'SANDIP HALDER';
    const accountNumber = config?.account_number || '34193984830';
    const ifscCode = config?.ifsc_code || 'SBIN0011367';

    // Terms
    const defaultTerms = [
        "1/ The itinerary is subject to change, modification, or rescheduling due to any disasters, emergencies, restrictions or any other unforeseen circumstances beyond our control.",
        "2/ Rest of the due amount should be paid to the assigned tour manager on day one.",
        "3/ Cancellations made within 30 days of the travel date are non-refundable.",
        "4/ Any action taken by the Forest Department for rule violations will be your responsibility.",
        "5/ Please carry a valid ID card for jungle permit verification and security checks."
    ];

    const termsLines = (invoice.terms_text || config?.terms_conditions)
        ? (invoice.terms_text || config?.terms_conditions).split('\n').filter(t => t.trim() !== '')
        : defaultTerms;

    const items = Array.isArray(invoice.items) && invoice.items.length > 0
        ? invoice.items
        : [
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
        ];

    const formatDate = (dStr) => {
        if (!dStr) return '';
        try {
            const d = new Date(dStr);
            if (isNaN(d.getTime())) return dStr;
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dStr;
        }
    };

    return (
        <div className="invoice-container-outer bg-white text-dark mx-auto" style={{
            width: '100%',
            maxWidth: '794px', /* Standard A4 web width */
            padding: '20px 24px',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            color: '#000000',
            fontSize: '11.5px',
            lineHeight: '1.35',
            backgroundColor: '#ffffff'
        }}>
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm 12mm;
                    }
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print, .modal-header, .modal-footer, .layout-navbar, .layout-menu {
                        display: none !important;
                    }
                    .invoice-container-outer {
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            {/* Document Title Header (Invoice) */}
            <div className="text-center mb-1.5" style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                Invoice
            </div>

            {/* Outer Boxed Frame (Exact Box enclosing entire document matching Invoice-30018.pdf) */}
            <div style={{
                border: '1px solid #000000',
                padding: '16px 18px 24px 18px',
                backgroundColor: '#ffffff'
            }}>
                {/* 1. Header with Logo (Left) and Centered Company Information */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #000000', paddingBottom: '12px' }}>
                    {/* Left: Logo */}
                    <div style={{ width: '130px', flexShrink: 0, paddingTop: '2px' }}>
                        <img 
                            src={logoSrc} 
                            alt="DELTA SAFARI" 
                            style={{ width: '110px', height: 'auto', display: 'block' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>

                    {/* Center: Business Information */}
                    <div style={{ flexGrow: 1, textAlign: 'center', paddingRight: '40px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 2px 0', letterSpacing: '0.8px', color: '#000000' }}>
                            {companyName}
                        </h1>
                        <div style={{ fontSize: '10.5px', color: '#111827', lineHeight: '1.4' }}>
                            <div>{address}</div>
                            <div>MSME : {msmeReg} ; TRADE LICENCE NO : {tradeLicence}</div>
                            <div>Mobile Number : {mobileNumbers}</div>
                            <div>Mail Id : {email}</div>
                            <div>
                                Website : <a href={`https://${website}`} target="_blank" rel="noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>{website}</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Customer & Guest Details Grid Box */}
                <div style={{ border: '1px solid #000000', marginBottom: '-1px' }}>
                    {/* Header Row: Invoice No & Date */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
                        <div style={{ width: '50%', padding: '4px 8px', borderRight: '1px solid #000000', fontSize: '11.5px', fontWeight: '500' }}>
                            Invoice No : <span style={{ fontWeight: 'normal' }}>{invoice.invoice_no || 'INV-0030018'}</span>
                        </div>
                        <div style={{ width: '50%', padding: '4px 8px', fontSize: '11.5px', fontWeight: '500' }}>
                            Date : <span style={{ fontWeight: 'normal' }}>{formatDate(invoice.invoice_date) || '20/08/2026'}</span>
                        </div>
                    </div>

                    {/* Details Row: Invoice To & Guest Details */}
                    <div style={{ display: 'flex' }}>
                        {/* Left: Invoice To */}
                        <div style={{ width: '50%', padding: '6px 8px', borderRight: '1px solid #000000' }}>
                            <div style={{ fontWeight: '500', fontStyle: 'italic', marginBottom: '4px', fontSize: '11.5px' }}>Invoice To -</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '95px', padding: '1.5px 0' }}>Name</td>
                                        <td style={{ padding: '1.5px 0' }}>: {invoice.customer_name || 'Kaushik Bhattacharjee'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0' }}>Address</td>
                                        <td style={{ padding: '1.5px 0' }}>: {invoice.customer_address || 'West Bengal'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0' }}>Mobile Number</td>
                                        <td style={{ padding: '1.5px 0' }}>: {invoice.customer_phone || '8777810327'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0' }}>Pickup/Drop</td>
                                        <td style={{ padding: '1.5px 0' }}>: {invoice.pickup_drop || 'Canning'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Right: Guest Details */}
                        <div style={{ width: '50%', padding: '6px 8px' }}>
                            <div style={{ fontWeight: '500', fontStyle: 'italic', marginBottom: '4px', fontSize: '11.5px' }}>Guest Details -</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '105px', padding: '1.5px 0' }}>Number of Pax</td>
                                        <td style={{ padding: '1.5px 0' }}>: {invoice.number_of_pax || 5}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0' }}>Room Required</td>
                                        <td style={{ padding: '1.5px 0' }}>: {invoice.room_required || '1 AC'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0' }}>Food Preference</td>
                                        <td style={{ padding: '1.5px 0' }}>: {invoice.food_preference || 'Non Veg'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0' }}>Departure Date</td>
                                        <td style={{ padding: '1.5px 0' }}>: {invoice.departure_date_text || '26/09/2026 to 28/09/2026'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 3. Items Table (Exact Layout & Column Proportions matching Invoice-30018.pdf) */}
                <div style={{ border: '1px solid #000000', marginBottom: '14px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold' }}>
                                <th style={{ width: '48px', textAlign: 'center', padding: '4px 2px', borderRight: '1px solid #000000' }}>S.N</th>
                                <th style={{ textAlign: 'center', padding: '4px 6px', borderRight: '1px solid #000000' }}>Description</th>
                                <th style={{ width: '75px', textAlign: 'center', padding: '4px 4px', borderRight: '1px solid #000000' }}>Rate</th>
                                <th style={{ width: '68px', textAlign: 'center', padding: '4px 4px', borderRight: '1px solid #000000' }}>Person</th>
                                <th style={{ width: '110px', textAlign: 'center', padding: '4px 6px' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} style={{ verticalAlign: 'top' }}>
                                    <td style={{ textAlign: 'center', padding: '3px 2px', borderRight: '1px solid #000000' }}>{item.sn || idx + 1}</td>
                                    <td style={{ padding: '3px 6px', borderRight: '1px solid #000000' }}>{item.description}</td>
                                    <td style={{ textAlign: 'center', padding: '3px 4px', borderRight: '1px solid #000000' }}>{item.rate || ''}</td>
                                    <td style={{ textAlign: 'center', padding: '3px 4px', borderRight: '1px solid #000000' }}>{item.person || ''}</td>
                                    <td style={{ textAlign: 'center', padding: '3px 6px' }}>{item.amount || ''}</td>
                                </tr>
                            ))}
                            {/* Empty space extending table body down matching PDF layout */}
                            <tr style={{ height: '140px' }}>
                                <td style={{ borderRight: '1px solid #000000' }}></td>
                                <td style={{ borderRight: '1px solid #000000' }}></td>
                                <td style={{ borderRight: '1px solid #000000' }}></td>
                                <td style={{ borderRight: '1px solid #000000' }}></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* 4. Totals & Calculations Table Footer */}
                    <div style={{ borderTop: '1px solid #000000' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <tbody>
                                {/* Subtotal row */}
                                <tr style={{ borderBottom: '1px solid #000000' }}>
                                    <td colSpan={4} style={{ borderRight: '1px solid #000000' }}></td>
                                    <td style={{ width: '110px', textAlign: 'center', padding: '4px 6px', fontWeight: '500' }}>
                                        {invoice.subtotal || 14500}
                                    </td>
                                </tr>

                                {/* GST row */}
                                <tr>
                                    <td style={{ width: '48%', borderRight: '1px solid #000000' }}></td>
                                    <td style={{ width: '40px', padding: '3px 0 3px 6px', fontWeight: '500' }}>Add :</td>
                                    <td style={{ padding: '3px 4px' }}>GST</td>
                                    <td style={{ width: '60px', textAlign: 'right', padding: '3px 12px 3px 4px', borderRight: '1px solid #000000' }}>
                                        {invoice.gst_percent > 0 ? `${invoice.gst_percent}%` : '5%'}
                                    </td>
                                    <td style={{ width: '110px', textAlign: 'center', padding: '3px 6px' }}>
                                        {invoice.gst_amount > 0 ? invoice.gst_amount : 'N/A'}
                                    </td>
                                </tr>

                                {/* Discount row */}
                                <tr>
                                    <td style={{ borderRight: '1px solid #000000' }}></td>
                                    <td style={{ padding: '3px 0 3px 6px', fontWeight: '500' }}>Add :</td>
                                    <td colSpan={2} style={{ padding: '3px 4px', borderRight: '1px solid #000000' }}>Discount</td>
                                    <td style={{ width: '110px', textAlign: 'center', padding: '3px 6px' }}>
                                        {invoice.discount_amount || 0}
                                    </td>
                                </tr>

                                {/* Advance Received row */}
                                <tr style={{ borderBottom: '1px solid #000000' }}>
                                    <td style={{ borderRight: '1px solid #000000' }}></td>
                                    <td style={{ padding: '3px 0 3px 6px', fontWeight: '500' }}>Add :</td>
                                    <td colSpan={2} style={{ padding: '3px 4px', borderRight: '1px solid #000000' }}>
                                        Advance Received(-) {invoice.advance_note || '700/pax'}
                                    </td>
                                    <td style={{ width: '110px', textAlign: 'center', padding: '3px 6px' }}>
                                        {invoice.advance_received || 2500}
                                    </td>
                                </tr>

                                {/* Total Due Amount row (Double underline / bold line) */}
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'right', padding: '5px 14px 5px 6px', fontWeight: 'bold', borderRight: '1px solid #000000', fontSize: '11.5px' }}>
                                        Total Due Amount
                                    </td>
                                    <td style={{ width: '110px', textAlign: 'center', padding: '5px 6px', fontWeight: 'bold', fontSize: '11.5px', borderBottom: '2px solid #000000' }}>
                                        {invoice.total_due_amount || 12000}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 5. Account Details */}
                <div style={{ marginBottom: '14px', fontSize: '10.5px', lineHeight: '1.4' }}>
                    <div>
                        <strong style={{ fontSize: '11px' }}>Account Details :</strong>&nbsp;&nbsp;&nbsp;
                        <span>{bankName} ; A/C Holder : {accountHolder}</span>
                    </div>
                    <div style={{ paddingLeft: '110px' }}>
                        <span>A/C NO : {accountNumber} ; IFSC : {ifscCode}</span>
                    </div>
                </div>

                {/* 6. Terms & Conditions */}
                <div style={{ marginBottom: '40px', fontSize: '10px', lineHeight: '1.45' }}>
                    <div style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '3px', fontSize: '11px' }}>
                        Terms &amp; Conditions :
                    </div>
                    <div style={{ fontStyle: 'italic', color: '#111827', paddingLeft: '40px' }}>
                        {termsLines.map((line, idx) => (
                            <div key={idx} style={{ marginBottom: '2px' }}>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 7. Signatures Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px', fontSize: '11px' }}>
                    <div style={{ textAlign: 'center', minWidth: '170px' }}>
                        <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', fontStyle: 'italic' }}>
                            Receiver's Signature
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: '170px' }}>
                        <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', fontStyle: 'italic' }}>
                            Authorised Signatory
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
