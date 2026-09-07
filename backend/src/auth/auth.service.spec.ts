import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { EmployeesService } from '../employees/employees.service';
import { Role } from '../common/enums';

describe('AuthService', () => {
  let service: AuthService;
  let employeesService: jest.Mocked<Partial<EmployeesService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  const mockSafeUser = {
    id: 1,
    nik: 'EMP001',
    name: 'Budi Santoso',
    email: 'budi@dexagroup.com',
    role: Role.EMPLOYEE,
    position: 'Software Engineer',
    department: 'Technology',
    workSchedule: '09:00 - 18:00 (Reguler)',
  };

  beforeEach(async () => {
    employeesService = {
      validateUser: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EmployeesService,
          useValue: employeesService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should generate accessToken and return user including workSchedule when credentials are valid', async () => {
      (employeesService.validateUser as jest.Mock).mockResolvedValue({
        success: true,
        user: mockSafeUser,
      });

      const result = await service.login('budi@dexagroup.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.user).toEqual(mockSafeUser);
      expect(result.user.workSchedule).toBe('09:00 - 18:00 (Reguler)');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 1,
          nik: 'EMP001',
          name: 'Budi Santoso',
          email: 'budi@dexagroup.com',
          role: Role.EMPLOYEE,
          workSchedule: '09:00 - 18:00 (Reguler)',
        }),
      );
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      (employeesService.validateUser as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Password salah',
      });

      await expect(service.login('budi@dexagroup.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      (employeesService.validateUser as jest.Mock).mockResolvedValue({
        success: false,
        message: 'User tidak ditemukan',
      });

      await expect(service.login('nonexistent@dexa.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
