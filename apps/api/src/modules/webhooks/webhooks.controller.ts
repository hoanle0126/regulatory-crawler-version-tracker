import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { CurrentUser, IAuthUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(@Inject(WebhooksService) private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all configured webhook endpoints' })
  async findAll() {
    return this.webhooksService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get webhook endpoint details and delivery history' })
  async findOne(@Param('id') id: string) {
    return this.webhooksService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Register a new webhook endpoint (Admin only)' })
  async create(
    @Body() body: { url: string; description?: string; events: string[]; secret?: string },
    @CurrentUser() user: IAuthUser
  ) {
    return this.webhooksService.create(body, user.email);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update webhook endpoint configuration (Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() body: { url?: string; description?: string; events?: string[]; enabled?: boolean },
    @CurrentUser() user: IAuthUser
  ) {
    return this.webhooksService.update(id, body, user.email);
  }

  @Post(':id/rotate-secret')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rotate HMAC signing secret for a webhook endpoint (Admin only)' })
  async rotateSecret(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.webhooksService.rotateSecret(id, user.email);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a webhook endpoint (Admin only)' })
  async delete(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.webhooksService.delete(id, user.email);
  }

  @Post(':id/test')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Send a test ping delivery to webhook endpoint (Admin only)' })
  async sendTest(@Param('id') id: string) {
    return this.webhooksService.sendTestPing(id);
  }

  // Mock receiver endpoint for testing and local demonstration
  @Post('mock-receiver')
  @ApiOperation({ summary: 'Mock webhook receiver endpoint for local validation' })
  async mockReceiver(
    @Body() payload: any,
    @Headers('x-regtracker-signature') signature: string,
    @Headers('x-regtracker-event') event: string
  ) {
    return {
      received: true,
      event,
      signatureReceived: !!signature,
      payloadSummary: payload?.summary || 'No summary',
      timestamp: new Date().toISOString(),
    };
  }
}
