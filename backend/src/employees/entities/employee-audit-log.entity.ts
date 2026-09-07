import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export interface AuditFieldChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

@Entity('employee_audit_logs')
export class EmployeeAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ length: 50 })
  action: string; // CREATE, UPDATE, STATUS_CHANGE, DELETE

  @Column({ name: 'action_label', length: 100 })
  actionLabel: string; // e.g. 'Pembaruan Data', 'Perubahan Status', 'Penambahan Karyawan'

  @Column({ name: 'changed_by_id', nullable: true })
  changedById: number;

  @Column({ name: 'changed_by_name', length: 100, nullable: true })
  changedByName: string;

  @Column({ name: 'changed_by_email', length: 100, nullable: true })
  changedByEmail: string;

  @Column({ type: 'json', nullable: true })
  changes: AuditFieldChange[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
