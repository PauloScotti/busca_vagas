import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { JobSourceSchema } from './domain/job.types';

const ListJobsQuerySchema = z.object({
  source: JobSourceSchema.optional(),
  remote: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListJobsQueryDto extends createZodDto(ListJobsQuerySchema) {}

const CollectBodySchema = z.object({
  searchTerms: z.array(z.string().trim().min(1).max(50)).min(1).max(10).optional(),
});

export class CollectBodyDto extends createZodDto(CollectBodySchema) {}
