import React from 'react';
import { Clock } from 'lucide-react';

export interface DurationBadgeProps {
  clockIn?: Date | string | null;
  clockOut?: Date | string | null;
  status?: string;
}

/**
 * Visual Duration Badge with Progress Indicator and Status Breakdown
 * Adheres to SRP: solely responsible for calculating and rendering duration metrics.
 * Adheres to DRY: shared across AdminReports, AdminMonitoring, and EmployeeHistory.
 */
export const DurationBadge: React.FC<DurationBadgeProps> = ({
  clockIn,
  clockOut,
}) => {
  if (!clockIn) {
    return <span style={{ color: '#a1a1aa', fontSize: '0.75rem', fontStyle: 'italic' }}>-</span>;
  }

  // 1. Completed Attendance (Clock Out present)
  if (clockOut) {
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    const diffMs = Math.max(0, end - start);
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const isFullDay = hours >= 8;
    const pct = Math.min(100, Math.round((diffMs / (8 * 3600000)) * 100));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: '135px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            background: isFullDay ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${isFullDay ? '#bbf7d0' : '#fde68a'}`,
            color: isFullDay ? '#15803d' : '#92400e',
            fontSize: '0.75rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} color={isFullDay ? '#16a34a' : '#d97706'} />
            <span className="tabular-nums">{hours}j {minutes}m</span>
          </div>
          {isFullDay ? (
            <span
              style={{
                fontSize: '0.625rem',
                background: '#dcfce7',
                color: '#15803d',
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                fontWeight: 700,
              }}
            >
              ✓ Lengkap
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.625rem',
                background: '#fef3c7',
                color: '#b45309',
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                fontWeight: 700,
              }}
            >
              &lt;8 Jam
            </span>
          )}
        </div>
        {/* Progress bar towards 8h standard */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#e2e8f0',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
          title={`Pencapaian: ${pct}% dari standar 8 jam kerja`}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: isFullDay ? '#22c55e' : '#f59e0b',
              borderRadius: '9999px',
            }}
          />
        </div>
      </div>
    );
  }

  // 2. Ongoing / Clocked In (Real-time elapsed counter)
  const start = new Date(clockIn).getTime();
  const diffMs = Math.max(0, Date.now() - start);
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const pct = Math.min(100, Math.round((diffMs / (8 * 3600000)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: '135px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.35rem',
          padding: '0.25rem 0.6rem',
          borderRadius: '6px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8',
          fontSize: '0.75rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            className="pulse-live"
            style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', flexShrink: 0 }}
          />
          <span className="tabular-nums">~{hours}j {minutes}m</span>
        </div>
        <span
          style={{
            fontSize: '0.625rem',
            background: '#dbeafe',
            color: '#1e40af',
            padding: '0.1rem 0.4rem',
            borderRadius: '9999px',
            fontWeight: 700,
          }}
        >
          Sedang Kerja
        </span>
      </div>
      {/* Animated active progress bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#dbeafe',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
        title={`Sedang berjalan: ~${pct}% dari standar 8 jam kerja`}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '9999px',
          }}
        />
      </div>
    </div>
  );
};
