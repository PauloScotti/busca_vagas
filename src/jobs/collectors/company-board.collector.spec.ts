import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { GreenhouseCollector } from './greenhouse.collector.js';
import { LeverCollector } from './lever.collector.js';
import { AshbyCollector } from './ashby.collector.js';
import { fakeConfig, jsonResponse } from './test-helpers.js';

const ghJob = (id: number, title: string, content = '') => ({
  id,
  title,
  absolute_url: `https://job-boards.greenhouse.io/b/jobs/${id}`,
  content,
});

describe('CompanyBoardCollector.collect', () => {
  let fetchMock: jest.Spied<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('não chama a rede sem boards configurados ou sem termos', async () => {
    expect(await new GreenhouseCollector(fakeConfig({ GREENHOUSE_BOARDS: [] })).collect(['node'])).toEqual([]);
    expect(await new GreenhouseCollector(fakeConfig({ GREENHOUSE_BOARDS: ['a'] })).collect([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('filtra pelos termos no título ou na descrição', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        jobs: [
          ghJob(1, 'NestJS Developer'),
          ghJob(2, 'Account Executive'),
          ghJob(3, 'Engineer', '&lt;p&gt;React&lt;/p&gt;'),
          { bad: true },
        ],
      }),
    );
    const jobs = await new GreenhouseCollector(fakeConfig({ GREENHOUSE_BOARDS: ['b'] })).collect(['nestjs', 'react']);
    expect(jobs.map((j) => j.externalId)).toEqual(['1', '3']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://boards-api.greenhouse.io/v1/boards/b/jobs?content=true',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('isola falhas por board: status de erro, JSON inesperado e exceção de rede', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/down')) return jsonResponse({ ok: false }, 404);
      if (url.includes('/weird')) return jsonResponse({ not: 'an array' });
      if (url.includes('/boom')) throw new Error('ECONNRESET');
      return jsonResponse([{ id: 'ok', text: 'Node Dev', hostedUrl: 'https://jobs.lever.co/good/ok' }]);
    });
    const collector = new LeverCollector(fakeConfig({ LEVER_COMPANIES: ['down', 'weird', 'boom', 'good'] }));
    const jobs = await collector.collect(['node']);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ source: 'lever', company: 'good', externalId: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('limita a concorrência a 4 boards simultâneos', async () => {
    let inFlight = 0;
    let peak = 0;
    fetchMock.mockImplementation(async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return jsonResponse({ jobs: [] });
    });
    const boards = Array.from({ length: 10 }, (_, i) => `b${i}`);
    await new AshbyCollector(fakeConfig({ ASHBY_BOARDS: boards })).collect(['node']);
    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(peak).toBe(4);
  });

  it('codifica o slug na URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ jobs: [] }));
    await new AshbyCollector(fakeConfig({ ASHBY_BOARDS: ['a b'] })).collect(['x']);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.ashbyhq.com/posting-api/job-board/a%20b?includeCompensation=true',
    );
  });
});
