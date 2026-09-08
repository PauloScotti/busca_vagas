import { normalizeText } from '../jobs/domain/fingerprint';

export interface PrefilterInput {
  title: string;
  description: string;
  tags: string[];
}

export function prefilterScore(profileSkills: string[], job: PrefilterInput): number {
  const skills = profileSkills.map(normalizeText).filter(Boolean);
  if (skills.length === 0) return 0;
  const haystack = normalizeText(
    `${job.title} ${job.tags.join(' ')} ${job.description.slice(0, 2000)}`,
  );
  let hits = 0;
  for (const skill of skills) {
    if (haystack.includes(skill)) hits++;
  }
  return Math.round((hits / skills.length) * 100);
}
