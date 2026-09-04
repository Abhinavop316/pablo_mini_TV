import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../api/client';
import type { ShowListResponse } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { Search, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, Film, Image as ImageIcon } from 'lucide-react';

export const ShowsListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('');
  const [status, setStatus] = useState<string>('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const pageSize = 15;

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ShowListResponse>({
    queryKey: ['admin-shows', search, section, status, language, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (section) params.append('section', section);
      if (status) params.append('status', status);
      if (language) params.append('language', language);
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());

      const res = await api.get(`/admin/shows?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/shows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-overview'] });
      setDeleteTarget(null);
    },
  });

  const handleDelete = (id: number, title: string) => {
    setDeleteTarget({ id, title });
  };

  const shows = data?.items || [];
  const totalPages = data?.total_pages || 1;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Shows Catalogue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage series, seasons, episodes, and artwork assets
          </p>
        </div>
        <Link
          to="/admin/shows/new"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #aa3bff, #9333ea)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(170, 59, 255, 0.3)',
          }}
        >
          <Plus size={16} />
          Create Show
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search shows by title, synopsis, category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Section Filter */}
        <div style={{ flex: '0 1 160px' }}>
          <select
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Sections</option>
            <option value="Trending Now">Trending Now</option>
            <option value="Peblo Originals">Peblo Originals</option>
            <option value="Kids & Family">Kids & Family</option>
            <option value="Crime Thrillers">Crime Thrillers</option>
            <option value="Documentaries">Documentaries</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ flex: '0 1 150px' }}>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        {/* Language Filter */}
        <div style={{ flex: '0 1 150px' }}>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Languages</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="Japanese">Japanese</option>
          </select>
        </div>

        {(search || section || status || language) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSection('');
              setStatus('');
              setLanguage('');
              setPage(1);
            }}
            style={{
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Shows Table Container */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Show</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Section</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Content</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Last Updated</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading shows catalogue...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
                    Failed to load shows. Please refresh.
                  </td>
                </tr>
              ) : shows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <Film size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>No shows found</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Try adjusting your search criteria or create a new show.
                    </p>
                  </td>
                </tr>
              ) : (
                shows.map((show) => {
                  const poster = show.artwork?.find((a) => a.type === 'POSTER');
                  const posterUrl = poster ? (poster.url.startsWith('http') ? poster.url : `${API_BASE_URL}${poster.url}`) : null;

                  return (
                    <tr
                      key={show.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Show Details */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '56px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--border)',
                              overflow: 'hidden',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {posterUrl ? (
                              <img src={posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <ImageIcon size={16} color="var(--text-muted)" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/admin/shows/${show.id}`}
                              style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-light)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                            >
                              {show.title}
                            </Link>
                            {show.synopsis && (
                              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {show.synopsis}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Section */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {show.section ? (
                          <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '12px' }}>
                            {show.section}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--danger)', fontSize: '12px' }}>Missing Section</span>
                        )}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {show.category || '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={show.status} />
                      </td>

                      {/* Counts */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        <span>{show.seasons_count} season{show.seasons_count === 1 ? '' : 's'}</span>
                        <span style={{ margin: '0 6px', color: 'var(--border)' }}>•</span>
                        <span>{show.episodes_count} ep{show.episodes_count === 1 ? '' : 's'}</span>
                      </td>

                      {/* Updated Date */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {new Date(show.updated_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            to={`/admin/shows/${show.id}`}
                            title="Manage Seasons & Episodes"
                            style={{
                              padding: '6px',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-secondary)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/admin/shows/${show.id}/edit`}
                            title="Edit Show Metadata"
                            style={{
                              padding: '6px',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-secondary)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(show.id, show.title)}
                            title="Delete Show"
                            style={{
                              padding: '6px',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-muted)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <Trash2 size={16} />
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              Showing Page {page} of {totalPages} ({data?.total} total shows)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-primary)',
                  color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
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
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-primary)',
                  color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Show & Episodes?"
        itemName={deleteTarget?.title}
        message="Are you sure you want to permanently delete this show? All associated seasons, episodes, and artwork assets will be completely removed."
        confirmLabel="Yes, Delete Show"
        cancelLabel="Keep Show"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
