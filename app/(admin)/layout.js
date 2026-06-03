'use client'
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import HeaderAdmin from '@/components/admin/common/HeaderAdmin';
import NavbarAdmin from '@/components/admin/common/NavbarAdmin';
import Loading from '@/components/common/Loading';

export default function DashboardLayout({ children }) {
	const [showMenu, setShowMenu] = useState(true);
	const [loading, setLoading] = useState(true)
	const ToggleMenu = () => {
		return setShowMenu(!showMenu);
	};
	const isLogin = useSelector((state) => state.adminAuth?.isLogin)
	const route = useRouter();

	useEffect(() => {
		if (!isLogin) {
			route.push("adminsignin")
		}
		setLoading(false)
	}, [])

	return (
		<>
			<HeaderAdmin />
			<div className="layout-page">
				<NavbarAdmin />
				<div className="content-wrapper">
					{loading ?
						<div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
							<div style={{ width: "50px", height: "50px" }}>
								<Loading />
							</div>
						</div>
						:
						<>
							{isLogin && !loading && <>
								{children}
							</>}
						</>}
				</div>
			</div>
		</>
	)
}
