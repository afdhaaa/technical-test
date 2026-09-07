import React from 'react';
import {
  Users,
  Clock,
  Calendar,
  LogOut,
  Building2,
  CheckCircle,
  LayoutDashboard,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const isHrd = user.role === 'ADMIN_HRD';

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    onClose?.();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar-desktop ${isOpen ? 'is-open' : ''}`}>
        {/* Header Brand */}
        <div
          style={{
            padding: '1.125rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: '#B12523',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  fontSize: '0.9375rem',
                  letterSpacing: '-0.02em',
                  boxShadow: '0 2px 8px rgba(177, 37, 35, 0.3)',
                }}
              >
                dexa group
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#09090b', letterSpacing: '-0.01em' }}>
                  HRIS Portal
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#71717a' }}>
                  Presensi & SDM
                </div>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={onClose}
                title="Tutup Menu"
                aria-label="Tutup Menu"
              >
                <X size={18} />
              </button>
            )}
          </div>

        {/* Company branch badge */}
        <div
          style={{
            marginTop: '0.75rem',
            background: '#fafafa',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '0.35rem 0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.6875rem',
            color: '#3f3f46',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Building2 size={12} color="#71717a" />
            <span style={{ fontWeight: 500 }}>PT Dexa Medica</span>
          </div>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: '#a1a1aa',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0 0.5rem 0.5rem',
          }}
        >
          {isHrd ? 'Manajemen HR' : 'Presensi Karyawan'}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {isHrd ? (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  height: '36px',
                  padding: '0 0.625rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  backgroundColor: currentTab === 'monitoring' ? '#FEF2F2' : 'transparent',
                  color: currentTab === 'monitoring' ? '#B12523' : '#52525b',
                  fontWeight: currentTab === 'monitoring' ? 600 : 500,
                  borderLeft: currentTab === 'monitoring' ? '3px solid #B12523' : '3px solid transparent',
                }}
                onClick={() => handleTabClick('monitoring')}
              >
                <LayoutDashboard size={15} color={currentTab === 'monitoring' ? '#B12523' : '#71717a'} />
                <span>Monitoring Hari Ini</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  height: '36px',
                  padding: '0 0.625rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  backgroundColor: currentTab === 'reports' ? '#FEF2F2' : 'transparent',
                  color: currentTab === 'reports' ? '#B12523' : '#52525b',
                  fontWeight: currentTab === 'reports' ? 600 : 500,
                  borderLeft: currentTab === 'reports' ? '3px solid #B12523' : '3px solid transparent',
                }}
                onClick={() => handleTabClick('reports')}
              >
                <FileSpreadsheet size={15} color={currentTab === 'reports' ? '#B12523' : '#71717a'} />
                <span>Laporan Presensi</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  height: '36px',
                  padding: '0 0.625rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  backgroundColor: currentTab === 'employees' ? '#FEF2F2' : 'transparent',
                  color: currentTab === 'employees' ? '#B12523' : '#52525b',
                  fontWeight: currentTab === 'employees' ? 600 : 500,
                  borderLeft: currentTab === 'employees' ? '3px solid #B12523' : '3px solid transparent',
                }}
                onClick={() => handleTabClick('employees')}
              >
                <Users size={15} color={currentTab === 'employees' ? '#B12523' : '#71717a'} />
                <span>Direktori Karyawan</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  height: '36px',
                  padding: '0 0.625rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  backgroundColor: currentTab === 'attendance' ? '#FEF2F2' : 'transparent',
                  color: currentTab === 'attendance' ? '#B12523' : '#52525b',
                  fontWeight: currentTab === 'attendance' ? 600 : 500,
                  borderLeft: currentTab === 'attendance' ? '3px solid #B12523' : '3px solid transparent',
                }}
                onClick={() => handleTabClick('attendance')}
              >
                <Clock size={15} color={currentTab === 'attendance' ? '#B12523' : '#71717a'} />
                <span>Presensi WFH Hari Ini</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  height: '36px',
                  padding: '0 0.625rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  backgroundColor: currentTab === 'history' ? '#FEF2F2' : 'transparent',
                  color: currentTab === 'history' ? '#B12523' : '#52525b',
                  fontWeight: currentTab === 'history' ? 600 : 500,
                  borderLeft: currentTab === 'history' ? '3px solid #B12523' : '3px solid transparent',
                }}
                onClick={() => handleTabClick('history')}
              >
                <Calendar size={15} color={currentTab === 'history' ? '#B12523' : '#71717a'} />
                <span>Riwayat Kehadiran</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div
        style={{
          padding: '0.875rem',
          borderTop: '1px solid var(--border)',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', overflow: 'hidden' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#e4e4e7',
              color: '#18181b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', lineHeight: 1.25, flex: 1 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: '0.8125rem',
                color: '#09090b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#71717a' }}>
              {user.nik}
            </div>
          </div>
        </div>

        {/* Labeled Logout Button */}
        <button
          type="button"
          onClick={logout}
          style={{
            marginTop: '0.625rem',
            width: '100%',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#dc2626',
            backgroundColor: '#ffffff',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
            e.currentTarget.style.borderColor = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#fecaca';
          }}
          title="Keluar dari akun (Logout)"
        >
          <LogOut size={13} color="#dc2626" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </aside>
  </>
  );
};
