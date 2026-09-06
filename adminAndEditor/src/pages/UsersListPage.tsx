import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { UserItem, UserListResponse, CreateUserResponse, SetupTokenResponse, SendSetupEmailResponse } from '../api/types';
import { ConfirmModal } from '../components/ConfirmModal';
import { PebloLoader } from '../components/PebloLoader';
import {
  Users,
  UserPlus,
  User as UserIcon,
  Search,
  Copy,
  Check,
  Trash2,
  Power,
  ShieldCheck,
  UserCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Mail,
  Send,
  Sparkles,
  X,
  Share2,
} from 'lucide-react';


export const UsersListPage: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');

  // Email Toast Notification
  const [emailToast, setEmailToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [successInviteData, setSuccessInviteData] = useState<{ userId: number; name?: string | null; email: string; url: string; expiresAt?: string } | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserItem | null>(null);

  // Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'ADMIN'>('EDITOR');
  const [inviteError, setInviteError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Lock background scroll when any modal is open
  useEffect(() => {
    if (isInviteOpen || Boolean(successInviteData)) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isInviteOpen, successInviteData]);

  // Fetch users query
  const { data, isLoading, refetch } = useQuery<UserListResponse>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
    enabled: isAdmin,
  });

  // Invite User Mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (payload: { name?: string; email: string; role: string }) => {
      const res = await api.post<CreateUserResponse>('/admin/users', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteError('');

      if (data.setup_url) {
        setSuccessInviteData({
          userId: data.id,
          name: data.name,
          email: data.email,
          url: data.setup_url,
          expiresAt: data.expires_at || undefined,
        });
      }
      setEmailToast({
        message: `Invitation email sent to ${data.email}!`,
        type: 'success',
      });
      setTimeout(() => setEmailToast(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Failed to send invitation.';
      setInviteError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  // Resend Email Mutation
  const resendEmailMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.post<SendSetupEmailResponse>(`/admin/users/${userId}/send-setup-email`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEmailToast({
        message: `Setup invitation email resent to ${data.email}!`,
        type: 'success',
      });
      setTimeout(() => setEmailToast(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Failed to resend email.';
      setEmailToast({
        message: `${msg}`,
        type: 'error',
      });
      setTimeout(() => setEmailToast(null), 5000);
    },
  });

  // Quick Copy Token Generation Mutation
  const getLinkMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.post<SetupTokenResponse>(`/admin/users/${userId}/generate-setup-token`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSuccessInviteData({
        userId: data.user_id,
        name: data.name,
        email: data.email,
        url: data.setup_url,
        expiresAt: data.expires_at,
      });
    },
  });

  // Status Toggle Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const res = await api.patch(`/admin/users/${userId}/status`, { is_active: isActive });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteTargetUser(null);
    },
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
          Only Studio Administrators have permission to invite and manage team editors.
        </p>
      </div>
    );
  }

  const usersList = data?.items || [];
  const filteredUsers = usersList.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.email.toLowerCase().includes(term) ||
      (u.name && u.name.toLowerCase().includes(term));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = u.is_active && u.is_verified;
    } else if (statusFilter === 'PENDING') {
      matchesStatus = !u.is_verified || u.has_pending_setup;
    } else if (statusFilter === 'SUSPENDED') {
      matchesStatus = !u.is_active;
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Metrics
  const totalCount = usersList.length;
  const editorsCount = usersList.filter((u) => u.role === 'EDITOR').length;
  const pendingCount = usersList.filter((u) => !u.is_verified || u.has_pending_setup).length;
  const activeCount = usersList.filter((u) => u.is_active && u.is_verified).length;

  const handleCopyLink = () => {
    if (successInviteData?.url) {
      navigator.clipboard.writeText(successInviteData.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    if (!inviteEmail.trim()) {
      setInviteError('Please enter the recipient’s email address.');
      return;
    }

    inviteUserMutation.mutate({
      name: inviteName.trim() || undefined,
      email: inviteEmail.trim(),
      role: inviteRole,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '100%' }}>
      {/* Toast Notification Banner */}
      {emailToast && (
        <div
          className="animate-fade-in"
          style={{
            padding: '14px 22px',
            borderRadius: '16px',
            backgroundColor: emailToast.type === 'success' ? '#543488' : '#e11d48',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 12px 32px rgba(84, 52, 136, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={18} color="#ffffff" />
            <span style={{ fontFamily: 'var(--font-heading)' }}>{emailToast.message}</span>
          </div>
          <button
            onClick={() => setEmailToast(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

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
        <div style={{ zIndex: 1, maxWidth: '600px' }}>
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
              STUDIO TEAM
            </span>
            <span style={{ fontSize: '12px', opacity: 0.85 }}>• Access & Invitations</span>
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
            Team & Editor Directory
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
            Appoint team editors with unique usernames. Invitations with temporary credentials and verification links are emailed automatically.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <button
            onClick={() => refetch()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              padding: '11px 16px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Refresh List"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            onClick={() => {
              setInviteName('');
              setInviteEmail('');
              setInviteError('');
              setIsInviteOpen(true);
            }}
            style={{
              backgroundColor: '#ffffff',
              color: '#543488',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '14px',
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
            }}
          >
            <UserPlus size={16} color="#543488" />
            Invite New Member
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          className="interactive-card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderRadius: '18px',
            backgroundColor: '#ffffff',
            border: '1.5px solid rgba(84, 52, 136, 0.12)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(84, 52, 136, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(84, 52, 136, 0.65)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Members
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              {totalCount}
            </div>
          </div>
        </div>

        <div
          className="interactive-card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderRadius: '18px',
            backgroundColor: '#ffffff',
            border: '1.5px solid rgba(84, 52, 136, 0.12)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Verified
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-heading)' }}>
              {activeCount}
            </div>
          </div>
        </div>

        <div
          className="interactive-card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderRadius: '18px',
            backgroundColor: '#ffffff',
            border: '1.5px solid rgba(84, 52, 136, 0.12)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Setup
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-heading)' }}>
              {pendingCount}
            </div>
          </div>
        </div>

        <div
          className="interactive-card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderRadius: '18px',
            backgroundColor: '#ffffff',
            border: '1.5px solid rgba(84, 52, 136, 0.12)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(84, 52, 136, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#543488',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#543488', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Editors
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#543488', fontFamily: 'var(--font-heading)' }}>
              {editorsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '14px 20px',
          border: '1.5px solid rgba(84, 52, 136, 0.12)',
          boxShadow: '0 4px 16px rgba(84, 52, 136, 0.04)',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(84, 52, 136, 0.45)',
              }}
            />
            <input
              type="text"
              placeholder="Search by name, @username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{
                paddingLeft: '40px',
                width: '100%',
                height: '40px',
                borderRadius: '12px',
                fontSize: '13px',
                border: '1.5px solid rgba(84, 52, 136, 0.15)',
              }}
            />
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(84, 52, 136, 0.05)',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid rgba(84, 52, 136, 0.1)',
            }}
          >
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                backgroundColor: statusFilter === 'ALL' ? '#543488' : 'transparent',
                color: statusFilter === 'ALL' ? '#ffffff' : '#543488',
                transition: 'all 0.18s ease',
              }}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                backgroundColor: statusFilter === 'ACTIVE' ? '#543488' : 'transparent',
                color: statusFilter === 'ACTIVE' ? '#ffffff' : '#543488',
                transition: 'all 0.18s ease',
              }}
            >
              Verified ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                backgroundColor: statusFilter === 'PENDING' ? '#543488' : 'transparent',
                color: statusFilter === 'PENDING' ? '#ffffff' : '#543488',
                transition: 'all 0.18s ease',
              }}
            >
              Pending ({pendingCount})
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(84, 52, 136, 0.05)',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid rgba(84, 52, 136, 0.1)',
            }}
          >
            <button
              onClick={() => setRoleFilter('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                backgroundColor: roleFilter === 'ALL' ? '#543488' : 'transparent',
                color: roleFilter === 'ALL' ? '#ffffff' : '#543488',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              All Roles
            </button>
            <button
              onClick={() => setRoleFilter('EDITOR')}
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                backgroundColor: roleFilter === 'EDITOR' ? '#543488' : 'transparent',
                color: roleFilter === 'EDITOR' ? '#ffffff' : '#543488',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              Editors
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                backgroundColor: roleFilter === 'ADMIN' ? '#543488' : 'transparent',
                color: roleFilter === 'ADMIN' ? '#ffffff' : '#543488',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid rgba(84, 52, 136, 0.12)',
          boxShadow: '0 8px 24px rgba(84, 52, 136, 0.05)',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {isLoading ? (
          <PebloLoader text="Loading team directory..." minHeight="240px" />
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Users size={46} color="rgba(84, 52, 136, 0.3)" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '18px', color: '#543488', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              No team members found
            </h3>
            <p style={{ color: 'rgba(84, 52, 136, 0.65)', fontSize: '13px', marginTop: '4px' }}>
              {searchTerm ? 'Try searching with a different username or email keyword.' : 'Click "Invite New Editor" to send the first setup invitation.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(84, 52, 136, 0.04)', borderBottom: '1.5px solid rgba(84, 52, 136, 0.1)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#543488', textTransform: 'uppercase', letterSpacing: '0.06em', width: '32%' }}>
                    Team Member & Username
                  </th>
                  <th style={{ padding: '16px 16px', fontSize: '11px', fontWeight: 800, color: '#543488', textTransform: 'uppercase', letterSpacing: '0.06em', width: '14%' }}>
                    Role
                  </th>
                  <th style={{ padding: '16px 16px', fontSize: '11px', fontWeight: 800, color: '#543488', textTransform: 'uppercase', letterSpacing: '0.06em', width: '22%' }}>
                    Account Status
                  </th>
                  <th style={{ padding: '16px 16px', fontSize: '11px', fontWeight: 800, color: '#543488', textTransform: 'uppercase', letterSpacing: '0.06em', width: '14%' }}>
                    Invited On
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#543488', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', width: '18%' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => {
                  const isSelf = currentUser?.id === item.id;
                  const isSuperAdmin = Boolean(item.is_superadmin);
                  const getInitials = (name?: string | null, email?: string) => {
                    if (name && name.trim()) {
                      const parts = name.trim().split(/\s+/);
                      if (parts.length >= 2) {
                        return (parts[0][0] + parts[1][0]).toUpperCase();
                      }
                      return parts[0].slice(0, 2).toUpperCase();
                    }
                    if (email && email.trim()) {
                      return email.charAt(0).toUpperCase();
                    }
                    return 'U';
                  };

                  const initial = getInitials(item.name, item.email);
                  const isPending = !item.is_verified || item.has_pending_setup;
                  const displayName = item.name?.trim() || item.email;

                  return (
                    <tr
                      key={item.id}
                      className="interactive-row"
                      style={{
                        borderBottom: '1px solid rgba(84, 52, 136, 0.07)',
                      }}
                    >
                      {/* Team Member Column */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '13px',
                              background: isSuperAdmin
                                ? 'linear-gradient(135deg, #543488 0%, #2d184c 100%)'
                                : item.role === 'ADMIN'
                                ? 'linear-gradient(135deg, #543488 0%, #3e2268 100%)'
                                : 'linear-gradient(135deg, #7c4dbb 0%, #543488 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '14px',
                              fontFamily: 'var(--font-heading)',
                              flexShrink: 0,
                              boxShadow: '0 3px 8px rgba(84, 52, 136, 0.18)',
                              border: isSuperAdmin ? '1.5px solid #d97706' : 'none',
                            }}
                          >
                            {isSuperAdmin ? '👑' : initial}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: '#543488',
                                  fontSize: '14px',
                                  fontFamily: 'var(--font-heading)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={displayName}
                              >
                                {displayName}
                              </span>
                              {isSuperAdmin && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    backgroundColor: '#fffbeb',
                                    color: '#b45309',
                                    border: '1px solid #fde68a',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  ROOT ADMIN (.env)
                                </span>
                              )}
                              {isSelf && !isSuperAdmin && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    backgroundColor: 'rgba(84, 52, 136, 0.1)',
                                    color: '#543488',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(84, 52, 136, 0.65)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: '#543488',
                                  backgroundColor: 'rgba(84, 52, 136, 0.07)',
                                  padding: '1px 5px',
                                  borderRadius: '5px',
                                  fontFamily: 'monospace',
                                }}
                              >
                                @{item.username || 'user'}
                              </span>
                              <span>•</span>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                {item.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td style={{ padding: '16px 16px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 800,
                            fontFamily: 'var(--font-heading)',
                            backgroundColor: item.role === 'ADMIN' ? '#543488' : 'rgba(84, 52, 136, 0.08)',
                            color: item.role === 'ADMIN' ? '#ffffff' : '#543488',
                            border: `1px solid ${item.role === 'ADMIN' ? '#543488' : 'rgba(84, 52, 136, 0.2)'}`,
                          }}
                        >
                          {item.role === 'ADMIN' ? <ShieldCheck size={12} /> : <Users size={12} />}
                          {item.role}
                        </span>
                      </td>

                      {/* Unified Status Column */}
                      <td style={{ padding: '16px 16px', whiteSpace: 'nowrap' }}>
                        {!item.is_active ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor: '#fff1f2',
                              color: '#e11d48',
                              border: '1px solid #fecdd3',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e11d48' }} />
                            Suspended
                          </span>
                        ) : isPending ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor: '#fffbeb',
                              color: '#d97706',
                              border: '1px solid #fde68a',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                            Pending Setup
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }} />
                            Active & Verified
                          </span>
                        )}
                      </td>

                      {/* Invited Date */}
                      <td style={{ padding: '16px 16px', fontSize: '12px', color: 'rgba(84, 52, 136, 0.7)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* If Root SuperAdmin: Protected indicator */}
                          {isSuperAdmin && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#b45309',
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fde68a',
                                padding: '4px 10px',
                                borderRadius: '8px',
                              }}
                              title="Root SuperAdmin defined in .env cannot be deleted or suspended."
                            >
                              🔒 Protected Root
                            </span>
                          )}

                          {/* If Pending: Show Resend Email and Link */}
                          {!isSuperAdmin && isPending && (
                            <>
                              <button
                                onClick={() => resendEmailMutation.mutate(item.id)}
                                disabled={resendEmailMutation.isPending}
                                className="btn-peblo-primary"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                                title={`Resend setup email to ${item.email}`}
                              >
                                <Mail size={12} />
                                Resend Email
                              </button>

                              <button
                                onClick={() => getLinkMutation.mutate(item.id)}
                                className="btn-peblo-outline"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Copy Setup Link Backup"
                              >
                                <Share2 size={12} />
                                Link
                              </button>
                            </>
                          )}

                          {/* If Verified & Not Self & Not SuperAdmin: Show Suspend/Activate */}
                          {!isSuperAdmin && !isSelf && !isPending && (
                            <button
                              onClick={() => toggleStatusMutation.mutate({ userId: item.id, isActive: !item.is_active })}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-heading)',
                                border: `1px solid ${item.is_active ? 'rgba(217, 119, 6, 0.3)' : 'rgba(5, 150, 105, 0.3)'}`,
                                backgroundColor: item.is_active ? 'rgba(217, 119, 6, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                                color: item.is_active ? '#d97706' : '#059669',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title={
                                item.is_active
                                  ? `Suspend ${item.role === 'ADMIN' ? 'Administrator' : 'Editor'}`
                                  : `Activate ${item.role === 'ADMIN' ? 'Administrator' : 'Editor'}`
                              }
                            >
                              <Power size={11} />
                              {item.is_active ? 'Suspend' : 'Activate'}
                            </button>
                          )}

                          {/* Delete Action (Except Self & SuperAdmin) */}
                          {!isSuperAdmin && !isSelf && (
                            <button
                              onClick={() => setDeleteTargetUser(item)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                backgroundColor: '#fff1f2',
                                border: '1px solid #fecdd3',
                                color: '#e11d48',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              title={`Delete ${item.role === 'ADMIN' ? 'Administrator' : 'Editor'}`}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e11d48';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fff1f2';
                                e.currentTarget.style.color = '#e11d48';
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INVITE EDITOR MODAL (VIP Access Pass Style) */}
      {isInviteOpen &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(45, 24, 76, 0.65)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999999,
              padding: '20px',
              margin: 0,
              boxSizing: 'border-box',
            }}
            onClick={() => setIsInviteOpen(false)}
          >
            <div
              className="animate-fade-in"
              style={{
                width: '100%',
                maxWidth: '520px',
                backgroundColor: '#ffffff',
                borderRadius: '26px',
                boxShadow: '0 25px 60px -15px rgba(84, 52, 136, 0.4)',
                overflow: 'hidden',
                border: '2px solid rgba(84, 52, 136, 0.2)',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #543488 0%, #3e2268 100%)',
                  padding: '24px 30px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '20px',
                        color: '#ffffff',
                        fontWeight: 800,
                        margin: 0,
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      Invite Team Member
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '12px', margin: '2px 0 0' }}>
                      Set a unique username & dispatch email invite
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px 30px', overflowY: 'auto' }}>
                {inviteError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#fff1f2',
                      border: '1.5px solid #fecdd3',
                      borderRadius: '12px',
                      color: '#e11d48',
                      fontSize: '13px',
                      fontWeight: 700,
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    {inviteError}
                  </div>
                )}

                <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Full Name */}
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#543488',
                        marginBottom: '6px',
                        display: 'block',
                        fontFamily: 'var(--font-heading)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'rgba(84, 52, 136, 0.5)',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="e.g. Alex Johnson"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="input-field"
                        style={{
                          paddingLeft: '42px',
                          width: '100%',
                          height: '42px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          border: '2px solid rgba(84, 52, 136, 0.2)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Informational Notice: Receiver picks username & password */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(84, 52, 136, 0.05)',
                      border: '1.5px dashed rgba(84, 52, 136, 0.25)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>✨</span>
                    <div style={{ fontSize: '12px', color: '#543488', lineHeight: 1.45 }}>
                      <strong style={{ display: 'block', marginBottom: '2px' }}>Receiver Chooses Handle & Password</strong>
                      An invitation email with a secure setup link will be sent to the recipient. They will choose their unique <strong>@username</strong> and password when accepting the invite.
                    </div>
                  </div>

                  {/* Recipient Email */}
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#543488',
                        marginBottom: '6px',
                        display: 'block',
                        fontFamily: 'var(--font-heading)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Recipient Email Address *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'rgba(84, 52, 136, 0.5)',
                        }}
                      />
                      <input
                        type="email"
                        required
                        placeholder="e.g. editor@peblo.tv"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="input-field"
                        style={{
                          paddingLeft: '42px',
                          width: '100%',
                          height: '42px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          border: '2px solid rgba(84, 52, 136, 0.2)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Assigned Role Interactive Cards */}
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#543488',
                        marginBottom: '8px',
                        display: 'block',
                        fontFamily: 'var(--font-heading)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Assigned Role & Permissions
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {/* Editor Role Card */}
                      <div
                        onClick={() => setInviteRole('EDITOR')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '14px',
                          border: `2px solid ${inviteRole === 'EDITOR' ? '#543488' : 'rgba(84, 52, 136, 0.18)'}`,
                          backgroundColor: inviteRole === 'EDITOR' ? 'rgba(84, 52, 136, 0.06)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          boxShadow: inviteRole === 'EDITOR' ? '0 4px 14px rgba(84, 52, 136, 0.12)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>✍️</span>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: '#543488', fontFamily: 'var(--font-heading)' }}>
                              Editor
                            </span>
                          </div>
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: `2px solid ${inviteRole === 'EDITOR' ? '#543488' : 'rgba(84, 52, 136, 0.3)'}`,
                              backgroundColor: inviteRole === 'EDITOR' ? '#543488' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {inviteRole === 'EDITOR' && <Check size={11} color="#ffffff" strokeWidth={3} />}
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(84, 52, 136, 0.75)', lineHeight: 1.35 }}>
                          Manage catalogue shows, seasons & episode content.
                        </p>
                      </div>

                      {/* Administrator Role Card */}
                      <div
                        onClick={() => setInviteRole('ADMIN')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '14px',
                          border: `2px solid ${inviteRole === 'ADMIN' ? '#543488' : 'rgba(84, 52, 136, 0.18)'}`,
                          backgroundColor: inviteRole === 'ADMIN' ? 'rgba(84, 52, 136, 0.06)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          boxShadow: inviteRole === 'ADMIN' ? '0 4px 14px rgba(84, 52, 136, 0.12)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>🛡️</span>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: '#543488', fontFamily: 'var(--font-heading)' }}>
                              Administrator
                            </span>
                          </div>
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: `2px solid ${inviteRole === 'ADMIN' ? '#543488' : 'rgba(84, 52, 136, 0.3)'}`,
                              backgroundColor: inviteRole === 'ADMIN' ? '#543488' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {inviteRole === 'ADMIN' && <Check size={11} color="#ffffff" strokeWidth={3} />}
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(84, 52, 136, 0.75)', lineHeight: 1.35 }}>
                          Full catalogue publishing triggers & team management.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Information Box */}
                  <div
                    style={{
                      backgroundColor: 'rgba(84, 52, 136, 0.04)',
                      border: '1px dashed rgba(84, 52, 136, 0.25)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      fontSize: '12px',
                      color: '#543488',
                      lineHeight: 1.5,
                    }}
                  >
                    ✉️ <strong>Notice:</strong> An invitation email with a secure setup link will be dispatched. The receiver will choose their own unique @username and password.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsInviteOpen(false)}
                      className="btn-peblo-outline"
                      disabled={inviteUserMutation.isPending}
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-peblo-primary"
                      disabled={inviteUserMutation.isPending}
                      style={{
                        padding: '10px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                      }}
                    >
                      {inviteUserMutation.isPending ? (
                        <>
                          <RefreshCw size={15} className="spin" /> Sending Email...
                        </>
                      ) : (
                        <>
                          <Send size={15} /> Send Invitation Email
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* INVITATION SENT SUCCESS MODAL */}
      {successInviteData &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(45, 24, 76, 0.65)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999999,
              padding: '20px',
              margin: 0,
              boxSizing: 'border-box',
            }}
            onClick={() => setSuccessInviteData(null)}
          >
            <div
              className="animate-fade-in"
              style={{
                width: '100%',
                maxWidth: '520px',
                backgroundColor: '#ffffff',
                borderRadius: '26px',
                padding: '32px',
                boxShadow: '0 25px 60px -15px rgba(84, 52, 136, 0.4)',
                border: '2px solid rgba(84, 52, 136, 0.2)',
                textAlign: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Check Illustration */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
                }}
              >
                <Check size={34} strokeWidth={3} />
              </div>

              <h3
                style={{
                  fontSize: '22px',
                  color: '#543488',
                  fontWeight: 800,
                  margin: '0 0 6px',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Invitation Sent! 🎉
              </h3>
              <p style={{ color: 'rgba(84, 52, 136, 0.8)', fontSize: '14px', lineHeight: 1.5, marginBottom: '18px' }}>
                Setup invitation sent to <strong style={{ color: '#543488' }}>{successInviteData.email}</strong>. The recipient can click the link in their inbox to choose their unique username and activate their account.
              </p>

              {/* Email Dispatch Info Box */}
              <div
                style={{
                  backgroundColor: 'rgba(5, 150, 105, 0.08)',
                  border: '1.5px solid rgba(5, 150, 105, 0.25)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  marginBottom: '16px',
                }}
              >
                <Mail size={20} color="#059669" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#065f46', fontFamily: 'var(--font-heading)' }}>
                    Email Delivered to Recipient
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                    The recipient can verify their email and set their password directly.
                  </div>
                </div>
              </div>

              {/* Direct Backup URL Box */}
              <div
                style={{
                  backgroundColor: 'rgba(84, 52, 136, 0.04)',
                  border: '1.5px solid rgba(84, 52, 136, 0.15)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  textAlign: 'left',
                }}
              >
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#543488',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '6px',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Setup Link (Backup Copy):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={successInviteData.url}
                    className="input-field"
                    style={{
                      width: '100%',
                      backgroundColor: '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      borderRadius: '8px',
                      height: '36px',
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="btn-peblo-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                      padding: '6px 14px',
                      fontSize: '12px',
                      height: '36px',
                    }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => resendEmailMutation.mutate(successInviteData.userId)}
                    disabled={resendEmailMutation.isPending}
                    className="btn-peblo-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '8px 14px' }}
                  >
                    <Mail size={13} />
                    {resendEmailMutation.isPending ? 'Resending...' : 'Resend Email'}
                  </button>
                  <a
                    href={successInviteData.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-peblo-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '8px 14px' }}
                  >
                    <ExternalLink size={13} /> Open
                  </a>
                </div>

                <button
                  onClick={() => setSuccessInviteData(null)}
                  className="btn-peblo-primary"
                  style={{ padding: '8px 22px', fontSize: '13px' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* CONFIRM DELETE MODAL (CUSTOM ALERT IN RED) */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetUser)}
        title={deleteTargetUser?.role === 'ADMIN' ? 'Revoke & Delete Administrator' : 'Revoke & Delete Editor'}
        itemName={deleteTargetUser ? `@${deleteTargetUser.username || deleteTargetUser.email}` : ''}
        message={
          deleteTargetUser?.role === 'ADMIN'
            ? 'Are you sure you want to permanently delete this administrator account? All admin privileges will be revoked immediately.'
            : 'Are you sure you want to delete this editor account? All editing access will be revoked immediately.'
        }
        confirmLabel={deleteTargetUser?.role === 'ADMIN' ? 'Delete Admin' : 'Delete Editor'}
        cancelLabel={deleteTargetUser?.role === 'ADMIN' ? 'Keep Admin' : 'Keep Editor'}
        isDangerous={true}
        isLoading={deleteUserMutation.isPending}
        onConfirm={() => {
          if (deleteTargetUser) {
            deleteUserMutation.mutate(deleteTargetUser.id);
          }
        }}
        onCancel={() => setDeleteTargetUser(null)}
      />
    </div>
  );
};
