import React, { useState, useEffect } from 'react';
import { Calendar, Image as ImageIcon, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { apiClient, getImageUrl } from '../api/client';
import { Attendance } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ImageLightbox } from '../components/ImageLightbox';
import { DurationBadge } from '../components/DurationBadge';

export const EmployeeHistory: React.FC = () => {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lightboxData, setLightboxData] = useState<{ attendance: Attendance; type: 'clockIn' | 'clockOut' } | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/attendance/my-history?limit=100');
      setHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const columns: Column<Attendance>[] = [
    {
      key: 'date',
      title: 'Tanggal',
      render: (item) => (
        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={14} color="#71717a" />
          <span>{item.date}</span>
        </div>
      ),
      width: '12%',
    },
    {
      key: 'workSchedule',
      title: 'Jadwal Shift',
      render: (item) => (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.6875rem',
            fontWeight: 500,
            color: '#27272a',
            background: '#f4f4f5',
            padding: '0.2rem 0.45rem',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Clock size={11} color="#71717a" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.workSchedule || '09:00 - 18:00 (Reguler)'}
          </span>
        </div>
      ),
      width: '15%',
    },
    {
      key: 'clockIn',
      title: 'Presensi Masuk',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <div
            style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => setLightboxData({ attendance: item, type: 'clockIn' })}
            title="Klik untuk melihat bukti masuk"
          >
            <img
              src={getImageUrl(item.clockInPhoto)}
              alt="Masuk"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                objectFit: 'cover',
                border: '1px solid var(--border)',
                display: 'block',
              }}
            />
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div className="tabular-nums" style={{ fontWeight: 600, fontSize: '0.75rem', color: '#09090b' }}>
              {new Date(item.clockIn).toLocaleTimeString('id-ID')}
            </div>
            {item.clockInLocation && (
              <div
                style={{
                  fontSize: '0.625rem',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
                title={`${item.clockInLocation} - Klik untuk audit`}
                onClick={() => setLightboxData({ attendance: item, type: 'clockIn' })}
              >
                <MapPin size={10} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.clockInLocation}</span>
              </div>
            )}
          </div>
        </div>
      ),
      width: '17%',
    },
    {
      key: 'clockOut',
      title: 'Presensi Pulang',
      render: (item) =>
        item.clockOut ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            {item.clockOutPhoto && (
              <div
                style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setLightboxData({ attendance: item, type: 'clockOut' })}
                title="Klik untuk melihat bukti pulang"
              >
                <img
                  src={getImageUrl(item.clockOutPhoto)}
                  alt="Pulang"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    border: '1px solid var(--border)',
                    display: 'block',
                  }}
                />
              </div>
            )}
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div className="tabular-nums" style={{ fontWeight: 600, fontSize: '0.75rem', color: '#09090b' }}>
                {new Date(item.clockOut).toLocaleTimeString('id-ID')}
              </div>
              {item.clockOutLocation && (
                <div
                  style={{
                    fontSize: '0.625rem',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                  title={`${item.clockOutLocation} - Klik untuk audit`}
                  onClick={() => setLightboxData({ attendance: item, type: 'clockOut' })}
                >
                  <MapPin size={10} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.clockOutLocation}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <span
            style={{
              fontSize: '0.6875rem',
              color: '#71717a',
              background: '#f4f4f5',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
            }}
          >
            Sedang Bekerja
          </span>
        ),
      width: '17%',
    },
    {
      key: 'duration',
      title: 'Durasi Kerja',
      render: (item) => (
        <DurationBadge clockIn={item.clockIn} clockOut={item.clockOut} />
      ),
      width: '17%',
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => <StatusBadge status={item.status} type="attendance" />,
      width: '11%',
    },
    {
      key: 'action',
      title: 'Bukti',
      render: (item) => (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setLightboxData({ attendance: item, type: 'clockIn' })}
          style={{ height: '26px', padding: '0 0.5rem', fontSize: '0.6875rem' }}
          title="Lihat detail dan foto bukti"
        >
          <ShieldCheck size={12} /> Detail
        </button>
      ),
      width: '7%',
    },
  ];

  const renderMobileCard = (item: Attendance) => (
    <div
      key={item.id}
      className="card"
      style={{
        padding: '0.875rem 1rem',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}
    >
      {/* Card Header: Date & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.875rem', color: '#09090b' }}>
          <Calendar size={15} color="#B12523" />
          <span>{item.date}</span>
        </div>
        <StatusBadge status={item.status} type="attendance" />
      </div>

      {/* Shift Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#52525b' }}>
        <Clock size={12} color="#71717a" />
        <span>Shift: <strong style={{ color: '#09090b' }}>{item.workSchedule || '09:00 - 18:00 (Reguler)'}</strong></span>
      </div>

      {/* Punches Grid: Clock In vs Clock Out */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '0.5rem 0.65rem',
          border: '1px solid #f1f5f9',
        }}
      >
        {/* Clock In */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          {item.clockInPhoto && (
            <img
              src={getImageUrl(item.clockInPhoto)}
              alt="Masuk"
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #22c55e', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => setLightboxData({ attendance: item, type: 'clockIn' })}
              title="Ketuk untuk melihat foto"
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.625rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>Masuk</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b' }}>
              {new Date(item.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Clock Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          {item.clockOut ? (
            <>
              {item.clockOutPhoto && (
                <img
                  src={getImageUrl(item.clockOutPhoto)}
                  alt="Pulang"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ef4444', flexShrink: 0, cursor: 'pointer' }}
                  onClick={() => setLightboxData({ attendance: item, type: 'clockOut' })}
                  title="Ketuk untuk melihat foto"
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.625rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>Pulang</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b' }}>
                  {new Date(item.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', color: '#a1a1aa', fontSize: '0.72rem', fontStyle: 'italic' }}>
              Belum clock out
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.2rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setLightboxData({ attendance: item, type: 'clockIn' })}
          style={{ height: '28px', padding: '0 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
        >
          <ShieldCheck size={13} color="#B12523" /> Detail & Peta GPS
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#09090b', letterSpacing: '-0.01em' }}>
          Riwayat Presensi WFH
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
          Log catatan kehadiran dan foto verifikasi harian Anda.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={history}
        searchPlaceholder="Filter riwayat..."
        emptyMessage="Belum ada riwayat presensi yang tersimpan"
        mobileCardRender={renderMobileCard}
      />

      {lightboxData && (
        <ImageLightbox
          attendance={lightboxData.attendance}
          type={lightboxData.type}
          onClose={() => setLightboxData(null)}
        />
      )}
    </div>
  );
};
