import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../common/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles(Role.ADMIN_HRD)
  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('department') department?: string,
  ) {
    return this.employeesService.getAll({ search, department });
  }

  @Roles(Role.ADMIN_HRD)
  @Get('stats')
  async getStats() {
    return this.employeesService.getStats();
  }

  @Roles(Role.ADMIN_HRD)
  @Get(':id/audit-logs')
  async getAuditLogs(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.getAuditLogs(id);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.getById(id);
  }

  @Roles(Role.ADMIN_HRD)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.employeesService.create(body, req.user);
  }

  @Roles(Role.ADMIN_HRD)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.employeesService.update(id, body, req.user);
  }

  @Roles(Role.ADMIN_HRD)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.employeesService.delete(id, req.user);
  }
}
