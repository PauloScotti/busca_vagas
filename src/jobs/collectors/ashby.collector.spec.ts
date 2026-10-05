import { AshbyCollector } from './ashby.collector';
import { fakeConfig } from './test-helpers';

const base = {
  id: '34413f8d-26bf-4bbc-8ade-eb309a0e2245',
  title: 'Security Engineer',
  jobUrl: 'https://jobs.ashbyhq.com/ramp/34413f8d',
  location: 'New York, NY',
  isRemote: false,
  workplaceType: 'OnSite',
  isListed: true,
  publishedAt: '2026-04-07T17:12:35.753+00:00',
  descriptionPlain: ' Go and TypeScript ',
};

describe('AshbyCollector.normalize', () => {
  const collector = new AshbyCollector(fakeConfig({ ASHBY_BOARDS: ['ramp'] }));

  it('normaliza um job válido com salário anual', () => {
    const job = collector.normalize(
      {
        ...base,
        isRemote: true,
        compensation: {
          summaryComponents: [
            { compensationType: 'EquityPercentage', interval: 'NONE', minValue: null, maxValue: null },
            { compensationType: 'Salary', interval: '1 YEAR', currencyCode: 'USD', minValue: 211400, maxValue: 290600 },
          ],
        },
      },
      'ramp',
    );
    expect(job).toMatchObject({
      source: 'ashby',
      externalId: base.id,
      company: 'ramp',
      remote: true,
      description: 'Go and TypeScript',
      salaryMin: 211400,
      salaryMax: 290600,
    });
    expect(job?.publishedAt).toBeInstanceOf(Date);
  });

  it('detecta remoto por workplaceType e deixa salário nulo sem compensação', () => {
    const job = collector.normalize({ ...base, isRemote: null, workplaceType: 'Remote' }, 'ramp');
    expect(job).toMatchObject({ remote: true, salaryMin: null, salaryMax: null });
  });

  it('descarta vagas não listadas e payload malformado', () => {
    expect(collector.normalize({ ...base, isListed: false }, 'ramp')).toBeNull();
    expect(collector.normalize({ id: 'x' }, 'ramp')).toBeNull();
  });
});
