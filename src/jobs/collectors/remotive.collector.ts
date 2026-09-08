import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { JobCollector } from './collector.interface';
import { NormalizedJob, NormalizedJobSchema } from '../domain/job.types';

const RemotiveJobSchema = z.object({
  id: z.number(),
  url: z.url(),
  title: z.string(),
  company_name: z.string(),
  candidate_required_location: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  publication_date: z.string().optional(),
  description: z.string().optional().default(''),
});

const RemotiveResponseSchema = z.object({
  jobs: z.array(z.unknown()),
});

@Injectable()
export class RemotiveCollector implements JobCollector {
  readonly source = 'remotive' as const;
  private readonly logger = new Logger(RemotiveCollector.name);
  private readonly baseUrl = 'https://remotive.com/api/remote-jobs';

  async collect(searchTerms: string[]): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    for (const term of searchTerms) {
      try {
        const res = await fetch(`${this.baseUrl}?search=${encodeURIComponent(term)}&limit=50`);
        if (!res.ok) {
          this.logger.warn(`Remotive respondeu ${res.status} para "${term}"`);
          continue;
        }
        const body = RemotiveResponseSchema.parse(await res.json());
        for (const raw of body.jobs) {
          const job = this.normalize(raw);
          if (job) results.push(job);
        }
      } catch (err) {
        this.logger.error(`Falha ao coletar Remotive "${term}"`, err instanceof Error ? err.stack : String(err));
      }
    }
    return results;
  }

  normalize(raw: unknown): NormalizedJob | null {
    const parsed = RemotiveJobSchema.safeParse(raw);
    if (!parsed.success) return null;
    const j = parsed.data;
    const candidate = {
      source: this.source,
      externalId: String(j.id),
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || null,
      remote: true,
      url: j.url,
      description: j.description,
      tags: j.tags,
      salaryMin: null,
      salaryMax: null,
      publishedAt: j.publication_date ?? null,
    };
    const result = NormalizedJobSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }
}
