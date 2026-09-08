import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { JobsService } from '../jobs/jobs.service';
import { MatchingService } from '../matching/matching.service';
import { DigestService } from '../notifications/digest.service';
import { Env } from '../config/env';

@Injectable()
export class PipelineScheduler implements OnModuleInit {
  private readonly logger = new Logger(PipelineScheduler.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly matchingService: MatchingService,
    private readonly digestService: DigestService,
    private readonly config: ConfigService<Env, true>,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cron = this.config.getOrThrow('PIPELINE_CRON', { infer: true });
    const job = new CronJob(cron, () => void this.run());
    this.registry.addCronJob('daily-pipeline', job);
    job.start();
    this.logger.log(`Pipeline diário agendado: ${cron}`);
  }

  async run() {
    await this.step('coleta', () =>
      this.jobsService.collectAll(this.config.getOrThrow('SEARCH_TERMS', { infer: true })),
    );
    await this.step('matching', () => this.matchingService.run());
    await this.step('digest', () => this.digestService.sendDaily());
  }

  private async step(name: string, fn: () => Promise<unknown>) {
    try {
      const result = await fn();
      this.logger.log(`Etapa ${name} ok: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error(`Etapa ${name} falhou`, err instanceof Error ? err.stack : String(err));
    }
  }
}
