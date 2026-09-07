import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Employee } from './employees/entities/employee.entity';
import { EmployeeAuditLog } from './employees/entities/employee-audit-log.entity';
import { Attendance } from './attendance/entities/attendance.entity';
import { Role, EmployeeStatus, AttendanceStatus } from './common/enums';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3308', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'rahasia',
  database: process.env.DB_DATABASE || 'dexa',
  entities: [Employee, EmployeeAuditLog, Attendance],
  synchronize: true,
});

async function runSeed() {
  console.log('Connecting to database for seeding...');
  await AppDataSource.initialize();
  console.log('Database connected.');

  const employeeRepo = AppDataSource.getRepository(Employee);
  const attendanceRepo = AppDataSource.getRepository(Attendance);

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  const initialEmployees = [
    {
      nik: 'HRD-001',
      name: 'Admin HRD Dexa',
      email: 'hrd@dexa.com',
      password: defaultPasswordHash,
      role: Role.ADMIN_HRD,
      position: 'HR Manager',
      department: 'Human Resources',
      phoneNumber: '081234567890',
      status: EmployeeStatus.ACTIVE,
    },
    {
      nik: 'EMP-001',
      name: 'Budi Pratama',
      email: 'budi@dexa.com',
      password: defaultPasswordHash,
      role: Role.EMPLOYEE,
      position: 'Senior Fullstack Developer',
      department: 'Information Technology',
      phoneNumber: '081298765432',
      status: EmployeeStatus.ACTIVE,
    },
    {
      nik: 'EMP-002',
      name: 'Siti Rahmawati',
      email: 'siti@dexa.com',
      password: defaultPasswordHash,
      role: Role.EMPLOYEE,
      position: 'Product Specialist',
      department: 'Product Management',
      phoneNumber: '081311223344',
      status: EmployeeStatus.ACTIVE,
    },
    {
      nik: 'EMP-003',
      name: 'Dewi Lestari',
      email: 'dewi@dexa.com',
      password: defaultPasswordHash,
      role: Role.EMPLOYEE,
      position: 'Quality Assurance',
      department: 'Information Technology',
      phoneNumber: '081399887766',
      status: EmployeeStatus.ACTIVE,
    },
  ];

  for (const empData of initialEmployees) {
    const existing = await employeeRepo.findOne({
      where: [{ email: empData.email }, { nik: empData.nik }],
    });

    if (!existing) {
      const created = employeeRepo.create(empData);
      await employeeRepo.save(created);
      console.log(`✓ Created employee: ${empData.name} (${empData.email}) [${empData.role}]`);
    } else {
      console.log(`- Employee exists: ${empData.name} (${empData.email})`);
    }
  }

  // Sample attendance for Siti
  const siti = await employeeRepo.findOne({ where: { email: 'siti@dexa.com' } });
  if (siti) {
    const today = new Date().toISOString().slice(0, 10);
    const existingAtt = await attendanceRepo.findOne({
      where: { employeeId: siti.id, date: today },
    });

    if (!existingAtt) {
      const sampleAtt = attendanceRepo.create({
        employeeId: siti.id,
        date: today,
        clockIn: new Date(Date.now() - 3 * 3600 * 1000),
        clockInPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        workNotes: 'Mengerjakan riset fitur baru dan koordinasi WFH dengan tim QA.',
        status: AttendanceStatus.CLOCKED_IN,
      });
      await attendanceRepo.save(sampleAtt);
      console.log(`✓ Created sample attendance for Siti today`);
    }
  }

  console.log('\n======================================');
  console.log('Seeding finished successfully!');
  console.log('Admin HRD: hrd@dexa.com / password123');
  console.log('Karyawan:  budi@dexa.com / password123');
  console.log('======================================\n');

  await AppDataSource.destroy();
}

runSeed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
