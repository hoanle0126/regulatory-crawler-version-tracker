import { Controller, Get, Param, Query, UseGuards, BadRequestException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DiffService } from './diff.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Diff Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DiffController {
  constructor(@Inject(DiffService) private readonly diffService: DiffService) {}

  @Get(':id/diff')
  @ApiOperation({
    summary: 'Compare two document versions structurally with hierarchy navigation and word-level diffs',
  })
  @ApiQuery({ name: 'from', required: true, description: 'Base version ID (Version A)' })
  @ApiQuery({ name: 'to', required: true, description: 'Target version ID (Version B)' })
  async compareVersions(
    @Param('id') documentId: string,
    @Query('from') fromVersionId: string,
    @Query('to') toVersionId: string
  ) {
    if (!fromVersionId || !toVersionId) {
      throw new BadRequestException('Both "from" and "to" version IDs are required in query params');
    }
    return this.diffService.compareVersions(documentId, fromVersionId, toVersionId);
  }
}
