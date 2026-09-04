import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, API_BASE_URL } from '../api/client';
import type { Show, Season } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { ArtworkUploader } from '../components/ArtworkUploader';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  ArrowLeft,
  Edit2,
  Plus,
  Trash2,
  Clock,
  Globe,
  Sparkles,
} from 'lucide-react';

export const ShowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);
  const [showAddSeasonModal, setShowAddSeasonModal] = useState(false);
  const [newSeasonNumber, setNewSeasonNumber] = useState<number>(1);
  const [newSeasonTitle, setNewSeasonTitle] = useState('');
  const [seasonError, setSeasonError] = useState<string | null>(null);
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
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading show workspace...
      </div>
    );
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link
          to="/admin/shows"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
          }}
        >
          <ArrowLeft size={16} /> Back to Shows Catalogue
        </Link>
        <Link
          to={`/admin/shows/${show.id}/edit`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <Edit2 size={14} />
          Edit Show Metadata
        </Link>
      </div>

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
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
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
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
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: isActive
                        ? isTrailer
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'var(--accent-bg)'
                        : 'var(--bg-card)',
                      color: isActive
                        ? isTrailer
                          ? 'var(--warning)'
                          : 'var(--accent-light)'
                        : 'var(--text-secondary)',
                      border: `1px solid ${
                        isActive
                          ? isTrailer
                            ? 'rgba(245, 158, 11, 0.5)'
                            : 'var(--accent-border)'
                          : 'var(--border)'
                      }`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isTrailer && <Sparkles size={14} />}
                    {isTrailer ? 'Season 0 (Trailer)' : `Season ${season.season_number}: ${season.title}`}
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-muted)',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      to={`/admin/episodes/new?season_id=${activeSeason.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--accent)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <Plus size={15} /> Add Episode
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteSeason(activeSeason.id, activeSeason.title)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        color: 'var(--danger)',
                        fontSize: '13px',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Episodes Table */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 16px', width: '60px' }}>#</th>
                        <th style={{ padding: '12px 16px' }}>Episode</th>
                        <th style={{ padding: '12px 16px' }}>Language</th>
                        <th style={{ padding: '12px 16px' }}>Content Group</th>
                        <th style={{ padding: '12px 16px' }}>Duration</th>
                        <th style={{ padding: '12px 16px' }}>Thumbnail</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!activeSeason.episodes || activeSeason.episodes.length === 0) ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No episodes in this season yet.
                          </td>
                        </tr>
                      ) : (
                        activeSeason.episodes.map((ep) => {
                          const thumb = ep.artwork?.find((a) => a.type === 'THUMBNAIL');
                          const thumbUrl = thumb ? (thumb.url.startsWith('http') ? thumb.url : `${API_BASE_URL}${thumb.url}`) : null;
                          const mins = ep.duration ? Math.floor(ep.duration / 60) : null;
                          const secs = ep.duration ? ep.duration % 60 : null;

                          return (
                            <tr
                              key={ep.id}
                              style={{ borderBottom: '1px solid var(--border)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>
                                {ep.episode_number}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <Link
                                  to={`/admin/episodes/${ep.id}/edit`}
                                  style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-light)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                                >
                                  {ep.title}
                                </Link>
                                {ep.description && (
                                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {ep.description}
                                  </p>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '12px' }}>
                                  <Globe size={12} /> {ep.language}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <code style={{ fontSize: '11px', color: 'var(--accent-light)', background: 'var(--accent-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {ep.content_group}
                                </code>
                              </td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                {ep.duration ? (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} /> {mins}m {secs ? `${secs}s` : ''}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--danger)', fontSize: '11px' }}>Missing</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                {thumbUrl ? (
                                  <img
                                    src={thumbUrl}
                                    alt=""
                                    style={{ width: '48px', height: '27px', borderRadius: '3px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <span style={{ color: 'var(--danger)', fontSize: '11px' }}>Missing</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <StatusBadge status={ep.status} />
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <Link
                                    to={`/admin/episodes/${ep.id}/edit`}
                                    style={{ padding: '5px', color: 'var(--text-secondary)' }}
                                    title="Edit Episode"
                                  >
                                    <Edit2 size={15} />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEpisode(ep.id, ep.title)}
                                    style={{ padding: '5px', color: 'var(--text-muted)' }}
                                    title="Delete Episode"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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
