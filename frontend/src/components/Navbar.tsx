import React from 'react';
import { LogOut, User as UserIcon, Clock, Users, ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isHrd = user.role === 'ADMIN_HRD';

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8B1816 0%, #B12523 55%, #C62828 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(177, 37, 35, 0.3)',
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            dexa group
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
              HRIS Portal
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
              PT Dexa Medica • Sistem Presensi
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isHrd ? (
            <>
              <button
                type="button"
                className={`btn ${currentTab === 'monitoring' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                onClick={() => onTabChange('monitoring')}
              >
                <ShieldCheck size={16} /> Monitoring Absensi
              </button>
              <button
                type="button"
                className={`btn ${currentTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                onClick={() => onTabChange('employees')}
              >
                <Users size={16} /> Master Karyawan
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`btn ${currentTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                onClick={() => onTabChange('attendance')}
              >
                <Clock size={16} /> Absensi WFH
              </button>
              <button
                type="button"
                className={`btn ${currentTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                onClick={() => onTabChange('history')}
              >
                <Calendar size={16} /> Riwayat Absen
              </button>
            </>
          )}
        </nav>

        {/* User profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {user.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                <StatusBadge status={user.role} type="role" />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{user.nik}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={logout}
            title="Keluar dari akun"
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
