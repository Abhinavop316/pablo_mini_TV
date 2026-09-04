import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { CatalogSearchResult } from '../api/types';
import { ShowCard } from '../components/ShowCard';
import { Search, Film, X } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

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
    setQuery('');
    setSelectedCategory('');
    setSelectedLanguage('');
    setSelectedSection('');
  };

  const hasActiveFilters = !!(query || selectedCategory || selectedLanguage || selectedSection);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '110px 48px 80px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Search Header in White & #543488 */}
      <div style={{ maxWidth: '760px', margin: '0 auto 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 700, color: '#543488', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
          Explore PeBlo Catalogue
        </h1>
        <p style={{ color: '#543488', fontSize: '18px', marginBottom: '28px', fontFamily: 'var(--font-heading)', opacity: 0.85, fontWeight: 500 }}>
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
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

      {/* Filter Chips Bar */}
      <div
        style={{
          display: 'flex',
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
        {/* Categories */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#543488', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
              Genre:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? '' : cat)}
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
              const isSelected = selectedLanguage === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(isSelected ? '' : lang)}
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
              const isSelected = selectedSection === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSection(isSelected ? '' : sec)}
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
