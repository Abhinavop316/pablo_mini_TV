import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { PebloLoader } from '../components/PebloLoader';
import type {
  VerifySetupTokenResponse,
  CompleteSetupResponse,
  CheckUsernameResponse,
} from '../api/types';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';

export const SetupPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenData, setTokenData] = useState<VerifySetupTokenResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Form State: Username & Password
  const [desiredUsername, setDesiredUsername] = useState('');
  const [usernameCheck, setUsernameCheck] = useState<{
    loading: boolean;
    available: boolean | null;
    suggestions: string[];
    message: string | null;
  }>({
    loading: false,
    available: null,
    suggestions: [],
    message: null,
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Verify invitation token on mount
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

        // Auto-seed a suggested handle based on name or email prefix
        const baseSeed = res.data.name
          ? res.data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
          : res.data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (baseSeed) {
          setDesiredUsername(baseSeed);
        }
      } catch (err: any) {
        const msg =
          err.response?.data?.detail?.message ||
          err.response?.data?.detail ||
          'This setup link is invalid or has expired.';
        setVerifyError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  // 2. Debounced live availability check against database
  useEffect(() => {
    const cleanUsername = desiredUsername.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setUsernameCheck({
        loading: false,
        available: null,
        suggestions: [],
        message: cleanUsername.length > 0 ? 'Username must be at least 3 characters' : null,
      });
      return;
    }

    setUsernameCheck((prev) => ({ ...prev, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<CheckUsernameResponse>(
          `/auth/check-username?username=${encodeURIComponent(cleanUsername)}`
        );
        setUsernameCheck({
          loading: false,
          available: res.data.available,
          suggestions: res.data.suggestions || [],
          message: res.data.message,
        });
      } catch {
        setUsernameCheck({
          loading: false,
          available: null,
          suggestions: [],
          message: 'Unable to verify handle availability right now.',
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [desiredUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = desiredUsername.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setFormError('Please choose a valid username of at least 3 characters.');
      return;
    }

    if (usernameCheck.available === false) {
      setFormError('The chosen username is already taken. Please choose another or click one of the suggested usernames.');
      return;
    }

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
        username: cleanUsername,
        password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail?.message ||
        err.response?.data?.detail ||
        'Failed to complete account activation.';
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
          maxWidth: '500px',
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
            Choose your unique username handle and set your studio password
          </p>
        </div>

        <div style={{ padding: '36px 32px' }}>
          {/* LOADING STATE */}
          {verifying && (
            <PebloLoader text="Verifying invitation security token..." minHeight="180px" />
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
                Account Activated! 🎉
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(84, 52, 136, 0.8)', lineHeight: 1.6, marginBottom: '28px' }}>
                Your username <strong>@{desiredUsername.trim().toLowerCase()}</strong> and password are saved. You can now log in using either your email or handle.
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
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              {submitting && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(6px)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 30,
                    padding: '24px',
                  }}
                >
                  <PebloLoader text="Activating account & configuring credentials..." size="md" minHeight="200px" />
                </div>
              )}
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
                    Activating Account For
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

              {/* Unique Handle (@Username) with Live DB Check */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#543488',
                      display: 'block',
                      fontFamily: 'var(--font-heading)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Choose Your Handle (@username) *
                  </label>
                  {usernameCheck.loading ? (
                    <span style={{ fontSize: '11px', color: '#543488', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <RefreshCw size={11} className="spin" /> Checking DB...
                    </span>
                  ) : usernameCheck.available === true ? (
                    <span style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}>
                      <Check size={13} strokeWidth={3} /> Available in DB
                    </span>
                  ) : usernameCheck.available === false ? (
                    <span style={{ fontSize: '11px', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}>
                      <X size={13} strokeWidth={3} /> Username Taken
                    </span>
                  ) : null}
                </div>

                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#543488',
                      fontWeight: 800,
                      fontSize: '15px',
                    }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="your_handle"
                    value={desiredUsername}
                    onChange={(e) => setDesiredUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-\.]/g, ''))}
                    className="input-field"
                    style={{
                      paddingLeft: '34px',
                      width: '100%',
                      height: '46px',
                      borderRadius: '14px',
                      fontSize: '15px',
                      fontWeight: 600,
                      border: `2px solid ${
                        usernameCheck.available === true
                          ? '#059669'
                          : usernameCheck.available === false
                          ? '#e11d48'
                          : 'rgba(84, 52, 136, 0.2)'
                      }`,
                    }}
                  />
                </div>

                {/* Suggestions Chip Row */}
                {usernameCheck.suggestions && usernameCheck.suggestions.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(84, 52, 136, 0.7)', fontWeight: 700 }}>
                      Available suggestions:
                    </span>
                    {usernameCheck.suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setDesiredUsername(sug)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(84, 52, 136, 0.08)',
                          border: '1px solid rgba(84, 52, 136, 0.2)',
                          color: '#543488',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          fontFamily: 'monospace',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#543488';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.08)';
                          e.currentTarget.style.color = '#543488';
                        }}
                        title={`Select @${sug}`}
                      >
                        @{sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#543488',
                    marginBottom: '6px',
                    display: 'block',
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Create Password (min. 6 characters) *
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
                      height: '46px',
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

              {/* Confirm Password */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#543488',
                    marginBottom: '6px',
                    display: 'block',
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Confirm Password *
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
                    height: '46px',
                    borderRadius: '14px',
                    fontSize: '15px',
                    border: '2px solid rgba(84, 52, 136, 0.2)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || usernameCheck.available === false}
                className="btn-peblo-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '6px',
                  opacity: submitting || usernameCheck.available === false ? 0.7 : 1,
                  cursor: submitting || usernameCheck.available === false ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="spin" /> Activating Account...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} /> Activate Account & Set Password
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
