import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService, escapeHtml } from './telegram.service';
import { Env } from '../config/env';

interface DigestMatch {
  id: string;
  score: number;
  reasons: string[];
  job: {
    title: string;
    company: string;
    location: string | null;
    remote: boolean;
    url: string;
  };
}

export interface DigestResult {
  sent: number;
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async sendDaily(): Promise<DigestResult> {
    const minScore = this.config.getOrThrow('DIGEST_MIN_SCORE', { infer: true });
    const limit = this.config.getOrThrow('DIGEST_LIMIT', { infer: true });

    const matches: DigestMatch[] = await this.prisma.match.findMany({
      where: { score: { gte: minScore }, notifiedAt: null },
      include: { job: true },
      orderBy: { score: 'desc' },
      take: limit,
    });

    if (matches.length === 0) {
      this.logger.log('Nenhum match novo acima do score mínimo; digest não enviado');
      return { sent: 0 };
    }

    await this.telegram.send(this.buildDigest(matches));
    await this.prisma.match.updateMany({
      where: { id: { in: matches.map((m) => m.id) } },
      data: { notifiedAt: new Date() },
    });
    return { sent: matches.length };
  }

  buildDigest(matches: DigestMatch[]): string {
    const lines = [`<b>🎯 Vagas do dia</b> (${matches.length})`, ''];
    for (const m of matches) {
      const where = m.job.remote ? 'Remoto' : m.job.location ?? 'Local não informado';
      const reason = m.reasons[0] ? ` · ${escapeHtml(m.reasons[0])}` : '';
      lines.push(
        `<b>${m.score}</b> · ${escapeHtml(m.job.title)} — ${escapeHtml(m.job.company)}`,
        `${escapeHtml(where)}${reason}`,
        m.job.url,
        '',
      );
    }
    return lines.join('\n').trim();
  }
}
