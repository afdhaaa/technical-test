import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { Employee } from '../employees/entities/employee.entity';
import { AttendanceStatus, EmployeeStatus } from '../common/enums';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  private getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getTodayStatus(employeeId: number) {
    const today = this.getTodayDateString();
    return this.attendanceRepo.findOne({
      where: { employeeId, date: today },
      relations: ['employee'],
    });
  }

  async clockIn(payload: {
    employeeId: number;
    clockInPhoto: string;
    workNotes?: string;
    location?: string;
  }) {
    const today = this.getTodayDateString();

    const existing = await this.attendanceRepo.findOne({
      where: { employeeId: payload.employeeId, date: today },
    });

    if (existing) {
      return {
        success: false,
        message: 'Anda sudah melakukan clock-in hari ini',
        data: existing,
      };
    }

    const employee = await this.employeeRepo.findOne({ where: { id: payload.employeeId } });

    const attendance = this.attendanceRepo.create({
      employeeId: payload.employeeId,
      date: today,
      clockIn: new Date(),
      clockInPhoto: payload.clockInPhoto,
      clockInLocation: payload.location || 'WFH - Rumah',
      workSchedule: employee?.workSchedule || '09:00 - 18:00 (Reguler)',
      workNotes: payload.workNotes || '',
      status: AttendanceStatus.CLOCKED_IN,
    });

    const saved = await this.attendanceRepo.save(attendance);
    return {
      success: true,
      message: 'Clock-in WFH berhasil dicatat',
      data: saved,
    };
  }

  async clockOut(payload: {
    employeeId: number;
    clockOutPhoto: string;
    workNotes?: string;
    location?: string;
  }) {
    const today = this.getTodayDateString();

    const existing = await this.attendanceRepo.findOne({
      where: { employeeId: payload.employeeId, date: today },
    });

    if (!existing) {
      return {
        success: false,
        message: 'Anda belum melakukan clock-in hari ini',
      };
    }

    if (existing.status === AttendanceStatus.CLOCKED_OUT) {
      return {
        success: false,
        message: 'Anda sudah melakukan clock-out hari ini',
        data: existing,
      };
    }

    existing.clockOut = new Date();
    existing.clockOutPhoto = payload.clockOutPhoto;
    existing.clockOutLocation = payload.location || 'WFH - Rumah';
    if (payload.workNotes) {
      existing.workNotes = existing.workNotes
        ? `${existing.workNotes}\n[Catatan Selesai]: ${payload.workNotes}`
        : payload.workNotes;
    }
    existing.status = AttendanceStatus.CLOCKED_OUT;

    const saved = await this.attendanceRepo.save(existing);
    return {
      success: true,
      message: 'Clock-out WFH berhasil dicatat',
      data: saved,
    };
  }

  async getMyHistory(employeeId: number, limit: number = 30) {
    return this.attendanceRepo.find({
      where: { employeeId },
      order: { date: 'DESC', clockIn: 'DESC' },
      take: limit,
    });
  }

  async getAllAttendances(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    department?: string;
    status?: string;
  }) {
    const query = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.employee', 'emp')
      .orderBy('att.date', 'DESC')
      .addOrderBy('att.clockIn', 'DESC');

    if (params?.date) {
      query.andWhere('att.date = :date', { date: params.date });
    } else {
      if (params?.startDate) {
        query.andWhere('att.date >= :startDate', { startDate: params.startDate });
      }
      if (params?.endDate) {
        query.andWhere('att.date <= :endDate', { endDate: params.endDate });
      }
    }

    if (params?.status && params.status !== 'ALL') {
      query.andWhere('att.status = :status', { status: params.status });
    }

    if (params?.search) {
      query.andWhere(
        '(emp.name LIKE :search OR emp.nik LIKE :search OR emp.department LIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    if (params?.department && params.department !== 'ALL') {
      query.andWhere('emp.department = :dept', { dept: params.department });
    }

    const results = await query.getMany();
    return results.map((item) => {
      if (item.employee) {
        const { password, ...safeEmp } = item.employee;
        return { ...item, employee: safeEmp };
      }
      return item;
    });
  }

  async getDashboardStats(dateParam?: string) {
    const targetDate = dateParam || this.getTodayDateString();

    const totalEmployees = await this.employeeRepo.count({
      where: { status: EmployeeStatus.ACTIVE },
    });

    const attendancesToday = await this.attendanceRepo.find({
      where: { date: targetDate },
    });

    const clockedInCount = attendancesToday.length;
    const completedCount = attendancesToday.filter(
      (a) => a.status === AttendanceStatus.CLOCKED_OUT,
    ).length;
    const workingCount = clockedInCount - completedCount;

    const attendanceRate =
      totalEmployees > 0
        ? Math.round((clockedInCount / totalEmployees) * 100)
        : 0;

    return {
      targetDate,
      totalEmployees,
      presentToday: clockedInCount,
      currentlyWorking: workingCount,
      completedToday: completedCount,
      attendanceRate,
    };
  }
}
