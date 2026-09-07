import React from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { getImageUrl } from '../api/client';
import { Attendance } from '../types';
import { GoogleMapPreview } from './GoogleMapPreview';

interface ImageLightboxProps {
  attendance: Attendance | null;
  type: 'clockIn' | 'clockOut';
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  attendance,
  type,
  onClose,
}) => {
  if (!attendance) return null;

  const photoPath = type === 'clockIn' ? attendance.clockInPhoto : attendance.clockOutPhoto;
  const timestamp = type === 'clockIn' ? attendance.clockIn : attendance.clockOut;
  const title = type === 'clockIn' ? 'Bukti Presensi Masuk (Clock-In)' : 'Bukti Presensi Selesai (Clock-Out)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            width: '32px',
            height: '32px',
            padding: 0,
            background: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <X size={16} />
        </button>

        {/* Image Box */}
        <div
          style={{
            flex: '1.3',
            background: '#09090b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <img
            src={getImageUrl(photoPath)}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '75vh',
              borderRadius: 'var(--radius-sm)',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Audit Metadata Sidebar */}
        <div
          style={{
            flex: '1',
            padding: '1.75rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff',
            borderLeft: '1px solid var(--border)',
            overflowY: 'auto',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span
                style={{
                  background: '#f4f4f5',
                  color: '#18181b',
                  border: '1px solid var(--border)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <ShieldCheck size={12} color="#22c55e" /> Verifikasi Presensi
              </span>
            </div>

            <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#09090b', marginBottom: '1.25rem' }}>
              {title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.8125rem' }}>
              {attendance.employee && (
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Karyawan
                  </div>
                  <div style={{ fontWeight: 600, color: '#09090b' }}>{attendance.employee.name}</div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                    {attendance.employee.nik} • {attendance.employee.department}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Tanggal
                  </div>
                  <div style={{ fontWeight: 600, color: '#09090b' }}>{attendance.date}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Waktu Server
                  </div>
                  <div style={{ fontWeight: 600, color: '#09090b' }}>
                    {timestamp ? new Date(timestamp).toLocaleTimeString('id-ID') + ' WIB' : '-'}
                  </div>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Jadwal Shift (Work Schedule)
                </div>
                <div style={{ fontWeight: 600, color: '#09090b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} color="#71717a" />
                  <span>{attendance.workSchedule || attendance.employee?.workSchedule || '09:00 - 18:00 (Reguler)'}</span>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Lokasi Presensi ({type === 'clockIn' ? 'Masuk' : 'Pulang'})
                </div>
                <div style={{ fontWeight: 600, color: '#09090b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <MapPin size={13} color="#ef4444" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {(type === 'clockIn' ? attendance.clockInLocation : attendance.clockOutLocation) || 'Lokasi GPS Default'}
                  </span>
                </div>
                <GoogleMapPreview
                  locationString={type === 'clockIn' ? attendance.clockInLocation : attendance.clockOutLocation}
                  height="140px"
                />
              </div>

              {attendance.workNotes && (
                <div style={{ marginTop: '0.25rem' }}>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Catatan WFH Karyawan
                  </div>
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: '#27272a',
                      whiteSpace: 'pre-wrap',
                      border: '1px solid var(--border)',
                      lineHeight: 1.5,
                    }}
                  >
                    {attendance.workNotes}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ width: '100%' }}
            >
              Tutup Dialog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
