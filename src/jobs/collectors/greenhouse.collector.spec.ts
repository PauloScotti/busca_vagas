import { GreenhouseCollector } from './greenhouse.collector.js';
import { fakeConfig } from './test-helpers.js';

describe('GreenhouseCollector.normalize', () => {
  const collector = new GreenhouseCollector(fakeConfig({ GREENHOUSE_BOARDS: ['gitlab'] }));

  it('normaliza um job válido, decodificando o HTML escapado', () => {
    const job = collector.normalize(
      {
        id: 8860302002,
        title: ' Backend Engineer (Node) ',
        absolute_url: 'https://job-boards.greenhouse.io/gitlab/jobs/8860302002',
        company_name: 'GitLab',
        location: { name: 'Remote, Brazil' },
        content: '&lt;p&gt;NestJS &amp;amp; Postgres&lt;/p&gt;',
        first_published: '2026-10-02T11:31:50-04:00',
        updated_at: '2026-10-03T11:31:50-04:00',
      },
      'gitlab',
    );
    expect(job).toMatchObject({
      source: 'greenhouse',
      externalId: '8860302002',
      title: 'Backend Engineer (Node)',
      company: 'GitLab',
      location: 'Remote, Brazil',
      remote: true,
      description: 'NestJS & Postgres',
    });
    expect(job?.publishedAt?.toISOString()).toBe('2026-10-02T15:31:50.000Z');
  });

  it('usa o slug como empresa e updated_at quando faltam campos', () => {
    const job = collector.normalize(
      { id: 1, title: 'Dev', absolute_url: 'https://x.com/1', updated_at: '2026-01-01T00:00:00Z' },
      'acme',
    );
    expect(job).toMatchObject({ company: 'acme', location: null, remote: false, description: '' });
    expect(job?.publishedAt).toBeInstanceOf(Date);
  });

  it('retorna null para payload malformado ou URL não-http', () => {
    expect(collector.normalize({ id: 1 }, 'acme')).toBeNull();
    expect(collector.normalize(null, 'acme')).toBeNull();
    expect(collector.normalize({ id: 1, title: 'Dev', absolute_url: 'javascript:alert(1)' }, 'acme')).toBeNull();
  });
});
