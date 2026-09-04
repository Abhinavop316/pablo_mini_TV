import React, { useState } from 'react';
import { api, API_BASE_URL } from '../api/client';
import type { Artwork, ArtworkType } from '../api/types';
import { ConfirmModal } from './ConfirmModal';
import { Upload, Trash2, CheckCircle2, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ArtworkUploaderProps {
  showId?: number;
  episodeId?: number;
  existingArtwork: Artwork[];
  allowedTypes: ArtworkType[];
  onArtworkChange: () => void;
}

const SLOT_CONFIG: Record<
  ArtworkType,
  { name: string; ratio: string; dims: string; maxKb: number; aspectDesc: string }
> = {
  POSTER: {
    name: 'Poster',
    ratio: '2:3',
    dims: '600 × 900 px',
    maxKb: 200,
    aspectDesc: 'Vertical poster for show cards',
  },
  BANNER: {
    name: 'Banner',
    ratio: '16:9',
    dims: '1280 × 720 px',
    maxKb: 200,
    aspectDesc: 'Wide hero banner for show details & featured displays',
  },
  THUMBNAIL: {
    name: 'Thumbnail',
    ratio: '16:9',
    dims: '640 × 360 px',
    maxKb: 200,
    aspectDesc: 'Episode thumbnail image',
  },
};

export const ArtworkUploader: React.FC<ArtworkUploaderProps> = ({
  showId,
  episodeId,
  existingArtwork,
  allowedTypes,
  onArtworkChange,
}) => {
  const [uploadingType, setUploadingType] = useState<ArtworkType | null>(null);
  const [errorMessage, setErrorMessage] = useState<{ type: ArtworkType; message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<{ type: ArtworkType; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ artworkId: number; type: ArtworkType; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileSelect = async (type: ArtworkType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadingType(type);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('artwork_type', type);
    if (showId) formData.append('show_id', showId.toString());
    if (episodeId) formData.append('episode_id', episodeId.toString());

    try {
      await api.post('/admin/artwork/validate-and-save', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMessage({ type, message: 'Artwork uploaded and verified successfully!' });
      onArtworkChange();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = detail?.message || err.message || 'Failed to upload artwork. Please check image specifications.';
      setErrorMessage({ type, message: msg });
    } finally {
      setUploadingType(null);
      // Reset input value
      event.target.value = '';
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/artwork/${deleteTarget.artworkId}`);
      onArtworkChange();
      setSuccessMessage({ type: deleteTarget.type, message: 'Artwork removed.' });
      setDeleteTarget(null);
    } catch (err: any) {
      setErrorMessage({ type: deleteTarget.type, message: 'Failed to delete artwork.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (artworkId: number, type: ArtworkType) => {
    const spec = SLOT_CONFIG[type];
    setDeleteTarget({ artworkId, type, name: spec.name });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      {allowedTypes.map((type) => {
        const spec = SLOT_CONFIG[type];
        const art = existingArtwork.find((a) => a.type === type);
        const isUploading = uploadingType === type;
        const err = errorMessage?.type === type ? errorMessage.message : null;
        const succ = successMessage?.type === type ? successMessage.message : null;

        const imageUrl = art ? (art.url.startsWith('http') ? art.url : `${API_BASE_URL}${art.url}`) : null;

        return (
          <div
            key={type}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: `1px solid ${err ? 'var(--danger)' : art ? 'var(--accent-border)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'border-color 0.2s ease',
            }}
          >
            {/* Slot Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {spec.name}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{spec.aspectDesc}</p>
              </div>
              {art && (
                <button
                  type="button"
                  onClick={() => handleDelete(art.id, type)}
                  style={{ color: 'var(--text-muted)', padding: '4px' }}
                  title="Remove artwork"
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Spec Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                Ratio: <strong>{spec.ratio}</strong>
              </span>
              <span style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                ~<strong>{spec.dims}</strong>
              </span>
              <span style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                Max: <strong>{spec.maxKb} KB</strong>
              </span>
            </div>

            {/* Preview Box */}
            <div
              style={{
                width: '100%',
                height: type === 'POSTER' ? '220px' : '150px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '14px',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={spec.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', gap: '8px' }}>
                  <ImageIcon size={32} />
                  <span style={{ fontSize: '13px' }}>No image uploaded</span>
                </div>
              )}

              {isUploading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(15, 16, 21, 0.85)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: 'var(--accent-light)',
                  }}
                >
                  <Loader2 size={24} className="animate-spin" />
                  <span style={{ fontSize: '12px' }}>Validating & uploading...</span>
                </div>
              )}
            </div>

            {/* Error / Success Notifications */}
            {err && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '12px',
                  marginBottom: '12px',
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{err}</span>
              </div>
            )}

            {succ && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--success-bg)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--success)',
                  fontSize: '12px',
                  marginBottom: '12px',
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{succ}</span>
              </div>
            )}

            {/* Upload Button Trigger */}
            <label
              style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: art ? 'var(--bg-primary)' : 'var(--accent)',
                color: art ? 'var(--text-primary)' : '#fff',
                border: `1px solid ${art ? 'var(--border)' : 'transparent'}`,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!art) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                else e.currentTarget.style.borderColor = 'var(--accent-light)';
              }}
              onMouseLeave={(e) => {
                if (!art) e.currentTarget.style.backgroundColor = 'var(--accent)';
                else e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <Upload size={16} />
              {art ? `Replace ${spec.name}` : `Upload ${spec.name}`}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(type, e)}
                disabled={isUploading}
              />
            </label>
          </div>
        );
      })}

      {/* Custom Artwork Deletion Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Artwork?"
        itemName={deleteTarget?.name}
        message="Are you sure you want to delete this artwork image? You can upload a new one at any time."
        confirmLabel="Yes, Remove"
        cancelLabel="Keep Image"
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
