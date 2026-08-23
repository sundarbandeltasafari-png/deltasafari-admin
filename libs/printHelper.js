/**
 * Clean, Isolated Invoice Printing Helper
 * Prints ONLY the exact Invoice document without any surrounding admin UI, modals, or headers.
 */

export function printInvoiceDocument({ invoice, config }) {
    if (!invoice) return;

    // Company & business config
    const companyName = config?.company_name || 'DELTA SAFARI';
    const address = config?.address || 'Canning, Herobhanga, South 24 Parganas- 743329';
    const msmeReg = config?.msme_reg || 'UDYAM-WB-18-0109198';
    const tradeLicence = config?.trade_licence || '767';
    const mobileNumbers = config?.mobile_numbers || '+91 7029533240 & +91 6297603562';
    const email = config?.email || 'sundarban.deltasafari@gmail.com';
    const website = config?.website || 'sundarbandeltasafari.com';
    const logoSrc = config?.logo_url || '/images/logo_DS.png';

    const bankName = config?.bank_name || 'STATE BANK OF INDIA';
    const accountHolder = config?.account_holder || 'SANDIP HALDER';
    const accountNumber = config?.account_number || '34193984830';
    const ifscCode = config?.ifsc_code || 'SBIN0011367';

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

    const itemsHtml = items.map((item, idx) => `
        <tr style="vertical-align: top;">
            <td style="text-align: center; padding: 4px 2px; border-right: 1px solid #000000;">${item.sn || idx + 1}</td>
            <td style="padding: 4px 6px; border-right: 1px solid #000000;">${item.description || ''}</td>
            <td style="text-align: center; padding: 4px 4px; border-right: 1px solid #000000;">${item.rate || ''}</td>
            <td style="text-align: center; padding: 4px 4px; border-right: 1px solid #000000;">${item.person || ''}</td>
            <td style="text-align: center; padding: 4px 6px;">${item.amount || ''}</td>
        </tr>
    `).join('');

    const termsHtml = termsLines.map((line) => `
        <div style="margin-bottom: 2px;">${line}</div>
    `).join('');

    const printHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - ${invoice.invoice_no || 'INV-0030018'}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 12mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 11.5px;
            line-height: 1.35;
        }
        .invoice-outer-box {
            border: 1px solid #000000;
            padding: 16px 18px 24px 18px;
            background-color: #ffffff;
            margin: 0 auto;
            max-width: 100%;
        }
    </style>
