import React from 'react';
import { Link } from 'react-router-dom';
import type { CatalogShow } from '../api/types';
import { API_BASE_URL } from '../api/client';
import { Film, Globe, Play } from 'lucide-react';

interface ShowCardProps {
  show: CatalogShow;
}

export const ShowCard: React.FC<ShowCardProps> = ({ show }) => {
  const posterUrl = show.poster_url
    ? show.poster_url.startsWith('http')
      ? show.poster_url
      : `${API_BASE_URL}${show.poster_url}`
    : null;

  return (
    <Link
      to={`/show/${show.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '200px',
        flexShrink: 0,
        textDecoration: 'none',
        position: 'relative',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="show-card"
    >
      {/* Poster Image Container (2:3 Aspect Ratio) */}
      <div
        style={{
          width: '100%',
          height: '290px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#ffffff',
          border: '2px solid rgba(84, 52, 136, 0.18)',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 6px 18px rgba(84, 52, 136, 0.09)',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#543488';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(84, 52, 136, 0.22)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(84, 52, 136, 0.18)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(84, 52, 136, 0.09)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={show.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
              backgroundColor: 'rgba(84, 52, 136, 0.04)',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <Film size={34} style={{ marginBottom: '8px' }} color="#543488" />
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>{show.title}</span>
          </div>
        )}

        {/* Hover play icon overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(84, 52, 136, 0.35)',
            opacity: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s ease',
          }}
          className="card-hover-overlay"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#543488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              border: '2px solid #ffffff',
            }}
          >
            <Play size={20} fill="#ffffff" style={{ marginLeft: '3px' }} />
          </div>
        </div>

        {/* Category Badge */}
        {show.category && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: '#543488',
              border: '1.5px solid #543488',
              boxShadow: '0 2px 8px rgba(84, 52, 136, 0.12)',
            }}
          >
            {show.category}
          </span>
        )}
      </div>

      {/* Show Title & Meta below card */}
      <div style={{ marginTop: '10px', padding: '0 4px' }}>
        <h4
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#543488',
            fontFamily: 'var(--font-heading)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {show.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '13px', color: 'rgba(84, 52, 136, 0.7)', fontFamily: 'var(--font-body)' }}>
          {show.available_languages?.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={13} color="#543488" />
              {show.available_languages[0]}
              {show.available_languages.length > 1 ? ` +${show.available_languages.length - 1}` : ''}
            </span>
          )}
          <span>•</span>
          <span>{show.total_episodes} ep{show.total_episodes === 1 ? '' : 's'}</span>
        </div>
      </div>
    </Link>
  );
};
