import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PebloLoader } from '../components/PebloLoader';
import {
  Lock,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Sparkles,
  Check,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'EDITOR' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (role: 'ADMIN' | 'EDITOR') => {
    setError(null);
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setIdentifier('admin@peblo.tv');
      setPassword('Admin@123');
    } else {
      setIdentifier('editor@peblo.tv');
      setPassword('Editor@123');
    }
  };

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
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          border: '3px solid #543488',
          borderRadius: '38px 22px 42px 24px / 24px 44px 22px 40px',
          padding: '40px 32px',
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
            <img
              src="/logo.png"
              alt="PeBlo"
              style={{
                height: '52px',
                objectFit: 'contain',
              }}
              className="animate-float"
            />
          </div>

          <h1
            style={{
              fontSize: '23px',
              fontWeight: 800,
              color: '#543488',
              marginBottom: '4px',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Studio Management Console
          </h1>
          <p style={{ fontSize: '13.5px', color: 'rgba(84, 52, 136, 0.8)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            Kids Learning Playground Catalogue & Publisher
          </p>
        </div>

        {/* Quick Auto-Fill Role Buttons with Irregular PeBlo Border */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '12px',
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#543488',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <Sparkles size={13} color="#543488" />
            <span>1-Click Quick Auto-Fill</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Admin Auto-Fill Button */}
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              style={{
                padding: '14px 12px',
                border: '2.5px solid #543488',
                borderRadius: '26px 14px 28px 16px / 16px 28px 14px 26px',
                backgroundColor: selectedRole === 'ADMIN' ? '#543488' : '#faf8fd',
                color: selectedRole === 'ADMIN' ? '#ffffff' : '#543488',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: selectedRole === 'ADMIN' ? '0 8px 20px rgba(84, 52, 136, 0.28)' : '0 4px 12px rgba(84, 52, 136, 0.08)',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (selectedRole !== 'ADMIN') {
                  e.currentTarget.style.backgroundColor = '#f4effc';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRole !== 'ADMIN') {
                  e.currentTarget.style.backgroundColor = '#faf8fd';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }
              }}
            >
              {selectedRole === 'ADMIN' && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '-4px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: selectedRole === 'ADMIN' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(84, 52, 136, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedRole === 'ADMIN' ? '#ffffff' : '#543488',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '13.5px', fontFamily: 'var(--font-heading)' }}>
                  Admin
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    opacity: selectedRole === 'ADMIN' ? 0.9 : 0.75,
                    fontFamily: 'monospace',
                    marginTop: '2px',
                  }}
                >
                  admin@peblo.tv
                </div>
              </div>
            </button>

            {/* Editor Auto-Fill Button */}
            <button
              type="button"
              onClick={() => handleQuickFill('EDITOR')}
              style={{
                padding: '14px 12px',
                border: '2.5px solid #543488',
                borderRadius: '16px 28px 14px 26px / 26px 14px 28px 16px',
                backgroundColor: selectedRole === 'EDITOR' ? '#543488' : '#faf8fd',
                color: selectedRole === 'EDITOR' ? '#ffffff' : '#543488',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: selectedRole === 'EDITOR' ? '0 8px 20px rgba(84, 52, 136, 0.28)' : '0 4px 12px rgba(84, 52, 136, 0.08)',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (selectedRole !== 'EDITOR') {
                  e.currentTarget.style.backgroundColor = '#f4effc';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRole !== 'EDITOR') {
                  e.currentTarget.style.backgroundColor = '#faf8fd';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }
              }}
            >
              {selectedRole === 'EDITOR' && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '-4px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: selectedRole === 'EDITOR' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(84, 52, 136, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedRole === 'EDITOR' ? '#ffffff' : '#543488',
                }}
              >
                <Edit3 size={18} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '13.5px', fontFamily: 'var(--font-heading)' }}>
                  Editor
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    opacity: selectedRole === 'EDITOR' ? 0.9 : 0.75,
                    fontFamily: 'monospace',
                    marginTop: '2px',
                  }}
                >
                  editor@peblo.tv
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(84, 52, 136, 0.15)' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(84, 52, 136, 0.5)', textTransform: 'uppercase' }}>
            or enter credentials
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(84, 52, 136, 0.15)' }} />
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setSelectedRole(null);
                }}
                placeholder="admin@peblo.tv or editor@peblo.tv"
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSelectedRole(null);
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
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
              marginTop: '6px',
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: 800,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
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
