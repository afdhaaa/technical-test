import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../common/enums';

function saveBase64Image(base64Str: string, prefix: string): string {
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  const uploadDir = join(process.cwd(), 'uploads', 'proofs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
  const filePath = join(uploadDir, filename);

  if (matches && matches.length === 3) {
    const buffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(filePath, buffer);
  } else {
    const buffer = Buffer.from(base64Str, 'base64');
    fs.writeFileSync(filePath, buffer);
  }

  return `/uploads/proofs/${filename}`;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'proofs'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `clock-in-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async clockIn(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { photoBase64?: string; workNotes?: string; location?: string },
  ) {
    const employeeId = req.user.id;
    let photoUrl = '';

    if (file) {
      photoUrl = `/uploads/proofs/${file.filename}`;
    } else if (body.photoBase64) {
      photoUrl = saveBase64Image(body.photoBase64, `clock-in-emp-${employeeId}`);
    } else {
      throw new BadRequestException('Foto bukti WFH wajib diunggah (kamera atau file)');
    }

    return this.attendanceService.clockIn({
      employeeId,
      clockInPhoto: photoUrl,
      workNotes: body.workNotes,
      location: body.location,
    });
  }

  @Post('clock-out')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'proofs'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `clock-out-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async clockOut(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { photoBase64?: string; workNotes?: string; location?: string },
  ) {
    const employeeId = req.user.id;
    let photoUrl = '';

    if (file) {
      photoUrl = `/uploads/proofs/${file.filename}`;
    } else if (body.photoBase64) {
      photoUrl = saveBase64Image(body.photoBase64, `clock-out-emp-${employeeId}`);
    } else {
      throw new BadRequestException('Foto bukti selesai kerja wajib diunggah');
    }

    return this.attendanceService.clockOut({
      employeeId,
      clockOutPhoto: photoUrl,
      workNotes: body.workNotes,
      location: body.location,
    });
  }

  @Get('today')
  async getTodayStatus(@Request() req: any) {
    return this.attendanceService.getTodayStatus(req.user.id);
  }

  @Get('my-history')
  async getMyHistory(@Request() req: any, @Query('limit') limit?: string) {
    return this.attendanceService.getMyHistory(
      req.user.id,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Roles(Role.ADMIN_HRD)
  @Get('monitoring')
  async getMonitoring(
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('status') status?: string,
  ) {
    return this.attendanceService.getAllAttendances({
      date,
      startDate,
      endDate,
      search,
      department,
      status,
    });
  }

  @Roles(Role.ADMIN_HRD)
  @Get('reports')
  async getReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('status') status?: string,
  ) {
    return this.attendanceService.getAllAttendances({
      startDate,
      endDate,
      search,
      department,
      status,
    });
  }

  @Roles(Role.ADMIN_HRD)
  @Get('dashboard-stats')
  async getDashboardStats(@Query('date') date?: string) {
    return this.attendanceService.getDashboardStats(date);
  }
}
