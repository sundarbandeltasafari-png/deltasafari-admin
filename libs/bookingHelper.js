/**
 * Unified Booking & Date Helpers
 * Normalizes package reservations (from `bookings` table) and manual lead conversions (from `crm_lead_followups`)
 */

/**
 * Normalizes any date value (string, Date, ISO timestamp) into 'YYYY-MM-DD'
 * Uses Asia/Kolkata timezone to avoid timezone shift on UTC dates.
 */
export const normalizeDateStr = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal === 'string') {
        const trimmed = dateVal.trim();
        // If exact YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        // If YYYY-MM-DD with time e.g. 2026-09-03 14:30:00
        if (/^\d{4}-\d{2}-\d{2}[ T]/.test(trimmed)) {
            return trimmed.slice(0, 10);
        }
    }
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return null;
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(d);
    } catch (e) {
        return null;
    }
};

/**
 * Formats a date for human-friendly display
 * e.g. '03 Sep 2026' or 'Thursday, 3 September 2026'
 */
export const formatDisplayDate = (dateVal, isFull = false) => {
    if (!dateVal) return 'N/A';
    try {
        const dateStr = normalizeDateStr(dateVal);
        if (!dateStr) return String(dateVal);
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        if (isNaN(d.getTime())) return String(dateVal);

        if (isFull) {
            return d.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return String(dateVal);
    }
};

/**
 * Normalize an individual reservation or manual converted lead into a uniform structure
 */
export const normalizeBookingItem = (item, source = 'RESERVATION') => {
    if (!item) return null;

    if (source === 'RESERVATION') {
        const isAgent = item.user_type === 3 || !!item.agent_first_name;
        const isDirectRazorpay = item.booking_type === 'DIRECT_RAZORPAY' || item.payment_method === 'RAZORPAY' || !!item.razorpay_payment_id;
        const isPaid = String(item.payment_status).toUpperCase() === 'PAID' || String(item.payment_status) === '1';

        const depDateStr = item.departure_date_str || normalizeDateStr(item.departure_date);
        const crDateStr = item.created_at_str || normalizeDateStr(item.created_at);

        let sourceLabel = 'Booking Form Enquiry';
        if (isAgent) sourceLabel = 'Agent B2B';
        else if (isDirectRazorpay) sourceLabel = 'Online Razorpay';

        return {
            unique_id: `res-${item.bookings_id || item.id}`,
            source_type: 'RESERVATION',
            source_label: sourceLabel,
            is_agent: isAgent,
            agent_name: isAgent ? `${item.agent_first_name || ''} ${item.agent_last_name || ''}`.trim() : null,
            booking_id: item.bookings_id || item.id,
            display_id: `#${item.bookings_id || item.id}`,
            invoice_number: item.invoice_number || null,
            customer_name: item.customer_name || 'Client',
            customer_phone: item.customer_phone || 'N/A',
            customer_email: item.customer_email || '',
            package_title: item.title || 'Safari Package',
            travel_destination: item.to_destination_name || 'Sundarban Safari',
            departure_date: depDateStr,
            travel_date: depDateStr,
            booking_date: crDateStr,
            effective_date: depDateStr || crDateStr, // primary date for calendar view
            total_cost: Number(item.total_cost || 0),
            total_travelers: Number(item.total_travelers || 1),
            total_rooms: Number(item.total_rooms || 1),
            payment_status: item.payment_status,
            is_paid: isPaid,
            booking_status: item.booking_status,
            is_confirmed: Number(item.booking_status) === 2,
            notes: item.customer_comment || item.admin_notes || '',
            raw: item
        };
    } else {
        // MANUAL LEAD CONVERSION
        const travelDateStr = item.travel_date_str || normalizeDateStr(item.travel_date);
        const convDateStr = item.converted_at_str || normalizeDateStr(item.converted_at);
        const crDateStr = item.followup_created_at_str || normalizeDateStr(item.followup_created_at);

        const amount = Number(item.converted_amount || item.package_rate || 0);

        return {
            unique_id: `lead-${item.contact_id || item.followup_id}`,
            source_type: 'MANUAL_LEAD',
            source_label: 'Manual Lead Conversion',
            is_agent: false,
            agent_name: null,
            booking_id: item.followup_id || item.contact_id,
            contact_id: item.contact_id,
            display_id: `LEAD-#${item.contact_id || item.followup_id}`,
            invoice_number: item.invoice_number || null,
            customer_name: item.lead_name || 'WhatsApp Client',
            customer_phone: item.phone || item.wa_id || 'N/A',
            customer_email: item.email || '',
            package_title: item.package_name || item.travel_destination || 'Safari Package',
            travel_destination: item.travel_destination || 'Sundarban Safari',
            departure_date: travelDateStr,
            travel_date: travelDateStr,
            booking_date: convDateStr || crDateStr,
            effective_date: travelDateStr || convDateStr || crDateStr, // primary date for calendar view
            total_cost: amount,
            total_travelers: Number(item.number_of_persons || 1),
            total_rooms: Number(item.total_rooms || 1),
            rooms: item.rooms || item.room_details || null,
            room_details: item.room_details || item.rooms || null,
            payment_status: 'PAID', // Won deals treated as confirmed
            is_paid: true,
            booking_status: 2, // Converted / Won deals
            is_confirmed: true,
            converted_by_name: item.converted_by_name || item.assigned_user_name || 'Admin',
            notes: item.conversion_note || item.extra_note || '',
            raw: item
        };
    }
};

/**
 * Combines reservations and manual converted leads into a single unified array
 */
export const unifyBookings = (reservations = [], convertedLeads = []) => {
    const resList = Array.isArray(reservations) 
        ? reservations.map(r => normalizeBookingItem(r, 'RESERVATION')).filter(Boolean)
        : [];

    const leadList = Array.isArray(convertedLeads)
        ? convertedLeads.map(l => normalizeBookingItem(l, 'MANUAL_LEAD')).filter(Boolean)
        : [];

    const all = [...resList, ...leadList];

    // Sort by effective_date descending (newest / latest first)
    all.sort((a, b) => {
        const dateA = a.effective_date || a.booking_date || '';
        const dateB = b.effective_date || b.booking_date || '';
        return dateB.localeCompare(dateA);
    });

    const totalCombinedCount = all.length;
    const totalReservationsCount = resList.length;
    const totalConvertedLeadsCount = leadList.length;

    const totalCombinedRevenue = all.reduce((sum, b) => sum + (b.total_cost || 0), 0);
    const totalReservationsRevenue = resList.reduce((sum, b) => sum + (b.total_cost || 0), 0);
    const totalConvertedLeadsRevenue = leadList.reduce((sum, b) => sum + (b.total_cost || 0), 0);

    return {
        all,
        reservations: resList,
        convertedLeads: leadList,
        stats: {
            totalCombinedCount,
            totalReservationsCount,
            totalConvertedLeadsCount,
            totalCombinedRevenue,
            totalReservationsRevenue,
            totalConvertedLeadsRevenue
        }
    };
};
