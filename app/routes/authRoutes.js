const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002/';
const SERVER_URL = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;

export const loginUrl = `${SERVER_URL}admin/login`;
export const adminResetPasswordReqUrl = `${SERVER_URL}admin/resetpassword`;
export const adminVerifyOtpUrl = `${SERVER_URL}admin/verify-otp`;
export const adminResetPasswordUrl = `${SERVER_URL}admin/otpvalidate`;
export const adminResendOtpUrl = `${SERVER_URL}admin/resend-otp`;
export const adminGetUserDetailsUrl = `${SERVER_URL}admin/getUserDetails`;

