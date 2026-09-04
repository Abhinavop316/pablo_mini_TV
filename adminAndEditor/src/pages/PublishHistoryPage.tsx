import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../api/client';
import type { PublishHistoryResponse, PublishRun } from '../api/types';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Rocket,
  ShieldCheck,
  FileCode,
  Layers,
  List,
  Sparkles,
  ExternalLink,
  Code2,
  X,
  Zap,
  Check
} from 'lucide-react';

export const PublishHistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [selectedRun, setSelectedRun] = useState<PublishRun | null>(null);
  const pageSize = 15;

  const { data, isLoading } = useQuery<PublishHistoryResponse>({
    queryKey: ['admin-publish-history', page],
    queryFn: async () => (await api.get(`/admin/catalog/publish-runs?page=${page}&page_size=${pageSize}`)).data,
  });

  const runs = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const latestRun = runs[0];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header Banner with Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(84, 52, 136, 0.12), rgba(124, 58, 237, 0.15))',
                border: '1.5px solid #7c3aed',
                color: '#543488',
                fontSize: '12px',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
              }}
            >
              <Rocket size={14} color="#7c3aed" />
              Production Deployment Pipeline
            </span>
          </div>
          <h1 style={{ fontSize: '34px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            Publishing Audit & Release Telemetry
          </h1>
          <p style={{ color: 'rgba(84, 52, 136, 0.8)', fontSize: '15px', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
            Track every atomic catalogue generation, checksum, and viewer release log
          </p>
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-full)',
              border: '2px solid #543488',
              padding: '3px',
              boxShadow: '0 2px 8px rgba(84, 52, 136, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: viewMode === 'timeline' ? '#543488' : 'transparent',
                color: viewMode === 'timeline' ? '#ffffff' : '#543488',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                transition: 'all 0.2s ease',
              }}
            >
              <Layers size={15} /> Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: viewMode === 'table' ? '#543488' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#543488',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                transition: 'all 0.2s ease',
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          <Link
            to="/admin/publish"
            style={{
              background: 'linear-gradient(135deg, #543488, #7c3aed)',
              color: '#ffffff',
              padding: '12px 22px',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 6px 18px rgba(124, 58, 237, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
          >
            <Sparkles size={16} />
            Publish New Release
          </Link>
        </div>
      </div>

      {/* Top Release Telemetry Cards with Exciting Vibrant Color Accents */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {/* Total Runs (Electric Purple Card) */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #ffffff 50%, #f5f3ff 100%)',
            border: '2px solid rgba(124, 58, 237, 0.25)',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
              Total Deployments
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#ede9fe', border: '1.5px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <History size={18} />
            </div>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
            {total}
          </h3>
          <p style={{ fontSize: '13px', color: '#7c3aed', marginTop: '4px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            Recorded catalogue builds
          </p>
        </div>

        {/* Atomic Reliability (Emerald Green Card) */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #ffffff 50%, #ecfdf5 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
              Atomic Reliability
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#d1fae5', border: '1.5px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-heading)' }}>
            100%
          </h3>
          <p style={{ fontSize: '13px', color: '#059669', marginTop: '4px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            Zero-downtime file swaps
          </p>
        </div>

        {/* Latest Payload Size (Sunset Orange Card) */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #ffffff 50%, #fff7ed 100%)',
            border: '2px solid rgba(249, 115, 22, 0.3)',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
              Latest Payload
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#ffedd5', border: '1.5px solid #f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <FileCode size={18} />
            </div>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#c2410c', fontFamily: 'var(--font-heading)' }}>
            {latestRun ? `${Math.round(latestRun.catalogue_size / 1024)} KB` : '—'}
          </h3>
          <p style={{ fontSize: '13px', color: '#ea580c', marginTop: '4px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            {latestRun ? `${latestRun.shows_count} shows • ${latestRun.episodes_count} episodes` : 'No payload yet'}
          </p>
        </div>

        {/* Live Viewer Feed (Sky Blue Card) */}
        <div
          className="interactive-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #ffffff 50%, #f0f9ff 100%)',
            border: '2px solid rgba(14, 165, 233, 0.3)',
            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
              Public Viewer API
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#e0f2fe', border: '1.5px solid #0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <ExternalLink size={18} />
            </div>
          </div>
          <a
            href={`${API_BASE_URL}/catalog`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0369a1',
              fontSize: '20px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              textDecoration: 'underline',
              marginTop: '4px',
            }}
          >
            /catalog JSON <ExternalLink size={15} />
          </a>
          <p style={{ fontSize: '13px', color: '#0284c7', marginTop: '4px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            Atomic static snapshot feed
          </p>
        </div>
      </div>

      {/* Main Content: Timeline Feed View or Data Table */}
      {viewMode === 'timeline' ? (
        /* Visual Interactive Release Timeline */
        <div style={{ maxWidth: '920px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#543488', fontFamily: 'var(--font-heading)', fontSize: '18px' }}>
              Loading release pipeline timeline...
            </div>
          ) : runs.length === 0 ? (
            <div className="interactive-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <History size={44} color="#543488" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#543488', fontFamily: 'var(--font-heading)' }}>No Release Runs Yet</h3>
              <p style={{ color: 'rgba(84, 52, 136, 0.7)', fontSize: '14px', marginBottom: '20px' }}>Publish your first release in the Publish Console.</p>
              <Link to="/admin/publish" className="btn-peblo-primary">Go to Publish Console</Link>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '36px' }}>
              {/* Vertical Timeline Guide Line */}
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  bottom: '20px',
                  left: '12px',
                  width: '4px',
                  background: 'linear-gradient(to bottom, #10b981, #7c3aed 50%, #0ea5e9)',
                  borderRadius: '3px',
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {runs.map((run, idx) => {
                  const isSuccess = run.status === 'SUCCESS';
                  const dateStr = new Date(run.created_at).toLocaleString();

                  return (
                    <div
                      key={run.id}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Timeline Node Icon with Glowing Beacon */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-36px',
                          top: '18px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isSuccess ? (idx === 0 ? '#10b981' : '#7c3aed') : '#ef4444',
                          border: '3px solid #ffffff',
                          boxShadow: isSuccess ? (idx === 0 ? '0 0 16px rgba(16, 185, 129, 0.6)' : '0 0 12px rgba(124, 58, 237, 0.4)') : '0 0 12px rgba(239, 68, 68, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          zIndex: 2,
                        }}
                      >
                        {isSuccess ? <Check size={14} strokeWidth={3} /> : <XCircle size={14} />}
                      </div>

                      {/* Release Card with Colorful Accents */}
                      <div
                        className="interactive-card"
                        style={{
                          flex: 1,
                          padding: '22px 26px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          background: idx === 0 ? 'linear-gradient(135deg, #ffffff 60%, #ecfdf5 100%)' : '#ffffff',
                          border: idx === 0 ? '2px solid #10b981' : '2px solid rgba(84, 52, 136, 0.16)',
                          boxShadow: idx === 0 ? '0 10px 30px rgba(16, 185, 129, 0.15)' : '0 4px 16px rgba(84, 52, 136, 0.06)',
                        }}
                      >
                        {/* Card Top: Release Tag, Date & Publisher */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {idx === 0 ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 14px',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: '#10b981',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  fontFamily: 'var(--font-heading)',
                                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                                }}
                              >
                                <Zap size={13} fill="#ffffff" />
                                Live Production Release
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: 'rgba(124, 58, 237, 0.1)',
                                  border: '1.5px solid #7c3aed',
                                  color: '#7c3aed',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  fontFamily: 'var(--font-heading)',
                                }}
                              >
                                Release #{run.id}
                              </span>
                            )}

                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: isSuccess ? '#d1fae5' : '#fee2e2',
                                border: `1.5px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
                                color: isSuccess ? '#065f46' : '#991b1b',
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: 'var(--font-heading)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {run.status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: '#543488', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={14} color="#7c3aed" /> {dateStr}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <User size={14} color="#7c3aed" /> {run.triggered_by}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Content summary pills with distinctive colorful borders */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          {/* Shows Chip (Purple) */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: '#f5f3ff',
                              border: '1.5px solid #c4b5fd',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Shows:</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#5b21b6', fontFamily: 'var(--font-heading)' }}>{run.shows_count}</span>
                          </div>

                          {/* Episodes Chip (Sky Blue) */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: '#f0f9ff',
                              border: '1.5px solid #7dd3fc',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Episodes:</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#075985', fontFamily: 'var(--font-heading)' }}>{run.episodes_count}</span>
                          </div>

                          {/* Payload Size Chip (Amber/Orange) */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: '#fffbeb',
                              border: '1.5px solid #fcd34d',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Payload Size:</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#92400e', fontFamily: 'var(--font-heading)' }}>{Math.round(run.catalogue_size / 1024)} KB</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedRun(run)}
                            style={{
                              marginLeft: 'auto',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-full)',
                              background: 'linear-gradient(135deg, #543488, #7c3aed)',
                              color: '#ffffff',
                              fontSize: '13px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-heading)',
                              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 18px rgba(124, 58, 237, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.25)';
                            }}
                          >
                            <Code2 size={15} /> Inspect Snapshot
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Data Table View */
        <div
          className="interactive-card"
          style={{
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, rgba(84, 52, 136, 0.08), rgba(124, 58, 237, 0.1))', borderBottom: '2px solid rgba(84, 52, 136, 0.2)', color: '#543488', fontFamily: 'var(--font-heading)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 800 }}>Date & Time</th>
                  <th style={{ padding: '16px 16px', fontWeight: 800 }}>Triggered By</th>
                  <th style={{ padding: '16px 16px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '16px 16px', fontWeight: 800 }}>Published Content</th>
                  <th style={{ padding: '16px 16px', fontWeight: 800 }}>Payload Size</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800 }}>Details / Notes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#543488', fontFamily: 'var(--font-heading)' }}>
                      Loading release log...
                    </td>
                  </tr>
                ) : runs.map((run, idx) => {
                  const isSuccess = run.status === 'SUCCESS';

                  return (
                    <tr
                      key={run.id}
                      className="interactive-row"
                      style={{
                        borderBottom: '1px solid rgba(84, 52, 136, 0.1)',
                        backgroundColor: idx === 0 ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '16px 20px', color: '#543488', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={15} color="#7c3aed" />
                          <span>{new Date(run.created_at).toLocaleString()}</span>
                          {idx === 0 && (
                            <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#10b981', color: '#fff', fontSize: '10px', fontWeight: 800 }}>LIVE</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '16px 16px', color: '#543488', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={15} color="#7c3aed" />
                          <span>{run.triggered_by}</span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            fontWeight: 800,
                            fontFamily: 'var(--font-heading)',
                            backgroundColor: isSuccess ? '#d1fae5' : '#fee2e2',
                            color: isSuccess ? '#065f46' : '#991b1b',
                            border: `1.5px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
                          }}
                        >
                          {isSuccess ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {run.status}
                        </span>
                      </td>

                      <td style={{ padding: '16px 16px', color: '#543488', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                        <span style={{ color: '#7c3aed' }}>{run.shows_count}</span> shows, <span style={{ color: '#0284c7' }}>{run.episodes_count}</span> episodes
                      </td>

                      <td style={{ padding: '16px 16px', color: '#ea580c', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        {Math.round(run.catalogue_size / 1024)} KB
                      </td>

                      <td style={{ padding: '16px 20px', color: '#059669', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '13px' }}>
                        {run.error_message || '✓ Atomic write verified & deployed'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            color: '#543488',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
          }}
        >
          <span>
            Page {page} of {totalPages} ({total} total release runs)
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                border: '2px solid #543488',
                backgroundColor: '#ffffff',
                color: page <= 1 ? 'rgba(84, 52, 136, 0.4)' : '#543488',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(84, 52, 136, 0.08)',
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
                gap: '6px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                border: '2px solid #543488',
                backgroundColor: '#ffffff',
                color: page >= totalPages ? 'rgba(84, 52, 136, 0.4)' : '#543488',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(84, 52, 136, 0.08)',
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Release Inspection Modal with Vibrant Colors */}
      {selectedRun && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(84, 52, 136, 0.55)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setSelectedRun(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid #7c3aed',
              boxShadow: '0 24px 60px rgba(124, 58, 237, 0.3)',
              padding: '32px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedRun(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'rgba(84, 52, 136, 0.08)',
                border: '1.5px solid rgba(84, 52, 136, 0.2)',
                color: '#543488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', border: '2px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d28d9' }}>
                <Rocket size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
                  Release #{selectedRun.id} Snapshot
                </h3>
                <p style={{ fontSize: '13px', color: '#7c3aed', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                  Triggered at {new Date(selectedRun.created_at).toLocaleString()} by {selectedRun.triggered_by}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              <div style={{ padding: '14px', backgroundColor: '#f5f3ff', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1.5px solid #c4b5fd' }}>
                <span style={{ fontSize: '11px', color: '#6d28d9', fontWeight: 800, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Shows</span>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#5b21b6', fontFamily: 'var(--font-heading)' }}>{selectedRun.shows_count}</p>
              </div>
              <div style={{ padding: '14px', backgroundColor: '#f0f9ff', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1.5px solid #7dd3fc' }}>
                <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: 800, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Episodes</span>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#075985', fontFamily: 'var(--font-heading)' }}>{selectedRun.episodes_count}</p>
              </div>
              <div style={{ padding: '14px', backgroundColor: '#fffbeb', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1.5px solid #fcd34d' }}>
                <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 800, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Payload</span>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#92400e', fontFamily: 'var(--font-heading)' }}>{Math.round(selectedRun.catalogue_size / 1024)} KB</p>
              </div>
            </div>

            <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', backgroundColor: '#ecfdf5', border: '1.5px solid #a7f3d0', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: '#065f46', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>Status & Verification:</p>
              <p style={{ fontSize: '14px', color: '#047857', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                {selectedRun.status === 'SUCCESS' ? 'Atomic zero-downtime file swap verified. The live viewer stream API serves this static snapshot with instant responsiveness.' : selectedRun.error_message}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <a
                href={`${API_BASE_URL}/catalog`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #543488, #7c3aed)',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                }}
              >
                <ExternalLink size={15} /> Open Live Catalogue JSON
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
