import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, ArrowUp, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        backgroundColor: '#faf8fd',
        borderTop: '2px solid rgba(84, 52, 136, 0.12)',
        paddingTop: '60px',
        paddingBottom: '40px',
        color: '#543488',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 48px' }}>
        {/* Main Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Brand Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img
                src="/logo.png"
                alt="PeBlo"
                style={{
                  height: '42px',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#543488',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Peblo
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: '#543488',
                    color: '#ffffff',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '0.04em',
                  }}
                >
                  TV MINI
                </span>
              </div>
            </Link>

            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(84, 52, 136, 0.75)', margin: 0 }}>
              The safe, curiosity-driven streaming experience for kids. Explore award-winning shows, learning minisodes, and animated songs!
            </p>

            {/* Kid-Safe Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                backgroundColor: 'rgba(84, 52, 136, 0.06)',
                border: '1px solid rgba(84, 52, 136, 0.18)',
                borderRadius: 'var(--radius-full)',
                width: 'fit-content',
                fontSize: '12px',
                fontWeight: 700,
                color: '#543488',
              }}
            >
              <ShieldCheck size={16} color="#15803d" />
              <span>100% Kid-Safe & COPPA Family Friendly</span>
            </div>
          </div>

          {/* Explore Sections */}
          <div>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#543488',
                marginBottom: '18px',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Explore Channels
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link
                  to="/"
                  style={{ color: 'rgba(84, 52, 136, 0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(84, 52, 136, 0.8)')}
                >
                  ⭐ Featured Shows
                </Link>
              </li>
              <li>
                <Link
                  to="/shows?section=series"
                  style={{ color: 'rgba(84, 52, 136, 0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(84, 52, 136, 0.8)')}
                >
                  📺 Animated Series
                </Link>
              </li>
              <li>
                <Link
                  to="/shows?section=minisodes"
                  style={{ color: 'rgba(84, 52, 136, 0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(84, 52, 136, 0.8)')}
                >
                  ⏱️ Learning Minisodes
                </Link>
              </li>
              <li>
                <Link
                  to="/shows?section=songs"
                  style={{ color: 'rgba(84, 52, 136, 0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(84, 52, 136, 0.8)')}
                >
                  🎵 Singalong & Lyrical Songs
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#543488',
                marginBottom: '18px',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Curated Topics
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Adventure', 'Science', 'Nature', 'Maths', 'Reading', 'Friendship', 'Travel', 'Values'].map((tag) => (
                <Link
                  key={tag}
                  to={`/shows?category=${tag.toLowerCase()}`}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid rgba(84, 52, 136, 0.18)',
                    color: '#543488',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#543488';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#543488';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Languages & Parents */}
          <div>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#543488',
                marginBottom: '18px',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Languages & Support
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(84, 52, 136, 0.85)', fontWeight: 600 }}>
                <Globe size={16} />
                <span>Available in: <strong>English (EN)</strong> & <strong>Hindi (HI)</strong></span>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(84, 52, 136, 0.65)', lineHeight: 1.5, margin: 0 }}>
                Parental controls and multi-language audio tracks are automatically synchronized with published episodes.
              </p>
              <button
                type="button"
                onClick={scrollToTop}
                style={{
                  marginTop: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid rgba(84, 52, 136, 0.25)',
                  color: '#543488',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: 'fit-content',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <ArrowUp size={14} /> Back to Top
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal Line */}
        <div
          style={{
            borderTop: '1px solid rgba(84, 52, 136, 0.12)',
            paddingTop: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '13px',
            color: 'rgba(84, 52, 136, 0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>© {currentYear} <strong>Peblo Media Inc.</strong> All rights reserved.</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Crafted with <Heart size={14} fill="#ec4899" color="#ec4899" /> for young explorers
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>Privacy Policy</span>
            <span style={{ opacity: 0.3 }}>•</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>Terms of Service</span>
            <span style={{ opacity: 0.3 }}>•</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>Parental Guidelines</span>
            <span style={{ opacity: 0.3 }}>•</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>COPPA Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
