# Busca Vagas

Coletor e API de vagas compatíveis com stack/experiência. NestJS 12 + Prisma 7 (driver adapter pg) + zod 4 + Swagger/Scalar.

## Setup
Requer Node.js 24.9+. O projeto é ESM (`"type": "module"`): imports relativos levam extensão `.js` e os testes rodam no Jest com `--experimental-vm-modules` (já embutido nos scripts `test`/`test:e2e`); nos specs, importe `jest` de `@jest/globals`.

```bash
cp .env.example .env   # ajuste DATABASE_URL
npm install            # roda prisma generate via postinstall
npm run prisma:migrate
npm run start:dev
```

- Swagger: `GET /docs` · Scalar: `GET /reference`
- Coleta manual: `POST /jobs/collect` (body opcional `{ "searchTerms": ["nestjs"] }`)
- Listagem: `GET /jobs?q=node&remote=true&page=1`
- Pipeline diário via `PIPELINE_CRON` (padrão 7h): coleta → matching → digest no Telegram

## Frontend (`web/`)
Vite 8 + React 19 + TypeScript 7, com TanStack Query 5 (dados) e React Router 8 (abas Vagas, Matches, Perfil e Digest).

```bash
cd web
npm install
npm run dev   # http://localhost:5173
```

Em dev, o Vite repassa `/api/*` para a API em `http://localhost:3000` (mude com `API_URL` em `web/.env.local`), então não precisa de CORS. Para apontar o build para outra URL, defina `VITE_API_URL`.

## Fontes
- Remotive (API pública oficial)
- Gupy (endpoint público não documentado — valide o shape do payload na primeira coleta; o coletor descarta itens que não passem no schema zod em vez de quebrar)
- Greenhouse, Lever e Ashby (APIs públicas de job board, por empresa). Configure os slugs separados por vírgula:
  - `GREENHOUSE_BOARDS` — o `<slug>` de `boards.greenhouse.io/<slug>` (ex.: `gitlab,nubank`)
  - `LEVER_COMPANIES` — o `<slug>` de `jobs.lever.co/<slug>` (ex.: `spotify`)
  - `ASHBY_BOARDS` — o `<slug>` de `jobs.ashbyhq.com/<slug>` (ex.: `ramp,linear`)

  Esses endpoints não têm busca: o board inteiro é baixado (até 4 em paralelo, timeout de 15s) e só ficam as vagas cujo título/descrição contém algum termo de `SEARCH_TERMS` como palavra inteira. Board inexistente (404) é só logado. Lever e Ashby não informam o nome da empresa, então o slug é usado. Salário só é preenchido quando a faixa é anual (sem moeda — o schema ainda não guarda).

## Matching
1. `PUT /profile` — skills, anos de experiência, senioridade, preferências
2. `POST /matches/run` — pré-filtro local por interseção de skills (grátis) + scoring 0-100 via LLM só das candidatas (batches de 8, teto de 32/run)
3. `GET /matches?minScore=70` — ranking com a vaga incluída

Requer `ANTHROPIC_API_KEY` no `.env`. Sem chave, coleta e listagem funcionam; só o scoring falha com 503.

## Digest Telegram
Crie um bot com o @BotFather, pegue o token e o chat_id (mande uma mensagem ao bot e leia `getUpdates`). Configure `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`. Só matches novos (nunca notificados) com score >= `DIGEST_MIN_SCORE` entram, limitados a `DIGEST_LIMIT`. Teste manual: `POST /digest/send`.

## Testes
```bash
npm test           # unitários (src/**/*.spec.ts)
npm run test:e2e   # e2e (test/*.e2e-spec.ts) — sobe o JobsModule com Prisma em memória e APIs externas simuladas
npm run lint       # ESLint 10 + typescript-eslint (regras com checagem de tipos) em src/ e test/
```
