'use client'

import { toggleSidebar } from "@/services/reducers/themeSlices";
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from "react-redux";

function HeaderAdmin() {
    const pathname = usePathname();
    const sidebar = useSelector((state) => state?.theme?.sidebar);
    const user = useSelector((state) => state?.adminAuth?.user);
    const permisions = useSelector((state) => state?.permision?.permisions || []);
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

    // Helper to check if current logged in user has access to a specific route
    const hasRouteAccess = (routePath) => {
        if (!user) return false;
        // Super Admin (admin = 1) has unrestricted access to all modules
        if (user.admin === 1) return true;
        // CRM and Logout are always accessible to all admin users
        if (routePath.includes('/crm') || routePath.includes('/whatsapp') || routePath === '/logout') {
            return true;
        }
        // If user is Admin User (admin = 2) without an assigned permission group, strictly deny
        if (!user.permision_group_id && !user.role_id) {
            return false;
        }
        // If no permissions array, deny
        if (!permisions || !Array.isArray(permisions) || permisions.length === 0) {
            return false;
        }
        if (permisions.includes('*')) {
            return true;
        }
        // Check if routePath matches permitted routes
        return permisions.some(p => {
            const r = typeof p === 'string' ? p : p?.route;
            if (!r) return false;
            if (r === routePath) return true;
            if (routePath === '/' && (r === '/dashboard' || r === '/')) return true;
            if (routePath === '/dashboard' && (r === '/dashboard' || r === '/')) return true;
            if (r !== '/' && routePath.startsWith(r + '/')) return true;
            return false;
        });
    };

    // Service section items
    const hasDestination = hasRouteAccess('/zone');
    const hasCities = hasRouteAccess('/cities');
    const hasPackage = hasRouteAccess('/package');
    const hasHotels = hasRouteAccess('/hotels');
    const hasCalendar = hasRouteAccess('/calendar');
    const showServiceSection = hasDestination || hasCities || hasPackage || hasHotels || hasCalendar;

    // Reservations section items
    const hasBookings = hasRouteAccess('/bookings');
    const hasCorporateLead = hasRouteAccess('/corporate-lead');
    const hasCustomPackage = hasRouteAccess('/custom-package');
    const showReservationsSection = hasBookings || hasCorporateLead || hasCustomPackage;

    // Common section items
    const hasWebsiteSettings = hasRouteAccess('/websitesettings');
    const hasGeneralSettings = hasRouteAccess('/generalsettings');
    const hasFaqPages = hasRouteAccess('/faqpages');
    const hasSeoPages = hasRouteAccess('/seopages');
    const hasCommonPages = hasRouteAccess('/commonpages');
    const hasContacts = hasRouteAccess('/contacts');
    const showCommonSection = hasWebsiteSettings || hasGeneralSettings || hasFaqPages || hasSeoPages || hasCommonPages || hasContacts;

    // Blog section items
    const hasBlogCategory = hasRouteAccess('/news/category');
    const hasBlog = hasRouteAccess('/news');
    const showBlogSection = hasBlogCategory || hasBlog;

    // Users & Roles section items
    const hasUsers = hasRouteAccess('/users');
    const hasPermisions = hasRouteAccess('/permision');
    const hasAdminUsers = hasRouteAccess('/adminusers');
    const hasReferrals = hasRouteAccess('/referrals');
    const showUsersRolesSection = hasUsers || hasPermisions || hasAdminUsers || hasReferrals;

    // Dashboard item
    const showDashboard = hasRouteAccess('/dashboard') || hasRouteAccess('/');

    return (
        <>
            <div className={sidebar ? "layout-menu-expanded" : ''}>
                <aside id="layout-menu" className="layout-menu menu-vertical menu">
                    <div className="app-brand demo">
                        <Link href="/" className="app-brand-link">
                            <img src="/images/logo_DS.png" alt="Logo" style={{ width: "150px" }} />
                        </Link>

                        <a className="layout-menu-toggle menu-link text-large ms-auto" onClick={() => { dispatch(toggleSidebar()) }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.47365 11.7183C8.11707 12.0749 8.11707 12.6531 8.47365 13.0097L12.071 16.607C12.4615 16.9975 12.4615 17.6305 12.071 18.021C11.6805 18.4115 11.0475 18.4115 10.657 18.021L5.83009 13.1941C5.37164 12.7356 5.37164 11.9924 5.83009 11.5339L10.657 6.707C11.0475 6.31653 11.6805 6.31653 12.071 6.707C12.4615 7.09747 12.4615 7.73053 12.071 8.121L8.47365 11.7183Z" fillOpacity="0.9" />
                                <path d="M14.3584 11.8336C14.0654 12.1266 14.0654 12.6014 14.3584 12.8944L18.071 16.607C18.4615 16.9975 18.4615 17.6305 18.071 18.021C17.6805 18.4115 17.0475 18.4115 16.657 18.021L11.6819 13.0459C11.3053 12.6693 11.3053 12.0587 11.6819 11.6821L16.657 6.707C17.0475 6.31653 17.6805 6.31653 18.071 6.707C18.4615 7.09747 18.4615 7.73053 18.071 8.121L14.3584 11.8336Z" fillOpacity="0.4" />
                            </svg>
                        </a>
                    </div>

                    <div className="menu-inner-shadow"></div>

                    <ul className="menu-inner py-1" style={{ height: '90vh', overflow: 'hidden', overflowY: 'auto' }}>
                        {/* Dashboards */}
                        {showDashboard && (
                            <li className={`menu-item menu-item-parent ${pathname == "/dashboard" || pathname == "/" ? 'active' : ''}`} onClick={openParentmenu}>
                                <Link href={'/'} className="menu-link">
                                    <i className="menu-icon icon-base ri ri-home-smile-line"></i>
                                    <div data-i18n="Dashboards">Dashboards</div>
                                </Link>
                            </li>
                        )}

                        {/* Service Section */}
                        {showServiceSection && (
                            <>
                                <li className="menu-header small mt-5">
                                    <span className="menu-header-text" data-i18n="Service">Service</span>
                                </li>
                                {hasDestination && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/zone") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/zone" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-map-pin-5-line"></i>
                                            <div data-i18n="Destination">Destination</div>
                                        </Link>
                                    </li>
                                )}
                                {hasCities && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/cities") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/cities" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-map-pin-2-line"></i>
                                            <div data-i18n="Cities">Cities</div>
                                        </Link>
                                    </li>
                                )}
                                {hasPackage && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/package") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/package" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-instance-line"></i>
                                            <div data-i18n="Package">Package</div>
                                        </Link>
                                    </li>
                                )}
                                {hasHotels && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/hotels") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/hotels" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-hotel-line"></i>
                                            <div data-i18n="Hotels">Hotels</div>
                                        </Link>
                                    </li>
                                )}
                                {hasCalendar && (
                                    <li className="menu-item">
                                        <Link href="" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-calendar-line"></i>
                                            <div data-i18n="Calendar">Calendar</div>
                                        </Link>
                                    </li>
                                )}
                            </>
                        )}

                        {/* Reservations Section */}
                        {showReservationsSection && (
                            <>
                                <li className="menu-header small mt-5">
                                    <span className="menu-header-text" data-i18n="Reservations">Reservations</span>
                                </li>
                                {hasBookings && (
                                    <li className={`menu-item menu-item-parent ${pathname == "/bookings" || pathname == "/news/updatebookings" ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/bookings" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-reserved-line"></i>
                                            <div data-i18n="Bookings">Bookings</div>
                                        </Link>
                                    </li>
                                )}
                                {hasCorporateLead && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/corporate-lead") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/corporate-lead" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-briefcase-line"></i>
                                            <div data-i18n="Corporate Lead">Corporate Lead</div>
                                        </Link>
                                    </li>
                                )}
                                {hasCustomPackage && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/custom-package") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/custom-package" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-compass-3-line"></i>
                                            <div data-i18n="Custom Package">Custom Package</div>
                                        </Link>
                                    </li>
                                )}
                            </>
                        )}

                        {/* CRM Section (Always visible for all admins) */}
                        <li className="menu-header small mt-5">
                            <span className="menu-header-text" data-i18n="CRM">CRM</span>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname == "/crm/whatsapp" || pathname == "/crm" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/crm/whatsapp" className="menu-link">
                                <i className="menu-icon icon-base ri ri-whatsapp-line text-success"></i>
                                <div data-i18n="WhatsApp Leads">WhatsApp Leads</div>
                            </Link>
                        </li>
                        {user?.admin === 1 && (
                            <li className={`menu-item menu-item-parent ${pathname == "/crm/assign-leads" ? 'active' : ''}`} onClick={openParentmenu}>
                                <Link href="/crm/assign-leads" className="menu-link">
                                    <i className="menu-icon icon-base ri ri-user-shared-line text-primary"></i>
                                    <div data-i18n="Assign Leads">Assign Leads</div>
                                </Link>
                            </li>
                        )}
                        <li className={`menu-item menu-item-parent ${pathname === "/crm/followups" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/crm/followups" className="menu-link">
                                <i className="menu-icon icon-base ri ri-calendar-check-line text-warning"></i>
                                <div data-i18n="Lead Follow-ups">Lead Follow-ups</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname === "/crm/converted" ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/crm/converted" className="menu-link">
                                <i className="menu-icon icon-base ri ri-checkbox-circle-line text-success"></i>
                                <div data-i18n="Converted Leads">Converted Leads</div>
                            </Link>
                        </li>
                        {user?.admin === 1 && (
                            <>
                                <li className={`menu-item menu-item-parent ${pathname === "/crm/invoices" ? 'active' : ''}`} onClick={openParentmenu}>
                                    <Link href="/crm/invoices" className="menu-link">
                                        <i className="menu-icon icon-base ri ri-bill-line text-primary"></i>
                                        <div data-i18n="Invoices & Billing">Invoices &amp; Billing</div>
                                    </Link>
                                </li>
                                <li className={`menu-item menu-item-parent ${pathname === "/crm/invoices/config" ? 'active' : ''}`} onClick={openParentmenu}>
                                    <Link href="/crm/invoices/config" className="menu-link">
                                        <i className="menu-icon icon-base ri ri-settings-3-line text-secondary"></i>
                                        <div data-i18n="Invoice Configuration">Invoice Configuration</div>
                                    </Link>
                                </li>
                            </>
                        )}
                        <li className={`menu-item menu-item-parent ${pathname.startsWith("/crm/marketing") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/crm/marketing" className="menu-link">
                                <i className="menu-icon icon-base ri ri-megaphone-line text-info"></i>
                                <div data-i18n="WhatsApp Marketing">WhatsApp Marketing</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.startsWith("/crm/calendar") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/crm/calendar" className="menu-link">
                                <i className="menu-icon icon-base ri ri-calendar-event-line text-danger"></i>
                                <div data-i18n="Safari Peak Calendar">Safari Peak Calendar</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.startsWith("/crm/tasks") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/crm/tasks" className="menu-link">
                                <i className="menu-icon icon-base ri ri-kanban-view-2 text-warning"></i>
                                <div data-i18n="Tasks & Kanban">Tasks &amp; Kanban</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.startsWith("/crm/notices") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/crm/notices" className="menu-link">
                                <i className="menu-icon icon-base ri ri-notification-badge-line text-info"></i>
                                <div data-i18n="Notice Board">Notice Board</div>
                            </Link>
                        </li>
                        <li className={`menu-item menu-item-parent ${pathname.startsWith("/crm/chat") ? 'active' : ''}`} onClick={openParentmenu}>
                            <Link href="/crm/chat" className="menu-link">
                                <i className="menu-icon icon-base ri ri-chat-smile-2-line text-success"></i>
                                <div data-i18n="Team Chat">Team Chat</div>
                            </Link>
                        </li>

                        {/* Common Section */}
                        {showCommonSection && (
                            <>
                                <li className="menu-header small mt-5">
                                    <span className="menu-header-text" data-i18n="Common">Common</span>
                                </li>
                                {hasWebsiteSettings && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/websitesettings") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/websitesettings" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-settings-3-line"></i>
                                            <div data-i18n="Website Settings">Website Settings</div>
                                        </Link>
                                    </li>
                                )}
                                {hasGeneralSettings && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/generalsettings") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/generalsettings" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-home-gear-line"></i>
                                            <div data-i18n="General Settings">General Settings</div>
                                        </Link>
                                    </li>
                                )}
                                {hasFaqPages && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/faqpages") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/faqpages" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-question-answer-line"></i>
                                            <div data-i18n="FAQ Pages">FAQ Pages</div>
                                        </Link>
                                    </li>
                                )}
                                {hasSeoPages && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/seopages") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/seopages" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-seo-line"></i>
                                            <div data-i18n="SEO Pages">SEO Pages</div>
                                        </Link>
                                    </li>
                                )}
                                {hasCommonPages && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/commonpages") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/commonpages" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-pages-line"></i>
                                            <div data-i18n="Common Pages">Common Pages</div>
                                        </Link>
                                    </li>
                                )}
                                {hasContacts && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/contacts") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/contacts" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-contacts-line"></i>
                                            <div data-i18n="Contacts">Contacts</div>
                                        </Link>
                                    </li>
                                )}
                            </>
                        )}

                        {/* Blog Section */}
                        {showBlogSection && (
                            <>
                                <li className="menu-header small mt-5">
                                    <span className="menu-header-text" data-i18n="Blog">Blog</span>
                                </li>
                                {hasBlogCategory && (
                                    <li className={`menu-item menu-item-parent ${pathname == "/news/category" || pathname == "/news/addcategory" || pathname == "/news/editcategory" ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/news/category" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-menu-search-line"></i>
                                            <div data-i18n="Blog Category">Blog Category</div>
                                        </Link>
                                    </li>
                                )}
                                {hasBlog && (
                                    <li className={`menu-item menu-item-parent ${pathname == "/news" || pathname == "/news/add" || pathname == "/news/edit" ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/news" className="menu-link">
                                            <i className="menu-icon icon-base ri ri-news-line"></i>
                                            <div data-i18n="Blog">Blog</div>
                                        </Link>
                                    </li>
                                )}
                            </>
                        )}

                        {/* Users & Roles Section */}
                        {showUsersRolesSection && (
                            <>
                                <li className="menu-header small mt-5">
                                    <span className="menu-header-text" data-i18n="Users & Roles">Users & Roles</span>
                                </li>
                                {hasUsers && (
                                    <li className={`menu-item menu-item-parent ${pathname == "/users" || pathname == "/users/add" || pathname == "/users/edit" || pathname == "/users/view" ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/users" className="menu-link">
                                            <i className="icon-base ri ri-user-line menu-icon"></i>
                                            <div data-i18n="Users">Users</div>
                                        </Link>
                                    </li>
                                )}
                                {hasPermisions && (
                                    <li className={`menu-item menu-item-parent ${pathname == "/permision" || pathname == "/permision/add" || pathname == "/permision/edit" || pathname == "/permision/view" ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/permision" className="menu-link">
                                            <i className="icon-base ri ri-shield-check-line menu-icon"></i>
                                            <div data-i18n="Permision Group">Permision Group</div>
                                        </Link>
                                    </li>
                                )}
                                {hasAdminUsers && (
                                    <li className={`menu-item menu-item-parent ${pathname == "/adminusers" || pathname == "/adminusers/add" || pathname == "/adminusers/edit" || pathname == "/adminusers/view" ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/adminusers" className="menu-link">
                                            <i className="icon-base ri ri-shield-user-line menu-icon"></i>
                                            <div data-i18n="Admin Users">Admin Users</div>
                                        </Link>
                                    </li>
                                )}
                                {hasReferrals && (
                                    <li className={`menu-item menu-item-parent ${pathname.includes("/referrals") ? 'active' : ''}`} onClick={openParentmenu}>
                                        <Link href="/referrals" className="menu-link">
                                            <i className="icon-base ri ri-gift-line menu-icon"></i>
                                            <div data-i18n="Referral Program">Referral Program</div>
                                        </Link>
                                    </li>
                                )}
                            </>
                        )}

                        {/* Authentication Section */}
                        <li className="menu-header small mt-5">
                            <span className="menu-header-text" data-i18n="Authentication">Authentication</span>
                        </li>
                        <li className="menu-item">
                            <Link href="/logout" className="menu-link">
                                <i className="icon-base ri ri-logout-box-line menu-icon text-danger"></i>
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

export default HeaderAdmin;