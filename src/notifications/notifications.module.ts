import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service.js';
import { DigestService } from './digest.service.js';
import { DigestController } from './digest.controller.js';

@Module({
  controllers: [DigestController],
  providers: [TelegramService, DigestService],
  exports: [DigestService],
})
export class NotificationsModule {}
