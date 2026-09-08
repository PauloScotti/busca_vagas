# Busca Vagas

Coletor e API de vagas compatíveis com stack/experiência. NestJS 11 + Prisma 7 (driver adapter pg) + zod 4 + Swagger/Scalar.

## Setup
```bash
cp .env.example .env   # ajuste DATABASE_URL
npm install            # roda prisma generate via postinstall
npm run prisma:migrate
npm run start:dev
```

- Frontend: `GET /` (HTML/CSS/JS simples em `public/`, sem build — abas de Vagas, Matches, Perfil e Digest)
- Swagger: `GET /docs` · Scalar: `GET /reference`
- Coleta manual: `POST /jobs/collect` (body opcional `{ "searchTerms": ["nestjs"] }`)
- Listagem: `GET /jobs?q=node&remote=true&page=1`
- Pipeline diário via `PIPELINE_CRON` (padrão 7h): coleta → matching → digest no Telegram

## Fontes
- Remotive (API pública oficial)
- Gupy (endpoint público não documentado — valide o shape do payload na primeira coleta; o coletor descarta itens que não passem no schema zod em vez de quebrar)

## Matching
1. `PUT /profile` — skills, anos de experiência, senioridade, preferências
2. `POST /matches/run` — pré-filtro local por interseção de skills (grátis) + scoring 0-100 via LLM só das candidatas (batches de 8, teto de 32/run)
3. `GET /matches?minScore=70` — ranking com a vaga incluída

Requer `ANTHROPIC_API_KEY` no `.env`. Sem chave, coleta e listagem funcionam; só o scoring falha com 503.

## Digest Telegram
Crie um bot com o @BotFather, pegue o token e o chat_id (mande uma mensagem ao bot e leia `getUpdates`). Configure `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`. Só matches novos (nunca notificados) com score >= `DIGEST_MIN_SCORE` entram, limitados a `DIGEST_LIMIT`. Teste manual: `POST /digest/send`.

## Próximos passos
1. Coletores Greenhouse/Lever/Ashby por lista de empresas
