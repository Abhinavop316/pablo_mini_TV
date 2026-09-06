import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, API_BASE_URL } from '../api/client';
import type { CatalogResponse, CatalogTrailer } from '../api/types';
import { ShowCard } from '../components/ShowCard';
import { TrailerModal } from '../components/TrailerModal';
import { PebloLoader } from '../components/PebloLoader';
import { Play, Info, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTrailer, setSelectedTrailer] = useState<{ trailer: CatalogTrailer; showTitle: string } | null>(null);

  const { data: catalog, isLoading, isError } = useQuery<CatalogResponse>({
    queryKey: ['viewer-catalog'],
    queryFn: async () => (await api.get('/catalog')).data,
  });

  const heroShows = (catalog?.all_shows && catalog.all_shows.length > 0)
    ? catalog.all_shows
    : (catalog?.featured_show ? [catalog.featured_show] : []);

  const numShows = heroShows.length;

  // For seamless infinite forward loop: clone last show before start, and first show after end
  const extendedShows = numShows > 1
    ? [heroShows[numShows - 1], ...heroShows, heroShows[0]]
    : heroShows;

  // carouselIndex 1 maps to the first real show (heroShows[0])
  const [carouselIndex, setCarouselIndex] = useState(numShows > 1 ? 1 : 0);
  const [enableTransition, setEnableTransition] = useState(true);

  // Active real index for indicator dots and counter
  const activeRealIdx = numShows > 1 ? (carouselIndex - 1 + numShows) % numShows : 0;

  // Continuous auto-rotation forward every 5.5s
  useEffect(() => {
    if (numShows <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => {
        if (prev >= extendedShows.length - 1) {
          return 2;
        }
        return prev + 1;
      });
    }, 5500);
    return () => clearInterval(interval);
  }, [numShows, extendedShows.length]);

  // Robust boundary check: snap back to real slides when reaching clones
  useEffect(() => {
    if (numShows <= 1) return;

    if (carouselIndex >= extendedShows.length - 1) {
      // Reached trailing clone of Show 0 (at index N+1) -> after 650ms slide transition, snap to index 1
      const timer = setTimeout(() => {
        setEnableTransition(false);
        setCarouselIndex(1);
      }, 650);
      return () => clearTimeout(timer);
    }

    if (carouselIndex <= 0) {
      // Reached leading clone of Show N-1 (at index 0) -> after 650ms slide transition, snap to index numShows
      const timer = setTimeout(() => {
        setEnableTransition(false);
        setCarouselIndex(numShows);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [carouselIndex, numShows, extendedShows.length]);

  // Re-enable smooth transition after an instant snap reset
  useEffect(() => {
    if (!enableTransition) {
      const timer = setTimeout(() => {
        setEnableTransition(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [enableTransition]);

  const sections = catalog?.sections || [];

  const handlePrevHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enableTransition) return;
    setCarouselIndex((prev) => (prev <= 0 ? 0 : prev - 1));
  };

  const handleNextHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enableTransition) return;
    setCarouselIndex((prev) => (prev >= extendedShows.length - 1 ? extendedShows.length - 1 : prev + 1));
  };

  const handleScrollRow = (direction: 'left' | 'right', rowId: string) => {
    const el = document.getElementById(rowId);
    if (el) {
      const scrollAmount = direction === 'left' ? -460 : 460;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return <PebloLoader text="Loading PeBlo playground..." minHeight="80vh" size="lg" />;
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
      {/* Featured Hero Banner Area with Seamless Infinite Loop Sliding Motion */}
      <section
        style={{
          width: '100%',
          paddingTop: '100px',
          paddingBottom: '36px',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 56px' }}>
          {extendedShows.length > 0 && (
            <div style={{ position: 'relative', width: '100%' }}>
              <div
                style={{
                  width: '100%',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#2e1850',
                  minHeight: '480px',
                }}
                className="hero-carousel-container kid-hero-banner"
              >
              {/* Continuous Auto-Slide Progress Bar at top edge */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  zIndex: 20,
                }}
              >
                <div
                  key={activeRealIdx}
                  style={{
                    height: '100%',
                    backgroundColor: '#facc15',
                    boxShadow: '0 0 8px #facc15',
                    animation: 'heroProgress 5.5s linear forwards',
                  }}
                />
              </div>

              {/* Sliding Strip Track with Seamless Infinite Transform */}
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  transform: `translateX(-${carouselIndex * 100}%)`,
                  transition: enableTransition ? 'transform 0.65s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  willChange: 'transform',
                }}
              >
                {extendedShows.map((show, idx) => {
                  const rawArtBanner = show.artwork?.banner || show.banner_url;
                  const showBannerUrl = rawArtBanner
                    ? rawArtBanner.startsWith('http')
                      ? rawArtBanner
                      : `${API_BASE_URL}${rawArtBanner}`
                    : null;

                  const trailer = show.trailers?.[0];
                  const isActive = idx === carouselIndex;
                  const displayShowNumber = numShows > 1 ? ((idx - 1 + numShows) % numShows) + 1 : 1;

                  return (
                    <div
                      key={`${show.id}-${idx}`}
                      onClick={() => navigate(`/show/${show.id}`)}
                      role="button"
                      tabIndex={0}
                      title={`Click to open ${show.title}`}
                      style={{
                        width: '100%',
                        flexShrink: 0,
                        minHeight: '480px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-end',
                        cursor: 'pointer',
                        padding: '48px 48px 36px',
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* 16:9 Banner Background Image */}
                      {showBannerUrl ? (
                        <img
                          src={showBannerUrl}
                          alt={show.title}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            transform: isActive ? 'scale(1.02)' : 'scale(1)',
                            transition: 'transform 6s ease-out',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(135deg, #543488 0%, #291244 100%)',
                          }}
                        />
                      )}

                      {/* Multi-Stop Gradient Overlays for Superb Text Contrast & Artwork Glow */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'linear-gradient(to right, rgba(28, 12, 54, 0.96) 0%, rgba(28, 12, 54, 0.82) 44%, rgba(28, 12, 54, 0.25) 75%, transparent 100%), linear-gradient(to top, rgba(28, 12, 54, 0.9) 0%, transparent 45%)',
                        }}
                      />

                      {/* Content Overlay */}
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          maxWidth: '740px',
                          color: '#ffffff',
                          transform: isActive ? 'translateX(0)' : 'translateX(-12px)',
                          opacity: isActive ? 1 : 0.4,
                          transition: 'all 0.5s ease 0.15s',
                        }}
                      >
                        {/* Featured Badge & Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 14px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'rgba(255, 255, 255, 0.22)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              fontSize: '12px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-heading)',
                              color: '#ffffff',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            <Sparkles size={13} color="#facc15" />
                            Featured Hero • {displayShowNumber}/{numShows}
                          </span>

                          {show.category && (
                            <span
                              style={{
                                padding: '5px 14px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-heading)',
                                color: '#543488',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              }}
                            >
                              {show.category}
                            </span>
                          )}

                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'var(--font-heading)' }}>
                            {show.total_episodes} Total Episodes
                          </span>
                        </div>

                        {/* Show Title in Crisp White */}
                        <h1
                          style={{
                            fontSize: '44px',
                            fontWeight: 800,
                            lineHeight: 1.15,
                            color: '#ffffff',
                            marginBottom: '14px',
                            fontFamily: 'var(--font-heading)',
                            textShadow: '0 3px 12px rgba(0,0,0,0.5)',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {show.title}
                        </h1>

                        {/* Synopsis */}
                        <p
                          style={{
                            fontSize: '16px',
                            lineHeight: 1.6,
                            color: 'rgba(255, 255, 255, 0.92)',
                            marginBottom: '26px',
                            fontFamily: 'var(--font-body)',
                            fontWeight: 500,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textShadow: '0 2px 6px rgba(0,0,0,0.4)',
                          }}
                        >
                          {show.synopsis || 'Explore curiosity-driven stories, science quests, and animated adventures!'}
                        </p>

                        {/* Action CTAs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                          {trailer ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrailer({ trailer, showTitle: show.title });
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 28px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#ffffff',
                                color: '#543488',
                                fontSize: '15px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-heading)',
                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.04)';
                                e.currentTarget.style.backgroundColor = '#f4effc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = '#ffffff';
                              }}
                            >
                              <Play size={18} fill="#543488" color="#543488" />
                              Watch Trailer
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/show/${show.id}`);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 28px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#ffffff',
                                color: '#543488',
                                fontSize: '15px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-heading)',
                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.04)';
                                e.currentTarget.style.backgroundColor = '#f4effc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = '#ffffff';
                              }}
                            >
                              <Play size={18} fill="#543488" color="#543488" />
                              Watch Show
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/show/${show.id}`);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '12px 24px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(8px)',
                              border: '1.5px solid rgba(255, 255, 255, 0.4)',
                              color: '#ffffff',
                              fontSize: '15px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-heading)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                            }}
                          >
                            <Info size={18} />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dot / Slide Navigation Bar at bottom */}
              {numShows > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '48px',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {heroShows.map((s, idx) => {
                    const isActive = idx === activeRealIdx;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselIndex(idx + 1);
                        }}
                        title={`Go to ${s.title}`}
                        style={{
                          width: isActive ? '28px' : '9px',
                          height: '9px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          padding: 0,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation Left / Right Buttons Positioned Outside the Banner */}
            {numShows > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevHero}
                  title="Previous Show"
                  aria-label="Previous Show"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '-26px',
                    transform: 'translateY(-50%)',
                    zIndex: 30,
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '3px solid #543488',
                    color: '#543488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(84, 52, 136, 0.22)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#543488';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                    e.currentTarget.style.boxShadow = '0 8px 26px rgba(84, 52, 136, 0.36)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#543488';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(84, 52, 136, 0.22)';
                  }}
                >
                  <ChevronLeft size={28} strokeWidth={2.6} />
                </button>

                <button
                  type="button"
                  onClick={handleNextHero}
                  title="Next Show"
                  aria-label="Next Show"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-26px',
                    transform: 'translateY(-50%)',
                    zIndex: 30,
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '3px solid #543488',
                    color: '#543488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(84, 52, 136, 0.22)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#543488';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                    e.currentTarget.style.boxShadow = '0 8px 26px rgba(84, 52, 136, 0.36)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#543488';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(84, 52, 136, 0.22)';
                  }}
                >
                  <ChevronRight size={28} strokeWidth={2.6} />
                </button>
              </>
            )}
          </div>
        )}
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
