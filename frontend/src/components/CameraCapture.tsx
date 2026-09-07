import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Video, ShieldAlert } from 'lucide-react';
import { PermissionModal } from './PermissionModal';

interface CameraCaptureProps {
  onCapture: (base64OrFile: { base64?: string; file?: File }) => void;
  title?: string;
  previewUrl?: string;
  variant?: 'default' | 'circular';
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  title = 'Verifikasi Foto Bukti WFH',
  previewUrl,
  variant = 'default',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(previewUrl || null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(true);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState<boolean>(false);

  // Helper to connect stream directly to video element
  const attachStreamToVideo = useCallback((videoEl: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
    if (!videoEl || !mediaStream) return;
    try {
      videoEl.srcObject = mediaStream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('autoplay', 'true');
      videoEl.play().catch((err) => {
        console.warn('Video play catch:', err);
      });
    } catch (e) {
      console.error('attachStreamToVideo error:', e);
    }
  }, []);

  // Stop camera stream tracks
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsStarting(false);
  }, [stream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Start webcam
  const startCamera = async () => {
    setCameraError(null);
    setIsStarting(true);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Akses webcam browser tidak didukung pada protokol ini. Silakan gunakan browser modern atau "Gunakan Foto Simulasi WFH".',
      );
      setIsStarting(false);
      return;
    }

