"use client"
import { getMainPermisionRouteUrl, getParticularPermisionUrl } from '@/app/routes/premisionRoute';
import Loading from '@/components/common/Loading';
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import { updatePermision } from '@/services/reducers/permisionSlice';
import axios from 'axios';
import { usePathname, useRouter, useSearchParams } from 'next/navigation'; import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { commonRoutes } from './commonRoutes';
function PermisionWrapper({ children }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const permisionId = urlEncode(9);
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);
    const permisions = useSelector((state) => state.permision?.permisions);
    const dispatch = useDispatch();
    const route = useRouter();
    const allCommonRoutes = commonRoutes();

    async function getPermisionRoute() {
        const response = await axios.get(getMainPermisionRouteUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });
        return response.data;
    }

    async function getPerticularPermision() {
        const response = await axios.get(`${getParticularPermisionUrl}?id=${permisionId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });
        return response.data;
    }

    async function getMyPermisions() {
        return new Promise((resolve, reject) => {
            getPermisionRoute().then((permision) => {
                if (permision.status) {
                    getPerticularPermision().then((res) => {
                        const permisionRoutes = [];
                        if (res.status) {
                            const proutes = JSON.parse(res.permision?.routes);
                            permision.routes.forEach(module => {
                                const match = proutes.find(r => r.route_name == module.id);
                                if (match) {
                                    if (match.view_route) {
                                        permisionRoutes.push(module.viewpath);
                                        permisionRoutes.push(`${module.viewpath}/view`);
                                    }
                                    if (match.add_route) {
                                        permisionRoutes.push(module.addpath);
                                    }
                                    if (match.edit_route) {
                                        permisionRoutes.push(module.editpath);
                                    }
                                }
                            });
                            dispatch(updatePermision({ permisions: permisionRoutes }))
                            resolve(permisionRoutes)
                        } else {
                            reject(new Error('Permisions are not found! Please try again later'));
                        }
                    })
                } else {
                    reject(new Error('Permisions are not found! Please try again later'));
                }
            })
        })
    }

    function detectPermision(permisionArr, mainpathname) {
        if (permisionArr?.length > 0 && !permisionArr.includes(mainpathname) && !allCommonRoutes.includes(mainpathname)) {
            route.push('/error');
            setLoading(false);
            return;
        } else if (permisionArr?.length == 0 && !allCommonRoutes.includes(mainpathname)) {
            route.push('/error');
            setLoading(false);
            return;
        } else {
            setLoading(false);
        }
    }

    useEffect(() => {
        setLoading(true)
        const pathnameArr = pathname.split("/")
        var mainpathname = pathnameArr.join('/');
        if (pathnameArr.length > 3) {
            pathnameArr.pop();
            mainpathname = pathnameArr.join('/');
        }
        if (user && user?.admin == 2) {
            if (permisions && token && pathname == "/") {
                getMyPermisions().then((response) => {
                    detectPermision(response, mainpathname)
                }).catch((err) => {
                    showMessage(err.message);
                    setTimeout(() => {
                        route.push('/error')
                    }, 2000);
                })
            } else if (permisions && token && permisions.length == 0) {
                detectPermision(permisions, mainpathname)
            }
        } else if (user && user?.admin == 1) {
            if (permisions && token && pathname == "/") {
                getPermisionRoute().then((permision) => {
                    if (permision.status) {
                        dispatch(updatePermision({ permisions: permision.routes.flatMap(module => [module.addpath, module.viewpath, module.editpath]) }));
                        setLoading(false)
                    }
                })
            }
        }
        setLoading(false)
    }, [pathname, searchParams]);

    return (
        <>
            {loading ?
                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ width: "50px", height: "50px" }}>
                        <Loading />
                    </div>
                </div>
                :
                <>
                    {children}
                </>}
        </>
    )
}

export default PermisionWrapper