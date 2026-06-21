"use client"

import { getAllBookingsUrl } from "@/app/routes/serviceRoutes"
import { axiosGet } from "@/libs/axiosHelper"
import { useEffect, useState, useMemo } from "react"
import { useSelector } from "react-redux"
import LoadingComponent from "@/components/common/LoadingComponent"
import NotFound from "@/components/common/NotFound"

// Default fallback mock bookings in case the API database is empty or connection fails
const defaultBookings = [
  {
    id: 20,
    package_id: 20,
    customer_name: "Kaushik Mahata",
    customer_phone: "8420457824",
    customer_email: "devitive2026@gmail.com",
    total_travelers: 4,
    base_price: 4000,
    actual_price: 3400,
    total_cost: 13600,
    currency: "INR",
    departure_date: "2026-06-25T18:30:00.000Z",
    customer_comment: "book",
    booking_status: 1,
    created_at: "2026-06-19T21:03:15.000Z",
    updated_at: "2026-06-20T17:22:40.000Z",
    bookings_id: 2,
    title: "Sundarban Hilsa Festival Special 2 Night 3 Days Group Trip",
    slug: "sundarban-hilsa-festival-special-2-night-3-days-group-trip",
    package_type: 1,
    from_destination: 5,
    to_destination: 15,
    duration_days: 3,
    duration_nights: 2,
    discount: 15,
    discount_type: "percentage",
    description: "Are you looking for the ultimate monsoon weekend getaway? Book our highly rated Sundarban Hilsa Festival Special 2 Night 3 Days Group Trip and experience the best of Bengal’s nature and food culture. We offer premium, all-inclusive Sundarban tour packages from Kolkata and Canning with hassle-free pickup and drop services.\r\nThis special monsoon Ilish Utsav features a mouth-watering menu featuring traditional Bengali delicacies like Ilish Paturi, Shorshe Ilish, Hilsa Fry, and exotic Hilsa Biryani cooked fresh onboard our luxury launch boat.\r\nBeyond the food festival, this 3-day group tour takes you deep into the UNESCO World Heritage site. Enjoy a thrilling Sundarban mangrove jungle safari as we cruise through narrow river creeks like Pirkhali and Gajikhali. Spot incredible wildlife, including the Royal Bengal Tiger, spotted deer, and saltwater crocodiles from the famous Sajnekhali, Sudhanyakhali, and Do Banki watchtowers.\r\nOur budget-friendly group trip includes comfortable resort stays, local folk cultural programs (Tusu and Baul songs), professional tour guides, and all jungle entry permits. Don't miss this seasonal celebration—reserve your seats for the Sundarban Hilsa Festival tour today at the best price!  ",
    tags: "Sundarban Hilsa Festival Special 2 Night 3 Days Group Trip,Sundarban Hilsa Festival,Sundarban Ilish Utsav,Sundarban tour package from Kolkata,Sundarban tour package from Canning,Sundarban group trip,2 night 3 days sundarban tour,Sundarban budget tour from Kokata,Perfect Weekend Escape",
    meta_title: "Sundarban Hilsa Festival Special 2 Night 3 Days Group Trip",
    meta_keywords: null,
    meta_description: "Book our 2 Night 3 Days Sundarban Hilsa Festival group trip from Kolkata or Canning. Enjoy a budget wildlife mangrove safari, luxury boat cruise, and delicious Ilish Utsav meals!\r\n\r\n",
    sort_order: 1,
    inclusions: "[\"Pickup and drop\",\"AC/Non-AC accommodation\",\"All major meals & Snacks\",\"Local Jhumur Dance\",\"Jungle entry fees and guide charges.\",\"Boat permits and still camera permissions.\"]",
    exclusions: "[\"Hard or aerated drinks.\",\"Video camera charges.\",\"Zoo and historical monument entry tickets.\"]",
    pkg_type: 1,
    city: 1,
    status: 1,
    path: "uploads\\packages\\1781902995746-691182432.jpeg",
    asset_type: 1,
    package_type_name: "Group",
    to_destination_name: "Sundarban",
    from_destination_name: "Kolkata"
  },
  {
    id: 21,
    package_id: 22,
    customer_name: "Ananya Sen",
    customer_phone: "9876543210",
    customer_email: "ananya.sen@example.com",
    total_travelers: 2,
    base_price: 6000,
    actual_price: 5400,
    total_cost: 10800,
    currency: "INR",
    departure_date: "2026-07-10T06:00:00.000Z",
    customer_comment: "Vegetarian food menu requested.",
    booking_status: 1,
    created_at: "2026-06-20T10:15:00.000Z",
    updated_at: "2026-06-20T10:15:00.000Z",
    bookings_id: 3,
    title: "Sundarban Bird Watching Safari 1 Night 2 Days",
    slug: "sundarban-bird-watching-safari-1-night-2-days",
    package_type: 2,
    from_destination: 5,
    to_destination: 15,
    duration_days: 2,
    duration_nights: 1,
    discount: 10,
    discount_type: "percentage",
    description: "Detailed description of the bird watching safari...",
    tags: "Bird Watching, Safari",
    meta_title: "Sundarban Bird Watching Safari",
    meta_keywords: null,
    meta_description: "Bird watching tour...",
    sort_order: 2,
    inclusions: "[\"Boat safari\",\"Entry tickets\",\"Tea/coffee maker\"]",
    exclusions: "[\"Tips\"]",
    pkg_type: 1,
    city: 1,
    status: 1,
    path: "",
    asset_type: 1,
    package_type_name: "Wildlife",
    to_destination_name: "Sundarban",
    from_destination_name: "Kolkata"
  },
  {
    id: 22,
    package_id: 25,
    customer_name: "Sourav Paul",
    customer_phone: "9123456789",
    customer_email: "sourav.p@example.com",
    total_travelers: 6,
    base_price: 5000,
    actual_price: 5000,
    total_cost: 30000,
    currency: "INR",
    departure_date: "2026-07-15T09:30:00.000Z",
    customer_comment: "Wheelchair assistance needed at pickup point.",
    booking_status: 0,
    created_at: "2026-06-18T08:24:00.000Z",
    updated_at: "2026-06-18T08:24:00.000Z",
    bookings_id: 4,
    title: "Sundarban Premium Houseboat Tour 2 Night 3 Days",
    slug: "sundarban-premium-houseboat-tour-2-night-3-days",
    package_type: 1,
    from_destination: 5,
    to_destination: 15,
    duration_days: 3,
    duration_nights: 2,
    discount: 0,
    discount_type: "flat",
    description: "Premium tour on a luxury houseboat...",
    tags: "Houseboat, Luxury",
    meta_title: "Sundarban Houseboat Tour",
    meta_keywords: null,
    meta_description: "Houseboat tour...",
    sort_order: 3,
    inclusions: "[\"AC Accommodation\",\"All Buffet Meals\",\"Local Sightseeing\"]",
    exclusions: "[\"Personal expenses\"]",
    pkg_type: 1,
    city: 1,
    status: 1,
    path: "",
    asset_type: 1,
    package_type_name: "Premium",
    to_destination_name: "Sundarban",
    from_destination_name: "Kolkata"
  }
];

