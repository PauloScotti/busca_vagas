import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PipelineScheduler } from './pipeline.scheduler.js';

@Module({
  imports: [JobsModule, MatchingModule, NotificationsModule],
  providers: [PipelineScheduler],
})
export class PipelineModule {}
