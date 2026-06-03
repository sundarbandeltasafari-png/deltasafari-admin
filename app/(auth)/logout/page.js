"use client"

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { removeUser } from "@/services/reducers/adminAuthSlices";
import { removePermision } from "@/services/reducers/permisionSlice";

function page() {
    const dispatch = useDispatch();
    const route = useRouter();
    useEffect(() => {
        dispatch(removeUser());
        dispatch(removePermision());
        route.push('/adminsignin');
    }, [])

    return null;
}

export default page