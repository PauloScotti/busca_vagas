import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JOB_COLLECTORS, JobCollector } from './collectors/collector.interface';
import { RemotiveCollector } from './collectors/remotive.collector';
import { GupyCollector } from './collectors/gupy.collector';
import { GreenhouseCollector } from './collectors/greenhouse.collector';
import { LeverCollector } from './collectors/lever.collector';
import { AshbyCollector } from './collectors/ashby.collector';

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
