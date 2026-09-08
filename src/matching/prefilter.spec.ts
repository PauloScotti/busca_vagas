import { prefilterScore } from './prefilter';

const job = (over: Partial<{ title: string; description: string; tags: string[] }> = {}) => ({
  title: 'Desenvolvedor Backend Node.js',
  description: 'Trabalhamos com NestJS, PostgreSQL e AWS.',
  tags: ['node'],
  ...over,
});

describe('prefilterScore', () => {
  it('pontua proporcional à interseção de skills', () => {
    expect(prefilterScore(['nestjs', 'postgresql', 'aws', 'kotlin'], job())).toBe(75);
  });

  it('casa skills com acento e caixa diferentes', () => {
    expect(prefilterScore(['Node.js'], job({ title: 'DEV NODE JS SÊNIOR', description: '', tags: [] }))).toBe(100);
  });

  it('retorna 0 sem interseção ou sem skills', () => {
    expect(prefilterScore(['kotlin'], job())).toBe(0);
    expect(prefilterScore([], job())).toBe(0);
  });
});
