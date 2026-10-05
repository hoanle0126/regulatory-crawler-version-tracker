import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class DocumentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by source ID' })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({ description: 'Filter by document lifecycle status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by document type (e.g. THONG_TU, NGHI_DINH)' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ description: 'Filter by issuing authority' })
  @IsOptional()
  @IsString()
  issuingAuthority?: string;
}
