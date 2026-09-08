import { parseLlmScores } from './score-parser';

describe('parseLlmScores', () => {
  it('parseia array JSON puro', () => {
    const raw = '[{"jobId":"a1","score":85,"reasons":["stack idêntica"]}]';
    expect(parseLlmScores(raw)).toEqual([{ jobId: 'a1', score: 85, reasons: ['stack idêntica'] }]);
  });

  it('remove cercas de markdown antes de parsear', () => {
    const raw = '```json\n[{"jobId":"a1","score":40,"reasons":[]}]\n```';
    expect(parseLlmScores(raw)).toHaveLength(1);
  });

  it('descarta itens inválidos e mantém os válidos', () => {
    const raw = '[{"jobId":"a1","score":85,"reasons":[]},{"jobId":"a2","score":150,"reasons":[]},{"foo":1}]';
    const result = parseLlmScores(raw);
    expect(result).toHaveLength(1);
    expect(result[0].jobId).toBe('a1');
  });

  it('retorna vazio para não-JSON ou não-array sem lançar', () => {
    expect(parseLlmScores('desculpe, não posso ajudar')).toEqual([]);
    expect(parseLlmScores('{"jobId":"a1"}')).toEqual([]);
  });
});
