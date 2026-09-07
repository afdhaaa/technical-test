import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Clock,
  History,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { User, Role, EmployeeStatus, EmployeeAuditLog } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';

export const AdminEmployees: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<User | null>(null);
  const [auditEmployee, setAuditEmployee] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<EmployeeAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    email: '',
    password: '',
    position: '',
    department: 'Information Technology',
    phoneNumber: '',
    workSchedule: '09:00 - 18:00 (Reguler)',
    role: 'EMPLOYEE' as Role,
    status: 'ACTIVE' as EmployeeStatus,
  });

  const departmentList = [
    'Information Technology',
    'Human Resources',
    'Product Management',
    'Marketing',
    'Finance & Accounting',
    'Operations',
  ];

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/employees', {
        params: { department: selectedDept },
      });
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDept]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      nik: `EMP-00${employees.length + 1}`,
      name: '',
      email: '',
      password: 'password123',
      position: '',
      department: 'Information Technology',
      phoneNumber: '',
      workSchedule: '09:00 - 18:00 (Reguler)',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (emp: User) => {
    setEditingEmployee(emp);
    setFormData({
      nik: emp.nik,
      name: emp.name,
      email: emp.email,
      password: '',
      position: emp.position,
      department: emp.department,
      phoneNumber: emp.phoneNumber || '',
      workSchedule: emp.workSchedule || '09:00 - 18:00 (Reguler)',
      role: emp.role,
      status: emp.status,
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (emp: User) => {
    setDeletingEmployee(emp);
    setIsDeleteModalOpen(true);
  };

  const openAuditModal = async (emp: User) => {
    setAuditEmployee(emp);
    setIsAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const res = await apiClient.get(`/api/employees/${emp.id}/audit-logs`);
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password;

        const res = await apiClient.put(`/api/employees/${editingEmployee.id}`, payload);
        if (res.data?.success) {
          setFeedback({ type: 'success', message: 'Data karyawan berhasil diperbarui' });
          setIsFormModalOpen(false);
          await fetchEmployees();
        } else {
          setFeedback({ type: 'error', message: res.data?.message || 'Gagal mengupdate karyawan' });
        }
      } else {
        const res = await apiClient.post('/api/employees', formData);
        if (res.data?.success) {
          setFeedback({ type: 'success', message: 'Karyawan baru berhasil ditambahkan' });
          setIsFormModalOpen(false);
          await fetchEmployees();
        } else {
          setFeedback({ type: 'error', message: res.data?.message || 'Gagal menambahkan karyawan' });
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data karyawan',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    try {
      const res = await apiClient.delete(`/api/employees/${deletingEmployee.id}`);
      if (res.data?.success) {
        setFeedback({ type: 'success', message: 'Data karyawan berhasil dihapus' });
        setIsDeleteModalOpen(false);
        setDeletingEmployee(null);
        await fetchEmployees();
      } else {
        setFeedback({ type: 'error', message: res.data?.message || 'Gagal menghapus karyawan' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Terjadi kesalahan saat menghapus karyawan',
      });
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      title: 'Karyawan',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#e4e4e7',
              color: '#18181b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          >
            {item.name.charAt(0).toUpperCase()}
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
              {item.name}
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
              {item.email}
            </div>
          </div>
        </div>
      ),
      width: '22%',
    },
    {
      key: 'nik',
      title: 'NIK',
      render: (item) => (
        <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
          {item.nik}
        </span>
      ),
      width: '11%',
    },
    {
      key: 'department',
      title: 'Departemen & Jabatan',
      render: (item) => (
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              fontWeight: 500,
              color: '#09090b',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.department}
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
            {item.position}
          </div>
        </div>
      ),
      width: '18%',
    },
    {
      key: 'workSchedule',
      title: 'Jadwal Kerja',
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
      width: '17%',
    },
    {
      key: 'status',
      title: 'Role & Status',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <StatusBadge status={item.status} type="employee" />
          <StatusBadge status={item.role} type="role" />
        </div>
      ),
      width: '14%',
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => openEditModal(item)}
            style={{ height: '26px', padding: '0 0.4rem', fontSize: '0.6875rem' }}
            title="Edit Karyawan"
          >
            <Edit2 size={11} /> Edit
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => openAuditModal(item)}
            style={{
              height: '26px',
              padding: '0 0.4rem',
              fontSize: '0.6875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              color: '#334155',
              background: '#f8fafc',
            }}
            title="Lihat Riwayat Perubahan Data"
          >
            <History size={11} /> Log
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => openDeleteModal(item)}
            style={{ height: '26px', padding: '0 0.35rem', color: '#dc2626' }}
            title="Hapus Karyawan"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ),
      width: '18%',
    },
  ];

  const renderMobileCard = (item: User) => (
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
      {/* Card Header: Avatar, Name, NIK, Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8125rem',
              color: '#B12523',
              flexShrink: 0,
            }}
          >
            {item.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
              {item.nik} • {item.email}
            </div>
          </div>
        </div>
        <StatusBadge status={item.status} type="employee" />
      </div>

      {/* Details Grid: Department, Role & Shift */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          padding: '0.5rem 0.65rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #f1f5f9',
          fontSize: '0.75rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.625rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase' }}>Departemen</div>
          <div style={{ fontWeight: 600, color: '#09090b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.department}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#52525b' }}>{item.position}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.625rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase' }}>Jadwal Shift</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#09090b', fontWeight: 500, fontSize: '0.6875rem', marginTop: '2px' }}>
            <Clock size={11} color="#71717a" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.workSchedule || '09:00 - 18:00 (Reguler)'}
            </span>
          </div>
          <div style={{ marginTop: '4px' }}>
            <StatusBadge status={item.role} type="role" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', paddingTop: '0.2rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => openEditModal(item)}
          style={{ height: '28px', padding: '0 0.65rem', fontSize: '0.75rem' }}
        >
          <Edit2 size={12} /> Edit
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => openAuditModal(item)}
          style={{ height: '28px', padding: '0 0.65rem', fontSize: '0.75rem' }}
        >
          <History size={12} /> Log
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => openDeleteModal(item)}
          style={{ height: '28px', padding: '0 0.5rem', color: '#dc2626' }}
          title="Hapus Karyawan"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Title & Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#09090b', letterSpacing: '-0.01em' }}>
            Direktori & Master Data Karyawan
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
            Kelola data master seluruh karyawan (CRUD) dan konfigurasi hak akses akun.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Department Filter */}
          <select
            className="form-control"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ width: 'auto', height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="ALL">Semua Departemen</option>
            {departmentList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            <UserPlus size={15} /> Tambah Karyawan Baru
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={employees}
        searchPlaceholder="Cari nama, NIK, atau email..."
        emptyMessage="Belum ada data karyawan"
        mobileCardRender={renderMobileCard}
      />

      {/* Form Modal (Create / Edit) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
        description={
          editingEmployee
            ? 'Perbarui informasi dan role akses karyawan terpilih.'
            : 'Masukkan rincian data karyawan baru ke dalam database.'
        }
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              form="employee-form"
              className="btn btn-primary"
            >
              {editingEmployee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </button>
          </>
        }
      >
        <form id="employee-form" onSubmit={handleSaveEmployee}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">Nomor Induk Karyawan (NIK)</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                placeholder="EMP-005"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama Karyawan"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">Alamat Email Perusahaan</label>
              <input
                type="email"
                className="form-control"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@dexa.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {editingEmployee ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi Awal'}
              </label>
              <input
                type="password"
                className="form-control"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingEmployee ? 'Biarkan kosong jika tidak diubah' : 'Default: password123'}
                required={!editingEmployee}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">Departemen</label>
              <select
                className="form-control"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                {departmentList.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jabatan / Posisi</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Contoh: Backend Engineer"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">No. Telepon</label>
              <input
                type="text"
                className="form-control"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="0812xxxxxxx"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jadwal Kerja (Work Schedule)</label>
              <select
                className="form-control"
                value={formData.workSchedule}
                onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })}
              >
                <option value="09:00 - 18:00 (Reguler)">09:00 - 18:00 (Reguler)</option>
                <option value="08:00 - 17:00 (Shift Pagi)">08:00 - 17:00 (Shift Pagi)</option>
                <option value="13:00 - 22:00 (Shift Siang)">13:00 - 22:00 (Shift Siang)</option>
                <option value="Flexible (09:00 - 18:00)">Flexible (09:00 - 18:00)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">Role Akses</label>
              <select
                className="form-control"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              >
                <option value="EMPLOYEE">Karyawan</option>
                <option value="ADMIN_HRD">HR Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status Akun</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Non-Aktif</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Karyawan"
        description="Tindakan ini akan menghapus akun dan data karyawan dari sistem."
        maxWidth="420px"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
            >
              Ya, Hapus
            </button>
          </>
        }
      >
        <p style={{ fontSize: '0.8125rem', color: '#52525b', lineHeight: 1.5 }}>
          Apakah Anda yakin ingin menghapus{' '}
          <strong style={{ color: '#09090b' }}>{deletingEmployee?.name}</strong> (NIK:{' '}
          {deletingEmployee?.nik})?
        </p>
      </Modal>

      {/* Audit Log Modal */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Riwayat Perubahan Data Karyawan"
        description={
          auditEmployee
            ? `Jejak audit pembaruan profil untuk ${auditEmployee.name} (NIK: ${auditEmployee.nik})`
            : 'Jejak audit pembaruan profil karyawan'
        }
        maxWidth="680px"
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsAuditModalOpen(false)}
          >
            Tutup
          </button>
        }
      >
        {auditEmployee && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              background: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#09090b', fontSize: '0.8125rem' }}>
                {auditEmployee.name}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                {auditEmployee.position} • {auditEmployee.department}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                className="tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 600, color: '#334155' }}
              >
                NIK: {auditEmployee.nik}
              </span>
              <div style={{ marginTop: '0.15rem' }}>
                <StatusBadge status={auditEmployee.status} type="employee" />
              </div>
            </div>
          </div>
        )}

        {auditLoading ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
            Memuat riwayat perubahan...
          </div>
        ) : auditLogs.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: '#64748b',
              background: '#fafafa',
              borderRadius: '6px',
              border: '1px dashed #e4e4e7',
            }}
          >
            <History size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#18181b', margin: '0 0 0.25rem' }}>
              Belum Ada Riwayat Perubahan
            </p>
            <p style={{ fontSize: '0.75rem', margin: 0, color: '#71717a' }}>
              Setiap kali data karyawan ini diperbarui oleh HR Admin, rincian perubahannya akan otomatis dicatat di sini.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              maxHeight: '440px',
              overflowY: 'auto',
              paddingRight: '0.25rem',
            }}
          >
            {auditLogs.map((log) => {
              const isCreate = log.action === 'CREATE';
              const isStatus = log.action === 'STATUS_CHANGE';
              const isDelete = log.action === 'DELETE';

              let badgeBg = '#eff6ff';
              let badgeColor = '#1d4ed8';
              let badgeBorder = '#bfdbfe';
              if (isCreate) {
                badgeBg = '#f0fdf4';
                badgeColor = '#15803d';
                badgeBorder = '#bbf7d0';
              } else if (isStatus) {
                badgeBg = '#faf5ff';
                badgeColor = '#7e22ce';
                badgeBorder = '#e9d5ff';
              } else if (isDelete) {
                badgeBg = '#fef2f2';
                badgeColor = '#b91c1c';
                badgeBorder = '#fecaca';
              }

              return (
                <div
                  key={log.id}
                  style={{
                    border: '1px solid #e4e4e7',
                    borderRadius: '6px',
                    padding: '0.75rem 0.85rem',
                    background: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          background: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`,
                        }}
                      >
                        {log.actionLabel || log.action}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                        Oleh <strong style={{ color: '#27272a', fontWeight: 500 }}>{log.changedByName || 'Admin HRD'}</strong>
                      </span>
                    </div>
                    <span
                      className="tabular-nums"
                      style={{ fontSize: '0.6875rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}
                    >
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {log.changes && log.changes.length > 0 && (
                    <div
                      style={{
                        marginTop: '0.45rem',
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        borderRadius: '4px',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <table
                        style={{
                          width: '100%',
                          minWidth: '280px',
                          borderCollapse: 'collapse',
                          fontSize: '0.6875rem',
                        }}
                      >
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'left', width: '28%', fontWeight: 600 }}>
                              Atribut
                            </th>
                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'left', width: '36%', fontWeight: 600 }}>
                              Sebelumnya
                            </th>
                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'left', width: '36%', fontWeight: 600 }}>
                              Menjadi
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {log.changes.map((c, idx) => (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: idx === log.changes!.length - 1 ? 'none' : '1px solid #f1f5f9',
                              }}
                            >
                              <td style={{ padding: '0.35rem 0.5rem', fontWeight: 500, color: '#334155' }}>
                                {c.fieldLabel || c.field}
                              </td>
                              <td style={{ padding: '0.35rem 0.5rem', color: '#dc2626' }}>
                                <span
                                  style={{
                                    background: '#fef2f2',
                                    padding: '0.1rem 0.3rem',
                                    borderRadius: '3px',
                                    textDecoration: c.oldValue ? 'line-through' : 'none',
                                    display: 'inline-block',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {c.oldValue !== null && c.oldValue !== undefined && c.oldValue !== ''
                                    ? String(c.oldValue)
                                    : '-'}
                                </span>
                              </td>
                              <td style={{ padding: '0.35rem 0.5rem', color: '#16a34a' }}>
                                <span
                                  style={{
                                    background: '#f0fdf4',
                                    padding: '0.1rem 0.3rem',
                                    borderRadius: '3px',
                                    fontWeight: 600,
                                    display: 'inline-block',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {c.newValue !== null && c.newValue !== undefined && c.newValue !== ''
                                    ? String(c.newValue)
                                    : '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {log.notes && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.6875rem', color: '#71717a', fontStyle: 'italic' }}>
                      Catatan: {log.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};
