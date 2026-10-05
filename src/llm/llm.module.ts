import { Module } from '@nestjs/common';
import { LLM_PROVIDER } from './llm.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';

@Module({
  providers: [AnthropicProvider, { provide: LLM_PROVIDER, useExisting: AnthropicProvider }],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
