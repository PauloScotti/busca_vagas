import { z } from 'zod';

export const JOB_SOURCES = ['remotive', 'gupy', 'greenhouse', 'lever', 'ashby'] as const;
export const JobSourceSchema = z.enum(JOB_SOURCES);
export type JobSource = z.infer<typeof JobSourceSchema>;

export const NormalizedJobSchema = z.object({
  source: JobSourceSchema,
  externalId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().nullable(),
  remote: z.boolean(),
  url: z.url(),
  description: z.string(),
  tags: z.array(z.string()),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  publishedAt: z.coerce.date().nullable(),
});

export type NormalizedJob = z.infer<typeof NormalizedJobSchema>;
