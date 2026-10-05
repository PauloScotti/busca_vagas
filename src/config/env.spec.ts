import { envSchema } from './env.js';

const base = { DATABASE_URL: 'postgresql://u:p@localhost:5432/db' };

describe('envSchema — listas de boards', () => {
  it('padrão é lista vazia', () => {
    const env = envSchema.parse(base);
    expect(env.GREENHOUSE_BOARDS).toEqual([]);
    expect(env.LEVER_COMPANIES).toEqual([]);
    expect(env.ASHBY_BOARDS).toEqual([]);
  });

  it('separa por vírgula, apara e remove duplicados', () => {
    const env = envSchema.parse({ ...base, GREENHOUSE_BOARDS: ' gitlab, nubank ,,gitlab', ASHBY_BOARDS: 'Ramp.io' });
    expect(env.GREENHOUSE_BOARDS).toEqual(['gitlab', 'nubank']);
    expect(env.ASHBY_BOARDS).toEqual(['Ramp.io']);
  });

  it.each(['..', '../admin', 'a/b', 'a?x=1', 'a#b', 'com espaço', '-x', 'a'.repeat(101)])(
    'rejeita slug malicioso ou inválido: %s',
    (slug) => {
      expect(() => envSchema.parse({ ...base, LEVER_COMPANIES: slug })).toThrow();
    },
  );
});
