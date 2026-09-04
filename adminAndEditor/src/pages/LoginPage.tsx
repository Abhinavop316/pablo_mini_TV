import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
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
          border: '2px solid #543488',
          borderRadius: 'var(--radius-xl)',
          padding: '44px 36px',
          boxShadow: '0 16px 40px rgba(84, 52, 136, 0.15)',
          position: 'relative',
          zIndex: 10,
        }}
      >
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
              backgroundColor: 'rgba(84, 52, 136, 0.08)',
              border: '1.5px solid #543488',
              color: '#543488',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '20px',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#543488', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} color="#543488" style={{ position: 'absolute', left: '14px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editor@example.com"
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

        {/* Demo Credentials Helper */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1.5px solid rgba(84, 52, 136, 0.15)' }}>
          <p style={{ fontSize: '13px', color: '#543488', textAlign: 'center', marginBottom: '12px', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
            Demo one-click login accounts:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@example.com', 'Admin@123')}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1.5px solid #543488',
                color: '#543488',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 2px 8px rgba(84, 52, 136, 0.08)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#543488';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#543488';
              }}
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('editor@example.com', 'Editor@123')}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1.5px solid #543488',
                color: '#543488',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 2px 8px rgba(84, 52, 136, 0.08)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#543488';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#543488';
              }}
            >
              ✍️ Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
