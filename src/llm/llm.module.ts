import { Module } from '@nestjs/common';
import { LLM_PROVIDER } from './llm.provider';
import { AnthropicProvider } from './anthropic.provider';

@Module({
  providers: [AnthropicProvider, { provide: LLM_PROVIDER, useExisting: AnthropicProvider }],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