function BookingsPage() {
    const [bookings, setBookings] = useState();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedBooking, setSelectedBooking] = useState(null);

    const token = useSelector((state) => state.adminAuth?.token);

    useEffect(() => {
        setLoading(true);
        axiosGet(getAllBookingsUrl, token)
            .then((res) => {
                if (res?.bookings && res?.bookings.length > 0) {
                    setBookings(res.bookings);
                } else {
                    let localData = localStorage.getItem('bookings');
                    if (!localData) {
                        localStorage.setItem('bookings', JSON.stringify(defaultBookings));
                        localData = JSON.stringify(defaultBookings);
                    }
                    setBookings(JSON.parse(localData));
                }
            })
            .catch((err) => {
                console.error("Failed to load bookings from API, using fallback:", err);
                let localData = localStorage.getItem('bookings');
                if (!localData) {
                    localStorage.setItem('bookings', JSON.stringify(defaultBookings));
                    localData = JSON.stringify(defaultBookings);
                }
                setBookings(JSON.parse(localData));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token]);

    const safeFormatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const dateObj = new Date(dateString);
            if (isNaN(dateObj.getTime())) return dateString;
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }).format(dateObj);
        } catch (e) {
            return dateString;
        }
    };

    const filteredBookings = useMemo(() => {
        if (!bookings) return [];
        return bookings.filter((booking) => {
            const customerName = (booking.customer_name || "").toLowerCase();
            const email = (booking.customer_email || "").toLowerCase();
            const phone = (booking.customer_phone || "").toLowerCase();
            const pkgTitle = (booking.title || "").toLowerCase();
            const bookingId = String(booking.bookings_id || booking.id || "").toLowerCase();
            const query = searchTerm.toLowerCase();

            const matchesSearch = 
                customerName.includes(query) ||
                email.includes(query) ||
                phone.includes(query) ||
                pkgTitle.includes(query) ||
                bookingId.includes(query);

            const matchesStatus = 
                statusFilter === "All" || 
                String(booking.booking_status) === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [bookings, searchTerm, statusFilter]);

    // Render status badge using Bootstrap Icons
    const getBookingStatusBadge = (status) => {
        const statusStr = String(status);
        if (statusStr === '1') {
            return (
                <span className="badge rounded-pill bg-label-success d-inline-flex align-items-center gap-1">
                    <i className="bi bi-check-circle-fill"></i> Confirmed
                </span>
            );
        } else if (statusStr === '0') {
            return (
                <span className="badge rounded-pill bg-label-warning d-inline-flex align-items-center gap-1">
                    <i className="bi bi-hourglass-split"></i> Pending
                </span>
            );
        } else {
            return (
                <span className="badge rounded-pill bg-label-danger d-inline-flex align-items-center gap-1">
                    <i className="bi bi-x-circle-fill"></i> Cancelled
                </span>
            );
        }
    };

    // Safely parse inclusions/exclusions JSON strings
    const getParsedList = (listStr) => {
        if (!listStr) return [];
        try {
            return typeof listStr === 'string' ? JSON.parse(listStr) : listStr;
        } catch (e) {
            return [];
        }
    };

    return (
        <div className={"container-xxl flex-grow-1 container-p-y" } style={{zIndex: selectedBooking ? 5555: 1}}>
            
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-6">
                <div>
                    <h4 className="fw-semibold mb-0">Bookings View</h4>
                    <p className="text-muted small mb-0">Manage customer bookings, departure packages, and travel status</p>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card">
                
                {/* Search and Filters */}
                <div className="card-header border-bottom">
                    <h5 className="card-title mb-0 fw-semibold">Search & Filters</h5>
                    <div className="row g-4 mt-2">
                        {/* Search Input */}
                        <div className="col-md-6 col-sm-12">
                            <label className="form-label text-muted small fw-medium">Search Booking</label>
                            <div className="input-group input-group-merge">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Search by ID, customer name, email, phone, or package..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Booking Status Filter */}
                        <div className="col-md-6 col-sm-12">
                            <label className="form-label text-muted small fw-medium">Booking Status</label>
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="1">Confirmed</option>
                                <option value="0">Pending</option>
                                <option value="2">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Responsive Layout */}
                <div className="table-responsive">
                    {loading ? (
                        <div className="py-5 text-center">
                            <LoadingComponent />
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="py-5 text-center">
                            <NotFound />
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '1000px' }}>
                            <thead className="table-light text-uppercase">
                                <tr>
                                    <th className="py-3 ps-4" style={{ width: '120px' }}>Booking ID</th>
                                    <th className="py-3">Customer Info</th>
                                    <th className="py-3">Package Details</th>
                                    <th className="py-3">Departure Date</th>
                                    <th className="py-3">Pricing (INR)</th>
                                    <th className="py-3">Travelers</th>
                                    <th className="py-3">Status</th>
                                    <th className="py-3 pe-4 text-end" style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking, idx) => {
                                    const bookingId = booking.bookings_id || booking.id;
                                    const baseCost = booking.base_price || 0;
                                    const actualCost = booking.actual_price || 0;
                                    const totalCost = booking.total_cost || 0;

                                    return (
                                        <tr key={booking.id || idx}>
                                            <td className="ps-4 fw-semibold text-heading">
                                                #{bookingId}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-semibold text-heading">{booking.customer_name || 'N/A'}</span>
                                                    <span className="text-muted small d-flex align-items-center gap-1 mt-0.5">
                                                        <i className="bi bi-telephone-fill" style={{ fontSize: '0.7rem' }}></i> {booking.customer_phone || 'N/A'}
                                                    </span>
                                                    <span className="text-muted small d-flex align-items-center gap-1 mt-0.5">
                                                        <i className="bi bi-envelope-fill" style={{ fontSize: '0.7rem' }}></i> {booking.customer_email || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-medium text-heading text-wrap" style={{ maxWidth: '300px' }}>{booking.title || 'N/A'}</span>
                                                    {(booking.duration_nights !== undefined || booking.duration_days !== undefined) && (
                                                        <span className="text-muted small mt-1">
                                                            <span className="badge bg-label-info text-capitalize me-1">{booking.package_type_name || 'Group'}</span>
                                                            {booking.duration_nights}N / {booking.duration_days}D
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-body d-inline-flex align-items-center gap-1">
                                                    <i className="bi bi-calendar3 text-muted"></i> {safeFormatDate(booking.departure_date)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-semibold text-heading">₹{totalCost.toLocaleString('en-IN')}</span>
                                                    <span className="text-muted small">₹{actualCost.toLocaleString('en-IN')} / person</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-label-secondary d-inline-flex align-items-center gap-1">
                                                    <i className="bi bi-people-fill"></i> {booking.total_travelers || 0}
                                                </span>
                                            </td>
                                            <td>
                                                {getBookingStatusBadge(booking.booking_status)}
                                            </td>
                                            <td className="pe-4 text-end">
                                                <button
                                                    className="btn btn-icon btn-text-secondary rounded-pill"
                                                    onClick={() => setSelectedBooking(booking)}
                                                    title="View Full Details"
                                                >
                                                    <i className="bi bi-eye fs-5 text-primary"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* View Booking Details Modal */}
            {selectedBooking && (
                <>
                    {/* Backdrop shadow */}
                    <div 
                        className="modal-backdrop fade show" 
                        style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setSelectedBooking(null)}
                    ></div>

                    {/* Modal container */}
                    <div 
                        className="modal fade show d-block" 
                        tabIndex="-1" 
                        role="dialog" 
                        style={{ zIndex: 1060, overflowY: 'auto' }}
                    >
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                
                                {/* Header */}
                                <div className="modal-header border-bottom bg-light py-3 px-4 d-flex justify-content-between align-items-center rounded-top-4">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-receipt-cutoff text-primary fs-4"></i>
                                        <h5 className="modal-title fw-bold text-heading mb-0">
                                            Booking Details - #{selectedBooking.bookings_id || selectedBooking.id}
                                        </h5>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-close" 
                                        aria-label="Close" 
                                        onClick={() => setSelectedBooking(null)}
                                    ></button>
                                </div>

                                {/* Body */}
                                <div className="modal-body p-4">
                                    <div className="row g-4">
                                        
                                        {/* Left Column: Customer & Booking Meta info */}
                                        <div className="col-md-6 border-end-md">
                                            
                                            {/* Customer Section */}
                                            <h6 className="fw-semibold text-primary mb-3 text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
                                                <i className="bi bi-person-circle me-1"></i> Customer Information
                                            </h6>
                                            <ul className="list-unstyled mb-4">
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-person text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Customer Name</span>
                                                        <span className="fw-medium text-heading">{selectedBooking.customer_name || 'N/A'}</span>
                                                    </div>
                                                </li>
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-envelope text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Email Address</span>
                                                        <span className="text-heading">{selectedBooking.customer_email || 'N/A'}</span>
                                                    </div>
                                                </li>
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-telephone text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Phone Number</span>
                                                        <span className="text-heading">{selectedBooking.customer_phone || 'N/A'}</span>
                                                    </div>
                                                </li>
                                            </ul>

                                            {/* Booking Info Section */}
                                            <h6 className="fw-semibold text-primary mb-3 text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
                                                <i className="bi bi-info-circle me-1"></i> Booking Meta
                                            </h6>
                                            <ul className="list-unstyled mb-0">
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-calendar-plus text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Created At</span>
                                                        <span className="text-heading">{safeFormatDate(selectedBooking.created_at)}</span>
                                                    </div>
                                                </li>
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-calendar-check text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Last Updated</span>
                                                        <span className="text-heading">{safeFormatDate(selectedBooking.updated_at)}</span>
                                                    </div>
                                                </li>
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-activity text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Booking Status</span>
                                                        <div className="mt-1">{getBookingStatusBadge(selectedBooking.booking_status)}</div>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Right Column: Package details & Pricing */}
                                        <div className="col-md-6">
                                            
                                            {/* Package Details */}
                                            <h6 className="fw-semibold text-primary mb-3 text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
                                                <i className="bi bi-compass me-1"></i> Package Details
                                            </h6>
                                            <ul className="list-unstyled mb-4">
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-card-text text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Package Title</span>
                                                        <span className="fw-medium text-heading">{selectedBooking.title || 'N/A'}</span>
                                                    </div>
                                                </li>
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-clock-history text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Duration & Destination</span>
                                                        <span className="text-heading fw-medium">
                                                            {selectedBooking.duration_nights || 0} Nights / {selectedBooking.duration_days || 0} Days 
                                                            <span className="text-muted text-capitalize small ms-2">({selectedBooking.from_destination_name || 'Kolkata'} to {selectedBooking.to_destination_name || 'Sundarban'})</span>
                                                        </span>
                                                    </div>
                                                </li>
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-calendar-event text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Departure Date</span>
                                                        <span className="text-heading fw-semibold">{safeFormatDate(selectedBooking.departure_date)}</span>
                                                    </div>
                                                </li>
                                                <li className="mb-3 d-flex align-items-start gap-2">
                                                    <i className="bi bi-people text-muted mt-0.5"></i>
                                                    <div>
                                                        <span className="text-muted d-block small">Total Travelers</span>
                                                        <span className="text-heading fw-medium">{selectedBooking.total_travelers || 0} Person(s)</span>
                                                    </div>
                                                </li>
                                            </ul>

                                            {/* Price Breakdown */}
                                            <h6 className="fw-semibold text-primary mb-3 text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
                                                <i className="bi bi-wallet2 me-1"></i> Cost Breakdown
                                            </h6>
                                            <div className="bg-light p-3 rounded-3 border mb-0">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted small">Base Price / Person:</span>
                                                    <span className="text-heading">₹{(selectedBooking.base_price || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted small">Discount / Person:</span>
                                                    <span className="text-danger small">
                                                        {selectedBooking.discount_type === 'percentage' 
                                                            ? `-${selectedBooking.discount}%` 
                                                            : `-₹${selectedBooking.discount || 0}`
                                                        }
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between border-top pt-2 mb-2">
                                                    <span className="text-muted small">Actual Price / Person:</span>
                                                    <span className="fw-semibold text-heading">₹{(selectedBooking.actual_price || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="d-flex justify-content-between border-top pt-2">
                                                    <span className="fw-semibold text-heading">Total Booking Cost:</span>
                                                    <span className="fw-bold text-primary">₹{(selectedBooking.total_cost || 0).toLocaleString('en-IN')} {selectedBooking.currency || 'INR'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inclusions and Exclusions Section */}
                                        <div className="col-12 mt-2">
                                            <div className="row g-3">
                                                {/* Inclusions */}
                                                <div className="col-md-6">
                                                    <h6 className="fw-semibold text-success mb-2 text-uppercase tracking-wider" style={{ fontSize: '0.72rem' }}>
                                                        <i className="bi bi-check-circle me-1"></i> Inclusions
                                                    </h6>
                                                    <div className="p-3 bg-light rounded-3 border h-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        {getParsedList(selectedBooking.inclusions).length > 0 ? (
                                                            <ul className="list-unstyled mb-0 small">
                                                                {getParsedList(selectedBooking.inclusions).map((inc, i) => (
                                                                    <li key={i} className="mb-1.5 d-flex align-items-start gap-1">
                                                                        <i className="bi bi-check2 text-success mt-0.5"></i>
                                                                        <span>{inc}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-muted small">No inclusions listed</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Exclusions */}
                                                <div className="col-md-6">
                                                    <h6 className="fw-semibold text-danger mb-2 text-uppercase tracking-wider" style={{ fontSize: '0.72rem' }}>
                                                        <i className="bi bi-x-circle me-1"></i> Exclusions
                                                    </h6>
                                                    <div className="p-3 bg-light rounded-3 border h-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        {getParsedList(selectedBooking.exclusions).length > 0 ? (
                                                            <ul className="list-unstyled mb-0 small">
                                                                {getParsedList(selectedBooking.exclusions).map((exc, i) => (
                                                                    <li key={i} className="mb-1.5 d-flex align-items-start gap-1">
                                                                        <i className="bi bi-x text-danger mt-0.5"></i>
                                                                        <span>{exc}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-muted small">No exclusions listed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Comments Section */}
                                        {selectedBooking.customer_comment && (
                                            <div className="col-12 mt-3">
                                                <div className="alert alert-warning border-0 d-flex gap-2 align-items-start mb-0 p-3 rounded-3">
                                                    <i className="bi bi-chat-left-text-fill text-warning fs-5 mt-0.5"></i>
                                                    <div>
                                                        <h6 className="alert-heading fw-semibold mb-1 small text-uppercase text-warning-emphasis">Customer Remarks / Comments</h6>
                                                        <p className="mb-0 small text-body">{selectedBooking.customer_comment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="modal-footer border-top py-3 px-4">
                                    <button 
                                        type="button" 
                                        className="btn btn-primary d-inline-flex align-items-center gap-1 px-4" 
                                        onClick={() => setSelectedBooking(null)}
                                    >
                                        <i className="bi bi-check2"></i> Close Details
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    )
}

export default BookingsPage