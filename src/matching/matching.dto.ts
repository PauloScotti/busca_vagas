import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ListMatchesQuerySchema = z.object({
  minScore: z.coerce.number().int().min(0).max(100).default(60),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListMatchesQueryDto extends createZodDto(ListMatchesQuerySchema) {}
