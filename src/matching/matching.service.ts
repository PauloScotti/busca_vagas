import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmProvider, LLM_PROVIDER } from '../llm/llm.provider';
import { prefilterScore } from './prefilter';
import { parseLlmScores } from './score-parser';

const LLM_BATCH_SIZE = 8;
const MAX_LLM_JOBS_PER_RUN = 32;
const CANDIDATE_POOL = 200;

interface ScorableJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  description: string;
  tags: string[];
}

export interface MatchRunResult {
  evaluated: number;
  scoredByLlm: number;
  discardedByPrefilter: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async run(): Promise<MatchRunResult> {
    const profile = await this.prisma.profile.findFirst();
    if (!profile) {
      throw new BadRequestException('Cadastre um perfil antes de rodar o matching (PUT /profile)');
    }

    const jobs: ScorableJob[] = await this.prisma.job.findMany({
      where: { matches: { none: { profileId: profile.id } } },
      orderBy: { publishedAt: 'desc' },
      take: CANDIDATE_POOL,
    });

    const ranked = jobs
      .map((job) => ({ job, pre: prefilterScore(profile.skills, job) }))
      .sort((a, b) => b.pre - a.pre);

    const toScore = ranked.filter((r) => r.pre > 0).slice(0, MAX_LLM_JOBS_PER_RUN);
    const discarded = ranked.filter((r) => !toScore.includes(r));

    if (discarded.length > 0) {
      await this.prisma.match.createMany({
        data: discarded.map((r) => ({
          jobId: r.job.id,
          profileId: profile.id,
          score: 0,
          reasons: ['Descartada no pré-filtro: sem interseção suficiente de skills'],
        })),
        skipDuplicates: true,
      });
    }

    let scoredByLlm = 0;
    for (let i = 0; i < toScore.length; i += LLM_BATCH_SIZE) {
      const batch = toScore.slice(i, i + LLM_BATCH_SIZE).map((r) => r.job);
      try {
        const response = await this.llm.complete(this.buildPrompt(profile, batch));
        const validIds = new Set(batch.map((j) => j.id));
        const scores = parseLlmScores(response).filter((s) => validIds.has(s.jobId));
        if (scores.length > 0) {
          await this.prisma.match.createMany({
            data: scores.map((s) => ({
              jobId: s.jobId,
              profileId: profile.id,
              score: s.score,
              reasons: s.reasons,
            })),
            skipDuplicates: true,
          });
          scoredByLlm += scores.length;
        }
      } catch (err) {
        this.logger.error('Batch de scoring falhou', err instanceof Error ? err.stack : String(err));
      }
    }

    return {
      evaluated: jobs.length,
      scoredByLlm,
      discardedByPrefilter: discarded.length,
    };
  }

  buildPrompt(
    profile: { skills: string[]; yearsExperience: number; seniority: string; preferences: string },
    jobs: ScorableJob[],
  ): string {
    const jobsPayload = jobs.map((j) => ({
      jobId: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      remote: j.remote,
      tags: j.tags,
      description: j.description.replace(/<[^>]+>/g, ' ').slice(0, 1500),
    }));
    return [
      'Você avalia compatibilidade entre um perfil profissional e vagas de emprego.',
      `Perfil: skills=${profile.skills.join(', ')}; experiência=${profile.yearsExperience} anos; senioridade=${profile.seniority}; preferências=${profile.preferences || 'nenhuma'}.`,
      'Para cada vaga abaixo, atribua score 0-100 (0=incompatível, 100=match perfeito) considerando stack, senioridade e preferências.',
      'Responda SOMENTE com um array JSON, sem markdown, no formato: [{"jobId":"...","score":0,"reasons":["motivo curto"]}]',
      'Máximo 3 reasons por vaga, em português.',
      `Vagas: ${JSON.stringify(jobsPayload)}`,
    ].join('\n');
  }

  async list(params: { minScore: number; page: number; pageSize: number }) {
    const where = { score: { gte: params.minScore } };
    const [items, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        include: { job: true },
        orderBy: { score: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.match.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }
}
