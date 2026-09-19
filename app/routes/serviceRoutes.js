const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002/';
const SERVER_URL = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;

//  Category Routes
export const getAllCategoryUrl = `${SERVER_URL}admin/service/getCategory`;
export const createCategoryUrl = `${SERVER_URL}admin/service/createCategory`;
export const getParticularCategoryUrl = `${SERVER_URL}admin/service/getParticularCategory`;
export const setCategoryUrl = `${SERVER_URL}admin/service/setCategory`;

// Post Routes
export const getAllNewsUrl = `${SERVER_URL}admin/service/getPosts`;
export const getParticularNewsUrl = `${SERVER_URL}admin/service/getParticularPost`;
export const deleteNewsUrl = `${SERVER_URL}admin/service/deletePost`;
export const createNewsUrl = `${SERVER_URL}admin/service/createPosts`;
export const updateNewsUrl = `${SERVER_URL}admin/service/updatePosts`;


// Zone urls
export const getAllZoneUrl = `${SERVER_URL}admin/service/getZone`;
export const createZoneUrl = `${SERVER_URL}admin/service/createZone`;
export const getParticularZoneUrl = `${SERVER_URL}admin/service/getParticularZone`;
export const setZoneUrl = `${SERVER_URL}admin/service/setZone`;
export const deleteZoneUrl = `${SERVER_URL}admin/service/deleteZone`;


// Package types
export const getAllPackageTypeUrl = `${SERVER_URL}admin/package/getAllPackageType`;

// City Routes
export const getAllCityUrl = `${SERVER_URL}admin/service/getCity`;
export const getAllCountriesUrl = `${SERVER_URL}admin/service/getAllCountries`;
export const createCityUrl = `${SERVER_URL}admin/service/createCity`;
export const deleteCityUrl = `${SERVER_URL}admin/service/deleteCity`;
export const getParticularCityUrl = `${SERVER_URL}admin/service/getParticularCity`;
export const updateCityUrl = `${SERVER_URL}admin/service/updateCity`;


// Bookings
export const getAllBookingsUrl = `${SERVER_URL}admin/service/getAllBookings`;
export const getCombinedBookingsUrl = `${SERVER_URL}admin/service/getCombinedBookings`;
export const getParticularBookingUrl = `${SERVER_URL}admin/service/getParticularBooking`;
export const updateBookingUrl = `${SERVER_URL}admin/service/updateBooking`;
export const deleteBookingUrl = `${SERVER_URL}admin/service/deleteBooking`;

// Dashboard URL
export const getDashboardUrl = `${SERVER_URL}admin/service/getDashboard`;

// Corporate Lead Enquiries
export const getAllCorporateLeadEnquiriesUrl = `${SERVER_URL}admin/service/getAllCorporateLeadEnquiries`;
export const getParticularCorporateLeadEnquiryUrl = `${SERVER_URL}admin/service/getParticularCorporateLeadEnquiry`;
export const updateCorporateLeadEnquiryUrl = `${SERVER_URL}admin/service/updateCorporateLeadEnquiry`;

// Custom Package / Holiday Enquiries
export const getAllHolidayEnquiriesUrl = `${SERVER_URL}admin/service/getAllHolidayEnquiries`;
export const getParticularHolidayEnquiryUrl = `${SERVER_URL}admin/service/getParticularHolidayEnquiry`;
export const updateHolidayEnquiryUrl = `${SERVER_URL}admin/service/updateHolidayEnquiry`;
export const createHolidayEnquiryWhatsAppLeadUrl = `${SERVER_URL}admin/service/createHolidayEnquiryWhatsAppLead`;

// Contact Queries
export const getAllContactQueriesUrl = `${SERVER_URL}admin/service/getAllContactQueries`;
export const getParticularContactQueryUrl = `${SERVER_URL}admin/service/getParticularContactQuery`;
export const updateContactQueryUrl = `${SERVER_URL}admin/service/updateContactQuery`;
export const deleteContactQueryUrl = `${SERVER_URL}admin/service/deleteContactQuery`;

// Hotels / Reference Hotels
export const getAllHotelsUrl = `${SERVER_URL}admin/service/getHotels`;
export const getAllHotelsDropdownUrl = `${SERVER_URL}admin/service/getAllHotelsDropdown`;
export const getParticularHotelUrl = `${SERVER_URL}admin/service/getParticularHotel`;
export const createHotelUrl = `${SERVER_URL}admin/service/createHotel`;
export const updateHotelUrl = `${SERVER_URL}admin/service/updateHotel`;
export const deleteHotelUrl = `${SERVER_URL}admin/service/deleteHotel`;