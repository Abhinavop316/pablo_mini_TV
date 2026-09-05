/**
 * Peblo mini TV Official Taxonomies & Specs
 */

export const SECTIONS = [
  'featured',
  'series',
  'minisodes',
  'songs',
] as const;

export type SectionType = typeof SECTIONS[number];

export const CATEGORIES = [
  'adventure',
  'folk',
  'friendship',
  'india',
  'language',
  'learning',
  'maths',
  'music',
  'nature',
  'reading',
  'science',
  'singalong',
  'stories',
  'travel',
  'values',
] as const;

export type CategoryType = typeof CATEGORIES[number];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
] as const;

export const ARTWORK_SPECS = {
  poster: {
    aspect: '2:3',
    target_px: [600, 900] as [number, number],
    max_kb: 200,
  },
  banner: {
    aspect: '16:9',
    target_px: [1280, 720] as [number, number],
    max_kb: 200,
  },
  thumbnail: {
    aspect: '16:9',
    target_px: [640, 360] as [number, number],
    max_kb: 200,
  },
} as const;

export const CONVENTIONS = {
  season_zero: 'Season 0 is reserved for trailers',
  content_group: 'episodes sharing a content_group are language variants of the same episode and must collapse into ONE catalogue entry',
} as const;
