import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(@Inject(AuditLogsService) private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List security and administrative audit log events' })
  async getAuditLogs(@Query() query: PaginationQueryDto) {
    return this.auditLogsService.findAll(query);
  }
}
