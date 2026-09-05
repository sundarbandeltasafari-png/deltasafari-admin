'use client'
import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import HeaderAdmin from '@/components/admin/common/HeaderAdmin';
import NavbarAdmin from '@/components/admin/common/NavbarAdmin';
import Loading from '@/components/common/Loading';
import { updatePermision } from '@/services/reducers/permisionSlice';
import { adminGetUserDetailsUrl } from '../routes/authRoutes';

export default function DashboardLayout({ children }) {
	const [loading, setLoading] = useState(true);
	const isLogin = useSelector((state) => state.adminAuth?.isLogin);
	const user = useSelector((state) => state.adminAuth?.user);
	const token = useSelector((state) => state.adminAuth?.token);
	const permisions = useSelector((state) => state.permision?.permisions || []);
	const route = useRouter();
	const pathname = usePathname();
	const dispatch = useDispatch();

	// Sync live permissions from backend
	const syncPermissions = useCallback(async () => {
		if (!token) return;
		try {
			const res = await axios.get(adminGetUserDetailsUrl, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (res.data?.status && res.data?.permissions) {
				dispatch(updatePermision({ permisions: res.data.permissions }));
			}
		} catch (err) {
			console.error("Error syncing permissions:", err);
		}
	}, [token, dispatch]);

	useEffect(() => {
		if (!isLogin) {
			route.push("/adminsignin");
			return;
		}
		syncPermissions().finally(() => {
			setLoading(false);
		});
	}, [isLogin, syncPermissions, route]);

	// Route guard for Admin Users
	useEffect(() => {
		if (loading || !isLogin || !user) return;

		// Super Admin has access to all pages
		if (user.admin === 1) return;

		// Admin user (non super-admin)
		if (user.admin !== 1) {
			// All CRM routes are common and always allowed for all users
			const alwaysAllowed = ['/crm', '/logout', '/adminusers/view'];
			const isAlwaysAllowed = alwaysAllowed.some(r => pathname === r || pathname.startsWith('/crm'));

			if (isAlwaysAllowed) return;

			// If on root dashboard / or /dashboard
			if (pathname === '/' || pathname === '/dashboard') {
				if (!permisions.includes('/dashboard') && !permisions.includes('*')) {
					route.push('/crm/calendar');
					return;
				}
			}

			// Check general route permissions
			if (permisions.length === 0 || (!permisions.includes('*') && !permisions.some(p => {
				const r = typeof p === 'string' ? p : p?.route;
				if (!r) return false;
				if (r === pathname) return true;
				if (pathname === '/' && (r === '/dashboard' || r === '/')) return true;
				if (pathname === '/dashboard' && (r === '/dashboard' || r === '/')) return true;
				if (r !== '/' && pathname.startsWith(r + '/')) return true;
				return false;
			}))) {
				route.push('/crm/calendar');
			}
		}
	}, [loading, isLogin, user, permisions, pathname, route]);

	useEffect(() => {
		const handleWheel = (e) => {
			if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'number') {
				document.activeElement.blur();
			}
		};
		window.addEventListener('wheel', handleWheel, { passive: true });
		return () => {
			window.removeEventListener('wheel', handleWheel);
		};
	}, []);

	return (
		<>
			<HeaderAdmin />
			<div className="layout-page">
				<NavbarAdmin />
				<div className="content-wrapper">
					{loading ? (
						<div style={{ width: "100%", height: "100%", minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
							<div style={{ width: "50px", height: "50px" }}>
								<Loading />
							</div>
						</div>
					) : (
						<>
							{isLogin && !loading && (
								<>{children}</>
							)}
						</>
					)}
				</div>
			</div>
		</>
	);
}
