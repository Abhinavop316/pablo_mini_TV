import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Film,
  History,
  LogOut,
  User as UserIcon,
  Sparkles,
  ExternalLink,
  Users,
  Menu,
  X,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const viewerUrl = (import.meta.env.VITE_VIEWER_URL as string) || 'http://localhost:5174';

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/shows', label: 'Shows & Series', icon: Film },
    { to: '/admin/publish/history', label: 'Publish History', icon: History },
    ...(isAdmin ? [{ to: '/admin/users', label: 'Team & Editors', icon: Users }] : []),
  ];

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Top: Brand & Links */}
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <NavLink
            to="/admin"
            className="peblo-logo-link"
            title="PeBlo Kids CMS Studio"
            onClick={() => isMobile && setMobileMenuOpen(false)}
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

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(84, 52, 136, 0.08)',
                color: '#543488',
                border: '1px solid rgba(84, 52, 136, 0.2)',
              }}
            >
              <X size={20} />
            </button>
          )}
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

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => isMobile && setMobileMenuOpen(false)}
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Open Viewer & User Profile Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '18px', borderTop: '1.5px solid rgba(84, 52, 136, 0.12)' }}>
        {/* Open Viewer CTA */}
        <a
          href={viewerUrl}
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
    </>
  );

  return (
    <div className="studio-layout-container" style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#faf8fd' }}>
      {/* Mobile Topbar with Hamburger Toggle */}
      <header className="studio-mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(84, 52, 136, 0.06)',
              color: '#543488',
              border: '1.5px solid rgba(84, 52, 136, 0.2)',
            }}
          >
            <Menu size={22} />
          </button>

          <NavLink to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="PeBlo" style={{ height: '32px', objectFit: 'contain' }} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#543488',
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid #543488',
                backgroundColor: 'rgba(84, 52, 136, 0.06)',
              }}
            >
              CMS
            </span>
          </NavLink>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '10px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              backgroundColor: isAdmin ? '#543488' : 'rgba(84, 52, 136, 0.1)',
              color: isAdmin ? '#ffffff' : '#543488',
              border: '1px solid #543488',
            }}
          >
            {user?.role}
          </span>
        </div>
      </header>

      {/* Mobile Slide-in Drawer & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="studio-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="studio-mobile-drawer">
            {renderNavContent(true)}
          </div>
        </>
      )}

      {/* Desktop Left Sidebar Navigation */}
      <aside
        className="studio-desktop-sidebar"
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
        {renderNavContent(false)}
      </aside>

      {/* Main Content Area */}
      <main className="studio-main-content animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};
