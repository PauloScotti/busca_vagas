import { jest } from '@jest/globals';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import { validateEnv } from '../src/config/env.js';
import { JobsModule } from '../src/jobs/jobs.module.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { requestUrl } from '../src/jobs/collectors/test-helpers.js';

type StoredJob = Record<string, unknown> & { source: string; externalId: string };

/** Prisma em memória: só o que o fluxo de coleta usa. */
class InMemoryPrisma {
  readonly jobs = new Map<string, StoredJob>();
  job = {
    upsert: (args: {
      where: { source_externalId: { source: string; externalId: string } };
      create: StoredJob;
      update: Partial<StoredJob>;
    }) => {
      const { source, externalId } = args.where.source_externalId;
      const key = `${source}:${externalId}`;
      const current = this.jobs.get(key);
      const next = current ? { ...current, ...args.update } : args.create;
      this.jobs.set(key, next);
      return Promise.resolve(next);
    },
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const ATS_RESPONSES: Record<string, () => Response> = {
  'https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true': () =>
    json({
      jobs: [
        {
          id: 101,
          title: 'Senior NestJS Engineer',
          absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/101',
          company_name: 'ACME',
          location: { name: 'Remote, Brazil' },
          content: '&lt;p&gt;Node &amp;amp; Postgres&lt;/p&gt;',
          first_published: '2026-10-01T10:00:00Z',
        },
        {
          id: 102,
          title: 'Account Executive',
          absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/102',
          content: 'sales',
        },
        { id: 103, title: 'Evil', absolute_url: 'javascript:alert(1)', content: 'nestjs' },
      ],
    }),
  'https://api.lever.co/v0/postings/globex?mode=json': () =>
    json([
      {
        id: 'lv-1',
        text: 'Frontend Engineer',
        hostedUrl: 'https://jobs.lever.co/globex/lv-1',
        categories: { location: 'Lisbon' },
        workplaceType: 'remote',
        createdAt: 1790000000000,
        descriptionPlain: 'React and TypeScript',
      },
    ]),
  'https://api.lever.co/v0/postings/offline?mode=json': () => json({ ok: false, error: 'Document not found' }, 404),
  'https://api.ashbyhq.com/posting-api/job-board/initech?includeCompensation=true': () =>
    json({
      apiVersion: '1',
      jobs: [
        {
          id: 'ab-1',
          title: 'Backend Engineer (Node)',
          jobUrl: 'https://jobs.ashbyhq.com/initech/ab-1',
          location: 'São Paulo',
          isRemote: false,
          isListed: true,
          publishedAt: '2026-09-30T12:00:00Z',
          descriptionPlain: 'Node',
          compensation: {
            summaryComponents: [{ compensationType: 'Salary', interval: '1 YEAR', minValue: 200000, maxValue: 260000 }],
          },
        },
        { id: 'ab-2', title: 'Hidden Node role', jobUrl: 'https://jobs.ashbyhq.com/initech/ab-2', isListed: false },
      ],
    }),
};

describe('POST /jobs/collect com Greenhouse/Lever/Ashby (e2e)', () => {
  const realFetch = global.fetch;
  const prisma = new InMemoryPrisma();
  let app: INestApplication;
  let baseUrl: string;
  const atsCalls: string[] = [];

  beforeAll(async () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgresql://u:p@localhost:5432/e2e',
      SEARCH_TERMS: 'nestjs,react,node',
      GREENHOUSE_BOARDS: 'acme',
      LEVER_COMPANIES: 'globex,offline',
      ASHBY_BOARDS: 'initech',
    });

    jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = requestUrl(input);
      if (url.startsWith(baseUrl)) return realFetch(input, init);
      atsCalls.push(url);
      if (url in ATS_RESPONSES) return ATS_RESPONSES[url]();
      // Remotive/Gupy e qualquer outra fonte: vazio, para o teste não depender da rede.
      return json(url.includes('remotive') ? { jobs: [] } : { data: [] });
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate: validateEnv }),
        PrismaModule,
        JobsModule,
      ],
      providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    Logger.overrideLogger(false);
    await app.listen(0, '127.0.0.1');
    baseUrl = (await app.getUrl()).replace('[::1]', '127.0.0.1');
  });

  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  it('coleta os boards configurados, filtra por termo e persiste normalizado', async () => {
    const res = await fetch(`${baseUrl}/jobs/collect`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ received: 3, persisted: 3, skippedDuplicates: 0 });

    expect(atsCalls).toEqual(expect.arrayContaining(Object.keys(ATS_RESPONSES)));
    expect([...prisma.jobs.keys()].sort()).toEqual(['ashby:ab-1', 'greenhouse:101', 'lever:lv-1']);

    expect(prisma.jobs.get('greenhouse:101')).toMatchObject({
      company: 'ACME',
      remote: true,
      description: 'Node & Postgres',
      url: 'https://job-boards.greenhouse.io/acme/jobs/101',
    });
    expect(prisma.jobs.get('lever:lv-1')).toMatchObject({ company: 'globex', remote: true });
    expect(prisma.jobs.get('ashby:ab-1')).toMatchObject({
      company: 'initech',
      remote: false,
      salaryMin: 200000,
      salaryMax: 260000,
    });
  });

  it('respeita searchTerms do corpo da requisição', async () => {
    prisma.jobs.clear();
    const res = await fetch(`${baseUrl}/jobs/collect`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: ['react'] }),
    });
    expect(res.status).toBe(202);
    expect([...prisma.jobs.keys()]).toEqual(['lever:lv-1']);
  });

  it('rejeita searchTerms inválidos com 400', async () => {
    const res = await fetch(`${baseUrl}/jobs/collect`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: [] }),
    });
    expect(res.status).toBe(400);
  });
});
