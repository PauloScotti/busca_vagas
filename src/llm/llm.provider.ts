export interface LlmProvider {
  complete(prompt: string): Promise<string>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
