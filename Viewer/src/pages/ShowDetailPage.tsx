import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, API_BASE_URL } from '../api/client';
import type { CatalogShow, CatalogTrailer } from '../api/types';
import { TrailerModal } from '../components/TrailerModal';
import {
  ArrowLeft,
  Play,
  Clock,
  Globe,
  Film,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

export const ShowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);
  const [selectedTrailer, setSelectedTrailer] = useState<{ trailer: CatalogTrailer; showTitle: string } | null>(null);

  const { data: show, isLoading, isError } = useQuery<CatalogShow>({
    queryKey: ['viewer-show-detail', id],
    queryFn: async () => (await api.get(`/catalog/shows/${id}`)).data,
  });

  const seasons = show?.seasons || [];
  const trailers = show?.trailers || [];

  // Automatically select first normal season if not selected
  React.useEffect(() => {
    if (seasons.length > 0 && !activeSeasonId) {
      setActiveSeasonId(seasons[0].id);
    }
  }, [seasons, activeSeasonId]);

  const activeSeason = seasons.find((s) => s.id === activeSeasonId) || seasons[0];

  const rawPoster = show?.artwork?.poster || show?.poster_url;
  const posterUrl = rawPoster
    ? rawPoster.startsWith('http')
      ? rawPoster
      : `${API_BASE_URL}${rawPoster}`
    : null;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#543488', backgroundColor: '#ffffff' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 600 }}>Loading show details...</p>
      </div>
    );
  }

  if (isError || !show) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#543488', flexDirection: 'column', gap: '16px', backgroundColor: '#ffffff' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '18px' }}>Show not found in published catalogue.</p>
        <Link to="/" style={{ color: '#543488', textDecoration: 'underline', fontWeight: 700 }}>
          Back to Catalogue Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', paddingBottom: '100px' }}>
      {/* Header Container in White and #543488 */}
      <div
        style={{
          width: '100%',
          paddingTop: '110px',
          paddingBottom: '40px',
          backgroundColor: 'rgba(84, 52, 136, 0.04)',
          borderBottom: '2px solid rgba(84, 52, 136, 0.12)',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
            padding: '0 48px',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#543488',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              marginBottom: '28px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#ffffff',
              border: '1.5px solid rgba(84, 52, 136, 0.25)',
              boxShadow: '0 2px 8px rgba(84, 52, 136, 0.06)',
            }}
          >
            <ArrowLeft size={16} /> Back to Catalogue
          </Link>

          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Show Poster */}
            {posterUrl && (
              <div
                style={{
                  width: '200px',
                  height: '300px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 10px 30px rgba(84, 52, 136, 0.15)',
                  border: '2px solid #543488',
                  backgroundColor: '#ffffff',
                }}
              >
                <img src={posterUrl} alt={show.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {/* Show Metadata Details */}
            <div style={{ maxWidth: '800px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {show.section && (
                  <span
                    style={{
                      padding: '4px 14px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#543488',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {show.section}
                  </span>
                )}
                {show.category && (
                  <span
                    style={{
                      padding: '4px 14px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #543488',
                      color: '#543488',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {show.category}
                  </span>
                )}
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(84, 52, 136, 0.75)', fontFamily: 'var(--font-heading)' }}>
                  {show.total_episodes} Total Episodes
                </span>
              </div>

              <h1 style={{ fontSize: '44px', fontWeight: 700, color: '#543488', marginBottom: '16px', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                {show.title}
              </h1>

              <p style={{ fontSize: '18px', color: '#543488', lineHeight: 1.6, marginBottom: '24px', opacity: 0.9, fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
                {show.synopsis}
              </p>

              {/* Available Languages Bar */}
              {show.available_languages?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#543488', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                  <Globe size={18} color="#543488" />
                  <span>Available in:</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {show.available_languages.map((lang) => (
                      <span
                        key={lang}
                        style={{
                          padding: '3px 12px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#ffffff',
                          border: '1.5px solid #543488',
                          color: '#543488',
                          fontSize: '13px',
                          fontWeight: 700,
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1440px', margin: '40px auto 0', padding: '0 48px' }}>
        {/* Season 0 Trailers Section */}
        {trailers.length > 0 && (
          <div style={{ marginBottom: '56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Sparkles size={22} color="#543488" />
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
                Official Trailers & Extras (Season 0)
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {trailers.map((trailer) => {
                const rawThumb = trailer.artwork?.thumbnail || trailer.thumbnail_url;
                const thumb = rawThumb
                  ? rawThumb.startsWith('http')
                    ? rawThumb
                    : `${API_BASE_URL}${rawThumb}`
                  : null;

                const mins = trailer.duration ? Math.floor(trailer.duration / 60) : null;
                const secs = trailer.duration ? trailer.duration % 60 : null;

                return (
                  <div
                    key={trailer.id}
                    onClick={() => setSelectedTrailer({ trailer, showTitle: show.title })}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '2px solid rgba(84, 52, 136, 0.18)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(84, 52, 136, 0.08)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#543488';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(84, 52, 136, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(84, 52, 136, 0.18)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(84, 52, 136, 0.08)';
                    }}
                  >
                    <div style={{ width: '100%', height: '170px', backgroundColor: 'rgba(84, 52, 136, 0.06)', position: 'relative' }}>
                      {thumb ? (
                        <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#543488' }}>
                          <Film size={32} />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(84, 52, 136, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
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
                      {trailer.duration && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: '#543488',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#ffffff',
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {mins}:{secs && secs < 10 ? '0' : ''}{secs || 0}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
                        {trailer.title}
                      </h4>
                      {trailer.description && (
                        <p style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.75)', fontFamily: 'var(--font-body)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {trailer.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular Seasons Tabs & Episodes Listing */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              Episodes
            </h2>

            {/* Season Selector Tabs */}
            {seasons.length > 1 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                {seasons.map((s) => {
                  const isActive = activeSeason?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSeasonId(s.id)}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '14px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading)',
                        backgroundColor: isActive ? '#543488' : '#ffffff',
                        color: isActive ? '#ffffff' : '#543488',
                        border: `2px solid #543488`,
                        boxShadow: isActive ? '0 4px 14px rgba(84, 52, 136, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Season {s.season_number}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Episode Cards Grid / List */}
          {(!activeSeason || !activeSeason.episodes || activeSeason.episodes.length === 0) ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: 'rgba(84, 52, 136, 0.04)', border: '2px solid rgba(84, 52, 136, 0.15)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ color: '#543488', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600 }}>No published episodes in this season.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {activeSeason.episodes.map((ep) => {
                const rawThumb = ep.artwork?.thumbnail || ep.thumbnail_url;
                const thumb = rawThumb
                  ? rawThumb.startsWith('http')
                    ? rawThumb
                    : `${API_BASE_URL}${rawThumb}`
                  : null;

                const mins = ep.duration ? Math.floor(ep.duration / 60) : null;

                return (
                  <div
                    key={ep.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px',
                      padding: '20px 24px',
                      backgroundColor: '#ffffff',
                      border: '2px solid rgba(84, 52, 136, 0.15)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: '0 4px 14px rgba(84, 52, 136, 0.06)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#543488';
                      e.currentTarget.style.boxShadow = '0 8px 22px rgba(84, 52, 136, 0.14)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(84, 52, 136, 0.15)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(84, 52, 136, 0.06)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Episode Number */}
                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#543488', width: '36px', textAlign: 'center', flexShrink: 0, fontFamily: 'var(--font-heading)' }}>
                      {ep.episode_number}
                    </span>

                    {/* Thumbnail */}
                    <div
                      style={{
                        width: '160px',
                        height: '95px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(84, 52, 136, 0.06)',
                        border: '1.5px solid rgba(84, 52, 136, 0.2)',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#543488' }}>
                          <ImageIcon size={24} />
                        </div>
                      )}
                      {ep.duration && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: '#543488',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#ffffff',
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {mins}m
                        </span>
                      )}
                    </div>

                    {/* Episode Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
                          {ep.title}
                        </h3>
                        {ep.duration && (
                          <span style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.7)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                            <Clock size={13} color="#543488" /> {mins} mins
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '14px', color: 'rgba(84, 52, 136, 0.8)', lineHeight: 1.5, marginBottom: '10px', fontFamily: 'var(--font-body)' }}>
                        {ep.description || 'No episode description available.'}
                      </p>

                      {/* Collapsed Language Variant Badges */}
                      {ep.languages?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#543488', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>Available audio:</span>
                          {ep.languages.map((lang) => (
                            <span
                              key={lang}
                              style={{
                                padding: '2px 10px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#ffffff',
                                border: '1.5px solid #543488',
                                color: '#543488',
                                fontSize: '12px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-heading)',
                              }}
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        trailer={selectedTrailer?.trailer || null}
        showTitle={selectedTrailer?.showTitle || ''}
        onClose={() => setSelectedTrailer(null)}
      />
    </div>
  );
};
