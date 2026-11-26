import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ManagePreferencesUseCase } from '../../../application/use-cases/manage-preferences.use-case.js';
import { UpdatePreferencesDto } from '../dtos/update-preferences.dto.js';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../infrastructure/security/decorators/current-user.decorator.js';
import { JwtPayload } from '../../../application/ports/token-verifier.port.js';

@Controller('api/v1/preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly managePreferencesUseCase: ManagePreferencesUseCase) {}

  @Get('mine')
  async getMine(@CurrentUser() user: JwtPayload) {
    const prefs = await this.managePreferencesUseCase.getByUserId(user.sub);
    return {
      userId: prefs.userId,
      enabledChannels: prefs.enabledChannels,
      quietHours: prefs.quietHours,
      createdAt: prefs.createdAt.toISOString(),
      updatedAt: prefs.updatedAt.toISOString(),
    };
  }

  @Put('mine')
  async updateMine(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const prefs = await this.managePreferencesUseCase.update({
      userId: user.sub,
      enabledChannels: dto.enabledChannels,
      quietHours: dto.quietHours,
    });

    return {
      userId: prefs.userId,
      enabledChannels: prefs.enabledChannels,
      quietHours: prefs.quietHours,
      createdAt: prefs.createdAt.toISOString(),
      updatedAt: prefs.updatedAt.toISOString(),
    };
  }
}
