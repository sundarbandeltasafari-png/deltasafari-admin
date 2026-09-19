const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

// General Settings
export const getSundarbanSettingsUrl = `${serverUrl}admin/sundarban/settings`;
export const updateSundarbanSettingsUrl = `${serverUrl}admin/sundarban/settings`;

// Logo & Branding
export const getSundarbanBrandingUrl = `${serverUrl}admin/sundarban/branding`;
export const updateSundarbanBrandingUrl = `${serverUrl}admin/sundarban/branding`;

// Safari Guide
export const getSundarbanGuideUrl = `${serverUrl}admin/sundarban/guide`;
export const updateSundarbanGuideUrl = `${serverUrl}admin/sundarban/guide`;

// Gallery
export const getSundarbanGalleryUrl = `${serverUrl}admin/sundarban/gallery`;
export const createSundarbanGalleryUrl = `${serverUrl}admin/sundarban/gallery`;
export const updateSundarbanGalleryUrl = (id) => `${serverUrl}admin/sundarban/gallery/${id}`;
export const deleteSundarbanGalleryUrl = (id) => `${serverUrl}admin/sundarban/gallery/${id}`;

// About Us
export const getSundarbanAboutUrl = `${serverUrl}admin/sundarban/about`;
export const updateSundarbanAboutUrl = `${serverUrl}admin/sundarban/about`;

// FAQs
export const getSundarbanFaqsUrl = `${serverUrl}admin/sundarban/faqs`;
export const createSundarbanFaqUrl = `${serverUrl}admin/sundarban/faqs`;
export const updateSundarbanFaqUrl = (id) => `${serverUrl}admin/sundarban/faqs/${id}`;
export const deleteSundarbanFaqUrl = (id) => `${serverUrl}admin/sundarban/faqs/${id}`;

// Contact Details
export const getSundarbanContactUrl = `${serverUrl}admin/sundarban/contact`;
export const updateSundarbanContactUrl = `${serverUrl}admin/sundarban/contact`;

// User Reviews
export const getSundarbanReviewsUrl = `${serverUrl}admin/sundarban/reviews`;
export const createSundarbanReviewUrl = `${serverUrl}admin/sundarban/reviews`;
export const updateSundarbanReviewUrl = (id) => `${serverUrl}admin/sundarban/reviews/${id}`;
export const deleteSundarbanReviewUrl = (id) => `${serverUrl}admin/sundarban/reviews/${id}`;

// Page SEO Manager
export const getSundarbanSeoUrl = `${serverUrl}admin/sundarban/seo`;
export const getSundarbanPageSeoParticularUrl = (key) => `${serverUrl}admin/sundarban/seo/${key}`;
export const updateSundarbanSeoUrl = (key = '') => key ? `${serverUrl}admin/sundarban/seo/${key}` : `${serverUrl}admin/sundarban/seo`;

// Generic Image Upload
export const uploadSundarbanImageUrl = `${serverUrl}admin/sundarban/upload-image`;

// Leads, Bookings, Packages, Stats
export const getSundarbanLeadsUrl = `${serverUrl}admin/sundarban/leads`;
export const getSundarbanBookingsUrl = `${serverUrl}admin/sundarban/bookings`;
export const getSundarbanPackagesUrl = `${serverUrl}admin/sundarban/packages`;
export const getSundarbanStatsUrl = `${serverUrl}admin/sundarban/stats`;
