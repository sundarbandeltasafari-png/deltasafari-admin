"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { reporterTab } from '../../../routes/CreateUserRoutes'
import ReporterTopTab from '../../../../components/reporters/ReporterTopTab'
import TextInput from '../../../../components/common/TextInput'
import PasswordInput from '../../../../components/common/PasswordInput'
import DropFile from '../../../../components/common/DropFile'
import { generatePasswordCustom, showMessage } from '@/libs/commonHelper'
import axios from 'axios'
import { createAdminUser } from "../../../routes/userRoutes"
import { getPermisionsUrl } from '@/app/routes/premisionRoute'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'

function page() {
    const [reporter, setReporter] = useState({
        "account_details": {
            "phone": "",
            "email": "",
            "password": "",
            "confirm_password": "",
            "permision_group_id": ""
        },
        "personal_info": {
            "first_name": "",
            "last_name": "",
            "bio": "",
            "profile_picture_url": "",
            "street": "",
            "city": "",
            "state": "",
            "zip_code": "",
            "country": ""
        },
        "social_links": {
            "twitter": "",
            "facebook": "",
            "instagram": "",
            "linkedin": "",
            "portfolio_url": ""
        },
    })
    const [imagePreview, setImagePreview] = useState('')
    const [currentScreen, setCurrentScreen] = useState(1)
    const [posting, setPosting] = useState(false)
    const [permisionGroups, setPermisionGroups] = useState([])
    const token = useSelector((state) => state.adminAuth?.token)
    const route = useRouter()

    useEffect(() => {
        if (token) {
            axios.get(getPermisionsUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }).then(res => {
                if (res.data?.status && Array.isArray(res.data.permision)) {
                    setPermisionGroups(res.data.permision);
                }
            }).catch(err => {
                console.log("Could not load permission groups:", err.message);
            });
        }
    }, [token]);

    function setReporterValue(value, type, section) {
        if (section === "account_details") {
            setReporter((prev) => ({ ...prev, account_details: { ...prev.account_details, [type]: value } }))
        }
        else if (section === "personal_info") {
            setReporter((prev) => ({ ...prev, personal_info: { ...prev.personal_info, [type]: value } }))
        }
        else if (section === "social_links") {
            setReporter((prev) => ({ ...prev, social_links: { ...prev.social_links, [type]: value } }))
        }
    }

    function goNextPrevious(screen, type) {
        if (screen === "account") {
            const phone = (reporter.account_details.phone || '').toString().trim();
            const email = (reporter.account_details.email || '').toString().trim();
            const password = reporter.account_details.password || '';
            const confirm_password = reporter.account_details.confirm_password || '';

            if (!phone && !email) {
                showMessage("error", "Please provide a valid Phone Number or Email address.");
                return;
            }
            if (!password) {
                showMessage("error", "Please enter a Password.");
                return;
            }
            if (password.length < 6) {
                showMessage("error", "Password must be at least 6 characters long.");
                return;
            }
            if (password !== confirm_password) {
                showMessage("error", "Password and Confirm Password do not match.");
                return;
            }
            if (type === "next") {
                setCurrentScreen(2);
            }
        }
        else if (screen === "profile") {
            const firstName = (reporter.personal_info.first_name || '').trim();
            if (!firstName) {
                showMessage("error", "Please enter First Name.");
                return;
            }
            if (type === "next") {
                setCurrentScreen(3);
            }
        }
    }

    function generatePassword() {
        const password = generatePasswordCustom();
        setReporter((prev) => ({ 
            ...prev, 
            account_details: { 
                ...prev.account_details, 
                password: password, 
                confirm_password: password 
            } 
        }));
    }

    const handleDrop = useCallback(acceptedFiles => {
        acceptedFiles.forEach((file) => {
            const reader = new FileReader()
            reader.onload = () => {
                const binaryStr = reader.result
                if (binaryStr) {
                    setImagePreview(binaryStr)
                    setReporter((prev) => ({ 
                        ...prev, 
                        personal_info: { ...prev.personal_info, profile_picture_url: binaryStr } 
                    }));
                }
            }
            reader.readAsDataURL(file)
        })
    }, [])

    async function handleSubmit() {
        if (posting) {
            return;
        }

        const phone = (reporter.account_details.phone || '').toString().trim();
        const email = (reporter.account_details.email || '').toString().trim();
        const password = reporter.account_details.password || '';
        const confirm_password = reporter.account_details.confirm_password || '';
        const firstName = (reporter.personal_info.first_name || '').trim();

        if (!phone && !email) {
            showMessage("error", "Please provide a valid Phone Number or Email address.");
            setCurrentScreen(1);
            return;
        }
        if (!password || password !== confirm_password) {
            showMessage("error", "Password and Confirm Password must match.");
            setCurrentScreen(1);
            return;
        }
        if (!firstName) {
            showMessage("error", "Please enter First Name.");
            setCurrentScreen(2);
            return;
        }

        setPosting(true);
        try {
            const response = await axios.post(createAdminUser, reporter, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            setPosting(false);
            if (response.data?.status) {
                showMessage("success", "Admin user created successfully!");
                route.push("/adminusers");
            } else {
                showMessage("error", (response.data?.msg || "Something went wrong, please try again later."));
            }
        } catch (error) {
            const errMsg = error.response?.data?.msg || error.response?.data?.message || error.message;
            showMessage('error', `Submission failed: ${errMsg}`);
            setPosting(false);
        }
    }

    return (
        <>
            <div className="container-xxl flex-grow-1 container-p-y">
                <div className="col-12 mb-6">
                    <h4 className="fw-medium">Create Admin User</h4>
                    <div className="bs-stepper wizard-numbered mt-2">
                        <div className="bs-stepper-header">
                            {reporterTab.map((tab, index) => {
                                return <ReporterTopTab key={index} tab={tab} totaltab={reporterTab.length} index={index} activetab={currentScreen} />
                            })}
                        </div>
                        <div className="bs-stepper-content">
                            <form onSubmit={(event) => { event.preventDefault() }}>
                                <div id="account-details" className={`content ${currentScreen == 1 ? "active dstepper-block" : ""}`}>
                                    <div className="content-header mb-4">
                                        <h6 className="mb-0">Account Details</h6>
                                        <small>Enter Admin Account Details & Credentials.</small>
                                    </div>
                                    <div className="row g-5">
                                        <TextInput value={reporter.account_details.phone} required={true} setValue={(e) => { setReporterValue(e.target.value, "phone", "account_details") }} type={"text"} name={"Phone Number"} id={"phone"} placeholder={"9876543210"} />
                                        <TextInput value={reporter.account_details.email} required={true} setValue={(e) => { setReporterValue(e.target.value, "email", "account_details") }} type={"email"} name={"Email Address"} id={"email"} placeholder={"admin@deltasafari.com"} />
                                        
                                        <div className="col-sm-6">
                                            <div className="form-floating form-floating-outline">
                                                <select 
                                                    className="form-select" 
                                                    id="role_select"
                                                    value={reporter.account_details.permision_group_id || ''} 
                                                    onChange={(e) => setReporterValue(e.target.value, "permision_group_id", "account_details")}
                                                >
                                                    <option value="">Select Permission Group / Role</option>
                                                    {permisionGroups.map((group) => (
                                                        <option key={group.id} value={group.id}>{group.name}</option>
                                                    ))}
                                                </select>
                                                <label htmlFor="role_select">Role / Permission Group</label>
                                            </div>
                                        </div>

                                        <PasswordInput name={"Password"} id={"password"} required={true} placeholder={".........."} value={reporter.account_details.password} setValue={(e) => { setReporterValue(e.target.value, "password", "account_details") }} />
                                        <PasswordInput name={"Confirm Password"} required={true} id={"confirm_password"} placeholder={".........."} value={reporter.account_details.confirm_password} setValue={(e) => { setReporterValue(e.target.value, "confirm_password", "account_details") }} />

                                        <div className="col-sm-6 form-password-toggle">
                                            <div className="input-group input-group-merge" style={{ width: "fit-content" }}>
                                                <button type="button" className='btn btn-outline-primary' onClick={generatePassword}>Generate Password</button>
                                            </div>
                                        </div>
                                        <div className="col-12 d-flex justify-content-between">
                                            <button type="button" className="btn btn-outline-secondary btn-prev waves-effect" disabled={true}>
                                                <i className="icon-base ri ri-arrow-left-line icon-sm me-sm-1 me-0"></i>
                                                <span className="align-middle d-sm-inline-block d-none">Previous</span>
                                            </button>
                                            <button type="button" className="btn btn-primary btn waves-effect waves-light" onClick={() => { goNextPrevious("account", "next") }}>
                                                <span className="align-middle d-sm-inline-block d-none me-sm-1">Next</span>
                                                <i className="icon-base ri ri-arrow-right-line icon-sm"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div id="personal-info" className={`content ${currentScreen == 2 ? "active dstepper-block" : ""}`}>
                                    <div className="content-header mb-4">
                                        <h6 className="mb-0">Personal Info</h6>
                                        <small>Enter Admin Personal Details.</small>
                                    </div>
                                    <div className="row g-5">
                                        <TextInput required={true} value={reporter.personal_info.first_name} setValue={(e) => { setReporterValue(e.target.value, "first_name", "personal_info") }} type={"text"} name={"First Name"} id={"first_name"} placeholder={"John"} />
                                        <TextInput required={false} value={reporter.personal_info.last_name} setValue={(e) => { setReporterValue(e.target.value, "last_name", "personal_info") }} type={"text"} name={"Last Name"} id={"last_name"} placeholder={"Doe"} />
                                        <div className="col-sm-12">
                                            <div className="form-floating form-floating-outline mb-6">
                                                <textarea className="form-control h-px-75" value={reporter.personal_info.bio} onChange={(e) => { setReporterValue(e.target.value, "bio", "personal_info") }} id="bio" name="bio" placeholder="Admin bio" rows="3" />
                                                <label htmlFor="bio">Bio</label>
                                            </div>
                                        </div>
                                        <div className='col-sm-12'>
                                            <DropFile onDrop={handleDrop} selectedPic={imagePreview} deleteFile={() => { setReporter({ ...reporter, personal_info: { ...reporter.personal_info, profile_picture_url: '' } }); setImagePreview('') }} />
                                        </div>
                                        <TextInput value={reporter.personal_info.street} setValue={(e) => { setReporterValue(e.target.value, "street", "personal_info") }} type={"text"} name={"Street"} id={"street"} placeholder={""} />
                                        <TextInput value={reporter.personal_info.city} setValue={(e) => { setReporterValue(e.target.value, "city", "personal_info") }} type={"text"} name={"City"} id={"city"} placeholder={""} />
                                        <TextInput value={reporter.personal_info.state} setValue={(e) => { setReporterValue(e.target.value, "state", "personal_info") }} type={"text"} name={"State"} id={"state"} placeholder={""} />
                                        <TextInput value={reporter.personal_info.zip_code} setValue={(e) => { setReporterValue(e.target.value, "zip_code", "personal_info") }} type={"text"} name={"Zip Code"} id={"zip_code"} placeholder={""} />
                                        <div className="col-12 d-flex justify-content-between">
                                            <button type="button" className="btn btn-outline-secondary btn-prev waves-effect" onClick={() => { setCurrentScreen(1) }}>
                                                <i className="icon-base ri ri-arrow-left-line icon-sm me-sm-1 me-0"></i>
                                                <span className="align-middle d-sm-inline-block d-none">Previous</span>
                                            </button>
                                            <button type="button" className="btn btn-primary btn-next waves-effect waves-light" onClick={() => { goNextPrevious("profile", "next") }}>
                                                <span className="align-middle d-sm-inline-block d-none me-sm-1">Next</span>
                                                <i className="icon-base ri ri-arrow-right-line icon-sm"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div id="social-links" className={`content ${currentScreen == 3 ? "active dstepper-block" : ""}`}>
                                    <div className="content-header mb-4">
                                        <h6 className="mb-0">Social Links</h6>
                                        <small>Enter Optional Social Links.</small>
                                    </div>
                                    <div className="row g-5">
                                        <TextInput value={reporter.social_links.twitter} setValue={(e) => { setReporterValue(e.target.value, "twitter", "social_links") }} type={"text"} name={"X (Twitter)"} id={"twitter"} placeholder={"https://twitter.com/abc"} />
                                        <TextInput value={reporter.social_links.facebook} setValue={(e) => { setReporterValue(e.target.value, "facebook", "social_links") }} type={"text"} name={"Facebook"} id={"facebook"} placeholder={"https://facebook.com/abc"} />
                                        <TextInput value={reporter.social_links.linkedin} setValue={(e) => { setReporterValue(e.target.value, "linkedin", "social_links") }} type={"text"} name={"LinkedIn"} id={"linkedIn"} placeholder={"https://linkedin.com/in/abc"} />
                                        <TextInput value={reporter.social_links.portfolio_url} setValue={(e) => { setReporterValue(e.target.value, "portfolio_url", "social_links") }} type={"text"} name={"Portfolio"} id={"portfolio"} placeholder={"https://portfolio.com"} />
                                        <div className="col-12 d-flex justify-content-between">
                                            <button type="button" className="btn btn-outline-secondary btn-prev waves-effect" onClick={() => { setCurrentScreen(2) }}>
                                                <i className="icon-base ri ri-arrow-left-line icon-sm me-sm-1 me-0"></i>
                                                <span className="align-middle d-sm-inline-block d-none">Previous</span>
                                            </button>
                                            <button type="button" disabled={posting} className="btn btn-primary btn-submit waves-effect waves-light" onClick={handleSubmit}>
                                                {posting ? "Creating..." : "Submit"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default page