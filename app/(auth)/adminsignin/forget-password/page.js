'use client'
import Link from 'next/link';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { showMessage } from '@/libs/commonHelper';
import { 
  adminResetPasswordReqUrl, 
  adminVerifyOtpUrl, 
  adminResetPasswordUrl, 
  adminResendOtpUrl 
} from '../../../routes/authRoutes';

const ForgetPassword = () => {
  const router = useRouter();
  
  // Steps: 1 = Enter Email, 2 = Verify OTP & Set New Password, 3 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Step 1: Request Password Reset OTP via Email
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      const msg = 'Please enter your administrator email address.';
      setServerError(msg);
      showMessage('error', msg);
      return;
    }

    setLoading(true);
    setServerError('');
    setSuccessMsg('');

    try {
      const response = await axios.post(adminResetPasswordReqUrl, { email: email.trim() });
      setLoading(false);

      if (response?.data?.status) {
        setSuccessMsg(response?.data?.msg || 'Password reset OTP has been sent to your email.');
        showMessage('success', 'OTP sent to your email!');
        setStep(2);
        setTimer(60); // 60 seconds cooldown for resend
      } else {
        const msg = response?.data?.msg || 'Failed to send reset email. Please try again.';
        setServerError(msg);
        showMessage('error', msg);
      }
    } catch (error) {
      setLoading(false);
      const msg = error?.response?.data?.msg || error?.message || 'Server error. Please try again.';
      setServerError(msg);
      showMessage('error', msg);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0 || resending) return;

    setResending(true);
    setServerError('');

    try {
      const response = await axios.post(adminResendOtpUrl, { email: email.trim() });
      setResending(false);

      if (response?.data?.status) {
        setSuccessMsg('A new OTP has been sent to your email.');
        showMessage('success', 'New OTP dispatched to your inbox!');
        setTimer(60);
      } else {
        const msg = response?.data?.msg || 'Failed to resend OTP.';
        setServerError(msg);
        showMessage('error', msg);
      }
    } catch (error) {
      setResending(false);
      const msg = error?.response?.data?.msg || error?.message || 'Failed to resend OTP.';
      setServerError(msg);
      showMessage('error', msg);
    }
  };

  // Step 2: Validate OTP and Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();

    if (!otp.trim()) {
      const msg = 'Please enter the 6-digit OTP received in your email.';
      setServerError(msg);
      showMessage('error', msg);
      return;
    }

    if (!password.trim()) {
      const msg = 'Please enter your new password.';
      setServerError(msg);
      showMessage('error', msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setServerError(msg);
      showMessage('error', msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'New password and confirm password do not match.';
      setServerError(msg);
      showMessage('error', msg);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const response = await axios.post(adminResetPasswordUrl, {
        email: email.trim(),
        otp: otp.trim(),
        password: password,
        confirmPassword: confirmPassword
      });

      setLoading(false);

      if (response?.data?.status) {
        showMessage('success', 'Admin password reset successfully!');
        setStep(3);
      } else {
        const msg = response?.data?.msg || 'Failed to reset password. Please check your OTP.';
        setServerError(msg);
        showMessage('error', msg);
      }
    } catch (error) {
      setLoading(false);
      const msg = error?.response?.data?.msg || error?.message || 'Failed to reset password.';
      setServerError(msg);
      showMessage('error', msg);
    }
  };

  return (
    <div className="row align-items-center justify-content-center g-0 min-vh-100 bg-light">
      <div className="col-xxl-4 col-lg-6 col-md-8 col-xs-12 py-8 py-xl-0">
        <div className="card smooth-shadow-md border-0 rounded-4 shadow-lg overflow-hidden">
          <div className="card-body p-6">
            
            {/* Header / Logo */}
            <div className="mb-4 d-flex flex-column justify-content-center align-items-center text-center">
              <Link href="/">
                <img src="/images/logo_DS.png" className="mb-2" alt="Delta Safari Logo" style={{ width: 180 }} />
              </Link>
              <h5 className="fw-bold text-dark mt-2 mb-0">Admin Password Recovery</h5>
              <small className="text-muted">
                {step === 1 && 'Enter your administrator email to receive a password reset OTP.'}
                {step === 2 && `Enter the 6-digit OTP code sent to ${email}`}
                {step === 3 && 'Password recovery completed successfully.'}
              </small>
            </div>

            {/* Error Banner */}
            {serverError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 p-3 rounded-3 mb-4 text-xs border border-danger-subtle">
                <i className="bi bi-exclamation-triangle-fill text-danger fs-5 flex-shrink-0"></i>
                <div className="fw-semibold text-danger-emphasis">{serverError}</div>
              </div>
            )}

            {/* Success Banner (for Step 2) */}
            {successMsg && step === 2 && (
              <div className="alert alert-success d-flex align-items-center gap-2 p-3 rounded-3 mb-4 text-xs border border-success-subtle">
                <i className="bi bi-check-circle-fill text-success fs-5 flex-shrink-0"></i>
                <div className="fw-semibold text-success-emphasis">{successMsg}</div>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp}>
                <div className="mb-4">
                  <label htmlFor="adminEmailInput" className="form-label text-muted small fw-bold text-uppercase">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="adminEmailInput"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (serverError) setServerError('');
                    }}
                    placeholder="admin@deltasafari.com"
                    required
                  />
                </div>

                <div className="d-grid mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary py-2.5 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Sending OTP to Email...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-envelope-fill me-1"></i> Send Verification OTP
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center mt-3">
                  <Link href="/adminsignin" className="text-muted small fw-semibold text-decoration-none d-inline-flex align-items-center gap-1">
                    <i className="bi bi-arrow-left"></i> Back to Admin Sign In
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 2: Enter OTP & Set New Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword}>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="adminOtpInput" className="form-label text-muted small fw-bold text-uppercase mb-0">
                      6-Digit OTP Code
                    </label>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary small fw-semibold text-decoration-none"
                      onClick={() => setStep(1)}
                      style={{ fontSize: '12px' }}
                    >
                      Change Email
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength="6"
                    className="form-control text-center fw-bold fs-5 tracking-wide"
                    id="adminOtpInput"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      if (serverError) setServerError('');
                    }}
                    placeholder="• • • • • •"
                    required
                  />
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-muted small" style={{ fontSize: '12px' }}>
                      Didn't receive the email code?
                    </span>
                    {timer > 0 ? (
                      <span className="badge bg-light text-muted border py-1 px-2" style={{ fontSize: '11px' }}>
                        Resend in {timer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-primary small fw-bold text-decoration-none"
                        onClick={handleResendOtp}
                        disabled={resending}
                        style={{ fontSize: '12px' }}
                      >
                        {resending ? 'Sending...' : 'Resend Code'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="newAdminPassword" className="form-label text-muted small fw-bold text-uppercase">
                    New Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control pe-5"
                      id="newAdminPassword"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (serverError) setServerError('');
                      }}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted text-decoration-none pe-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmAdminPassword" className="form-label text-muted small fw-bold text-uppercase">
                    Confirm New Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control pe-5"
                      id="confirmAdminPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (serverError) setServerError('');
                      }}
                      placeholder="Re-enter new password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted text-decoration-none pe-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="d-grid mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary py-2.5 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-check-fill me-1"></i> Reset Password
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn btn-link text-muted small fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                  >
                    <i className="bi bi-arrow-left"></i> Back to Email Step
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Success State */}
            {step === 3 && (
              <div className="text-center py-4">
                <div className="mb-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success"
                    style={{ width: 72, height: 72 }}
                  >
                    <i className="bi bi-check-lg fs-1"></i>
                  </div>
                </div>
                <h5 className="fw-bold text-dark mb-2">Password Reset Successful!</h5>
                <p className="text-muted small mb-4">
                  Your administrator password has been updated securely. You can now log in using your new credentials.
                </p>
                <div className="d-grid">
                  <Link
                    href="/adminsignin"
                    className="btn btn-primary py-2.5 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i> Proceed to Admin Sign In
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;