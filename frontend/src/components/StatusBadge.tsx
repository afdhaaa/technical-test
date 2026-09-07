import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'attendance' | 'employee' | 'role';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'attendance' }) => {
  let label = status;
  let bg = '#f4f4f5';
  let color = '#3f3f46';
  let border = '#e4e4e7';
  let dotColor = '#71717a';

  if (type === 'attendance') {
    if (status === 'CLOCKED_IN') {
      label = 'Sedang WFH';
      bg = 'var(--info-bg)';
      color = 'var(--info-text)';
      border = 'var(--info-border)';
      dotColor = 'var(--info-dot)';
    } else if (status === 'CLOCKED_OUT') {
      label = 'Selesai Bekerja';
      bg = 'var(--success-bg)';
      color = 'var(--success-text)';
      border = 'var(--success-border)';
      dotColor = 'var(--success-dot)';
    }
  } else if (type === 'employee') {
    if (status === 'ACTIVE') {
      label = 'Aktif';
      bg = 'var(--success-bg)';
      color = 'var(--success-text)';
      border = 'var(--success-border)';
      dotColor = 'var(--success-dot)';
    } else if (status === 'INACTIVE') {
      label = 'Non-Aktif';
      bg = 'var(--danger-bg)';
      color = 'var(--danger-text)';
      border = 'var(--danger-border)';
      dotColor = 'var(--danger-dot)';
    }
  } else if (type === 'role') {
    if (status === 'ADMIN_HRD') {
      label = 'HR Administrator';
      bg = '#f5f3ff';
      color = '#5b21b6';
      border = '#ddd6fe';
      dotColor = '#7c3aed';
    } else {
      label = 'Karyawan';
      bg = '#f4f4f5';
      color = '#27272a';
      border = '#e4e4e7';
      dotColor = '#52525b';
    }
  }

  return (
    <span
      className="badge"
      style={{
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
      }}
    >
      <span className="badge-dot" style={{ backgroundColor: dotColor }} />
      <span>{label}</span>
    </span>
  );
};
