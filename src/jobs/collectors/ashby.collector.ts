import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { CompanyBoardCollector, toIntOrNull } from './company-board.collector.js';
import { NormalizedJob, NormalizedJobSchema } from '../domain/job.types.js';
import { isRemoteLocation } from '../domain/text.js';
import { Env } from '../../config/env.js';

const CompensationComponentSchema = z.object({
  compensationType: z.string().nullable().optional(),
  interval: z.string().nullable().optional(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
});

const AshbyJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  jobUrl: z.string(),
  location: z.string().nullable().optional(),
  isRemote: z.boolean().nullable().optional(),
  workplaceType: z.string().nullable().optional(),
  isListed: z.boolean().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  descriptionPlain: z.string().nullable().optional(),
  compensation: z
    .object({ summaryComponents: z.array(CompensationComponentSchema).nullable().optional() })
    .nullable()
    .optional(),
});

const AshbyResponseSchema = z.object({ jobs: z.array(z.unknown()) });

@Injectable()
export class AshbyCollector extends CompanyBoardCollector {
  readonly source = 'ashby' as const;

  constructor(config: ConfigService<Env, true>) {
    super(config.getOrThrow('ASHBY_BOARDS', { infer: true }));
  }

  protected boardUrl(slug: string): string {
    return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`;
  }

  protected extractPostings(body: unknown): unknown[] {
    return AshbyResponseSchema.parse(body).jobs;
  }

  normalize(raw: unknown, slug: string): NormalizedJob | null {
    const parsed = AshbyJobSchema.safeParse(raw);
    if (!parsed.success || parsed.data.isListed === false) return null;
    const j = parsed.data;
    const location = j.location?.trim() || null;
    const salary = j.compensation?.summaryComponents?.find(
      (c) => c.compensationType === 'Salary' && c.interval === '1 YEAR',
    );
    const candidate = {
      source: this.source,
      externalId: j.id,
      title: j.title.trim(),
      company: slug,
      location,
      remote: j.isRemote === true || j.workplaceType === 'Remote' || isRemoteLocation(location),
      url: j.jobUrl,
      description: j.descriptionPlain?.trim() ?? '',
      tags: [],
      salaryMin: toIntOrNull(salary?.minValue),
      salaryMax: toIntOrNull(salary?.maxValue),
      publishedAt: j.publishedAt ?? null,
    };
    const result = NormalizedJobSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }
}
