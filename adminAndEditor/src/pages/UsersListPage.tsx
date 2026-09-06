import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { UserListResponse } from '../api/types';
import { PebloLoader } from '../components/PebloLoader';
import {
  Users,
  ShieldCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  Lock,
  Edit3,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export const UsersListPage: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users query
  const { data, isLoading, refetch, isFetching } = useQuery<UserListResponse>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div
        className="card"
        style={{
          padding: '50px 30px',
          textAlign: 'center',
          maxWidth: '540px',
          margin: '80px auto',
          borderRadius: '24px',
          border: '2px solid rgba(84, 52, 136, 0.15)',
        }}
      >
        <AlertTriangle size={52} color="#543488" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', color: '#543488', fontWeight: 800, marginBottom: '10px' }}>
          Admin Studio Access Required
        </h2>
        <p style={{ color: 'rgba(84, 52, 136, 0.75)', fontSize: '15px' }}>
          Only Studio Administrators have permission to view system roles and team access.
        </p>
      </div>
    );
  }

  const usersList = data?.items || [];
  const filteredUsers = usersList.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      u.role.toLowerCase().includes(term)
    );
  });

  const adminCount = usersList.filter((u) => u.role === 'ADMIN').length;
  const editorCount = usersList.filter((u) => u.role === 'EDITOR').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '100%' }}>
      {/* Hero Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #543488 0%, #3e2268 100%)',
          borderRadius: '24px',
          padding: '28px 32px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '18px',
          boxShadow: '0 16px 36px -8px rgba(84, 52, 136, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ zIndex: 1, maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-heading)',
              }}
            >
              STUDIO ACCESS
            </span>
            <span style={{ fontSize: '12px', opacity: 0.85 }}>• System Roles</span>
          </div>
          <h1
            style={{
              fontSize: '28px',
              color: '#ffffff',
              fontWeight: 800,
              margin: '0 0 6px',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
            }}
          >
            System Roles & Team
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
            Production access is fixed to 1 Administrator and 1 Editor account. No email setups or dynamic role modifications required.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: '12px',
            }}
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(84, 52, 136, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Total Roles
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              {usersList.length}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(84, 52, 136, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Administrator
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              {adminCount} Active
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <Edit3 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Content Editor
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-heading)' }}>
              {editorCount} Active
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
            }}
          >
            <Lock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              System Policy
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
              Fixed Dual-Role
            </div>
          </div>
        </div>
      </div>

      {/* Policy Notice Box */}
      <div
        style={{
          backgroundColor: '#faf8fd',
          border: '1.5px solid rgba(84, 52, 136, 0.18)',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <KeyRound size={26} color="#543488" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '13.5px', color: '#3e2268', lineHeight: 1.5 }}>
          <strong>Fixed System Roles:</strong> The application is configured with 1 Administrator and 1 Editor account configured via environment variables. User creation, deletion, and email verification have been decommissioned for maximum security and deployment reliability.
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        <Search
          size={18}
          color="rgba(84, 52, 136, 0.4)"
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Filter system accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
          style={{
            paddingLeft: '44px',
            borderRadius: '14px',
            backgroundColor: '#ffffff',
            border: '1.5px solid rgba(84, 52, 136, 0.15)',
            fontSize: '14px',
            height: '44px',
            maxWidth: '360px',
          }}
        />
      </div>

      {/* Users List / Cards */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <PebloLoader size="lg" text="Loading system accounts..." />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '50px 20px',
            textAlign: 'center',
            borderRadius: '20px',
          }}
        >
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>No system accounts matching your query.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredUsers.map((item) => {
            const isSelf = currentUser?.id === item.id;
            const isItemAdmin = item.role === 'ADMIN';

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  border: isItemAdmin ? '2px solid rgba(84, 52, 136, 0.2)' : '2px solid rgba(2, 132, 199, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 24px rgba(84, 52, 136, 0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        backgroundColor: isItemAdmin ? 'rgba(84, 52, 136, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                        color: isItemAdmin ? '#543488' : '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '18px',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {isItemAdmin ? <ShieldCheck size={26} /> : <Edit3 size={24} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3
                          style={{
                            fontSize: '17px',
                            fontWeight: 800,
                            color: '#2d184c',
                            margin: 0,
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {item.name || (isItemAdmin ? 'Studio Administrator' : 'Content Editor')}
                        </h3>
                        {isSelf && (
                          <span
                            style={{
                              backgroundColor: '#543488',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              fontFamily: 'var(--font-heading)',
                            }}
                          >
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#543488', fontWeight: 600, marginTop: '2px' }}>
                        @{item.username || (isItemAdmin ? 'peblo_admin' : 'peblo_editor')}
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: 'var(--font-heading)',
                      backgroundColor: isItemAdmin ? 'rgba(84, 52, 136, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                      color: isItemAdmin ? '#543488' : '#0284c7',
                    }}
                  >
                    {item.role}
                  </span>
                </div>

                {/* Details list */}
                <div
                  style={{
                    backgroundColor: 'rgba(84, 52, 136, 0.03)',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b3869' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Email:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#2d184c' }}>{item.email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b3869' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Status:</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700 }}>
                      <CheckCircle2 size={14} /> Active & Verified
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b3869' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Permissions:</span>
                    <span style={{ fontWeight: 600, color: '#543488' }}>
                      {isItemAdmin ? 'Full System & Catalogue' : 'Catalogue & Episode Editing'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
