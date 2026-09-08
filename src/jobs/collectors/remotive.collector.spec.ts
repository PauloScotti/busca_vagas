import { RemotiveCollector } from './remotive.collector';

describe('RemotiveCollector.normalize', () => {
  const collector = new RemotiveCollector();

  it('normaliza um job válido', () => {
    const job = collector.normalize({
      id: 123,
      url: 'https://remotive.com/job/123',
      title: 'NestJS Developer',
      company_name: 'ACME',
      candidate_required_location: 'Worldwide',
      tags: ['nestjs', 'node'],
      publication_date: '2026-08-30T10:00:00',
      description: '<p>desc</p>',
    });
    expect(job).toMatchObject({
      source: 'remotive',
      externalId: '123',
      title: 'NestJS Developer',
      company: 'ACME',
      remote: true,
      tags: ['nestjs', 'node'],
    });
    expect(job?.publishedAt).toBeInstanceOf(Date);
  });

  it('retorna null para payload malformado sem lançar', () => {
    expect(collector.normalize({ foo: 'bar' })).toBeNull();
    expect(collector.normalize(null)).toBeNull();
    expect(collector.normalize('string')).toBeNull();
  });
});
