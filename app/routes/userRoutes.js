// Reporter
export const getAllReportersUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/getAllReporter`;
export const getReporterStatusUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/reporterStatus?user=3`;
export const createReporter = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/insertReporter`;


// Admin Users
export const getAllAdminUsersUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/getAllAdminUser`;
export const getAdminUserStatusUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/adminUserStatus?user=2`;
export const createAdminUser = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/insertAdminUser`;
export const getUserSearchUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/getUserSearch`;


// User
export const getAllUsersUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/getAllusers`;
export const getUserStatusUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/usersStatus?user=0`;
export const createUsersUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/insertusers`;
export const getParticulerUsersUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}admin/user/getParticularUser`;
