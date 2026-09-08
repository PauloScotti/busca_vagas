import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { DigestService } from './digest.service';
import { DigestController } from './digest.controller';

@Module({
  controllers: [DigestController],
  providers: [TelegramService, DigestService],
  exports: [DigestService],
})
export class NotificationsModule {}
