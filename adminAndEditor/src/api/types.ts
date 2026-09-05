export type UserRole = 'ADMIN' | 'EDITOR';
export type ItemStatus = 'DRAFT' | 'PUBLISHED';
export type ArtworkType = 'POSTER' | 'BANNER' | 'THUMBNAIL';
export type PublishStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface User {
  id: number;
  name?: string | null;
  username?: string | null;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_superadmin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  email: string;
  username?: string | null;
}

export interface CheckUsernameResponse {
  username: string;
  available: boolean;
  suggestions: string[];
  message: string;
}

export interface Artwork {
  id: number;
  show_id?: number | null;
  episode_id?: number | null;
  type: ArtworkType;
  url: string;
  width: number;
  height: number;
  file_size: number;
  aspect_ratio: number;
  created_at: string;
}

export interface Episode {
  id: number;
  season_id: number;
  episode_number: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  language: string;
  content_group: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  artwork: Artwork[];
}

export interface Season {
  id: number;
  show_id: number;
  season_number: number;
  title: string;
  created_at: string;
  updated_at: string;
  episodes: Episode[];
}

export interface Show {
  id: number;
  title: string;
  synopsis?: string | null;
  section?: string | null;
  category?: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  seasons: Season[];
  artwork: Artwork[];
}

export interface ShowListItem {
  id: number;
  title: string;
  synopsis?: string | null;
  section?: string | null;
  category?: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  seasons_count: number;
  episodes_count: number;
  artwork: Artwork[];
}

export interface ShowListResponse {
  items: ShowListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ValidationErrorItem {
  entity_type: string;
  entity_id: number;
  title: string;
  reason: string;
  show_id?: number | null;
  show_title?: string | null;
}

export interface ValidationWarningItem {
  entity_type: string;
  entity_id: number;
  title: string;
  reason: string;
}

export interface ValidationReportResponse {
  can_publish: boolean;
  errors_count: number;
  warnings_count: number;
  errors: ValidationErrorItem[];
  warnings: ValidationWarningItem[];
}

export interface PublishRun {
  id: number;
  started_at: string;
  completed_at?: string | null;
  triggered_by: string;
  status: PublishStatus;
  shows_count: number;
  episodes_count: number;
  catalogue_size: number;
  error_message?: string | null;
  created_at: string;
}

export interface PublishTriggerResponse {
  message: string;
  publish_run: PublishRun;
}

export interface PublishHistoryResponse {
  items: PublishRun[];
  total: number;
}

export interface UserItem {
  id: number;
  name?: string | null;
  username?: string | null;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  is_superadmin?: boolean;
  has_pending_setup: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  items: UserItem[];
  total: number;
}

export interface SetupTokenResponse {
  user_id: number;
  name?: string | null;
  email: string;
  setup_token: string;
  setup_url: string;
  expires_at: string;
  email_sent?: boolean;
  email_message?: string;
}

export interface CreateUserResponse {
  id: number;
  name?: string | null;
  username?: string | null;
  email: string;
  role: UserRole;
  message: string;
  setup_token?: string | null;
  setup_url?: string | null;
  expires_at?: string | null;
  email_sent?: boolean;
  email_message?: string;
}


export interface VerifySetupTokenResponse {
  valid: boolean;
  name?: string | null;
  email: string;
  role: UserRole;
}

export interface CompleteSetupResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface SendSetupEmailResponse {
  success: boolean;
  email: string;
  message: string;
  setup_url: string;
}

export interface EpisodeTimelineItem {
  id: number;
  episode_number: number;
  title: string;
  language: string;
  duration?: number | null;
  content_group: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface SeasonTimelineItem {
  id: number;
  season_number: number;
  title: string;
  created_at: string;
  updated_at: string;
  episodes_count: number;
  published_episodes_count: number;
  episodes: EpisodeTimelineItem[];
}

export interface ShowTimelineItem {
  id: number;
  title: string;
  synopsis?: string | null;
  section?: string | null;
  category?: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  poster_url?: string | null;
  banner_url?: string | null;
  seasons_count: number;
  episodes_count: number;
  published_episodes_count: number;
  seasons: SeasonTimelineItem[];
}

export interface ShowsTimelineResponse {
  latest_publish_run?: {
    id: number;
    completed_at?: string | null;
    triggered_by: string;
    shows_count: number;
    episodes_count: number;
  } | null;
  shows: ShowTimelineItem[];
}
