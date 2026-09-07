export type Role = 'ADMIN_HRD' | 'EMPLOYEE';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type AttendanceStatus = 'CLOCKED_IN' | 'CLOCKED_OUT';

export interface User {
  id: number;
  nik: string;
  name: string;
  email: string;
  role: Role;
  position: string;
  department: string;
  workSchedule?: string;
  phoneNumber?: string;
  status: EmployeeStatus;
  createdAt?: string;
}

export interface Attendance {
  id: number;
  employeeId: number;
  employee?: User;
  date: string;
  clockIn: string;
  clockOut?: string;
  clockInPhoto: string;
  clockOutPhoto?: string;
  clockInLocation?: string;
  clockOutLocation?: string;
  workSchedule?: string;
  workNotes?: string;
  status: AttendanceStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  targetDate: string;
  totalEmployees: number;
  presentToday: number;
  currentlyWorking: number;
  completedToday: number;
  attendanceRate: number;
}

export interface AuditFieldChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

export interface EmployeeAuditLog {
  id: number;
  employeeId: number;
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'DELETE' | string;
  actionLabel: string;
  changedById?: number;
  changedByName?: string;
  changedByEmail?: string;
  changes?: AuditFieldChange[];
  notes?: string;
  createdAt: string;
}

