import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from './entities/employee.entity';
import { EmployeeAuditLog, AuditFieldChange } from './entities/employee-audit-log.entity';
import { Role, EmployeeStatus } from '../common/enums';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(EmployeeAuditLog)
    private readonly auditLogRepo: Repository<EmployeeAuditLog>,
  ) {}

  async validateUser(emailOrNik: string, passwordPlain: string) {
    const user = await this.employeeRepo.findOne({
      where: [{ email: emailOrNik }, { nik: emailOrNik }],
    });

    if (!user) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    if (user.status !== EmployeeStatus.ACTIVE) {
      return { success: false, message: 'Akun karyawan non-aktif' };
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password);
    if (!isMatch) {
      return { success: false, message: 'Password salah' };
    }

    const { password, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async getAll(params?: { search?: string; department?: string }) {
    const query = this.employeeRepo.createQueryBuilder('emp');

    if (params?.search) {
      query.andWhere(
        '(emp.name LIKE :search OR emp.nik LIKE :search OR emp.email LIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    if (params?.department && params.department !== 'ALL') {
      query.andWhere('emp.department = :dept', { dept: params.department });
    }

    query.orderBy('emp.id', 'DESC');
    const employees = await query.getMany();
    return employees.map(({ password, ...emp }) => emp);
  }

  async getById(id: number) {
    const user = await this.employeeRepo.findOne({ where: { id } });
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async create(data: Partial<Employee>, actorUser?: any) {
    const existing = await this.employeeRepo.findOne({
      where: [{ email: data.email }, { nik: data.nik }],
    });
    if (existing) {
      return { success: false, message: 'NIK atau Email sudah terdaftar' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password || 'password123', salt);

    const newEmployee = this.employeeRepo.create({
      ...data,
      password: hashedPassword,
      status: data.status || EmployeeStatus.ACTIVE,
      role: data.role || Role.EMPLOYEE,
      workSchedule: data.workSchedule || '09:00 - 18:00 (Reguler)',
    });

    const saved = await this.employeeRepo.save(newEmployee);

    // Record audit log for creation
    await this.auditLogRepo.save({
      employeeId: saved.id,
      action: 'CREATE',
      actionLabel: 'Penambahan Karyawan Baru',
      changedById: actorUser?.id || null,
      changedByName: actorUser?.name || 'Admin HRD',
      changedByEmail: actorUser?.email || null,
      changes: [
        { field: 'name', fieldLabel: 'Nama Lengkap', oldValue: null, newValue: saved.name },
        { field: 'nik', fieldLabel: 'NIK', oldValue: null, newValue: saved.nik },
        { field: 'email', fieldLabel: 'Email', oldValue: null, newValue: saved.email },
        { field: 'department', fieldLabel: 'Departemen', oldValue: null, newValue: saved.department },
        { field: 'position', fieldLabel: 'Jabatan', oldValue: null, newValue: saved.position },
        { field: 'workSchedule', fieldLabel: 'Jadwal Kerja', oldValue: null, newValue: saved.workSchedule },
        { field: 'role', fieldLabel: 'Hak Akses (Role)', oldValue: null, newValue: saved.role },
        { field: 'status', fieldLabel: 'Status Akun', oldValue: null, newValue: saved.status },
      ],
      notes: `Karyawan baru terdaftar di departemen ${saved.department}`,
    });

    const { password, ...safeUser } = saved;
    return { success: true, data: safeUser };
  }

  async update(id: number, data: Partial<Employee>, actorUser?: any) {
    const employee = await this.employeeRepo.findOne({ where: { id } });
    if (!employee) {
      return { success: false, message: 'Karyawan tidak ditemukan' };
    }

    if (data.email && data.email !== employee.email) {
      const emailExists = await this.employeeRepo.findOne({ where: { email: data.email } });
      if (emailExists) {
        return { success: false, message: 'Email sudah digunakan oleh karyawan lain' };
      }
    }

    if (data.nik && data.nik !== employee.nik) {
      const nikExists = await this.employeeRepo.findOne({ where: { nik: data.nik } });
      if (nikExists) {
        return { success: false, message: 'NIK sudah digunakan oleh karyawan lain' };
      }
    }

    const changes: AuditFieldChange[] = [];

    if (data.name !== undefined && data.name !== employee.name) {
      changes.push({ field: 'name', fieldLabel: 'Nama Lengkap', oldValue: employee.name, newValue: data.name });
      employee.name = data.name;
    }
    if (data.nik !== undefined && data.nik !== employee.nik) {
      changes.push({ field: 'nik', fieldLabel: 'NIK', oldValue: employee.nik, newValue: data.nik });
      employee.nik = data.nik;
    }
    if (data.email !== undefined && data.email !== employee.email) {
      changes.push({ field: 'email', fieldLabel: 'Email', oldValue: employee.email, newValue: data.email });
      employee.email = data.email;
    }
    if (data.position !== undefined && data.position !== employee.position) {
      changes.push({ field: 'position', fieldLabel: 'Jabatan', oldValue: employee.position, newValue: data.position });
      employee.position = data.position;
    }
    if (data.department !== undefined && data.department !== employee.department) {
      changes.push({ field: 'department', fieldLabel: 'Departemen', oldValue: employee.department, newValue: data.department });
      employee.department = data.department;
    }
    if (data.workSchedule !== undefined && data.workSchedule !== employee.workSchedule) {
      changes.push({ field: 'workSchedule', fieldLabel: 'Jadwal Kerja', oldValue: employee.workSchedule, newValue: data.workSchedule });
      employee.workSchedule = data.workSchedule;
    }
    if (data.phoneNumber !== undefined && (data.phoneNumber || '') !== (employee.phoneNumber || '')) {
      changes.push({ field: 'phoneNumber', fieldLabel: 'Nomor Telepon', oldValue: employee.phoneNumber || '-', newValue: data.phoneNumber || '-' });
      employee.phoneNumber = data.phoneNumber;
    }
    if (data.role !== undefined && data.role !== employee.role) {
      changes.push({ field: 'role', fieldLabel: 'Hak Akses (Role)', oldValue: employee.role, newValue: data.role });
      employee.role = data.role;
    }
    if (data.status !== undefined && data.status !== employee.status) {
      changes.push({ field: 'status', fieldLabel: 'Status Akun', oldValue: employee.status, newValue: data.status });
      employee.status = data.status;
    }
    if (data.password && data.password.trim() !== '') {
      changes.push({ field: 'password', fieldLabel: 'Kata Sandi', oldValue: '••••••••', newValue: '(Kata sandi diubah)' });
      const salt = await bcrypt.genSalt(10);
      employee.password = await bcrypt.hash(data.password, salt);
    }

    const updated = await this.employeeRepo.save(employee);

    if (changes.length > 0) {
      let action = 'UPDATE';
      let actionLabel = 'Pembaruan Data Karyawan';
      if (changes.length === 1 && changes[0].field === 'status') {
        action = 'STATUS_CHANGE';
        actionLabel = `Perubahan Status Akun (${changes[0].newValue})`;
      }

      await this.auditLogRepo.save({
        employeeId: id,
        action,
        actionLabel,
        changedById: actorUser?.id || null,
        changedByName: actorUser?.name || 'Admin HRD',
        changedByEmail: actorUser?.email || null,
        changes,
        notes: `Diperbarui oleh ${actorUser?.name || 'Admin HRD'}: ${changes.map((c) => c.fieldLabel).join(', ')}`,
      });
    }

    const { password, ...safeUser } = updated;
    return { success: true, data: safeUser };
  }

  async delete(id: number, actorUser?: any) {
    const employee = await this.employeeRepo.findOne({ where: { id } });
    if (!employee) {
      return { success: false, message: 'Karyawan tidak ditemukan' };
    }

    await this.auditLogRepo.save({
      employeeId: id,
      action: 'DELETE',
      actionLabel: 'Penghapusan Karyawan',
      changedById: actorUser?.id || null,
      changedByName: actorUser?.name || 'Admin HRD',
      changedByEmail: actorUser?.email || null,
      changes: [
        { field: 'employee', fieldLabel: 'Data Karyawan', oldValue: `${employee.name} (${employee.nik})`, newValue: null },
      ],
      notes: `Karyawan ${employee.name} (${employee.nik}) dihapus dari sistem`,
    });

    await this.employeeRepo.delete(id);
    return { success: true, message: 'Karyawan berhasil dihapus' };
  }

  async getAuditLogs(employeeId: number) {
    return this.auditLogRepo.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async getStats() {
    const total = await this.employeeRepo.count();
    const active = await this.employeeRepo.count({ where: { status: EmployeeStatus.ACTIVE } });
    const inactive = total - active;

    const departmentsRaw = await this.employeeRepo
      .createQueryBuilder('emp')
      .select('emp.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .groupBy('emp.department')
      .getRawMany();

    return { total, active, inactive, departments: departmentsRaw };
  }
}
