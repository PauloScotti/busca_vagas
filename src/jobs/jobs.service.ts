import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobCollector, JOB_COLLECTORS } from './collectors/collector.interface';
import { jobFingerprint } from './domain/fingerprint';
import { NormalizedJob } from './domain/job.types';

export interface IngestResult {
  received: number;
  persisted: number;
  skippedDuplicates: number;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(JOB_COLLECTORS) private readonly collectors: JobCollector[],
  ) {}

  async collectAll(searchTerms: string[]): Promise<IngestResult> {
    const batches = await Promise.all(
      this.collectors.map((c) =>
        c.collect(searchTerms).catch((err) => {
          this.logger.error(`Coletor ${c.source} falhou`, err instanceof Error ? err.stack : String(err));
          return [] as NormalizedJob[];
        }),
      ),
    );
    return this.ingest(batches.flat());
  }

  async ingest(jobs: NormalizedJob[]): Promise<IngestResult> {
    const deduped = this.dedupeBatch(jobs);
    let persisted = 0;
    for (const job of deduped) {
      const fingerprint = jobFingerprint(job.title, job.company);
      await this.prisma.job.upsert({
        where: { source_externalId: { source: job.source, externalId: job.externalId } },
        create: { ...job, fingerprint },
        update: { title: job.title, description: job.description, tags: job.tags, fingerprint },
      });
      persisted++;
    }
    return {
      received: jobs.length,
      persisted,
      skippedDuplicates: jobs.length - deduped.length,
    };
  }

  dedupeBatch(jobs: NormalizedJob[]): NormalizedJob[] {
    const seen = new Set<string>();
    const result: NormalizedJob[] = [];
    for (const job of jobs) {
      const key = `${job.source}:${job.externalId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(job);
    }
    return result;
  }

  async list(params: { source?: string; remote?: boolean; q?: string; page: number; pageSize: number }) {
    const where = {
      ...(params.source ? { source: params.source } : {}),
      ...(params.remote !== undefined ? { remote: params.remote } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: 'insensitive' as const } },
              { company: { contains: params.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }
}
