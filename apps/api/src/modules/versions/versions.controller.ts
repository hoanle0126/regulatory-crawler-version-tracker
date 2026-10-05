import { Controller, Get, Param, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VersionsService } from './versions.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Versions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('versions')
export class VersionsController {
  constructor(@Inject(VersionsService) private readonly versionsService: VersionsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get details and raw snapshot for a specific document version' })
  async findOne(@Param('id') id: string) {
    return this.versionsService.findOne(id);
  }

  @Get(':id/structure')
  @ApiOperation({ summary: 'Get hierarchical legal node tree (Chapters, Articles, Clauses, Points)' })
  async getStructure(@Param('id') id: string) {
    return this.versionsService.getStructure(id);
  }
}
