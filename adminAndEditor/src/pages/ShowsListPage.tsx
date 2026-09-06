import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../api/client';
import type { ShowListResponse } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { CustomSelect } from '../components/CustomSelect';
import { PebloLoader } from '../components/PebloLoader';
import { SECTIONS, LANGUAGES } from '../constants/taxonomies';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Film,
  Image as ImageIcon,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  X,
  CheckSquare,
  Check,
} from 'lucide-react';

export const ShowsListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('');
  const [status, setStatus] = useState<string>('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [selectedShowIds, setSelectedShowIds] = useState<number[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<{
    text: string;
    type: 'success' | 'error';
    errors?: Array<{ entity_type: string; title: string; reason: string }>;
  } | null>(null);

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

  const publishMutation = useMutation({
    mutationFn: async (showId: number) => {
      return (await api.post(`/admin/shows/${showId}/publish`)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-overview'] });
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

  const unpublishMutation = useMutation({
    mutationFn: async (showId: number) => {
      return (await api.post(`/admin/shows/${showId}/unpublish`)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-overview'] });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/shows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-timeline'] });
      setDeleteTarget(null);
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return (await api.post('/admin/shows/batch-delete', { ids })).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-shows-timeline'] });
      setPublishFeedback({
        text: `✓ ${data.message || `Successfully deleted ${selectedShowIds.length} shows.`}`,
        type: 'success',
      });
      setSelectedShowIds([]);
      setIsBatchDeleteModalOpen(false);
      setTimeout(() => setPublishFeedback(null), 6000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Failed to delete selected shows.';
      setPublishFeedback({
        text: msg,
        type: 'error',
      });
      setIsBatchDeleteModalOpen(false);
    },
  });

  const handleDelete = (id: number, title: string) => {
    setDeleteTarget({ id, title });
  };

  const shows = data?.items || [];
  const totalPages = data?.total_pages || 1;

  const toggleSelectShow = (id: number) => {
    setSelectedShowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (shows.length === 0) return;
    const currentIds = shows.map((s) => s.id);
    const allSelected = currentIds.every((id) => selectedShowIds.includes(id));
    if (allSelected) {
      setSelectedShowIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedShowIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const isAllCurrentPageSelected = shows.length > 0 && shows.every((s) => selectedShowIds.includes(s.id));
  const isSomeCurrentPageSelected = shows.some((s) => selectedShowIds.includes(s.id)) && !isAllCurrentPageSelected;

  return (
    <div>
      {/* Header */}
      <div className="page-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Shows Catalogue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage series, seasons, episodes, and artwork assets
          </p>
        </div>
        <div className="header-actions">
          <Link
            to="/admin/shows/new"
            className="btn-peblo-primary"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
            }}
          >
            <Plus size={16} />
            Create Show
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
        <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
          <CustomSelect
            value={section}
            onChange={(val) => {
              setSection(val);
              setPage(1);
            }}
            placeholder="All Sections"
            searchable={false}
            options={[
              { value: '', label: 'All Sections' },
              ...SECTIONS.map((sec) => ({
                value: sec,
                label: sec.charAt(0).toUpperCase() + sec.slice(1),
                badge: sec === 'featured' ? 'Hero' : undefined,
              })),
            ]}
          />
        </div>

        {/* Status Filter */}
        <div style={{ flex: '1 1 170px', minWidth: '150px' }}>
          <CustomSelect
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            placeholder="All Statuses"
            searchable={false}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PUBLISHED', label: 'Published', badge: 'Live' },
              { value: 'DRAFT', label: 'Draft', badge: 'Draft' },
            ]}
          />
        </div>

        {/* Language Filter */}
        <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
          <CustomSelect
            value={language}
            onChange={(val) => {
              setLanguage(val);
              setPage(1);
            }}
            placeholder="All Languages"
            searchable={false}
            options={[
              { value: '', label: 'All Languages' },
              ...LANGUAGES.map((lang) => ({
                value: lang.code,
                label: `${lang.name} (${lang.code.toUpperCase()})`,
              })),
            ]}
          />
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

      {/* Floating / Pinned Batch Selection Action Bar */}
      {selectedShowIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            marginBottom: '18px',
            backgroundColor: '#f5f3ff',
            border: '2px solid #7c3aed',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)',
            flexWrap: 'wrap',
            gap: '14px',
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '14px',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {selectedShowIds.length}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
                {selectedShowIds.length} Show{selectedShowIds.length === 1 ? '' : 's'} Selected
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>
                You can delete all selected shows and their seasons/episodes at once
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#ffffff',
                border: '1.5px solid #c4b5fd',
                color: '#6d28d9',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckSquare size={14} />
              {isAllCurrentPageSelected ? 'Deselect Page' : 'Select All Page'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedShowIds([])}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setIsBatchDeleteModalOpen(true)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#dc2626',
                border: '1.5px solid #b91c1c',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <Trash2 size={15} />
              Delete {selectedShowIds.length} Selected
            </button>
          </div>
        </div>
      )}

      {/* Shows List Container */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          padding: '16px',
        }}
      >
        {isLoading ? (
          <PebloLoader text="Loading shows catalogue..." minHeight="240px" />
        ) : isError ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--danger)' }}>
            Failed to load shows. Please refresh.
          </div>
        ) : shows.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center' }}>
            <Film size={40} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>No shows found</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Try adjusting your search criteria or create a new show.
            </p>
          </div>
        ) : (
          <div>
            {/* Header / Select All on Page Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                marginBottom: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <div
                onClick={handleSelectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '5px',
                    border: `2px solid ${isAllCurrentPageSelected || isSomeCurrentPageSelected ? '#7c3aed' : 'rgba(84, 52, 136, 0.3)'}`,
                    backgroundColor: isAllCurrentPageSelected ? '#7c3aed' : isSomeCurrentPageSelected ? '#ede9fe' : '#ffffff',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {isAllCurrentPageSelected && <Check size={14} strokeWidth={3} />}
                  {isSomeCurrentPageSelected && (
                    <div style={{ width: '8px', height: '2px', backgroundColor: '#7c3aed', borderRadius: '1px' }} />
                  )}
                </div>
                <span>Select All on this Page</span>
              </div>

              <span>
                Showing {shows.length} of {data?.total || shows.length} shows
              </span>
            </div>

            {/* Shows List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shows.map((show) => {
                const poster = show.artwork?.find((a) => a.type === 'POSTER');
                const posterUrl = poster ? (poster.url.startsWith('http') ? poster.url : `${API_BASE_URL}${poster.url}`) : null;
                const detailUrl = `/admin/shows/${show.id}`;
                const isSelected = selectedShowIds.includes(show.id);

                return (
                  <div
                    key={show.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
                      border: isSelected ? '2px solid #7c3aed' : '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isSelected ? '0 4px 16px rgba(124, 58, 237, 0.12)' : '0 2px 8px rgba(84, 52, 136, 0.04)',
                      gap: '14px',
                      flexWrap: 'wrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--peblo-purple)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(84, 52, 136, 0.10)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(84, 52, 136, 0.04)';
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectShow(show.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: `2px solid ${isSelected ? '#7c3aed' : 'rgba(84, 52, 136, 0.3)'}`,
                        backgroundColor: isSelected ? '#7c3aed' : '#ffffff',
                        color: '#ffffff',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.18s ease',
                      }}
                      title={isSelected ? 'Deselect Show' : 'Select Show for Batch Actions'}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>

                    {/* Left: Poster + Show Info Link */}
                    <Link
                      to={detailUrl}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flex: '1 1 260px',
                        minWidth: '200px',
                        textDecoration: 'none',
                      }}
                    >
                      {/* Mini Poster */}
                      <div
                        style={{
                          width: '46px',
                          height: '68px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(84, 52, 136, 0.06)',
                          border: '1px solid var(--border)',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        {posterUrl ? (
                          <img src={posterUrl} alt={show.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ImageIcon size={20} color="var(--text-muted)" />
                        )}
                      </div>

                      {/* Title & Metadata Pills */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                        <h3
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {show.title}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <StatusBadge status={show.status} />

                          {show.section && (
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: isSelected ? '#ffffff' : 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                              {show.section}
                            </span>
                          )}

                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {show.seasons_count} season{show.seasons_count === 1 ? '' : 's'} • {show.episodes_count} ep{show.episodes_count === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Right: Quick Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {show.status === 'DRAFT' ? (
                        <button
                          type="button"
                          onClick={() => publishMutation.mutate(show.id)}
                          disabled={publishMutation.isPending}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 'var(--radius-full)',
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                            cursor: publishMutation.isPending ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Rocket size={13} /> Publish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => unpublishMutation.mutate(show.id)}
                          disabled={unpublishMutation.isPending}
                          title="Move to Draft (Unpublish)"
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: '#fff7ed',
                            border: '1.5px solid #fdba74',
                            color: '#c2410c',
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: unpublishMutation.isPending ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Unpublish
                        </button>
                      )}

                      <Link
                        to={detailUrl}
                        className="btn-peblo-primary"
                        style={{
                          padding: '7px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Eye size={14} /> Manage
                      </Link>

                      <Link
                        to={`/admin/shows/${show.id}/edit`}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(84, 52, 136, 0.06)',
                          border: '1px solid rgba(84, 52, 136, 0.15)',
                          color: 'var(--peblo-purple)',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                        }}
                        title="Edit Show Metadata"
                      >
                        <Edit2 size={13} /> Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(show.id, show.title)}
                        title="Delete Show"
                        style={{
                          padding: '7px',
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
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              paddingTop: '16px',
              marginTop: '16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
              gap: '12px',
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
                  backgroundColor: '#ffffff',
                  color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
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
                  backgroundColor: '#ffffff',
                  color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single Show Deletion Confirmation Modal */}
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

      {/* Batch Multiple Shows Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={isBatchDeleteModalOpen}
        title="Delete Multiple Shows?"
        itemName={`${selectedShowIds.length} Selected Shows`}
        message={`Are you sure you want to permanently delete these ${selectedShowIds.length} shows? All associated seasons, episodes, and artwork assets across all ${selectedShowIds.length} shows will be completely removed.`}
        confirmLabel={`Yes, Delete ${selectedShowIds.length} Shows`}
        cancelLabel="Keep Shows"
        isLoading={batchDeleteMutation.isPending}
        onConfirm={() => {
          batchDeleteMutation.mutate(selectedShowIds);
        }}
        onCancel={() => setIsBatchDeleteModalOpen(false)}
      />
    </div>
  );
};
