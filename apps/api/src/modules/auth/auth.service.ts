import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service.js';
import { LoginDto, RefreshTokenDto } from './dto/login.dto.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtService) private jwtService: JwtService,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(AuditLogsService) private auditLogsService: AuditLogsService
  ) {}

  public async login(loginDto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') || 'regtracker-refresh-token-secret-key-2026';
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: '7d',
    });

    await this.auditLogsService.logAction({
      actorId: user.id,
      actorEmail: user.email,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  public async refresh(dto: RefreshTokenDto) {
    try {
      const refreshTokenSecret =
        this.configService.get<string>('REFRESH_TOKEN_SECRET') || 'regtracker-refresh-token-secret-key-2026';
      const decoded = this.jwtService.verify(dto.refreshToken, {
        secret: refreshTokenSecret,
      }) as { sub: string; email: string; role: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  public async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
