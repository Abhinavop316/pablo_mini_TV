import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { VerifySetupTokenResponse, CompleteSetupResponse } from '../api/types';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Check,
} from 'lucide-react';


export const SetupPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenData, setTokenData] = useState<VerifySetupTokenResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setVerifyError('No invitation or setup token was provided. Please use the link sent to your email.');
      return;
    }

    const checkToken = async () => {
      try {
        setVerifying(true);
        const res = await api.post<VerifySetupTokenResponse>('/auth/verify-setup-token', { token });
        setTokenData(res.data);
        setVerifyError(null);
      } catch (err: any) {
        const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'This setup link is invalid or has expired.';
        setVerifyError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post<CompleteSetupResponse>('/auth/complete-setup', {
        token,
        password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Failed to complete password setup.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#faf8fd',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Gradient Blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(84, 52, 136, 0.08) 0%, rgba(84, 52, 136, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(84, 52, 136, 0.08) 0%, rgba(84, 52, 136, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          boxShadow: '0 25px 60px -15px rgba(84, 52, 136, 0.25)',
          border: '2px solid rgba(84, 52, 136, 0.15)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Card Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #543488 0%, #3e2268 100%)',
            padding: '36px 32px 28px',
            color: '#ffffff',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <Link to="/login" className="peblo-logo-link" style={{ display: 'inline-flex', marginBottom: '14px' }}>
            <img src="/logo.png" alt="PeBlo" className="peblo-logo-img" style={{ height: '48px' }} />
            <span className="peblo-logo-badge" style={{ backgroundColor: '#ffffff', color: '#543488' }}>
              STUDIO
            </span>
          </Link>
          <h1
            style={{
              fontSize: '26px',
              color: '#ffffff',
              fontWeight: 800,
              margin: '4px 0',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.01em',
            }}
          >
            Activate Your Account
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
            Set your secure studio password to complete email verification
          </p>
        </div>

        <div style={{ padding: '36px 32px' }}>
          {/* LOADING STATE */}
          {verifying && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#543488' }}>
              <RefreshCw size={40} className="spin" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 800, fontSize: '15px', fontFamily: 'var(--font-heading)' }}>
                Verifying your invitation link...
              </p>
            </div>
          )}

          {/* ERROR STATE */}
          {!verifying && verifyError && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#fff1f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  color: '#e11d48',
                  boxShadow: '0 8px 24px rgba(225, 29, 72, 0.2)',
                }}
              >
                <AlertTriangle size={32} />
              </div>
              <h2 style={{ fontSize: '20px', color: '#e11d48', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                Invalid or Expired Link
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(84, 52, 136, 0.8)', lineHeight: 1.5, marginBottom: '24px' }}>
                {verifyError}
              </p>
              <Link
                to="/login"
                className="btn-peblo-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}
              >
                Return to Login
              </Link>
            </div>
          )}

          {/* SUCCESS STATE */}
          {!verifying && !verifyError && isSuccess && (
            <div style={{ textAlign: 'center' }} className="animate-fade-in">
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
                }}
              >
                <Check size={40} strokeWidth={3} />
              </div>
              <h2
                style={{
                  fontSize: '22px',
                  color: '#543488',
                  fontWeight: 800,
                  marginBottom: '10px',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Password Set Successfully! 🎉
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(84, 52, 136, 0.8)', lineHeight: 1.6, marginBottom: '28px' }}>
                Your email address is verified and your studio account is fully active. You can now log in.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-peblo-primary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px',
                  fontSize: '15px',
                }}
              >
                Sign In to PeBlo Studio <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ACTIVE FORM STATE */}
          {!verifying && !verifyError && !isSuccess && tokenData && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Account Info Pill */}
              <div
                style={{
                  backgroundColor: 'rgba(84, 52, 136, 0.05)',
                  border: '1.5px solid rgba(84, 52, 136, 0.15)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Setting Password For
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
                    {tokenData.name ? tokenData.name : tokenData.email}
                  </div>
                  {tokenData.name && (
                    <div style={{ fontSize: '12px', color: 'rgba(84, 52, 136, 0.65)', marginTop: '2px' }}>
                      {tokenData.email}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    backgroundColor: '#543488',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {tokenData.role}
                </span>
              </div>

              {formError && (
                <div
                  style={{
                    padding: '12px 18px',
                    backgroundColor: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '14px',
                    color: '#e11d48',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  {formError}
                </div>
              )}

              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#543488',
                    marginBottom: '8px',
                    display: 'block',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Create New Password (min. 6 characters) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your new password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '14px',
                      fontSize: '15px',
                      paddingRight: '48px',
                      border: '2px solid rgba(84, 52, 136, 0.2)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(84, 52, 136, 0.6)',
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#543488',
                    marginBottom: '8px',
                    display: 'block',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Confirm New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '14px',
                    fontSize: '15px',
                    border: '2px solid rgba(84, 52, 136, 0.2)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-peblo-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '8px',
                }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="spin" /> Verifying & Saving...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} /> Verify Email & Set Password
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
