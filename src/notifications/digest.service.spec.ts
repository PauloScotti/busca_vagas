import { DigestService } from './digest.service';
import { escapeHtml } from './telegram.service';

const makeMatch = (id: string, score: number, over: Record<string, unknown> = {}) => ({
  id,
  score,
  reasons: ['stack compatível'],
  job: {
    title: 'Dev <Node>',
    company: 'ACME & Co',
    location: 'São Paulo, SP',
    remote: false,
    url: 'https://example.com/1',
    ...over,
  },
});

describe('escapeHtml', () => {
  it('escapa &, < e >', () => {
    expect(escapeHtml('<b>A & B</b>')).toBe('&lt;b&gt;A &amp; B&lt;/b&gt;');
  });
});

describe('DigestService', () => {
  const findMany = jest.fn();
  const updateMany = jest.fn().mockResolvedValue({ count: 1 });
  const send = jest.fn().mockResolvedValue(undefined);
  const prisma = { match: { findMany, updateMany } } as never;
  const telegram = { send } as never;
  const config = {
    getOrThrow: (key: string) => ({ DIGEST_MIN_SCORE: 70, DIGEST_LIMIT: 10 })[key],
  } as never;
  const service = new DigestService(prisma, telegram, config);

  beforeEach(() => {
    findMany.mockReset();
    updateMany.mockClear();
    send.mockClear();
  });

  it('buildDigest escapa HTML e usa Remoto quando aplicável', () => {
    const text = service.buildDigest([makeMatch('m1', 92, { remote: true })]);
    expect(text).toContain('Dev &lt;Node&gt; — ACME &amp; Co');
    expect(text).toContain('Remoto · stack compatível');
    expect(text).toContain('https://example.com/1');
    expect(text).not.toContain('<Node>');
  });

  it('envia e marca notifiedAt apenas dos matches enviados', async () => {
    findMany.mockResolvedValue([makeMatch('m1', 92), makeMatch('m2', 80)]);
    const result = await service.sendDaily();
    expect(result).toEqual({ sent: 2 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(updateMany.mock.calls[0][0].where.id.in).toEqual(['m1', 'm2']);
  });

  it('não envia nada quando não há matches novos', async () => {
    findMany.mockResolvedValue([]);
    const result = await service.sendDaily();
    expect(result).toEqual({ sent: 0 });
    expect(send).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });
});
