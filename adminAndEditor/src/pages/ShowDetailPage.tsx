import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Show, Season } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { ArtworkUploader } from '../components/ArtworkUploader';
import { ConfirmModal } from '../components/ConfirmModal';
import { PebloLoader } from '../components/PebloLoader';
import {
  ArrowLeft,
  Edit2,
  Plus,
  Trash2,
  Sparkles,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

export const ShowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);
  const [showAddSeasonModal, setShowAddSeasonModal] = useState(false);
  const [newSeasonNumber, setNewSeasonNumber] = useState<number>(1);
  const [newSeasonTitle, setNewSeasonTitle] = useState('');
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const [publishFeedback, setPublishFeedback] = useState<{
    text: string;
    type: 'success' | 'error';
    errors?: Array<{ entity_type: string; title: string; reason: string }>;
  } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'season' | 'episode';
    id: number;
    title: string;
  } | null>(null);

  // Fetch complete show details
  const { data: show, isLoading, isError, refetch } = useQuery<Show>({
    queryKey: ['admin-show-detail', id],
    queryFn: async () => (await api.get(`/admin/shows/${id}`)).data,
  });

  // Publish single show mutation
  const publishShowMutation = useMutation({
    mutationFn: async () => {
      return (await api.post(`/admin/shows/${id}/publish`)).data;
    },
    onSuccess: (data: Show) => {
      queryClient.invalidateQueries({ queryKey: ['admin-show-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-timeline'] });
      setPublishFeedback({
        text: `✓ "${data.title}" has been published live to the Viewer catalogue!`,
        type: 'success',
      });
      setTimeout(() => setPublishFeedback(null), 6000);
    },
    onError: (err: any) => {
      const errDetail = err.response?.data?.detail;
      const msg = typeof errDetail === 'string' ? errDetail : errDetail?.message || 'Failed to publish show.';
      const errorsList = errDetail?.errors || [];
      setPublishFeedback({
        text: msg,
        type: 'error',
        errors: errorsList,
      });
    },
  });

  // Unpublish single show mutation
  const unpublishShowMutation = useMutation({
    mutationFn: async () => {
      return (await api.post(`/admin/shows/${id}/unpublish`)).data;
    },
    onSuccess: (data: Show) => {
      queryClient.invalidateQueries({ queryKey: ['admin-show-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-timeline'] });
      setPublishFeedback({
        text: `"${data.title}" moved to Draft status and removed from live viewer feed.`,
        type: 'success',
      });
      setTimeout(() => setPublishFeedback(null), 6000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Failed to unpublish show.';
      setPublishFeedback({
        text: msg,
        type: 'error',
      });
    },
  });

  // Seasons array
  const seasons = show?.seasons || [];

  // Automatically select first season if none active
  useEffect(() => {
    if (seasons.length > 0 && !activeSeasonId) {
      setActiveSeasonId(seasons[0].id);
    }
  }, [seasons, activeSeasonId]);

  const activeSeason = seasons.find((s) => s.id === activeSeasonId) || seasons[0];

  // Create season mutation
  const createSeasonMutation = useMutation({
    mutationFn: async (payload: { season_number: number; title: string }) => {
      return (await api.post(`/admin/shows/${id}/seasons`, payload)).data;
    },
    onSuccess: (newSeason: Season) => {
      queryClient.invalidateQueries({ queryKey: ['admin-show-detail', id] });
      setShowAddSeasonModal(false);
      setNewSeasonTitle('');
      setActiveSeasonId(newSeason.id);
    },
    onError: (err: any) => {
      setSeasonError(err.response?.data?.detail?.message || 'Failed to create season.');
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: async (seasonId: number) => {
      await api.delete(`/admin/seasons/${seasonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-show-detail', id] });
      setActiveSeasonId(null);
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      await api.delete(`/admin/episodes/${episodeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-show-detail', id] });
    },
  });

  const toggleEpisodeStatusMutation = useMutation({
    mutationFn: async ({ episodeId, newStatus }: { episodeId: number; newStatus: 'DRAFT' | 'PUBLISHED' }) => {
      return (await api.patch(`/admin/episodes/${episodeId}`, { status: newStatus })).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-show-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-validation-report'] });
      setPublishFeedback({
        text: `✓ Episode "${data.title}" status changed to ${data.status}.`,
        type: 'success',
      });
      setTimeout(() => setPublishFeedback(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Failed to update episode status.';
      setPublishFeedback({
        text: msg,
        type: 'error',
      });
    },
  });

  const publishAllSeasonEpisodesMutation = useMutation({
    mutationFn: async (seasonId: number) => {
      return (await api.post(`/admin/seasons/${seasonId}/publish-all`)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-show-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-validation-report'] });
      setPublishFeedback({
        text: `✓ ${data.message}`,
        type: 'success',
      });
      setTimeout(() => setPublishFeedback(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Failed to publish season episodes.';
      setPublishFeedback({
        text: msg,
        type: 'error',
      });
    },
  });

  const handleAddSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonTitle.trim()) {
      setSeasonError('Season title is required.');
      return;
    }
    setSeasonError(null);
    createSeasonMutation.mutate({
      season_number: Number(newSeasonNumber),
      title: newSeasonTitle.trim(),
    });
  };

  const handleDeleteSeason = (seasonId: number, seasonTitle: string) => {
    setDeleteConfirm({ type: 'season', id: seasonId, title: seasonTitle });
  };

  const handleDeleteEpisode = (episodeId: number, epTitle: string) => {
    setDeleteConfirm({ type: 'episode', id: episodeId, title: epTitle });
  };

  if (isLoading) {
    return <PebloLoader text="Loading show workspace..." minHeight="360px" />;
  }

  if (isError || !show) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--danger)' }}>
        Show not found or failed to load. <Link to="/admin/shows">Return to Shows Catalogue</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <Link
          to="/admin/shows"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#543488',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
          }}
        >
          <ArrowLeft size={16} /> Back to Shows Catalogue
        </Link>

        {/* Action CTAs: Publish / Unpublish Show & Edit Show */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {show.status === 'DRAFT' ? (
            <button
              type="button"
              onClick={() => publishShowMutation.mutate()}
              disabled={publishShowMutation.isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                cursor: publishShowMutation.isPending ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => !publishShowMutation.isPending && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Rocket size={15} />
              {publishShowMutation.isPending ? 'Publishing Show...' : 'Publish This Show'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => publishShowMutation.mutate()}
                disabled={publishShowMutation.isPending}
                style={{
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
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                  cursor: publishShowMutation.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                <Sparkles size={14} />
                {publishShowMutation.isPending ? 'Syncing...' : 'Sync / Re-publish'}
              </button>
              <button
                type="button"
                onClick={() => unpublishShowMutation.mutate()}
                disabled={unpublishShowMutation.isPending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#fff7ed',
                  border: '1.5px solid #fdba74',
                  color: '#c2410c',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  cursor: unpublishShowMutation.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {unpublishShowMutation.isPending ? 'Unpublishing...' : 'Unpublish (Draft)'}
              </button>
            </div>
          )}

          <Link
            to={`/admin/shows/${show.id}/edit`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#ffffff',
              border: '1.5px solid rgba(84, 52, 136, 0.25)',
              color: '#543488',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
            }}
          >
            <Edit2 size={14} />
            Edit Show Metadata
          </Link>
        </div>
      </div>

      {/* Publish Feedback Alert Banner */}
      {publishFeedback && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            backgroundColor: publishFeedback.type === 'success' ? '#ecfdf5' : '#fff1f2',
            border: `2px solid ${publishFeedback.type === 'success' ? '#10b981' : '#f43f5e'}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            {publishFeedback.type === 'success' ? (
              <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertTriangle size={20} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 700,
                  color: publishFeedback.type === 'success' ? '#065f46' : '#9f1239',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {publishFeedback.text}
              </p>
              {publishFeedback.errors && publishFeedback.errors.length > 0 && (
                <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: '13px', color: '#be123c' }}>
                  {publishFeedback.errors.map((err, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {err.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPublishFeedback(null)}
            style={{
              background: 'none',
              border: 'none',
              color: publishFeedback.type === 'success' ? '#059669' : '#e11d48',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Show Overview Header Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>{show.title}</h1>
            <StatusBadge status={show.status} />
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '800px', lineHeight: 1.6, marginBottom: '16px' }}>
            {show.synopsis || 'No synopsis provided.'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {show.section && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                Section: <strong>{show.section}</strong>
              </span>
            )}
            {show.category && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                Category: <strong>{show.category}</strong>
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              Seasons: <strong>{seasons.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Show Artwork Manager */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Show Artwork Assets
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Upload the vertical Poster (for catalogue carousels) and wide Banner (for hero backgrounds).
          </p>
        </div>

        <ArtworkUploader
          showId={show.id}
          existingArtwork={show.artwork || []}
          allowedTypes={['POSTER', 'BANNER']}
          onArtworkChange={() => refetch()}
        />
      </div>

      {/* Section 2: Seasons & Episodes Manager */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Seasons & Episodes
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Manage episode listings and multi-language variant groups.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewSeasonNumber(seasons.length > 0 ? Math.max(...seasons.map((s) => s.season_number)) + 1 : 1);
              setShowAddSeasonModal(true);
            }}
            className="btn-peblo-primary"
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Plus size={16} /> Add Season
          </button>
        </div>

        {/* Season Navigation Tabs */}
        {seasons.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>No seasons added yet.</p>
            <button
              type="button"
              onClick={() => setShowAddSeasonModal(true)}
              className="btn-peblo-primary"
              style={{
                padding: '9px 18px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              Create Season 1 or Season 0 (Trailer)
            </button>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '12px',
                marginBottom: '20px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {seasons.map((season) => {
                const isActive = activeSeason?.id === season.id;
                const isTrailer = season.season_number === 0;

                return (
                  <button
                    key={season.id}
                    type="button"
                    onClick={() => setActiveSeasonId(season.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: isActive
                        ? isTrailer
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'var(--peblo-purple)'
                        : 'var(--bg-card)',
                      color: isActive
                        ? isTrailer
                          ? 'var(--warning)'
                          : '#ffffff'
                        : 'var(--text-secondary)',
                      border: `1.5px solid ${
                        isActive
                          ? isTrailer
                            ? 'rgba(245, 158, 11, 0.5)'
                            : 'var(--peblo-purple)'
                          : 'var(--border)'
                      }`,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {isTrailer && <Sparkles size={14} />}
                    {isTrailer ? 'Season 0 (Trailer)' : `Season ${season.season_number}: ${season.title}`}
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(84, 52, 136, 0.08)',
                        color: isActive ? '#ffffff' : 'var(--text-primary)',
                      }}
                    >
                      {season.episodes?.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Season Info & Episodes */}
            {activeSeason && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {activeSeason.season_number === 0
                        ? 'Season 0 — Official Trailers & Teasers'
                        : `Season ${activeSeason.season_number}: ${activeSeason.title}`}
                    </h3>
                    {activeSeason.season_number === 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '2px' }}>
                        ★ Note: Season 0 is strictly excluded from viewer season lists and shown as trailers.
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {activeSeason.episodes?.some((ep) => ep.status === 'DRAFT') && (
                      <button
                        type="button"
                        onClick={() => publishAllSeasonEpisodesMutation.mutate(activeSeason.id)}
                        disabled={publishAllSeasonEpisodesMutation.isPending}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-full)',
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                          cursor: publishAllSeasonEpisodesMutation.isPending ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        <Rocket size={13} />
                        {publishAllSeasonEpisodesMutation.isPending
                          ? 'Publishing...'
                          : `Publish All Draft Episodes (${activeSeason.episodes.filter((ep) => ep.status === 'DRAFT').length})`}
                      </button>
                    )}
                    <Link
                      to={`/admin/episodes/new?season_id=${activeSeason.id}&title=${encodeURIComponent(show.title)}&season=${activeSeason.season_number}&episode=${(activeSeason.episodes?.length || 0) + 1}`}
                      className="btn-peblo-primary"
                      style={{
                        padding: '8px 14px',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      <Plus size={15} /> Add Episode
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteSeason(activeSeason.id, activeSeason.title)}
                      title="Delete Season"
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid rgba(84, 52, 136, 0.2)',
                        color: 'var(--peblo-purple)',
                        backgroundColor: '#fff',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Clean Episode List: Episode Number, Name, Status, Language, Duration & Actions */}
                {(!activeSeason.episodes || activeSeason.episodes.length === 0) ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#fff', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
                      No episodes in {activeSeason.season_number === 0 ? 'trailers' : `Season ${activeSeason.season_number}`} yet.
                    </p>
                    <Link
                      to={`/admin/episodes/new?season_id=${activeSeason.id}&title=${encodeURIComponent(show.title)}&season=${activeSeason.season_number}&episode=1`}
                      className="btn-peblo-primary"
                      style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex' }}
                    >
                      <Plus size={15} /> Add Episode 1
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeSeason.episodes.map((ep) => {
                      const editUrl = `/admin/episodes/${ep.id}/edit?title=${encodeURIComponent(show.title)}&season=${activeSeason.season_number}&episode=${ep.episode_number}`;
                      const isPublished = ep.status === 'PUBLISHED';
                      const durMins = ep.duration ? Math.floor(ep.duration / 60) : 0;
                      const durSecs = ep.duration ? ep.duration % 60 : 0;

                      return (
                        <div
                          key={ep.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            backgroundColor: '#ffffff',
                            border: isPublished ? '1.5px solid var(--border)' : '1.5px dashed rgba(245, 158, 11, 0.4)',
                            borderRadius: 'var(--radius-md)',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 2px 6px rgba(84, 52, 136, 0.03)',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--peblo-purple)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(84, 52, 136, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isPublished ? 'var(--border)' : 'rgba(245, 158, 11, 0.4)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(84, 52, 136, 0.03)';
                          }}
                        >
                          {/* Left: Episode Number & Name Link */}
                          <Link
                            to={editUrl}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              flex: '1 1 260px',
                              overflow: 'hidden',
                              textDecoration: 'none',
                            }}
                          >
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: isPublished ? 'rgba(84, 52, 136, 0.08)' : 'rgba(245, 158, 11, 0.1)',
                                color: isPublished ? 'var(--peblo-purple)' : '#b45309',
                                fontSize: '12px',
                                fontWeight: 800,
                                fontFamily: 'var(--font-heading)',
                                flexShrink: 0,
                              }}
                            >
                              Episode {ep.episode_number}
                            </span>
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ep.title || `Episode ${ep.episode_number}`}
                            </span>
                          </Link>

                          {/* Middle: Badges (Status, Language, Duration) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <StatusBadge status={ep.status} />
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(84, 52, 136, 0.08)',
                                color: '#543488',
                              }}
                            >
                              {ep.language?.toUpperCase() || 'EN'}
                            </span>
                            {ep.duration && ep.duration > 0 ? (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {durMins}m {durSecs}s
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>
                                Missing duration
                              </span>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {/* Quick Publish / Unpublish Button */}
                            <button
                              type="button"
                              onClick={() =>
                                toggleEpisodeStatusMutation.mutate({
                                  episodeId: ep.id,
                                  newStatus: isPublished ? 'DRAFT' : 'PUBLISHED',
                                })
                              }
                              disabled={toggleEpisodeStatusMutation.isPending}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: isPublished ? 'rgba(84, 52, 136, 0.08)' : 'linear-gradient(135deg, #059669, #10b981)',
                                background: isPublished ? 'rgba(84, 52, 136, 0.08)' : 'linear-gradient(135deg, #059669, #10b981)',
                                color: isPublished ? '#543488' : '#ffffff',
                                fontSize: '12px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              title={isPublished ? 'Move episode to draft' : 'Publish episode live'}
                            >
                              {isPublished ? 'Unpublish' : 'Publish'}
                            </button>

                            <Link
                              to={editUrl}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(84, 52, 136, 0.06)',
                                color: 'var(--peblo-purple)',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Edit2 size={13} /> Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteEpisode(ep.id, ep.title)}
                              title="Delete Episode"
                              style={{
                                padding: '6px',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Season Modal */}
      {showAddSeasonModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              width: '100%',
              maxWidth: '460px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Add New Season
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Set Season Number (0 = Trailer) and Season Title.
            </p>

            {seasonError && (
              <div style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '14px' }}>
                {seasonError}
              </div>
            )}

            <form onSubmit={handleAddSeasonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Season Number *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newSeasonNumber}
                  onChange={(e) => setNewSeasonNumber(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Use <strong>0</strong> for trailers and teasers.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Season Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={newSeasonNumber === 0 ? 'Official Trailers' : 'e.g. Fire & Frost'}
                  value={newSeasonTitle}
                  onChange={(e) => setNewSeasonTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSeasonModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSeasonMutation.isPending}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {createSeasonMutation.isPending ? 'Creating...' : 'Create Season'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.type === 'season' ? 'Delete Season & Episodes?' : 'Delete Episode?'}
        itemName={deleteConfirm?.title}
        message={
          deleteConfirm?.type === 'season'
            ? 'Are you sure you want to delete this season? All associated episodes will also be permanently removed.'
            : 'Are you sure you want to permanently delete this episode?'
        }
        confirmLabel={deleteConfirm?.type === 'season' ? 'Yes, Delete Season' : 'Yes, Delete Episode'}
        cancelLabel="Keep It"
        isLoading={deleteSeasonMutation.isPending || deleteEpisodeMutation.isPending}
        onConfirm={() => {
          if (deleteConfirm) {
            if (deleteConfirm.type === 'season') {
              deleteSeasonMutation.mutate(deleteConfirm.id, {
                onSettled: () => setDeleteConfirm(null),
              });
            } else {
              deleteEpisodeMutation.mutate(deleteConfirm.id, {
                onSettled: () => setDeleteConfirm(null),
              });
            }
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};
