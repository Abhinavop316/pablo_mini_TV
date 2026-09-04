import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ValidationReportResponse, PublishTriggerResponse, ValidationErrorItem, ValidationWarningItem } from '../api/types';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const PublishPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const { data: report, isLoading, isRefetching, refetch } = useQuery<ValidationReportResponse>({
    queryKey: ['admin-validation-report'],
    queryFn: async () => (await api.get('/admin/validation-report')).data,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      return (await api.post<PublishTriggerResponse>('/admin/catalog/publish')).data;
    },
    onSuccess: (data) => {
      setPublishSuccess(`Catalogue published successfully! ${data.publish_run.shows_count} shows and ${data.publish_run.episodes_count} episodes live.`);
      setPublishError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-publish-history-latest'] });
      queryClient.invalidateQueries({ queryKey: ['admin-publish-history'] });
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      setPublishError(detail?.message || err.message || 'Catalogue publishing failed.');
      setPublishSuccess(null);
    },
  });

  const handlePublish = () => {
    if (!isAdmin) return;
    if (!report?.can_publish) return;
    setPublishSuccess(null);
    setPublishError(null);
    publishMutation.mutate();
  };

  const canPublish = report?.can_publish ?? false;
  const errors = report?.errors || [];
  const warnings = report?.warnings || [];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Catalogue Publishing Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Automated dataset validation, atomic JSON generation, and live deployment
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
          }}
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          Refresh Report
        </button>
      </div>

      {/* Editor Permission Banner */}
      {!isAdmin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#fef2f2',
            border: '1.5px solid #ef4444',
            color: '#b91c1c',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
          }}
        >
          <ShieldAlert size={22} color="#dc2626" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#b91c1c', fontFamily: 'var(--font-heading)' }}>
            <strong style={{ color: '#991b1b' }}>Editor View:</strong> You have permission to inspect validation blockers and fix content issues. Only <strong style={{ color: '#991b1b' }}>Administrators</strong> have permission to trigger catalogue publishing.
          </div>
        </div>
      )}

      {/* Publish Success / Error Banner */}
      {publishSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: 'var(--success)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={22} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{publishSuccess}</span>
          </div>
          <Link
            to="/admin/publish/history"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              textDecoration: 'underline',
            }}
          >
            View Run in History <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {publishError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '14px',
            marginBottom: '24px',
          }}
        >
          <XCircle size={22} style={{ flexShrink: 0 }} />
          <span>{publishError}</span>
        </div>
      )}

      {/* Main Publishing Readiness Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              {canPublish ? (
                <CheckCircle2 size={24} color="var(--success)" />
              ) : (
                <XCircle size={24} color="var(--danger)" />
              )}
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {canPublish ? 'Ready for Publishing' : 'Cannot Publish — Issues Detected'}
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {canPublish
                ? 'All integrity checks passed. All published shows and episodes meet artwork, duration, and metadata standards.'
                : `${errors.length} blocking issue${errors.length === 1 ? '' : 's'} must be resolved before the catalogue can be published.`}
            </p>
          </div>

          {/* Publish Trigger Button */}
          <div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish || !isAdmin || publishMutation.isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 28px',
                borderRadius: 'var(--radius-md)',
                background: canPublish && isAdmin
                  ? 'linear-gradient(135deg, #aa3bff, #9333ea)'
                  : 'var(--bg-card)',
                color: canPublish && isAdmin ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${canPublish && isAdmin ? 'transparent' : 'var(--border)'}`,
                fontSize: '15px',
                fontWeight: 700,
                cursor: canPublish && isAdmin && !publishMutation.isPending ? 'pointer' : 'not-allowed',
                boxShadow: canPublish && isAdmin ? '0 4px 16px rgba(170, 59, 255, 0.4)' : 'none',
                opacity: publishMutation.isPending ? 0.7 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Publishing Atomically...
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Publish Live Catalogue
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Blocking Errors Section */}
      {errors.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="var(--danger)" />
            Blocking Issues ({errors.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {errors.map((err: ValidationErrorItem, idx: number) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderLeft: '4px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--danger-bg)',
                        color: '#f87171',
                      }}
                    >
                      {err.entity_type}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                      {err.title}
                    </span>
                    {err.show_title && err.entity_type !== 'show' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        (in {err.show_title})
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{err.reason}</p>
                </div>

                {/* Direct Action Link to Fix */}
                {err.show_id && (
                  <Link
                    to={`/admin/shows/${err.show_id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      color: 'var(--accent-light)',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    Fix Issue <ExternalLink size={13} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--warning)" />
            Warnings & Suggestions ({warnings.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {warnings.map((warn: ValidationWarningItem, idx: number) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderLeft: '4px solid var(--warning)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--warning-bg)',
                      color: 'var(--warning)',
                    }}
                  >
                    {warn.entity_type}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                    {warn.title}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{warn.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
