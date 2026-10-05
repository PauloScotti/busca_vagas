import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { CompanyBoardCollector, toIntOrNull } from './company-board.collector';
import { NormalizedJob, NormalizedJobSchema } from '../domain/job.types';
import { isRemoteLocation } from '../domain/text';
import { Env } from '../../config/env';

const LeverPostingSchema = z.object({
  id: z.string(),
  text: z.string(),
  hostedUrl: z.string(),
  categories: z
    .object({ location: z.string().nullable().optional() })
    .nullable()
    .optional(),
  workplaceType: z.string().nullable().optional(),
  createdAt: z.number().nullable().optional(),
  descriptionPlain: z.string().nullable().optional(),
  additionalPlain: z.string().nullable().optional(),
  salaryRange: z
    .object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
      interval: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const LeverResponseSchema = z.array(z.unknown());

@Injectable()
export class LeverCollector extends CompanyBoardCollector {
  readonly source = 'lever' as const;

  constructor(config: ConfigService<Env, true>) {
    super(config.getOrThrow('LEVER_COMPANIES', { infer: true }));
  }

  protected boardUrl(slug: string): string {
    return `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
  }

  protected extractPostings(body: unknown): unknown[] {
    return LeverResponseSchema.parse(body);
  }

  normalize(raw: unknown, slug: string): NormalizedJob | null {
    const parsed = LeverPostingSchema.safeParse(raw);
    if (!parsed.success) return null;
    const j = parsed.data;
    const location = j.categories?.location?.trim() || null;
    const yearly = j.salaryRange?.interval === 'per-year-salary' ? j.salaryRange : null;
    const candidate = {
      source: this.source,
      externalId: j.id,
      title: j.text.trim(),
      company: slug,
      location,
      remote: j.workplaceType === 'remote' || isRemoteLocation(location),
      url: j.hostedUrl,
      description: [j.descriptionPlain, j.additionalPlain].filter(Boolean).join('\n\n').trim(),
      tags: [],
      salaryMin: toIntOrNull(yearly?.min),
      salaryMax: toIntOrNull(yearly?.max),
      publishedAt: j.createdAt ?? null,
    };
    const result = NormalizedJobSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }
}
