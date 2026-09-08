import { jobFingerprint, normalizeText } from './fingerprint';

describe('normalizeText', () => {
  it('remove acentos, caixa e pontuação', () => {
    expect(normalizeText('  Desenvolvedor(a) Sênior — Node.js! ')).toBe('desenvolvedor a senior node js');
  });
});

describe('jobFingerprint', () => {
  it('gera o mesmo hash para variações do mesmo título/empresa', () => {
    const a = jobFingerprint('Desenvolvedor Sênior Node.js', 'ACME Ltda.');
    const b = jobFingerprint('desenvolvedor senior node js', 'acme ltda');
    expect(a).toBe(b);
  });

  it('gera hashes diferentes para vagas diferentes', () => {
    expect(jobFingerprint('Dev Backend', 'ACME')).not.toBe(jobFingerprint('Dev Frontend', 'ACME'));
  });
});
