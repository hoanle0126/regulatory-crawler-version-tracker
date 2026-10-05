import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSourceDto {
  @ApiProperty({ example: 'Cổng Công Báo Bộ Tài Chính (Synthetic Demo)' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'http://localhost:5101' })
  @IsString()
  @IsNotEmpty()
  baseUrl!: string;

  @ApiProperty({ example: 'HTML_LISTING', enum: ['HTML_LISTING', 'HTML_ARTICLE', 'PDF_DOCUMENT', 'MOCK_DEMO'] })
  @IsString()
  @IsNotEmpty()
  adapterType!: string;

  @ApiPropertyOptional({ example: '0 */6 * * *' })
  @IsOptional()
  @IsString()
  scheduleCron?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 15000 })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  timeout?: number;

  @ApiPropertyOptional({ default: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  retryLimits?: number;

  @ApiPropertyOptional({ default: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  crawlConcurrency?: number;

  @ApiPropertyOptional({ type: [String], example: ['localhost:5101', 'demo-source:5101'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @ApiPropertyOptional({
    example: {
      listingContainer: '.listing-container',
      itemLink: '.item-link',
      itemTitle: '.item-link',
      itemNumber: '.item-number',
      itemDate: '.item-date',
    },
  })
  @IsOptional()
  @IsObject()
  documentSelectors?: Record<string, string>;
}

export class UpdateSourceDto extends CreateSourceDto {}

export class TestSourceDto {
  @ApiProperty({ example: 'https://example.gov.vn' })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiPropertyOptional({ example: 'HTML_LISTING' })
  @IsOptional()
  @IsString()
  adapterType?: string;

  @ApiPropertyOptional({ type: [String], example: ['localhost:5101'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];
}
