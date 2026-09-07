import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
  ) {}

  async login(emailOrNik: string, passwordPlain: string) {
    const result = await this.employeesService.validateUser(emailOrNik, passwordPlain);

    if (!result || !result.success || !result.user) {
      throw new UnauthorizedException(result?.message || 'Login gagal');
    }

    const user = result.user;
    const payload = {
      sub: user.id,
      nik: user.nik,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      department: user.department,
      workSchedule: user.workSchedule,
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Login berhasil',
      accessToken: token,
      user,
    };
  }
}
