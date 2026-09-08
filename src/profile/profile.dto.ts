import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpsertProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  skills: z.array(z.string().trim().min(1).max(50)).min(1).max(50),
  yearsExperience: z.number().int().min(0).max(60),
  seniority: z.enum(['junior', 'pleno', 'senior', 'staff']),
  preferences: z.string().trim().max(1000).default(''),
});

export class UpsertProfileDto extends createZodDto(UpsertProfileSchema) {}
