import { Controller, Get, Post, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CrawlsService } from './crawls.service.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { CurrentUser, IAuthUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Crawls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crawls')
export class CrawlsController {
  constructor(@Inject(CrawlsService) private readonly crawlsService: CrawlsService) {}

  @Get()
  @ApiOperation({ summary: 'List crawl runs with pagination and optional source filtering' })
  async findAll(@Query() query: PaginationQueryDto, @Query('sourceId') sourceId?: string) {
    return this.crawlsService.findAll(query, sourceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details for a specific crawl run' })
  async findOne(@Param('id') id: string) {
    return this.crawlsService.findOne(id);
  }

  @Post(':id/retry')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Retry a failed or completed crawl run (Admin only)' })
  async retry(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.crawlsService.retryCrawl(id, user.email);
  }
}
