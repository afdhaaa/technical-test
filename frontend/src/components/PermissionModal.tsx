import React, { useState, useEffect } from 'react';
import {
  Camera,
  MapPin,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from './Modal';

export interface PermissionModalProps {
  isOpen: boolean;
  type: 'camera' | 'location';
  onClose: () => void;
  onRetry: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  type,
  onClose,
  onRetry,
}) => {
  const isCamera = type === 'camera';
  const deviceName = isCamera ? 'Kamera (Webcam)' : 'Lokasi Presensi (GPS)';
  const title = isCamera ? 'Izin Akses Kamera Diperlukan' : 'Izin Akses Lokasi (GPS) Diperlukan';

  const [requesting, setRequesting] = useState<boolean>(false);
  const [blockedNotice, setBlockedNotice] = useState<boolean>(false);

  // Reset notice when modal is opened
  useEffect(() => {
    if (isOpen) {
      setBlockedNotice(false);
      setRequesting(false);
    }
  }, [isOpen, type]);

  const handleRequestPermission = async () => {
    setRequesting(true);
    setBlockedNotice(false);

    if (isCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        // Stop stream immediately after acquiring permission
        stream.getTracks().forEach((track) => track.stop());
        setRequesting(false);
        onRetry();
        onClose();
      } catch (err: any) {
        console.warn('Camera permission request error:', err);
        setRequesting(false);
        // If still blocked, browser suppresses prompt
        setBlockedNotice(true);
      }
    } else {
      if (!navigator.geolocation) {
        setRequesting(false);
        setBlockedNotice(true);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => {
          setRequesting(false);
          onRetry();
          onClose();
        },
        (err) => {
          console.warn('Geolocation permission error:', err);
          setRequesting(false);
          setBlockedNotice(true);
        },
        { timeout: 7000, enableHighAccuracy: true, maximumAge: 0 }
      );
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
          <ShieldAlert size={20} color="#ef4444" />
          <span>{title}</span>
        </div>
      }
      description={`Sistem presensi WFH Dexa memerlukan izin akses ${deviceName}.`}
      maxWidth="520px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Tutup
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReload}
            title="Muat ulang halaman browser"
          >
            <RotateCcw size={13} />
            Reload Halaman
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={requesting}
            onClick={handleRequestPermission}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={13} className={requesting ? 'spin' : ''} />
            {requesting ? 'Meminta Izin...' : 'Coba Minta Izin Lagi'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
        {/* Explanation why prompt didn't appear */}
        {blockedNotice ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              fontSize: '0.8125rem',
              color: '#991b1b',
              lineHeight: 1.45,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Mengapa pop-up browser belum keluar?</strong>
              <div style={{ marginTop: '0.25rem' }}>
                Browser Anda (Chrome/Edge/Safari) telah menyetel status <strong>"Diblokir (Block)"</strong> pada situs ini. Demi keamanan, browser <strong>tidak akan memunculkan pop-up izin otomatis</strong> sebelum Anda meresetnya dari bilah alamat URL di atas.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              fontSize: '0.8125rem',
              color: 'var(--warning-text)',
              lineHeight: 1.45,
            }}
          >
            <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              Browser mendeteksi izin <strong>{deviceName}</strong> belum diaktifkan. Ikuti panduan visual di bawah ini untuk membuka akses.
            </div>
          </div>
        )}

        {/* Visual Browser Address Bar Mockup */}
        <div
          style={{
            background: '#f4f4f5',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.875rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Simulasi Letak Pengaturan pada Browser:
          </div>

          {/* Browser Address Bar Illustration */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #d4d4d8',
              borderRadius: '6px',
              padding: '0.4rem 0.625rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: '#18181b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: '#dbeafe',
                color: '#1e40af',
                padding: '0.2rem 0.45rem',
                borderRadius: '4px',
                fontWeight: 600,
                border: '1px solid #bfdbfe',
              }}
              title="Klik di sini pada address bar browser Anda!"
            >
              <SlidersHorizontal size={12} />
              <span>KLIK DI SINI 🔒</span>
            </div>
            <span style={{ color: '#71717a', fontFamily: 'monospace' }}>http://localhost:5173</span>
          </div>

          {/* Mock Dropdown */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              marginTop: '0.5rem',
              padding: '0.625rem 0.75rem',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#27272a', fontWeight: isCamera ? 700 : 500 }}>
                <Camera size={13} color={isCamera ? '#2563eb' : '#71717a'} />
                <span>Kamera:</span>
              </span>
              <span style={{ color: isCamera ? '#16a34a' : '#71717a', fontWeight: 600, background: isCamera ? '#dcfce7' : '#f4f4f5', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                Ubah ke "Izinkan / Allow"
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f4f4f5', paddingTop: '0.35rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#27272a', fontWeight: !isCamera ? 700 : 500 }}>
                <MapPin size={13} color={!isCamera ? '#2563eb' : '#71717a'} />
                <span>Lokasi (GPS):</span>
              </span>
              <span style={{ color: !isCamera ? '#16a34a' : '#71717a', fontWeight: 600, background: !isCamera ? '#dcfce7' : '#f4f4f5', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                Ubah ke "Izinkan / Allow"
              </span>
            </div>
          </div>
        </div>

        {/* Action Steps */}
        <div style={{ fontSize: '0.75rem', color: '#52525b', lineHeight: 1.5 }}>
          <strong>Langkah Cepat:</strong>
          <ol style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>
              Klik ikon <strong>Gembok (🔒)</strong> atau <strong>Setelan Situs</strong> di sebelah kiri alamat URL browser.
            </li>
            <li>
              Ubah izin <strong>{deviceName}</strong> menjadi <strong>"Izinkan / Allow"</strong>.
            </li>
            <li>
              Klik tombol <strong>"Reload Halaman"</strong> atau <strong>"Coba Minta Izin Lagi"</strong> di bawah.
            </li>
          </ol>
        </div>
      </div>
    </Modal>
  );
};
