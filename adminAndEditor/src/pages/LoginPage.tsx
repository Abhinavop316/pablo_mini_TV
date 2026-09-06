import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PebloLoader } from '../components/PebloLoader';
import { Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please fill in both your email/username and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(identifier.trim(), password);
      navigate('/admin');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          border: '3px solid #543488',
          borderRadius: '38px 22px 42px 24px / 24px 44px 22px 40px',
          padding: '44px 36px',
          boxShadow: '0 20px 48px rgba(84, 52, 136, 0.16)',
          position: 'relative',
          zIndex: 10,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Active Sign-in Popping Loader Overlay */}
        {isSubmitting && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              borderRadius: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 30,
              padding: '24px',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            <PebloLoader
              text="Authenticating & Launching Studio..."
              size="lg"
              minHeight="220px"
            />
          </div>
        )}

        {/* Brand Header with PeBlo Official Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <img
              src="/logo.png"
              alt="PeBlo"
              style={{
                height: '56px',
                objectFit: 'contain',
              }}
              className="animate-float"
            />
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#543488',
              marginBottom: '6px',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Studio Management Console
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(84, 52, 136, 0.8)', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
            Kids Learning Playground Catalogue & Publisher
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fff1f2',
              border: '1.5px solid #e11d48',
              color: '#e11d48',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '20px',
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)',
            }}
          >
            <AlertCircle size={18} color="#e11d48" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#543488', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
              Email Address or Username
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <UserIcon size={18} color="#543488" style={{ position: 'absolute', left: '14px' }} />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@peblo.tv or peblo_admin"
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 44px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid rgba(84, 52, 136, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  color: '#543488',
                  fontSize: '14px',
                  fontFamily: 'var(--font-heading)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#543488')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(84, 52, 136, 0.25)')}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#543488', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} color="#543488" style={{ position: 'absolute', left: '14px' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 44px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid rgba(84, 52, 136, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  color: '#543488',
                  fontSize: '14px',
                  fontFamily: 'var(--font-heading)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#543488')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(84, 52, 136, 0.25)')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-peblo-primary"
            style={{
              marginTop: '8px',
              padding: '14px 24px',
              fontSize: '15px',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In to Console'}
            {!isSubmitting && <ArrowRight size={17} />}
          </button>
        </form>
      </div>
    </div>
  );
};

