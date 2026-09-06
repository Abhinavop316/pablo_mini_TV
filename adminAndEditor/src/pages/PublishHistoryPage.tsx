import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../api/client';
import { PebloLoader } from '../components/PebloLoader';
import type {
  PublishHistoryResponse,
  PublishRun,
  ShowsTimelineResponse,
  ShowTimelineItem,
  SeasonTimelineItem,
  EpisodeTimelineItem,
} from '../api/types';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Rocket,
  Layers,
  List,
  ExternalLink,
  Code2,
  X,
  Zap,
  Check,
  Tv,
  Film,
  Search,
  FolderTree,
  Edit3,
  Calendar,
  Globe,
  Tag,
  Maximize2,
  Minimize2,
  Send,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';

export const PublishHistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'shows_timeline' | 'runs_timeline' | 'table'>('shows_timeline');
  const [selectedRun, setSelectedRun] = useState<PublishRun | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Expanded states
  const [expandedShows, setExpandedShows] = useState<Record<number, boolean>>({});
  const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({});

  const pageSize = 15;

  // Query 1: Publication Runs
  const { data: runsData, isLoading: runsLoading } = useQuery<PublishHistoryResponse>({
    queryKey: ['admin-publish-history', page],
    queryFn: async () => (await api.get(`/admin/catalog/publish-runs?page=${page}&page_size=${pageSize}`)).data,
  });

  // Query 2: Shows & Seasons Publication Timeline
  const { data: showsTimelineData, isLoading: showsLoading } = useQuery<ShowsTimelineResponse>({
    queryKey: ['admin-shows-timeline'],
    queryFn: async () => (await api.get('/admin/catalog/shows-timeline')).data,
  });

  // Per-show publish mutation
  const publishShowMutation = useMutation({
    mutationFn: async (showId: number) => {
      const res = await api.post(`/admin/shows/${showId}/publish`);
      return res.data;
    },
    onSuccess: (data) => {
      setActionMessage({ type: 'success', text: `Show "${data.show?.title || 'Show'}" published successfully!` });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['admin-publish-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      let errorMsg = 'Failed to publish show';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((e: any) => e.msg || JSON.stringify(e)).join(' | ');
      }
      setActionMessage({ type: 'error', text: errorMsg });
      setTimeout(() => setActionMessage(null), 7000);
    },
  });

  // Per-show unpublish mutation
  const unpublishShowMutation = useMutation({
    mutationFn: async (showId: number) => {
      const res = await api.post(`/admin/shows/${showId}/unpublish`);
      return res.data;
    },
    onSuccess: (data) => {
      setActionMessage({ type: 'success', text: `Show "${data.show?.title || 'Show'}" unpublished and reverted to Draft.` });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['admin-publish-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : 'Failed to unpublish show';
      setActionMessage({ type: 'error', text: errorMsg });
      setTimeout(() => setActionMessage(null), 7000);
    },
  });

  const runs = runsData?.items || [];
  const total = runsData?.total || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const latestRun = runs[0] || showsTimelineData?.latest_publish_run;

  const allShows = showsTimelineData?.shows || [];

  // Filter shows
  const filteredShows = useMemo(() => {
    return allShows.filter((show) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (show.section && show.section.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (show.category && show.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        show.seasons.some((s) =>
          s.episodes.some((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
        );

      const matchesStatus =
        statusFilter === 'ALL' || show.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allShows, searchQuery, statusFilter]);

  // Expand / Collapse Handlers
  const toggleShow = (showId: number) => {
    setExpandedShows((prev) => ({ ...prev, [showId]: !prev[showId] }));
  };

  const toggleSeason = (seasonId: number) => {
    setExpandedSeasons((prev) => ({ ...prev, [seasonId]: !prev[seasonId] }));
  };

  const expandAll = () => {
    const showMap: Record<number, boolean> = {};
    const seasonMap: Record<number, boolean> = {};
    filteredShows.forEach((show) => {
      showMap[show.id] = true;
      show.seasons.forEach((season) => {
        seasonMap[season.id] = true;
      });
    });
    setExpandedShows(showMap);
    setExpandedSeasons(seasonMap);
  };

  const collapseAll = () => {
    setExpandedShows({});
    setExpandedSeasons({});
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds && seconds !== 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header Banner with Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(84, 52, 136, 0.12), rgba(124, 58, 237, 0.15))',
                border: '1.5px solid #7c3aed',
                color: '#543488',
                fontSize: '12px',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
              }}
            >
              <Rocket size={14} color="#7c3aed" />
              Catalogue Publication Telemetry
            </span>
          </div>
          <h1 style={{ fontSize: '34px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            Publishing History & Show Timelines
          </h1>
          <p style={{ color: 'rgba(84, 52, 136, 0.8)', fontSize: '15px', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
            Inspect shows, expand seasons, and explore individual episode release timelines
          </p>
        </div>

        {/* Action CTAs & View Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-full)',
              border: '2px solid #543488',
              padding: '3px',
              boxShadow: '0 2px 8px rgba(84, 52, 136, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('shows_timeline')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: viewMode === 'shows_timeline' ? '#543488' : 'transparent',
                color: viewMode === 'shows_timeline' ? '#ffffff' : '#543488',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                transition: 'all 0.2s ease',
              }}
            >
              <FolderTree size={15} /> Shows Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('runs_timeline')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: viewMode === 'runs_timeline' ? '#543488' : 'transparent',
                color: viewMode === 'runs_timeline' ? '#ffffff' : '#543488',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                transition: 'all 0.2s ease',
              }}
            >
              <Layers size={15} /> Release Runs
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: viewMode === 'table' ? '#543488' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#543488',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                transition: 'all 0.2s ease',
              }}
            >
              <List size={15} /> Audit Table
            </button>
          </div>

          <Link
            to="/admin/shows"
            style={{
              background: 'linear-gradient(135deg, #543488, #7c3aed)',
              color: '#ffffff',
              padding: '12px 22px',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 6px 18px rgba(124, 58, 237, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
          >
            <Tv size={16} />
            Manage Shows
          </Link>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          style={{
            marginBottom: '24px',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: actionMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1.5px solid ${actionMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-heading)',
            fontSize: '14px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actionMessage.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertTriangle size={18} color="#ef4444" />}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Release Telemetry Cards with Exciting Vibrant Color Accents */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {/* Total Shows in Catalogue (Electric Purple Card) */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #ffffff 50%, #f5f3ff 100%)',
            border: '2px solid rgba(124, 58, 237, 0.25)',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
              Total Shows
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#ede9fe', border: '1.5px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Tv size={18} />
            </div>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
            {allShows.length}
          </h3>
          <p style={{ fontSize: '13px', color: '#7c3aed', marginTop: '4px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            {allShows.filter((s) => s.status === 'PUBLISHED').length} Published Live
          </p>
        </div>

        {/* Total Episodes (Emerald Green Card) */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #ffffff 50%, #ecfdf5 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
              Total Episodes
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#d1fae5', border: '1.5px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Film size={18} />
            </div>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-heading)' }}>
            {allShows.reduce((acc, s) => acc + s.episodes_count, 0)}
          </h3>
          <p style={{ fontSize: '13px', color: '#059669', marginTop: '4px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            {allShows.reduce((acc, s) => acc + s.published_episodes_count, 0)} Published Live
          </p>
        </div>

        {/* Total Deployments (Sunset Orange Card) */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #ffffff 50%, #fff7ed 100%)',
            border: '2px solid rgba(249, 115, 22, 0.3)',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
              Deployments
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#ffedd5', border: '1.5px solid #f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <History size={18} />
            </div>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#c2410c', fontFamily: 'var(--font-heading)' }}>
            {total}
          </h3>
          <p style={{ fontSize: '13px', color: '#ea580c', marginTop: '4px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            {latestRun ? `Latest by ${latestRun.triggered_by}` : 'Zero-downtime releases'}
          </p>
        </div>
      </div>

      {/* VIEW MODE 1: SHOWS & SEASONS PUBLICATION TIMELINE */}
      {viewMode === 'shows_timeline' && (
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          {/* Filter & Control Toolbar */}
          <div
            className="interactive-card"
            style={{
              padding: '18px 24px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
              <Search size={18} color="#7c3aed" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search shows, seasons, or episodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid rgba(84, 52, 136, 0.2)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  color: '#543488',
                  outline: 'none',
                  backgroundColor: '#faf9fc',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#7c3aed')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(84, 52, 136, 0.2)')}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#543488',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter by Status & Expand/Collapse All */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#f5f3ff',
                  borderRadius: 'var(--radius-full)',
                  padding: '3px',
                  border: '1.5px solid #ddd6fe',
                }}
              >
                {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      backgroundColor: statusFilter === st ? '#7c3aed' : 'transparent',
                      color: statusFilter === st ? '#ffffff' : '#543488',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {st === 'ALL' ? 'All Shows' : st}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={expandAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid #543488',
                    backgroundColor: '#ffffff',
                    color: '#543488',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer',
                  }}
                >
                  <Maximize2 size={13} /> Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid rgba(84, 52, 136, 0.3)',
                    backgroundColor: '#ffffff',
                    color: '#543488',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer',
                  }}
                >
                  <Minimize2 size={13} /> Collapse All
                </button>
              </div>
            </div>
          </div>

          {/* Shows Tree List */}
          {showsLoading ? (
            <PebloLoader text="Loading publication timeline..." minHeight="260px" />
          ) : filteredShows.length === 0 ? (
            <div className="interactive-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Tv size={44} color="#543488" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>No Shows Found</h3>
              <p style={{ color: 'rgba(84, 52, 136, 0.7)', fontSize: '14px', marginBottom: '20px' }}>
                {searchQuery ? `No shows match "${searchQuery}". Try clear filters.` : 'No shows currently in the catalog.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredShows.map((show: ShowTimelineItem) => {
                const isShowExpanded = !!expandedShows[show.id];
                const isShowPublished = show.status === 'PUBLISHED';

                return (
                  <div
                    key={show.id}
                    className="interactive-card"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: isShowExpanded ? '2px solid #7c3aed' : '2px solid rgba(84, 52, 136, 0.16)',
                      boxShadow: isShowExpanded ? '0 12px 32px rgba(124, 58, 237, 0.16)' : '0 4px 16px rgba(84, 52, 136, 0.06)',
                      transition: 'all 0.25s ease',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {/* Show Header Accordion Bar */}
                    <div
                      onClick={() => toggleShow(show.id)}
                      style={{
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                        cursor: 'pointer',
                        background: isShowExpanded
                          ? 'linear-gradient(135deg, #ffffff 60%, #f5f3ff 100%)'
                          : '#ffffff',
                        borderBottom: isShowExpanded ? '2px solid rgba(124, 58, 237, 0.2)' : 'none',
                      }}
                    >
                      {/* Left: Poster + Show Title + Tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '260px' }}>
                        {/* Show Poster / Thumbnail */}
                        <div
                          style={{
                            width: '54px',
                            height: '72px',
                            borderRadius: '8px',
                            backgroundColor: '#f5f3ff',
                            border: '1.5px solid #ddd6fe',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(84, 52, 136, 0.1)',
                          }}
                        >
                          {show.poster_url ? (
                            <img
                              src={show.poster_url.startsWith('http') ? show.poster_url : `${API_BASE_URL}${show.poster_url}`}
                              alt={show.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Tv size={24} color="#7c3aed" />
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)', margin: 0 }}>
                              {show.title}
                            </h3>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: isShowPublished ? '#d1fae5' : '#fef3c7',
                                border: `1.5px solid ${isShowPublished ? '#10b981' : '#f59e0b'}`,
                                color: isShowPublished ? '#065f46' : '#92400e',
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: 'var(--font-heading)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {isShowPublished ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {show.status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: '#7c3aed', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                            {show.section && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f3e8ff' }}>
                                <Tag size={11} /> {show.section}
                              </span>
                            )}
                            {show.category && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                                <Globe size={11} /> {show.category}
                              </span>
                            )}
                            <span style={{ color: 'rgba(84, 52, 136, 0.7)' }}>
                              Updated {formatDate(show.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Seasons & Episodes Counts */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: '#f5f3ff',
                            border: '1.5px solid #c4b5fd',
                            textAlign: 'center',
                          }}
                        >
                          <span style={{ fontSize: '11px', color: '#6d28d9', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                            Seasons
                          </span>
                          <p style={{ fontSize: '16px', fontWeight: 800, color: '#5b21b6', margin: 0, fontFamily: 'var(--font-heading)' }}>
                            {show.seasons_count}
                          </p>
                        </div>

                        <div
                          style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: '#f0f9ff',
                            border: '1.5px solid #7dd3fc',
                            textAlign: 'center',
                          }}
                        >
                          <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                            Episodes
                          </span>
                          <p style={{ fontSize: '16px', fontWeight: 800, color: '#075985', margin: 0, fontFamily: 'var(--font-heading)' }}>
                            {show.published_episodes_count} / {show.episodes_count} pub
                          </p>
                        </div>
                      </div>

                      {/* Right: Quick actions & Chevron toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Per-Show Direct Publish / Unpublish Button */}
                        {isShowPublished ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              unpublishShowMutation.mutate(show.id);
                            }}
                            disabled={unpublishShowMutation.isPending}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: '#fff7ed',
                              border: '1.5px solid #f97316',
                              color: '#c2410c',
                              fontSize: '12px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-heading)',
                              cursor: unpublishShowMutation.isPending ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <EyeOff size={13} />
                            {unpublishShowMutation.isPending ? 'Reverting...' : 'Unpublish'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              publishShowMutation.mutate(show.id);
                            }}
                            disabled={publishShowMutation.isPending}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              borderRadius: 'var(--radius-full)',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              border: '1.5px solid #059669',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-heading)',
                              cursor: publishShowMutation.isPending ? 'not-allowed' : 'pointer',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Send size={13} />
                            {publishShowMutation.isPending ? 'Publishing...' : 'Publish'}
                          </button>
                        )}

                        <Link
                          to={`/admin/shows/${show.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '7px 14px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: '#ffffff',
                            border: '1.5px solid #543488',
                            color: '#543488',
                            fontSize: '12px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading)',
                            textDecoration: 'none',
                          }}
                        >
                          <Edit3 size={13} /> Edit Show
                        </Link>

                        <button
                          type="button"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1.5px solid #7c3aed',
                            backgroundColor: isShowExpanded ? '#7c3aed' : '#f5f3ff',
                            color: isShowExpanded ? '#ffffff' : '#7c3aed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isShowExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED SHOW BODY: SEASONS LIST */}
                    {isShowExpanded && (
                      <div style={{ padding: '24px', backgroundColor: '#faf9fc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Seasons in {show.title} ({show.seasons.length})
                          </h4>
                          <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
                            Click a season to expand its episode publication timeline
                          </span>
                        </div>

                        {show.seasons.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px dashed #c4b5fd' }}>
                            <p style={{ color: 'rgba(84, 52, 136, 0.7)', fontSize: '13px', margin: 0 }}>No seasons created for this show yet.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {show.seasons.map((season: SeasonTimelineItem) => {
                              const isSeasonExpanded = !!expandedSeasons[season.id];
                              const isSeasonFullyPublished = season.episodes_count > 0 && season.published_episodes_count === season.episodes_count;

                              return (
                                <div
                                  key={season.id}
                                  style={{
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: '#ffffff',
                                    border: isSeasonExpanded ? '2px solid #0ea5e9' : '1.5px solid rgba(84, 52, 136, 0.14)',
                                    boxShadow: isSeasonExpanded ? '0 6px 20px rgba(14, 165, 233, 0.12)' : '0 2px 8px rgba(84, 52, 136, 0.04)',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  {/* Season Header Accordion Bar */}
                                  <div
                                    onClick={() => toggleSeason(season.id)}
                                    style={{
                                      padding: '16px 20px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      flexWrap: 'wrap',
                                      gap: '12px',
                                      cursor: 'pointer',
                                      background: isSeasonExpanded ? 'linear-gradient(135deg, #ffffff 70%, #f0f9ff 100%)' : '#ffffff',
                                      borderBottom: isSeasonExpanded ? '1.5px solid rgba(14, 165, 233, 0.2)' : 'none',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div
                                        style={{
                                          width: '32px',
                                          height: '32px',
                                          borderRadius: '8px',
                                          backgroundColor: '#e0f2fe',
                                          border: '1.5px solid #0ea5e9',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: '#0284c7',
                                          fontWeight: 800,
                                          fontSize: '13px',
                                          fontFamily: 'var(--font-heading)',
                                        }}
                                      >
                                        S{season.season_number}
                                      </div>

                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <h5 style={{ fontSize: '16px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)', margin: 0 }}>
                                            {season.title || `Season ${season.season_number}`}
                                          </h5>
                                          <span
                                            style={{
                                              padding: '2px 8px',
                                              borderRadius: 'var(--radius-full)',
                                              backgroundColor: isSeasonFullyPublished ? '#d1fae5' : '#fef3c7',
                                              border: `1px solid ${isSeasonFullyPublished ? '#10b981' : '#f59e0b'}`,
                                              color: isSeasonFullyPublished ? '#065f46' : '#92400e',
                                              fontSize: '10px',
                                              fontWeight: 800,
                                              fontFamily: 'var(--font-heading)',
                                              textTransform: 'uppercase',
                                            }}
                                          >
                                            {isSeasonFullyPublished ? 'All Published' : `${season.published_episodes_count}/${season.episodes_count} Pub`}
                                          </span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'rgba(84, 52, 136, 0.7)', fontFamily: 'var(--font-heading)' }}>
                                          Created {formatDate(season.created_at)}
                                        </span>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1', fontFamily: 'var(--font-heading)' }}>
                                        {season.episodes_count} Episodes
                                      </span>

                                      <button
                                        type="button"
                                        style={{
                                          width: '30px',
                                          height: '30px',
                                          borderRadius: '50%',
                                          border: '1.5px solid #0ea5e9',
                                          backgroundColor: isSeasonExpanded ? '#0ea5e9' : '#f0f9ff',
                                          color: isSeasonExpanded ? '#ffffff' : '#0ea5e9',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {isSeasonExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* EXPANDED SEASON BODY: EPISODES PUBLICATION TIMELINE */}
                                  {isSeasonExpanded && (
                                    <div style={{ padding: '24px 20px', backgroundColor: '#ffffff' }}>
                                      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
                                          Publication Timeline • Season {season.season_number}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#543488', fontFamily: 'var(--font-heading)' }}>
                                          Sorted chronologically by episode sequence & release timestamps
                                        </span>
                                      </div>

                                      {season.episodes.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                          <p style={{ color: 'rgba(84, 52, 136, 0.6)', fontSize: '13px', margin: 0 }}>
                                            No episodes in this season yet.
                                          </p>
                                        </div>
                                      ) : (
                                        /* Connected Vertical Episode Timeline */
                                        <div style={{ position: 'relative', paddingLeft: '32px', marginTop: '12px' }}>
                                          {/* Timeline Continuous Gradient Bar */}
                                          <div
                                            style={{
                                              position: 'absolute',
                                              top: '16px',
                                              bottom: '16px',
                                              left: '11px',
                                              width: '3px',
                                              background: 'linear-gradient(to bottom, #7c3aed, #0ea5e9, #10b981)',
                                              borderRadius: '2px',
                                            }}
                                          />

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {season.episodes.map((ep: EpisodeTimelineItem) => {
                                              const isEpPublished = ep.status === 'PUBLISHED';

                                              return (
                                                <div
                                                  key={ep.id}
                                                  style={{
                                                    position: 'relative',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                  }}
                                                >
                                                  {/* Timeline Episode Node */}
                                                  <div
                                                    style={{
                                                      position: 'absolute',
                                                      left: '-32px',
                                                      top: '12px',
                                                      width: '24px',
                                                      height: '24px',
                                                      borderRadius: '50%',
                                                      backgroundColor: isEpPublished ? '#10b981' : '#f59e0b',
                                                      border: '2.5px solid #ffffff',
                                                      boxShadow: isEpPublished
                                                        ? '0 0 10px rgba(16, 185, 129, 0.5)'
                                                        : '0 0 8px rgba(245, 158, 11, 0.4)',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      color: '#ffffff',
                                                      fontSize: '11px',
                                                      fontWeight: 800,
                                                      zIndex: 2,
                                                    }}
                                                  >
                                                    {ep.episode_number}
                                                  </div>

                                                  {/* Episode Timeline Card */}
                                                  <div
                                                    className="interactive-card"
                                                    style={{
                                                      flex: 1,
                                                      padding: '16px 20px',
                                                      borderRadius: 'var(--radius-md)',
                                                      backgroundColor: isEpPublished ? 'linear-gradient(135deg, #ffffff 80%, #ecfdf5 100%)' : '#ffffff',
                                                      border: isEpPublished ? '1.5px solid #a7f3d0' : '1.5px solid #fde68a',
                                                      boxShadow: '0 2px 8px rgba(84, 52, 136, 0.04)',
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      gap: '10px',
                                                    }}
                                                  >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-heading)' }}>
                                                          Episode {ep.episode_number}:
                                                        </span>
                                                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
                                                          {ep.title}
                                                        </span>

                                                        <span
                                                          style={{
                                                            padding: '2px 8px',
                                                            borderRadius: 'var(--radius-full)',
                                                            backgroundColor: isEpPublished ? '#d1fae5' : '#fef3c7',
                                                            border: `1px solid ${isEpPublished ? '#10b981' : '#f59e0b'}`,
                                                            color: isEpPublished ? '#065f46' : '#92400e',
                                                            fontSize: '10px',
                                                            fontWeight: 800,
                                                            fontFamily: 'var(--font-heading)',
                                                            textTransform: 'uppercase',
                                                          }}
                                                        >
                                                          {ep.status}
                                                        </span>
                                                      </div>

                                                      {/* Link to Edit Episode with URL Query Parameters */}
                                                      <Link
                                                        to={`/admin/shows/${show.id}/episodes/${ep.id}?title=${encodeURIComponent(ep.title)}&season=${season.season_number}&episode=${ep.episode_number}`}
                                                        style={{
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          gap: '5px',
                                                          padding: '5px 12px',
                                                          borderRadius: 'var(--radius-full)',
                                                          backgroundColor: '#f5f3ff',
                                                          border: '1px solid #c4b5fd',
                                                          color: '#6d28d9',
                                                          fontSize: '11px',
                                                          fontWeight: 700,
                                                          fontFamily: 'var(--font-heading)',
                                                          textDecoration: 'none',
                                                        }}
                                                      >
                                                        <Edit3 size={11} /> Episode Details
                                                      </Link>
                                                    </div>

                                                    {/* Episode Metadata & Publication Timestamps */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: '#543488', fontFamily: 'var(--font-heading)' }}>
                                                      {ep.language && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0369a1', fontWeight: 600 }}>
                                                          <Globe size={12} /> {ep.language}
                                                        </span>
                                                      )}
                                                      {ep.duration ? (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ea580c', fontWeight: 600 }}>
                                                          <Clock size={12} /> {formatDuration(ep.duration)}
                                                        </span>
                                                      ) : null}
                                                      {ep.content_group && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7c3aed', fontWeight: 600 }}>
                                                          <Tag size={12} /> {ep.content_group}
                                                        </span>
                                                      )}
                                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(84, 52, 136, 0.7)', marginLeft: 'auto' }}>
                                                        <Calendar size={12} /> Updated: {formatDate(ep.updated_at)}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: PIPELINE RELEASE RUNS TIMELINE */}
      {viewMode === 'runs_timeline' && (
        <div style={{ maxWidth: '920px', margin: '0 auto' }}>
          {runsLoading ? (
            <PebloLoader text="Loading release pipeline timeline..." minHeight="260px" />
          ) : runs.length === 0 ? (
            <div className="interactive-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <History size={44} color="#543488" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>No Release Runs Yet</h3>
              <p style={{ color: 'rgba(84, 52, 136, 0.7)', fontSize: '14px', marginBottom: '20px' }}>Publish your shows directly from the Shows list or detail pages.</p>
              <Link to="/admin/shows" className="btn-peblo-primary">Go to Shows</Link>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '36px' }}>
              {/* Vertical Timeline Guide Line */}
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  bottom: '20px',
                  left: '12px',
                  width: '4px',
                  background: 'linear-gradient(to bottom, #10b981, #7c3aed 50%, #0ea5e9)',
                  borderRadius: '3px',
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {runs.map((run, idx) => {
                  const isSuccess = run.status === 'SUCCESS';
                  const dateStr = formatDate(run.created_at);

                  return (
                    <div
                      key={run.id}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Timeline Node Icon with Glowing Beacon */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-36px',
                          top: '18px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isSuccess ? (idx === 0 ? '#10b981' : '#7c3aed') : '#ef4444',
                          border: '3px solid #ffffff',
                          boxShadow: isSuccess ? (idx === 0 ? '0 0 16px rgba(16, 185, 129, 0.6)' : '0 0 12px rgba(124, 58, 237, 0.4)') : '0 0 12px rgba(239, 68, 68, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          zIndex: 2,
                        }}
                      >
                        {isSuccess ? <Check size={14} strokeWidth={3} /> : <XCircle size={14} />}
                      </div>

                      {/* Release Card with Colorful Accents */}
                      <div
                        className="interactive-card"
                        style={{
                          flex: 1,
                          padding: '22px 26px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          background: idx === 0 ? 'linear-gradient(135deg, #ffffff 60%, #ecfdf5 100%)' : '#ffffff',
                          border: idx === 0 ? '2px solid #10b981' : '2px solid rgba(84, 52, 136, 0.16)',
                          boxShadow: idx === 0 ? '0 10px 30px rgba(16, 185, 129, 0.15)' : '0 4px 16px rgba(84, 52, 136, 0.06)',
                        }}
                      >
                        {/* Card Top: Release Tag, Date & Publisher */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {idx === 0 ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 14px',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: '#10b981',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  fontFamily: 'var(--font-heading)',
                                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                                }}
                              >
                                <Zap size={13} fill="#ffffff" />
                                Live Production Release
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: 'rgba(124, 58, 237, 0.1)',
                                  border: '1.5px solid #7c3aed',
                                  color: '#7c3aed',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  fontFamily: 'var(--font-heading)',
                                }}
                              >
                                Release #{run.id}
                              </span>
                            )}

                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: isSuccess ? '#d1fae5' : '#fee2e2',
                                border: `1.5px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
                                color: isSuccess ? '#065f46' : '#991b1b',
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: 'var(--font-heading)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {run.status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: '#543488', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={14} color="#7c3aed" /> {dateStr}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <User size={14} color="#7c3aed" /> {run.triggered_by}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Content summary pills with distinctive colorful borders */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          {/* Shows Chip (Purple) */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: '#f5f3ff',
                              border: '1.5px solid #c4b5fd',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Shows:</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#5b21b6', fontFamily: 'var(--font-heading)' }}>{run.shows_count}</span>
                          </div>

                          {/* Episodes Chip (Sky Blue) */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: '#f0f9ff',
                              border: '1.5px solid #7dd3fc',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Episodes:</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#075985', fontFamily: 'var(--font-heading)' }}>{run.episodes_count}</span>
                          </div>

                          {/* Payload Size Chip (Amber/Orange) */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: '#fffbeb',
                              border: '1.5px solid #fcd34d',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Payload Size:</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#92400e', fontFamily: 'var(--font-heading)' }}>{Math.round(run.catalogue_size / 1024)} KB</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedRun(run)}
                            style={{
                              marginLeft: 'auto',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-full)',
                              background: 'linear-gradient(135deg, #543488, #7c3aed)',
                              color: '#ffffff',
                              fontSize: '13px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-heading)',
                              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 18px rgba(124, 58, 237, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.25)';
                            }}
                          >
                            <Code2 size={15} /> Inspect Snapshot
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 3: AUDIT DATA TABLE */}
      {viewMode === 'table' && (
        <div
          className="interactive-card"
          style={{
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, rgba(84, 52, 136, 0.08), rgba(124, 58, 237, 0.1))', borderBottom: '2px solid rgba(84, 52, 136, 0.2)', color: '#543488', fontFamily: 'var(--font-heading)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 800 }}>Date & Time</th>
                  <th style={{ padding: '16px 16px', fontWeight: 800 }}>Triggered By</th>
                  <th style={{ padding: '16px 16px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '16px 16px', fontWeight: 800 }}>Published Content</th>
                  <th style={{ padding: '16px 16px', fontWeight: 800 }}>Payload Size</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800 }}>Details / Notes</th>
                </tr>
              </thead>
              <tbody>
                {runsLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                      <PebloLoader text="Loading release log..." minHeight="160px" size="sm" />
                    </td>
                  </tr>
                ) : runs.map((run, idx) => {
                  const isSuccess = run.status === 'SUCCESS';

                  return (
                    <tr
                      key={run.id}
                      className="interactive-row"
                      style={{
                        borderBottom: '1px solid rgba(84, 52, 136, 0.1)',
                        backgroundColor: idx === 0 ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '16px 20px', color: '#543488', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={15} color="#7c3aed" />
                          <span>{formatDate(run.created_at)}</span>
                          {idx === 0 && (
                            <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#10b981', color: '#fff', fontSize: '10px', fontWeight: 800 }}>LIVE</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '16px 16px', color: '#543488', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={15} color="#7c3aed" />
                          <span>{run.triggered_by}</span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            fontWeight: 800,
                            fontFamily: 'var(--font-heading)',
                            backgroundColor: isSuccess ? '#d1fae5' : '#fee2e2',
                            color: isSuccess ? '#065f46' : '#991b1b',
                            border: `1.5px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
                          }}
                        >
                          {isSuccess ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {run.status}
                        </span>
                      </td>

                      <td style={{ padding: '16px 16px', color: '#543488', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                        <span style={{ color: '#7c3aed' }}>{run.shows_count}</span> shows, <span style={{ color: '#0284c7' }}>{run.episodes_count}</span> episodes
                      </td>

                      <td style={{ padding: '16px 16px', color: '#ea580c', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        {Math.round(run.catalogue_size / 1024)} KB
                      </td>

                      <td style={{ padding: '16px 20px', color: '#059669', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '13px' }}>
                        {run.error_message || '✓ Atomic write verified & deployed'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer (For runs timeline and audit table) */}
      {viewMode !== 'shows_timeline' && totalPages > 1 && (
        <div
          style={{
            marginTop: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            color: '#543488',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
          }}
        >
          <span>
            Page {page} of {totalPages} ({total} total release runs)
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                border: '2px solid #543488',
                backgroundColor: '#ffffff',
                color: page <= 1 ? 'rgba(84, 52, 136, 0.4)' : '#543488',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(84, 52, 136, 0.08)',
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                border: '2px solid #543488',
                backgroundColor: '#ffffff',
                color: page >= totalPages ? 'rgba(84, 52, 136, 0.4)' : '#543488',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(84, 52, 136, 0.08)',
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Release Inspection Modal */}
      {selectedRun &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(84, 52, 136, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              margin: 0,
              boxSizing: 'border-box',
            }}
            onClick={() => setSelectedRun(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '640px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '2px solid #7c3aed',
                boxShadow: '0 24px 60px rgba(124, 58, 237, 0.3)',
                padding: '32px',
                position: 'relative',
                animation: 'fadeInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedRun(null)}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(84, 52, 136, 0.08)',
                  border: '1.5px solid rgba(84, 52, 136, 0.2)',
                  color: '#543488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', border: '2px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d28d9' }}>
                  <Rocket size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
                    Release #{selectedRun.id} Snapshot
                  </h3>
                  <p style={{ fontSize: '13px', color: '#7c3aed', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    Triggered at {formatDate(selectedRun.created_at)} by {selectedRun.triggered_by}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                <div style={{ padding: '14px', backgroundColor: '#f5f3ff', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1.5px solid #c4b5fd' }}>
                  <span style={{ fontSize: '11px', color: '#6d28d9', fontWeight: 800, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Shows</span>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#5b21b6', fontFamily: 'var(--font-heading)' }}>{selectedRun.shows_count}</p>
                </div>
                <div style={{ padding: '14px', backgroundColor: '#f0f9ff', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1.5px solid #7dd3fc' }}>
                  <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: 800, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Episodes</span>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#075985', fontFamily: 'var(--font-heading)' }}>{selectedRun.episodes_count}</p>
                </div>
                <div style={{ padding: '14px', backgroundColor: '#fffbeb', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1.5px solid #fcd34d' }}>
                  <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 800, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Payload</span>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#92400e', fontFamily: 'var(--font-heading)' }}>{Math.round(selectedRun.catalogue_size / 1024)} KB</p>
                </div>
              </div>

              <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', backgroundColor: '#ecfdf5', border: '1.5px solid #a7f3d0', marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', color: '#065f46', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>Status & Verification:</p>
                <p style={{ fontSize: '14px', color: '#047857', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                  {selectedRun.status === 'SUCCESS' ? 'Atomic zero-downtime file swap verified. The live viewer stream API serves this static snapshot with instant responsiveness.' : selectedRun.error_message}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <a
                  href={`${API_BASE_URL}/catalog`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'linear-gradient(135deg, #543488, #7c3aed)',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                  }}
                >
                  <ExternalLink size={15} /> Open Live Catalogue JSON
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
