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
  { name: string; purpose: string; ratio: string; dims: string; maxKb: number; aspectDesc: string }
> = {
  POSTER: {
    name: 'Poster',
    purpose: 'Used for show cards',
    ratio: '2:3',
    dims: '600 × 900 px',
    maxKb: 200,
    aspectDesc: 'Vertical poster displayed on show cards & rows',
  },
  BANNER: {
    name: 'Banner',
    purpose: 'Used for featured hero',
    ratio: '16:9',
    dims: '1280 × 720 px',
    maxKb: 200,
    aspectDesc: 'Wide hero banner displayed on viewer home top',
  },
  THUMBNAIL: {
    name: 'Thumbnail',
    purpose: 'Used for episode lists',
    ratio: '16:9',
    dims: '640 × 360 px',
    maxKb: 200,
    aspectDesc: 'Episode thumbnail displayed in episode lists',
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
  const [dragOverType, setDragOverType] = useState<ArtworkType | null>(null);
  const [errorMessage, setErrorMessage] = useState<{ type: ArtworkType; message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<{ type: ArtworkType; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ artworkId: number; type: ArtworkType; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const extractErrorMessage = (err: any): string => {
    const data = err.response?.data;
    if (data?.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (data.detail.message) return data.detail.message;
      if (Array.isArray(data.detail)) {
        return data.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
      }
      return JSON.stringify(data.detail);
    }
    if (data?.message) return data.message;
    return err.message || 'Failed to upload artwork. Please check image specifications.';
  };

  const uploadFile = async (type: ArtworkType, file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadingType(type);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('artwork_type', type);
    if (showId !== undefined && showId !== null) {
      formData.append('show_id', String(showId));
    }
    if (episodeId !== undefined && episodeId !== null) {
      formData.append('episode_id', String(episodeId));
    }

    try {
      await api.post('/admin/artwork/validate-and-save', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage({ type, message: 'Artwork uploaded and verified successfully!' });
      onArtworkChange();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setErrorMessage({ type, message: msg });
    } finally {
      setUploadingType(null);
      setDragOverType(null);
    }
  };

  const handleFileSelect = async (type: ArtworkType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(type, file);
    event.target.value = '';
  };

  const applySampleArtwork = async (type: ArtworkType) => {
    const presetMap: Record<ArtworkType, { path: string; name: string }> = {
      POSTER: { path: '/poster_good.jpg', name: 'poster_good.jpg' },
      BANNER: { path: '/banner_good.jpg', name: 'banner_good.jpg' },
      THUMBNAIL: { path: '/thumb_good.jpg', name: 'thumb_good.jpg' },
    };
    const target = presetMap[type];
    try {
      setUploadingType(type);
      setErrorMessage(null);
      const res = await fetch(target.path);
      if (!res.ok) throw new Error(`Could not fetch ${target.name}`);
      const blob = await res.blob();
      const file = new File([blob], target.name, { type: 'image/jpeg' });
      await uploadFile(type, file);
    } catch (err: any) {
      setErrorMessage({ type, message: `Failed to load sample: ${err.message}` });
      setUploadingType(null);
    }
  };

  const handleDragEnter = (type: ArtworkType, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverType(type);
  };

  const handleDragOver = (type: ArtworkType, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverType !== type) {
      setDragOverType(type);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if leaving the slot boundary
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverType(null);
  };

  const handleDrop = async (type: ArtworkType, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverType(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMessage({ type, message: 'Please drop a valid image file (JPG, PNG, WEBP).' });
        return;
      }
      await uploadFile(type, file);
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
        const isDragging = dragOverType === type;
        const err = errorMessage?.type === type ? errorMessage.message : null;
        const succ = successMessage?.type === type ? successMessage.message : null;

        const imageUrl = art ? (art.url.startsWith('http') ? art.url : `${API_BASE_URL}${art.url}`) : null;

        return (
          <div
            key={type}
            onDragEnter={(e) => handleDragEnter(type, e)}
            onDragOver={(e) => handleDragOver(type, e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(type, e)}
            style={{
              backgroundColor: isDragging ? '#fbf9fe' : 'var(--bg-card)',
              border: isDragging
                ? '2px dashed #7c3aed'
                : err
                ? '1.5px solid #ef4444'
                : art
                ? '1.5px solid rgba(84, 52, 136, 0.3)'
                : '1.5px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: isDragging
                ? '0 0 0 4px rgba(124, 58, 237, 0.15), 0 10px 30px rgba(84, 52, 136, 0.12)'
                : '0 2px 8px rgba(84, 52, 136, 0.04)',
              transform: isDragging ? 'scale(1.015)' : 'scale(1)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Slot Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    {spec.name}
                  </h4>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(84, 52, 136, 0.1)',
                      color: '#543488',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(84, 52, 136, 0.2)',
                    }}
                  >
                    {spec.purpose}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{spec.aspectDesc}</p>
              </div>
              {art && (
                <button
                  type="button"
                  onClick={() => handleDelete(art.id, type)}
                  style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
                  title="Remove artwork"
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Spec Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', background: 'rgba(84, 52, 136, 0.06)', padding: '3px 8px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(84, 52, 136, 0.12)', color: '#543488', fontWeight: 600 }}>
                Ratio: <strong>{spec.ratio}</strong>
              </span>
              <span style={{ fontSize: '11px', background: 'rgba(84, 52, 136, 0.06)', padding: '3px 8px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(84, 52, 136, 0.12)', color: '#543488', fontWeight: 600 }}>
                ~<strong>{spec.dims}</strong>
              </span>
              <span style={{ fontSize: '11px', background: 'rgba(84, 52, 136, 0.06)', padding: '3px 8px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(84, 52, 136, 0.12)', color: '#543488', fontWeight: 600 }}>
                Max: <strong>{spec.maxKb} KB</strong>
              </span>
            </div>

            {/* Preview Box Area with True Aspect Ratio */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: type === 'POSTER' ? '320px' : '100%',
                  aspectRatio: type === 'POSTER' ? '2 / 3' : '16 / 9',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: isDragging ? '2px solid #7c3aed' : '1.5px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: type === 'POSTER' ? '0 10px 28px rgba(84, 52, 136, 0.12)' : 'none',
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={spec.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', gap: '10px', padding: '20px', textAlign: 'center' }}>
                    <ImageIcon size={type === 'POSTER' ? 44 : 32} color="#543488" style={{ opacity: 0.6 }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#543488', fontFamily: 'var(--font-heading)' }}>
                      No {spec.name.toLowerCase()} uploaded
                    </span>
                    <span style={{ fontSize: '12px', opacity: 0.75, color: '#543488' }}>
                      Drag & drop or browse below ({spec.ratio})
                    </span>
                  </div>
                )}

                {/* Drop Hover Overlay */}
                {isDragging && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(84, 52, 136, 0.92)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      color: '#ffffff',
                      zIndex: 10,
                      animation: 'popoverEntrance 0.2s ease forwards',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        color: '#543488',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                      }}
                    >
                      <Upload size={24} />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                      Drop {spec.name} to Upload!
                    </span>
                    <span style={{ fontSize: '12px', opacity: 0.9 }}>Target: {spec.dims} (≤ {spec.maxKb} KB)</span>
                  </div>
                )}

                {isUploading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(84, 52, 136, 0.88)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#ffffff',
                      zIndex: 20,
                    }}
                  >
                    <Loader2 size={26} className="animate-spin" />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Validating dimensions & uploading...</span>
                  </div>
                )}
              </div>
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
                  backgroundColor: '#fef2f2',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#b91c1c',
                  fontSize: '12px',
                  marginBottom: '12px',
                  lineHeight: 1.4,
                  fontWeight: 600,
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
                  backgroundColor: '#f0fdf4',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#15803d',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '12px',
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{succ}</span>
              </div>
            )}

            {/* Upload Button Trigger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: art ? '#ffffff' : '#543488',
                  color: art ? '#543488' : '#ffffff',
                  border: art ? '1.5px solid #543488' : 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: art ? 'none' : '0 3px 10px rgba(84, 52, 136, 0.25)',
                }}
                onMouseEnter={(e) => {
                  if (!art) e.currentTarget.style.backgroundColor = '#3f2669';
                  else e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!art) e.currentTarget.style.backgroundColor = '#543488';
                  else e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <Upload size={16} />
                {art ? `Replace ${spec.name}` : `Browse or Drop ${spec.name}`}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(type, e)}
                  disabled={isUploading}
                />
              </label>

              <button
                type="button"
                onClick={() => applySampleArtwork(type)}
                disabled={isUploading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(84, 52, 136, 0.06)',
                  color: '#543488',
                  border: '1px solid rgba(84, 52, 136, 0.2)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={`Quick-load ${type === 'POSTER' ? 'poster_good.jpg' : type === 'BANNER' ? 'banner_good.jpg' : 'thumb_good.jpg'}`}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.06)')}
              >
                ✨ Quick Apply {type === 'POSTER' ? 'poster_good.jpg' : type === 'BANNER' ? 'banner_good.jpg' : 'thumb_good.jpg'}
              </button>
            </div>

            <span style={{ display: 'block', textAlign: 'center', fontSize: '11px', color: 'rgba(84, 52, 136, 0.6)', marginTop: '8px', fontWeight: 500 }}>
              📁 Drag & drop image anywhere on this card
            </span>
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
