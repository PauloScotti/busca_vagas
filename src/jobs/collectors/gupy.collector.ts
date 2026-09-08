import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { JobCollector } from './collector.interface';
import { NormalizedJob, NormalizedJobSchema } from '../domain/job.types';

const GupyJobSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  careerPageName: z.string(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  isRemoteWork: z.boolean().optional().default(false),
  jobUrl: z.url(),
  publishedDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

const GupyResponseSchema = z.object({
  data: z.array(z.unknown()),
});

@Injectable()
export class GupyCollector implements JobCollector {
  readonly source = 'gupy' as const;
  private readonly logger = new Logger(GupyCollector.name);
  private readonly baseUrl = 'https://portal.api.gupy.io/api/v1/jobs';

  async collect(searchTerms: string[]): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    for (const term of searchTerms) {
      try {
        const res = await fetch(`${this.baseUrl}?jobName=${encodeURIComponent(term)}&limit=50`);
        if (!res.ok) {
          this.logger.warn(`Gupy respondeu ${res.status} para "${term}"`);
          continue;
        }
        const body = GupyResponseSchema.parse(await res.json());
        for (const raw of body.data) {
          const job = this.normalize(raw);
          if (job) results.push(job);
        }
      } catch (err) {
        this.logger.error(`Falha ao coletar Gupy "${term}"`, err instanceof Error ? err.stack : String(err));
      }
    }
    return results;
  }

  normalize(raw: unknown): NormalizedJob | null {
    const parsed = GupyJobSchema.safeParse(raw);
    if (!parsed.success) return null;
    const j = parsed.data;
    const location = [j.city, j.state].filter(Boolean).join(', ') || null;
    const candidate = {
      source: this.source,
      externalId: String(j.id),
      title: j.name,
      company: j.careerPageName,
      location,
      remote: j.isRemoteWork,
      url: j.jobUrl,
      description: j.description ?? '',
      tags: [],
      salaryMin: null,
      salaryMax: null,
      publishedAt: j.publishedDate ?? null,
    };
    const result = NormalizedJobSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }
}
