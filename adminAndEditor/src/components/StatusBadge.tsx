import React from 'react';
import type { ItemStatus } from '../api/types';

interface StatusBadgeProps {
  status: ItemStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isPublished = status === 'PUBLISHED';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        backgroundColor: isPublished ? 'var(--success-bg)' : 'var(--warning-bg)',
        color: isPublished ? 'var(--success)' : 'var(--warning)',
        border: `1px solid ${isPublished ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isPublished ? 'var(--success)' : 'var(--warning)',
        }}
      />
      {status}
    </span>
  );
};
