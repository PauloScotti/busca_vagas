import { GupyCollector } from './gupy.collector';

describe('GupyCollector.normalize', () => {
  const collector = new GupyCollector();

  it('normaliza um job válido com localização composta', () => {
    const job = collector.normalize({
      id: 987,
      name: 'Desenvolvedor Full Stack',
      careerPageName: 'Empresa X',
      city: 'São Paulo',
      state: 'SP',
      isRemoteWork: false,
      jobUrl: 'https://empresa.gupy.io/jobs/987',
      publishedDate: '2026-08-29T12:00:00.000Z',
      description: 'desc',
    });
    expect(job).toMatchObject({
      source: 'gupy',
      externalId: '987',
      company: 'Empresa X',
      location: 'São Paulo, SP',
      remote: false,
    });
  });

  it('trata campos opcionais ausentes', () => {
    const job = collector.normalize({
      id: '1',
      name: 'Dev',
      careerPageName: 'Y',
      jobUrl: 'https://y.gupy.io/jobs/1',
    });
    expect(job).toMatchObject({ location: null, description: '', remote: false, publishedAt: null });
  });

  it('retorna null para payload malformado', () => {
    expect(collector.normalize({ id: 1 })).toBeNull();
  });
});
