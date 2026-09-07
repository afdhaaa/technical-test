import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Building,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  MapPin,
  RotateCw,
} from 'lucide-react';
import { apiClient, getImageUrl } from '../api/client';
import { Attendance, DashboardStats } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { ImageLightbox } from '../components/ImageLightbox';
import { DurationBadge } from '../components/DurationBadge';
import { getTodayStr, formatDateID } from '../utils/date';

export const AdminMonitoring: React.FC = () => {
  const todayStr = getTodayStr();
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lightboxData, setLightboxData] = useState<{ attendance: Attendance; type: 'clockIn' | 'clockOut' } | null>(null);

  const departmentList = [
    'Information Technology',
    'Human Resources',
    'Product Management',
    'Marketing',
    'Finance & Accounting',
    'Operations',
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, statsRes] = await Promise.all([
        apiClient.get('/api/attendance/monitoring', {
          params: {
            date: todayStr,
            department: selectedDept !== 'ALL' ? selectedDept : undefined,
            status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          },
        }),
        apiClient.get('/api/attendance/dashboard-stats', {
          params: { date: todayStr },
        }),
      ]);

      setAttendances(attRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept, selectedStatus]);

  const columns: Column<Attendance>[] = [
    {
      key: 'employee',
      title: 'Karyawan',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B12523',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          >
            {item.employee?.name ? item.employee.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: '#09090b',
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.employee?.name || `Employee #${item.employeeId}`}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: '#71717a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.employee?.nik || '-'} • {item.employee?.department || '-'}
            </div>
          </div>
        </div>
      ),
      width: '23%',
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
            {item.workSchedule || item.employee?.workSchedule || '09:00 - 18:00 (Reguler)'}
          </span>
        </div>
      ),
      width: '14%',
    },
    {
      key: 'clockIn',
      title: 'Presensi Masuk',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          <div
            style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => setLightboxData({ attendance: item, type: 'clockIn' })}
            title="Klik untuk verifikasi foto masuk"
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
      width: '14%',
    },
    {
      key: 'clockOut',
      title: 'Presensi Pulang',
      render: (item) =>
        item.clockOut ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
            {item.clockOutPhoto && (
              <div
                style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setLightboxData({ attendance: item, type: 'clockOut' })}
                title="Klik untuk verifikasi foto pulang"
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
      width: '14%',
    },
    {
      key: 'duration',
      title: 'Durasi Kerja',
      render: (item) => (
        <DurationBadge clockIn={item.clockIn} clockOut={item.clockOut} />
      ),
      width: '15%',
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => <StatusBadge status={item.status} type="attendance" />,
      width: '11%',
    },
    {
      key: 'action',
      title: 'Audit',
      render: (item) => (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setLightboxData({ attendance: item, type: 'clockIn' })}
          style={{ height: '26px', padding: '0 0.5rem', fontSize: '0.6875rem' }}
          title="Verifikasi data dan bukti presensi"
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
      {/* Card Header: Employee info + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B12523',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          >
            {item.employee?.name ? item.employee.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.employee?.name || `Employee #${item.employeeId}`}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#71717a' }}>
              {item.employee?.nik || '-'} • {item.employee?.department || '-'}
            </div>
          </div>
        </div>
        <StatusBadge status={item.status} type="attendance" />
      </div>

      {/* Shift Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#52525b' }}>
        <Clock size={12} color="#71717a" />
        <span>Shift: <strong style={{ color: '#09090b' }}>{item.workSchedule || item.employee?.workSchedule || '09:00 - 18:00 (Reguler)'}</strong></span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          {item.clockInPhoto && (
            <img
              src={getImageUrl(item.clockInPhoto)}
              alt="Masuk"
              style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #22c55e', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => setLightboxData({ attendance: item, type: 'clockIn' })}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.625rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>Masuk</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b' }}>
              {new Date(item.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          {item.clockOut ? (
            <>
              {item.clockOutPhoto && (
                <img
                  src={getImageUrl(item.clockOutPhoto)}
                  alt="Pulang"
                  style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #ef4444', flexShrink: 0, cursor: 'pointer' }}
                  onClick={() => setLightboxData({ attendance: item, type: 'clockOut' })}
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
              Sedang bekerja...
            </div>
          )}
        </div>
      </div>

      {/* Prominent Duration Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.5rem', background: '#fafafa', borderRadius: '6px', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#71717a' }}>Durasi Kerja:</span>
        <DurationBadge clockIn={item.clockIn} clockOut={item.clockOut} />
      </div>

      {/* Card Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.2rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setLightboxData({ attendance: item, type: 'clockIn' })}
          style={{ height: '28px', padding: '0 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
        >
          <ShieldCheck size={13} color="#B12523" /> Detail & Foto Audit
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Title with Live Indicator & Refresh Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#09090b', letterSpacing: '-0.01em' }}>
              Monitoring Presensi Hari Ini
            </h1>
            <span
              style={{
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span
                style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}
                className="pulse-live"
              />
              Live Real-time
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
            Pantau kehadiran karyawan WFH khusus hari ini secara real-time. Untuk riwayat dan export, gunakan menu <strong>Laporan Presensi</strong>.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchData}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '32px' }}
        >
          <RotateCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard
          title="Total Karyawan Aktif"
          value={stats?.totalEmployees ?? 0}
          subtitle="Terdaftar di sistem"
          icon={Users}
        />
        <StatCard
          title="Presensi Masuk Hari Ini"
          value={stats?.presentToday ?? 0}
          subtitle="Tercatat clock-in"
          icon={UserCheck}
        />
        <StatCard
          title="Sedang Bekerja"
          value={stats?.currentlyWorking ?? 0}
          subtitle="Belum clock-out"
          icon={Clock}
        />
        <StatCard
          title="Selesai Bekerja"
          value={stats?.completedToday ?? 0}
          subtitle="Sudah clock-out"
          icon={CheckCircle}
        />
        <StatCard
          title="Tingkat Kehadiran"
          value={`${stats?.attendanceRate ?? 0}%`}
          subtitle="Rasio presensi"
          icon={TrendingUp}
        />
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Date Display (Today) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#f4f4f5',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid #e4e4e7',
          }}
        >
          <Calendar size={14} color="#71717a" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#18181b' }}>
            {formatDateID(new Date())}
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              backgroundColor: '#e0e7ff',
              color: '#3730a3',
              padding: '0.1rem 0.35rem',
              borderRadius: '4px',
            }}
          >
            HARI INI
          </span>
        </div>

        {/* Department Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={15} color="#71717a" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#3f3f46' }}>Departemen:</span>
          <select
            className="form-control"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ width: 'auto', height: '32px', fontSize: '0.75rem' }}
          >
            <option value="ALL">Semua Departemen</option>
            {departmentList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#3f3f46' }}>Status:</span>
          <select
            className="form-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: 'auto', height: '32px', fontSize: '0.75rem' }}
          >
            <option value="ALL">Semua Status</option>
            <option value="CLOCKED_IN">Sedang WFH</option>
            <option value="CLOCKED_OUT">Selesai Bekerja</option>
          </select>
        </div>
      </div>

      {/* Monitoring Table */}
      <DataTable
        columns={columns}
        data={attendances}
        searchPlaceholder="Cari nama, NIK, atau catatan..."
        emptyMessage="Tidak ada catatan presensi yang sesuai dengan filter"
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
