import React, { useState, useEffect } from 'react';
import { Clock, Shield, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';

interface TopbarProps {
  currentTab: string;
  onMenuClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ currentTab, onMenuClick }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (currentTab) {
      case 'monitoring':
        return 'Monitoring Hari Ini';
      case 'reports':
        return 'Laporan Presensi WFH';
      case 'employees':
        return 'Direktori Karyawan';
      case 'attendance':
        return 'Presensi WFH';
      case 'history':
        return 'Riwayat Presensi';
      default:
        return 'Dashboard';
    }
  };

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header
      style={{
        height: '52px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: Mobile Hamburger & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.8125rem', minWidth: 0 }}>
        {onMenuClick && (
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onMenuClick}
            title="Buka Menu Navigasi"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <span style={{ color: '#B12523', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', display: 'inline-block' }}>
          dexa group
        </span>
        <span style={{ color: '#d4d4d8' }}>/</span>
        <span style={{ fontWeight: 600, color: 'var(--foreground)' }} className="topbar-title">
          {getBreadcrumbTitle()}
        </span>
      </div>

      {/* Right Controls: Live Clock & Role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Live Clock Pill */}
        <div
          className="topbar-clock"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#fafafa',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '0.25rem 0.625rem',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: '#3f3f46',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }}
            className="pulse-live"
          />
          <span className="topbar-date-text">{formattedDate}</span>
          <span className="topbar-date-text" style={{ color: '#a1a1aa' }}>•</span>
          <span style={{ fontWeight: 600, color: '#09090b' }}>{formattedTime} WIB</span>
        </div>

        <div className="topbar-role-badge">
          {user && <StatusBadge status={user.role} type="role" />}
        </div>

        {/* Prominent Logout Button */}
        <button
          type="button"
          onClick={logout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            height: '30px',
            padding: '0 0.55rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#dc2626',
            backgroundColor: '#ffffff',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};
