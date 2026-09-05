import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ShowListResponse, ValidationReportResponse, PublishHistoryResponse } from '../api/types';
import { Film, CheckCircle2, FileEdit, Video, AlertTriangle, UploadCloud, Plus, ArrowRight, Clock } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { data: showsData, isLoading: loadingShows } = useQuery<ShowListResponse>({
    queryKey: ['admin-shows-overview'],
    queryFn: async () => (await api.get('/admin/shows?page_size=100')).data,
  });

  const { data: validationData, isLoading: loadingValidation } = useQuery<ValidationReportResponse>({
    queryKey: ['admin-validation-report'],
    queryFn: async () => (await api.get('/admin/validation-report')).data,
  });

  const { data: publishHistory } = useQuery<PublishHistoryResponse>({
    queryKey: ['admin-publish-history-latest'],
    queryFn: async () => (await api.get('/admin/catalog/publish-runs?page_size=1')).data,
  });

  const shows = showsData?.items || [];
  const totalShows = showsData?.total || 0;
  const publishedShows = shows.filter((s) => s.status === 'PUBLISHED').length;
  const draftShows = shows.filter((s) => s.status === 'DRAFT').length;
  const totalEpisodes = shows.reduce((acc, s) => acc + (s.episodes_count || 0), 0);
  const validationErrors = validationData?.errors_count || 0;
  const lastPublish = publishHistory?.items?.[0];

  return (
    <div className="animate-fade-in">
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#543488', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
            CMS Studio Dashboard
          </h1>
          <p style={{ color: 'rgba(84, 52, 136, 0.75)', fontSize: '15px', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
            Real-time catalogue status, metadata health, and publication pipeline
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/admin/shows/new"
            className="btn-peblo-outline"
          >
            <Plus size={16} />
            New Show
          </Link>
          <Link
            to="/admin/publish/history"
            className="btn-peblo-primary"
          >
            <UploadCloud size={16} />
            Publish History & Timelines
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid with Interactive Spring Hover */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {/* Total Shows */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(84, 52, 136, 0.08)',
              border: '1.5px solid #543488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
              flexShrink: 0,
            }}
          >
            <Film size={26} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>Total Shows</p>
            <h3 style={{ fontSize: '26px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              {loadingShows ? '...' : totalShows}
            </h3>
          </div>
        </div>

        {/* Published Shows */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(84, 52, 136, 0.08)',
              border: '1.5px solid #543488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>Published Shows</p>
            <h3 style={{ fontSize: '26px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              {loadingShows ? '...' : publishedShows}
            </h3>
          </div>
        </div>

        {/* Draft Shows */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(84, 52, 136, 0.08)',
              border: '1.5px solid rgba(84, 52, 136, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
              flexShrink: 0,
            }}
          >
            <FileEdit size={26} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>Draft Shows</p>
            <h3 style={{ fontSize: '26px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              {loadingShows ? '...' : draftShows}
            </h3>
          </div>
        </div>

        {/* Total Episodes */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(84, 52, 136, 0.08)',
              border: '1.5px solid #543488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
              flexShrink: 0,
            }}
          >
            <Video size={26} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>Total Episodes</p>
            <h3 style={{ fontSize: '26px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              {loadingShows ? '...' : totalEpisodes}
            </h3>
          </div>
        </div>

        {/* Validation Errors */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderColor: validationErrors > 0 ? '#543488' : 'rgba(84, 52, 136, 0.16)',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: validationErrors > 0 ? 'rgba(84, 52, 136, 0.12)' : 'rgba(84, 52, 136, 0.06)',
              border: '1.5px solid #543488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>Validation Issues</p>
            <h3 style={{ fontSize: '26px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              {loadingValidation ? '...' : validationErrors}
            </h3>
          </div>
        </div>
      </div>

      {/* Quick Status & Live Catalogue Status Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Validation Overview Card */}
        <div
          className="interactive-card"
          style={{
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              Publishing Readiness
            </h3>
            <Link
              to="/admin/publish/history"
              style={{
                fontSize: '13px',
                color: '#543488',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'var(--font-heading)',
              }}
            >
              View Timelines <ArrowRight size={14} />
            </Link>
          </div>

          {validationData?.can_publish ? (
            <div
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(84, 52, 136, 0.06)',
                border: '1.5px solid #543488',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <CheckCircle2 size={26} color="#543488" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#543488', fontSize: '15px', fontFamily: 'var(--font-heading)' }}>All checks passed</p>
                <p style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.8)', fontFamily: 'var(--font-body)' }}>
                  Dataset is valid and ready to be published to the live viewer catalogue.
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(84, 52, 136, 0.06)',
                border: '1.5px solid #543488',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
              }}
            >
              <AlertTriangle size={26} color="#543488" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontWeight: 700, color: '#543488', fontSize: '15px', fontFamily: 'var(--font-heading)' }}>
                  {validationErrors} issue{validationErrors === 1 ? '' : 's'} blocking publication
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(84, 52, 136, 0.8)', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
                  Fix missing artwork, durations, or section metadata before triggering publication.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Latest Publish Card */}
        <div
          className="interactive-card"
          style={{
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              Last Publish Run
            </h3>
            <Link
              to="/admin/publish/history"
              style={{
                fontSize: '13px',
                color: '#543488',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Full History <ArrowRight size={14} />
            </Link>
          </div>

          {lastPublish ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(84, 52, 136, 0.75)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                  <Clock size={15} color="#543488" />
                  {new Date(lastPublish.created_at).toLocaleString()}
                </span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    backgroundColor: '#543488',
                    color: '#ffffff',
                  }}
                >
                  {lastPublish.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '14px' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(84, 52, 136, 0.04)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(84, 52, 136, 0.12)' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Shows</span>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>{lastPublish.shows_count}</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'rgba(84, 52, 136, 0.04)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(84, 52, 136, 0.12)' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Episodes</span>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>{lastPublish.episodes_count}</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'rgba(84, 52, 136, 0.04)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(84, 52, 136, 0.12)' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Size</span>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>
                    {Math.round(lastPublish.catalogue_size / 1024)} KB
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'rgba(84, 52, 136, 0.6)', fontFamily: 'var(--font-heading)' }}>No publish runs recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
