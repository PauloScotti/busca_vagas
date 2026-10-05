import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { CompanyBoardCollector } from './company-board.collector.js';
import { NormalizedJob, NormalizedJobSchema } from '../domain/job.types.js';
import { htmlToText, isRemoteLocation } from '../domain/text.js';
import { Env } from '../../config/env.js';

const GreenhouseJobSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  absolute_url: z.string(),
  company_name: z.string().nullable().optional(),
  location: z.object({ name: z.string().nullable().optional() }).nullable().optional(),
  content: z.string().nullable().optional(),
  first_published: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

const GreenhouseResponseSchema = z.object({ jobs: z.array(z.unknown()) });

@Injectable()
export class GreenhouseCollector extends CompanyBoardCollector {
  readonly source = 'greenhouse' as const;

  constructor(config: ConfigService<Env, true>) {
    super(config.getOrThrow('GREENHOUSE_BOARDS', { infer: true }));
  }

  protected boardUrl(slug: string): string {
    return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
  }

  protected extractPostings(body: unknown): unknown[] {
    return GreenhouseResponseSchema.parse(body).jobs;
  }

  normalize(raw: unknown, slug: string): NormalizedJob | null {
    const parsed = GreenhouseJobSchema.safeParse(raw);
    if (!parsed.success) return null;
    const j = parsed.data;
    const location = j.location?.name?.trim() || null;
    const candidate = {
      source: this.source,
      externalId: String(j.id),
      title: j.title.trim(),
      company: j.company_name?.trim() || slug,
      location,
      remote: isRemoteLocation(location),
      url: j.absolute_url,
      description: htmlToText(j.content ?? ''),
      tags: [],
      salaryMin: null,
      salaryMax: null,
      publishedAt: j.first_published ?? j.updated_at ?? null,
    };
    const result = NormalizedJobSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }
}
