import ProviderStore from '@/services/ProviderStore';
import Script from 'next/script';
import React from 'react'
import { Bounce, ToastContainer } from "react-toastify";
import { Geist, Geist_Mono } from "next/font/google";
import "./admin.css";
import PermisionWrapper from '@/permision/PermisionWrapper';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Deltasafari",
    description: "Deltasafari Platform",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-scroll-behavior="smooth" data-bs-theme="light" className={`${geistSans.variable} ${geistMono.variable}`}>
            <head>
                <link rel="icon" type="image/x-icon" href="/assets/img/favicon/favicon.ico" />

                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&ampdisplay=swap"
                    rel="stylesheet" />

                <link rel="stylesheet" href="/assets/vendor/fonts/iconify-icons.css" />
                <link rel="stylesheet" href="/assets/vendor/libs/node-waves/node-waves.css" />

                <link rel="stylesheet" href="/assets/vendor/css/core.css" />
                <link rel="stylesheet" href="/assets/css/demo.css" />

                <link rel="stylesheet" href="/assets/vendor/libs/datatables-bs5/datatables.bootstrap5.css" />
                <link rel="stylesheet" href="/assets/vendor/libs/datatables-responsive-bs5/responsive.bootstrap5.css" />
                <link rel="stylesheet" href="/assets/vendor/libs/datatables-buttons-bs5/buttons.bootstrap5.css" />
                <link rel="stylesheet" href="/assets/vendor/libs/bs-stepper/bs-stepper.css" />
                <link rel="stylesheet" href="/assets/vendor/libs/@form-validation/form-validation.css" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css" />
                <link rel="stylesheet" href="/assets/vendor/libs/dropzone/dropzone.css"></link>
                <Script src="/assets/vendor/js/template-customizer.js"></Script>
            </head>
            <body>
                <div className="layout-wrapper layout-content-navbar">
                    <div className="layout-container">

                        <ToastContainer
                            position="top-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick={false}
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="light"
                            transition={Bounce}
                        />
                        <ProviderStore>
                            <PermisionWrapper>
                                {children}
                            </PermisionWrapper>
                        </ProviderStore>
                    </div>
                </div>
                <Script src="/assets/vendor/libs/jquery/jquery.js"></Script>
                <Script src="/assets/vendor/js/bootstrap.js"></Script>
                <Script src="/assets/vendor/libs/hammer/hammer.js"></Script>
                <Script src="/assets/vendor/libs/i18n/i18n.js"></Script>
            </body>
        </html>
    )
}
