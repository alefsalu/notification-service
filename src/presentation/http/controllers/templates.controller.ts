import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ManageTemplateUseCase } from '../../../application/use-cases/manage-template.use-case.js';
import { CreateTemplateDto, UpdateTemplateDto } from '../dtos/create-template.dto.js';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard.js';
import { Roles } from '../../../infrastructure/security/decorators/roles.decorator.js';

@Controller('api/v1/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
  constructor(private readonly manageTemplateUseCase: ManageTemplateUseCase) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTemplateDto) {
    const template = await this.manageTemplateUseCase.create({
      key: dto.key,
      channel: dto.channel,
      subject: dto.subject,
      bodyTemplate: dto.bodyTemplate,
    });

    return {
      key: template.key,
      channel: template.channel,
      subject: template.subject,
      bodyTemplate: template.bodyTemplate,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  @Get(':key')
  async getByKey(@Param('key') key: string) {
    const template = await this.manageTemplateUseCase.getByKey(key);
    if (!template) {
      throw new NotFoundException(`Template not found with key: ${key}`);
    }

    return {
      key: template.key,
      channel: template.channel,
      subject: template.subject,
      bodyTemplate: template.bodyTemplate,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  @Put(':key')
  @Roles('ADMIN')
  async update(@Param('key') key: string, @Body() dto: UpdateTemplateDto) {
    const template = await this.manageTemplateUseCase.update(key, dto.subject, dto.bodyTemplate);

    return {
      key: template.key,
      channel: template.channel,
      subject: template.subject,
      bodyTemplate: template.bodyTemplate,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}
