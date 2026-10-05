import { Controller, Get, Patch, Param, Body, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChangesService } from './changes.service.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { CurrentUser, IAuthUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Changes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('changes')
export class ChangesController {
  constructor(@Inject(ChangesService) private readonly changesService: ChangesService) {}

  @Get()
  @ApiOperation({ summary: 'List detected regulatory changesets with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'documentId', required: false })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('documentId') documentId?: string
  ) {
    return this.changesService.findAll(query, status, documentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a changeset including all individual change items' })
  async findOne(@Param('id') id: string) {
    return this.changesService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update change review status (REVIEWED, ACKNOWLEDGED, IGNORED) (Admin only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: IAuthUser
  ) {
    return this.changesService.updateStatus(id, status, user.email);
  }
}
