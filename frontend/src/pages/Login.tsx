import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Building2, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [emailOrNik, setEmailOrNik] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrNik || !password) {
      setError('Harap isi Email/NIK dan Password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(emailOrNik, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Kredensial tidak valid. Silakan coba kembali.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setEmailOrNik(email);
    setPassword(pass);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
        }}
      >
        {/* Brand Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.45rem 1.15rem',
              borderRadius: '8px',
              backgroundColor: '#B12523',
              color: '#ffffff',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '1.25rem',
              letterSpacing: '-0.03em',
              boxShadow: '0 4px 14px rgba(177, 37, 35, 0.35)',
              margin: '0 auto 0.85rem',
            }}
          >
            dexa group
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>
            HRIS Enterprise Portal
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '0.25rem' }}>
            PT Dexa Medica • Sistem Presensi & SDM
          </p>
        </div>

        {/* Login Card */}
        <div
          className="card"
          style={{
            padding: '1.75rem',
            backgroundColor: '#ffffff',
          }}
        >
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger-text)',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email atau NIK Karyawan</label>
              <input
                type="text"
                className="form-control"
                placeholder="nama@dexa.com atau NIK"
                value={emailOrNik}
                onChange={(e) => setEmailOrNik(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Kata Sandi</label>
              </div>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', height: '38px', fontSize: '0.8125rem' }}
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Portal'}
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Demo Fill */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#a1a1aa',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.625rem',
                textAlign: 'center',
              }}
            >
              Akun Pengujian Cepat
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%', padding: '0 0.625rem' }}
                onClick={() => handleQuickLogin('hrd@dexa.com', 'password123')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Shield size={13} color="#7c3aed" />
                  <span>HR Administrator: hrd@dexa.com</span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#71717a' }}>Pilih</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%', padding: '0 0.625rem' }}
                onClick={() => handleQuickLogin('budi@dexa.com', 'password123')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={13} color="#2563eb" />
                  <span>Karyawan (Budi): budi@dexa.com</span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#71717a' }}>Pilih</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#a1a1aa' }}>
          PT Dexa Medica • Enterprise Attendance System
        </div>
      </div>
    </div>
  );
};
