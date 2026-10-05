import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service.js';
import { UpsertProfileDto } from './profile.dto.js';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna o perfil cadastrado' })
  get() {
    return this.profileService.get();
  }

  @Put()
  @ApiOperation({ summary: 'Cria ou atualiza o perfil usado no matching' })
  upsert(@Body() body: UpsertProfileDto) {
    return this.profileService.upsert(body);
  }
}
