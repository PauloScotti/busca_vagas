import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { LlmProvider } from './llm.provider';
import { Env } from '../config/env';

const AnthropicResponseSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
});

@Injectable()
export class AnthropicProvider implements LlmProvider {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async complete(prompt: string): Promise<string> {
    const apiKey = this.config.get('ANTHROPIC_API_KEY', { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException('ANTHROPIC_API_KEY não configurada');
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.getOrThrow('LLM_MODEL', { infer: true }),
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(`LLM respondeu ${res.status}`);
    }
    const body = AnthropicResponseSchema.parse(await res.json());
    return body.content
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text)
      .join('\n');
  }
}
