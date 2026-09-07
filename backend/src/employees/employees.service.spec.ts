import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { EmployeeAuditLog } from './entities/employee-audit-log.entity';
import { Role, EmployeeStatus } from '../common/enums';

jest.mock('bcrypt');

describe('EmployeesService', () => {
  let service: EmployeesService;
  let employeeRepo: jest.Mocked<Partial<Repository<Employee>>>;
  let auditLogRepo: jest.Mocked<Partial<Repository<EmployeeAuditLog>>>;

  const mockEmployee: Employee = {
    id: 1,
    nik: 'EMP001',
    name: 'Budi Santoso',
    email: 'budi@dexagroup.com',
    password: '$2b$10$hashedpassword',
    role: Role.EMPLOYEE,
    position: 'Software Engineer',
    department: 'Technology',
    workSchedule: '09:00 - 18:00 (Reguler)',
    phoneNumber: '08123456789',
    status: EmployeeStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    attendances: [],
  };

  beforeEach(async () => {
    employeeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    auditLogRepo = {
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepo,
        },
        {
          provide: getRepositoryToken(EmployeeAuditLog),
          useValue: auditLogRepo,
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return success and user object without password on valid credentials', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(mockEmployee);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('budi@dexagroup.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('budi@dexagroup.com');
      expect((result.user as any).password).toBeUndefined();
    });

    it('should fail if user not found', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('unknown@dexa.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.message).toBe('User tidak ditemukan');
    });

    it('should fail if user is inactive', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockEmployee,
        status: EmployeeStatus.INACTIVE,
      });

      const result = await service.validateUser('budi@dexagroup.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Akun karyawan non-aktif');
    });

    it('should fail if password does not match', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(mockEmployee);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('budi@dexagroup.com', 'wrongpassword');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Password salah');
    });
  });

  describe('create', () => {
    it('should create an employee with default regular schedule 09:00 - 18:00', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (employeeRepo.create as jest.Mock).mockImplementation((dto) => dto);
      (employeeRepo.save as jest.Mock).mockImplementation((dto) =>
        Promise.resolve({ id: 2, ...dto }),
      );

      const result = await service.create({
        nik: 'EMP002',
        name: 'Siti Rahma',
        email: 'siti@dexagroup.com',
      });

      expect(result.success).toBe(true);
      expect(result.data.workSchedule).toBe('09:00 - 18:00 (Reguler)');
      expect((result.data as any).password).toBeUndefined();
      expect(employeeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workSchedule: '09:00 - 18:00 (Reguler)',
          role: Role.EMPLOYEE,
          status: EmployeeStatus.ACTIVE,
        }),
      );
    });

    it('should preserve custom workSchedule if provided on create', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (employeeRepo.create as jest.Mock).mockImplementation((dto) => dto);
      (employeeRepo.save as jest.Mock).mockImplementation((dto) =>
        Promise.resolve({ id: 3, ...dto }),
      );

      const result = await service.create({
        nik: 'EMP003',
        name: 'Ahmad Shift',
        email: 'ahmad@dexagroup.com',
        workSchedule: '08:00 - 17:00 (Shift Pagi)',
      });

      expect(result.success).toBe(true);
      expect(result.data.workSchedule).toBe('08:00 - 17:00 (Shift Pagi)');
    });

    it('should reject creation if NIK or Email is already registered', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(mockEmployee);

      const result = await service.create({
        nik: 'EMP001',
        email: 'budi@dexagroup.com',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('sudah terdaftar');
      expect(employeeRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update employee data including workSchedule', async () => {
      const existing = { ...mockEmployee };
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(existing);
      (employeeRepo.save as jest.Mock).mockImplementation((emp) => Promise.resolve(emp));

      const result = await service.update(1, {
        workSchedule: '13:00 - 22:00 (Shift Siang)',
        position: 'Senior Engineer',
      });

      expect(result.success).toBe(true);
      expect(result.data.workSchedule).toBe('13:00 - 22:00 (Shift Siang)');
      expect(result.data.position).toBe('Senior Engineer');
    });

    it('should hash new password if password is provided on update', async () => {
      const existing = { ...mockEmployee };
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(existing);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (employeeRepo.save as jest.Mock).mockImplementation((emp) => Promise.resolve(emp));

      const result = await service.update(1, { password: 'newSecretPassword' });

      expect(result.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newSecretPassword', 'salt');
    });

    it('should reject update if new email is already taken by another employee', async () => {
      const existing = { ...mockEmployee, email: 'current@dexa.com' };
      (employeeRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 2, email: 'taken@dexa.com' });

      const result = await service.update(1, { email: 'taken@dexa.com' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Email sudah digunakan');
    });

    it('should reject update if new NIK is already taken by another employee', async () => {
      const existing = { ...mockEmployee, nik: 'EMP001' };
      (employeeRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 2, nik: 'EMP999' });

      const result = await service.update(1, { nik: 'EMP999' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('NIK sudah digunakan');
    });

    it('should return error if employee to update is not found', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update(999, { name: 'Not Exist' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Karyawan tidak ditemukan');
    });
  });

  describe('getById', () => {
    it('should return employee without password if found', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(mockEmployee);

      const result = await service.getById(1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect((result as any).password).toBeUndefined();
    });

    it('should return null if employee not found', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById(999);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete employee if found', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(mockEmployee);
      (employeeRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.delete(1);
      expect(result.success).toBe(true);
      expect(employeeRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should return error if employee not found', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.delete(999);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Karyawan tidak ditemukan');
    });
  });

  describe('getAll', () => {
    it('should query employees with search and department filters and omit password', async () => {
      const mockQueryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEmployee]),
      };

      (employeeRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const results = await service.getAll({
        search: 'Budi',
        department: 'Technology',
      });

      expect(results).toHaveLength(1);
      expect((results[0] as any).password).toBeUndefined();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('emp.id', 'DESC');
    });
  });

  describe('getStats', () => {
    it('should return correct employee count statistics and department breakdown', async () => {
      (employeeRepo.count as jest.Mock)
        .mockResolvedValueOnce(15) // total
        .mockResolvedValueOnce(12); // active

      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { department: 'Technology', count: '10' },
          { department: 'HR', count: '5' },
        ]),
      };

      (employeeRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const stats = await service.getStats();

      expect(stats.total).toBe(15);
      expect(stats.active).toBe(12);
      expect(stats.inactive).toBe(3);
      expect(stats.departments).toHaveLength(2);
    });
  });

  describe('Audit Logging', () => {
    it('should retrieve audit logs for a specific employee ordered by createdAt DESC', async () => {
      const mockLogs = [
        {
          id: 1,
          employeeId: 1,
          action: 'UPDATE',
          actionLabel: 'Pembaruan Data Karyawan',
          changedById: 99,
          changedByName: 'Admin HRD',
          changedByEmail: 'hrd@dexa.com',
          changes: [
            { field: 'position', fieldLabel: 'Jabatan', oldValue: 'Junior Dev', newValue: 'Senior Dev' },
          ],
          notes: 'Diperbarui oleh Admin HRD: Jabatan',
          createdAt: new Date(),
        },
      ];

      (auditLogRepo.find as jest.Mock).mockResolvedValue(mockLogs);

      const result = await service.getAuditLogs(1);
      expect(result).toEqual(mockLogs);
      expect(auditLogRepo.find).toHaveBeenCalledWith({
        where: { employeeId: 1 },
        order: { createdAt: 'DESC' },
      });
    });

    it('should record audit log when updating employee fields', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue({ ...mockEmployee });
      (employeeRepo.save as jest.Mock).mockImplementation((item) => Promise.resolve(item));

      await service.update(
        1,
        { position: 'Lead Engineer', department: 'R&D' },
        { id: 99, name: 'Admin HRD', email: 'hrd@dexa.com' },
      );

      expect(auditLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 1,
          action: 'UPDATE',
          actionLabel: 'Pembaruan Data Karyawan',
          changedById: 99,
          changedByName: 'Admin HRD',
          changes: expect.arrayContaining([
            expect.objectContaining({ field: 'position', oldValue: 'Software Engineer', newValue: 'Lead Engineer' }),
            expect.objectContaining({ field: 'department', oldValue: 'Technology', newValue: 'R&D' }),
          ]),
        }),
      );
    });

    it('should record status change audit log when only status is modified', async () => {
      (employeeRepo.findOne as jest.Mock).mockResolvedValue({ ...mockEmployee });
      (employeeRepo.save as jest.Mock).mockImplementation((item) => Promise.resolve(item));

      await service.update(
        1,
        { status: EmployeeStatus.INACTIVE },
        { id: 99, name: 'Admin HRD', email: 'hrd@dexa.com' },
      );

      expect(auditLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 1,
          action: 'STATUS_CHANGE',
          actionLabel: 'Perubahan Status Akun (INACTIVE)',
        }),
      );
    });
  });
});