</head>
<body>
    <div style="text-align: center; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: #111827;">
        Invoice
    </div>

    <div class="invoice-outer-box">
        <!-- 1. Header with Logo (Left) and Centered Company Info -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid #000000; padding-bottom: 12px;">
            <div style="width: 130px; flex-shrink: 0; padding-top: 2px;">
                <img src="${logoSrc}" alt="DELTA SAFARI" style="width: 110px; height: auto; display: block;" onerror="this.style.display='none';" />
            </div>
            <div style="flex-grow: 1; text-align: center; padding-right: 40px;">
                <h1 style="font-size: 24px; font-weight: 900; margin: 0 0 2px 0; letter-spacing: 0.8px; color: #000000;">
                    ${companyName}
                </h1>
                <div style="font-size: 10.5px; color: #111827; line-height: 1.4;">
                    <div>${address}</div>
                    <div>MSME : ${msmeReg} ; TRADE LICENCE NO : ${tradeLicence}</div>
                    <div>Mobile Number : ${mobileNumbers}</div>
                    <div>Mail Id : ${email}</div>
                    <div>Website : <span style="color: #0066cc; text-decoration: underline;">${website}</span></div>
                </div>
            </div>
        </div>

        <!-- 2. Customer & Guest Details Grid Box -->
        <div style="border: 1px solid #000000; margin-bottom: -1px;">
            <div style="display: flex; border-bottom: 1px solid #000000;">
                <div style="width: 50%; padding: 4px 8px; border-right: 1px solid #000000; font-size: 11.5px; font-weight: 500;">
                    Invoice No : <span style="font-weight: normal;">${invoice.invoice_no || 'INV-0030018'}</span>
                </div>
                <div style="width: 50%; padding: 4px 8px; font-size: 11.5px; font-weight: 500;">
                    Date : <span style="font-weight: normal;">${formatDate(invoice.invoice_date) || '20/08/2026'}</span>
                </div>
            </div>

            <div style="display: flex;">
                <div style="width: 50%; padding: 6px 8px; border-right: 1px solid #000000;">
                    <div style="font-weight: 500; font-style: italic; margin-bottom: 4px; font-size: 11.5px;">Invoice To -</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <tbody>
                            <tr>
                                <td style="width: 95px; padding: 1.5px 0;">Name</td>
                                <td style="padding: 1.5px 0;">: ${invoice.customer_name || 'Kaushik Bhattacharjee'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 1.5px 0;">Address</td>
                                <td style="padding: 1.5px 0;">: ${invoice.customer_address || 'West Bengal'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 1.5px 0;">Mobile Number</td>
                                <td style="padding: 1.5px 0;">: ${invoice.customer_phone || '8777810327'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 1.5px 0;">Pickup/Drop</td>
                                <td style="padding: 1.5px 0;">: ${invoice.pickup_drop || 'Canning'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="width: 50%; padding: 6px 8px;">
                    <div style="font-weight: 500; font-style: italic; margin-bottom: 4px; font-size: 11.5px;">Guest Details -</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <tbody>
                            <tr>
                                <td style="width: 105px; padding: 1.5px 0;">Number of Pax</td>
                                <td style="padding: 1.5px 0;">: ${invoice.number_of_pax || 5}</td>
                            </tr>
                            <tr>
                                <td style="padding: 1.5px 0;">Room Required</td>
                                <td style="padding: 1.5px 0;">: ${invoice.room_required || '1 AC'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 1.5px 0;">Food Preference</td>
                                <td style="padding: 1.5px 0;">: ${invoice.food_preference || 'Non Veg'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 1.5px 0;">Departure Date</td>
                                <td style="padding: 1.5px 0;">: ${invoice.departure_date_text || '26/09/2026 to 28/09/2026'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- 3. Items Table -->
        <div style="border: 1px solid #000000; margin-bottom: 14px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid #000000; font-weight: bold;">
                        <th style="width: 48px; text-align: center; padding: 4px 2px; border-right: 1px solid #000000;">S.N</th>
                        <th style="text-align: center; padding: 4px 6px; border-right: 1px solid #000000;">Description</th>
                        <th style="width: 75px; text-align: center; padding: 4px 4px; border-right: 1px solid #000000;">Rate</th>
                        <th style="width: 68px; text-align: center; padding: 4px 4px; border-right: 1px solid #000000;">Person</th>
                        <th style="width: 110px; text-align: center; padding: 4px 6px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <!-- Space extending table body down matching PDF -->
                    <tr style="height: 140px;">
                        <td style="border-right: 1px solid #000000;"></td>
                        <td style="border-right: 1px solid #000000;"></td>
                        <td style="border-right: 1px solid #000000;"></td>
                        <td style="border-right: 1px solid #000000;"></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>

            <!-- 4. Totals & Calculations Table Footer -->
            <div style="border-top: 1px solid #000000;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <tbody>
                        <tr style="border-bottom: 1px solid #000000;">
                            <td colspan="4" style="border-right: 1px solid #000000;"></td>
                            <td style="width: 110px; text-align: center; padding: 4px 6px; font-weight: 500;">
                                ${invoice.subtotal || 14500}
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 48%; border-right: 1px solid #000000;"></td>
                            <td style="width: 40px; padding: 3px 0 3px 6px; font-weight: 500;">Add :</td>
                            <td style="padding: 3px 4px;">GST</td>
                            <td style="width: 60px; text-align: right; padding: 3px 12px 3px 4px; border-right: 1px solid #000000;">
                                ${invoice.gst_percent > 0 ? `${invoice.gst_percent}%` : '5%'}
                            </td>
                            <td style="width: 110px; text-align: center; padding: 3px 6px;">
                                ${invoice.gst_amount > 0 ? invoice.gst_amount : 'N/A'}
                            </td>
                        </tr>
                        <tr>
                            <td style="border-right: 1px solid #000000;"></td>
                            <td style="padding: 3px 0 3px 6px; font-weight: 500;">Add :</td>
                            <td colspan="2" style="padding: 3px 4px; border-right: 1px solid #000000;">Discount</td>
                            <td style="width: 110px; text-align: center; padding: 3px 6px;">
                                ${invoice.discount_amount || 0}
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #000000;">
                            <td style="border-right: 1px solid #000000;"></td>
                            <td style="padding: 3px 0 3px 6px; font-weight: 500;">Add :</td>
                            <td colspan="2" style="padding: 3px 4px; border-right: 1px solid #000000;">
                                Advance Received(-) ${invoice.advance_note || '700/pax'}
                            </td>
                            <td style="width: 110px; text-align: center; padding: 3px 6px;">
                                ${invoice.advance_received || 2500}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="4" style="text-align: right; padding: 5px 14px 5px 6px; font-weight: bold; border-right: 1px solid #000000; font-size: 11.5px;">
                                Total Due Amount
                            </td>
                            <td style="width: 110px; text-align: center; padding: 5px 6px; font-weight: bold; font-size: 11.5px; border-bottom: 2px solid #000000;">
                                ${invoice.total_due_amount || 12000}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 5. Account Details -->
        <div style="margin-bottom: 14px; font-size: 10.5px; line-height: 1.4;">
            <div>
                <strong style="font-size: 11px;">Account Details :</strong>&nbsp;&nbsp;&nbsp;
                <span>${bankName} ; A/C Holder : ${accountHolder}</span>
            </div>
            <div style="padding-left: 110px;">
                <span>A/C NO : ${accountNumber} ; IFSC : ${ifscCode}</span>
            </div>
        </div>

        <!-- 6. Terms & Conditions -->
        <div style="margin-bottom: 40px; font-size: 10px; line-height: 1.45;">
            <div style="font-weight: bold; font-style: italic; margin-bottom: 3px; font-size: 11px;">
                Terms &amp; Conditions :
            </div>
            <div style="font-style: italic; color: #111827; padding-left: 40px;">
                ${termsHtml}
            </div>
        </div>

        <!-- 7. Signatures Row -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; padding-left: 20px; padding-right: 20px; font-size: 11px;">
            <div style="text-align: center; min-width: 170px;">
                <div style="border-top: 1px solid #000000; padding-top: 4px; font-style: italic;">
                    Receiver's Signature
                </div>
            </div>
            <div style="text-align: center; min-width: 170px;">
                <div style="border-top: 1px solid #000000; padding-top: 4px; font-style: italic;">
                    Authorised Signatory
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    // Create an invisible iframe for completely isolated printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printHtml);
    doc.close();

    // Trigger print once iframe content is loaded
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }, 250);
}
