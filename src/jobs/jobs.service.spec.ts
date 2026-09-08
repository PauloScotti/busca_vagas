import { JobsService } from './jobs.service';
import { NormalizedJob } from './domain/job.types';

function makeJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    source: 'remotive',
    externalId: '1',
    title: 'Dev Node',
    company: 'ACME',
    location: null,
    remote: true,
    url: 'https://example.com/1',
    description: '',
    tags: [],
    salaryMin: null,
    salaryMax: null,
    publishedAt: null,
    ...overrides,
  };
}

describe('JobsService', () => {
  const upsert = jest.fn().mockResolvedValue({});
  const prisma = { job: { upsert } } as never;
  const service = new JobsService(prisma, []);

  beforeEach(() => upsert.mockClear());

  it('dedupeBatch remove duplicados de mesma fonte+id mantendo o primeiro', () => {
    const jobs = [makeJob(), makeJob({ title: 'Outro título' }), makeJob({ externalId: '2' })];
    const result = service.dedupeBatch(jobs);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Dev Node');
  });

  it('ingest persiste com fingerprint e reporta duplicados pulados', async () => {
    const result = await service.ingest([makeJob(), makeJob(), makeJob({ externalId: '2' })]);
    expect(result).toEqual({ received: 3, persisted: 2, skippedDuplicates: 1 });
    expect(upsert).toHaveBeenCalledTimes(2);
    const firstCall = upsert.mock.calls[0][0];
    expect(firstCall.create.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(firstCall.where).toEqual({ source_externalId: { source: 'remotive', externalId: '1' } });
  });
});
