import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Building,
  Clock,
  CheckCircle,
  TrendingUp,
  MapPin,
  ShieldCheck,
  RotateCw,
  Download,
  Filter,
  Users,
  Briefcase,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiClient, getImageUrl } from '../api/client';
import { Attendance } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { ImageLightbox } from '../components/ImageLightbox';
import { DurationBadge } from '../components/DurationBadge';
import { getTodayStr, getFirstDayOfMonthStr } from '../utils/date';

export const AdminReports: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(getFirstDayOfMonthStr());
  const [endDate, setEndDate] = useState<string>(getTodayStr());
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
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
      const res = await apiClient.get('/api/attendance/reports', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          department: selectedDept !== 'ALL' ? selectedDept : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        },
      });
      setAttendances(res.data || []);
    } catch (err) {
      console.error('Error fetching attendance reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedDept, selectedStatus]);

  // Presets
  const setPreset = (type: 'today' | 'last7' | 'thisMonth' | 'last30') => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'last7') {
      const past = new Date();
      past.setDate(today.getDate() - 6);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (type === 'thisMonth') {
      setStartDate(getFirstDayOfMonthStr());
      setEndDate(todayStr);
    } else if (type === 'last30') {
      const past = new Date();
      past.setDate(today.getDate() - 29);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    }
  };

  // Summary Metrics calculation for selected range
  const totalRecords = attendances.length;
  const completedRecords = attendances.filter((a) => a.status === 'CLOCKED_OUT').length;
  const workingRecords = totalRecords - completedRecords;

  let totalWorkMinutes = 0;
  let workCount = 0;
  attendances.forEach((a) => {
    if (a.clockIn && a.clockOut) {
      const diffMs = new Date(a.clockOut).getTime() - new Date(a.clockIn).getTime();
      if (diffMs > 0) {
        totalWorkMinutes += Math.round(diffMs / (1000 * 60));
        workCount++;
      }
    }
  });

  const totalWorkHours = (totalWorkMinutes / 60).toFixed(1);
  const avgWorkHours = workCount > 0 ? (totalWorkMinutes / workCount / 60).toFixed(1) : '0';

  // Excel Export Handler
  const handleExportExcel = () => {
    if (attendances.length === 0) {
      alert('Tidak ada data presensi untuk diekspor pada rentang tanggal yang dipilih.');
      return;
    }

    setExporting(true);
    try {
      const exportRows = attendances.map((item, index) => {
        let durationStr = '-';
        if (item.clockIn && item.clockOut) {
          const diffMs = new Date(item.clockOut).getTime() - new Date(item.clockIn).getTime();
          if (diffMs > 0) {
            const h = Math.floor(diffMs / (1000 * 60 * 60));
            const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            durationStr = `${h} jam ${m} menit`;
          }
        } else if (item.clockIn) {
          durationStr = 'Sedang Bekerja';
        }

        return {
          'No': index + 1,
          'Tanggal': item.date,
          'NIK Karyawan': item.employee?.nik || '-',
          'Nama Karyawan': item.employee?.name || `Employee #${item.employeeId}`,
          'Departemen': item.employee?.department || '-',
          'Jabatan': item.employee?.position || '-',
          'Jadwal Shift': item.workSchedule || item.employee?.workSchedule || '09:00 - 18:00 (Reguler)',
          'Jam Masuk (Clock In)': new Date(item.clockIn).toLocaleTimeString('id-ID'),
          'Lokasi Masuk (GPS)': item.clockInLocation || '-',
          'Jam Pulang (Clock Out)': item.clockOut ? new Date(item.clockOut).toLocaleTimeString('id-ID') : '-',
          'Lokasi Pulang (GPS)': item.clockOutLocation || '-',
          'Durasi Kerja': durationStr,
          'Status Presensi': item.status === 'CLOCKED_OUT' ? 'Selesai Bekerja' : 'Sedang WFH',
          'Catatan Kerja': item.workNotes || '-',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);

      // Auto column widths
      worksheet['!cols'] = [
        { wch: 6 },  // No
        { wch: 13 }, // Tanggal
        { wch: 14 }, // NIK
        { wch: 24 }, // Nama
        { wch: 22 }, // Departemen
        { wch: 20 }, // Jabatan
        { wch: 24 }, // Jadwal Shift
        { wch: 18 }, // Jam Masuk
        { wch: 30 }, // Lokasi Masuk
        { wch: 18 }, // Jam Pulang
        { wch: 30 }, // Lokasi Pulang
        { wch: 18 }, // Durasi
        { wch: 16 }, // Status
        { wch: 40 }, // Catatan
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Presensi WFH');

      const fileName = `Laporan_Presensi_Dexa_${startDate}_sampai_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Gagal mengekspor data ke Excel:', error);
      alert('Terjadi kesalahan saat memproses ekspor Excel.');
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<Attendance>[] = [
    {
      key: 'date',
      title: 'Tanggal',
      render: (item) => (
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div className="tabular-nums" style={{ fontWeight: 600, color: '#09090b', fontSize: '0.8125rem' }}>
            {item.date}
          </div>
        </div>
      ),
      width: '10%',
    },
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
      width: '21%',
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
      width: '13%',
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
        <DurationBadge clockIn={item.clockIn} clockOut={item.clockOut} status={item.status} />
      ),
      width: '15%',
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => <StatusBadge status={item.status} type="attendance" />,
      width: '10%',
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
      {/* Card Header: Employee info + Date & Status */}
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

      {/* Date & Shift Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#52525b', flexWrap: 'wrap', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={12} color="#71717a" />
          <strong style={{ color: '#09090b' }}>{item.date}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={12} color="#71717a" />
          <span>Shift: {item.workSchedule || '09:00 - 18:00 (Reguler)'}</span>
        </div>
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

        {/* Clock Out */}
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
        <DurationBadge clockIn={item.clockIn} clockOut={item.clockOut} status={item.status} />
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
      {/* Page Header with Export Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#09090b', letterSpacing: '-0.01em' }}>
              Laporan Presensi Karyawan WFH
            </h1>
            <span
              style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
              }}
            >
              {totalRecords} Data Ditemukan
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
            Rekapitulasi kehadiran kerja WFH dengan filter rentang tanggal, departemen, dan unduh berkas Excel resmi.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '36px' }}
          >
            <RotateCw size={14} className={loading ? 'spin' : ''} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleExportExcel}
            disabled={exporting || attendances.length === 0}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              height: '36px',
              padding: '0 1rem',
              borderRadius: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              cursor: attendances.length === 0 ? 'not-allowed' : 'pointer',
              opacity: attendances.length === 0 ? 0.6 : 1,
            }}
            title="Download laporan presensi dalam format spreadsheet Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} />
            <span>{exporting ? 'Mengekspor Excel...' : 'Export ke Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for the filtered date range */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard
          title="Total Rekor Presensi"
          value={totalRecords}
          subtitle={`Periode ${startDate} s/d ${endDate}`}
          icon={Users}
        />
        <StatCard
          title="Selesai Bekerja (Out)"
          value={completedRecords}
          subtitle={`${totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0}% penyelesaian`}
          icon={CheckCircle}
        />
        <StatCard
          title="Sedang Berjalan"
          value={workingRecords}
          subtitle="Belum melakukan clock-out"
          icon={Clock}
        />
        <StatCard
          title="Akumulasi Jam Kerja"
          value={`${totalWorkHours} Jam`}
          subtitle={`Rata-rata ${avgWorkHours} jam / hari`}
          icon={Briefcase}
        />
      </div>

      {/* Date Range & Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Presets Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#71717a' }}>Preset Tanggal:</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setPreset('today')}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: '28px' }}
          >
            Hari Ini
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setPreset('last7')}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: '28px' }}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setPreset('thisMonth')}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: '28px' }}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setPreset('last30')}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: '28px' }}
          >
            30 Hari Terakhir
          </button>
        </div>

        {/* Inputs Filter Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          {/* Start Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} color="#71717a" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#3f3f46' }}>Dari Tanggal:</span>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: 'auto', height: '32px', fontSize: '0.75rem' }}
            />
          </div>

          {/* End Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} color="#71717a" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#3f3f46' }}>Sampai Tanggal:</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: 'auto', height: '32px', fontSize: '0.75rem' }}
            />
          </div>

          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
      </div>

      {/* Reports Table */}
      <DataTable
        columns={columns}
        data={attendances}
        searchPlaceholder="Cari nama karyawan, NIK, catatan kerja..."
        emptyMessage="Tidak ada catatan presensi dalam rentang tanggal dan kriteria filter yang dipilih"
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
