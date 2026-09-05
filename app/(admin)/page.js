'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Home = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace("/crm/calendar");
    }, [router]);

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-50 py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading Booking Calendar...</span>
            </div>
        </div>
    );
};

export default Home;
