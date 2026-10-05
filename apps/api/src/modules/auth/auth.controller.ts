import { Controller, Post, Body, Get, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto, RefreshTokenDto } from './dto/login.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser, IAuthUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    try {
      const ip = req.ip || req.socket?.remoteAddress;
      return await this.authService.login(loginDto, ip);
    } catch (err) {
      console.error('LOGIN_CONTROLLER_ERROR:', err);
      throw err;
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT access token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: IAuthUser) {
    return this.authService.getProfile(user.id);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Log out current session' })
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }
}
