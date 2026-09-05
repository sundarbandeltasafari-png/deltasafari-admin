'use client'
import Link from 'next/link';
import axios from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setUser } from '@/services/reducers/adminAuthSlices';
import { updatePermision } from '@/services/reducers/permisionSlice';
import { showMessage } from '@/libs/commonHelper';
import { loginUrl } from '../../routes/authRoutes';

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const route = useRouter();
  const dispatch = useDispatch();

  async function handleSignin() {
    try {
      const response = await axios.post(loginUrl, {
        email,
        password
      });
      return response.data;
    } catch (error) {
      let msg = error?.response?.data?.msg || "Something went wrong, please try again later!";
      if (error.response && error.response.status === 401) {
        msg = error?.response?.data?.msg || "Invalid credentials, please check your email and password.";
      }
      setServerError(msg);
      showMessage("error", `${msg}`);
      return error.response?.data || { status: false, msg };
    }
  }

  const handleFormsubmit = () => {
    if (!email.trim() || !password.trim()) {
      const msg = "Please enter both your email address and password.";
      setServerError(msg);
      showMessage("error", msg);
      return;
    }

    if (!loading) {
      setLoading(true);
      setServerError("");
      handleSignin().then((res) => {
        setLoading(false);
        if (res?.status) {
          dispatch(setUser({ user: res?.userDetails, token: res?.token }));
          const userPerms = res?.permissions || [];
          dispatch(updatePermision({ permisions: userPerms }));
          showMessage("success", "Admin authentication successful!");
          route.push("/crm/calendar");
        } else {
          const msg = res?.msg || "Authentication failed. Please verify credentials.";
          setServerError(msg);
        }
      }).catch((err) => {
        setLoading(false);
        const msg = err?.message || "Connection error. Please try again.";
        setServerError(msg);
        showMessage("error", `Error: ${msg}`);
      });
    }
  }

  return (
    <div className="row align-items-center justify-content-center g-0 min-vh-100 bg-light">
      <div className="col-xxl-4 col-lg-6 col-md-8 col-xs-12 py-8 py-xl-0">
        <div className="card smooth-shadow-md border-0 rounded-4 shadow-lg overflow-hidden">
          <div className="card-body p-6">
            <div className="mb-4 d-flex flex-column justify-content-center align-items-center">
              <Link href="/"><img src="/images/logo_DS.png" className="mb-2" alt="Delta Safari Logo" style={{ width: 180 }} /></Link>
              <h5 className="fw-bold text-dark mt-2 mb-0">Admin Control Center</h5>
              <small className="text-muted">Sign in with your administrator credentials</small>
            </div>

            {serverError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 p-3 rounded-3 mb-4 text-xs border border-danger-subtle">
                <i className="bi bi-exclamation-triangle-fill text-danger fs-5 flex-shrink-0"></i>
                <div className="fw-semibold text-danger-emphasis">{serverError}</div>
              </div>
            )}

            <form onSubmit={(e)=>{e.preventDefault(); handleFormsubmit();}}>
              <div className="mb-3">
                <label htmlFor="exampleInputEmail1" className="form-label text-muted small fw-bold text-uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(event) => { 
                    setEmail(event.target.value);
                    if (serverError) setServerError("");
                  }} 
                  className="form-control" 
                  id="exampleInputEmail1" 
                  placeholder="admin@deltasafari.com"
                  required
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="exampleInputPassword1" className="form-label text-muted small fw-bold text-uppercase mb-0">Password</label>
                  <Link href="/adminsignin/forget-password" className="text-primary small fw-semibold text-decoration-none">
                    Forgot Password?
                  </Link>
                </div>
                <input 
                  type="password" 
                  className="form-control" 
                  name="password" 
                  value={password} 
                  onChange={(event) => { 
                    setPassword(event.target.value);
                    if (serverError) setServerError("");
                  }} 
                  placeholder="••••••••" 
                  id="exampleInputPassword1" 
                  required
                />
              </div>

              <div>
                <div className="d-grid">
                  <button className='btn btn-primary py-2.5 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm' onClick={handleFormsubmit} type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-lock-fill me-1"></i> Sign In to Dashboard
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn;