import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env';

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

@Injectable()
export class TelegramService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async send(text: string): Promise<void> {
    console.log(text);
    // const token = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    // const chatId = this.config.get('TELEGRAM_CHAT_ID', { infer: true });
    // if (!token || !chatId) {
    //   throw new ServiceUnavailableException('TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID não configurados');
    // }
    // const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    //   method: 'POST',
    //   headers: { 'content-type': 'application/json' },
    //   body: JSON.stringify({
    //     chat_id: chatId,
    //     text,
    //     parse_mode: 'HTML',
    //     disable_web_page_preview: true,
    //   }),
    // });
    // if (!res.ok) {
    //   throw new ServiceUnavailableException(`Telegram respondeu ${res.status}`);
    // }
  }
}
