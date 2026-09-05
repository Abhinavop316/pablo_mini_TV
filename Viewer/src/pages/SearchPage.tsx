import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { CatalogSearchResult } from '../api/types';
import { ShowCard } from '../components/ShowCard';
import { Search, Film, X, SlidersHorizontal } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filter values directly from URL search parameters
  const query = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('genre') || searchParams.get('category') || '';
  const selectedLanguage = searchParams.get('language') || searchParams.get('lang') || '';
  const selectedSection = searchParams.get('section') || '';

  // Local state for immediate and responsive typing in the search input
  const [searchInput, setSearchInput] = useState(query);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Sync debounced search input to URL query parameters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== query) {
        updateFilter('q', searchInput.trim());
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
      if (key === 'genre') nextParams.delete('category');
      if (key === 'language') nextParams.delete('lang');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const { data, isLoading } = useQuery<CatalogSearchResult>({
    queryKey: ['viewer-search', query, selectedCategory, selectedLanguage, selectedSection],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (selectedSection) params.append('section', selectedSection);

      const res = await api.get(`/catalog/search?${params.toString()}`);
      return res.data;
    },
  });

  const shows = data?.shows || [];
  const categories = data?.categories || [];
  const sections = data?.sections || [];
  const languages = data?.languages || [];

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount =
    (selectedCategory ? 1 : 0) + (selectedLanguage ? 1 : 0) + (selectedSection ? 1 : 0);
  const hasActiveFilters = !!(query || selectedCategory || selectedLanguage || selectedSection);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '110px 24px 80px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Search Header in White & #543488 */}
      <div style={{ maxWidth: '760px', margin: '0 auto 28px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#543488', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
          Explore PeBlo Catalogue
        </h1>
        <p style={{ color: '#543488', fontSize: '16px', marginBottom: '22px', fontFamily: 'var(--font-heading)', opacity: 0.85, fontWeight: 500 }}>
          Search across shows, stories, episodes, genres, and language audio
        </p>

        {/* Search Bar Input */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '2px solid #543488',
            borderRadius: 'var(--radius-full)',
            padding: '4px 8px 4px 22px',
            boxShadow: '0 6px 20px rgba(84, 52, 136, 0.12)',
          }}
        >
          <Search size={22} color="#543488" style={{ flexShrink: 0, marginRight: '12px' }} />
          <input
            type="text"
            placeholder="Search by show title, episode, keyword..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 0',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#543488',
              fontSize: '16px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateFilter('q', '');
              }}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'rgba(84, 52, 136, 0.1)',
                color: '#543488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '6px',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* MOBILE ONLY: Compact Filter Symbol Trigger Bar */}
      <div
        className="mobile-filter-bar"
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          padding: '10px 16px',
          backgroundColor: 'rgba(84, 52, 136, 0.04)',
          border: '1.5px solid rgba(84, 52, 136, 0.15)',
          borderRadius: 'var(--radius-full)',
          gap: '10px',
        }}
      >
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            backgroundColor: activeFilterCount > 0 ? '#543488' : '#ffffff',
            color: activeFilterCount > 0 ? '#ffffff' : '#543488',
            border: '1.5px solid #543488',
            borderRadius: 'var(--radius-full)',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 2px 8px rgba(84, 52, 136, 0.1)',
          }}
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#ffffff',
                color: '#543488',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#543488', fontWeight: 600 }}>
              {selectedCategory || selectedLanguage || selectedSection}
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#543488',
                textDecoration: 'underline',
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* DESKTOP ONLY: Full Horizontal Filter Chips Bar */}
      <div
        className="desktop-filter-chips"
        style={{
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '44px',
          padding: '20px 28px',
          backgroundColor: 'rgba(84, 52, 136, 0.04)',
          border: '2px solid rgba(84, 52, 136, 0.12)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Categories / Genres */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#543488', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
              Genre:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => updateFilter('genre', isSelected ? '' : cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    backgroundColor: isSelected ? '#543488' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#543488',
                    border: `1.5px solid #543488`,
                    boxShadow: isSelected ? '0 4px 10px rgba(84, 52, 136, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#543488', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
              Language:
            </span>
            {languages.map((lang) => {
              const isSelected = selectedLanguage.toLowerCase() === lang.toLowerCase();
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => updateFilter('language', isSelected ? '' : lang)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    backgroundColor: isSelected ? '#543488' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#543488',
                    border: `1.5px solid #543488`,
                    boxShadow: isSelected ? '0 4px 10px rgba(84, 52, 136, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        )}

        {/* Sections */}
        {sections.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#543488', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
              Section:
            </span>
            {sections.map((sec) => {
              const isSelected = selectedSection.toLowerCase() === sec.toLowerCase();
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateFilter('section', isSelected ? '' : sec)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    backgroundColor: isSelected ? '#543488' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#543488',
                    border: `1.5px solid #543488`,
                    boxShadow: isSelected ? '0 4px 10px rgba(84, 52, 136, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sec}
                </button>
              );
            })}
          </div>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: '#543488',
              backgroundColor: '#ffffff',
              border: '1.5px solid rgba(84, 52, 136, 0.3)',
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* MOBILE BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(63, 38, 105, 0.55)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeInOverlay 0.2s ease forwards',
          }}
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxHeight: '85vh',
              backgroundColor: '#ffffff',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              padding: '24px 20px 32px',
              boxShadow: '0 -10px 40px rgba(84, 52, 136, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUpSheet 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1.5px solid rgba(84, 52, 136, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={20} color="#543488" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)', margin: 0 }}>
                  Filter Catalogue
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(84, 52, 136, 0.08)',
                  color: '#543488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Genre / Category Section */}
            {categories.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#543488', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
                  Genre / Category
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => updateFilter('genre', isSelected ? '' : cat)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '13px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-heading)',
                          backgroundColor: isSelected ? '#543488' : '#faf8fd',
                          color: isSelected ? '#ffffff' : '#543488',
                          border: `1.5px solid ${isSelected ? '#543488' : 'rgba(84, 52, 136, 0.2)'}`,
                          boxShadow: isSelected ? '0 3px 8px rgba(84, 52, 136, 0.25)' : 'none',
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Language Section */}
            {languages.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#543488', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
                  Audio Language
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {languages.map((lang) => {
                    const isSelected = selectedLanguage.toLowerCase() === lang.toLowerCase();
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => updateFilter('language', isSelected ? '' : lang)}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '13px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-heading)',
                          backgroundColor: isSelected ? '#543488' : '#faf8fd',
                          color: isSelected ? '#ffffff' : '#543488',
                          border: `1.5px solid ${isSelected ? '#543488' : 'rgba(84, 52, 136, 0.2)'}`,
                          boxShadow: isSelected ? '0 3px 8px rgba(84, 52, 136, 0.25)' : 'none',
                        }}
                      >
                        {lang === 'en' ? 'English (en)' : lang === 'hi' ? 'Hindi (hi)' : lang}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section Filter */}
            {sections.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#543488', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
                  Catalogue Section
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {sections.map((sec) => {
                    const isSelected = selectedSection.toLowerCase() === sec.toLowerCase();
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => updateFilter('section', isSelected ? '' : sec)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '13px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-heading)',
                          backgroundColor: isSelected ? '#543488' : '#faf8fd',
                          color: isSelected ? '#ffffff' : '#543488',
                          border: `1.5px solid ${isSelected ? '#543488' : 'rgba(84, 52, 136, 0.2)'}`,
                          boxShadow: isSelected ? '0 3px 8px rgba(84, 52, 136, 0.25)' : 'none',
                        }}
                      >
                        {sec.charAt(0).toUpperCase() + sec.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sheet Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(84, 52, 136, 0.1)' }}>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleResetFilters();
                  }}
                  style={{
                    flex: '1',
                    padding: '12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid #543488',
                    color: '#543488',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Reset All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                style={{
                  flex: '2',
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #543488, #7c3aed)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  boxShadow: '0 4px 14px rgba(84, 52, 136, 0.25)',
                }}
              >
                View {shows.length} Result{shows.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
          {isLoading ? 'Searching...' : `Results (${shows.length} shows found)`}
        </h2>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#543488', fontFamily: 'var(--font-heading)', fontSize: '18px' }}>
          Searching catalogue...
        </div>
      ) : shows.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            backgroundColor: 'rgba(84, 52, 136, 0.04)',
            border: '2px solid rgba(84, 52, 136, 0.15)',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          <Film size={48} color="#543488" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#543488', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
            No shows found
          </h3>
          <p style={{ color: '#543488', opacity: 0.8, fontSize: '15px', marginBottom: '24px', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
            We couldn't find any matches for your current filters. Try changing your search query or removing some filter chips.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-peblo-primary"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '28px',
            justifyItems: 'center',
          }}
        >
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      )}
    </div>
  );
};
