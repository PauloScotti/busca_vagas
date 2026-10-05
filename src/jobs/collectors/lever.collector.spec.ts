import { LeverCollector } from './lever.collector.js';
import { fakeConfig } from './test-helpers.js';

describe('LeverCollector.normalize', () => {
  const collector = new LeverCollector(fakeConfig({ LEVER_COMPANIES: ['spotify'] }));

  it('normaliza um posting válido', () => {
    const job = collector.normalize(
      {
        id: '2193db3f-77c5-43b8-b030-8f92c9882bf1',
        text: 'Backend Engineer',
        hostedUrl: 'https://jobs.lever.co/spotify/2193db3f',
        categories: { location: 'London', team: 'Platform' },
        workplaceType: 'remote',
        createdAt: 1782214185805,
        descriptionPlain: 'Node and React',
        additionalPlain: 'EEO',
        salaryRange: { min: 100000.4, max: 150000, currency: 'USD', interval: 'per-year-salary' },
      },
      'spotify',
    );
    expect(job).toMatchObject({
      source: 'lever',
      externalId: '2193db3f-77c5-43b8-b030-8f92c9882bf1',
      company: 'spotify',
      location: 'London',
      remote: true,
      description: 'Node and React\n\nEEO',
      salaryMin: 100000,
      salaryMax: 150000,
    });
    expect(job?.publishedAt).toEqual(new Date(1782214185805));
  });

  it('ignora faixa salarial que não é anual e detecta remoto pela localização', () => {
    const job = collector.normalize(
      {
        id: 'a',
        text: 'Dev',
        hostedUrl: 'https://jobs.lever.co/x/a',
        categories: { location: 'Remote - LATAM' },
        workplaceType: 'onsite',
        salaryRange: { min: 50, max: 80, interval: 'per-hour-wage' },
      },
      'x',
    );
    expect(job).toMatchObject({ remote: true, salaryMin: null, salaryMax: null, publishedAt: null, description: '' });
  });

  it('retorna null para payload malformado', () => {
    expect(collector.normalize({ id: 'a' }, 'x')).toBeNull();
    expect(collector.normalize('x', 'x')).toBeNull();
  });
});
