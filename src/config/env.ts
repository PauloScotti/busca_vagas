import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(3000),
  PIPELINE_CRON: z.string().default('0 7 * * *'),
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('claude-haiku-4-5'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  DIGEST_MIN_SCORE: z.coerce.number().int().min(0).max(100).default(70),
  DIGEST_LIMIT: z.coerce.number().int().min(1).max(30).default(10),
  SEARCH_TERMS: z
    .string()
    .default('nestjs,react,node')
    .transform((v) => v.split(',').map((t) => t.trim()).filter(Boolean)),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
