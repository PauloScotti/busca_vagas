import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProfileDto } from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const profile = await this.prisma.profile.findFirst();
    if (!profile) throw new NotFoundException('Nenhum perfil cadastrado');
    return profile;
  }

  async upsert(data: UpsertProfileDto) {
    const existing = await this.prisma.profile.findFirst();
    if (existing) {
      return this.prisma.profile.update({ where: { id: existing.id }, data });
    }
    return this.prisma.profile.create({ data });
  }
}
