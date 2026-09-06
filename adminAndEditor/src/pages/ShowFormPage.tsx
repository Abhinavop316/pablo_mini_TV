import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Show, ItemStatus } from '../api/types';
import { SECTIONS, CATEGORIES, LANGUAGES } from '../constants/taxonomies';
import { CustomSelect } from '../components/CustomSelect';
import { PebloLoader } from '../components/PebloLoader';
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
  const [language, setLanguage] = useState('en');
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
    return <PebloLoader text="Loading show details..." minHeight="300px" />;
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

          {/* Grid for Section, Category, Language, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
            {/* Section */}
            <CustomSelect
              label="Section"
              required={status === 'PUBLISHED'}
              value={section}
              onChange={setSection}
              placeholder="-- Select Section --"
              searchable={false}
              options={SECTIONS.map((sec) => ({
                value: sec,
                label: sec.charAt(0).toUpperCase() + sec.slice(1),
                badge: sec === 'featured' ? 'Hero' : undefined,
              }))}
              helperText={status === 'PUBLISHED' ? 'Required for published status' : 'Select layout display section'}
            />

            {/* Category */}
            <CustomSelect
              label="Category"
              value={category}
              onChange={setCategory}
              placeholder="-- Select Category --"
              searchable={true}
              options={CATEGORIES.map((cat) => ({
                value: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
              }))}
              helperText="Curated topic for viewer discovery"
            />

            {/* Language */}
            <CustomSelect
              label="Language"
              value={language}
              onChange={setLanguage}
              placeholder="-- Select Language --"
              searchable={false}
              options={LANGUAGES.map((lang) => ({
                value: lang.code,
                label: `${lang.name} (${lang.code.toUpperCase()})`,
                badge: lang.code === 'en' ? 'English' : 'Hindi',
              }))}
              helperText="Target audio locale (English, Hindi)"
            />

            {/* Status */}
            <CustomSelect
              label="Status"
              value={status}
              onChange={(val) => setStatus(val as ItemStatus)}
              searchable={false}
              options={[
                {
                  value: 'DRAFT',
                  label: 'Draft',
                  description: 'Work in progress, hidden from public catalog',
                  badge: 'Internal',
                },
                {
                  value: 'PUBLISHED',
                  label: 'Published',
                  description: 'Live & available to stream in Viewer',
                  badge: 'Live',
                },
              ]}
              helperText="Defines public visibility status"
            />
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
