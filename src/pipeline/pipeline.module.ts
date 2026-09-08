import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { MatchingModule } from '../matching/matching.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PipelineScheduler } from './pipeline.scheduler';

@Module({
  imports: [JobsModule, MatchingModule, NotificationsModule],
  providers: [PipelineScheduler],
})
export class PipelineModule {}
