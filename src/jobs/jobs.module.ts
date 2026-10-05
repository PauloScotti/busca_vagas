import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';
import { JOB_COLLECTORS, JobCollector } from './collectors/collector.interface.js';
import { RemotiveCollector } from './collectors/remotive.collector.js';
import { GupyCollector } from './collectors/gupy.collector.js';
import { GreenhouseCollector } from './collectors/greenhouse.collector.js';
import { LeverCollector } from './collectors/lever.collector.js';
import { AshbyCollector } from './collectors/ashby.collector.js';

const COLLECTORS = [RemotiveCollector, GupyCollector, GreenhouseCollector, LeverCollector, AshbyCollector];

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    ...COLLECTORS,
    {
      provide: JOB_COLLECTORS,
      useFactory: (...collectors: JobCollector[]) => collectors,
      inject: COLLECTORS,
    },
  ],
  exports: [JobsService],
})
export class JobsModule {}
