import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SourcesService } from './sources.service.js';
import { CreateSourceDto, UpdateSourceDto, TestSourceDto } from './dto/create-source.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { CurrentUser, IAuthUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Sources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sources')
export class SourcesController {
  constructor(@Inject(SourcesService) private readonly sourcesService: SourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List all monitored regulatory sources' })
  async findAll() {
    return this.sourcesService.findAll();
  }

  @Post('test')
  @ApiOperation({ summary: 'Test arbitrary URL connectivity, SSRF safety, and adapter compatibility' })
  async testAdHoc(@Body() dto: TestSourceDto) {
    return this.sourcesService.testAdHocSource(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details and crawl stats for a specific source' })
  async findOne(@Param('id') id: string) {
    return this.sourcesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Register a new regulatory source (Admin only)' })
  async create(@Body() dto: CreateSourceDto, @CurrentUser() user: IAuthUser) {
    return this.sourcesService.create(dto, user.email);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update regulatory source configuration (Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSourceDto,
    @CurrentUser() user: IAuthUser
  ) {
    return this.sourcesService.update(id, dto, user.email);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a regulatory source (Admin only)' })
  async delete(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.sourcesService.delete(id, user.email);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test configured source connectivity, SSRF safety, and adapter compatibility' })
  async testSource(@Param('id') id: string) {
    return this.sourcesService.testSource(id);
  }

  @Post(':id/crawl')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Trigger an immediate crawl run for this source (Admin only)' })
  async triggerCrawl(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.sourcesService.triggerCrawl(id, user.email);
  }
}
