'use client'
import { Fragment, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Dashboard from "@/components/admin/home/Dashboard";

const Home = () => {

    return (
        <>
            <Dashboard />
        </>
    )
}
export default Home;
