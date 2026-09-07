import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeeAuditLog } from '../employees/entities/employee-audit-log.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3308', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'rahasia',
      database: process.env.DB_DATABASE || 'dexa',
      entities: [Employee, EmployeeAuditLog, Attendance],
      synchronize: true,
      logging: false,
    }),
  ],
})
export class DatabaseModule {}
