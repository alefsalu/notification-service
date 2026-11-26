import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { SendNotificationUseCase } from '../../../application/use-cases/send-notification.use-case.js';
import { GetNotificationUseCase } from '../../../application/use-cases/get-notification.use-case.js';
import { ListUserNotificationsUseCase } from '../../../application/use-cases/list-user-notifications.use-case.js';
import { CreateNotificationDto } from '../dtos/create-notification.dto.js';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard.js';
import { CurrentUser } from '../../../infrastructure/security/decorators/current-user.decorator.js';
import { JwtPayload } from '../../../application/ports/token-verifier.port.js';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getNotificationUseCase: GetNotificationUseCase,
    private readonly listUserNotificationsUseCase: ListUserNotificationsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(
    @Body() dto: CreateNotificationDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const correlationId = (req as any).correlationId;
    const targetUserId = dto.userId ?? user.sub;

    return this.sendNotificationUseCase.execute({
      userId: targetUserId,
      channel: dto.channel,
      recipient: dto.recipient,
      templateKey: dto.templateKey,
      data: dto.data ?? {},
      correlationId,
    });
  }

  @Get('mine')
  async listMine(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 0;
    const sizeNum = size ? parseInt(size, 10) : 20;

    return this.listUserNotificationsUseCase.execute(user.sub, pageNum, sizeNum);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.getNotificationUseCase.execute(id, user.sub, user.roles);
    if (!result) {
      throw new NotFoundException(`Notification not found with id: ${id}`);
    }
    return result;
  }
}
