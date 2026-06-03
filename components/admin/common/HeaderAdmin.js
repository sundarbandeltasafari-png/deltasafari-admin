'use client'

import { toggleSidebar } from "@/services/reducers/themeSlices";
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from "react-redux";
function HeaderAdmin() {
    const pathname = usePathname();
    const sidebar = useSelector((state) => state?.theme?.sidebar);
    const dispatch = useDispatch();
    function openParentmenu(e) {
        Array.from(document.getElementsByClassName('menu-item-parent')).forEach((elem) => {
            elem.classList.remove('open', 'active')
        })
        if (Array.from(e.target.closest('.menu-item-parent').classList).includes('open')) {
            e.target.closest('.menu-item-parent').classList.remove('active', 'open')
        } else {
            e.target.closest('.menu-item-parent').classList.add('active', 'open')
        }
    }
    return (
        <>
            <div className={sidebar && "layout-menu-expanded"}>
                <aside id="layout-menu" className="layout-menu menu-vertical menu">
                    <div className="app-brand demo">
                        <Link href="" className="app-brand-link">
                            <img src="/images/logo_DS.png" style={{ width: "150px" }} />
                        </Link>

                        <a className="layout-menu-toggle menu-link text-large ms-auto" onClick={() => { dispatch(toggleSidebar()) }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.47365 11.7183C8.11707 12.0749 8.11707 12.6531 8.47365 13.0097L12.071 16.607C12.4615 16.9975 12.4615 17.6305 12.071 18.021C11.6805 18.4115 11.0475 18.4115 10.657 18.021L5.83009 13.1941C5.37164 12.7356 5.37164 11.9924 5.83009 11.5339L10.657 6.707C11.0475 6.31653 11.6805 6.31653 12.071 6.707C12.4615 7.09747 12.4615 7.73053 12.071 8.121L8.47365 11.7183Z" fillOpacity="0.9" />
                                <path d="M14.3584 11.8336C14.0654 12.1266 14.0654 12.6014 14.3584 12.8944L18.071 16.607C18.4615 16.9975 18.4615 17.6305 18.071 18.021C17.6805 18.4115 17.0475 18.4115 16.657 18.021L11.6819 13.0459C11.3053 12.6693 11.3053 12.0587 11.6819 11.6821L16.657 6.707C17.0475 6.31653 17.6805 6.31653 18.071 6.707C18.4615 7.09747 18.4615 7.73053 18.071 8.121L14.3584 11.8336Z" fillOpacity="0.4" />
                            </svg>
                        </a>
                    </div>

                    <div className="menu-inner-shadow"></div>

                    <ul className="menu-inner py-1" style={{height: '90vh', overflow: 'hidden', overflowY: 'scroll'}}>
                        <li className={`menu-item menu-item-parent ${pathname == "/dashboard" || pathname == "/" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href={'/'} className="menu-link">
                                <i className="menu-icon icon-base ri ri-home-smile-line"></i>
                                <div data-i18n="Dashboards">Dashboards</div>
                            </Link>
                        </li>

                        <li className="menu-header small mt-5">
                            <span className="menu-header-text" data-i18n="Service">Service</span>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.includes("/zone")? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/zone" className="menu-link">
                                <i className="menu-icon icon-base ri ri-map-pin-5-line"></i>
                                <div data-i18n="Destination">Destination</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.includes("/package") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/package" className="menu-link">
                                <i className="menu-icon icon-base ri ri-instance-line"></i>
                                <div data-i18n="Package">Package</div>
                            </Link>
                        </li>

                        <li className="menu-item">
                            <Link href="" className="menu-link">
                                <i className="menu-icon icon-base ri ri-calendar-line"></i>
                                <div data-i18n="Calendar">Calendar</div>
                            </Link>
                        </li>

                        <li className="menu-header small mt-5">
                            <span className="menu-header-text" data-i18n="Reservations">Reservations</span>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname == "/bookings" || pathname == "/news/updatebookings" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/bookings" className="menu-link">
                                <i className="menu-icon icon-base ri ri-reserved-line"></i>
                                <div data-i18n="Bookings">Bookings</div>
                            </Link>
                        </li>


                        <li className="menu-header small mt-5">
                            <span className="menu-header-text" data-i18n="Common">Common</span>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.includes("/websitesettings") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/websitesettings" className="menu-link">
                                <i className="menu-icon icon-base ri ri-settings-3-line"></i>
                                <div data-i18n="Website Settings">Website Settings</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.includes("/generalsettings") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/generalsettings" className="menu-link">
                                <i className="menu-icon icon-base ri ri-home-gear-line"></i>
                                <div data-i18n="General Settings">General Settings</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.includes("/faqpages") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/faqpages" className="menu-link">
                                <i className="menu-icon icon-base ri ri-question-answer-line"></i>
                                <div data-i18n="FAQ Pages">FAQ Pages</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.includes("/seopages") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/seopages" className="menu-link">
                                <i className="menu-icon icon-base ri ri-seo-line"></i>
                                <div data-i18n="SEO Pages">SEO Pages</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.includes("/commonpages") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/commonpages" className="menu-link">
                                <i className="menu-icon icon-base ri ri-pages-line"></i>
                                <div data-i18n="Common Pages">Common Pages</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.includes("/contacts") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/contacts" className="menu-link">
                                <i className="menu-icon icon-base ri ri-contacts-line"></i>
                                <div data-i18n="Contacts">Contacts</div>
                            </Link>
                        </li>

                        <li className="menu-header small mt-5">
                            <span className="menu-header-text" data-i18n="Blog">Blog</span>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname == "/news/category" || pathname == "/news/addcategory" || pathname == "/news/editcategory" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/news/category" className="menu-link">
                                <i className="menu-icon icon-base ri ri-menu-search-line"></i>
                                <div data-i18n="Blog Category">Blog Category</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname == "/news" || pathname == "/news/add" || pathname == "/news/edit" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/news" className="menu-link">
                                <i className="menu-icon icon-base ri ri-news-line"></i>
                                <div data-i18n="Blog">Blog</div>
                            </Link>
                        </li>

                        <li className="menu-header small mt-5">
                            <span className="menu-header-text" data-i18n="Users & Roles">Users & Roles</span>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname == "/users" || pathname == "/users/add" || pathname == "/users/edit" || pathname == "/users/view" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/users" className={`menu-link`}>
                                <i className="icon-base ri ri-user-line menu-icon "></i>
                                <div data-i18n="Users">Users</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname == "/permision" || pathname == "/permision/add" || pathname == "/permision/edit" || pathname == "/permision/view" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/permision" className="menu-link">
                                <i className="icon-base ri ri-shield-check-line menu-icon "></i>
                                <div data-i18n="Permision Group">Permision Group</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname == "/adminusers" || pathname == "/adminusers/add" || pathname == "/adminusers/edit" || pathname == "/adminusers/view" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/adminusers" className="menu-link">
                                <i className="icon-base ri ri-shield-user-line menu-icon "></i>
                                <div data-i18n="Admin Users">Admin Users</div>
                            </Link>
                        </li>
                        <li className="menu-header small mt-5">
                            <span className="menu-header-text" data-i18n="Authentication">Authentication</span>
                        </li>
                        <li className="menu-item">
                            <Link href="/logout" className="menu-link">
                                <i className="icon-base ri ri-logout-box-line menu-icon "></i>
                                <div data-i18n="Logout">Logout</div>
                            </Link>
                        </li>
                    </ul>
                </aside>

                <div className="menu-mobile-toggler d-xl-none rounded-1">
                    <a className="layout-menu-toggle menu-link text-large text-bg-secondary p-2 rounded-1">
                        <i className="ri ri-menu-line icon-base"></i>
                        <i className="ri ri-arrow-right-s-line icon-base"></i>
                    </a>
                </div>
            </div>
        </>
    )
}

export default HeaderAdmin