    try {
      let mediaStream: MediaStream;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: isFrontCamera ? 'user' : 'environment',
          },
          audio: false,
        });
      } catch (e) {
        // Fallback to basic constraint
        console.warn('Fallback to basic video constraint:', e);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
      setCameraActive(true);
      setIsStarting(false);

      // Attach immediately to video element
      if (videoRef.current) {
        attachStreamToVideo(videoRef.current, mediaStream);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsStarting(false);
      setCameraActive(false);

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.toLowerCase().includes('permission') ||
        err.message?.toLowerCase().includes('denied')
      ) {
        setIsPermissionModalOpen(true);
        setCameraError(
          'Izin kamera diblokir oleh browser. Klik tombol di bawah untuk panduan mengaktifkan kembali izin kamera.',
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(
          'Kamera tidak terdeteksi pada perangkat Anda. Silakan periksa webcam atau gunakan opsi "Simulasi Foto WFH".',
        );
      } else {
        setCameraError(
          `Gagal mengakses kamera: ${err.message || err.name}. Pastikan izin kamera telah diberikan di browser.`,
        );
      }
    }
  };

  // Capture frame from video to canvas
  const snapPhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isFrontCamera) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedImage(dataUrl);
    stopCamera();
    onCapture({ base64: dataUrl });
  };

  // Generate realistic simulated photo if webcam is unavailable
  const generateSimulatedPhoto = () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient (office / home ambient)
    const gradient = ctx.createLinearGradient(0, 0, 640, 480);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 640, 480);

    // Decorative ambient grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 0; y < 480; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Avatar silhouette
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(320, 190, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(320, 390, 150, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // WFH Badge Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 380, 560, 70, 8);
    ctx.fill();
    ctx.stroke();

    // Timestamp & Watermark
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('VERIFIKASI PRESENSI WFH • PT DEXA MEDICA', 60, 410);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px monospace';
    const nowStr = new Date().toLocaleString('id-ID');
    ctx.fillText(`WAKTU SERVER: ${nowStr} WIB  |  LOKASI: HOME OFFICE`, 60, 432);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
    onCapture({ base64: dataUrl });
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    onCapture({});
    startCamera();
  };

  if (variant === 'circular') {
    return (
      <div style={{ textAlign: 'center', margin: '0.75rem 0' }}>
        {/* Error Alert */}
        {cameraError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              color: 'var(--warning-text)',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              marginBottom: '0.75rem',
              textAlign: 'left',
              lineHeight: 1.3,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div>{cameraError}</div>
              <button
                type="button"
                onClick={() => setIsPermissionModalOpen(true)}
                style={{
                  marginTop: '0.25rem',
                  background: '#b45309',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <ShieldAlert size={12} /> Buka Panduan Izin
              </button>
            </div>
          </div>
        )}

        {/* Circular Frame */}
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
          {capturedImage ? (
            /* 1. Captured Photo */
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #ffffff',
                outline: '3px solid #22c55e',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                position: 'relative',
              }}
            >
              <img
                src={capturedImage}
                alt="Bukti Selfie WFH"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#18181b',
                  color: '#ffffff',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                <CheckCircle2 size={11} color="#22c55e" /> Terverifikasi
              </div>
            </div>
          ) : cameraActive ? (
            /* 2. Active Video Stream */
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #ffffff',
                outline: '3px solid #B12523',
                boxShadow: '0 8px 24px rgba(177, 37, 35, 0.3)',
                position: 'relative',
                background: '#09090b',
              }}
            >
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && stream) attachStreamToVideo(el, stream);
                }}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transform: isFrontCamera ? 'scaleX(-1)' : 'none',
                }}
              />
              {/* Inner Face Guide */}
              <div
                style={{
                  position: 'absolute',
                  inset: '18px',
                  border: '1.5px dashed rgba(255, 255, 255, 0.65)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: '#fff', fontSize: '0.625rem', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>
                  Wajah di sini
                </span>
              </div>
            </div>
          ) : (
            /* 3. Standby Circular Placeholder */
            <div
              onClick={startCamera}
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                border: '4px solid #ffffff',
                outline: '2px dashed #94a3b8',
                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isStarting ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Klik untuk membuka kamera selfie"
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  marginBottom: '0.4rem',
                }}
              >
                <Camera size={26} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                {isStarting ? 'Membuka...' : 'Ketuk untuk Selfie'}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.1rem' }}>
                Kamera HP / Webcam
              </span>
            </div>
          )}
        </div>

        {/* Buttons Underneath Circular Frame */}
        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          {capturedImage ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={retakePhoto}
              style={{ height: '32px', borderRadius: '9999px', padding: '0 0.85rem', fontSize: '0.75rem' }}
            >
              <RefreshCw size={12} /> Ambil Ulang Foto
            </button>
          ) : cameraActive ? (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={snapPhoto}
                style={{ height: '34px', borderRadius: '9999px', padding: '0 0.95rem', fontSize: '0.75rem', background: '#B12523', border: 'none' }}
              >
                <Camera size={13} /> Jepret Foto
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsFrontCamera(!isFrontCamera);
                  setTimeout(() => startCamera(), 100);
                }}
                style={{ height: '34px', borderRadius: '9999px', padding: '0 0.65rem', fontSize: '0.75rem' }}
                title="Putar Kamera Depan/Belakang"
              >
                <RefreshCw size={12} />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={stopCamera}
                style={{ height: '34px', borderRadius: '9999px', padding: '0 0.75rem', fontSize: '0.75rem' }}
              >
                Batal
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={startCamera}
                disabled={isStarting}
                style={{ height: '34px', borderRadius: '9999px', padding: '0 1.15rem', fontSize: '0.75rem', background: '#16a34a', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Camera size={13} />
                <span>{isStarting ? 'Membuka Kamera...' : 'Buka Kamera Selfie'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={generateSimulatedPhoto}
                style={{ height: '34px', borderRadius: '9999px', padding: '0 0.85rem', fontSize: '0.75rem' }}
                title="Gunakan simulasi jika webcam perangkat tidak tersedia"
              >
                <Sparkles size={12} color="#0284c7" /> Simulasi
              </button>
            </div>
          )}
        </div>

        {/* Hidden canvas for taking snapshot */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Permission Pop-up Modal */}
        <PermissionModal
          isOpen={isPermissionModalOpen}
          type="camera"
          onClose={() => setIsPermissionModalOpen(false)}
          onRetry={() => {
            setIsPermissionModalOpen(false);
            startCamera();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="camera-capture-box"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        backgroundColor: '#fafafa',
        textAlign: 'center',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.8125rem', color: '#18181b' }}>
          <Camera size={15} />
          <span>{title}</span>
        </div>
        {cameraActive && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.6875rem', height: '28px', padding: '0 0.5rem' }}
            onClick={() => {
              setIsFrontCamera(!isFrontCamera);
              setTimeout(() => startCamera(), 100);
            }}
          >
            <RefreshCw size={11} /> Putar Kamera
          </button>
        )}
      </div>

      {/* Error Alert */}
      {cameraError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
            background: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            color: 'var(--warning-text)',
            padding: '0.625rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            marginBottom: '0.75rem',
            textAlign: 'left',
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div>{cameraError}</div>
            <button
              type="button"
              onClick={() => setIsPermissionModalOpen(true)}
              style={{
                marginTop: '0.35rem',
                background: '#b45309',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.6875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <ShieldAlert size={12} />
              Buka Panduan Izin Kamera
            </button>
          </div>
        </div>
      )}

      {/* 1. Captured Photo Preview */}
      {capturedImage ? (
        <div>
          <div
            className="camera-preview-box"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '340px',
              margin: '0 auto',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <img
              src={capturedImage}
              alt="Bukti Foto WFH"
              className="camera-preview-img"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '180px', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                background: '#18181b',
                color: '#ffffff',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.65rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <CheckCircle2 size={11} color="#22c55e" /> Foto Terpilih
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', height: '30px' }}
              onClick={retakePhoto}
            >
              <RefreshCw size={12} /> Ambil Ulang Foto
            </button>
          </div>
        </div>
      ) : (
        /* 2. Camera Viewfinder or Standby */
        <div>
          {/* Always-mounted Video Viewfinder (Shown when active) */}
          <div
            className="camera-video-box"
            style={{
              display: cameraActive ? 'block' : 'none',
              position: 'relative',
              width: '100%',
              maxWidth: '340px',
              height: '190px',
              margin: '0 auto',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              background: '#09090b',
            }}
          >
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && stream) {
                  attachStreamToVideo(el, stream);
                }
              }}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transform: isFrontCamera ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* Guideline Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: '14px',
                border: '1px dashed rgba(255, 255, 255, 0.45)',
                borderRadius: 'var(--radius-sm)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  background: 'rgba(0,0,0,0.65)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                Posisikan Wajah di Sini
              </span>
            </div>
          </div>

          {cameraActive ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.625rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ height: '34px', fontSize: '0.8125rem' }}
                onClick={snapPhoto}
              >
                <Camera size={14} /> Ambil Foto Sekarang
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ height: '34px', fontSize: '0.8125rem' }}
                onClick={stopCamera}
              >
                Tutup Kamera
              </button>
            </div>
          ) : (
            /* Standby options */
            <div className="camera-standby-wrap" style={{ padding: '0.25rem 0' }}>
              <p className="camera-standby-text" style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginBottom: '0.625rem' }}>
                Ambil foto selfie di ruang kerja WFH Anda secara langsung.
              </p>

              <div className="camera-actions-row">
                <button
                  type="button"
                  className="btn btn-primary camera-btn-main"
                  onClick={startCamera}
                  disabled={isStarting}
                  style={{ width: '100%', height: '38px', fontSize: '0.8125rem' }}
                >
                  <Video size={15} />
                  <span>{isStarting ? 'Membuka Kamera...' : 'Buka Kamera (Kamera HP / Webcam)'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={generateSimulatedPhoto}
                  title="Gunakan simulasi foto jika kamera tidak tersedia"
                  style={{ width: '100%', height: '34px', fontSize: '0.75rem' }}
                >
                  <Sparkles size={13} color="#0284c7" />
                  <span>Simulasi Foto WFH</span>
                </button>
              </div>

              <div className="camera-standby-tip" style={{ fontSize: '0.6875rem', color: '#a1a1aa', marginTop: '0.5rem' }}>
                💡 Jika webcam terhalang izin browser, Anda dapat menggunakan tombol <strong>Simulasi</strong>.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Permission Pop-up Modal */}
      <PermissionModal
        isOpen={isPermissionModalOpen}
        type="camera"
        onClose={() => setIsPermissionModalOpen(false)}
        onRetry={() => {
          setIsPermissionModalOpen(false);
          startCamera();
        }}
      />
    </div>
  );
};
