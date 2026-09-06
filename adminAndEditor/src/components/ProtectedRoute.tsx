import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { PebloLoader } from './PebloLoader';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <PebloLoader text="Loading application..." minHeight="80vh" size={68} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--text-primary)' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          You are currently logged in as an <strong>Editor</strong>. Publishing operations and admin controls are restricted to <strong>Administrators</strong>.
        </p>
        <a
          href="/admin/shows"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
          }}
        >
          Return to Shows
        </a>
      </div>
    );
  }

  return <Outlet />;
};
