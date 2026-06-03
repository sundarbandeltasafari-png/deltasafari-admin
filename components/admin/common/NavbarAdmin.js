'use client'

import { toggleSidebar } from "@/services/reducers/themeSlices";
import Link from "next/link"
import { useDispatch, useSelector } from "react-redux"

function NavbarAdmin() {
    function setTheme(theme) {
        if (document.getElementsByTagName('html') && document.getElementsByTagName('html').length > 0) {
            document.getElementsByTagName('html')[0].setAttribute("data-bs-theme", theme)
        }
    }
    const dispatch = useDispatch();
    const user = useSelector((state)=> state?.adminAuth?.user)
    return (
        <>
            <nav
                className="layout-navbar container-xxl navbar-detached navbar navbar-expand-xl align-items-center bg-navbar-theme"
                id="layout-navbar">
                <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
                    <a className="nav-item nav-link px-0 me-xl-6" onClick={()=>{dispatch(toggleSidebar())}}>
                        <i className="icon-base ri ri-menu-line icon-22px"></i>
                    </a>
                </div>

                <div className="navbar-nav-right d-flex align-items-center justify-content-end" id="navbar-collapse">
                    <div className="navbar-nav align-items-center">
                        <div className="nav-item navbar-search-wrapper mb-0">
                            <a className="nav-item nav-link search-toggler px-0" href="javascript:void(0);">
                                <span className="d-inline-block text-body-secondary fw-normal" id="autocomplete"></span>
                            </a>
                        </div>
                    </div>


                    <ul className="navbar-nav flex-row align-items-center ms-md-auto">
                        <li className="nav-item dropdown me-sm-2 me-xl-0">
                            <a
                                className="nav-link dropdown-toggle hide-arrow btn btn-icon btn-text-secondary rounded-pill"
                                id="nav-theme"
                                href="javascript:void(0);"
                                data-bs-toggle="dropdown">
                                <i className="icon-base ri ri-sun-line icon-22px theme-icon-active"></i>
                                <span className="d-none ms-2" id="nav-theme-text">Toggle theme</span>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="nav-theme-text">
                                <li>
                                    <button
                                        type="button"
                                        className="dropdown-item align-items-center active"
                                        data-bs-theme-value="light"
                                        aria-pressed="false"
                                        onClick={() => { setTheme("light") }}
                                    >
                                        <span><i className="icon-base ri ri-sun-line icon-22px me-3" data-icon="sun-line"></i>Light</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="dropdown-item align-items-center"
                                        data-bs-theme-value="dark"
                                        aria-pressed="true"
                                        onClick={() => { setTheme("dark") }}
                                    >
                                        <span ><i className="icon-base ri ri-moon-clear-line icon-22px me-3" data-icon="moon-clear-line"></i>Dark</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="dropdown-item align-items-center"
                                        data-bs-theme-value="system"
                                        aria-pressed="false"
                                        onClick={() => { setTheme("system") }}
                                    >
                                        <span><i className="icon-base ri ri-computer-line icon-22px me-3" data-icon="computer-line"></i>System</span>
                                    </button>
                                </li>
                            </ul>
                        </li>
                        <li className="nav-item navbar-dropdown dropdown-user dropdown">
                            <a className="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown">
                                <div className="avatar avatar-online">
                                    <img src="../../assets/img/avatars/1.png" alt="avatar" className="rounded-circle" />
                                </div>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end mt-3 py-2">
                                <li>
                                    <a className="dropdown-item" href="pages-account-settings-account.html">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-2">
                                                <div className="avatar avatar-online">
                                                    <img
                                                        src="../../assets/img/avatars/1.png"
                                                        alt="alt"
                                                        className="w-px-40 h-auto rounded-circle" />
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-0 small">{user?.first_name+' '+user?.last_name}</h6>
                                                <small className="text-body-secondary">
                                                    {
                                                        user?.admin == 1 ?
                                                        'Admin'
                                                        :
                                                        user?.admin == 2 ?
                                                        'Sub Admin'
                                                        :
                                                        'Unauthorised User'
                                                    }
                                                </small>
                                            </div>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <div className="dropdown-divider"></div>
                                </li>
                                <li>
                                    <a className="dropdown-item" href="pages-profile-user.html">
                                        <i className="icon-base ri ri-user-3-line icon-22px me-3"></i
                                        ><span className="align-middle">My Profile</span>
                                    </a>
                                </li>
                                <li>
                                    <a className="dropdown-item" href="pages-account-settings-account.html">
                                        <i className="icon-base ri ri-settings-4-line icon-22px me-3"></i
                                        ><span className="align-middle">Settings</span>
                                    </a>
                                </li>
                                <li>
                                    <div className="dropdown-divider"></div>
                                </li>
                                <li>
                                    <div className="d-grid px-4 pt-2 pb-1">
                                        <Link className="btn btn-sm btn-danger d-flex" href="/logout">
                                            <small className="align-middle">Logout</small>
                                            <i className="icon-base ri ri-logout-box-r-line ms-2 icon-16px"></i>
                                        </Link>
                                    </div>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </nav>
        </>
    )
}

export default NavbarAdmin