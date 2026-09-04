import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDangerous = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(84, 52, 136, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={!isLoading ? onCancel : undefined}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '2px solid rgba(84, 52, 136, 0.18)',
          boxShadow: '0 20px 50px rgba(84, 52, 136, 0.22)',
          padding: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {!isLoading && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(84, 52, 136, 0.06)',
              border: '1px solid rgba(84, 52, 136, 0.15)',
              color: '#543488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.14)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.06)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Warning Badge Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: isDangerous ? '#fef2f2' : 'rgba(84, 52, 136, 0.08)',
            border: `2px solid ${isDangerous ? '#fca5a5' : '#543488'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDangerous ? '#dc2626' : '#543488',
            marginBottom: '20px',
            boxShadow: isDangerous ? '0 4px 14px rgba(239, 68, 68, 0.15)' : 'none',
          }}
        >
          {isDangerous ? <Trash2 size={26} /> : <AlertTriangle size={26} />}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#543488',
            fontFamily: 'var(--font-heading)',
            marginBottom: '10px',
          }}
        >
          {title}
        </h3>

        {/* Highlighted item name */}
        {itemName && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(84, 52, 136, 0.06)',
              border: '1.5px solid rgba(84, 52, 136, 0.15)',
              color: '#543488',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              marginBottom: '14px',
              wordBreak: 'break-word',
            }}
          >
            "{itemName}"
          </div>
        )}

        {/* Description / warning message */}
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(84, 52, 136, 0.8)',
            lineHeight: 1.55,
            fontFamily: 'var(--font-body)',
            marginBottom: '28px',
          }}
        >
          {message || 'Are you sure you want to proceed? This action cannot be undone.'}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#ffffff',
              border: '1.5px solid rgba(84, 52, 136, 0.25)',
              color: '#543488',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.08)';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isDangerous ? '#dc2626' : '#543488',
              border: `2px solid ${isDangerous ? '#dc2626' : '#543488'}`,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              boxShadow: isDangerous ? '0 4px 14px rgba(220, 38, 38, 0.3)' : '0 4px 14px rgba(84, 52, 136, 0.25)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = isDangerous ? '#b91c1c' : '#3f2669';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = isDangerous ? '#dc2626' : '#543488';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
