import { Controller, Get, Post, Delete, Param, Body, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RelationshipsService } from './relationships.service.js';
import { RelationshipType } from '@regtracker/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { CurrentUser, IAuthUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Relationships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class RelationshipsController {
  constructor(@Inject(RelationshipsService) private readonly relationshipsService: RelationshipsService) {}

  @Get('documents/:id/relationships')
  @ApiOperation({ summary: 'Get inbound and outbound legal relationships for a document' })
  async findByDocument(@Param('id') documentId: string) {
    return this.relationshipsService.findByDocument(documentId);
  }

  @Post('documents/:id/relationships')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a legal relationship between two documents (Admin only)' })
  async create(
    @Param('id') sourceDocumentId: string,
    @Body() body: { targetDocumentId: string; relationshipType: RelationshipType; description?: string },
    @CurrentUser() user: IAuthUser
  ) {
    return this.relationshipsService.create(
      {
        sourceDocumentId,
        targetDocumentId: body.targetDocumentId,
        relationshipType: body.relationshipType,
        description: body.description,
      },
      user.email
    );
  }

  @Delete('relationships/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a legal relationship (Admin only)' })
  async delete(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.relationshipsService.delete(id, user.email);
  }
}
