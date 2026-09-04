import React from 'react';
import type { CatalogTrailer } from '../api/types';
import { API_BASE_URL } from '../api/client';
import { X, Play, Clock, Globe } from 'lucide-react';

interface TrailerModalProps {
  trailer: CatalogTrailer | null;
  showTitle: string;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ trailer, showTitle, onClose }) => {
  if (!trailer) return null;

  const thumbUrl = trailer.thumbnail_url
    ? trailer.thumbnail_url.startsWith('http')
      ? trailer.thumbnail_url
      : `${API_BASE_URL}${trailer.thumbnail_url}`
    : null;

  const mins = trailer.duration ? Math.floor(trailer.duration / 60) : null;
  const secs = trailer.duration ? trailer.duration % 60 : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(84, 52, 136, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: '#ffffff',
          border: '2px solid #543488',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(84, 52, 136, 0.3)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '2px solid #543488',
            color: '#543488',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(84, 52, 136, 0.2)',
          }}
        >
          <X size={20} />
        </button>

        {/* Video Player Mock */}
        <div
          style={{
            width: '100%',
            height: '360px',
            backgroundColor: '#543488',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {thumbUrl && (
            <img
              src={thumbUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
            />
          )}

          {/* Central Play Indicator */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: '#543488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
              }}
            >
              <Play size={34} fill="#543488" style={{ marginLeft: '4px' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              Playing Trailer
            </span>
          </div>

          {/* Player Controls Mock */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 20px',
              background: 'linear-gradient(to top, rgba(84, 52, 136, 0.95), transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              fontSize: '13px',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <span>0:00 / {mins ? `${mins}:${secs && secs < 10 ? '0' : ''}${secs || 0}` : '2:00'}</span>
            <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 16px', borderRadius: '3px' }}>
              <div style={{ width: '35%', height: '100%', backgroundColor: '#ffffff', borderRadius: '3px' }} />
            </div>
            <span>HD 1080p</span>
          </div>
        </div>

        {/* Modal Info */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#543488', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{showTitle}</span>
            <span style={{ color: 'rgba(84, 52, 136, 0.5)' }}>•</span>
            <span style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.7)', fontFamily: 'var(--font-heading)' }}>Season 0 Exclusive</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
            {trailer.title}
          </h2>
          <p style={{ color: 'rgba(84, 52, 136, 0.85)', fontSize: '15px', lineHeight: 1.5, marginBottom: '18px', fontFamily: 'var(--font-body)' }}>
            {trailer.description || 'Exclusive official trailer presentation.'}
          </p>

          <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: '#543488', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            {trailer.duration && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} color="#543488" /> {mins}m {secs ? `${secs}s` : ''}
              </span>
            )}
            {trailer.languages?.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={14} color="#543488" /> {trailer.languages.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
