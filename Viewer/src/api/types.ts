export interface CatalogArtwork {
  poster?: string | null;
  banner?: string | null;
  thumbnail?: string | null;
}

export interface CatalogEpisode {
  id: number;
  content_group: string;
  episode_number: number;
  title: string;
  description?: string;
  duration?: number | null;
  languages: string[];
  artwork?: CatalogArtwork | null;
  thumbnail_url?: string | null;
}

export interface CatalogTrailer {
  id: number;
  title: string;
  description?: string;
  duration?: number | null;
  languages: string[];
  artwork?: CatalogArtwork | null;
  thumbnail_url?: string | null;
}

export interface CatalogSeason {
  id: number;
  season_number: number;
  title: string;
  episodes: CatalogEpisode[];
}

export interface CatalogShow {
  id: number;
  title: string;
  synopsis?: string;
  section?: string;
  category?: string;
  artwork?: CatalogArtwork | null;
  poster_url?: string | null;
  banner_url?: string | null;
  trailers: CatalogTrailer[];
  seasons: CatalogSeason[];
  available_languages: string[];
  total_episodes: number;
}

export interface CatalogSection {
  name: string;
  shows: CatalogShow[];
}

export interface CatalogResponse {
  published_at: string;
  sections: CatalogSection[];
  featured_show?: CatalogShow | null;
  all_shows: CatalogShow[];
}

export interface CatalogSearchResult {
  shows: CatalogShow[];
  total: number;
  categories: string[];
  sections: string[];
  languages: string[];
}
