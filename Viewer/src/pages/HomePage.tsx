import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { CatalogResponse, CatalogTrailer } from '../api/types';
import { ShowCard } from '../components/ShowCard';
import { TrailerModal } from '../components/TrailerModal';
import { Play, Info, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [selectedTrailer, setSelectedTrailer] = useState<{ trailer: CatalogTrailer; showTitle: string } | null>(null);

  const { data: catalog, isLoading, isError } = useQuery<CatalogResponse>({
    queryKey: ['viewer-catalog'],
    queryFn: async () => (await api.get('/catalog')).data,
  });

  const featured = catalog?.featured_show || catalog?.all_shows?.[0];
  const sections = catalog?.sections || [];

  const featuredTrailer = featured?.trailers?.[0];

  const handleScrollRow = (direction: 'left' | 'right', rowId: string) => {
    const el = document.getElementById(rowId);
    if (el) {
      const scrollAmount = direction === 'left' ? -460 : 460;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#543488', backgroundColor: '#ffffff' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 600 }}>Loading PeBlo playground...</p>
      </div>
    );
  }

  if (isError || !catalog) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#543488', textAlign: 'center', padding: '24px', backgroundColor: '#ffffff' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600 }}>Unable to connect to PeBlo streaming service. Please ensure the backend is running.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', paddingBottom: '100px' }}>
      {/* Playful Hero Section in Pure White & #543488 */}
      <section
        style={{
          width: '100%',
          padding: '130px 48px 60px',
          backgroundColor: '#ffffff',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          {/* Tagline Pill Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 20px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(84, 52, 136, 0.08)',
                border: '1.5px solid #543488',
                color: '#543488',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
              }}
            >
              <Sparkles size={15} color="#543488" />
              India's AI-Powered Learning Playground
            </span>
          </div>

          {/* Main Headline (Exact Fredoka Typography & Colors) */}
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#543488',
              marginBottom: '20px',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
            }}
          >
            Five worlds. One universe. Endless wonder.
          </h1>

          {/* Subtitle (Exact style from reference) */}
          <p
            style={{
              fontSize: '20px',
              lineHeight: 1.6,
              color: '#543488',
              marginBottom: '36px',
              maxWidth: '780px',
              margin: '0 auto 36px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              opacity: 0.9,
            }}
          >
            Each mode has its own mascot, its own world and its own kind of magic. Explore curiosity-driven stories, science quests, and animated adventures!
          </p>

          {/* Hero Action CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
            {featuredTrailer ? (
              <button
                type="button"
                onClick={() => setSelectedTrailer({ trailer: featuredTrailer, showTitle: featured.title })}
                className="btn-peblo-primary"
              >
                <Play size={18} fill="#ffffff" />
                Watch On YouTube
              </button>
            ) : (
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noreferrer"
                className="btn-peblo-primary"
              >
                <Play size={18} fill="#ffffff" />
                Watch On YouTube
              </a>
            )}

            {featured && (
              <Link to={`/show/${featured.id}`} className="btn-glass">
                <Info size={18} />
                Explore {featured.title}
              </Link>
            )}
          </div>

          {/* Hero Illustrated Characters Card Container */}
          <div
            style={{
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(84, 52, 136, 0.12)',
              border: '2px solid rgba(84, 52, 136, 0.18)',
              position: 'relative',
              backgroundColor: '#ffffff',
            }}
          >
            <img
              src="/hero-bg.jpg"
              alt="PeBlo Characters Playground"
              style={{
                width: '100%',
                maxHeight: '480px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
      </section>

      {/* Dynamic Section Rows (Netflix-style horizontal carousels with #543488 and White styling) */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 48px' }}>
        {sections.map((sec, idx) => {
          const rowId = `section-row-${idx}`;

          return (
            <div key={sec.name} style={{ marginBottom: '56px' }}>
              {/* Row Header with controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '6px',
                      height: '26px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#543488',
                    }}
                  />
                  <h2
                    style={{
                      fontSize: '26px',
                      fontWeight: 700,
                      color: '#543488',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {sec.name}
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleScrollRow('left', rowId)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid rgba(84, 52, 136, 0.25)',
                      color: '#543488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(84, 52, 136, 0.08)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.backgroundColor = '#543488';
                      e.currentTarget.style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#543488';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollRow('right', rowId)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid rgba(84, 52, 136, 0.25)',
                      color: '#543488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(84, 52, 136, 0.08)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.backgroundColor = '#543488';
                      e.currentTarget.style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#543488';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Horizontal Scrolling Card Container */}
              <div
                id={rowId}
                style={{
                  display: 'flex',
                  gap: '24px',
                  overflowX: 'auto',
                  paddingBottom: '20px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {sec.shows.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trailer Modal Player */}
      <TrailerModal
        trailer={selectedTrailer?.trailer || null}
        showTitle={selectedTrailer?.showTitle || ''}
        onClose={() => setSelectedTrailer(null)}
      />
    </div>
  );
};
