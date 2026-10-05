import { Controller, Get, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

import { DocumentsQueryDto } from './dto/documents-query.dto.js';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(@Inject(DocumentsService) private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List regulatory documents with keyword search and filters' })
  async findAll(@Query() query: DocumentsQueryDto) {
    return this.documentsService.findAll(query, {
      sourceId: query.sourceId,
      status: query.status,
      documentType: query.documentType,
      issuingAuthority: query.issuingAuthority,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details, metadata, and version list' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get complete version history timeline for a document' })
  async findVersions(@Param('id') id: string) {
    return this.documentsService.findVersions(id);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export normalized document and legal nodes for downstream RAG ingestion' })
  @ApiQuery({ name: 'versionId', required: false, description: 'Optional version ID (defaults to latest)' })
  async exportRag(@Param('id') id: string, @Query('versionId') versionId?: string) {
    return this.documentsService.exportRag(id, versionId);
  }
}
