import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Show, ItemStatus } from '../api/types';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export const ShowFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [section, setSection] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ItemStatus>('DRAFT');
  const [error, setError] = useState<string | null>(null);

  const { data: existingShow, isLoading } = useQuery<Show>({
    queryKey: ['admin-show-detail', id],
    queryFn: async () => (await api.get(`/admin/shows/${id}`)).data,
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingShow) {
      setTitle(existingShow.title || '');
      setSynopsis(existingShow.synopsis || '');
      setSection(existingShow.section || '');
      setCategory(existingShow.category || '');
      setStatus(existingShow.status || 'DRAFT');
    }
  }, [existingShow]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditing) {
        return (await api.patch(`/admin/shows/${id}`, payload)).data;
      } else {
        return (await api.post('/admin/shows', payload)).data;
      }
    },
    onSuccess: (savedShow) => {
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-show-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-validation-report'] });
      navigate(`/admin/shows/${savedShow.id}`);
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      setError(detail?.message || err.message || 'Failed to save show.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Show title is required.');
      return;
    }

    if (status === 'PUBLISHED' && !section.trim()) {
      setError('A published show must have a valid Section specified.');
      return;
    }

    setError(null);
    saveMutation.mutate({
      title: title.trim(),
      synopsis: synopsis.trim() || null,
      section: section.trim() || null,
      category: category.trim() || null,
      status,
    });
  };

  if (isEditing && isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading show details...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Back button */}
      <Link
        to="/admin/shows"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={16} /> Back to Shows Catalogue
      </Link>

      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {isEditing ? `Edit Show: ${existingShow?.title}` : 'Create New Show'}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Enter the show's metadata and publication status.
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
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Show Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cyber Odyssey 2099"
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

          {/* Synopsis */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Synopsis / Overview
            </label>
            <textarea
              rows={4}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Write a compelling description for this show..."
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

          {/* Grid for Section, Category, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Section */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Section {status === 'PUBLISHED' && <span style={{ color: 'var(--danger)' }}>*</span>}
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Trending Now, Peblo Originals"
                list="sections-datalist"
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
              <datalist id="sections-datalist">
                <option value="Trending Now" />
                <option value="Peblo Originals" />
                <option value="Kids & Family" />
                <option value="Crime Thrillers" />
                <option value="Sci-Fi & Fantasy" />
                <option value="Documentaries" />
              </datalist>
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Sci-Fi, Drama, Animation"
                list="categories-datalist"
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
              <datalist id="categories-datalist">
                <option value="Sci-Fi" />
                <option value="Drama" />
                <option value="Animation" />
                <option value="Comedy" />
                <option value="Fantasy" />
                <option value="Thriller" />
              </datalist>
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
                <option value="DRAFT">Draft (Work in Progress)</option>
                <option value="PUBLISHED">Published (Visible in Catalogue)</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Link
              to="/admin/shows"
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
            </Link>
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
              {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Show' : 'Create Show'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
