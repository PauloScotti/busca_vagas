import { decodeHtmlEntities, htmlToText, isRemoteLocation, matchesAnyTerm } from './text';

describe('decodeHtmlEntities', () => {
  it('decodifica entidades nomeadas e numéricas', () => {
    expect(decodeHtmlEntities('a &amp; b &lt;p&gt; &#39;x&#39; &#x2014;&nbsp;!')).toBe("a & b <p> 'x' — !");
  });

  it('mantém entidades desconhecidas ou inválidas', () => {
    expect(decodeHtmlEntities('&foo; &#0; &#x110000;')).toBe('&foo; &#0; &#x110000;');
  });
});

describe('htmlToText', () => {
  it('converte HTML escapado do Greenhouse em texto', () => {
    const html = '&lt;div&gt;&lt;p&gt;Node &amp;amp; NestJS&lt;/p&gt;&lt;ul&gt;&lt;li&gt;React&lt;/li&gt;&lt;/ul&gt;&lt;/div&gt;';
    expect(htmlToText(html)).toBe('Node & NestJS\nReact');
  });

  it('remove script e style com conteúdo', () => {
    expect(htmlToText('<p>ok</p><script>alert(1)</script><style>p{}</style>')).toBe('ok');
  });
});

describe('matchesAnyTerm', () => {
  it('casa palavra inteira ignorando caixa e acento', () => {
    expect(matchesAnyTerm(['Senior NestJS Engineer'], ['nestjs'])).toBe(true);
    expect(matchesAnyTerm(['Desenvolvedor Sênior'], ['senior'])).toBe(true);
    expect(matchesAnyTerm(['Backend', 'uses Node.js daily'], ['node'])).toBe(true);
  });

  it('não casa substring de outra palavra', () => {
    expect(matchesAnyTerm(['Reactive systems'], ['react'])).toBe(false);
  });

  it('ignora termos vazios após normalização', () => {
    expect(matchesAnyTerm(['qualquer coisa'], ['  ', '#'])).toBe(false);
  });
});

describe('isRemoteLocation', () => {
  it.each([
    ['Remote, France', true],
    ['Remoto - Brasil', true],
    ['Anywhere', true],
    ['São Paulo, SP', false],
    [null, false],
  ])('%s → %s', (location, expected) => {
    expect(isRemoteLocation(location)).toBe(expected);
  });
});
