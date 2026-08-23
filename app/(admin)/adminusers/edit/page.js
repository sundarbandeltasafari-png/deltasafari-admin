"use client"

import React, { useCallback, useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import axios from 'axios'
import LoadingComponent from '@/components/common/LoadingComponent'
import TextInput from '@/components/common/TextInput'
import PasswordInput from '@/components/common/PasswordInput'
import DropFile from '@/components/common/DropFile'
import { generatePasswordCustom, showMessage } from '@/libs/commonHelper'
import { getParticularAdminUserUrl, updateAdminUserUrl } from '@/app/routes/userRoutes'
import { getPermisionsUrl } from '@/app/routes/premisionRoute'

function EditAdminUserContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('id');
    const token = useSelector((state) => state.adminAuth?.token);

    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [permisionGroups, setPermisionGroups] = useState([]);
    const [imagePreview, setImagePreview] = useState('');

    const [formData, setFormData] = useState({
        account_details: {
            phone: '',
            email: '',
            password: '',
            confirm_password: '',
            permision_group_id: '',
            status: 1
        },
        personal_info: {
            first_name: '',
            last_name: '',
            bio: '',
            profile_picture_url: '',
            street: '',
            city: '',
            state: '',
            zip_code: '',
            country: ''
        },
        social_links: {
            twitter: '',
            facebook: '',
            instagram: '',
            linkedin: '',
            portfolio_url: ''
        }
    });

    useEffect(() => {
        if (!userId) {
            router.push('/adminusers');
            return;
        }

        if (token) {
            // Fetch permission groups
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

            // Fetch particular admin user details
            axios.get(`${getParticularAdminUserUrl}?id=${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }).then(res => {
                if (res.data?.status && res.data?.user) {
                    const u = res.data.user;
                    setFormData({
                        account_details: {
                            phone: u.phone || '',
                            email: u.email || '',
                            password: '',
                            confirm_password: '',
                            permision_group_id: u.permision_group_id || u.role_id || '',
                            status: u.status !== undefined ? u.status : 1
                        },
                        personal_info: {
                            first_name: u.first_name || '',
                            last_name: u.last_name || '',
                            bio: u.bio || '',
                            profile_picture_url: u.profile_picture || '',
                            street: u.street || '',
                            city: u.city || '',
                            state: u.state || '',
                            zip_code: u.zip_code || '',
                            country: u.country || ''
                        },
                        social_links: {
                            twitter: u.socials?.twitter || '',
                            facebook: u.socials?.facebook || '',
                            instagram: u.socials?.instagram || '',
                            linkedin: u.socials?.linkedin || '',
                            portfolio_url: u.socials?.portfolio || ''
                        }
                    });
                    if (u.profile_picture) {
                        setImagePreview(
                            u.profile_picture.startsWith('data:') || u.profile_picture.startsWith('http')
                                ? u.profile_picture
                                : process.env.NEXT_PUBLIC_SERVER_URL + u.profile_picture
                        );
                    }
                } else {
                    showMessage("error", res.data?.msg || "Failed to load admin user.");
                }
            }).catch(err => {
                showMessage("error", "Error loading user: " + (err.response?.data?.msg || err.message));
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [userId, token]);

    const setField = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleDrop = useCallback(acceptedFiles => {
        acceptedFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const binaryStr = reader.result;
                if (binaryStr) {
                    setImagePreview(binaryStr);
                    setField('personal_info', 'profile_picture_url', binaryStr);
                }
            };
            reader.readAsDataURL(file);
        });
    }, []);

    const generatePassword = () => {
        const pwd = generatePasswordCustom();
        setField('account_details', 'password', pwd);
        setField('account_details', 'confirm_password', pwd);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (posting) return;

        const phone = (formData.account_details.phone || '').trim();
        const email = (formData.account_details.email || '').trim();
        const firstName = (formData.personal_info.first_name || '').trim();
        const password = formData.account_details.password || '';
        const confirmPassword = formData.account_details.confirm_password || '';

        if (!phone && !email) {
            showMessage("error", "Please provide a valid Phone Number or Email address.");
            return;
        }

        if (!firstName) {
            showMessage("error", "Please enter First Name.");
            return;
        }

        if (password) {
            if (password.length < 6) {
                showMessage("error", "Password must be at least 6 characters long.");
                return;
            }
            if (password !== confirmPassword) {
                showMessage("error", "Password and Confirm Password do not match.");
                return;
            }
        }

        setPosting(true);
        try {
            const payload = {
                id: userId,
                status: formData.account_details.status,
                account_details: {
                    phone,
                    email,
                    password: password || undefined,
                    permision_group_id: formData.account_details.permision_group_id || null
                },
                personal_info: formData.personal_info,
                social_links: formData.social_links
            };

            const response = await axios.post(updateAdminUserUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            setPosting(false);
            if (response.data?.status || response.status === 200) {
                showMessage("success", "Admin user and permissions updated successfully!");
                router.push('/adminusers');
            } else {
                showMessage("error", response.data?.msg || "Something went wrong, please try again.");
            }
        } catch (error) {
            const errMsg = error.response?.data?.msg || error.response?.data?.message || error.message;
            showMessage("error", `Update failed: ${errMsg}`);
            setPosting(false);
        }
    };

    if (loading) {
        return (
            <div className="container-xxl flex-grow-1 container-p-y py-5">
                <LoadingComponent />
            </div>
        );
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Edit Admin User</h4>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb breadcrumb-style1 mb-0">
                            <li className="breadcrumb-item">
                                <Link href="/adminusers">Admin Users</Link>
                            </li>
                            <li className="breadcrumb-item active">Edit User #{userId}</li>
                        </ol>
                    </nav>
                </div>
                <div className="d-flex gap-2">
                    <Link href={`/adminusers/view?id=${userId}`} className="btn btn-outline-secondary">
                        <i className="ri-eye-line me-1"></i> View Profile
                    </Link>
                    <Link href="/adminusers" className="btn btn-outline-secondary">
                        <i className="ri-arrow-left-line me-1"></i> Back to List
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row g-4">
                    {/* Account & Role Section */}
                    <div className="col-12">
                        <div className="card shadow-sm border-0">
                            <div className="card-header border-bottom py-3 d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0 fw-bold">1. Account Credentials & Role Permissions</h5>
                                <span className="badge bg-primary bg-opacity-10 text-primary">Required</span>
                            </div>
                            <div className="card-body pt-4">
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="Phone Number" 
                                            id="edit_phone" 
                                            required={true}
                                            value={formData.account_details.phone} 
                                            setValue={(e) => setField('account_details', 'phone', e.target.value)} 
                                            placeholder="9876543210" 
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="Email Address" 
                                            id="edit_email" 
                                            type="email"
                                            required={true}
                                            value={formData.account_details.email} 
                                            setValue={(e) => setField('account_details', 'email', e.target.value)} 
                                            placeholder="admin@deltasafari.com" 
                                        />
                                    </div>

                                    {/* Role Selection */}
                                    <div className="col-md-6">
                                        <div className="form-floating form-floating-outline">
                                            <select 
                                                className="form-select" 
                                                id="role_select"
                                                value={formData.account_details.permision_group_id || ''} 
                                                onChange={(e) => setField('account_details', 'permision_group_id', e.target.value)}
                                            >
                                                <option value="">Select Permission Group / Role</option>
                                                {permisionGroups.map((group) => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                            <label htmlFor="role_select">Assign Role / Permission Group</label>
                                        </div>
                                    </div>

                                    {/* Account Status */}
                                    <div className="col-md-6">
                                        <div className="form-floating form-floating-outline">
                                            <select 
                                                className="form-select" 
                                                id="status_select"
                                                value={formData.account_details.status} 
                                                onChange={(e) => setField('account_details', 'status', parseInt(e.target.value))}
                                            >
                                                <option value={1}>Active</option>
                                                <option value={0}>Inactive / Suspended</option>
                                            </select>
                                            <label htmlFor="status_select">Account Status</label>
                                        </div>
                                    </div>

                                    {/* Password Reset (Optional) */}
                                    <div className="col-12">
                                        <div className="p-3 bg-light rounded-3 border border-dashed">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h6 className="mb-0 fw-bold">Change Password (Optional)</h6>
                                                    <small className="text-muted">Leave blank if you do not wish to change the password.</small>
                                                </div>
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={generatePassword}>
                                                    Generate Password
                                                </button>
                                            </div>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <PasswordInput 
                                                        name="New Password" 
                                                        id="new_password" 
                                                        placeholder="Leave blank to keep unchanged" 
                                                        value={formData.account_details.password} 
                                                        setValue={(e) => setField('account_details', 'password', e.target.value)} 
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <PasswordInput 
                                                        name="Confirm New Password" 
                                                        id="confirm_new_password" 
                                                        placeholder="Confirm new password" 
                                                        value={formData.account_details.confirm_password} 
                                                        setValue={(e) => setField('account_details', 'confirm_password', e.target.value)} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal & Address Information */}
                    <div className="col-12">
                        <div className="card shadow-sm border-0">
                            <div className="card-header border-bottom py-3">
                                <h5 className="card-title mb-0 fw-bold">2. Personal & Address Information</h5>
                            </div>
                            <div className="card-body pt-4">
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="First Name" 
                                            id="edit_first_name" 
                                            required={true}
                                            value={formData.personal_info.first_name} 
                                            setValue={(e) => setField('personal_info', 'first_name', e.target.value)} 
                                            placeholder="John" 
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="Last Name" 
                                            id="edit_last_name" 
                                            value={formData.personal_info.last_name} 
                                            setValue={(e) => setField('personal_info', 'last_name', e.target.value)} 
                                            placeholder="Doe" 
                                        />
                                    </div>
                                    <div className="col-12">
                                        <div className="form-floating form-floating-outline">
                                            <textarea 
                                                className="form-control h-px-75" 
                                                id="edit_bio" 
                                                value={formData.personal_info.bio} 
                                                onChange={(e) => setField('personal_info', 'bio', e.target.value)} 
                                                placeholder="Biography" 
                                                rows="3" 
                                            />
                                            <label htmlFor="edit_bio">Biography</label>
                                        </div>
                                    </div>

                                    {/* Profile Picture Upload */}
                                    <div className="col-12">
                                        <label className="text-muted small fw-bold text-uppercase d-block mb-2">Profile Picture</label>
                                        <DropFile 
                                            onDrop={handleDrop} 
                                            selectedPic={imagePreview} 
                                            deleteFile={() => { 
                                                setField('personal_info', 'profile_picture_url', ''); 
                                                setImagePreview(''); 
                                            }} 
                                        />
                                    </div>

                                    {/* Address Details */}
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="Street Address" 
                                            id="edit_street" 
                                            value={formData.personal_info.street} 
                                            setValue={(e) => setField('personal_info', 'street', e.target.value)} 
                                            placeholder="123 Main St" 
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="City" 
                                            id="edit_city" 
                                            value={formData.personal_info.city} 
                                            setValue={(e) => setField('personal_info', 'city', e.target.value)} 
                                            placeholder="City" 
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <TextInput 
                                            name="State" 
                                            id="edit_state" 
                                            value={formData.personal_info.state} 
                                            setValue={(e) => setField('personal_info', 'state', e.target.value)} 
                                            placeholder="State" 
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <TextInput 
                                            name="Zip Code" 
                                            id="edit_zip_code" 
                                            value={formData.personal_info.zip_code} 
                                            setValue={(e) => setField('personal_info', 'zip_code', e.target.value)} 
                                            placeholder="700001" 
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <TextInput 
                                            name="Country" 
                                            id="edit_country" 
                                            value={formData.personal_info.country} 
                                            setValue={(e) => setField('personal_info', 'country', e.target.value)} 
                                            placeholder="India" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Links Section */}
                    <div className="col-12">
                        <div className="card shadow-sm border-0">
                            <div className="card-header border-bottom py-3">
                                <h5 className="card-title mb-0 fw-bold">3. Social Links (Optional)</h5>
                            </div>
                            <div className="card-body pt-4">
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="X (Twitter)" 
                                            id="edit_twitter" 
                                            value={formData.social_links.twitter} 
                                            setValue={(e) => setField('social_links', 'twitter', e.target.value)} 
                                            placeholder="https://twitter.com/username" 
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="Facebook" 
                                            id="edit_facebook" 
                                            value={formData.social_links.facebook} 
                                            setValue={(e) => setField('social_links', 'facebook', e.target.value)} 
                                            placeholder="https://facebook.com/username" 
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="LinkedIn" 
                                            id="edit_linkedin" 
                                            value={formData.social_links.linkedin} 
                                            setValue={(e) => setField('social_links', 'linkedin', e.target.value)} 
                                            placeholder="https://linkedin.com/in/username" 
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <TextInput 
                                            name="Portfolio / Website" 
                                            id="edit_portfolio" 
                                            value={formData.social_links.portfolio_url} 
                                            setValue={(e) => setField('social_links', 'portfolio_url', e.target.value)} 
                                            placeholder="https://portfolio.com" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="col-12 text-end d-flex justify-content-end gap-3 pt-2 mb-5">
                        <Link href="/adminusers" className="btn btn-outline-secondary px-4">
                            Cancel
                        </Link>
                        <button type="submit" disabled={posting} className="btn btn-primary px-5 shadow-sm">
                            {posting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Saving Changes...
                                </>
                            ) : (
                                <>
                                    <i className="ri-save-line me-1"></i> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function EditAdminUserPage() {
    return (
        <Suspense fallback={<div className="container-xxl flex-grow-1 container-p-y py-5"><LoadingComponent /></div>}>
            <EditAdminUserContent />
        </Suspense>
    );
}