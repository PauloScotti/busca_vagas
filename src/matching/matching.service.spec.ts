import { jest } from '@jest/globals';
import { MatchingService } from './matching.service.js';

type AsyncFn = (...args: any[]) => Promise<any>;

const profile = {
  id: 'p1',
  skills: ['nestjs', 'react'],
  yearsExperience: 8,
  seniority: 'senior',
  preferences: 'remoto',
};

const makeJob = (id: string, title: string) => ({
  id,
  title,
  company: 'ACME',
  location: null,
  remote: true,
  description: '',
  tags: [],
});

describe('MatchingService.run', () => {
  const createMany = jest.fn<AsyncFn>().mockResolvedValue({ count: 1 });
  const prisma = {
    profile: { findFirst: jest.fn<AsyncFn>().mockResolvedValue(profile) },
    job: {
      findMany: jest.fn<AsyncFn>().mockResolvedValue([
        makeJob('j1', 'Vaga NestJS'),
        makeJob('j2', 'Vaga Cobol'),
      ]),
    },
    match: { createMany },
  } as never;

  beforeEach(() => createMany.mockClear());

  it('manda pro LLM só o que passa no pré-filtro e persiste ambos os grupos', async () => {
    const llm = {
      complete: jest.fn<AsyncFn>().mockResolvedValue('[{"jobId":"j1","score":90,"reasons":["stack bate"]}]'),
    };
    const service = new MatchingService(prisma, llm);
    const result = await service.run();

    expect(result).toEqual({ evaluated: 2, scoredByLlm: 1, discardedByPrefilter: 1 });
    expect(llm.complete).toHaveBeenCalledTimes(1);
    expect(llm.complete.mock.calls[0][0]).toContain('j1');
    expect(llm.complete.mock.calls[0][0]).not.toContain('Vaga Cobol');
    const persisted = createMany.mock.calls.flatMap((c) => c[0].data);
    expect(persisted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ jobId: 'j2', score: 0 }),
        expect.objectContaining({ jobId: 'j1', score: 90 }),
      ]),
    );
  });

  it('ignora scores do LLM para jobIds fora do batch (proteção contra alucinação)', async () => {
    const llm = {
      complete: jest.fn<AsyncFn>().mockResolvedValue('[{"jobId":"inventado","score":99,"reasons":[]}]'),
    };
    const service = new MatchingService(prisma, llm);
    const result = await service.run();
    expect(result.scoredByLlm).toBe(0);
  });

  it('falha com 400 se não há perfil cadastrado', async () => {
    const noProfile = { profile: { findFirst: jest.fn<AsyncFn>().mockResolvedValue(null) } } as never;
    const service = new MatchingService(noProfile, { complete: jest.fn<AsyncFn>() });
    await expect(service.run()).rejects.toThrow('Cadastre um perfil');
  });
});
