import { z } from 'zod';

export const LlmScoreSchema = z.object({
  jobId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  reasons: z.array(z.string()).max(5),
});

export type LlmScore = z.infer<typeof LlmScoreSchema>;

export function parseLlmScores(raw: string): LlmScore[] {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    return [];
  }
  const result = z.array(z.unknown()).safeParse(data);
  if (!result.success) return [];
  return result.data
    .map((item) => LlmScoreSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data);
}
