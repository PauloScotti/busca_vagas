import { NormalizedJobSchema } from './job.types.js';

const valid = {
  source: 'greenhouse',
  externalId: '1',
  title: 'Dev',
  company: 'X',
  location: null,
  remote: false,
  url: 'https://example.com/1',
  description: '',
  tags: [],
  salaryMin: null,
  salaryMax: null,
  publishedAt: null,
};

describe('NormalizedJobSchema.url', () => {
  it('aceita http e https', () => {
    expect(NormalizedJobSchema.safeParse(valid).success).toBe(true);
    expect(NormalizedJobSchema.safeParse({ ...valid, url: 'http://example.com' }).success).toBe(true);
  });

  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd'])(
    'rejeita protocolo perigoso: %s',
    (url) => {
      expect(NormalizedJobSchema.safeParse({ ...valid, url }).success).toBe(false);
    },
  );
});
