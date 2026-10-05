import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env.js';

export function fakeConfig(values: Partial<Env>): ConfigService<Env, true> {
  return { getOrThrow: (key: keyof Env) => values[key] } as unknown as ConfigService<Env, true>;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
