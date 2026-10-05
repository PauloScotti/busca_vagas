import { Logger } from '@nestjs/common';
import { JobCollector } from './collector.interface';
import { JobSource, NormalizedJob } from '../domain/job.types';
import { matchesAnyTerm } from '../domain/text';

const FETCH_TIMEOUT_MS = 15_000;
const MAX_CONCURRENT_BOARDS = 4;

/**
 * Base para ATSs que expõem um board público por empresa (Greenhouse, Lever, Ashby).
 * Esses endpoints não têm busca: baixa o board inteiro e filtra localmente pelos termos.
 */
export abstract class CompanyBoardCollector implements JobCollector {
  abstract readonly source: JobSource;
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly boards: string[]) {}

  protected abstract boardUrl(slug: string): string;
  protected abstract extractPostings(body: unknown): unknown[];
  abstract normalize(raw: unknown, slug: string): NormalizedJob | null;

  async collect(searchTerms: string[]): Promise<NormalizedJob[]> {
    if (this.boards.length === 0 || searchTerms.length === 0) return [];
    const results: NormalizedJob[] = [];
    const queue = [...this.boards];
    const worker = async () => {
      for (let slug = queue.shift(); slug !== undefined; slug = queue.shift()) {
        const jobs = await this.collectBoard(slug);
        results.push(...jobs.filter((j) => matchesAnyTerm([j.title, j.description, ...j.tags], searchTerms)));
      }
    };
    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_BOARDS, queue.length) }, worker));
    return results;
  }

  private async collectBoard(slug: string): Promise<NormalizedJob[]> {
    try {
      const res = await fetch(this.boardUrl(slug), {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(`${this.source} respondeu ${res.status} para o board "${slug}"`);
        return [];
      }
      const postings = this.extractPostings(await res.json());
      return postings.map((raw) => this.normalize(raw, slug)).filter((j): j is NormalizedJob => j !== null);
    } catch (err) {
      this.logger.error(
        `Falha ao coletar ${this.source} "${slug}"`,
        err instanceof Error ? err.stack : String(err),
      );
      return [];
    }
  }
}

export function toIntOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
}
