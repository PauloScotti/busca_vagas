import { normalizeText } from './fingerprint';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Converte HTML (possivelmente com entidades escapadas, como no Greenhouse) em texto puro. */
export function htmlToText(html: string): string {
  return decodeHtmlEntities(
    decodeHtmlEntities(html)
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/?(p|div|br|li|ul|ol|h[1-6])[^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/** True se algum termo aparece como palavra inteira (sem acento/caixa) em algum dos textos. */
export function matchesAnyTerm(texts: string[], terms: string[]): boolean {
  const haystack = ` ${normalizeText(texts.join(' '))} `;
  return terms.some((term) => {
    const needle = normalizeText(term);
    return needle.length > 0 && haystack.includes(` ${needle} `);
  });
}

export function isRemoteLocation(location: string | null | undefined): boolean {
  return !!location && /\b(remote|remoto|anywhere)\b/i.test(location);
}
