import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Episode, ItemStatus } from '../api/types';
import { ArtworkUploader } from '../components/ArtworkUploader';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export const EpisodeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const seasonIdParam = searchParams.get('season_id');

  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<string>('');
  const [language, setLanguage] = useState('English');
  const [contentGroup, setContentGroup] = useState('');
  const [status, setStatus] = useState<ItemStatus>('DRAFT');
  const [error, setError] = useState<string | null>(null);

  const { data: existingEpisode, isLoading, refetch } = useQuery<Episode>({
    queryKey: ['admin-episode-detail', id],
    queryFn: async () => (await api.get(`/admin/episodes/${id}`)).data,
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingEpisode) {
      setEpisodeNumber(existingEpisode.episode_number);
      setTitle(existingEpisode.title || '');
      setDescription(existingEpisode.description || '');
      setDuration(existingEpisode.duration ? existingEpisode.duration.toString() : '');
      setLanguage(existingEpisode.language || 'English');
      setContentGroup(existingEpisode.content_group || '');
      setStatus(existingEpisode.status || 'DRAFT');
    }
  }, [existingEpisode]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditing) {
        return (await api.patch(`/admin/episodes/${id}`, payload)).data;
      } else {
        const seasonId = seasonIdParam || existingEpisode?.season_id;
        if (!seasonId) throw new Error('Season ID is missing.');
        return (await api.post(`/admin/seasons/${seasonId}/episodes`, payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-show-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-validation-report'] });
      navigate(-1);
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      setError(detail?.message || err.message || 'Failed to save episode.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Episode title is required.');
      return;
    }
    if (!contentGroup.trim()) {
      setError('Content group is required (e.g. show_s1_ep1).');
      return;
    }

    const durationNum = duration ? parseInt(duration, 10) : null;
    if (status === 'PUBLISHED' && (!durationNum || durationNum <= 0)) {
      setError('A published episode must have a duration greater than 0 seconds.');
      return;
    }

    setError(null);
    saveMutation.mutate({
      episode_number: Number(episodeNumber),
      title: title.trim(),
      description: description.trim() || null,
      duration: durationNum,
      language: language.trim(),
      content_group: contentGroup.trim(),
      status,
    });
  };

  const parsedDuration = parseInt(duration, 10);
  const formattedMinutes = !isNaN(parsedDuration) && parsedDuration > 0 ? Math.floor(parsedDuration / 60) : 0;
  const formattedSeconds = !isNaN(parsedDuration) && parsedDuration > 0 ? parsedDuration % 60 : 0;

  if (isEditing && isLoading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading episode...</div>;
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={16} /> Back to Show
      </button>

      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          marginBottom: '32px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {isEditing ? `Edit Episode: ${existingEpisode?.title}` : 'Create New Episode'}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Configure episode metadata, language variants, duration, and thumbnail artwork.
        </p>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
            {/* Episode Number */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Ep Number *
              </label>
              <input
                type="number"
                min="1"
                required
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Episode Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Genesis Protocol"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Description / Synopsis
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Synopsis of this episode..."
              style={{
                width: '100%',
                padding: '11px 14px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Grid: Duration, Language, Content Group, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Duration (Seconds) {status === 'PUBLISHED' && <span style={{ color: 'var(--danger)' }}>*</span>}
              </label>
              <input
                type="number"
                min="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 2700 (45 mins)"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {parsedDuration > 0 ? `approx. ${formattedMinutes} min ${formattedSeconds} sec` : 'Required for published status'}
              </span>
            </div>

            {/* Language */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Language *
              </label>
              <input
                type="text"
                required
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. English, Hindi, Spanish"
                list="language-options"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <datalist id="language-options">
                <option value="English" />
                <option value="Hindi" />
                <option value="Spanish" />
                <option value="French" />
                <option value="German" />
                <option value="Japanese" />
              </datalist>
            </div>

            {/* Content Group */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Content Group *
              </label>
              <input
                type="text"
                required
                value={contentGroup}
                onChange={(e) => setContentGroup(e.target.value)}
                placeholder="e.g. ep_scifi_1"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--accent-light)' }}>
                Identifies language variants of same episode
              </span>
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '11px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #aa3bff, #9333ea)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(170, 59, 255, 0.3)',
                cursor: saveMutation.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={16} />
              {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Episode' : 'Create Episode'}
            </button>
          </div>
        </form>
      </div>

      {/* Episode Thumbnail Artwork Manager (when episode is saved) */}
      {isEditing && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Episode Thumbnail
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Upload a 16:9 thumbnail (~640x360 px, &le; 200 KB) for this episode.
            </p>
          </div>

          <ArtworkUploader
            episodeId={existingEpisode?.id}
            existingArtwork={existingEpisode?.artwork || []}
            allowedTypes={['THUMBNAIL']}
            onArtworkChange={() => refetch()}
          />
        </div>
      )}
    </div>
  );
};
