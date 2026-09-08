import { createHash } from 'node:crypto';

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function jobFingerprint(title: string, company: string): string {
  return createHash('sha256')
    .update(`${normalizeText(title)}|${normalizeText(company)}`)
    .digest('hex');
}
