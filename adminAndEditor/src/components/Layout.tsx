import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Film, UploadCloud, History, LogOut, User as UserIcon, Sparkles, ExternalLink } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#faf8fd' }}>
      {/* Left Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          borderRight: '2px solid rgba(84, 52, 136, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 18px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          boxShadow: '4px 0 20px rgba(84, 52, 136, 0.04)',
        }}
      >
        {/* Top: Logo & Nav Links */}
        <div>
          {/* Logo Brand with Interactive Spring Hover Effect */}
          <div style={{ marginBottom: '28px' }}>
            <NavLink
              to="/admin"
              className="peblo-logo-link"
              title="PeBlo Kids CMS Studio"
            >
              <img
                src="/logo.png"
                alt="PeBlo"
                className="peblo-logo-img"
              />
              <span className="peblo-logo-badge">
                STUDIO CMS
              </span>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'rgba(84, 52, 136, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0 12px',
                marginBottom: '6px',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Menu
            </span>

            <NavLink
              to="/admin"
              end
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>

            <NavLink
              to="/admin/shows"
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <Film size={18} />
              Shows & Series
            </NavLink>

            <NavLink
              to="/admin/publish"
              end
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <UploadCloud size={18} />
              Publish Console
            </NavLink>

            <NavLink
              to="/admin/publish/history"
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <History size={18} />
              Publish History
            </NavLink>
          </nav>
        </div>

        {/* Bottom Section: Open Viewer & User Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '18px', borderTop: '1.5px solid rgba(84, 52, 136, 0.12)' }}>
          {/* Open Viewer CTA */}
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              border: '2px solid #543488',
              color: '#543488',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 2px 8px rgba(84, 52, 136, 0.08)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(84, 52, 136, 0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(84, 52, 136, 0.08)';
            }}
          >
            <Sparkles size={15} />
            Open Viewer <ExternalLink size={13} />
          </a>

          {/* User Profile Card */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(84, 52, 136, 0.04)',
              border: '1.5px solid rgba(84, 52, 136, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <UserIcon size={16} color="#543488" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#543488',
                    fontFamily: 'var(--font-heading)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={user?.email}
                >
                  {user?.email}
                </span>
              </div>
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--font-heading)',
                  backgroundColor: isAdmin ? '#543488' : 'rgba(84, 52, 136, 0.1)',
                  color: isAdmin ? '#ffffff' : '#543488',
                  border: `1px solid #543488`,
                  flexShrink: 0,
                }}
              >
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffffff',
                border: '1.5px solid rgba(84, 52, 136, 0.25)',
                color: '#543488',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#543488';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#543488';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#543488';
                e.currentTarget.style.borderColor = 'rgba(84, 52, 136, 0.25)';
              }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className="animate-fade-in"
        style={{
          flex: 1,
          maxWidth: '1240px',
          width: '100%',
          padding: '40px 48px',
          backgroundColor: '#faf8fd',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};
