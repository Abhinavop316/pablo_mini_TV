import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Play } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        backgroundColor: '#ffffff',
        borderBottom: isScrolled ? '2px solid rgba(84, 52, 136, 0.18)' : '1px solid rgba(84, 52, 136, 0.1)',
        boxShadow: isScrolled ? '0 4px 20px rgba(84, 52, 136, 0.08)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 36px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* PeBlo Logo & Nav Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
            }}
          >
            {/* PeBlo Bubbly Logo */}
            <img
              src="/logo.png"
              alt="PeBlo"
              style={{
                height: '44px',
                objectFit: 'contain',
              }}
              className="animate-float"
            />
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NavLink
              to="/"
              end
              style={({ isActive }) => ({
                fontSize: '15px',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#543488' : 'rgba(84, 52, 136, 0.7)',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isActive ? 'rgba(84, 52, 136, 0.09)' : 'transparent',
                border: isActive ? '1.5px solid #543488' : '1.5px solid transparent',
                transition: 'all 0.2s ease',
              })}
            >
              Home
            </NavLink>
            <NavLink
              to="/shows"
              style={({ isActive }) => {
                const isShowsActive = isActive || location.pathname.startsWith('/show');
                return {
                  fontSize: '15px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: isShowsActive ? 700 : 500,
                  color: isShowsActive ? '#543488' : 'rgba(84, 52, 136, 0.7)',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isShowsActive ? 'rgba(84, 52, 136, 0.09)' : 'transparent',
                  border: isShowsActive ? '1.5px solid #543488' : '1.5px solid transparent',
                  transition: 'all 0.2s ease',
                };
              }}
            >
              Explore Shows
            </NavLink>
          </nav>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Search Button */}
          <button
            type="button"
            onClick={() => navigate('/shows')}
            title="Search Catalogue"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#ffffff',
              border: '1.5px solid rgba(84, 52, 136, 0.2)',
              color: '#543488',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.08)';
              e.currentTarget.style.borderColor = '#543488';
              e.currentTarget.style.transform = 'scale(1.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(84, 52, 136, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Search size={18} />
          </button>

          {/* Watch on YouTube button */}
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: 'var(--radius-full)',
              background: '#543488',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 4px 14px rgba(84, 52, 136, 0.25)',
              border: '2px solid #543488',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
          >
            <Play size={15} fill="#ffffff" />
            Watch On YouTube
          </a>
        </div>
      </div>
    </header>
  );
};
