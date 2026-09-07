import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient, getImageUrl } from '../api/client';
import { Attendance } from '../types';
import { CameraCapture } from '../components/CameraCapture';
import { StatusBadge } from '../components/StatusBadge';
import { ImageLightbox } from '../components/ImageLightbox';
import { GoogleMapPreview } from '../components/GoogleMapPreview';
import { PermissionModal } from '../components/PermissionModal';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [capturedPhoto, setCapturedPhoto] = useState<{ base64?: string; file?: File }>({});
  const [workNotes, setWorkNotes] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [lightboxData, setLightboxData] = useState<{ attendance: Attendance; type: 'clockIn' | 'clockOut' } | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);

  const [elapsedTime, setElapsedTime] = useState<string>('0h : 00m : 00s');
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');

      if (todayAttendance?.clockIn && !todayAttendance.clockOut) {
        const start = new Date(todayAttendance.clockIn).getTime();
        const diffMs = Math.max(0, now.getTime() - start);
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        setElapsedTime(
          `${hours}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`
        );
      } else if (todayAttendance?.clockIn && todayAttendance?.clockOut) {
        const start = new Date(todayAttendance.clockIn).getTime();
        const end = new Date(todayAttendance.clockOut).getTime();
        const diffMs = Math.max(0, end - start);
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        setElapsedTime(
          `${hours}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [todayAttendance]);

  const detectLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setIsLocating(false);
      setLocationError('Browser tidak mendukung Geolocation GPS');
      setCoordinates(null);
      setLocation('');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCoordinates({ lat, lng });
        setLocation(`${lat}, ${lng}`);
        setIsLocating(false);
        setLocationError(null);
      },
      (err) => {
        console.warn('Geolocation error / not allowed:', err);
        setIsLocating(false);
        setCoordinates(null);
        setLocation('');
        if (err.code === err.PERMISSION_DENIED) {
          setIsLocationModalOpen(true);
          setLocationError('Izin akses lokasi GPS diblokir oleh browser. Wajib izinkan akses lokasi untuk presensi.');
        } else {
          setLocationError('Gagal mendeteksi sinyal GPS perangkat. Pastikan GPS aktif dan klik Refresh GPS.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        apiClient.get('/api/attendance/today'),
        apiClient.get('/api/attendance/my-history?limit=5'),
      ]);

      setTodayAttendance(todayRes.data || null);
      setRecentAttendances(historyRes.data || []);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    detectLocation();
  }, []);

  const handleClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedPhoto.base64 && !capturedPhoto.file) {
      setFeedback({ type: 'error', message: 'Foto bukti selfie WFH wajib diambil sebelum submit!' });
      return;
    }
    if (!location) {
      setFeedback({ type: 'error', message: 'Menunggu deteksi koordinat GPS sebelum submit!' });
      detectLocation();
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      let res;
      if (capturedPhoto.file) {
        const formData = new FormData();
        formData.append('photo', capturedPhoto.file);
        if (workNotes) formData.append('workNotes', workNotes);
        formData.append('location', location);
        res = await apiClient.post('/api/attendance/clock-in', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await apiClient.post('/api/attendance/clock-in', {
          photoBase64: capturedPhoto.base64,
          workNotes,
          location,
        });
      }

      if (res.data?.success) {
        setFeedback({ type: 'success', message: 'Presensi Masuk (Clock In) WFH berhasil dicatat.' });
        setCapturedPhoto({});
        setWorkNotes('');
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: res.data?.message || 'Gagal clock-in' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Terjadi kesalahan sistem saat memproses presensi',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedPhoto.base64 && !capturedPhoto.file) {
      setFeedback({ type: 'error', message: 'Foto bukti akhir kerja wajib diambil sebelum submit!' });
      return;
    }
    if (!location) {
      setFeedback({ type: 'error', message: 'Menunggu deteksi koordinat GPS sebelum submit!' });
      detectLocation();
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      let res;
      if (capturedPhoto.file) {
        const formData = new FormData();
        formData.append('photo', capturedPhoto.file);
        if (workNotes) formData.append('workNotes', workNotes);
        formData.append('location', location);
        res = await apiClient.post('/api/attendance/clock-out', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await apiClient.post('/api/attendance/clock-out', {
          photoBase64: capturedPhoto.base64,
          workNotes,
          location,
        });
      }

      if (res.data?.success) {
        setFeedback({ type: 'success', message: 'Presensi Selesai (Clock Out) WFH berhasil dicatat.' });
        setCapturedPhoto({});
        setWorkNotes('');
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: res.data?.message || 'Gagal clock-out' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Terjadi kesalahan sistem saat memproses presensi',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '480px', margin: '0 auto', padding: '0.5rem 0.75rem 5rem 0.75rem' }}>
      {/* 1. TOP VIBRANT STATUS CARD (Dexa Group Brand Red Palette) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #8B1816 0%, #B12523 55%, #C62828 100%)',
          borderRadius: '16px',
          padding: '1.25rem 1.15rem 1rem 1.15rem',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(177, 37, 35, 0.38)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '1rem',
        }}
      >
        {/* Subtle background decoration circle */}
        <div
          style={{
            position: 'absolute',
            right: '-25px',
            top: '-25px',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Company & Department Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                dexa group
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.9, color: '#fef2f2', marginTop: '0.1rem' }}>
              PT Dexa Medica • {user?.department || 'Karyawan'}
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: todayAttendance?.status === 'CLOCKED_IN' ? '#86efac' : (todayAttendance ? '#38bdf8' : '#fde047'),
                boxShadow: todayAttendance?.status === 'CLOCKED_IN' ? '0 0 8px #86efac' : 'none',
              }}
            />
            <span>
              {todayAttendance?.status === 'CLOCKED_IN'
                ? 'Clocked In'
                : todayAttendance
                ? 'Selesai'
                : 'Siap Presensi'}
            </span>
          </div>
        </div>

        {/* Huge Bold Live Timer / Clock (Center of Green Card) */}
        <div style={{ textAlign: 'center', margin: '0.85rem 0' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.85,
              fontWeight: 700,
              marginBottom: '0.2rem',
            }}
          >
            {todayAttendance?.status === 'CLOCKED_IN'
              ? 'Clocked In'
              : todayAttendance
              ? 'Total Durasi Kerja'
              : 'Waktu Presensi (Live)'}
          </div>
          <div
            style={{
              fontSize: '2.35rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.1,
              textShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            {todayAttendance?.status === 'CLOCKED_IN' || todayAttendance?.clockOut ? elapsedTime : currentTime}
          </div>
        </div>

        {/* GPS Sensor Strip inside Green Card */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '10px',
            padding: '0.4rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
            <MapPin size={13} style={{ flexShrink: 0, color: '#86efac' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', opacity: 0.95 }}>
              {location || (isLocating ? 'Mendeteksi sinyal GPS...' : 'Menunggu sensor GPS...')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            {location && (
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {showMap ? 'Tutup Peta' : 'Peta'}
              </button>
            )}
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: isLocating ? 'not-allowed' : 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
              title="Refresh sensor GPS"
            >
              <RefreshCw size={12} className={isLocating ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* Collapsible Google Map Inside Green Card */}
        {showMap && (
          <div style={{ marginTop: '0.65rem', borderRadius: '8px', overflow: 'hidden' }}>
            <GoogleMapPreview
              lat={coordinates?.lat}
              lng={coordinates?.lng}
              locationString={location}
              height="125px"
            />
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.875rem',
            borderRadius: '10px',
            marginBottom: '0.85rem',
            background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
            color: feedback.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. CENTER SECTION: CIRCULAR SELFIE VERIFICATION & ACTION PILL BUTTONS */}
      <div
        className="card"
        style={{
          borderRadius: '16px',
          padding: '1.25rem 1rem',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          marginBottom: '1rem',
          border: '1px solid var(--border)',
        }}
      >
        {!todayAttendance ? (
          /* CLOCK IN FORM */
          <form onSubmit={handleClockIn}>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#09090b' }}>
                Verifikasi Foto Wajah (Selfie)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.15rem' }}>
                Posisikan wajah Anda di dalam lingkaran untuk Clock In.
              </div>
            </div>

            {/* Circular Face Camera Viewfinder */}
            <CameraCapture
              variant="circular"
              title="Ambil Foto Selfie WFH"
              onCapture={(p) => setCapturedPhoto(p)}
            />

            {/* Work Notes Input Field */}
            <div style={{ margin: '0.85rem 0 1rem 0' }}>
              <input
                type="text"
                className="form-control"
                style={{
                  height: '42px',
                  borderRadius: '9999px',
                  padding: '0 1.15rem',
                  fontSize: '0.8125rem',
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
                placeholder="Rencana tugas hari ini (opsional)..."
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
              />
            </div>

            {/* Big Dexa Red Pill Action Button */}
            <button
              type="submit"
              disabled={submitting || isLocating || !location}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #8B1816 0%, #B12523 55%, #C62828 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                boxShadow: '0 4px 16px rgba(177, 37, 35, 0.38)',
                cursor: submitting || isLocating || !location ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: (!location || (!capturedPhoto.base64 && !capturedPhoto.file)) ? 0.75 : 1,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {submitting ? 'Memproses Presensi...' : 'Clock In'}
              <ArrowRight size={17} />
            </button>
          </form>
        ) : todayAttendance.status === 'CLOCKED_IN' ? (
          /* CLOCK OUT FORM */
          <form onSubmit={handleClockOut}>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#09090b' }}>
                Foto Bukti Selesai Kerja
              </div>
              <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.15rem' }}>
                Ambil foto bukti sebelum melakukan Clock Out.
              </div>
            </div>

            {/* Circular Face Camera Viewfinder */}
            <CameraCapture
              variant="circular"
              title="Foto Bukti Pulang"
              onCapture={(p) => setCapturedPhoto(p)}
            />

            {/* Single line notes */}
            <div style={{ margin: '0.85rem 0 1rem 0' }}>
              <input
                type="text"
                className="form-control"
                style={{
                  height: '42px',
                  borderRadius: '9999px',
                  padding: '0 1.15rem',
                  fontSize: '0.8125rem',
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
                placeholder="Ringkasan tugas selesai hari ini..."
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
              />
            </div>

            {/* Pill Action Buttons (Coral Red Clock Out like in the reference image!) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="submit"
                disabled={submitting || isLocating || !location}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  cursor: submitting || isLocating || !location ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: (!location || (!capturedPhoto.base64 && !capturedPhoto.file)) ? 0.75 : 1,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {submitting ? 'Memproses Clock-Out...' : 'Clock Out'}
                <CheckCircle2 size={17} />
              </button>
            </div>
          </form>
        ) : (
          /* COMPLETED TODAY */
          <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--success-bg)',
                color: 'var(--success-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem',
                border: '2px solid var(--success-border)',
              }}
            >
              <CheckCircle2 size={30} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#09090b', marginBottom: '0.2rem' }}>
              Presensi Hari Ini Lengkap
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', maxWidth: '280px', margin: '0 auto' }}>
              Jam masuk dan pulang telah terekam akurat di sistem timesheet.
            </p>
          </div>
        )}
      </div>

      {/* 3. BOTTOM TIMESHEET & PUNCHES CARD (Exact match of the bottom half of the phone in reference image!) */}
      <div
        className="card"
        style={{
          borderRadius: '16px',
          padding: '1.15rem',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Date Header Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#09090b' }}>
            {new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <div
              style={{
                background: '#f0fdf4',
                color: '#16a34a',
                border: '1px solid #bbf7d0',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 600,
              }}
            >
              Shift: {user?.workSchedule || '09:00 - 18:00'}
            </div>
          </div>
        </div>

        {/* Today's Punches Timeline */}
        {todayAttendance ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Clock In Punch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b', minWidth: '60px', fontFamily: 'var(--font-mono)' }}>
                {new Date(todayAttendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </div>

              {/* Circular selfie avatar */}
              <div
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #16a34a',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
                onClick={() => setLightboxData({ attendance: todayAttendance, type: 'clockIn' })}
                title="Klik untuk melihat foto"
              >
                <img
                  src={getImageUrl(todayAttendance.clockInPhoto)}
                  alt="Selfie Masuk"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#09090b' }}>
                  Clocked In
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  PT Dexa Medica • WFH • Via GPS Sensor
                </div>
                {todayAttendance.workNotes && (
                  <div style={{ fontSize: '0.6875rem', color: '#334155', marginTop: '0.2rem', fontStyle: 'italic' }}>
                    "{todayAttendance.workNotes}"
                  </div>
                )}
              </div>
            </div>

            {/* Clock Out Punch (if present) */}
            {todayAttendance.clockOut && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b', minWidth: '60px', fontFamily: 'var(--font-mono)' }}>
                  {new Date(todayAttendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>

                {/* Circular selfie avatar */}
                <div
                  style={{
                    position: 'relative',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid #ef4444',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => setLightboxData({ attendance: todayAttendance, type: 'clockOut' })}
                  title="Klik untuk melihat foto"
                >
                  <img
                    src={getImageUrl(todayAttendance.clockOutPhoto)}
                    alt="Selfie Pulang"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#09090b' }}>
                    Clocked Out
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Presensi Lengkap • WFH
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: '#94a3b8', fontSize: '0.75rem' }}>
            Belum ada catatan punch presensi hari ini. Silakan Clock In di atas.
          </div>
        )}

        {/* 3 Days History Preview */}
        {recentAttendances.length > 0 && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Riwayat Terakhir
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {recentAttendances.slice(0, 3).map((att) => (
                <div
                  key={att.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '8px',
                    background: '#f8fafc',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#334155' }}>{att.date}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '0.6875rem' }}>
                    {new Date(att.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {att.clockOut ? new Date(att.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Aktif'}
                  </span>
                  <StatusBadge status={att.status} type="attendance" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxData && (
        <ImageLightbox
          attendance={lightboxData.attendance}
          type={lightboxData.type}
          onClose={() => setLightboxData(null)}
        />
      )}

      {/* Location Permission Pop-up Modal */}
      <PermissionModal
        isOpen={isLocationModalOpen}
        type="location"
        onClose={() => setIsLocationModalOpen(false)}
        onRetry={() => {
          setIsLocationModalOpen(false);
          detectLocation();
        }}
      />
    </div>
  );
};
