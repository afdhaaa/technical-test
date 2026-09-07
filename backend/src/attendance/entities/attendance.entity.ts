import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AttendanceStatus } from '../../common/enums';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('attendances')
@Index(['employeeId', 'date'], { unique: true })
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => Employee, (emp) => emp.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'clock_in', type: 'datetime' })
  clockIn: Date;

  @Column({ name: 'clock_out', type: 'datetime', nullable: true })
  clockOut: Date;

  @Column({ name: 'clock_in_photo', length: 255 })
  clockInPhoto: string;

  @Column({ name: 'clock_out_photo', length: 255, nullable: true })
  clockOutPhoto: string;

  @Column({ name: 'clock_in_location', length: 255, nullable: true })
  clockInLocation: string;

  @Column({ name: 'clock_out_location', length: 255, nullable: true })
  clockOutLocation: string;

  @Column({ name: 'work_schedule', length: 100, nullable: true })
  workSchedule: string;

  @Column({ name: 'work_notes', type: 'text', nullable: true })
  workNotes: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.CLOCKED_IN,
  })
  status: AttendanceStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
