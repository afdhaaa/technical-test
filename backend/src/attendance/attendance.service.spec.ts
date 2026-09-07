import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
import { Employee } from '../employees/entities/employee.entity';
import { AttendanceStatus, EmployeeStatus } from '../common/enums';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepo: jest.Mocked<Partial<Repository<Attendance>>>;
  let employeeRepo: jest.Mocked<Partial<Repository<Employee>>>;

  const mockEmployee: Partial<Employee> = {
    id: 1,
    name: 'Budi Santoso',
    nik: 'EMP001',
    email: 'budi@dexagroup.com',
    workSchedule: '08:00 - 17:00 (Shift Pagi)',
    status: EmployeeStatus.ACTIVE,
  };

  const mockAttendance: Partial<Attendance> = {
    id: 10,
    employeeId: 1,
    date: new Date().toISOString().split('T')[0],
    clockIn: new Date(),
    clockInPhoto: 'data:image/jpeg;base64,mockphoto',
    clockInLocation: '-6.208800, 106.845600',
    workSchedule: '08:00 - 17:00 (Shift Pagi)',
    workNotes: 'Mengerjakan modul backend',
    status: AttendanceStatus.CLOCKED_IN,
  };

  beforeEach(async () => {
    attendanceRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    employeeRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: attendanceRepo,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepo,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTodayStatus', () => {
    it('should return attendance status if found', async () => {
      (attendanceRepo.findOne as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await service.getTodayStatus(1);
      expect(result).toEqual(mockAttendance);
      expect(attendanceRepo.findOne).toHaveBeenCalledWith({
        where: {
          employeeId: 1,
          date: expect.any(String),
        },
        relations: ['employee'],
      });
    });

    it('should return null if no attendance today', async () => {
      (attendanceRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getTodayStatus(1);
      expect(result).toBeNull();
    });
  });

  describe('clockIn', () => {
    it('should successfully clock in with GPS coordinates and employee schedule', async () => {
      (attendanceRepo.findOne as jest.Mock).mockResolvedValue(null);
      (employeeRepo.findOne as jest.Mock).mockResolvedValue(mockEmployee);
      (attendanceRepo.create as jest.Mock).mockImplementation((dto) => dto);
      (attendanceRepo.save as jest.Mock).mockImplementation((dto) => Promise.resolve({ id: 1, ...dto }));

      const payload = {
        employeeId: 1,
        clockInPhoto: 'data:image/jpeg;base64,photo123',
        location: '-6.208800, 106.845600',
        workNotes: 'WFH mengerjakan API',
      };

      const result = await service.clockIn(payload);

      expect(result.success).toBe(true);
      expect(result.message).toContain('berhasil');
      expect(attendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 1,
          clockInPhoto: payload.clockInPhoto,
          clockInLocation: '-6.208800, 106.845600',
          workSchedule: '08:00 - 17:00 (Shift Pagi)',
          status: AttendanceStatus.CLOCKED_IN,
        }),
      );
      expect(attendanceRepo.save).toHaveBeenCalled();
    });

    it('should reject clock-in if already clocked in today', async () => {
      (attendanceRepo.findOne as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await service.clockIn({
        employeeId: 1,
        clockInPhoto: 'photo',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('sudah melakukan clock-in');
      expect(attendanceRepo.save).not.toHaveBeenCalled();
    });

    it('should fallback to default regular schedule if employee has no schedule set', async () => {
      (attendanceRepo.findOne as jest.Mock).mockResolvedValue(null);
      (employeeRepo.findOne as jest.Mock).mockResolvedValue({ id: 2, workSchedule: undefined } as any);
      (attendanceRepo.create as jest.Mock).mockImplementation((dto) => dto);
      (attendanceRepo.save as jest.Mock).mockImplementation((dto) => Promise.resolve({ id: 2, ...dto }));

      const result = await service.clockIn({
        employeeId: 2,
        clockInPhoto: 'photo',
      });

      expect(result.success).toBe(true);
      expect(attendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workSchedule: '09:00 - 18:00 (Reguler)',
        }),
      );
    });
  });

  describe('clockOut', () => {
    it('should successfully clock out with GPS location and update status to CLOCKED_OUT', async () => {
      const activeAttendance = {
        ...mockAttendance,
        status: AttendanceStatus.CLOCKED_IN,
        workNotes: 'Catatan pagi',
      };
      (attendanceRepo.findOne as jest.Mock).mockResolvedValue(activeAttendance);
      (attendanceRepo.save as jest.Mock).mockImplementation((att) => Promise.resolve(att));

      const payload = {
        employeeId: 1,
        clockOutPhoto: 'data:image/jpeg;base64,outphoto',
        location: '-6.208800, 106.845600',
        workNotes: 'Task selesai',
      };

      const result = await service.clockOut(payload);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Clock-out WFH berhasil');
      expect(activeAttendance.clockOutLocation).toBe('-6.208800, 106.845600');
      expect(activeAttendance.status).toBe(AttendanceStatus.CLOCKED_OUT);
      expect(activeAttendance.clockOut).toBeInstanceOf(Date);
      expect(activeAttendance.workNotes).toContain('[Catatan Selesai]: Task selesai');
      expect(attendanceRepo.save).toHaveBeenCalledWith(activeAttendance);
    });

    it('should reject clock-out if employee has not clocked in today', async () => {
      (attendanceRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.clockOut({
        employeeId: 1,
        clockOutPhoto: 'photo',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('belum melakukan clock-in');
      expect(attendanceRepo.save).not.toHaveBeenCalled();
    });

    it('should reject clock-out if employee already clocked out today', async () => {
      const alreadyCompleted = {
        ...mockAttendance,
        status: AttendanceStatus.CLOCKED_OUT,
      };
      (attendanceRepo.findOne as jest.Mock).mockResolvedValue(alreadyCompleted);

      const result = await service.clockOut({
        employeeId: 1,
        clockOutPhoto: 'photo',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('sudah melakukan clock-out');
      expect(attendanceRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getMyHistory', () => {
    it('should return attendance history for an employee with limit', async () => {
      (attendanceRepo.find as jest.Mock).mockResolvedValue([mockAttendance]);

      const result = await service.getMyHistory(1, 10);
      expect(result).toEqual([mockAttendance]);
      expect(attendanceRepo.find).toHaveBeenCalledWith({
        where: { employeeId: 1 },
        order: { date: 'DESC', clockIn: 'DESC' },
        take: 10,
      });
    });
  });

  describe('getDashboardStats', () => {
    it('should calculate correct dashboard statistics', async () => {
      (employeeRepo.count as jest.Mock).mockResolvedValue(10);
      (attendanceRepo.find as jest.Mock).mockResolvedValue([
        { ...mockAttendance, status: AttendanceStatus.CLOCKED_IN },
        { ...mockAttendance, status: AttendanceStatus.CLOCKED_OUT },
      ]);

      const stats = await service.getDashboardStats('2026-09-07');

      expect(stats.totalEmployees).toBe(10);
      expect(stats.presentToday).toBe(2);
      expect(stats.currentlyWorking).toBe(1);
      expect(stats.completedToday).toBe(1);
      expect(stats.attendanceRate).toBe(20); // 2/10 * 100
    });
  });

  describe('getAllAttendances', () => {
    it('should query and return attendances with safe employee data', async () => {
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockAttendance,
            employee: {
              ...mockEmployee,
              password: 'secretpassword',
            },
          },
        ]),
      };

      (attendanceRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const results = await service.getAllAttendances({
        date: '2026-09-07',
        status: AttendanceStatus.CLOCKED_IN,
        search: 'Budi',
        department: 'Technology',
      });

      expect(results).toHaveLength(1);
      expect((results[0].employee as any).password).toBeUndefined();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
    });

    it('should support date range filtering with startDate and endDate', async () => {
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAttendance]),
      };

      (attendanceRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const results = await service.getAllAttendances({
        startDate: '2026-09-01',
        endDate: '2026-09-07',
      });

      expect(results).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('att.date >= :startDate', {
        startDate: '2026-09-01',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('att.date <= :endDate', {
        endDate: '2026-09-07',
      });
    });
  });
});
