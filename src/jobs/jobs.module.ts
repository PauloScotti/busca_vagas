import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JOB_COLLECTORS } from './collectors/collector.interface';
import { RemotiveCollector } from './collectors/remotive.collector';
import { GupyCollector } from './collectors/gupy.collector';

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    RemotiveCollector,
    GupyCollector,
    {
      provide: JOB_COLLECTORS,
      useFactory: (remotive: RemotiveCollector, gupy: GupyCollector) => [remotive, gupy],
      inject: [RemotiveCollector, GupyCollector],
    },
  ],
  exports: [JobsService],
})
export class JobsModule {}
